import React from 'react';
import { Card, Button, Modal } from 'antd-mobile';
import { observer } from 'mobx-react';
import { useStores } from '../utils/hooks';
import { useDrag } from 'react-dnd';
import { deleteTask } from '../services/api';
import TaskForm from './TaskForm';

const priorityMap = { 1: '低', 2: '中',  3: '高' };

const TaskCard = observer(({ task }) => {
  const { taskStore } = useStores();

  const [{ isDragging }, drag] = useDrag(() =>({
    type: 'task', // 类型
    item: { task_id: task.task_id, status: task.status }, // 拖拽数据
    collect: monitor => ({ isDragging: !!monitor.isDragging() }),
  }));

  const handleDelete = () => {
    Modal.confirm({
      content: '确认删除？',
      onConfirm: () => {
        deleteTask({ task_id: task.task_id })
          .then(() => { taskStore.removeTask(task.task_id); })
          .catch(() => {});
      }
    });
  };

  const showEditModal = () => {
    Modal.show({
      content: <TaskForm task={task} onClose={() => Modal.clear()} />,
      closeOnMaskClick: true
    });
  };

  return (
<div
      ref={drag}
      // 将原 Card 上的 style 属性移动到 div 上，以保持拖拽时的透明度变化和间距
      style={{ opacity: isDragging ? 0.5 : 1, marginBottom: '10px' }}
    >
      <Card
        // Card 自身的 style 可以移除，因为现在外层 div 已经处理了
        title={task.title}
        extra={<Button size="mini" onClick={handleDelete}>删除</Button>}
      >
        <p>{task.description}</p>
        <p>优先级: {priorityMap[task.priority]}</p>
        <p>创建时间: {new Date(task.create_time).toLocaleString()}</p>
        <Button onClick={showEditModal}>编辑</Button>
      </Card>
    </div>
  );
});

export default TaskCard;
