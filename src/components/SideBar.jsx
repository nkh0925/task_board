import React, { useState } from 'react';
import { SearchBar, Button } from 'antd-mobile';
import { LeftOutline, RightOutline } from 'antd-mobile-icons';
import styles from './SideBar.module.css';

const SideBar = ({ onSearch }) => {
  const [expanded, setExpanded] = useState(true);
  const [keyword, setKeyword] = useState('');

  const handleSearch = (value) => {
    setKeyword(value);
    onSearch(value);
  };

  return (
    <div className={`${styles.sidebar} ${expanded ? styles.expanded : styles.collapsed}`}>
      <Button
        className={styles.toggleButton}
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? <LeftOutline /> : <RightOutline />}
      </Button>
      
      {expanded && (
        <div className={styles.sidebarContent}>
          <SearchBar
            placeholder="搜索任务"
            value={keyword}
            onChange={handleSearch}
          />
        </div>
      )}
    </div>
  );
};

export default SideBar;
