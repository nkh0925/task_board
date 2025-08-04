import React, { useState, useRef } from 'react';
import { Card, Modal, Popover, Button } from 'antd-mobile';
import { MoreOutline, EditSOutline, DeleteOutline, InformationCircleOutline } from 'antd-mobile-icons';
import { observer } from 'mobx-react';
import { useStores } from '../utils/hooks';
import { useDrag, useDrop } from 'react-dnd';
import TaskForm from './TaskForm';
import { formatToLocaleString } from '../utils/dateUtils';
import styles from './TaskCard.module.css';

const priorityMap = { 1: '低', 2: '中',  3: '高' };

const TaskCard = observer(({ task }) => {
    const { taskStore } = useStores();
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'task',
    item: { task_id: task.task_id, status: task.status },
    collect: monitor => ({ isDragging: monitor.isDragging() }),
  }), [task.task_id, task.status]);

  const [{ isOver }, drop] = useDrop({
    accept: 'task',
    hover(item, monitor) {
      if (!ref.current) {
        return;
      }
      const draggedId = item.task_id;
      const hoveredId = task.task_id;

      if (draggedId === hoveredId) {
        return;
      }

      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;

      const isBefore = hoverClientY < hoverMiddleY;

      taskStore.moveTask(draggedId, hoveredId, task.status, isBefore);
    },
drop(item) {
  const draggedTask = taskStore.taskList.find(t => t.task_id === item.task_id);
  if (draggedTask) {
    // 检查状态是否发生了变化
    if (item.status !== draggedTask.status) {
      // 状态已变化，调用API保存新状态和位置
      taskStore.saveTaskPosition(item.task_id, draggedTask.status, draggedTask.order_index);
    } else {
      taskStore.saveTaskPosition(item.task_id, draggedTask.status, draggedTask.order_index);
    }
  }
}
,
    collect: monitor => ({
      isOver: monitor.isOver()
    })
  });

  drag(drop(ref));

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
      content: <TaskForm task={task} taskStore={taskStore} onClose={() => Modal.clear()} />,
      closeOnMaskClick: true
    });
  };

  const showDetailsModal = () => {
    setVisible(false);
    Modal.show({
      content: (
        <div style={{ padding: '16px' }}>
          <h2 style={{ marginBottom: '10px' }}>{task.title}</h2>
          <p><strong>描述:</strong> {task.description || '无'}</p>
          <p><strong>优先级:</strong> {priorityMap[task.priority]}</p>
          <p><strong>截止日期:</strong> {task.deadline ? formatToLocaleString(task.deadline) : '无'}</p>
          <p><strong>创建时间:</strong> {new Date(task.create_time).toLocaleString()}</p>
          <p><strong>状态:</strong> {['待办', '进行中', '已完成'][task.status]}</p>
          <Button block onClick={() => Modal.clear()} style={{ marginTop: '20px' }}>关闭</Button>
        </div>
      ),
      closeOnMaskClick: true,
    });
  };

  const actions = [
    {
      key: 'details',
      icon: <InformationCircleOutline />,
      text: '查看详情',
      onClick: showDetailsModal
    },
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
      ref={ref} 
      className={styles.container}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={() => setIsHovered(true)}
      onTouchEnd={() => setIsHovered(false)}
    >
      <Card
        title={task.title}
        extra={
          <Popover
            visible={visible}
            onVisibleChange={setVisible}
            content={
              <div className={styles.actionsMenu}>
                {actions.map(action => (
                  <div
                    key={action.key}
                    onClick={action.onClick}
                    className={styles.actionItem}
                    style={action.color ? { color: action.color } : {}}
                  >
                    {action.icon}
                    <span>{action.text}</span>
                  </div>
                ))}
              </div>
            }
            trigger='click'
            placement='bottomRight'
          >
            <MoreOutline className={styles.moreIcon} />
          </Popover>
        }
        className={`${styles.card} ${styles[`priority${task.priority}`]} ${isDragging ? styles.dragging : ''} ${isHovered ? styles.hovered : ''}`}
      >
        <p>{task.description}</p>
        <p className={`${styles.deadline} ${task.deadline && task.status !== 2 && new Date() > new Date(task.deadline) ? styles.overdue : ''}`}>
          截止日期: {task.deadline ? formatToLocaleString(task.deadline) : '无'}
        </p>
        
        {isDragging && <div className={styles.dragOverlay} />}
      </Card>
    </div>
  );
});

export default TaskCard;
