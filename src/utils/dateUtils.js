// 将 Date 对象或日期字符串转换为 ISO 8601 格式的字符串，以便后端存储
export const convertToIsoString = (date) => {
    if (!date) return null; // 处理 null 或 undefined 输入
    try {
        // 确保它是有效的 Date 对象。如果已经是字符串，new Date(string) 会解析它。
        const d = date instanceof Date ? date : new Date(date);
        // 检查日期是否有效
        if (isNaN(d.getTime())) {
            console.warn("convertToIsoString: Invalid date input received", date);
            return null; // 返回 null，表示无效日期
        }
        // 格式化为 ISO 8601 字符串 (例如 "YYYY-MM-DDTHH:mm:ss.sssZ")
        return d.toISOString();
    } catch (e) {
        console.error("Error in convertToIsoString:", e);
        return null;
    }
};

// 将日期字符串或 Date 对象格式化为本地化的可读字符串，用于显示
export const formatToLocaleString = (dateInput, options = { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) => {
    if (!dateInput) return ''; // 处理 null 或 undefined 输入
    try {
        const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
        if (isNaN(d.getTime())) {
            console.warn("formatToLocaleString: Invalid date input received", dateInput);
            return ''; // 返回空字符串，表示无效日期
        }
        return d.toLocaleString(undefined, options); // undefined 表示使用默认语言环境
    } catch (e) {
        console.error("Error in formatToLocaleString:", e);
        return '';
    }
};
