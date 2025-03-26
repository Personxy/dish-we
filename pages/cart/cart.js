const app = getApp()
const util = require('../../utils/util.js')

Page({
  data: {
    cartItems: [], // 购物车商品
    subtotal: '0.00', // 商品小计
    packagingFee: '2.00', // 包装费
    deliveryFee: '0.00', // 配送费
    totalAmount: '0.00', // 总金额
    remark: '', // 备注
    remarkLength: 0, // 备注长度
    timeArray: [[], []], // 时间选择器数据
    timeIndex: [0, 0], // 时间选择器索引
    selectedTime: '', // 已选择的时间字符串
    isSubmitting: false // 是否正在提交
  },

  onLoad: function () {
    // 初始化时间选择器
    this.initTimePicker()
  },

  onShow: function () {
    // 获取购物车数据
    this.getCartItems()
    
    // 计算价格
    this.calculatePrice()
  },

  // 获取购物车数据
  getCartItems: function () {
    const cartItems = app.globalData.cartItems || []
    this.setData({
      cartItems
    })
  },

  // 计算价格
  calculatePrice: function () {
    const { cartItems, packagingFee, deliveryFee } = this.data
    
    // 计算商品小计
    let subtotal = 0
    cartItems.forEach(item => {
      subtotal += item.price * item.count
    })
    
    // 计算总金额
    const totalAmount = subtotal + parseFloat(packagingFee) + parseFloat(deliveryFee)
    
    this.setData({
      subtotal: subtotal.toFixed(2),
      totalAmount: totalAmount.toFixed(2)
    })
  },

  // 增加商品数量
  increaseItemCount: function (e) {
    const id = e.currentTarget.dataset.id
    let { cartItems } = this.data
    
    const index = cartItems.findIndex(item => item.id === id)
    if (index > -1) {
      cartItems[index].count++
      
      // 更新全局数据
      app.globalData.cartItems = cartItems
      
      this.setData({
        cartItems
      })
      
      // 重新计算价格
      this.calculatePrice()
    }
  },

  // 减少商品数量
  decreaseItemCount: function (e) {
    const id = e.currentTarget.dataset.id
    let { cartItems } = this.data
    
    const index = cartItems.findIndex(item => item.id === id)
    if (index > -1) {
      if (cartItems[index].count > 1) {
        cartItems[index].count--
      } else {
        // 数量为1时，询问是否删除
        wx.showModal({
          title: '提示',
          content: '确定要删除该商品吗？',
          success: (res) => {
            if (res.confirm) {
              cartItems.splice(index, 1)
              
              // 更新全局数据
              app.globalData.cartItems = cartItems
              
              this.setData({
                cartItems
              })
              
              // 重新计算价格
              this.calculatePrice()
            }
          }
        })
        return
      }
      
      // 更新全局数据
      app.globalData.cartItems = cartItems
      
      this.setData({
        cartItems
      })
      
      // 重新计算价格
      this.calculatePrice()
    }
  },

  // 清空购物车
  clearCart: function () {
    wx.showModal({
      title: '提示',
      content: '确定要清空购物车吗？',
      success: (res) => {
        if (res.confirm) {
          // 清空全局购物车数据
          app.globalData.cartItems = []
          
          this.setData({
            cartItems: []
          })
          
          // 重新计算价格
          this.calculatePrice()
        }
      }
    })
  },

  // 备注输入事件
  onRemarkInput: function (e) {
    const remark = e.detail.value
    this.setData({
      remark,
      remarkLength: remark.length
    })
  },

  // 初始化时间选择器
  initTimePicker: function () {
    // 获取当前时间
    const now = new Date()
    const hours = now.getHours()
    const minutes = now.getMinutes()
    
    // 生成小时数组，从当前小时开始到22点结束
    const hoursArr = []
    for (let i = hours; i <= 22; i++) {
      hoursArr.push(i < 10 ? `0${i}` : `${i}`)
    }
    
    // 生成分钟数组，如果是当前小时，则从当前分钟开始，否则从0开始
    const generateMinutesArr = (hour) => {
      const minutesArr = []
      const startMinute = hour == hours ? Math.ceil(minutes / 10) * 10 : 0
      
      for (let i = startMinute; i < 60; i += 10) {
        minutesArr.push(i < 10 ? `0${i}` : `${i}`)
      }
      
      return minutesArr
    }
    
    // 初始小时为当前小时
    const minutesArr = generateMinutesArr(hours)
    
    this.setData({
      timeArray: [hoursArr, minutesArr],
      hoursArr
    })
  },

  // 时间选择器列变化事件
  onTimeColumnChange: function (e) {
    const { column, value } = e.detail
    const { timeArray, timeIndex, hoursArr } = this.data
    
    // 如果是第一列（小时）变化
    if (column === 0) {
      // 重新生成分钟数组
      const selectedHour = parseInt(hoursArr[value])
      const now = new Date()
      const hours = now.getHours()
      
      const minutesArr = []
      const startMinute = selectedHour == hours ? Math.ceil(now.getMinutes() / 10) * 10 : 0
      
      for (let i = startMinute; i < 60; i += 10) {
        minutesArr.push(i < 10 ? `0${i}` : `${i}`)
      }
      
      // 更新分钟数组和索引
      const newTimeArray = [timeArray[0], minutesArr]
      const newTimeIndex = [value, 0]
      
      this.setData({
        timeArray: newTimeArray,
        timeIndex: newTimeIndex
      })
    }
  },

  // 时间选择器确定事件
  onTimeChange: function (e) {
    const { value } = e.detail
    const { timeArray } = this.data
    
    const selectedHour = timeArray[0][value[0]]
    const selectedMinute = timeArray[1][value[1]]
    
    this.setData({
      timeIndex: value,
      selectedTime: `今日 ${selectedHour}:${selectedMinute}`
    })
  },

  // 去点餐
  goToOrder: function () {
    wx.switchTab({
      url: '/pages/order/order'
    })
  },

  // 提交订单
  submitOrder: function () {
    if (this.data.isSubmitting) return
    
    if (this.data.cartItems.length === 0) {
      wx.showToast({
        title: '购物车为空',
        icon: 'none'
      })
      return
    }
    
    this.setData({
      isSubmitting: true
    })
    
    // 构建订单数据
    const orderData = {
      items: this.data.cartItems,
      subtotal: this.data.subtotal,
      packagingFee: this.data.packagingFee,
      deliveryFee: this.data.deliveryFee,
      totalAmount: this.data.totalAmount,
      remark: this.data.remark,
      appointmentTime: this.data.selectedTime || '立即取餐',
      createTime: util.formatTime(new Date()),
      status: '待处理', // 订单状态：待处理、处理中、已完成、已取消
      orderNo: this.generateOrderNo() // 生成订单号
    }
    
    // 这里应该调用API提交订单
    // 模拟提交
    setTimeout(() => {
      // 订单提交成功
      
      // 清空购物车
      app.globalData.cartItems = []
      
      // 缓存订单数据
      let orders = wx.getStorageSync('orders') || []
      orders.push(orderData)
      wx.setStorageSync('orders', orders)
      
      this.setData({
        isSubmitting: false
      })
      
      // 显示成功提示
      wx.showToast({
        title: '下单成功',
        icon: 'success',
        duration: 2000,
        success: () => {
          // 跳转到订单页
          setTimeout(() => {
            wx.navigateTo({
              url: '/pages/myOrder/myOrder'
            })
          }, 1500)
        }
      })
    }, 1000)
  },

  // 生成订单号
  generateOrderNo: function () {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const hour = String(now.getHours()).padStart(2, '0')
    const minute = String(now.getMinutes()).padStart(2, '0')
    const second = String(now.getSeconds()).padStart(2, '0')
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    
    return `${year}${month}${day}${hour}${minute}${second}${random}`
  }
}) 