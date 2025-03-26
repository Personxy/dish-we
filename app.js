App({
  globalData: {
    userInfo: null,
    cartItems: [],
    serverUrl: 'https://api.example.com', // 后端接口地址
    categories: [], // 菜品分类
    dishes: [] // 所有菜品
  },
  
  onLaunch: function() {
    // 获取用户信息
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          wx.getUserInfo({
            success: res => {
              this.globalData.userInfo = res.userInfo
              
              // 如果已经有回调函数，则执行
              if (this.userInfoReadyCallback) {
                this.userInfoReadyCallback(res)
              }
            }
          })
        }
      }
    })
    
    // 加载菜品分类和菜品数据
    this.loadCategoriesAndDishes()
  },
  
  // 加载菜品分类和菜品数据
  loadCategoriesAndDishes: function() {
    // 这里应该通过API获取数据
    // 示例数据
    this.globalData.categories = [
      { id: 1, name: '热菜' },
      { id: 2, name: '凉菜' },
      { id: 3, name: '主食' },
      { id: 4, name: '饮品' }
    ]
    
    this.globalData.dishes = [
      { id: 1, categoryId: 1, name: '宫保鸡丁', price: 28, image: '/images/dish1.png', description: '香辣可口的经典川菜' },
      { id: 2, categoryId: 1, name: '鱼香肉丝', price: 26, image: '/images/dish2.png', description: '传统川菜，咸甜适中' },
      { id: 3, categoryId: 2, name: '凉拌黄瓜', price: 12, image: '/images/dish3.png', description: '清爽可口的开胃菜' },
      { id: 4, categoryId: 3, name: '蛋炒饭', price: 16, image: '/images/dish4.png', description: '香喷喷的家常炒饭' },
      { id: 5, categoryId: 4, name: '柠檬茶', price: 8, image: '/images/dish5.png', description: '清新解腻的饮品' }
    ]
  },
  
  // 添加商品到购物车
  addToCart: function(dish) {
    let cartItems = this.globalData.cartItems
    let found = false
    
    // 查找购物车中是否已有该商品
    for (let i = 0; i < cartItems.length; i++) {
      if (cartItems[i].id === dish.id) {
        cartItems[i].count++
        found = true
        break
      }
    }
    
    // 如果购物车中没有该商品，则添加
    if (!found) {
      cartItems.push({
        ...dish,
        count: 1
      })
    }
  },
  
  // 计算购物车总价
  calculateTotal: function() {
    let total = 0
    let cartItems = this.globalData.cartItems
    
    cartItems.forEach(item => {
      total += item.price * item.count
    })
    
    return total
  }
}) 