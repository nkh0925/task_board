import { makeAutoObservable } from 'mobx';
import { getTaskList, deleteTask as apiDeleteTask, updateTask as apiUpdateTask, createTask as apiCreateTask, updateTaskStatus as apiUpdateStatus } from '../services/api';
import _ from 'lodash'; // for debounce
import { Toast } from 'antd-mobile'; // 引入 Toast 用于提示用户

// 定义不同的防抖延迟
const SEARCH_DEBOUNCE_DELAY = 500; // 搜索输入更长的防抖延迟
const INFINITE_SCROLL_DEBOUNCE_DELAY = 200; // 无限滚动更短的防抖延迟

class TaskStore {
  taskList = []; // 任务数组
  isLoading = false; // 全局加载状态
  loadingByStatus = { 0: false, 1: false, 2: false }; // 每列的加载状态
  searchKeyword = ''; // 搜索关键词
  page = 1; // 当前页码，用于加载下一页
  pageByStatus = { 0: 1, 1: 1, 2: 1 }; // 每列的页码
  hasMore = true; // 是否还有更多数据可加载
  hasMoreByStatus = { 0: true, 1: true, 2: true }; // 每列是否还有更多数据

  constructor() {
    makeAutoObservable(this);
    this._fetchTasks = this._fetchTasks.bind(this);
    this.debouncedSearchFetch = _.debounce(this._fetchTasks, SEARCH_DEBOUNCE_DELAY);
    this.debouncedInfiniteScrollFetch = _.debounce(this._fetchTasksByStatus, INFINITE_SCROLL_DEBOUNCE_DELAY);
  }

  // 核心的获取任务列表函数
  _fetchTasks = async () => {
    if (this.isLoading) {
      console.log('Already loading, aborting new fetch call.');
      return;
    }
    this.isLoading = true;

    const payload = {
      page: this.page
    };

    if (this.searchKeyword !== '') {
      payload.search = this.searchKeyword;
    }

    try {
      const res = await getTaskList(payload);
      this.taskList = res.tasks; // 替换整个列表
      this.hasMore = this.taskList.length < res.total;
      this.page++;
      
      // 重置每列的状态
      this.pageByStatus = { 0: 1, 1: 1, 2: 1 };
      this.hasMoreByStatus = { 0: true, 1: true, 2: true };
    } catch (err) {
      console.error('getTaskList error:', err.response?.data || err.message || err);
      this.hasMore = false;
    } finally {
      this.isLoading = false;
    }
  };
  
  // 按状态加载任务
  _fetchTasksByStatus = async (status) => {
    if (this.loadingByStatus[status]) {
      return;
    }
    
    this.loadingByStatus[status] = true;
    
    const payload = {
      page: this.pageByStatus[status],
      status: status
    };
    
    if (this.searchKeyword !== '') {
      payload.search = this.searchKeyword;
    }
    
    try {
      const res = await getTaskList(payload);
      
      // 将新加载的任务添加到现有列表中
      const newTasks = res.tasks.filter(newTask => 
        !this.taskList.some(existingTask => existingTask.task_id === newTask.task_id)
      );
      
      this.taskList.push(...newTasks);
      
      // 更新该状态列的分页信息
      this.hasMoreByStatus[status] = this.taskList.filter(t => t.status === status).length < res.total;
      this.pageByStatus[status]++;
    } catch (err) {
      console.error(`getTaskList for status ${status} error:`, err);
      this.hasMoreByStatus[status] = false;
    } finally {
      this.loadingByStatus[status] = false;
    }
  };

  // 初始化加载
  initialLoad = () => {
    this.taskList = [];
    this.page = 1;
    this.hasMore = true;
    this.pageByStatus = { 0: 1, 1: 1, 2: 1 };
    this.hasMoreByStatus = { 0: true, 1: true, 2: true };
    this.searchKeyword = '';
    this._fetchTasks();
  };

  // 加载更多任务
  loadMoreTasks = () => {
    if (!this.hasMore || this.isLoading) {
      return;
    }
    this._fetchTasks();
  };
  
  // 按状态加载更多任务
  loadMoreTasksByStatus = (status) => {
    if (!this.hasMoreByStatus[status] || this.loadingByStatus[status]) {
      return;
    }
    this._fetchTasksByStatus(status);
  };

  // 设置搜索关键词
  setSearchKeyword = (keyword) => {
    this.searchKeyword = keyword;
    this.taskList = [];
    this.page = 1;
    this.hasMore = true;
    this.pageByStatus = { 0: 1, 1: 1, 2: 1 };
    this.hasMoreByStatus = { 0: true, 1: true, 2: true };
    this.debouncedSearchFetch();
  };

  // 添加任务到本地列表
  _addTaskToList = (newTask) => {
    this.taskList.unshift(newTask); // 添加到列表开头，以便用户立即看到
  };

  // 更新本地列表中的任务
  _updateTaskInList = (updatedTask) => {
    this.taskList = this.taskList.map(task =>
      task.task_id === updatedTask.task_id ? { ...task, ...updatedTask } : task
    );
  };
  
  // 从本地列表中移除任务
  _removeTaskFromList = (taskId) => {
    this.taskList = this.taskList.filter(task => task.task_id !== taskId);
  };

  // 创建新任务
  createTask = async (taskData) => {
    try {
          console.log('TaskStore: Attempting API create task with data:', taskData);
      const res = await apiCreateTask(taskData);
      const newTask = { task_id: res.task_id, ...taskData };
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
          console.log('TaskStore: Attempting API update task with data:', taskData); // 添加这行
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

  // 更新任务状态
  updateTaskStatus = async (taskId, newStatus) => {
    // 保存原状态，以便失败时回滚
    const oldStatus = this.taskList.find(task => task.task_id === taskId)?.status;
    
    // 乐观更新
    this._updateTaskInList({ task_id: taskId, status: newStatus });
    
    // 调用API
    try {
      await apiUpdateStatus({ task_id: taskId, status: newStatus });
    } catch (error) {
      // 如果API调用失败，回滚状态
      if (oldStatus !== undefined) {
        this._updateTaskInList({ task_id: taskId, status: oldStatus });
      }
      throw error;
    }
  };
}

export default new TaskStore();
