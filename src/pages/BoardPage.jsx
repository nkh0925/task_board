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

  // 无限滚动加载更多
  const loadMore = () => taskStore.loadMoreTasks();

  // 新增任务Modal
  const showAddModal = () => {
    Modal.show({
      content: <TaskForm onClose={() => Modal.clear()} />,
      closeOnMaskClick: true
    });
  };

  return (
      <div>
        <SearchBar
          placeholder="搜索任务"
          value={taskStore.searchKeyword} // 使 SearchBar 成为受控组件，显示 store 中的值
          onChange={(value) => taskStore.setSearchKeyword(value)} // 传递输入值给 MobX action
          style={{ marginBottom: '10px' }}
        />
        <Button onClick={showAddModal} style={{ marginBottom: '10px' }}>新增任务</Button>
        {Object.keys(statusMap).map(status => (
          <DragColumn key={status} status={parseInt(status)}>
            <Card title={`${statusMap[status]} (${groupedTasks[status]?.length || 0})`}>
              {/* InfiniteScroll 负责在需要时调用 loadMore */}
              <InfiniteScroll loadMore={loadMore} hasMore={taskStore.hasMore}>
                {/* 遍历并渲染属于当前状态的任务 */}
                {groupedTasks[status]?.map(task => (
                  <TaskCard key={task.task_id} task={task} />
                ))}
              </InfiniteScroll>
            </Card>
          </DragColumn>
        ))}
      </div>
  );
});

export default BoardPage;
