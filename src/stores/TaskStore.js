// TaskStore.js
import { makeAutoObservable } from 'mobx';
import { getTaskList, deleteTask as apiDeleteTask, updateTask as apiUpdateTask } from '../services/api';
import _ from 'lodash'; // for debounce
import { Toast } from 'antd-mobile'; // 引入 Toast 用于提示用户

// 定义不同的防抖延迟
const SEARCH_DEBOUNCE_DELAY = 500; // 搜索输入更长的防抖延迟
const INFINITE_SCROLL_DEBOUNCE_DELAY = 200; // 无限滚动更短的防抖延迟

class TaskStore {
  taskList = []; // 任务数组
  isLoading = false; // 全局加载状态
  searchKeyword = ''; // 搜索关键词
  page = 1; // 当前页码，用于加载下一页
  hasMore = true; // 是否还有更多数据可加载

  constructor() {
    makeAutoObservable(this);
    this._fetchTasks = this._fetchTasks.bind(this);
    this.debouncedSearchFetch = _.debounce(this._fetchTasks, SEARCH_DEBOUNCE_DELAY);
    this.debouncedInfiniteScrollFetch = _.debounce(this._fetchTasks, INFINITE_SCROLL_DEBOUNCE_DELAY);
  }

  // 核心的获取任务列表函数
  _fetchTasks = async () => { // 标记为 async
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

    console.log('Sending getTaskList with:', payload);
    try {
      const res = await getTaskList(payload); // 使用 await
      console.log(`Fetched ${res.tasks.length} tasks. Total: ${res.total}. Current page: ${this.page}`);
      this.taskList.push(...res.tasks); // 使用 push 添加新数据
      this.hasMore = this.taskList.length < res.total;
      this.page++;
    } catch (err) {
      console.error('getTaskList error:', err.response?.data || err.message || err);
      this.hasMore = false;
      // Toast 已经在 interceptors 中处理，这里可以不重复
    } finally {
      this.isLoading = false;
    }
  };

  initialLoad = () => {
    this.taskList = [];
    this.page = 1;
    this.hasMore = true;
    this.searchKeyword = '';
    this._fetchTasks();
  };

  loadMoreTasks = () => {
    if (!this.hasMore || this.isLoading) {
      console.log('No more tasks to load or already loading. Aborting loadMoreTasks.');
      return;
    }
    this.debouncedInfiniteScrollFetch();
  };

  setSearchKeyword = (keyword) => {
    this.searchKeyword = keyword;
    this.taskList = [];
    this.page = 1;
    this.hasMore = true;
    this.debouncedSearchFetch();
  };


  // 添加任务到列表 (在 TaskForm 中创建成功后调用)
  addTask = (newTask) => {
    this.taskList.unshift(newTask); // 添加到列表开头，以便用户立即看到
  };

  // 更新列表中某个任务 (在 TaskForm 中编辑成功后调用)
  updateTaskInList = (updatedTask) => {
    this.taskList = this.taskList.map(task =>
      task.task_id === updatedTask.task_id ? { ...task, ...updatedTask } : task
    );
  };

  // 核心删除任务的 action
  deleteTask = async (taskId) => {
    try {
      await apiDeleteTask({ task_id: taskId });
      this._removeTaskFromList(taskId); // 调用内部方法更新本地列表
      Toast.show({ content: '任务删除成功', icon: 'success' });
    } catch (error) {
      // API 错误已经在 interceptors 中处理了 Toast，这里只需要 console.error
      console.error('任务删除失败:', error);
    }
  };

  // UI 先变，API 后发
  updateTaskStatus = (taskId, newStatus) => {
    this.taskList = this.taskList.map(task =>
      task.task_id === taskId ? { ...task, status: newStatus } : task
    );
  };
}

export default new TaskStore();
