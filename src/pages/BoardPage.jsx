import React, { useState } from 'react';
import { observer } from 'mobx-react';
import { useStores } from '../utils/hooks';
import { SearchBar, InfiniteScroll, Modal, Popover, Button } from 'antd-mobile';
import { AddOutline, FilterOutline } from 'antd-mobile-icons';
import TaskCard from '../components/TaskCard';
import DragColumn from '../components/DragColumn';
import TaskForm from '../components/TaskForm';
import _ from 'lodash';

const statusMap = { 0: '待办', 1: '进行中', 2: '已完成' };

const BoardPage = observer(() => {
  const { taskStore } = useStores();
  const [localKeyword, setLocalKeyword] = React.useState('');
  const [filterVisible, setFilterVisible] = useState(false);
  const [currentSort, setCurrentSort] = useState('priority');

  const handleSearch = React.useCallback(_.debounce((keyword) => {
    taskStore.setSearchKeyword(keyword);
  }, 500), []);

  const handleInputChange = (value) => {
    setLocalKeyword(value);
    handleSearch(value);
  };

  const handleSortChange = (sortType) => {
    setCurrentSort(sortType);
    taskStore.setSortType(sortType);
    setFilterVisible(false);
  };

  const sortOptions = [
    { key: 'priority', label: '按优先级排序' },
    { key: 'createTime', label: '按创建时间排序' },
    { key: 'deadline', label: '按截止时间排序' }
  ];

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
      {/* 搜索栏和筛选按钮 */}
      <div style={{ display: 'flex', marginBottom: '16px', gap: '8px' }}>
        <SearchBar
          placeholder="搜索任务"
          value={localKeyword}
          onChange={handleInputChange}
          style={{ flex: 1 }}
        />
        
        <Popover
          visible={filterVisible}
          onVisibleChange={setFilterVisible}
          content={
            <div style={{ padding: '8px 0' }}>
              {sortOptions.map(option => (
                <div
                  key={option.key}
                  onClick={() => handleSortChange(option.key)}
                  style={{
                    padding: '8px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer',
                    backgroundColor: currentSort === option.key ? '#f0f0f0' : 'transparent'
                  }}
                >
                  <span>{option.label}</span>
                </div>
              ))}
            </div>
          }
          trigger='click'
          placement='bottomRight'
        >
          <Button
            style={{ 
              padding: '0 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <FilterOutline fontSize={20} />
          </Button>
        </Popover>
      </div>

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
