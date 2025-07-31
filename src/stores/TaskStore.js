import { makeAutoObservable, runInAction } from 'mobx';
import { getTaskList, deleteTask as apiDeleteTask, updateTask as apiUpdateTask, createTask as apiCreateTask, reorderTasksAndStatus as apiReorderTasksAndStatus } from '../services/api';
import _ from 'lodash';
import { Toast } from 'antd-mobile';

const SEARCH_DEBOUNCE_DELAY = 500;

class TaskStore {
  taskList = []; 
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
  this.moveTask = this.moveTask.bind(this);
  this.saveTaskPosition = this.saveTaskPosition.bind(this);
}
sortTaskList = () => {
  this.taskList.sort((a, b) => {
    if (a.status !== b.status) {
      return a.status - b.status; // 首先按状态升序
    }
    
    // 在同一状态下，按优先级降序（高优先级在前）
    if (a.priority !== b.priority) {
      return b.priority - a.priority; // 3(高) > 2(中) > 1(低)
    }
    
    // 在同一状态和优先级下，按 order_index 升序
    const orderA = a.order_index === null || a.order_index === undefined ? Infinity : a.order_index;
    const orderB = b.order_index === null || b.order_index === undefined ? Infinity : b.order_index;
    return orderA - orderB;
  });
};

  // 核心的获取任务列表函数
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

  // 按状态加载任务（无限滚动）
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

  // 加载更多任务
  loadMoreTasks = () => {
    if (!this.hasMore || this.isLoading) { return; }
    this._fetchTasks();
  };

  // 按状态加载更多任务
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

  moveTask = (draggedId, targetId, newStatus, isBefore) => {
    const draggedTask = this.taskList.find(t => t.task_id === draggedId);
    if (!draggedTask) return;

    const oldStatus = draggedTask.status;

    // 仅执行本地乐观更新
    let newIndexForAPI = 0;
    runInAction(() => {
      // 从当前列表中移除被拖拽的任务
      this.taskList = this.taskList.filter(t => t.task_id !== draggedId);

      // 获取新列中所有任务
      const targetColumnTasks = this.taskList.filter(t => t.status === newStatus);

      let insertIndexInColumn = targetColumnTasks.length;
      if (targetId !== null) {
        const targetIndex = targetColumnTasks.findIndex(t => t.task_id === targetId);
        if (targetIndex !== -1) {
          insertIndexInColumn = isBefore ? targetIndex : targetIndex + 1;
        }
      }

      // 更新被拖拽任务的状态
      const updatedDraggedTask = { ...draggedTask, status: newStatus };

      // 将更新后的任务插入到目标列的正确位置
      targetColumnTasks.splice(insertIndexInColumn, 0, updatedDraggedTask);

      // 重新为所有受影响的任务赋予连续的 order_index
      targetColumnTasks.forEach((t, idx) => { t.order_index = idx; });
      if (oldStatus !== newStatus) {
        const oldColumnTasks = this.taskList.filter(t => t.status === oldStatus);
        oldColumnTasks.forEach((t, idx) => { t.order_index = idx; });
      }

      // 重构整个任务列表，并进行全局排序
      this.taskList = [
        ...this.taskList.filter(t => t.status !== oldStatus && t.status !== newStatus),
        ...(oldStatus !== newStatus ? this.taskList.filter(t => t.status === oldStatus) : []),
        ...targetColumnTasks
      ];
      this.sortTaskList();
    });
  };

  saveTaskPosition = async (taskId, newStatus, newIndex) => {
    try {
      await apiReorderTasksAndStatus({
        taskId: taskId,
        newStatus: newStatus,
        newIndex: newIndex
      });
      Toast.show({ content: '任务已更新', icon: 'success' });
    } catch (error) {
      console.error('任务重新排序失败:', error);
      Toast.show({ content: '任务更新失败，已回滚', icon: 'fail' });
      // 回滚：如果API调用失败，恢复到原始状态
      runInAction(() => {
        this.initialLoad();
      });
      throw error;
    }
  };

  // 添加任务到本地列表
  _addTaskToList = (newTask) => {
    runInAction(() => {
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
      this.sortTaskList();
    });
  };

  // 创建新任务
  createTask = async (taskData) => {
    try {
      const res = await apiCreateTask(taskData);
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
    } catch (error) {
      console.error('任务删除失败:', error);
      throw error;
    }
  };
}

export default new TaskStore();
