const app = getApp();
const util = require("../../utils/util.js");
import api from "../../utils/api"; // 引入API模块

Page({
  data: {
    cartItems: [], // 购物车商品
    subtotal: "0.00", // 商品小计
    packagingFee: "2.00", // 包装费
    deliveryFee: "0.00", // 配送费
    totalAmount: "0.00", // 总金额
    remark: "", // 备注
    remarkLength: 0, // 备注长度
    timeArray: [[], []], // 时间选择器数据
    timeIndex: [0, 0], // 时间选择器索引
    selectedTime: "", // 已选择的时间字符串
    isSubmitting: false, // 是否正在提交
  },

  onLoad: function () {
    // 初始化时间选择器
    this.initTimePicker();
  },

  onShow: function () {
    // 获取购物车数据
    this.getCartItems();

    // 计算价格
    // this.calculatePrice();
  },

  // 获取购物车数据
  getCartItems: function () {
    const cartItems = app.globalData.cartItems || [];
    this.setData({
      cartItems,
    });
  },

  // 计算价格
  calculatePrice: function () {
    const { cartItems, packagingFee, deliveryFee } = this.data;

    // 计算商品小计
    let subtotal = 0;
    cartItems.forEach((item) => {
      subtotal += item.price * item.count;
    });

    // 计算总金额
    const totalAmount = subtotal + parseFloat(packagingFee) + parseFloat(deliveryFee);

    this.setData({
      subtotal: subtotal.toFixed(2),
      totalAmount: totalAmount.toFixed(2),
    });
  },

  // 增加商品数量
  increaseItemCount: function (e) {
    const id = e.currentTarget.dataset.id;
    let { cartItems } = this.data;

    const index = cartItems.findIndex((item) => item.id === id);
    if (index > -1) {
      cartItems[index].count++;

      // 更新全局数据
      app.globalData.cartItems = cartItems;

      this.setData({
        cartItems,
      });

      // 重新计算价格
      this.calculatePrice();
    }
  },

  // 减少商品数量
  decreaseItemCount: function (e) {
    const id = e.currentTarget.dataset.id;
    let { cartItems } = this.data;

    const index = cartItems.findIndex((item) => item.id === id);
    if (index > -1) {
      if (cartItems[index].count > 1) {
        cartItems[index].count--;
      } else {
        // 数量为1时，询问是否删除
        wx.showModal({
          title: "提示",
          content: "确定要删除该商品吗？",
          success: (res) => {
            if (res.confirm) {
              cartItems.splice(index, 1);

              // 更新全局数据
              app.globalData.cartItems = cartItems;

              this.setData({
                cartItems,
              });

              // 重新计算价格
              this.calculatePrice();
            }
          },
        });
        return;
      }

      // 更新全局数据
      app.globalData.cartItems = cartItems;

      this.setData({
        cartItems,
      });

      // 重新计算价格
      this.calculatePrice();
    }
  },

  // 清空购物车
  clearCart: function () {
    wx.showModal({
      title: "提示",
      content: "确定要清空购物车吗？",
      success: (res) => {
        if (res.confirm) {
          // 清空全局购物车数据
          app.globalData.cartItems = [];

          this.setData({
            cartItems: [],
          });

          // 重新计算价格
          this.calculatePrice();
        }
      },
    });
  },

  // 备注输入事件
  onRemarkInput: function (e) {
    const remark = e.detail.value;
    this.setData({
      remark,
      remarkLength: remark.length,
    });
  },

  // 初始化时间选择器
  initTimePicker: function () {
    // 获取当前时间
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();

    // 生成小时数组，从当前小时开始到22点结束
    const hoursArr = [];
    for (let i = hours; i <= 22; i++) {
      hoursArr.push(i < 10 ? `0${i}` : `${i}`);
    }

    // 生成分钟数组，如果是当前小时，则从当前分钟开始，否则从0开始
    const generateMinutesArr = (hour) => {
      const minutesArr = [];
      const startMinute = hour == hours ? Math.ceil(minutes / 10) * 10 : 0;

      for (let i = startMinute; i < 60; i += 10) {
        minutesArr.push(i < 10 ? `0${i}` : `${i}`);
      }

      return minutesArr;
    };

    // 初始小时为当前小时
    const minutesArr = generateMinutesArr(hours);

    this.setData({
      timeArray: [hoursArr, minutesArr],
      hoursArr,
    });
  },

  // 时间选择器列变化事件
  onTimeColumnChange: function (e) {
    const { column, value } = e.detail;
    const { timeArray, timeIndex, hoursArr } = this.data;

    // 如果是第一列（小时）变化
    if (column === 0) {
      // 重新生成分钟数组
      const selectedHour = parseInt(hoursArr[value]);
      const now = new Date();
      const hours = now.getHours();

      const minutesArr = [];
      const startMinute = selectedHour == hours ? Math.ceil(now.getMinutes() / 10) * 10 : 0;

      for (let i = startMinute; i < 60; i += 10) {
        minutesArr.push(i < 10 ? `0${i}` : `${i}`);
      }

      // 更新分钟数组和索引
      const newTimeArray = [timeArray[0], minutesArr];
      const newTimeIndex = [value, 0];

      this.setData({
        timeArray: newTimeArray,
        timeIndex: newTimeIndex,
      });
    }
  },

  // 时间选择器确定事件
  onTimeChange: function (e) {
    const { value } = e.detail;
    const { timeArray } = this.data;

    const selectedHour = timeArray[0][value[0]];
    const selectedMinute = timeArray[1][value[1]];

    this.setData({
      timeIndex: value,
      selectedTime: `今日 ${selectedHour}:${selectedMinute}`,
    });
  },

  // 去点餐
  goToOrder: function () {
    wx.switchTab({
      url: "/pages/order/order",
    });
  },

  // 提交订单
  // 提交订单
  submitOrder: function () {
    if (this.data.isSubmitting) return;

    if (this.data.cartItems.length === 0) {
      wx.showToast({
        title: "购物车为空",
        icon: "none",
      });
      return;
    }

    this.setData({
      isSubmitting: true,
    });

    // 显示加载中提示
    wx.showLoading({
      title: "提交中...",
      mask: true,
    });

    // 准备订单数据
    const items = this.data.cartItems.map((item) => ({
      dish: item.id, // 菜品ID
      quantity: item.count, // 数量
      price: 1, // 价格默认设置为1
    }));

    // 处理预约时间
    let scheduledTime = null;
    if (this.data.selectedTime) {
      // 解析选择的时间
      const timeStr = this.data.selectedTime.replace("今日 ", "");
      const [hours, minutes] = timeStr.split(":");

      // 创建预约时间对象
      const now = new Date();
      scheduledTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), parseInt(hours), parseInt(minutes));
    } else {
      // 默认为当前时间后15分钟
      scheduledTime = new Date(Date.now() + 15 * 60 * 1000);
    }

    // 构建API请求数据
    const orderData = {
      items: items,
      scheduledTime: scheduledTime.toISOString(),
      customRemark: this.data.remark || "", // 自定义备注
      // 可以添加其他可选字段
      // contactPhone: app.globalData.userInfo?.phone, // 如果有用户信息，可以添加联系电话
      // paymentMethod: "wechat" // 默认支付方式
    };

    // 调用创建订单API
    api.orders
      .createOrder(orderData)
      .then((res) => {
        // 隐藏加载提示
        wx.hideLoading();

        if (res.success) {
          // 清空购物车
          app.globalData.cartItems = [];

          this.setData({
            isSubmitting: false,
            cartItems: [],
          });

          // 显示成功提示
          wx.showToast({
            title: "下单成功",
            icon: "success",
            duration: 2000,
            success: () => {
              // 跳转到订单页
              setTimeout(() => {
                wx.switchTab({
                  url: "/pages/myOrder/myOrder",
                });
              }, 1500);
            },
          });

          // 可以将订单信息保存到全局数据中，方便在订单页面显示
          if (res.data) {
            app.globalData.lastOrder = res.data;
          }
        } else {
          throw new Error(res.error || "下单失败");
        }
      })
      .catch((err) => {
        // 隐藏加载提示
        wx.hideLoading();

        console.error("下单失败", err);
        this.setData({
          isSubmitting: false,
        });

        // 根据错误状态码显示不同的错误信息
        let errorMsg = "下单失败";
        if (err.statusCode === 400) {
          errorMsg = "参数错误，请检查订单信息";
        } else if (err.statusCode === 401) {
          errorMsg = "登录已过期，请重新登录";
          // 可以跳转到登录页
        } else if (err.statusCode === 404) {
          errorMsg = "菜品或备注模板不存在";
        } else if (err.statusCode === 409) {
          errorMsg = "菜品已下架或库存不足";
        }

        wx.showToast({
          title: err.message || errorMsg,
          icon: "none",
          duration: 2000,
        });
      });
  },
});
