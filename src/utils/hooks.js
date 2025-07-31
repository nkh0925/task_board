// 引入 React 的 useContext 钩子
// useContext 允许你订阅 React Context 的变化，并从中读取值。
import { useContext } from 'react';
// 引入 mobx-react 提供的 MobXProviderContext
// MobXProviderContext 是 mobx-react 内部使用的一个 React Context。
// 在 main.js 中，我们用 <Provider> 包裹了 <App />，
// 这个 Provider 实际上就是将所有的 store 作为一个值，传递给了 MobXProviderContext。
import { MobXProviderContext } from 'mobx-react';

// 定义一个自定义 Hook：useStores
// 这是一个函数，名字以 'use' 开头，遵循 React Hooks 命名约定。
export const useStores = () => {
  // 调用 useContext(MobXProviderContext) 来从最近的 <MobXProviderContext.Provider> 获取值。
  // 这个值就是 main.js 中 <Provider> 组件传递的 props。
  // 在 main.js 中，我们有 <Provider taskStore={taskStore}>，
  // 所以 useContext(MobXProviderContext) 将会返回一个对象：{ taskStore: taskStore 实例 }
  return useContext(MobXProviderContext);
};
