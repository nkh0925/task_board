import React from 'react';
import styles from './CalendarPage.module.css';
import { Calendar } from 'antd-mobile';

const CalendarPage = () => {
  return (
    <div className={styles.container}>
      <h2 className={styles.pageTitle}>任务日历</h2>
      <div className={styles.calendarWrapper}>
        {/* antd-mobile 的 Calendar 组件 */}
        <Calendar
          selectionMode='single' // 选择模式，这里设置为单选
          // 可以根据需要添加其他 Calendar 的 props，例如：
          // defaultValue={new Date()} // 默认日期
          // min={new Date(2023, 0, 1)} // 最小可选日期
          // max={new Date(2024, 11, 31)} // 最大可选日期
          // onSelect={(date) => console.log('Selected date:', date)}
        />
      </div>
    </div>
  );
};

export default CalendarPage;
