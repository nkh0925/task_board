import React, { useState } from 'react';
import { observer } from 'mobx-react';
import { useStores } from '../utils/hooks';
import { SearchBar, InfiniteScroll, Modal, Popover, Button } from 'antd-mobile';
import { AddOutline, FilterOutline } from 'antd-mobile-icons';
import TaskCard from '../components/TaskCard';
import DragColumn from '../components/DragColumn';
import TaskForm from '../components/TaskForm';
import _ from 'lodash';
import styles from './BoardPage.module.css';

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
    <div className={styles.container}>
      {/* 搜索栏和筛选按钮 */}
      <div className={styles.searchFilterContainer}>
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
            <div className={styles.filterOptions}>
              {sortOptions.map(option => (
                <div
                  key={option.key}
                  onClick={() => handleSortChange(option.key)}
                  className={`${styles.filterOption} ${currentSort === option.key ? styles.filterOptionActive : ''}`}
                >
                  <span>{option.label}</span>
                </div>
              ))}
            </div>
          }
          trigger='click'
          placement='bottomRight'
        >
          <Button className={styles.filterButton}>
            <FilterOutline fontSize={20} />
          </Button>
        </Popover>
      </div>

      {/* 看板列容器 */}
      <div className={styles.columnsContainer}>
        {Object.keys(statusMap).map(status => (
          <div
            key={status}
            className={styles.column}
          >
            {/* 列标题，显示状态名称、任务数量和添加按钮 */}
            <div className={styles.columnHeader}>
              <span>{statusMap[status]} ({groupedTasks[status]?.length || 0})</span>
              <AddOutline 
                fontSize={20} 
                onClick={() => showAddModal(parseInt(status))} 
                className={styles.addButton}
              />
            </div>
            
            {/* 任务卡片容器，可滚动 */}
            <div className={styles.tasksContainer}>
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
