// src/stores/TaskStore.js
// 引入 makeAutoObservable 和 runInAction (用于在异步操作中修改状态)
import { makeAutoObservable, runInAction } from 'mobx';
// 引入新的 reorderTasksAndStatus API
import { getTaskList, deleteTask as apiDeleteTask, updateTask as apiUpdateTask, createTask as apiCreateTask, reorderTasksAndStatus as apiReorderTasksAndStatus } from '../services/api';
import _ from 'lodash';
import { Toast } from 'antd-mobile';

// 定义不同的防抖延迟
const SEARCH_DEBOUNCE_DELAY = 500;
const INFINITE_SCROLL_DEBOUNCE_DELAY = 200;

class TaskStore {
  taskList = []; // 任务数组，现在会包含 order_index
  isLoading = false;
  loadingByStatus = { 0: false, 1: false, 2: false };
  searchKeyword = '';
  page = 1;
  pageByStatus = { 0: 1, 1: 1, 2: 1 };
  hasMore = true;
  hasMoreByStatus = { 0: true, 1: true, 2: true };

  constructor() {
    makeAutoObservable(this);
    this._fetchTasks = this._fetchTasks.bind(this);
    this.debouncedSearchFetch = _.debounce(this._fetchTasks, SEARCH_DEBOUNCE_DELAY);
    this.moveTask = this.moveTask.bind(this); // 绑定 moveTask
  }

  // 辅助函数：按状态和 order_index 对任务列表进行排序
  sortTaskList = () => {
    this.taskList.sort((a, b) => {
      if (a.status !== b.status) {
        return a.status - b.status; // 按状态升序
      }
      // 在同一状态下，按 order_index 升序
      // 处理 order_index 可能为 null/undefined 的情况，将其排在最后
      const orderA = a.order_index === null || a.order_index === undefined ? Infinity : a.order_index;
      const orderB = b.order_index === null || b.order_index === undefined ? Infinity : b.order_index;
      return orderA - orderB;
    });
  };

  // 核心的获取任务列表函数 (用于全局搜索或初始加载)
  _fetchTasks = async () => {
    if (this.isLoading) {
      console.log('Already loading, aborting new fetch call.');
      return;
    }
    // 使用 runInAction 确保 MobX 状态在异步操作中同步更新
    runInAction(() => { this.isLoading = true; });

    const payload = { page: this.page };
    if (this.searchKeyword !== '') { payload.search = this.searchKeyword; }

    try {
      const res = await getTaskList(payload);
      runInAction(() => {
        this.taskList = res.tasks; // 替换整个列表
        this.sortTaskList(); // 确保列表按照 order_index 排序
        this.hasMore = this.taskList.length < res.total;
        this.page++;
        // 重置每列的分页状态
        this.pageByStatus = { 0: 1, 1: 1, 2: 1 };
        this.hasMoreByStatus = { 0: true, 1: true, 2: true };
      });
    } catch (err) {
      console.error('getTaskList error:', err.response?.data || err.message || err);
      runInAction(() => { this.hasMore = false; });
    } finally {
      runInAction(() => { this.isLoading = false; });
    }
  };

  // 按状态加载任务 (用于无限滚动)
  _fetchTasksByStatus = async (status) => {
    if (this.loadingByStatus[status]) { return; }

    runInAction(() => { this.loadingByStatus[status] = true; });

    const payload = { page: this.pageByStatus[status], status: status };
    if (this.searchKeyword !== '') { payload.search = this.searchKeyword; }

    try {
      const res = await getTaskList(payload);
      runInAction(() => {
        // 过滤掉已存在的任务，避免重复添加
        const existingTaskIds = new Set(this.taskList.map(t => t.task_id));
        const newTasks = res.tasks.filter(newTask => !existingTaskIds.has(newTask.task_id));
        this.taskList.push(...newTasks);
        this.sortTaskList(); // 重新排序整个列表

        this.hasMoreByStatus[status] = this.taskList.filter(t => t.status === status).length < res.total;
        this.pageByStatus[status]++;
      });
    } catch (err) {
      console.error(`getTaskList for status ${status} error:`, err);
      runInAction(() => { this.hasMoreByStatus[status] = false; });
    } finally {
      runInAction(() => { this.loadingByStatus[status] = false; });
    }
  };

  // 初始化加载
  initialLoad = () => {
    runInAction(() => {
      this.taskList = [];
      this.page = 1;
      this.hasMore = true;
      this.pageByStatus = { 0: 1, 1: 1, 2: 1 };
      this.hasMoreByStatus = { 0: true, 1: true, 2: true };
      this.searchKeyword = '';
    });
    this._fetchTasks();
  };

  // 加载更多任务 (全局)
  loadMoreTasks = () => {
    if (!this.hasMore || this.isLoading) { return; }
    this._fetchTasks();
  };

  // 按状态加载更多任务 (针对每个列)
  loadMoreTasksByStatus = (status) => {
    if (!this.hasMoreByStatus[status] || this.loadingByStatus[status]) { return; }
    this._fetchTasksByStatus(status);
  };

  // 设置搜索关键词
  setSearchKeyword = (keyword) => {
    if (this.searchKeyword !== keyword) {
      runInAction(() => {
        this.searchKeyword = keyword;
        this.taskList = [];
        this.page = 1;
        this.hasMore = true;
        this.pageByStatus = { 0: 1, 1: 1, 2: 1 };
        this.hasMoreByStatus = { 0: true, 1: true, 2: true };
      });
      this.debouncedSearchFetch();
    }
  };

  // =============== DND 核心逻辑：移动任务 (乐观更新 + API 调用) ===============
  // draggedId: 被拖拽任务的 ID
  // targetId: 目标任务的 ID (如果拖到空列或末尾，则为 null)
  // newStatus: 任务新的状态 (目标列的状态)
  // isBefore: 如果 targetId 不为 null，表示插入到目标任务之前 (true) 还是之后 (false)
  moveTask = async (draggedId, targetId, newStatus, isBefore) => {
    const draggedTask = this.taskList.find(t => t.task_id === draggedId);
    if (!draggedTask) return;

    const oldStatus = draggedTask.status; // 记录旧状态以便回滚

    // 1. 乐观更新：在本地立即更新 UI 状态
    let newIndexForAPI = 0; // 用于发送给后端的最终 order_index
    runInAction(() => {
      // 从当前列表中移除被拖拽的任务
      this.taskList = this.taskList.filter(t => t.task_id !== draggedId);

      // 获取新列中所有任务 (此时不包含被拖拽的任务)
      const targetColumnTasks = this.taskList.filter(t => t.status === newStatus);

      let insertIndexInColumn = targetColumnTasks.length; // 默认插入到列尾
      if (targetId !== null) {
        // 如果有目标任务，找到它的索引
        const targetIndex = targetColumnTasks.findIndex(t => t.task_id === targetId);
        if (targetIndex !== -1) {
          // 根据 isBefore 决定插入到目标任务之前或之后
          insertIndexInColumn = isBefore ? targetIndex : targetIndex + 1;
        }
      }

      // 更新被拖拽任务的状态
      const updatedDraggedTask = { ...draggedTask, status: newStatus };

      // 将更新后的任务插入到目标列的正确位置
      targetColumnTasks.splice(insertIndexInColumn, 0, updatedDraggedTask);

      // 重新为所有受影响的任务（即旧列和新列中的任务）赋予连续的 order_index
      // 遍历目标列，并赋予新的 order_index
      targetColumnTasks.forEach((t, idx) => { t.order_index = idx; });
      // 如果发生跨列移动，也要重新排序旧列
      if (oldStatus !== newStatus) {
        const oldColumnTasks = this.taskList.filter(t => t.status === oldStatus);
        oldColumnTasks.forEach((t, idx) => { t.order_index = idx; });
      }

      // 重构整个任务列表，并进行全局排序
      this.taskList = [
        ...this.taskList.filter(t => t.status !== oldStatus && t.status !== newStatus), // 其他未受影响的列
        ...(oldStatus !== newStatus ? this.taskList.filter(t => t.status === oldStatus) : []), // 旧列（如果状态改变）
        ...targetColumnTasks // 新列 (已重新排序)
      ];
      this.sortTaskList(); // 确保整体列表顺序正确

      // 获取被拖拽任务在乐观更新后的最终索引，用于传递给后端
      const finalDraggedTask = this.taskList.find(t => t.task_id === draggedId);
      newIndexForAPI = finalDraggedTask ? finalDraggedTask.order_index : 0;
    });

    // 2. 调用 API 异步持久化更改
    try {
      await apiReorderTasksAndStatus({
        taskId: draggedId,
        newStatus: newStatus,
        newIndex: newIndexForAPI
      });
      Toast.show({ content: '任务已更新', icon: 'success' });
      // 成功后，由于已乐观更新，通常无需额外操作。
      // 如果后端排序逻辑复杂，可能需要重新获取数据以确保一致性。
    } catch (error) {
      console.error('任务重新排序失败:', error);
      Toast.show({ content: '任务更新失败，已回滚', icon: 'fail' });
      // 3. 回滚：如果 API 调用失败，恢复到原始状态。
      // 最简单的回滚方式是重新加载数据。
      runInAction(() => {
        this.initialLoad();
      });
      throw error;
    }
  };


  // CRUD 方法 (现在会处理 order_index 的维护和 sortTaskList 调用)

  // 添加任务到本地列表
  _addTaskToList = (newTask) => {
    runInAction(() => {
      // 确定新任务的 order_index，使其排在同状态列的末尾
      const tasksInNewColumn = this.taskList.filter(t => t.status === newTask.status);
      const maxOrder = tasksInNewColumn.reduce((max, t) => Math.max(max, t.order_index || 0), -1); // 初始值-1确保第一个是0
      newTask.order_index = maxOrder + 1;

      this.taskList.push(newTask);
      this.sortTaskList();
    });
  };

  // 更新本地列表中的任务
  _updateTaskInList = (updatedTask) => {
    runInAction(() => {
      this.taskList = this.taskList.map(task =>
        task.task_id === updatedTask.task_id ? { ...task, ...updatedTask } : task
      );
      this.sortTaskList();
    });
  };

  // 从本地列表中移除任务
  _removeTaskFromList = (taskId) => {
    runInAction(() => {
      this.taskList = this.taskList.filter(task => task.task_id !== taskId);
      // 移除后需要重新排序以确保 order_index 连续，但后端已处理，这里仅本地排序
      this.sortTaskList();
    });
  };

  // 创建新任务
  createTask = async (taskData) => {
    try {
      const res = await apiCreateTask(taskData);
      // 接收后端返回的 order_index
      const newTask = { task_id: res.task_id, ...taskData, order_index: res.order_index };
      this._addTaskToList(newTask);
      Toast.show({ content: '任务创建成功', icon: 'success' });
      return res;
    } catch (error) {
      console.error('任务创建失败:', error);
      throw error;
    }
  };

  // 更新任务
  updateTask = async (taskData) => {
    try {
      await apiUpdateTask(taskData);
      this._updateTaskInList(taskData);
      Toast.show({ content: '任务更新成功', icon: 'success' });
      return true;
    } catch (error) {
      console.error('任务更新失败:', error);
      throw error;
    }
  };

  // 删除任务
  deleteTask = async (taskId) => {
    try {
      await apiDeleteTask({ task_id: taskId });
      this._removeTaskFromList(taskId);
      Toast.show({ content: '任务删除成功', icon: 'success' });
      // 删除后，需要重新排序被删除任务所在列的 order_index，让后端重新处理
      // 这里可以触发一次该列的重新加载，或者调用后端重新排序 API
      // 简单起见，可以触发 initialLoad 或 specific column reload
      // 比如：this.initialLoad() 或者 this._fetchTasksByStatus(oldStatus)
      // 但由于后端已经处理了，本地列表的 sortTaskList 应该够用。
    } catch (error) {
      console.error('任务删除失败:', error);
      throw error;
    }
  };
}

export default new TaskStore();
