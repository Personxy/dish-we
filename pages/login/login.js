const app = getApp();

Page({
  data: {
    isLoading: false
  },

  onLoad: function () {
    // 页面加载时执行
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
      
      // 跳转到首页
      wx.switchTab({
        url: '/pages/index/index'
      });
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
  }
});