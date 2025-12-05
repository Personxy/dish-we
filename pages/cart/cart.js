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
    mode: "", // TDesign 选择器模式标识
    datetimeVisible: false, // 控制日期时间选择器显隐
    datetime: Date.now(), // 选中的时间戳（ms）
    datetimeText: "", // 显示在 t-cell 的文本
    isSubmitting: false, // 是否正在提交
  },

  onLoad: function () {},

  onShow: function () {
    // 获取购物车数据
    this.getCartItems();
  },

  // 获取购物车数据
  getCartItems: function () {
    const cartItems = app.globalData.cartItems || [];
    this.setData({
      cartItems,
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

  // 打开 TDesign 选择器
  showPicker: function (e) {
    const { mode } = e?.currentTarget?.dataset || {};
    this.setData({
      mode: mode,
      [`${mode}Visible`]: true,
    });
  },

  // 关闭 TDesign 选择器
  hidePicker: function () {
    const { mode } = this.data;
    this.setData({
      [`${mode}Visible`]: false,
    });
  },

  // 确认选择（格式化为 YYYY-MM-DD HH:mm:ss）
  onConfirm: function (e) {
    const { value } = e?.detail || {};
    const { mode } = this.data;
    const d = new Date(value);
    const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
    const txt = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(
      d.getMinutes()
    )}:${pad(d.getSeconds())}`;
    this.setData({
      [mode]: value,
      [`${mode}Text`]: txt,
    });
    this.hidePicker();
  },

  // 列变化（可用于联动日志或自定义处理）
  onColumnChange: function (e) {
    // e.detail.value 为当前各列的值
  },

  // 预览购物车图片
  previewCartImage: function (e) {
    const currentUrl = e.currentTarget.dataset.url;
    const urls = (this.data.cartItems || []).map((item) => item?.image?.url).filter((u) => !!u);
    wx.previewImage({ current: currentUrl, urls: urls.length ? urls : [currentUrl] });
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

    // 处理预约时间（使用 datetime 时间戳）
    let scheduledTime = null;
    if (this.data.datetime) {
      scheduledTime = new Date(this.data.datetime);
    } else {
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
