const app = getApp();
import api from "../../utils/api";

Page({
  data: {
    userInfo: {},
    hasUserInfo: false,
    canIUseGetUserProfile: false,
    isAdmin: false,
    cartCount: 0,
    recommendDishes: [],
    notice: "",
    showDishDetail: false,
    currentDish: {},
    isLoading: false,
    pageLoading: true, // 添加页面加载状态
  },

  onTabItemTap(item) {
    // tab 点击时执行
    console.log(item.index)
    console.log(item.pagePath)
    console.log(item.text)
  },
  onLoad() {
    // 检查是否有用户信息
    console.log(app.globalData.userInfo);
    if (app.globalData.userInfo) {
      // 如果 app.globalData.userInfo 已经有值，直接使用
      this.setData({
        userInfo: app.globalData.userInfo,
        hasUserInfo: true,
        pageLoading: false, // 数据加载完成
      });
      this.checkIsAdmin();
    } else {
      // 如果 app.globalData.userInfo 还没有值，注册回调函数
      app.globalData.userInfoReadyCallback = (userInfo) => {
        this.setData({
          userInfo: userInfo,
          hasUserInfo: true,
          pageLoading: false, // 数据加载完成
        });
        this.checkIsAdmin();
      };

      // 设置超时，避免长时间加载
      setTimeout(() => {
        if (this.data.pageLoading) {
          this.setData({
            pageLoading: false,
          });
        }
      }, 3000); // 3秒后无论如何都结束加载状态
    }

    // 获取推荐菜品
    this.getRecommendDishes();
  },

  onShow() {
    // 更新购物车数量
    this.updateCartCount();
    
    // 获取最新的用户信息
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.setData({
        userInfo: userInfo,
        hasUserInfo: true
      });
    }
  },

  // 更新用户信息到服务器
  updateUserInfo(userInfo) {
    _updateUserInfo(userInfo).catch((err) => {
      console.error("更新用户信息失败", err);
    });
  },

  // 检查是否为管理员
  checkIsAdmin() {
    // 这里可以根据实际需求来判断是否为管理员
    // 示例：假设微信昵称包含"admin"则为管理员
    // const isAdmin = this.data.userInfo.nickName && this.data.userInfo.nickName.toLowerCase().includes('admin')
    const isAdmin = "admin";
    this.setData({
      isAdmin,
    });
  },

  // 获取推荐菜品
  getRecommendDishes() {
    // 这里应该从服务器获取推荐菜品
    // 示例：从app.globalData中获取前3个菜品作为推荐
    const recommendDishes = app.globalData.dishes.slice(0, 3);
    this.setData({
      recommendDishes,
    });
  },

  // 更新购物车数量
  updateCartCount() {
    const cartItems = app.globalData.cartItems;
    let count = 0;

    cartItems.forEach((item) => {
      count += item.count;
    });

    this.setData({
      cartCount: count,
    });
  },

  // 导航到点餐页面
  navigateToOrder() {
    wx.switchTab({
      url: "/pages/order/order",
    });
  },

  // 导航到购物车页面
  navigateToCart() {
    wx.navigateTo({
      url: "/pages/cart/cart",
    });
  },

  // 导航到我的订单页面
  navigateToMyOrder() {
    wx.switchTab({
      url: "/pages/myOrder/myOrder",
    });
  },

  // 导航到菜品管理页面
  navigateToDishManage() {
    wx.navigateTo({
      url: "/pages/dishManage/dishManage",
    });
  },

  // 显示菜品详情
  showDishDetail(e) {
    const dish = e.currentTarget.dataset.dish;
    this.setData({
      currentDish: dish,
      showDishDetail: true,
    });
  },

  // 关闭菜品详情
  closeDishDetail() {
    this.setData({
      showDishDetail: false,
    });
  },

  // 添加到购物车
  addToCart() {
    app.addToCart(this.data.currentDish);
    this.updateCartCount();
    this.closeDishDetail();

    wx.showToast({
      title: "已加入购物车",
      icon: "success",
    });
  },
  // 在现有方法下方添加以下方法
  navigateToUserProfile() {
    wx.navigateTo({
      url: '/pages/userProfile/userProfile'
    });
  },
});
