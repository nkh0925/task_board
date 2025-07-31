// src/services/api.js

// 引入 axios，一个流行的基于 Promise 的 HTTP 客户端，用于浏览器和 Node.js
import axios from 'axios';
// 引入 antd-mobile 的 Toast 组件，用于在请求失败时显示提示信息
import { Toast } from 'antd-mobile';

// 创建一个 Axios 实例
// 使用实例的好处是可以在此实例上配置 baseURL、timeout、拦截器等，而不会影响全局的 axios 配置
const api = axios.create({
  // baseURL: 所有请求将以此为基础路径。
  // 这里的配置指向本地的 Node.js 后端服务器的 /api/tasks 路径。
  // 提示：“生产时改” 意味着在部署到生产环境时，需要将其更改为实际的后端服务器地址。
  baseURL: 'http://localhost:3001/api/tasks',
  // timeout: 请求超时时间，单位毫秒。如果请求在 5000 毫秒内没有响应，则自动中断。
  timeout: 5000 // <5000ms响应
});

// 响应拦截器：统一错误处理
// interceptors.response.use() 允许在请求被 then 或 catch 处理之前对响应进行拦截。
// 第一个回调函数处理成功的响应 (状态码在 2xx 范围内)。
// 第二个回调函数处理失败的响应 (状态码超出 2xx 范围，或网络错误)。
api.interceptors.response.use(
  // 成功响应的处理：
  // 直接返回 response.data。这意味着在调用 API 函数的地方，将直接获得后端返回的数据体，无需再解构 response 对象。
  response => response.data,
  // 失败响应的处理：
  error => {
    // 尝试从错误响应中获取后端返回的错误消息，如果没有则显示“网络错误”。
    const msg = error.response?.data?.message || '网络错误';
    // 使用 antd-mobile 的 Toast 显示错误消息，持续 2 秒。
    Toast.show({ content: msg, duration: 2000 });
    // 抛出错误，以便调用者可以通过 catch 块继续处理错误。
    // Promise.reject(error) 确保错误被传播下去，而不会被拦截器吞噬。
    return Promise.reject(error);
  }
);

// 导出封装好的 API 请求函数
// 这些函数都是使用 POST 方法向后端发送数据。
// 每请求一个不同的 API 路径 (例如 '/create', '/update')。
// `data` 参数通常是请求体，包含了需要发送到服务器的数据。

// 创建任务：向 '/create' 路径发送 POST 请求，并携带任务数据
export const createTask = (data) => api.post('/create', data);
// 更新任务：向 '/update' 路径发送 POST 请求，并携带任务数据
export const updateTask = (data) => api.post('/update', data);
// 删除任务：向 '/delete' 路径发送 POST 请求，并携带任务 ID
export const deleteTask = (data) => api.post('/delete', data);
// 获取任务列表：向 '/list' 路径发送 POST 请求，并携带查询参数 (如分页、搜索关键词)
export const getTaskList = (data) => api.post('/list', data);
// 更新任务状态：向 '/update-status' 路径发送 POST 请求，并携带任务 ID 和新状态
export const updateTaskStatus = (data) => api.post('/update-status', data);
 // 拖拽排序 API
export const reorderTasksAndStatus = (data) => api.post('/reorder-tasks-and-status', data);