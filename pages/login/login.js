const app = getApp();

Page({
  data: {
    isLoading: false,
    returnUrl: ""
  },

  onLoad: function (options) {
    const url = (options && options.returnUrl) || app.globalData.returnUrl || "/pages/index/index";
    this.setData({
      returnUrl: url
    });
  },

  // 处理登录按钮点击
  handleLogin: function () {
    if (this.data.isLoading) return;
    
    this.setData({
      isLoading: true
    });
    
    // 调用app.js中的wechatLogin方法
    app.wechatLogin();
    
    // 添加监听器，当登录成功后跳转到首页
    app.loginSuccessCallback = () => {
      this.setData({
        isLoading: false
      });
      const target = this.data.returnUrl || "/pages/index/index";
      const tabPages = ["/pages/index/index", "/pages/order/order", "/pages/myOrder/myOrder"];
      if (tabPages.includes(target)) {
        wx.switchTab({ url: target });
      } else {
        wx.navigateTo({ url: target });
      }
    };
    
    // 设置超时，避免长时间等待
    setTimeout(() => {
      if (this.data.isLoading) {
        this.setData({
          isLoading: false
        });
        
        wx.showToast({
          title: '登录超时，请重试',
          icon: 'none'
        });
      }
    }, 10000);
  },

  handleCancel: function () {
    const target = "/pages/index/index";
    wx.switchTab({ url: target });
  }
});
