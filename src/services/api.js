import axios from 'axios';

// Axios实例
const api = axios.create({
  baseURL: 'http://localhost:3001/api/tasks', // 后端地址，生产时改
  timeout: 5000 // <500ms响应
});

// 响应拦截器：统一错误处理
api.interceptors.response.use(
  response => response.data, 
  error => {
    const msg = error.response?.data?.message || 'Network error';
    import('antd-mobile').then(({ Toast }) => Toast.show({ content: msg, duration: 2000 }));
    return Promise.reject(error);
  }
);

export const createTask = (data) => api.post('/create', data);
export const updateTask = (data) => api.post('/update', data);
export const deleteTask = (data) => api.post('/delete', data);
export const getTaskList = (data) => api.post('/list', data);
export const updateTaskStatus = (data) => api.post('/update-status', data);
