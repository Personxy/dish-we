const app = getApp();

Page({
  data: {
    isLoading: false,
    returnUrl: "",
  },

  onLoad: function (options) {
    let url = "/pages/index/index";
    if (options && options.returnUrl) {
      url = decodeURIComponent(options.returnUrl);
    } else if (app.globalData.returnUrl) {
      url = app.globalData.returnUrl;
    }
    this.setData({
      returnUrl: url,
    });
  },

  // 处理登录按钮点击
  handleLogin: function () {
    if (this.data.isLoading) return;

    this.setData({
      isLoading: true,
    });

    // 调用app.js中的wechatLogin方法
    app
      .wechatLogin()
      .then((res) => {
        if (res.success && !res.isNewUser) {
          this.setData({
            isLoading: false,
          });
          const target = this.data.returnUrl || "/pages/index/index";
          const tabPages = ["/pages/index/index", "/pages/order/order", "/pages/myOrder/myOrder"];
          console.log(target);
          if (tabPages.includes(target)) {
            wx.switchTab({ url: target });
          } else {
            wx.navigateTo({ url: target });
          }
        } else if (res.isNewUser) {
          // 新用户已经在app.js中跳转了，这里只需要停止loading
          this.setData({
            isLoading: false,
          });
        }
      })
      .catch((err) => {
        console.error("Login failed:", err);
        this.setData({
          isLoading: false,
        });
      });
  },

  handleCancel: function () {
    const target = "/pages/index/index";
    wx.switchTab({ url: target });
  },
});
