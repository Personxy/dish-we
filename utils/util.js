/**
 * 格式化时间
 * @param {Date} date 日期对象
 * @param {String} format 格式字符串
 * @return {String} 格式化后的日期字符串
 */
const formatTime = (date, format = 'YYYY-MM-DD HH:mm:ss') => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  format = format.replace(/YYYY/g, year)
  format = format.replace(/MM/g, formatNumber(month))
  format = format.replace(/DD/g, formatNumber(day))
  format = format.replace(/HH/g, formatNumber(hour))
  format = format.replace(/mm/g, formatNumber(minute))
  format = format.replace(/ss/g, formatNumber(second))

  return format
}

/**
 * 数字补零
 * @param {Number} n 需要格式化的数字
 * @return {String} 格式化后的字符串
 */
const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : `0${n}`
}

/**
 * 显示成功提示
 * @param {String} msg 提示消息
 */
const showSuccess = msg => {
  wx.showToast({
    title: msg,
    icon: 'success'
  })
}

/**
 * 显示失败提示
 * @param {String} msg 提示消息
 */
const showError = msg => {
  wx.showToast({
    title: msg,
    icon: 'error'
  })
}

/**
 * 显示加载提示
 * @param {String} msg 提示消息
 */
const showLoading = (msg = '加载中...') => {
  wx.showLoading({
    title: msg,
    mask: true
  })
}

/**
 * 隐藏加载提示
 */
const hideLoading = () => {
  wx.hideLoading()
}

/**
 * 发起请求
 * @param {Object} options 请求选项
 * @return {Promise} Promise对象
 */
const request = (options) => {
  return new Promise((resolve, reject) => {
    const { url, data, method = 'GET', header = {}, loading = true } = options
    
    if (loading) {
      showLoading()
    }
    
    // 获取app实例
    const app = getApp()
    
    // 拼接完整URL
    const fullUrl = /^https?:\/\//.test(url) ? url : app.globalData.serverUrl + url
    
    wx.request({
      url: fullUrl,
      data,
      method,
      header: {
        'content-type': 'application/json',
        ...header
      },
      success(res) {
        if (loading) {
          hideLoading()
        }
        
        // 可以根据后端接口规范修改
        if (res.statusCode === 200) {
          if (res.data.code === 0) {
            resolve(res.data.data)
          } else {
            showError(res.data.msg || '请求失败')
            reject(res.data)
          }
        } else {
          showError(`网络错误 ${res.statusCode}`)
          reject(res)
        }
      },
      fail(err) {
        if (loading) {
          hideLoading()
        }
        showError('网络请求失败')
        reject(err)
      }
    })
  })
}

/**
 * 价格格式化
 * @param {Number} price 价格
 * @param {String} symbol 货币符号
 * @return {String} 格式化后的价格
 */
const formatPrice = (price, symbol = '¥') => {
  return symbol + price.toFixed(2)
}

module.exports = {
  formatTime,
  formatNumber,
  showSuccess,
  showError,
  showLoading,
  hideLoading,
  request,
  formatPrice
} 