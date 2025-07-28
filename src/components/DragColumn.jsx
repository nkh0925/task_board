import React from 'react';
import { useDrop } from 'react-dnd';
import { useStores } from '../utils/hooks';
import { updateTaskStatus as apiUpdateStatus } from '../services/api';

const DragColumn = ({ status, children }) => {
  const { taskStore } = useStores();

  const [{ isOver }, drop] = useDrop({
    accept: 'task',
    drop: (item) => {
      if (item.status === status) return; // 同列不更新
      // 乐观更新
      taskStore.updateTaskStatus(item.task_id, status);
      // 调用API
      apiUpdateStatus({ task_id: item.task_id, status })
        .then(() => {}) // 成功无需额外
        .catch(() => { /* 如果失败，回滚 */ taskStore.updateTaskStatus(item.task_id, item.status); });
    },
    collect: monitor => ({ isOver: !!monitor.isOver() }),
  });

  return <div ref={drop} style={{ background: isOver ? 'lightblue' : 'white', minHeight: '200px' }}>{children}</div>;
};

export default DragColumn;
