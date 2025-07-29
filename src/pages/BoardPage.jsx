import React from'react';
import { observer } from 'mobx-react';
import { useStores } from '../utils/hooks';
import { SearchBar, Card, InfiniteScroll, Button, Modal } from 'antd-mobile';
import TaskCard from '../components/TaskCard';
import DragColumn from '../components/DragColumn';
import TaskForm from '../components/TaskForm';

const statusMap = { 0: '待办', 1: '进行中', 2: '已完成' };

const BoardPage = observer(() => {
  const { taskStore } = useStores();

  // 分组任务
  const groupedTasks = taskStore.taskList.reduce((acc, task) => {
    acc[task.status] = acc[task.status] || [];
    acc[task.status].push(task);
    return acc;
  }, {});

  // 新增任务Modal
  const showAddModal = () => {
    Modal.show({
    content: <TaskForm taskStore={taskStore} onClose={() => Modal.clear()} />,      
    closeOnMaskClick: true
    });
  };

  return (
    <div>
      <SearchBar
        placeholder="搜索任务"
        value={taskStore.searchKeyword}
        onChange={(value) => taskStore.setSearchKeyword(value)}
        style={{ marginBottom: '10px' }}
      />
      <Button onClick={showAddModal} style={{ marginBottom: '10px' }}>新增任务</Button>
      <div style={{ display: 'flex', justifyContent: 'space-between', height: 'calc(100vh - 120px)' }}>
        {Object.keys(statusMap).map(status => (
          <div 
            key={status}
            style={{ 
              width: '32%', 
              height: '100%',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              backgroundColor: '#f5f5f5'
            }}
          >
            <div style={{ padding: '12px 16px', fontWeight: 'bold', fontSize: '16px', borderBottom: '1px solid #e8e8e8' }}>
              {statusMap[status]} ({groupedTasks[status]?.length || 0})
            </div>
            <div 
              style={{ 
                flex: 1, 
                overflowY: 'auto',
                padding: '8px',
              }}
            >
              <DragColumn status={parseInt(status)}>
                {groupedTasks[status]?.map(task => (
                  <TaskCard key={task.task_id} task={task} />
                ))}
                <InfiniteScroll 
                  loadMore={() => taskStore.loadMoreTasksByStatus(parseInt(status))} 
                  hasMore={taskStore.hasMoreByStatus[status] || false}
                />
              </DragColumn>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

export default BoardPage;
