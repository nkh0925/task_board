import React from 'react';
import { useDrop } from 'react-dnd';
import { useStores } from '../utils/hooks';

const DragColumn = ({ status, children }) => {
  const { taskStore } = useStores();

  const [{ isOver }, drop] = useDrop({
    accept: 'task',
    drop: (item) => {
      if (item.status === status) return; // 同列不更新
      
      // 调用taskStore的方法，它会处理乐观更新和API调用
      taskStore.updateTaskStatus(item.task_id, status)
        .catch(() => {}); // 错误处理已在store中完成
    },
    collect: monitor => ({ isOver: !!monitor.isOver() }),
  });

  return <div ref={drop} style={{ background: isOver ? 'lightblue' : 'white', minHeight: '200px' }}>{children}</div>;
};

export default DragColumn;
