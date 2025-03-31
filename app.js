
import { user } from "./utils/api";
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
  },

  onLaunch: function () {
    wx.setStorageSync("serverUrl", "http://localhost:5000");
    // 检查本地是否有缓存的token和用户信息
    const token = wx.getStorageSync("token");
    const userInfo = wx.getStorageSync("userInfo");

    if (userInfo) {
      this.globalData.userInfo = userInfo
    }

    if (token) {
      // 获取用户信息（如果本地没有）
      if (!userInfo) {
        this.getUserInfo();
      }
    } else {
      // 执行微信登录
      this.wechatLogin();
    }

    // 加载菜品分类和菜品数据
   
  },

  // 微信登录
  wechatLogin: function () {
    wx.login({
      success: (res) => {
        if (res.code) {
          // 使用 api 封装的方法
          user
            .wechatLogin(res.code)
            .then((result) => {
              if (result.success) {
                // 判断是否是新用户
                const isNewUser = result.isNewUser || false;
                this.globalData.isNewUser = isNewUser;

                if (isNewUser) {
                  // 新用户，跳转到完善信息页面
                  wx.navigateTo({
                    url: "/pages/userProfile/userProfile",
                  });
                } else {
                  // 老用户，获取用户信息
                  this.getUserInfo();
                }
              } else {
                wx.showToast({
                  title: "登录失败",
                  icon: "none",
                });
              }
            })
            .catch(() => {
              wx.showToast({
                title: "网络错误",
                icon: "none",
              });
            });
        } else {
          wx.showToast({
            title: "登录失败: " + res.errMsg,
            icon: "none",
          });
        }
      },
    });
  },

  // 获取用户信息
  getUserInfo: function () {
    // 使用 api 封装的方法
    user
      .getProfile()
      .then((res) => {
        if (res.success) {
          this.globalData.userInfo = res.data
       
          console.log(res.data,this.globalData.userInfo);
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



  // 添加商品到购物车
  addToCart: function (dish) {
    let cartItems = this.globalData.cartItems;
    let found = false;

    // 查找购物车中是否已有该商品
    for (let i = 0; i < cartItems.length; i++) {
      if (cartItems[i].id === dish.id) {
        cartItems[i].count++;
        found = true;
        break;
      }
    }

    // 如果购物车中没有该商品，则添加
    if (!found) {
      cartItems.push({
        ...dish,
        count: 1,
      });
    }
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
