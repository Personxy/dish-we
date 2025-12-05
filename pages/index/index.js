const app = getApp();
import { dishes } from "../../utils/api";

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
    console.log(item.index);
    console.log(item.pagePath);
    console.log(item.text);
  },
  onShow() {},
  onLoad() {
    this.getRecommendDishes();
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
  },

  onShow() {
    // 更新购物车数量
    this.updateCartCount();

    // 每次进入首页时重新获取用户信息
    app.getUserInfo();

    // 获取最新的用户信息
    const userInfo = wx.getStorageSync("userInfo");
    if (userInfo) {
      this.setData({
        userInfo: userInfo,
        hasUserInfo: true,
      });
    }
  },

  // 添加下拉刷新函数
  onPullDownRefresh: function () {
    console.log("下拉刷新触发");

    // 显示导航条加载动画
    wx.showNavigationBarLoading();

    // 重新获取用户信息
    app.getUserInfo();

    // 重新获取推荐菜品
    this.getRecommendDishes();

    // 获取最新的用户信息并更新页面
    const userInfo = wx.getStorageSync("userInfo");
    if (userInfo) {
      this.setData({
        userInfo: userInfo,
        hasUserInfo: true,
      });
      this.checkIsAdmin();
    }

    // 更新购物车数量
    this.updateCartCount();

    // 模拟网络请求延迟，0.5秒后停止下拉刷新动画
    setTimeout(() => {
      // 隐藏导航条加载动画
      wx.hideNavigationBarLoading();
      // 停止下拉刷新动画
      wx.stopPullDownRefresh();

      // 提示用户刷新成功
      wx.showToast({
        title: "刷新成功",
        icon: "success",
        duration: 1000,
      });
    }, 500);
  },

  // 更新用户信息到服务器
  updateUserInfo(userInfo) {
    _updateUserInfo(userInfo).catch((err) => {
      console.error("更新用户信息失败", err);
    });
  },
  // 预览图片（放大查看）
  previewImage: function (e) {
    const url = e.currentTarget.dataset.url;
    wx.previewImage({
      current: url, // 当前显示图片的链接
      urls: [url], // 需要预览的图片链接列表
    });
  },
  // 检查是否为管理员
  checkIsAdmin() {
    // 这里可以根据实际需求来判断是否为管理员
    // 示例：假设微信昵称包含"admin"则为管理员
    const isAdmin = this.data.userInfo.role === "admin";

    this.setData({
      isAdmin,
    });
  },
  navigateToUserProfile: function () {
    wx.navigateTo({
      url: "/pages/userProfile/userProfile",
    });
  },
  // 获取推荐菜品
  getRecommendDishes() {
    // 这里应该从服务器获取推荐菜品
    // 示例：从app.globalData中获取前3个菜品作为推荐
    dishes
      .getRecommendedDishes()
      .then((res) => {
        console.log(res);

        const recommendDishes = res.data.map((item) => {
          return {
            ...item,
            id: item._id,
          };
        });
        this.setData({
          recommendDishes: recommendDishes,
        });
      })
      .catch((err) => {
        console.error("获取推荐菜品失败", err);
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
    console.log(dish); // 打印菜品信息，检查是否正确获取到了dish
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
      url: "/pages/userProfile/userProfile",
    });
  },
});
