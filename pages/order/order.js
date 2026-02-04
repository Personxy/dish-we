const app = getApp();
import { dishes, categories } from "../../utils/api";

Page({
  data: {
    categories: [],
    dishes: [],
    filteredDishes: [],
    currentCategory: {},
    searchKeyword: "",
    isLoading: false,
    loadingText: "", // 添加加载文本
    loadingTimer: null, // 添加计时器
    pageSize: 10,
    currentPage: 1,
    hasMore: true,
    cartCount: 0,
    // totalPrice: 0,
    showDishDetail: false,
    currentDish: {},
    currentDishCount: 1,
    hasToken: false,
  },

  onLoad: function () {
    this.loadCategories();
  },

  onShow: function () {
    this.updateCartInfo();
    const token = wx.getStorageSync("token");
    this.setData({ hasToken: !!token });
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

  // 加载分类数据
  loadCategories: function () {
    // 显示加载提示
    this.showLoading("获取分类中...");

    // 调用分类API
    categories
      .getCategories({
        withDishCount: true,
      })
      .then((res) => {
        if (res.success) {
          const categoriesData = res.data || [];

          // 处理分类数据，确保字段一致性
          const processedCategories = categoriesData.map((category) => ({
            ...category,
            id: category._id, // 确保id字段一致
            name: category.name,
            description: category.description,
          }));

          // 更新全局数据
          app.globalData.categories = processedCategories;

          if (processedCategories && processedCategories.length > 0) {
            this.setData({
              categories: processedCategories,
              currentCategory: processedCategories[0], // 默认选择第一个分类
            });

            // 隐藏分类加载提示
            this.hideLoading();

            // 加载菜品数据
            this.loadDishes();
          } else {
            this.hideLoading();
          }
        } else {
          this.hideLoading();
          wx.showToast({
            title: "获取分类失败",
            icon: "none",
          });
        }
      })
      .catch((err) => {
        console.error("获取分类失败", err);
        this.hideLoading();
        wx.showToast({
          title: "获取分类失败",
          icon: "none",
        });
      });
  },

  // 加载菜品数据
  loadDishes: function (isLoadMore = false) {
    if (!isLoadMore) {
      this.setData({
        currentPage: 1,
        hasMore: true,
      });

      // 显示加载提示
      this.showLoading("获取菜品中...");
    } else {
      // 加载更多时显示不同的提示
      this.showLoading("加载更多菜品...");
    }

    // 构建查询参数
    const params = {
      page: this.data.currentPage,
      limit: this.data.pageSize,
      sort: "createdAt:desc",
    };

    // 如果有分类筛选
    if (this.data.currentCategory && this.data.currentCategory.id) {
      params.category = this.data.currentCategory.id;
    }

    // 如果有搜索关键词
    if (this.data.searchKeyword) {
      params.search = this.data.searchKeyword;
    }

    // 只获取可用菜品
    params.isAvailable = true;

    // 调用菜品API
    dishes
      .getDishes(params)
      .then((res) => {
        if (res.success) {
          res.data.forEach((dish) => {
            if (dish.ingredients && dish.ingredients.length > 0) {
              const ingredientNames = dish.ingredients.slice(0, 3).map((ing) => ing.name);
              dish.ingredientsText = ingredientNames.join("、") + (dish.ingredients.length > 3 ? " 等" : "");
            } else {
              dish.ingredientsText = "";
            }
          });
          const dishesData = res.data || [];
          const pagination = res.pagination || {};

          // 处理菜品数据，确保字段一致性
          const processedDishes = dishesData.map((dish) => ({
            ...dish,
            id: dish._id, // 确保id字段一致
            categoryId: dish.category._id, // 确保categoryId字段一致
            image: dish.image, // 图片URL
            price: dish.price,
            name: dish.name,
            description: dish.description,
          }));

          // 更新全局数据
          if (!isLoadMore) {
            app.globalData.dishes = processedDishes;
          }

          // 判断是否还有更多数据
          const hasMore = pagination.page < pagination.pages;

          this.setData({
            dishes: processedDishes,
            filteredDishes: isLoadMore ? [...this.data.filteredDishes, ...processedDishes] : processedDishes,
            hasMore: hasMore,
          });

          // 隐藏加载提示
          this.hideLoading();
        } else {
          this.hideLoading();
          wx.showToast({
            title: "获取菜品失败",
            icon: "none",
          });
        }
      })
      .catch((err) => {
        console.error("获取菜品失败", err);
        this.hideLoading();
        wx.showToast({
          title: "获取菜品失败",
          icon: "none",
        });
      });
  },

  // 选择分类
  selectCategory: function (e) {
    const category = e.currentTarget.dataset.category;
    this.setData({
      currentCategory: category,
      searchKeyword: "",
    });
    this.loadDishes();
  },

  // 搜索输入
  onSearchInput: function (e) {
    this.setData({
      searchKeyword: e.detail.value,
    });
  },

  // 搜索
  onSearch: function () {
    this.loadDishes();
  },

  // 清除搜索
  clearSearch: function () {
    this.setData({
      searchKeyword: "",
    });
    this.loadDishes();
  },

  // 加载更多
  loadMoreDishes: function () {
    if (this.data.hasMore && !this.data.isLoading) {
      this.setData({
        currentPage: this.data.currentPage + 1,
        isLoading: true,
      });
      this.loadDishes(true);
    }
  },

  // 显示菜品详情
  showDishDetail: function (e) {
    const dish = e.currentTarget.dataset.dish;

    // 检查购物车中是否已有该菜品
    let count = 1;
    const cartItems = app.globalData.cartItems;
    const existItem = cartItems.find((item) => item.id === dish.id);
    if (existItem) {
      count = existItem.count;
    }

    this.setData({
      currentDish: dish,
      currentDishCount: count,
      showDishDetail: true,
    });
  },

  // 关闭菜品详情
  closeDishDetail: function () {
    this.setData({
      showDishDetail: false,
    });
  },

  // 增加当前菜品数量
  increaseDishCount: function () {
    this.setData({
      currentDishCount: this.data.currentDishCount + 1,
    });
  },

  // 减少当前菜品数量
  decreaseDishCount: function () {
    if (this.data.currentDishCount > 0) {
      this.setData({
        currentDishCount: this.data.currentDishCount - 1,
      });
    }
  },

  // 确认添加到购物车
  confirmAddToCart: function () {
    const { currentDish, currentDishCount } = this.data;
    if (currentDishCount <= 0) {
      wx.showToast({
        title: "请至少选择1份",
        icon: "none",
      });
      return;
    }

    // 更新购物车
    let cartItems = app.globalData.cartItems;
    const index = cartItems.findIndex((item) => item.id === currentDish.id);

    if (index > -1) {
      // 已有该菜品，更新数量
      cartItems[index].count = currentDishCount;
    } else {
      // 添加新菜品
      cartItems.push({
        ...currentDish,
        count: currentDishCount,
      });
    }

    // 如果数量为0则从购物车移除
    if (currentDishCount === 0) {
      cartItems = cartItems.filter((item) => item.id !== currentDish.id);
    }

    app.globalData.cartItems = cartItems;

    // 更新购物车信息
    this.updateCartInfo();

    // 关闭弹窗
    this.closeDishDetail();

    wx.showToast({
      title: currentDishCount > 0 ? "已加入菜单" : "已从菜单移除",
      icon: "success",
    });
  },

  // 直接添加到购物车（不弹窗）
  addToCart: function (e) {
    const dish = e.currentTarget.dataset.dish;
    app.addToCart(dish);
    this.updateCartInfo();

    wx.showToast({
      title: "已加入菜单",
      icon: "success",
    });
  },

  // 更新购物车信息（数量和总价）
  updateCartInfo: function () {
    const cartItems = app.globalData.cartItems;

    let total = 0;

    this.setData({
      cartCount: cartItems.length,
      // totalPrice: total.toFixed(2),
    });
  },

  // 去结算
  checkout: function () {
    if (this.data.cartCount > 0) {
      wx.navigateTo({
        url: "/pages/cart/cart",
      });
    } else {
      wx.showToast({
        title: "菜单为空",
        icon: "none",
      });
    }
  },

  // 前往购物车页面
  navigateToCart: function () {
    wx.navigateTo({
      url: "/pages/cart/cart",
    });
  },

  goToLogin: function () {
    wx.navigateTo({ url: "/pages/login/login?returnUrl=" + encodeURIComponent("/pages/order/order") });
  },
  // 预览图片
  previewImage: function (e) {
    const url = e.currentTarget.dataset.url;
    wx.previewImage({
      current: url, // 当前显示图片的链接
      urls: [url], // 需要预览的图片链接列表
    });
  },
});
