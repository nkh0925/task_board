import React from 'react';
import { observer } from 'mobx-react';
import { useStores } from '../utils/hooks';
import { SearchBar, InfiniteScroll, Modal } from 'antd-mobile';
import { AddOutline } from 'antd-mobile-icons';
import TaskCard from '../components/TaskCard';
import DragColumn from '../components/DragColumn';
import TaskForm from '../components/TaskForm';

const statusMap = { 0: '待办', 1: '进行中', 2: '已完成' };

const BoardPage = observer(() => {
  const { taskStore } = useStores();
  const [localKeyword, setLocalKeyword] = React.useState('');

  const handleSearch = React.useCallback(_.debounce((keyword) => {
    taskStore.setSearchKeyword(keyword);
  }, 500), []);

  const handleInputChange = (value) => {
    setLocalKeyword(value);
    handleSearch(value);
  };

  const groupedTasks = taskStore.taskList.reduce((acc, task) => {
    acc[task.status] = acc[task.status] || [];
    acc[task.status].push(task);
    return acc;
  }, {});

  const showAddModal = (initialStatus) => {
    Modal.show({
      content: <TaskForm 
        taskStore={taskStore} 
        onClose={() => Modal.clear()} 
        initialValues={{ status: initialStatus }} 
      />,
      closeOnMaskClick: true
    });
  };

  return (
    <div style={{ padding: '12px' }}>
      {/* 搜索栏 */}
      <SearchBar
        placeholder="搜索任务"
        value={localKeyword}
        onChange={handleInputChange}
        style={{ marginBottom: '16px' }}
      />

      {/* 看板列容器 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', height: 'calc(100vh - 80px)', gap: '12px' }}>
        {Object.keys(statusMap).map(status => (
          <div
            key={status}
            style={{
              flex: 1,
              height: '100%',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              backgroundColor: '#f5f5f5'
            }}
          >
            {/* 列标题，显示状态名称、任务数量和添加按钮 */}
            <div style={{ 
              padding: '12px 16px', 
              fontWeight: 'bold', 
              fontSize: '16px', 
              borderBottom: '1px solid #e8e8e8',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#fff',
              borderTopLeftRadius: '8px',
              borderTopRightRadius: '8px'
            }}>
              <span>{statusMap[status]} ({groupedTasks[status]?.length || 0})</span>
              <AddOutline 
                fontSize={20} 
                onClick={() => showAddModal(parseInt(status))} 
                style={{ 
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '50%',
                  transition: 'background-color 0.3s',
                  ':hover': { backgroundColor: '#f0f0f0' }
                }}
              />
            </div>
            
            {/* 任务卡片容器，可滚动 */}
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
