import request from "../request";

// 用户相关 API
const userApi = {
  // 微信登录
  wechatLogin: (code) => {
    return request("/api/users/wechatLogin", "POST", { code }, false).then((res) => {
      if (res.success && res.token) {
        // 保存token到本地
        const app = getApp();
        wx.setStorageSync("token", res.token);
      }
      return res;
    });
  },

  // 获取用户信息
  getProfile: () => {
    return request("/api/users/getProfile", "GET", {});
  },

  // 更新用户信息
  updateProfile: (userInfo) => {
    return request("/api/users/updateProfile", "POST", userInfo);
  },

  // 上传头像
  uploadAvatar: (filePath) => {
    return new Promise((resolve, reject) => {
      const app = getApp();
      wx.uploadFile({
        url: `${app.globalData.serverUrl}/api/upload/avatar`,
        filePath,
        name: "avatar",
        header: {
          Authorization: `Bearer ${app.globalData.token}`,
        },
        success: function (res) {
          try {
            const data = JSON.parse(res.data);
            if (data.success) {
              resolve(data.data.avatar);
            } else {
              reject(new Error(data.error || "上传失败"));
            }
          } catch (e) {
            reject(new Error("解析响应失败"));
          }
        },
        fail: function (err) {
          reject(new Error("上传失败"));
        },
      });
    });
  },
};

export default userApi;
