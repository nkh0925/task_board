module.exports = {
  // `plugins` 数组定义了要使用的 PostCSS 插件列表
  plugins: [
    // 插件1: autoprefixer
    // require('autoprefixer') 引入 autoprefixer 插件
    // autoprefixer 会根据 caniuse.com 的数据，自动为 CSS 属性添加浏览器前缀
    // 例如：display: flex; 可能会被转换为 display: -webkit-flex; display: flex;
    // 这大大简化了跨浏览器兼容性的处理，开发者无需手动添加各种前缀
    require('autoprefixer'),

    // 插件2: postcss-px-to-viewport
    // require('postcss-px-to-viewport') 引入此插件
    // 这个插件的核心功能是将 CSS 中的 px 单位转换为 vw (viewport width) 单位
    // 这对于移动端 H5 页面的适配非常有用，可以实现一套代码在不同屏幕宽度下等比例缩放的效果
    require('postcss-px-to-viewport')({
      // viewportWidth: 设计稿的宽度
      // 这里的 750 表示设计稿是基于 750px 宽度的设备（例如 iPhone 6/7/8 Plus 的双倍分辨率为 414*2=828，通常会用750或720作为设计稿宽度）
      // 插件会根据这个值，将 px 值转换为相应的 vw 值
      // 例如，如果设计稿上一个元素是 100px 宽，那么转换后会是 (100 / 750) * 100 vw ≈ 13.33vw
      viewportWidth: 750,

      // unitPrecision: 转换后 vw 值的精度（小数点后保留的位数）
      // 5 表示保留 5 位小数，确保转换的精确性
      unitPrecision: 5,

      // viewportUnit: 指定要转换的目标单位
      // 这里设置为 'vw'，表示将 px 转换为 vw
      viewportUnit: 'vw',

      // selectorBlackList: 不需要转换 px 的 CSS 选择器黑名单
      // 数组中的字符串可以是正则表达式或普通字符串。匹配到的选择器中的 px 不会被转换
      // 例如：['.ignore-px'] 或 [/^(ignore-px)$/]
      // 这里是空数组，表示所有选择器中的 px 都会被尝试转换
      selectorBlackList: [],

      // minPixelValue: 最小转换的像素值
      // 小于或等于这个值的 px 不会被转换（通常用于边框、1px 线等，防止转换后出现精度问题或显示模糊）
      // 1 表示只有大于 1px 的值才会被转换，1px 不会被转换
      minPixelValue: 1,

      // mediaQuery: 是否在媒体查询中也进行 px 到 vw 的转换
      // false 表示不转换媒体查询中的 px 值，这通常是希望媒体查询保持固定像素定义时的情况
      mediaQuery: false
    })
  ]
};
