import React from 'react';
import { useDrop } from 'react-dnd';
import { useStores } from '../utils/hooks';

const DragColumn = ({ status, children }) => {
  const { taskStore } = useStores();

  const [{ isOver }, drop] = useDrop({
    accept: 'task',
    drop: (item, monitor) => {
      const didDrop = monitor.didDrop();
      if (didDrop) {
        return; // 如果被TaskCard处理了，则不在这里重复处理
      }

      // 修复：无论列是否为空，都确保处理拖拽
      const draggedTask = taskStore.taskList.find(t => t.task_id === item.task_id);
      if (draggedTask && draggedTask.status !== status) {
        // 如果状态发生变化，调用moveTask并保存位置
        taskStore.moveTask(item.task_id, null, status, false);
        taskStore.saveTaskPosition(item.task_id, status, 0); // 放在列表开头
      }
    },
    collect: monitor => ({ isOver: monitor.isOver({ shallow: true }) }),
  });

  return (
    <div
      ref={drop}
      style={{
        background: isOver ? 'rgba(0, 191, 255, 0.1)' : '#f5f5f5',
        minHeight: '200px',
        flex: 1,
        padding: '8px',
        borderRadius: '8px',
        border: isOver ? '2px dashed lightblue' : 'none'
      }}
    >
      {children}
    </div>
  );
};

export default DragColumn;
