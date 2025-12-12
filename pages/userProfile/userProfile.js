const app = getApp();
import { user } from "../../utils/api";
Page({
  data: {
    avatarUrl: "/images/default-avatar.png",
    username: "",
    isSubmitting: false,
    serverAvatarUrl: "", // 存储服务器返回的头像URL
    isUploading: false, // 头像上传状态
    isEdit: false, // 是否为编辑模式
  },

  onLoad: function (options) {
    // 获取本地存储的用户信息
    const userInfo = wx.getStorageSync("userInfo") || {};
    // 判断是否为新用户
    const isNewUser = app.globalData.isNewUser;

    // 设置初始数据
    this.setData({
      avatarUrl: userInfo.avatar || "/images/default-avatar.png",
      username: userInfo.username || "",
      isEdit: !isNewUser, // 如果不是新用户，则是编辑模式
    });
  },

  // 退出登录
  handleLogout() {
    wx.showModal({
      title: "提示",
      content: "确定要退出登录吗？",
      success: (res) => {
        if (res.confirm) {
          user
            .logout()
            .then(() => {
              wx.showToast({
                title: "已退出登录",
                icon: "success",
              });
              setTimeout(() => {
                wx.reLaunch({
                  url: "/pages/index/index",
                });
              }, 1500);
            })
            .catch((err) => {
              console.error("退出登录失败", err);
              // 即使接口调用失败，也要清除本地状态
              wx.removeStorageSync("token");
              wx.removeStorageSync("userInfo");
              app.globalData.userInfo = null;
              app.globalData.token = null;
              wx.reLaunch({
                url: "/pages/index/index",
              });
            });
        }
      },
    });
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
    const { username, serverAvatarUrl, isUploading, avatarUrl } = this.data;
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
    if (!serverAvatarUrl && avatarUrl === "/images/default-avatar.png") {
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
        avatar: serverAvatarUrl || avatarUrl,
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

      const serverUrl = wx.getStorageSync("serverUrl");
      const token = wx.getStorageSync("token");

      // 判断路径类型
      if (avatarUrl.startsWith("wxfile://")) {
        // 本地临时文件路径，直接上传
        wx.uploadFile({
          url: `${serverUrl}/api/users/upload-avatar`,
          filePath: avatarUrl,
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
          fail: function () {
            reject(new Error("上传失败"));
          },
        });
      } else if (avatarUrl.startsWith("http://") || avatarUrl.startsWith("https://")) {
        // 网络地址，需要先下载
        wx.downloadFile({
          url: avatarUrl,
          success(res) {
            if (res.statusCode === 200) {
              wx.uploadFile({
                url: `${serverUrl}/api/users/upload-avatar`,
                filePath: res.tempFilePath,
                name: "avatar",
                header: {
                  Authorization: `Bearer ${token}`,
                },
                success: function (res2) {
                  try {
                    const data = JSON.parse(res2.data);
                    if (data.success) {
                      resolve(data.data.avatar);
                    } else {
                      reject(new Error(data.error || "上传失败"));
                    }
                  } catch (e) {
                    reject(new Error("解析响应失败"));
                  }
                },
                fail: function () {
                  reject(new Error("上传失败"));
                },
              });
            } else {
              reject(new Error("下载失败"));
            }
          },
          fail(err) {
            reject(new Error("下载失败"));
          },
        });
      } else {
        reject(new Error("不支持的头像路径格式"));
      }
    });
  },
});
