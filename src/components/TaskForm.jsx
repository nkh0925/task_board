// src/components/TaskForm.jsx
import React, { useState } from 'react';
import { Form, Input, Selector, Button, DatePicker } from 'antd-mobile'; // 引入 DatePicker
import { convertToIsoString, formatToLocaleString } from '../utils/dateUtils'; // 引入日期工具函数

const TaskForm = ({ task, onClose, taskStore }) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  // 控制 DatePicker 的显示状态
  const [showDatePicker, setShowDatePicker] = useState(false);
  // 存储选中的截止日期，初始化时如果 task 存在则使用其 deadline，否则为 null
  const [selectedDeadline, setSelectedDeadline] = useState(task?.deadline ? new Date(task.deadline) : null);

  const handleSubmit = async (values) => {
    setSubmitting(true);

    const processedValues = {
      title: values.title,
      description: values.description || '',
      priority: Number(Array.isArray(values.priority) ? values.priority[0] : values.priority),
      status: Number(Array.isArray(values.status) ? values.status[0] : values.status),
      // 将 selectedDeadline（Date 对象）转换为 ISO 字符串格式，以便后端存储
      deadline: convertToIsoString(selectedDeadline)
    };

    console.log('Processed values:', processedValues);

    try {
      if (task) {
        await taskStore.updateTask({ task_id: task.task_id, ...processedValues });
      } else {
        await taskStore.createTask(processedValues);
      }
      onClose(); // 提交成功后关闭 Modal
    } catch (error) {
      console.error('Form submission error:', error);
      // 错误提示已在 api.js 和 TaskStore 中处理
    } finally {
      setSubmitting(false);
    }
  };

  // 表单初始值设置：priority 和 status 需要包装在数组中以适应 Selector
  const initialValues = task
    ? { ...task, priority: [task.priority], status: [task.status] }
    : { priority: [2], status: [0] }; // 新建任务时的默认值

  return (
    <Form form={form} onFinish={handleSubmit} initialValues={initialValues}>
      <Form.Item name="title" label="标题" rules={[{ required: true, message: '标题不能为空' }]}>
        <Input placeholder='请输入任务标题' />
      </Form.Item>
      <Form.Item name="description" label="描述">
        <Input placeholder='请输入任务描述' />
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

      {/* 新增截止日期 Form.Item */}
      <Form.Item
        label='截止日期'
        // 点击 Form.Item 时显示 DatePicker
        onClick={() => {
          setShowDatePicker(true);
        }}
      >
        <Input
          readOnly // 设置为只读，通过 DatePicker 更改值
          placeholder='请选择截止日期'
          // 显示 selectedDeadline 的本地化字符串
          value={selectedDeadline ? formatToLocaleString(selectedDeadline) : ''}
        />
      </Form.Item>
      <DatePicker
        visible={showDatePicker} // 控制 DatePicker 的可见性
        onClose={() => setShowDatePicker(false)} // 关闭回调
        onConfirm={(val) => { // 确认选择日期后的回调
          setSelectedDeadline(val); // 更新 selectedDeadline 状态
          setShowDatePicker(false); // 关闭 DatePicker
        }}
        precision='minute' // 日期选择精度到分钟
        min={new Date()} // 截止日期不能早于当前时间 (可选，根据业务需求调整)
        // 初始值：如果是编辑模式，使用 task.deadline；否则为 null
        defaultValue={task?.deadline ? new Date(task.deadline) : null}
      />

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
