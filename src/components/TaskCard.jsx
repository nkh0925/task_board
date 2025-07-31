import React, { useState, useRef } from 'react';
import { Card, Modal, Popover, Button } from 'antd-mobile';
import { MoreOutline, EditSOutline, DeleteOutline, InformationCircleOutline } from 'antd-mobile-icons';
import { observer } from 'mobx-react';
import { useStores } from '../utils/hooks';
import { useDrag, useDrop } from 'react-dnd';
import TaskForm from './TaskForm';
import { formatToLocaleString } from '../utils/dateUtils';
import { CSSTransition } from 'react-transition-group'; // 需要安装这个依赖

const priorityMap = { 1: '低', 2: '中',  3: '高' };
const priorityBorderColors = {
  1: '#52c41a', // 绿色 - 低优先级
  2: '#faad14', // 橙色 - 中优先级
  3: '#f5222d'  // 红色 - 高优先级
};

const TaskCard = observer(({ task }) => {
  const { taskStore } = useStores();
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

  // =========================== DND DRAG ===========================
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'task',
    item: { task_id: task.task_id, status: task.status },
    collect: monitor => ({ isDragging: monitor.isDragging() }),
  }), [task.task_id, task.status]);

  // =========================== DND DROP ===========================
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

  // 卡片样式，包含动画效果
  const cardStyle = {
    borderLeft: `5px solid ${priorityBorderColors[task.priority] || '#ccc'}`,
    transition: 'all 0.3s ease',
    transform: isDragging ? 'scale(1.02) rotate(1deg)' : 'scale(1) rotate(0)',
    opacity: isDragging ? 0.6 : 1,
    boxShadow: isDragging ? '0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23)' : 
               isOver ? '0 3px 10px rgba(0,0,0,0.15)' : 
               isHovered ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
    position: 'relative',
    zIndex: isDragging ? 1000 : 1,
    touchAction: 'none', // 防止触摸事件干扰拖拽
  };

  // 容器样式，控制卡片移动动画
  const containerStyle = {
    transition: 'transform 0.2s ease, opacity 0.2s ease',
    marginBottom: '10px',
    touchAction: 'none',
  };

  return (
    <div 
      ref={ref} 
      style={containerStyle}
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
        style={cardStyle}
      >
        <p>{task.description}</p>
        <p style={{ 
          fontSize: '12px', 
          color: task.deadline && task.status !== 2 && new Date() > new Date(task.deadline) ? '#f5222d' : '#888' 
        }}>
          截止日期: {task.deadline ? formatToLocaleString(task.deadline) : '无'}
        </p>
        
        {isDragging && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(24, 144, 255, 0.1)',
            borderRadius: '8px',
            pointerEvents: 'none'
          }} />
        )}
      </Card>
    </div>
  );
});

export default TaskCard;
