// src/components/TaskCard.jsx
import React, { useState, useRef } from 'react';
import { Card, Modal, Popover, Button } from 'antd-mobile';
import { MoreOutline, EditSOutline, DeleteOutline, InformationCircleOutline } from 'antd-mobile-icons';
import { observer } from 'mobx-react';
import { useStores } from '../utils/hooks';
import { useDrag, useDrop } from 'react-dnd';
import TaskForm from './TaskForm';
import { formatToLocaleString } from '../utils/dateUtils';

const priorityMap = { 1: '低', 2: '中',  3: '高' };
const priorityBorderColors = {
  1: '#52c41a', // 绿色 - 低优先级
  2: '#faad14', // 橙色 - 中优先级
  3: '#f5222d'  // 红色 - 高优先级
};

const TaskCard = observer(({ task }) => {
  const { taskStore } = useStores();
  const [visible, setVisible] = useState(false); // 控制 Popover 的可见性
  const ref = useRef(null); // 用于绑定 DND 的 DOM 引用

  // =========================== DND DRAG ===========================
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'task',
    item: { task_id: task.task_id, status: task.status }, // 拖拽时传递任务 ID 和原始状态
    collect: monitor => ({ isDragging: monitor.isDragging() }),
  }), [task.task_id, task.status]); // 依赖项，确保当 task 变化时 useDrag 更新

  // =========================== DND DROP ===========================
  const [, drop] = useDrop({
    accept: 'task',
    // hover 在被拖拽项在目标上方移动时持续触发
    hover(item, monitor) {
      if (!ref.current) {
        return;
      }
      const draggedId = item.task_id; // 被拖拽的任务 ID
      const hoveredId = task.task_id; // 当前悬停的任务 ID

      // 如果拖拽的是自身，则不处理
      if (draggedId === hoveredId) {
        return;
      }

      // 确定悬停目标的矩形边界
      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      // 计算垂直中线
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      // 获取鼠标在屏幕上的位置
      const clientOffset = monitor.getClientOffset();
      // 获取鼠标相对于悬停目标顶部的垂直位置
      const hoverClientY = (clientOffset).y - hoverBoundingRect.top;

      // 判断是插入到目标任务之前 (true) 还是之后 (false)
      const isBefore = hoverClientY < hoverMiddleY;

      // 只有当拖拽项的当前状态（或其 `status` 在 `item` 中的值）与目标任务的状态不同，
      // 或在同一列内移动时，才触发移动操作。
      // 此处的 `moveTask` 实现了乐观更新，会在本地立即反映出排序变化。
      taskStore.moveTask(draggedId, hoveredId, task.status, isBefore);

      // (可选) 优化：如果性能有问题，可以通过检查 item.status 是否已经等于 task.status
      // 以及 item.order_index 与 task.order_index 的相对位置来减少不必要的 moveTask 调用。
      // 但是 MobX 的 `runInAction` 和 `sortTaskList` 已经相对高效。
    },
    // drop 在拖拽结束时触发，但如果 hover 已经处理了 API 调用，这里可以为空
    drop(item, monitor) {
      // 可以在这里进行一些清理或最终确认，但实际的 moveTask 已经在 hover 中触发
    }
  });

  // 将 drag 和 drop 的 ref 绑定到同一个 DOM 元素上
  drag(drop(ref));

  // 处理删除任务的函数
  const handleDelete = () => {
    setVisible(false); // 关闭 Popover
    Modal.confirm({
      content: '确认删除？',
      onConfirm: () => {
        taskStore.deleteTask(task.task_id);
      }
    });
  };

  // 显示编辑任务 Modal 的函数
  const showEditModal = () => {
    setVisible(false); // 关闭 Popover
    Modal.show({
      content: <TaskForm task={task} taskStore={taskStore} onClose={() => Modal.clear()} />,
      closeOnMaskClick: true
    });
  };

  // 显示任务详情 Modal 的函数 (同上文已修改)
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

  // Popover 中的操作菜单项
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
      ref={ref} // 绑定 ref
      style={{
        opacity: isDragging ? 0.5 : 1,
        marginBottom: '10px',
        cursor: 'grab', // 鼠标样式指示可拖拽
      }}
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
        style={{
          borderLeft: `5px solid ${priorityBorderColors[task.priority] || '#ccc'}`
        }}
      >
        <p>{task.description}</p>
        <p style={{ fontSize: '12px', color: '#888' }}>
          截止日期: {task.deadline ? formatToLocaleString(task.deadline) : '无'}
        </p>
      </Card>
    </div>
  );
});

export default TaskCard;
