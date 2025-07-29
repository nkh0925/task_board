import React, { useState } from 'react';
import { Form, Input, Selector, Button } from 'antd-mobile';

const TaskForm = ({ task, onClose,taskStore }) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

const handleSubmit = async (values) => {
  setSubmitting(true); // 提交时设置为 true，禁用按钮
  
  // 确保转换为数字类型
  const processedValues = {
    title: values.title,
    description: values.description || '',
    priority: Number(Array.isArray(values.priority) ? values.priority[0] : values.priority),
    status: Number(Array.isArray(values.status) ? values.status[0] : values.status)
  };
  
  console.log('Processed values:', processedValues); // 添加这行来检查处理后的值
  
  try {
    if (task) {
      await taskStore.updateTask({ task_id: task.task_id, ...processedValues });
    } else {
      await taskStore.createTask(processedValues);
    }
    onClose();
  } catch (error) {
    console.error('Form submission error:', error);
  } finally {
    setSubmitting(false); // 无论成功或失败，最后都设置为 false，启用按钮
  }
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
        valuePropName="value"
        rules={[{ required: true, message: '请选择优先级' }]}
      >
        <Selector 
          multiple={false} 
          options={[{ label: '低', value: 1 }, { label: '中', value: 2 }, { label: '高', value: 3 }]} 
        />
      </Form.Item>
      <Form.Item 
        name="status" 
        label="状态" 
        valuePropName="value"
        rules={[{ required: true, message: '请选择状态' }]}
      >
        <Selector 
          multiple={false} 
          options={[{ label: '待办', value: 0 }, { label: '进行中', value: 1 }, { label: '已完成', value: 2 }]} 
        />
      </Form.Item>
      <Form.Item>
        <Button 
          block 
          type="submit"
          color="primary" 
          loading={submitting}
          disabled={submitting}
        >
          提交
        </Button>
      </Form.Item>
    </Form>
  );
};

export default TaskForm;
