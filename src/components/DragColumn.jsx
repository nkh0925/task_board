import React from 'react';
import { useDrop } from 'react-dnd';
import { useStores } from '../utils/hooks';

const DragColumn = ({ status, children }) => {
  const { taskStore } = useStores();

  const [{ isOver }, drop] = useDrop({
    accept: 'task',
    // drop 触发时，monitor.didDrop() 会告知是否被嵌套的 drop target 处理
    drop: (item, monitor) => {
      const didDrop = monitor.didDrop();
      if (didDrop) {
        return; // 如果被TaskCard处理了，则不在这里重复处理
      }

      if (item.task_id) {
        taskStore.moveTask(item.task_id, null, status, false); // targetId: null 表示移动到列尾
      }
    },
    collect: monitor => ({ isOver: monitor.isOver({ shallow: true }) }),
  });

  return (
    <div
      ref={drop} // 绑定 drop target
      style={{
        background: isOver ? 'rgba(0, 191, 255, 0.1)' : '#f5f5f5', // 悬停时背景变化
        minHeight: '200px', // 确保空列也有拖拽区域
        flex: 1,
        padding: '8px',
        borderRadius: '8px',
        border: isOver ? '2px dashed lightblue' : 'none' // 添加边框反馈
      }}
    >
      {children}
    </div>
  );
};

export default DragColumn;
