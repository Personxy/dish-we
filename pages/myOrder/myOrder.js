const app = getApp();
import { orders } from "../../utils/api";

Page({
  data: {
    orders: [], // 所有订单
    currentStatus: "", // 当前选中的状态筛选
    searchKeyword: "", // 搜索关键字
    showOrderDetail: false, // 是否显示订单详情
    currentOrder: {}, // 当前选中的订单
    isLoading: false, // 加载状态
    loadingText: "", // 加载文本
    loadingTimer: null, // 加载计时器
    pagination: {
      page: 1,
      limit: 10,
      total: 0,
      pages: 0,
    },
    hasMore: false, // 是否有更多数据
  },

  onLoad: function () {},

  onShow: function () {
    // 重置分页
    this.setData({
      "pagination.page": 1,
      hasMore: false,
    });
    this.loadOrders();
  },

  // 显示加载提示
  showLoading: function (text) {
    // 清除之前的计时器
    if (this.data.loadingTimer) {
      clearTimeout(this.data.loadingTimer);
    }

    // 设置一个300ms的延迟，如果加载很快就不显示loading
    const timer = setTimeout(() => {
      this.setData({
        isLoading: true,
        loadingText: text,
      });
    }, 300);

    this.setData({
      loadingTimer: timer,
    });
  },

  // 隐藏加载提示
  hideLoading: function () {
    // 清除计时器
    if (this.data.loadingTimer) {
      clearTimeout(this.data.loadingTimer);
    }

    this.setData({
      isLoading: false,
      loadingText: "",
      loadingTimer: null,
    });
  },

  // 加载订单数据
  loadOrders: function (isLoadMore = false) {
    // 显示加载提示
    this.showLoading(isLoadMore ? "加载更多订单..." : "获取订单中...");

    // 构建查询参数
    const params = {
      page: this.data.pagination.page,
      limit: this.data.pagination.limit,
      sort: "-createdAt", // 默认按创建时间倒序排序
    };

    // 如果有状态筛选
    if (this.data.currentStatus) {
      // 将中文状态转换为英文状态
      const statusMap = {
        待处理: "pending",
        处理中: "preparing",
        已完成: "completed",
        已取消: "canceled",
      };
      params.status = statusMap[this.data.currentStatus] || this.data.currentStatus;
    }
    
    // 如果有搜索关键字
    if (this.data.searchKeyword) {
      params.keyword = this.data.searchKeyword;
    }

    // 调用获取订单API
    orders
      .getOrders(params)
      .then((res) => {
        if (res.success) {
          const ordersData = res.data || [];
          const pagination = res.pagination || {};

          // 处理订单数据
          const processedOrders = ordersData.map((order) => {
            // 添加滑动参数
            order.x = 0;

            // 转换状态为中文
            const statusMap = {
              pending: "待处理",
              confirmed: "已确认",
              preparing: "处理中",
              ready: "待取餐",
              completed: "已完成",
              canceled: "已取消",
            };

            // 生成商品概要
            const itemNames = order.items.map((item) => item.name);
            const itemSummary = itemNames.join("、");

            // 格式化时间的辅助函数
            const formatDate = (dateString, includeYear = true) => {
              if (!dateString) return "立即取餐";
              
              const date = new Date(dateString);
              
              // 检查日期是否有效
              if (isNaN(date.getTime())) return "无效日期";
              
              const year = date.getFullYear();
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const day = String(date.getDate()).padStart(2, '0');
              const hours = String(date.getHours()).padStart(2, '0');
              const minutes = String(date.getMinutes()).padStart(2, '0');
              
              return includeYear 
                ? `${year}-${month}-${day} ${hours}:${minutes}`
                : `${month}-${day} ${hours}:${minutes}`;
            };

            // 格式化创建时间和预约时间
            const createTime = formatDate(order.createdAt, true);
            const scheduledTime = formatDate(order.scheduledTime, false);

            return {
              ...order,
              id: order._id, // 确保id字段一致
              orderNo: order.orderNumber, // 订单编号
              status: statusMap[order.status] || order.status,
              itemSummary: itemSummary.length > 20 ? itemSummary.substring(0, 20) + "..." : itemSummary,
              createTime: createTime,
              appointmentTime: scheduledTime,
            };
          });

          // 更新数据
          this.setData({
            orders: isLoadMore ? [...this.data.orders, ...processedOrders] : processedOrders,
            pagination: pagination,
            hasMore: pagination.page < pagination.pages,
          });

          // 隐藏加载提示
          this.hideLoading();
        } else {
          this.hideLoading();
          wx.showToast({
            title: "获取订单失败",
            icon: "none",
          });
        }
      })
      .catch((err) => {
        console.error("获取订单失败", err);
        this.hideLoading();

        // 处理错误
        let errorMsg = "获取订单失败";
        if (err.statusCode === 401) {
          errorMsg = "登录已过期，请重新登录";
          // 可以跳转到登录页
        }

        wx.showToast({
          title: errorMsg,
          icon: "none",
        });
      });
  },

  // 加载更多订单
  loadMoreOrders: function () {
    if (this.data.hasMore && !this.data.isLoading) {
      this.setData({
        "pagination.page": this.data.pagination.page + 1,
      });
      this.loadOrders(true);
    }
  },

  // 按状态筛选
  filterByStatus: function (e) {
    const status = e.currentTarget.dataset.status;
    this.setData({
      currentStatus: status,
      "pagination.page": 1, // 重置分页
    });
    this.loadOrders(); // 重新加载订单
  },

  // 搜索输入
  onSearchInput: function (e) {
    this.setData({
      searchKeyword: e.detail.value,
    });
  },

  // 搜索
  onSearch: function () {
    this.setData({
      "pagination.page": 1, // 重置分页
    });
    this.loadOrders(); // 重新加载订单
  },

  // 清除搜索
  clearSearch: function () {
    this.setData({
      searchKeyword: "",
      "pagination.page": 1, // 重置分页
    });
    this.loadOrders(); // 重新加载订单
  },

  // 处理滑动变化
  handleMovableViewChange: function (e) {
    const { x } = e.detail;
    const { index } = e.currentTarget.dataset;

    // 当滑动超过一定距离时，显示删除按钮
    if (x < -70) {
      let { orders } = this.data;
      orders[index].x = -150;
      this.setData({
        orders,
      });
    }
  },

  // 处理触摸结束
  handleTouchEnd: function (e) {
    const { index } = e.currentTarget.dataset;
    let { orders } = this.data;

    // 根据当前x值决定是否显示删除按钮
    if (orders[index].x < -75) {
      orders[index].x = -150;
    } else {
      orders[index].x = 0;
    }

    this.setData({
      orders,
    });
  },

  // 取消订单
  cancelOrder: function (e) {
    const orderId = e.currentTarget.dataset.orderId;

    wx.showModal({
      title: "提示",
      content: "确定取消该计划？",
      success: (res) => {
        if (res.confirm) {
          // 显示加载中
          wx.showLoading({
            title: "取消中...",
            mask: true,
          });

          // 调用取消订单API
          orders
            .cancelOrder(orderId)
            .then((res) => {
              wx.hideLoading();

              if (res.success) {
                // 更新本地订单状态
                const updatedOrders = this.data.orders.map((order) => {
                  if (order.id === orderId) {
                    return {
                      ...order,
                      status: "已取消",
                    };
                  }
                  return order;
                });

                this.setData({
                  orders: updatedOrders,
                });

                wx.showToast({
                  title: "计划已取消",
                  icon: "success",
                });
                
                // 重新加载订单数据
                this.loadOrders();
              } else {
                throw new Error(res.error || "取消失败");
              }
            })
            .catch((err) => {
              wx.hideLoading();
              console.error("取消订单失败", err);

              // 处理错误
              let errorMsg = "取消失败";
              if (err.statusCode === 401) {
                errorMsg = "登录已过期，请重新登录";
              } else if (err.statusCode === 403) {
                errorMsg = "无权限取消该订单";
              } else if (err.statusCode === 404) {
                errorMsg = "订单不存在";
              } else if (err.statusCode === 409) {
                errorMsg = "订单状态不允许取消";
              }

              wx.showToast({
                title: err.message || errorMsg,
                icon: "none",
              });
            });
        }
      },
    });
  },

  // 显示订单详情
  showOrderDetail: function (e) {
    const order = e.currentTarget.dataset.order;

    this.setData({
      currentOrder: order,
      showOrderDetail: true,
    });
  },

  // 关闭订单详情
  closeOrderDetail: function () {
    this.setData({
      showOrderDetail: false,
    });
  },

  // 取消当前订单
  cancelCurrentOrder: function () {
    const orderId = this.data.currentOrder.id;

    wx.showModal({
      title: "提示",
      content: "确定取消该计划？",
      success: (res) => {
        if (res.confirm) {
          // 显示加载中
          wx.showLoading({
            title: "取消中...",
            mask: true,
          });

          // 调用取消订单API
          orders
            .cancelOrder(orderId)
            .then((res) => {
              wx.hideLoading();

              if (res.success) {
                // 更新本地订单状态
                const updatedOrders = this.data.orders.map((order) => {
                  if (order.id === orderId) {
                    return {
                      ...order,
                      status: "已取消",
                    };
                  }
                  return order;
                });

                // 更新当前订单状态
                const currentOrder = this.data.currentOrder;
                currentOrder.status = "已取消";

                this.setData({
                  orders: updatedOrders,
                  currentOrder: currentOrder,
                });

                wx.showToast({
                  title: "计划已取消",
                  icon: "success",
                });
                
                // 重新加载订单数据
                this.loadOrders();
              } else {
                throw new Error(res.error || "取消失败");
              }
            })
            .catch((err) => {
              wx.hideLoading();
              console.error("取消订单失败", err);

              // 处理错误
              let errorMsg = "取消失败";
              if (err.statusCode === 401) {
                errorMsg = "登录已过期，请重新登录";
              } else if (err.statusCode === 403) {
                errorMsg = "无权限取消该订单";
              } else if (err.statusCode === 404) {
                errorMsg = "订单不存在";
              } else if (err.statusCode === 409) {
                errorMsg = "订单状态不允许取消";
              }

              wx.showToast({
                title: err.message || errorMsg,
                icon: "none",
              });
            });
        }
      },
    });
  },

  // 再来一单
  reorder: function () {
    const { items } = this.data.currentOrder;

    // 清空当前购物车
    app.globalData.cartItems = [];

    // 将订单中的商品添加到购物车
    items.forEach((item) => {
      app.globalData.cartItems.push({
        id: item.dish, // 使用菜品ID
        name: item.name,
        price: item.price,
        count: item.quantity,
        image: item.image,
      });
    });

    // 关闭弹窗
    this.closeOrderDetail();

    // 跳转到购物车页面
    wx.navigateTo({
      url: "/pages/cart/cart",
    });
  },

  // 去点餐
  goToOrder: function () {
    wx.switchTab({
      url: "/pages/order/order",
    });
  },
});
