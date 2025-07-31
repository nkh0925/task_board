import React from 'react';
import { observer } from 'mobx-react';
import { useStores } from '../utils/hooks';
import { SearchBar, Card, InfiniteScroll, Button, Modal } from 'antd-mobile';
import TaskCard from '../components/TaskCard';
import DragColumn from '../components/DragColumn';
import TaskForm from '../components/TaskForm';

const statusMap = { 0: '待办', 1: '进行中', 2: '已完成' };

// 定义 BoardPage 组件，并用 observer 包裹，使其能够响应 MobX store 的变化
const BoardPage = observer(() => {
  // 从 MobX store 中解构出 taskStore
  const { taskStore } = useStores();
  // 使用 useState 管理搜索框的本地关键词状态
  // 这样做可以避免每次输入都触发 MobX 的 setSearchKeyword，减少不必要的 MobX 状态更新和组件重新渲染
  // 真正的 MobX 状态更新会通过防抖函数触发。
  const [localKeyword, setLocalKeyword] = React.useState('');

  // 定义一个防抖的搜索处理函数
  // React.useCallback 确保 handleSearch 函数本身在组件重新渲染时保持不变，避免重复创建防抖函数。
  // _.debounce(taskStore.setSearchKeyword, 500) 创建了一个防抖函数，当用户停止输入 500ms 后才调用 taskStore.setSearchKeyword。
  const handleSearch = React.useCallback(_.debounce((keyword) => {
    taskStore.setSearchKeyword(keyword);
  }, 500), []); // 空依赖项数组，表示这个函数只在组件挂载时创建一次

  // 搜索框输入变化时的处理函数
  const handleInputChange = (value) => {
    setLocalKeyword(value); // 更新本地搜索关键词状态
    handleSearch(value); // 调用防抖搜索函数
  };

  // 根据任务状态分组任务列表
  // taskStore.taskList 是 MobX 的 observable 数组，当它变化时，这里会自动重新计算。
  const groupedTasks = taskStore.taskList.reduce((acc, task) => {
    // 如果 acc[task.status] 不存在，则初始化为一个空数组
    acc[task.status] = acc[task.status] || [];
    // 将任务添加到对应状态的数组中
    acc[task.status].push(task);
    return acc;
  }, {}); // 初始值为一个空对象

  // 显示新增任务 Modal 的函数
  const showAddModal = () => {
    Modal.show({
      // Modal 的内容是 TaskForm 组件，传入 taskStore 和关闭回调
      content: <TaskForm taskStore={taskStore} onClose={() => Modal.clear()} />,
      closeOnMaskClick: true // 点击遮罩层可关闭
    });
  };

  return (
    <div>
      {/* 搜索栏 */}
      <SearchBar
        placeholder="搜索任务"
        value={localKeyword} // 绑定本地关键词状态
        onChange={handleInputChange} // 绑定输入变化处理函数
        style={{ marginBottom: '10px' }}
      />
      {/* 新增任务按钮 */}
      <Button onClick={showAddModal} style={{ marginBottom: '10px' }}>新增任务</Button>

      {/* 看板列容器 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', height: 'calc(100vh - 120px)' }}>
        {/* 遍历 statusMap，为每个状态创建一个看板列 */}
        {Object.keys(statusMap).map(status => (
          <div
            key={status} // 列的 key，使用状态值
            style={{
              width: '32%', // 每列宽度约占三分之一
              height: '100%', // 高度占满父容器
              overflow: 'hidden', // 隐藏溢出内容
              display: 'flex',
              flexDirection: 'column', // 内部内容垂直排列
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)', // 阴影效果
              backgroundColor: '#f5f5f5' // 背景色
            }}
          >
            {/* 列标题，显示状态名称和任务数量 */}
            <div style={{ padding: '12px 16px', fontWeight: 'bold', fontSize: '16px', borderBottom: '1px solid #e8e8e8' }}>
              {statusMap[status]} ({groupedTasks[status]?.length || 0}) {/* 使用可选链操作符 ?. 避免 undefined 错误 */}
            </div>
            {/* 任务卡片容器，可滚动 */}
            <div
              style={{
                flex: 1, // 占据剩余空间
                overflowY: 'auto', // 垂直滚动
                padding: '8px',
              }}
            >
              {/* DragColumn 包裹任务卡片，使其成为拖拽放置目标 */}
              <DragColumn status={parseInt(status)}>
                {/* 渲染当前状态下的所有任务卡片 */}
                {groupedTasks[status]?.map(task => (
                  <TaskCard key={task.task_id} task={task} />
                ))}
                {/* 无限滚动组件 */}
                <InfiniteScroll
                  // 当滚动到底部时，调用 taskStore 的 loadMoreTasksByStatus 方法加载更多该状态的任务
                  loadMore={() => taskStore.loadMoreTasksByStatus(parseInt(status))}
                  // 控制是否还有更多数据可加载，决定是否显示加载指示器
                  hasMore={taskStore.hasMoreByStatus[status] || false}
                />
              </DragColumn>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

export default BoardPage;
