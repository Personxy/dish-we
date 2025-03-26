const app = getApp();

Page({
  data: {
    categories: [],
    dishes: [],
    filteredDishes: [],
    currentCategory: {},
    searchKeyword: "",
    isLoading: false,
    pageSize: 10,
    currentPage: 1,
    hasMore: true,
    cartCount: 0,
    totalPrice: 0,
    showDishDetail: false,
    currentDish: {},
    currentDishCount: 1,
  },

  onLoad: function () {
    this.loadCategories();
  },

  onShow: function () {
    this.updateCartInfo();
  },

  // 加载分类数据
  loadCategories: function () {
    // 从全局获取分类数据
    const categories = app.globalData.categories;
    if (categories && categories.length > 0) {
      this.setData({
        categories,
        currentCategory: categories[0], // 默认选择第一个分类
      });
      this.loadDishes();
    }
  },

  // 加载菜品数据
  loadDishes: function (isLoadMore = false) {
    if (!isLoadMore) {
      this.setData({
        currentPage: 1,
        hasMore: true,
        isLoading: true,
      });
    }

    // 从全局获取菜品数据
    const dishes = app.globalData.dishes;

    // 模拟网络请求延迟
    setTimeout(() => {
      // 根据当前分类过滤菜品
      let filteredDishes = [];

      if (this.data.searchKeyword) {
        // 搜索模式：根据关键字搜索所有菜品
        filteredDishes = dishes.filter(
          (dish) =>
            dish.name.indexOf(this.data.searchKeyword) > -1 || dish.description.indexOf(this.data.searchKeyword) > -1
        );
      } else {
        // 根据当前分类过滤
        filteredDishes = dishes.filter((dish) => dish.categoryId === this.data.currentCategory.id);
      }

      // 分页处理
      const startIndex = (this.data.currentPage - 1) * this.data.pageSize;
      const endIndex = this.data.currentPage * this.data.pageSize;
      const currentPageDishes = filteredDishes.slice(startIndex, endIndex);

      // 判断是否还有更多数据
      const hasMore = filteredDishes.length > endIndex;

      this.setData({
        dishes: filteredDishes,
        filteredDishes: isLoadMore ? [...this.data.filteredDishes, ...currentPageDishes] : currentPageDishes,
        isLoading: false,
        hasMore,
      });
    }, 500);
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
      title: currentDishCount > 0 ? "已加入购物车" : "已从购物车移除",
      icon: "success",
    });
  },

  // 直接添加到购物车（不弹窗）
  addToCart: function (e) {
    const dish = e.currentTarget.dataset.dish;
    app.addToCart(dish);
    this.updateCartInfo();

    wx.showToast({
      title: "已加入购物车",
      icon: "success",
    });
  },

  // 更新购物车信息（数量和总价）
  updateCartInfo: function () {
    const cartItems = app.globalData.cartItems;
    let count = 0;
    let total = 0;

    this.setData({
      cartCount: count,
      totalPrice: total.toFixed(2),
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
        title: "购物车为空",
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
});
