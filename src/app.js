import React, { Suspense, useEffect, useState } from 'react';
import { observer } from 'mobx-react';
import { useStores } from './utils/hooks';
import { SpinLoading } from 'antd-mobile';
import { DndProvider } from 'react-dnd';
import { TouchBackend } from 'react-dnd-touch-backend';
import Sidebar from './components/Common/Sidebar';
import { UnorderedListOutline } from 'antd-mobile-icons';
import _ from 'lodash';
// 引入 BrowserRouter, Routes, Route
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';

const LazyBoardPage = React.lazy(() => import('./pages/BoardPage'));
const LazyCalendarPage = React.lazy(() => import('./pages/CalendarPage')); // 引入日历页面

const AppContent = observer(() => { // 将 App 的内容包装到一个新组件中
  const { taskStore } = useStores();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [localKeyword, setLocalKeyword] = useState('');
  const [filterVisible, setFilterVisible] = useState(false);
  const [currentSort, setCurrentSort] = useState('priority');

  const navigate = useNavigate(); // 获取 navigate 函数
  const location = useLocation(); // 获取当前路径

  const handleSearch = React.useCallback(_.debounce((keyword) => {
    taskStore.setSearchKeyword(keyword);
  }, 500), []);

  const handleInputChange = (value) => {
    setLocalKeyword(value);
    handleSearch(value);
  };

  const handleSortChange = (sortType) => {
    setCurrentSort(sortType);
    taskStore.setSortType(sortType);
    setFilterVisible(false);
  };

  // 菜单项点击事件，用于路由跳转
  const handleMenuItemClick = (path) => {
    navigate(path);
    setIsSidebarOpen(false); // 点击菜单项后关闭 Sidebar
  };

  useEffect(() => {
    console.log('App useEffect triggered: Initial load');
    taskStore.initialLoad();
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <DndProvider backend={TouchBackend}>
      {taskStore.isLoading && (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            zIndex: 9999
        }}>
            <SpinLoading style={{ fontSize: 40 }} />
        </div>
      )}

      <Sidebar
        isOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        localKeyword={localKeyword}
        handleInputChange={handleInputChange}
        filterVisible={filterVisible}
        setFilterVisible={setFilterVisible}
        currentSort={currentSort}
        handleSortChange={handleSortChange}
        taskStore={taskStore}
        handleMenuItemClick={handleMenuItemClick} // 传递菜单项点击处理函数
        currentPath={location.pathname} // 传递当前路径，用于菜单项高亮
      />

      <div style={{
        marginLeft: isSidebarOpen ? '280px' : '0',
        transition: 'margin-left 0.3s ease-in-out',
        flexGrow: 1,
        overflow: 'hidden',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {!isSidebarOpen && (
          <div
            onClick={toggleSidebar}
            style={{
              position: 'fixed',
              top: '15px',
              left: '15px',
              zIndex: 101,
              cursor: 'pointer',
              fontSize: '24px',
              color: '#333'
            }}
          >
            <UnorderedListOutline />
          </div>
        )}

        <Suspense fallback={<SpinLoading style={{ position: 'fixed', top: '50%', left: '50%' }} />}>
          {/* 配置路由 */}
          <Routes>
            <Route path="/" element={<LazyBoardPage />} /> {/* 默认路径为看板页 */}
            <Route path="/board" element={<LazyBoardPage />} />
            <Route path="/calendar" element={<LazyCalendarPage />} />
            {/* 可以添加 404 页面 */}
            <Route path="*" element={<div>404 Not Found</div>} />
          </Routes>
        </Suspense>
      </div>
    </DndProvider>
  );
});

// 真正的 App 组件，用于包裹 BrowserRouter
const App = () => (
  <Router>
    <AppContent />
  </Router>
);

export default App;
