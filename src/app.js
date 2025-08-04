import React, { Suspense, useEffect } from 'react';
// 引入 mobx-react 库中的 observer
// observer 是一个高阶组件 (HOC) 或函数，用于将 React 组件包装成响应式组件
// 当 MobX store 中的 observable 状态发生变化时，被 observer 包裹的组件会自动重新渲染
import { observer } from 'mobx-react';
// 引入自定义的 useStores 钩子，用于从 MobX Provider 中获取 store 实例
// 这个钩子在 main.js 中通过 Provider 注入的 taskStore 连接起来
import { useStores } from './utils/hooks';
// 引入 antd-mobile 组件库中的 SpinLoading 组件，用于显示加载动画
import { SpinLoading } from 'antd-mobile';
// 引入 react-dnd 库中的 DndProvider
// DndProvider 是 react-dnd 的顶层组件，用于为整个应用提供拖拽上下文
import { DndProvider } from 'react-dnd';
// 引入 react-dnd-touch-backend 库中的 TouchBackend
// TouchBackend 是 react-dnd 的一个后端实现，专门用于支持触摸设备上的拖拽操作
// 如果没有这个，在移动设备上可能无法正常使用拖拽
import { TouchBackend } from 'react-dnd-touch-backend';
// React.lazy() 接受一个函数作为参数，这个函数需要返回一个 Promise。
const LazyBoardPage = React.lazy(() => import('./pages/BoardPage'));

// 定义 App 组件，并使用 observer 进行包裹，使其能够响应 MobX store 的变化
const App = observer(() => {
  // 使用自定义的 useStores 钩子获取 MobX store 实例
  // 这里解构出 taskStore，因为在 main.js 中是以 taskStore={taskStore} 的形式传递的
  const { taskStore } = useStores();

  // useEffect 钩子，在组件首次渲染（挂载）后执行
  useEffect(() => {
    // 打印日志，用于调试或追踪应用初始化过程
    console.log('App useEffect triggered: Initial load');
    console.log('taskStore available:', !!taskStore); // 检查 taskStore 是否可用
    // 调用 taskStore 的 initialLoad 方法
    // 这通常用于在应用启动时从后端获取数据、初始化状态等
    taskStore.initialLoad(); // 初始加载数据
  }, []); // 空数组作为依赖项，确保只在组件挂载时执行一次

  return (
    <DndProvider backend={TouchBackend}>
      {/* 当 LazyBoardPage 所在的 chunk 还在加载时，Suspense 会渲染其 fallback prop。 */}
      <Suspense fallback={<SpinLoading style={{ position: 'fixed', top: '50%', left: '50%' }} />}>
        {taskStore.isLoading && (
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                zIndex: 9999 
            }}>
                <SpinLoading style={{ fontSize: 40 }} />
            </div>
        )}
        <LazyBoardPage />
      </Suspense>
    </DndProvider>
  );
});

export default App;
