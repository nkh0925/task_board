// src/components/Sidebar/Sidebar.jsx
import React from 'react';
import styles from './Sidebar.module.css';
import { CloseOutline, AddOutline, DownOutline, RightOutline, AppOutline, CalendarOutline, SearchOutline } from 'antd-mobile-icons'; // 引入更多图标
import { SearchBar, Popover, Button, Modal } from 'antd-mobile';
import TaskForm from '../../components/TaskForm';

// 排序选项保持不变
const sortOptions = [
  { key: 'priority', label: '按优先级排序' },
  { key: 'createTime', label: '按创建时间排序' },
  { key: 'deadline', label: '按截止时间排序' }
];

const Sidebar = ({
  isOpen,
  toggleSidebar,
  localKeyword,
  handleInputChange,
  filterVisible,
  setFilterVisible,
  currentSort,
  handleSortChange,
  taskStore,
  handleMenuItemClick,
  currentPath
}) => {
  // 新增状态：控制看板子菜单的展开/收起
  const [showBoardSubMenu, setShowBoardSubMenu] = React.useState(true); // 默认展开

  const showAddModal = () => {
    Modal.show({
      content: <TaskForm
        taskStore={taskStore}
        onClose={() => Modal.clear()}
        initialValues={{ status: 0 }}
      />,
      closeOnMaskClick: true
    });
  };

  return (
    <div className={`${styles.sidebarContainer} ${isOpen ? styles.open : ''}`}>
      <div className={styles.sidebarContent}>
        <div className={styles.sidebarHeader}>
          <h3>菜单</h3>
          <CloseOutline className={styles.closeButton} onClick={toggleSidebar} />
        </div>

        {/* 搜索栏不再直接在顶层，而是移入子菜单 */}
        {/* <div className={styles.searchBarContainer}>...</div> */}

        <ul className={styles.menuList}>
          {/* 看板父级菜单项 */}
          <li className={styles.menuItem}>
            <div
              className={`${styles.menuItemFlex} ${styles.parentMenuItem} ${showBoardSubMenu ? styles.expanded : ''}`}
              onClick={() => setShowBoardSubMenu(!showBoardSubMenu)} // 点击展开/收起
            >
              <AppOutline className={styles.menuIcon} /> {/* 看板图标 */}
              <span>看板</span>
              {showBoardSubMenu ? <DownOutline className={styles.expandIcon} /> : <RightOutline className={styles.expandIcon} />}
            </div>
            {/* 看板子菜单 */}
            {showBoardSubMenu && (
              <ul className={styles.subMenu}>
                {/* 搜索子菜单项 */}
                <li className={styles.subMenuItem}>
                  <div className={styles.subMenuItemContent}>
                    <SearchOutline className={styles.menuIcon} /> {/* 搜索图标 */}
                    <SearchBar
                      placeholder="搜索任务"
                      value={localKeyword}
                      onChange={handleInputChange}
                      className={styles.subSearchBar} // 使用新的样式类
                      onFocus={() => { /* 可以选择在此处阻止事件冒泡 */ }}
                      onBlur={() => { /* 可以选择在此处阻止事件冒泡 */ }}
                    />
                  </div>
                </li>
                {/* 添加任务子菜单项 */}
                <li className={styles.subMenuItem} onClick={showAddModal}>
                  <AddOutline className={styles.menuIcon} /> {/* 添加图标 */}
                  <span>添加任务</span>
                </li>
                {/* 排序筛选子菜单项 */}
                <li className={styles.subMenuItem}>
                  <Popover
                    visible={filterVisible}
                    onVisibleChange={setFilterVisible}
                    content={
                      <div className={styles.filterOptions}>
                        {sortOptions.map(option => (
                          <div
                            key={option.key}
                            onClick={(e) => { e.stopPropagation(); handleSortChange(option.key); }}
                            className={`${styles.filterOption} ${currentSort === option.key ? styles.filterOptionActive : ''}`}
                          >
                            <span>{option.label}</span>
                          </div>
                        ))}
                      </div>
                    }
                    trigger='click'
                    placement='bottomRight'
                  >
                    <div className={styles.subMenuItemContent}>
                      <DownOutline className={styles.menuIcon} /> {/* 筛选图标 */}
                      <span>筛选视图</span>
                    </div>
                  </Popover>
                </li>
              </ul>
            )}
          </li>

          {/* 日历选项 */}
          <li
            className={`${styles.menuItem} ${currentPath === '/calendar' ? styles.menuItemActive : ''}`}
            onClick={() => handleMenuItemClick('/calendar')}
          >
            <CalendarOutline className={styles.menuIcon} /> {/* 日历图标 */}
            <span>日历</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;
