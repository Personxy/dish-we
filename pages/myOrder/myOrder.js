const app = getApp()

Page({
  data: {
    orders: [], // 所有订单
    filteredOrders: [], // 筛选后的订单
    currentStatus: '', // 当前选中的状态筛选
    searchKeyword: '', // 搜索关键字
    showOrderDetail: false, // 是否显示订单详情
    currentOrder: {} // 当前选中的订单
  },

  onLoad: function () {
    
  },

  onShow: function () {
    this.loadOrders()
  },

  // 加载订单数据
  loadOrders: function () {
    // 从本地存储获取订单数据
    const orders = wx.getStorageSync('orders') || []
    
    // 处理订单数据，添加滑动参数和商品概要
    const processedOrders = orders.map(order => {
      // 添加滑动参数
      order.x = 0
      
      // 生成商品概要
      const itemNames = order.items.map(item => item.name)
      const itemSummary = itemNames.join('、')
      
      return {
        ...order,
        itemSummary: itemSummary.length > 20 ? 
          itemSummary.substring(0, 20) + '...' : 
          itemSummary
      }
    })
    
    this.setData({
      orders: processedOrders
    })
    
    // 应用当前筛选
    this.applyFilter()
  },

  // 应用筛选和搜索
  applyFilter: function () {
    let { orders, currentStatus, searchKeyword } = this.data
    
    // 筛选状态
    let filtered = orders
    if (currentStatus) {
      filtered = filtered.filter(order => order.status === currentStatus)
    }
    
    // 搜索关键字
    if (searchKeyword) {
      filtered = filtered.filter(order => 
        order.orderNo.indexOf(searchKeyword) > -1 ||
        order.itemSummary.indexOf(searchKeyword) > -1
      )
    }
    
    this.setData({
      filteredOrders: filtered
    })
  },

  // 按状态筛选
  filterByStatus: function (e) {
    const status = e.currentTarget.dataset.status
    this.setData({
      currentStatus: status
    })
    this.applyFilter()
  },

  // 搜索输入
  onSearchInput: function (e) {
    this.setData({
      searchKeyword: e.detail.value
    })
  },

  // 搜索
  onSearch: function () {
    this.applyFilter()
  },

  // 清除搜索
  clearSearch: function () {
    this.setData({
      searchKeyword: ''
    })
    this.applyFilter()
  },

  // 处理滑动变化
  handleMovableViewChange: function (e) {
    const { x } = e.detail
    const { index } = e.currentTarget.dataset
    
    // 当滑动超过一定距离时，显示删除按钮
    if (x < -70) {
      let { filteredOrders } = this.data
      filteredOrders[index].x = -150
      this.setData({
        filteredOrders
      })
    }
  },

  // 处理触摸结束
  handleTouchEnd: function (e) {
    const { index } = e.currentTarget.dataset
    let { filteredOrders } = this.data
    
    // 根据当前x值决定是否显示删除按钮
    if (filteredOrders[index].x < -75) {
      filteredOrders[index].x = -150
    } else {
      filteredOrders[index].x = 0
    }
    
    this.setData({
      filteredOrders
    })
  },

  // 删除订单
  deleteOrder: function (e) {
    const orderNo = e.currentTarget.dataset.orderNo
    
    wx.showModal({
      title: '提示',
      content: '确定删除该订单？',
      success: (res) => {
        if (res.confirm) {
          // 从本地存储中删除订单
          let orders = wx.getStorageSync('orders') || []
          orders = orders.filter(order => order.orderNo !== orderNo)
          wx.setStorageSync('orders', orders)
          
          // 更新页面数据
          this.setData({
            orders: orders
          })
          
          // 应用筛选
          this.applyFilter()
          
          wx.showToast({
            title: '删除成功',
            icon: 'success'
          })
        }
      }
    })
  },

  // 取消订单
  cancelOrder: function (e) {
    const orderNo = e.currentTarget.dataset.orderNo
    
    wx.showModal({
      title: '提示',
      content: '确定取消该订单？',
      success: (res) => {
        if (res.confirm) {
          // 从本地存储中更新订单状态
          let orders = wx.getStorageSync('orders') || []
          const index = orders.findIndex(order => order.orderNo === orderNo)
          
          if (index > -1) {
            orders[index].status = '已取消'
            wx.setStorageSync('orders', orders)
            
            // 更新页面数据
            this.setData({
              orders: orders
            })
            
            // 应用筛选
            this.applyFilter()
            
            wx.showToast({
              title: '订单已取消',
              icon: 'success'
            })
          }
        }
      }
    })
  },

  // 显示订单详情
  showOrderDetail: function (e) {
    const order = e.currentTarget.dataset.order
    
    this.setData({
      currentOrder: order,
      showOrderDetail: true
    })
  },

  // 关闭订单详情
  closeOrderDetail: function () {
    this.setData({
      showOrderDetail: false
    })
  },

  // 取消当前订单
  cancelCurrentOrder: function () {
    const orderNo = this.data.currentOrder.orderNo
    
    wx.showModal({
      title: '提示',
      content: '确定取消该订单？',
      success: (res) => {
        if (res.confirm) {
          // 从本地存储中更新订单状态
          let orders = wx.getStorageSync('orders') || []
          const index = orders.findIndex(order => order.orderNo === orderNo)
          
          if (index > -1) {
            orders[index].status = '已取消'
            wx.setStorageSync('orders', orders)
            
            // 更新当前订单状态
            const currentOrder = this.data.currentOrder
            currentOrder.status = '已取消'
            
            // 更新页面数据
            this.setData({
              orders: orders,
              currentOrder: currentOrder
            })
            
            // 应用筛选
            this.applyFilter()
            
            wx.showToast({
              title: '订单已取消',
              icon: 'success'
            })
          }
        }
      }
    })
  },

  // 再来一单
  reorder: function () {
    const { items } = this.data.currentOrder
    
    // 清空当前购物车
    app.globalData.cartItems = []
    
    // 将订单中的商品添加到购物车
    items.forEach(item => {
      app.globalData.cartItems.push({
        ...item
      })
    })
    
    // 关闭弹窗
    this.closeOrderDetail()
    
    // 跳转到购物车页面
    wx.navigateTo({
      url: '/pages/cart/cart'
    })
  },

  // 去点餐
  goToOrder: function () {
    wx.switchTab({
      url: '/pages/order/order'
    })
  }
}) 