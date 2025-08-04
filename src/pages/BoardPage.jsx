// src/pages/BoardPage.jsx
import React from 'react';
import { observer } from 'mobx-react';
import { useStores } from '../utils/hooks';
// 移除 SearchBar, InfiniteScroll, Modal, Popover, Button, AddOutline, FilterOutline 导入
import { InfiniteScroll } from 'antd-mobile'; // 只保留 InfiniteScroll
import TaskCard from '../components/TaskCard';
import DragColumn from '../components/DragColumn';
// 移除 TaskForm 导入，因为新增任务逻辑已不再由BoardPage直接处理
// import TaskForm from '../components/TaskForm';
// 移除 lodash 导入
import styles from './BoardPage.module.css';

const statusMap = { 0: '待办', 1: '进行中', 2: '已完成' };

const BoardPage = observer(() => {
  const { taskStore } = useStores();
  // 移除 localKeyword, filterVisible, currentSort 状态

  // 移除 handleSearch, handleInputChange, handleSortChange, sortOptions 逻辑

  const groupedTasks = taskStore.taskList.reduce((acc, task) => {
    acc[task.status] = acc[task.status] || [];
    acc[task.status].push(task);
    return acc;
  }, {});

  // 移除 showAddModal 函数

  return (
    <div className={styles.container}>
      {/* 移除 搜索栏和筛选按钮 */}
      {/* <div className={styles.searchFilterContainer}>...</div> */}

      {/* 看板列容器 */}
      <div className={styles.columnsContainer}>
        {Object.keys(statusMap).map(status => (
          <div
            key={status}
            className={styles.column}
          >
            {/* 列标题，显示状态名称和任务数量 */}
            <div className={styles.columnHeader}>
              <span>{statusMap[status]} ({groupedTasks[status]?.length || 0})</span>
              {/* 移除 AddOutline 按钮 */}
              {/* <AddOutline
                fontSize={20}
                onClick={() => showAddModal(parseInt(status))}
                className={styles.addButton}
              /> */}
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
