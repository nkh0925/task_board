import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app';
// 引入 mobx-react 库中的 Provider 组件
// Provider 用于将 MobX Store 注入到 React 组件树中，使得子组件可以访问这些 Store
import { Provider } from 'mobx-react';
// 引入自定义的 MobX Store：taskStore
// 这表明应用可能是一个任务管理或待办事项应用
import taskStore from './stores/TaskStore';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  // Provider 组件包裹整个 App 组件
  // 它通过 props (这里是 taskStore={taskStore}) 将 MobX Store 传递给其子组件树
  // 这样，App 及其任何后代组件都可以通过 mobx-react 提供的 inject 或 useStore 钩子来访问 taskStore
  <Provider taskStore={taskStore}>
    <App />
  </Provider>
);
