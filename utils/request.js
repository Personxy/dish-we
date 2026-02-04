// 从本地存储获取 token
const getToken = () => {
  return wx.getStorageSync("token");
};

// 从本地存储获取服务器地址，如果没有则使用默认值
const getServerUrl = () => {
  return wx.getStorageSync("serverUrl") || "http://localhost:5000";
};

const clearAuth = () => {
  wx.removeStorageSync("token");
  wx.removeStorageSync("userInfo");
  try {
    const app = getApp();
    if (app?.globalData) {
      app.globalData.userInfo = null;
      app.globalData.token = null;
    }
  } catch (e) {}
};

// 基础请求函数
const request = (url, method, data, needToken = true) => {
  console.log("请求开始", url, method, data);
  return new Promise((resolve, reject) => {
    // 构建请求头
    const header = {};

    // 获取token
    const token = getToken();

    // 如果需要token，则必须有token
    if (needToken) {
      if (token) {
        header["Authorization"] = `Bearer ${token}`;
      } else {
        reject(new Error("未登录或登录已过期"));
        return;
      }
    } else {
      // 不需要强制token，但如果有token则带上
      if (token) {
        header["Authorization"] = `Bearer ${token}`;
      }
    }

    // 获取服务器地址
    const serverUrl = getServerUrl();

    wx.request({
      url: `${serverUrl}${url}`,
      method,
      data,
      header,
      success: (res) => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          resolve(res.data);
        } else if (res.statusCode === 401) {
          clearAuth();
          wx.showToast({
            title: "登录已过期，请重新登录",
            icon: "none",
            duration: 2000,
          });
          reject(new Error("登录已过期，请重试"));
        } else {
          reject(new Error(res.data.message || "请求失败"));
        }
      },
      fail: (err) => {
        console.error("请求失败", url, err);
        reject(new Error("网络错误"));
      },
      complete(res) {
        console.log("请求完成", res);
      },
    });
  });
};

export default request;
