const path = require('path')

const resolve = dir => {
  return path.join(__dirname, dir)
}

module.exports = {
  // lintOnSave: 'error',
  chainWebpack: config => {
    config.resolve.alias
      .set('@', resolve('examples'))
      .set('_c', resolve('examples/components'))
  },

  pages: {
    index: {
      entry: 'examples/main.js',

      title: 'vue组件',

      template: 'public/index.html',

      filename: 'index.html'
    }
  },

  productionSourceMap: false // 打包时不生成.map文件
}
