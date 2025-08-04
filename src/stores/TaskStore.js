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
  this.sortType = 'priority'; // 默认排序类型
}

  sortTaskList = (sortType = 'priority') => {
    this.taskList.sort((a, b) => {
      // 首先按状态分组
      if (a.status !== b.status) {
        return a.status - b.status;
      }
      
      // 然后根据选择的排序类型排序
      switch (sortType) {
        case 'priority':
          // 优先级降序（高优先级在前）
          if (a.priority !== b.priority) {
            return b.priority - a.priority;
          }
          // 相同优先级按 order_index
          return (a.order_index ?? Infinity) - (b.order_index ?? Infinity);
          
        case 'createTime':
          // 创建时间降序（新创建的在前）
          return new Date(b.create_time) - new Date(a.create_time);
          
        case 'deadline':
          // 截止时间升序（即将到期的在前）
          // 无截止日期的任务放在最后
          if (!a.deadline && !b.deadline) return 0;
          if (!a.deadline) return 1;
          if (!b.deadline) return -1;
          return new Date(a.deadline) - new Date(b.deadline);
          
        default:
          // 默认按 order_index
          return (a.order_index ?? Infinity) - (b.order_index ?? Infinity);
      }
    });
  };

  // 添加新方法来设置排序类型
  setSortType = (sortType) => {
    runInAction(() => {
      this.sortType = sortType;
      this.sortTaskList(sortType);
    });
  };

  // 核心的获取任务列表函数
_fetchTasks = async () => {
  if (this.isLoading) {
    console.log('Already loading, aborting new fetch call.');
    return;
  }
  
  // 先设置loading状态
  runInAction(() => { 
    this.isLoading = true; 
  });

  const payload = { page: this.page };
  if (this.searchKeyword !== '') { payload.search = this.searchKeyword; }

  try {
    // 先获取数据
    const res = await getTaskList(payload);
    
    // 然后再使用res
    runInAction(() => {
      this.taskList = res.tasks;
      this.sortTaskList(this.sortType);
      this.hasMore = this.taskList.length < res.total;
      this.page++;
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

    runInAction(() => { 
      this.sortTaskList(this.sortType);
      this.loadingByStatus[status] = true; });

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
      this.sortTaskList(this.sortType);    });
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
      this.sortTaskList(this.sortType);
      this.taskList.push(newTask);
    });
  };

  // 更新本地列表中的任务
  _updateTaskInList = (updatedTask) => {
    runInAction(() => {
      this.taskList = this.taskList.map(task =>
        task.task_id === updatedTask.task_id ? { ...task, ...updatedTask } : task
      );
      this.sortTaskList(this.sortType);
    });
  };

  // 从本地列表中移除任务
  _removeTaskFromList = (taskId) => {
    runInAction(() => {
      this.taskList = this.taskList.filter(task => task.task_id !== taskId);
      this.sortTaskList(this.sortType);    
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
