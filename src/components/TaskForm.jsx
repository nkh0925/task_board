import React from 'react';
import { Card, Button, Modal } from 'antd-mobile'; // 引入 Toast
import { observer } from 'mobx-react';
import { useStores } from '../utils/hooks';
import { useDrag } from 'react-dnd';
import TaskForm from './TaskForm';

const priorityMap = { 1: '低', 2: '中',  3: '高' };

const TaskCard = observer(({ task }) => {
  const { taskStore } = useStores();

  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'task',
    item: { task_id: task.task_id, status: task.status },
    collect: monitor => ({ isDragging: !!monitor.isDragging() }),
  }));

  const handleDelete = () => {
    Modal.confirm({
      content: '确认删除？',
      onConfirm: async () => {
        await taskStore.deleteTask(task.task_id);
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
    <Card
      ref={drag}
      title={task.title}
      extra={<Button size="mini" onClick={handleDelete}>删除</Button>}
      style={{ opacity: isDragging ? 0.5 : 1, marginBottom: '10px' }}
    >
      <p>{task.description}</p>
      <p>优先级: {priorityMap[task.priority]}</p>
      <p>创建时间: {new Date(task.create_time).toLocaleString()}</p>
      <Button onClick={showEditModal}>编辑</Button>
    </Card>
  );
});

export default TaskCard;
