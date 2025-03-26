const app = getApp()

Page({
  data: {
    userInfo: {},
    hasUserInfo: false,
    canIUseGetUserProfile: false,
    isAdmin: false,
    cartCount: 0,
    recommendDishes: [],
    notice: '',
    showDishDetail: false,
    currentDish: {}
  },
  
  onLoad() {
    if (wx.getUserProfile) {
      this.setData({
        canIUseGetUserProfile: true
      })
    }
    
    // 检查是否有用户信息
    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo,
        hasUserInfo: true
      })
      this.checkIsAdmin()
    } else if (this.data.canIUseGetUserProfile) {
      app.userInfoReadyCallback = res => {
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        })
        this.checkIsAdmin()
      }
    }
    
    // 获取推荐菜品
    this.getRecommendDishes()
  },
  
  onShow() {
    // 更新购物车数量
    this.updateCartCount()
  },
  
  // 获取用户信息
  getUserProfile() {
    wx.getUserProfile({
      desc: '用于完善会员资料',
      success: (res) => {
        app.globalData.userInfo = res.userInfo
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        })
        this.checkIsAdmin()
      }
    })
  },
  
  // 检查是否为管理员
  checkIsAdmin() {
    // 这里可以根据实际需求来判断是否为管理员
    // 示例：假设微信昵称包含"admin"则为管理员
    // const isAdmin = this.data.userInfo.nickName && this.data.userInfo.nickName.toLowerCase().includes('admin')
    const isAdmin='admin'
    this.setData({
      isAdmin
    })
  },
  
  // 获取推荐菜品
  getRecommendDishes() {
    // 这里应该从服务器获取推荐菜品
    // 示例：从app.globalData中获取前3个菜品作为推荐
    const recommendDishes = app.globalData.dishes.slice(0, 3)
    this.setData({
      recommendDishes
    })
  },
  
  // 更新购物车数量
  updateCartCount() {
    const cartItems = app.globalData.cartItems
    let count = 0
    
    cartItems.forEach(item => {
      count += item.count
    })
    
    this.setData({
      cartCount: count
    })
  },
  
  // 导航到点餐页面
  navigateToOrder() {
    wx.switchTab({
      url: '/pages/order/order'
    })
  },
  
  // 导航到购物车页面
  navigateToCart() {
    wx.navigateTo({
      url: '/pages/cart/cart'
    })
  },
  
  // 导航到我的订单页面
  navigateToMyOrder() {
    wx.switchTab({
      url: '/pages/myOrder/myOrder'
    })
  },
  
  // 导航到菜品管理页面
  navigateToDishManage() {
    wx.navigateTo({
      url: '/pages/dishManage/dishManage'
    })
  },
  
  // 显示菜品详情
  showDishDetail(e) {
    const dish = e.currentTarget.dataset.dish
    this.setData({
      currentDish: dish,
      showDishDetail: true
    })
  },
  
  // 关闭菜品详情
  closeDishDetail() {
    this.setData({
      showDishDetail: false
    })
  },
  
  // 添加到购物车
  addToCart() {
    app.addToCart(this.data.currentDish)
    this.updateCartCount()
    this.closeDishDetail()
    
    wx.showToast({
      title: '已加入购物车',
      icon: 'success'
    })
  }
})