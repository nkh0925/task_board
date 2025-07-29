import React, { useState } from 'react';
import { Card, Modal, Popover } from 'antd-mobile';
import { MoreOutline, EditSOutline, DeleteOutline } from 'antd-mobile-icons';
import { observer } from 'mobx-react';
import { useStores } from '../utils/hooks';
import { useDrag } from 'react-dnd';
import TaskForm from './TaskForm';

const priorityMap = { 1: '低', 2: '中',  3: '高' };

const TaskCard = observer(({ task }) => {
  const { taskStore } = useStores();
  const [visible, setVisible] = useState(false);

  const [{ isDragging }, drag] = useDrag(() =>({
    type: 'task', 
    item: { task_id: task.task_id, status: task.status },
    collect: monitor => ({ isDragging: !!monitor.isDragging() }),
  }));

  const handleDelete = () => {
    setVisible(false);
    Modal.confirm({
      content: '确认删除？',
      onConfirm: () => {
        taskStore.deleteTask(task.task_id);
      }
    });
  };

  const showEditModal = () => {
    setVisible(false);
    Modal.show({
    content: <TaskForm task={task} taskStore={taskStore} onClose={() => Modal.clear()} />,      closeOnMaskClick: true
    });
  };

  const actions = [
    {
      key: 'edit',
      icon: <EditSOutline />,
      text: '编辑任务',
      onClick: showEditModal
    },
    {
      key: 'delete',
      icon: <DeleteOutline style={{ color: '#ff4d4f' }} />,
      text: '删除任务',
      color: '#ff4d4f',
      onClick: handleDelete
    }
  ];

  return (
    <div
      ref={drag}
      style={{ opacity: isDragging ? 0.5 : 1, marginBottom: '10px' }}
    >
      <Card
        title={task.title}
        extra={
          <Popover
            visible={visible}
            onVisibleChange={setVisible}
            content={
              <div style={{ padding: '8px 0' }}>
                {actions.map(action => (
                  <div
                    key={action.key}
                    onClick={action.onClick}
                    style={{
                      padding: '8px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    {action.icon}
                    <span style={{ color: action.color }}>{action.text}</span>
                  </div>
                ))}
              </div>
            }
            trigger='click'
            placement='bottomRight'
          >
            <MoreOutline style={{ fontSize: '20px' }} />
          </Popover>
        }
      >
        <p>{task.description}</p>
        <p>优先级: {priorityMap[task.priority]}</p>
        <p>创建时间: {new Date(task.create_time).toLocaleString()}</p>
      </Card>
    </div>
  );
});

export default TaskCard;
