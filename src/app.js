import React, { Suspense, useEffect } from 'react';
import { observer } from 'mobx-react';
import { useStores } from './utils/hooks';
import BoardPage from './pages/BoardPage';
import { SpinLoading } from 'antd-mobile';
import { DndProvider } from 'react-dnd';
import { TouchBackend } from 'react-dnd-touch-backend';
const App = observer(() => {
  const { taskStore } = useStores();

  useEffect(() => {
    console.log('App useEffect triggered: Initial load');
    console.log('taskStore available:', !!taskStore);
    taskStore.initialLoad(); // 初始加载
  }, []);

  return (
    <DndProvider backend={TouchBackend}>
      <Suspense fallback={<SpinLoading />}>
        {taskStore.isLoading && <SpinLoading style={{ position: 'fixed', top: '50%', left: '50%' }} />}
        <BoardPage />
      </Suspense>
    </DndProvider>
  );
});

export default App;
