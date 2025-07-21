module.exports = {
  plugins: [
    require('autoprefixer')({
      overrideBrowserslist: [
        'Android 4.1',
        'iOS 7.1',
        'Chrome > 31',
        'ff > 31',
        'ie >= 8',
      ],
    }),
    // 添加 postcss-px-to-viewport 插件
    require('postcss-px-to-viewport')({
      viewportWidth: 750, // 设计稿宽度，antd-mobile 默认是 375px 的两倍，即 750px
      viewportHeight: 1334, // 设计稿高度，可以根据实际情况调整
      unitPrecision: 3, // 指定`px`转换为视口单位值的小数位数
      viewportUnit: 'vw', // 指定需要转换成的视口单位
      selectorBlackList: ['.ignore', '.hairlines'], // 指定不转换为视口单位的类名
      minPixelValue: 1, // 小于或等于`1px`不转换为视口单位
      mediaQuery: false, // 允许在媒体查询中转换`px`
      exclude: [/node_modules/], // 忽略某些文件夹下的文件
    }),
  ],
};
