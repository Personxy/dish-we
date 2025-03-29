const app = getApp();
import { user } from "../../utils/api";
Page({
  data: {
    avatarUrl: "/images/default-avatar.png",
    username: "",
    isSubmitting: false,
    serverAvatarUrl: "", // 存储服务器返回的头像URL
    isUploading: false, // 头像上传状态
  },

  onLoad: function () {
    // 页面加载时可以执行一些初始化
    const userInfo = wx.getStorageSync("userInfo");
    if (userInfo) {
      this.setData({
        avatarUrl: userInfo.avatar,
        serverAvatarUrl: userInfo.avatar,
        username: userInfo.username,
      });
    }
  },

  // 头像选择回调
  onChooseAvatar(e) {
    const { avatarUrl } = e.detail;
    this.setData({
      avatarUrl,
      isUploading: true,
    });

    // 选择头像后立即上传
    this.uploadAvatar(avatarUrl)
      .then((fileUrl) => {
        this.setData({
          serverAvatarUrl: fileUrl,
          isUploading: false,
        });
        wx.showToast({
          title: "头像上传成功",
          icon: "success",
          duration: 1500,
        });
      })
      .catch((err) => {
        this.setData({ isUploading: false });
        wx.showToast({
          title: err.message || "头像上传失败",
          icon: "none",
        });
      });
  },

  // 昵称输入回调
  onNicknameChange(e) {
    this.setData({
      username: e.detail.value,
    });
  },

  // 提交用户信息
  submitUserInfo() {
    const { username, serverAvatarUrl, isUploading } = this.data;
    if (!username.trim()) {
      wx.showToast({
        title: "请输入昵称",
        icon: "none",
      });
      return;
    }

    // 如果头像正在上传中，提示等待
    if (isUploading) {
      wx.showToast({
        title: "头像上传中，请稍候",
        icon: "none",
      });
      return;
    }

    // 如果没有选择新头像或上传失败
    if (!serverAvatarUrl) {
      wx.showToast({
        title: "请选择头像",
        icon: "none",
      });
      return;
    }

    this.setData({ isSubmitting: true });

    // 直接提交用户信息，因为头像已经上传完成

    user
      .updateProfile({
        username: username,
        avatar: serverAvatarUrl,
      })
      .then((res) => {
        this.setData({ isSubmitting: false });
        if (res.success) {
          // 更新全局用户信息
          const userInfo = {
            ...app.globalData.userInfo,
            username: res.data.username,
            avatar: res.data.avatar, // 注意这里应该是avatar而不是avatarUrl
          };

          // 更新全局数据
          app.globalData.userInfo = userInfo;

          // 缓存用户信息
          wx.setStorageSync("userInfo", userInfo);

          // 跳转到首页
          wx.switchTab({
            url: "/pages/index/index",
          });

          wx.showToast({
            title: "信息已完善",
            icon: "success",
          });
        } else {
          wx.showToast({
            title: "提交失败",
            icon: "none",
          });
        }
      })
      .catch((err) => {
        console.log(err);
        this.setData({ isSubmitting: false });
        wx.showToast({
          title: "网络错误",
          icon: "none",
        });
      });
  },

  // 上传头像
  uploadAvatar(avatarUrl) {
    return new Promise((resolve, reject) => {
      // 如果是默认头像，直接返回
      if (avatarUrl === "/images/default-avatar.png") {
        resolve(avatarUrl);
        return;
      }

      // 判断是微信临时文件还是网络URL
      // const isWechatTempFile = avatarUrl.indexOf("wxfile://") === 0;
      const serverUrl = wx.getStorageSync("serverUrl");
      const token = wx.getStorageSync("token");

      // 下载头像图片
      wx.downloadFile({
        url: avatarUrl,
        success(res) {
          if (res.statusCode === 200) {
            console.log("download success");
            const tempFilePath = res.tempFilePath;
            console.log("获取到用户头像tempFilePath：" + tempFilePath);
            wx.uploadFile({
              url: `${serverUrl}/api/users/upload-avatar`,
              filePath: tempFilePath,
              name: "avatar",
              header: {
                Authorization: `Bearer ${token}`,
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
          }
        },
        fail(err) {
          console.log("download fail", err);
          reject(new Error("下载失败"));
        },
      });
    });
  },
});
