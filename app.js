import { user } from "./utils/api";
const CART_STORAGE_KEY = "cartItems";
App({
  globalData: {
    userInfo: null,
    cartItems: [],
    categories: [], // 菜品分类
    dishes: [], // 所有菜品
    token: null, // 用户登录令牌
    openid: null, // 用户openid
    isNewUser: false, // 是否是新用户
    userInfoReadyCallback: null, // 添加回调函数属性
    loginSuccessCallback: null, // 添加登录成功回调函数
    returnUrl: null,
  },

  onLaunch: function () {
    wx.setStorageSync("serverUrl", "https://yangjile.cn/api");
    // 检查本地是否有缓存的token和用户信息
    const token = wx.getStorageSync("token");
    const userInfo = wx.getStorageSync("userInfo");
    const cartItems = wx.getStorageSync(CART_STORAGE_KEY);

    if (userInfo) {
      this.globalData.userInfo = userInfo;
    }

    if (Array.isArray(cartItems)) {
      this.globalData.cartItems = cartItems;
    }

    if (token && !userInfo) {
      this.getUserInfo();
    }
  },

  // 微信登录
  wechatLogin: function () {
    return new Promise((resolve, reject) => {
      wx.login({
        success: (res) => {
          console.log(res);
          if (res.code) {
            // 使用 api 封装的方法
            user
              .wechatLogin(res.code)
              .then((result) => {
                console.log(result);
                if (result.success) {
                  // 判断是否是新用户
                  const isNewUser = result.isNewUser || false;
                  this.globalData.isNewUser = isNewUser;

                  if (isNewUser) {
                    // 新用户，跳转到完善信息页面
                    wx.navigateTo({
                      url: "/pages/userProfile/userProfile",
                    });
                    resolve({ success: true, isNewUser: true });
                  } else {
                    // 老用户，获取用户信息
                    this.getUserInfo();
                    // 调用登录成功回调
                    if (this.loginSuccessCallback) {
                      this.loginSuccessCallback();
                    }
                    resolve({ success: true, isNewUser: false });
                  }
                } else {
                  reject(new Error(result.msg || "登录失败"));
                }
              })
              .catch((err) => {
                console.error("微信登录失败", err);
                wx.showToast({
                  title: "网络错误",
                  icon: "none",
                });
                reject(err);
              });
          } else {
            wx.showToast({
              title: "登录失败: " + res.errMsg,
              icon: "none",
            });
            reject(new Error("登录失败: " + res.errMsg));
          }
        },
        fail: (err) => {
          console.log("登录失败", err);
          wx.showToast({
            title: "登录失败",
            icon: "none",
          });
          reject(err);
        },
      });
    });
  },

  // 获取用户信息
  getUserInfo: function () {
    // 使用 api 封装的方法
    user
      .getProfile()
      .then((res) => {
        if (res.success) {
          this.globalData.userInfo = res.data;

          // 缓存用户信息
          wx.setStorageSync("userInfo", res.data);

          // 如果有回调函数，则执行回调
          if (this.globalData.userInfoReadyCallback) {
            this.globalData.userInfoReadyCallback(res.data);
          }
        }
      })
      .catch((err) => {
        console.error("获取用户信息失败", err);
      });
  },

  ensureLogin: function (targetRoute) {
    const token = wx.getStorageSync("token");
    if (token) {
      return Promise.resolve(true);
    }
    const pages = getCurrentPages();
    const current = pages[pages.length - 1] || {};
    const route = targetRoute || (current.route ? "/" + current.route : "/pages/index/index");
    return new Promise((resolve) => {
      wx.showModal({
        title: "提示",
        content: "登录后可继续操作",
        cancelText: "暂不登录",
        confirmText: "去登录",
        success: (res) => {
          if (res.confirm) {
            this.globalData.returnUrl = route;
            wx.navigateTo({
              url: `/pages/login/login?returnUrl=${encodeURIComponent(route)}`,
            });
            resolve(false);
          } else {
            resolve(false);
          }
        },
        fail: () => resolve(false),
      });
    });
  },

  getCartItems: function () {
    return this.globalData.cartItems || [];
  },

  setCartItems: function (cartItems) {
    const items = Array.isArray(cartItems) ? cartItems : [];
    this.globalData.cartItems = items;
    wx.setStorageSync(CART_STORAGE_KEY, items);
  },

  clearCart: function () {
    this.setCartItems([]);
  },

  getCartCount: function () {
    const cartItems = this.getCartItems();
    return cartItems.reduce((sum, item) => sum + Number(item?.count || 0), 0);
  },

  // 添加商品到购物车
  addToCart: function (dish) {
    let cartItems = this.getCartItems();
    let found = false;
    const dishId = dish?.id || dish?._id;
    if (!dishId) return;

    // 查找购物车中是否已有该商品
    for (let i = 0; i < cartItems.length; i++) {
      if (cartItems[i].id === dishId) {
        cartItems[i].count = Number(cartItems[i].count || 0) + 1;
        found = true;
        break;
      }
    }

    // 如果购物车中没有该商品，则添加
    if (!found) {
      cartItems.push({
        ...dish,
        id: dishId,
        count: 1,
      });
    }

    this.setCartItems(cartItems);
  },

  // // 计算购物车总价
  // calculateTotal: function () {
  //   let total = 0;
  //   let cartItems = this.globalData.cartItems;

  //   cartItems.forEach((item) => {
  //     total += item.count;
  //   });

  //   return total;
  // },
});
