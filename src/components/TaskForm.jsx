import React, { useState } from 'react';
import { Form, Input, Selector, Button } from 'antd-mobile';
import { useStores } from '../utils/hooks';
import { createTask, updateTask } from '../services/api';

const TaskForm = ({ task, onClose }) => {
  const { taskStore } = useStores();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = values => {
    setSubmitting(true);
    // 更新：从数组取单个值（Selector single 返回数组）
    const processedValues = {
      ...values,
      priority: values.priority?.[0], // 取第一个（或 undefined）
      status: values.status?.[0] // 取第一个（或 undefined）
    };
    const apiCall = task ? updateTask({ task_id: task.task_id, ...processedValues }) : createTask(processedValues);
    apiCall
      .then(res => {
        if (task) {
          taskStore.updateTask({ task_id: task.task_id, ...processedValues });
        } else {
          taskStore.addTask({ task_id: res.task_id, ...processedValues }); // 修正：从 createTask 改为 addTask（匹配 store）
        }
        onClose();
      })
      .catch(() => {})
      .finally(() => setSubmitting(false));
  };

  // 更新：initialValues 用数组包装（修复 Selector 错误）
  const initialValues = task
    ? { ...task, priority: [task.priority], status: [task.status] }
    : { priority: [2], status: [0] };

  return (
    <Form form={form} onFinish={handleSubmit} initialValues={initialValues}>
      <Form.Item name="title" label="标题" rules={[{ required: true, message: '标题不能为空' }]}>
        <Input />
      </Form.Item>
      <Form.Item name="description" label="描述">
        <Input />
      </Form.Item>
      <Form.Item 
        name="priority" 
        label="优先级" 
        valuePropName="value" // 新增：确保 Form 绑定 value 正确
        rules={[{ required: true, message: '请选择优先级' }]} // 更新：加强规则
      >
        <Selector 
          multiple={false} 
          options={[{ label: '低', value: 1 }, { label: '中', value: 2 }, { label: '高', value: 3 }]} 
        />
      </Form.Item>
      <Form.Item 
        name="status" 
        label="状态" 
        valuePropName="value" // 新增：确保 Form 绑定 value 正确
        rules={[{ required: true, message: '请选择状态' }]} // 更新：加强规则
      >
        <Selector 
          multiple={false} 
          options={[{ label: '待办', value: 0 }, { label: '进行中', value: 1 }, { label: '已完成', value: 2 }]} 
        />
      </Form.Item>
      <Button type="submit" disabled={submitting}>提交</Button>
    </Form>
  );
};

export default TaskForm;
