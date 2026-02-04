const app = getApp();
import { categories, dishes } from "../../utils/api";

Page({
  data: {
    currentTab: "category", // 当前标签页：category-分类管理、dish-菜品管理
    categories: [], // 分类列表
    dishes: [], // 菜品列表
    filteredDishes: [], // 筛选后的菜品列表
    categoryIndex: 0, // 分类筛选的索引
    categoryNames: ["全部分类"], // 分类名称列表
    showCategoryModal: false, // 是否显示分类弹窗
    isEditingCategory: false, // 是否是编辑分类
    categoryForm: {
      // 分类表单数据
      id: "",
      name: "",
    },
    // 添加分页相关数据
    pageSize: 10,
    currentPage: 1,
    hasMore: true,
    isLoading: false,
    loadingText: "",
    loadingTimer: null,
    // 排序相关
    isSorting: false, // 是否处于排序模式
    dragStartY: 0, // 拖拽开始的Y坐标
    dragStartIndex: -1, // 拖拽开始的索引
    dragItemHeight: 0, // 拖拽项的高度
    dragCurrentIndex: -1, // 当前拖拽项的索引
    categoriesBeforeSort: [], // 排序前的分类列表备份
  },

  // onLoad: function () {
  //   // 加载分类和菜品数据
  //   this.loadCategoriesAndDishes()
  // },

  onShow: function () {
    // 每次显示页面时刷新数据
    app.ensureLogin().then((logged) => {
      if (logged) {
        this.loadCategoriesAndDishes();
      } else {
        wx.showToast({
          title: "请登录后使用菜品管理",
          icon: "none",
        });
      }
    });
  },

  // 加载分类和菜品数据
  loadCategoriesAndDishes: function () {
    // 使用 API 获取分类数据
    categories
      .getCategories()
      .then((res) => {
        if (res.success) {
          const categories = res.data || [];

          // 更新全局数据
          app.globalData.categories = categories;

          // 生成分类名称列表：用于筛选菜品
          const categoryNames = ["全部分类"].concat(categories.map((item) => item.name));
          console.log("分类数据", categories);
          // 先设置基本分类数据
          this.setData({
            categories: categories.map((category) => ({
              ...category,
              id: category._id, // 确保 id 字段一致
              dishCount: Number(category.dishCount || 0), // 确保 dishCount 是数字类型
            })),
            categoryNames,
          });
          console.log(this.data.categories);
          // 加载菜品数据后再更新菜品数量
          this.loadDishes();
        }
      })
      .catch((err) => {
        console.error("获取分类失败", err);
        wx.showToast({
          title: "获取分类失败",
          icon: "none",
        });
      });
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

  // 加载菜品数据
  loadDishes: function (isLoadMore = false, categoryId = null) {
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

    // 如果直接传入了分类ID，优先使用传入的
    if (categoryId) {
      params.category = categoryId;
    }
    // 否则使用当前选中的分类
    else if (this.data.categoryIndex > 0) {
      const selectedCategoryId = this.data.categories[this.data.categoryIndex - 1].id;
      params.category = selectedCategoryId;
    }

    // 调用菜品API
    dishes
      .getDishes(params)
      .then((res) => {
        if (res.success) {
          const dishesData = res.data || [];
          const pagination = res.pagination || {};

          // 处理菜品数据，确保字段一致性
          const processedDishes = dishesData.map((dish) => ({
            ...dish,
            id: dish._id, // 确保id字段一致
            categoryId: dish.category, // 确保categoryId字段一致
          }));

          // 更新全局数据
          if (!isLoadMore) {
            app.globalData.dishes = processedDishes;
          }

          // 判断是否还有更多数据
          const hasMore = pagination.page < pagination.pages;

          this.setData({
            dishes: isLoadMore ? [...this.data.dishes, ...processedDishes] : processedDishes,
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

  // 加载更多菜品
  loadMoreDishes: function () {
    if (this.data.hasMore && !this.data.isLoading) {
      this.setData({
        currentPage: this.data.currentPage + 1,
      });
      this.loadDishes(true);
    }
  },

  // 切换标签页
  switchTab: function (e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({
      currentTab: tab,
    });
  },

  // 分类筛选变化
  onCategoryChange: function (e) {
    const index = e.detail.value;
    this.setData({
      categoryIndex: index,
    });

    // 筛选菜品
    this.filterDishes(index);
  },

  // 根据分类筛选菜品
  filterDishes: function (categoryIndex) {
    // 切换分类时重置分页并重新加载数据
    this.setData({
      currentPage: 1,
      hasMore: true,
    });
    this.loadDishes();
  },

  // 获取分类名称
  getCategoryName: function (categoryId) {
    const category = this.data.categories.find((item) => item.id === categoryId);
    return category ? category.name : "未分类";
  },

  // 显示添加分类弹窗
  showAddCategory: function () {
    this.setData({
      showCategoryModal: true,
      isEditingCategory: false,
      categoryForm: {
        id: "",
        name: "",
      },
    });
  },

  // 显示编辑分类弹窗
  editCategory: function (e) {
    const category = e.currentTarget.dataset.category;

    this.setData({
      showCategoryModal: true,
      isEditingCategory: true,
      categoryForm: {
        id: category.id,
        name: category.name,
      },
    });
  },

  // 关闭分类弹窗
  closeCategoryModal: function () {
    this.setData({
      showCategoryModal: false,
    });
  },

  // 分类名称输入
  onCategoryNameInput: function (e) {
    this.setData({
      "categoryForm.name": e.detail.value,
    });
  },

  // 保存分类
  saveCategory: function () {
    const { categoryForm, isEditingCategory } = this.data;

    // 表单验证
    if (!categoryForm.name.trim()) {
      wx.showToast({
        title: "请输入分类名称",
        icon: "none",
      });
      return;
    }

    // 显示加载提示
    wx.showLoading({
      title: isEditingCategory ? "更新中..." : "创建中...",
    });

    if (isEditingCategory) {
      // 编辑分类
      categories
        .updateCategory(categoryForm.id, {
          name: categoryForm.name,
        })
        .then((res) => {
          if (res.success) {
            wx.hideLoading();
            this.setData({
              showCategoryModal: false,
            });

            // 刷新数据
            this.loadCategoriesAndDishes();

            wx.showToast({
              title: "分类已更新",
              icon: "success",
            });
          } else {
            throw new Error(res.error?.message || "更新失败");
          }
        })
        .catch((err) => {
          wx.hideLoading();
          wx.showToast({
            title: err.message || "更新失败",
            icon: "none",
          });
        });
    } else {
      // 添加分类
      categories
        .createCategory({
          name: categoryForm.name,
        })
        .then((res) => {
          if (res.success) {
            wx.hideLoading();
            this.setData({
              showCategoryModal: false,
            });

            // 刷新数据
            this.loadCategoriesAndDishes();

            wx.showToast({
              title: "分类已添加",
              icon: "success",
            });
          } else {
            throw new Error(res.error?.message || "创建失败");
          }
        })
        .catch((err) => {
          wx.hideLoading();
          wx.showToast({
            title: err.message || "创建失败",
            icon: "none",
          });
        });
    }
  },

  // 确认删除分类
  confirmDeleteCategory: function (categoryId) {
    // 显示加载提示
    wx.showLoading({
      title: "删除中...",
    });

    categories
      .deleteCategory(categoryId)
      .then((res) => {
        if (res.success) {
          wx.hideLoading();

          // 刷新数据
          this.loadCategoriesAndDishes();

          wx.showToast({
            title: "分类已删除",
            icon: "success",
          });
        } else {
          throw new Error(res.error?.message || "删除失败");
        }
      })
      .catch((err) => {
        wx.hideLoading();
        wx.showToast({
          title: err.message || "删除失败",
          icon: "none",
        });
      });
  },

  // 删除分类
  deleteCategory: function (e) {
    const categoryId = e.currentTarget.dataset.id;
    const { categories, dishes } = this.data;
    const { dishCount } = categories;
    // 检查该分类下是否有菜品

    if (dishCount > 0) {
      wx.showModal({
        title: "提示",
        content: "该分类下有菜品，删除将会清空该分类下的所有菜品，确定要删除吗？",
        success: (res) => {
          if (res.confirm) {
            this.confirmDeleteCategory(categoryId);
          }
        },
      });
    } else {
      wx.showModal({
        title: "提示",
        content: "确定要删除该分类吗？",
        success: (res) => {
          if (res.confirm) {
            this.confirmDeleteCategory(categoryId);
          }
        },
      });
    }
  },

  // 确认删除分类
  confirmDeleteCategory: function (categoryId) {
    // 显示加载提示
    wx.showLoading({
      title: "删除中...",
    });

    categories
      .deleteCategory(categoryId)
      .then((res) => {
        if (res.success) {
          wx.hideLoading();

          // 刷新数据
          this.loadCategoriesAndDishes();

          wx.showToast({
            title: "分类已删除",
            icon: "success",
          });
        } else {
          throw new Error(res.error?.message || "删除失败");
        }
      })
      .catch((err) => {
        wx.hideLoading();
        wx.showToast({
          title: err.message || "删除失败",
          icon: "none",
        });
      });
  },

  // 更新分类名称列表
  updateCategoryNames: function () {
    const categoryNames = ["全部分类"].concat(this.data.categories.map((item) => item.name));

    this.setData({
      categoryNames,
      categoryIndex: 0,
    });
  },

  // 添加菜品
  addDish: function () {
    // 检查是否有分类
    if (this.data.categories.length === 0) {
      wx.showModal({
        title: "提示",
        content: "请先添加分类",
        showCancel: false,
      });
      return;
    }

    // 跳转到菜品编辑页面
    wx.navigateTo({
      url: "/pages/dishEdit/dishEdit",
    });
  },

  // 编辑菜品
  editDish: function (e) {
    const dish = e.currentTarget.dataset.dish;

    // 将完整的菜品数据转为 JSON 字符串传递
    const dishData = JSON.stringify(dish);

    // 跳转到菜品编辑页面，并传递菜品数据
    wx.navigateTo({
      url: `/pages/dishEdit/dishEdit?id=${dish.id}&dishData=${encodeURIComponent(dishData)}`,
    });
  },

  // 删除菜品
  deleteDish: function (e) {
    const dishId = e.currentTarget.dataset.id;

    wx.showModal({
      title: "提示",
      content: "确定要删除该菜品吗？",
      success: (res) => {
        if (res.confirm) {
          // 显示加载提示
          wx.showLoading({
            title: "删除中...",
          });

          // 调用删除菜品API
          dishes
            .deleteDish(dishId)
            .then((res) => {
              if (res.success) {
                wx.hideLoading();

                // 刷新菜品数据
                this.loadDishes();

                wx.showToast({
                  title: "菜品已删除",
                  icon: "success",
                });
              } else {
                throw new Error(res.error?.message || "删除失败");
              }
            })
            .catch((err) => {
              wx.hideLoading();
              wx.showToast({
                title: err.message || "删除失败",
                icon: "none",
              });
            });
        }
      },
    });
  },

  // 切换排序模式
  toggleSortMode: function () {
    if (this.data.isSorting) {
      // 如果当前是排序模式，则保存排序结果
      this.saveCategoryOrder();
    } else {
      // 如果当前不是排序模式，则进入排序模式
      // 备份当前分类列表
      this.setData({
        categoriesBeforeSort: JSON.parse(JSON.stringify(this.data.categories)),
        isSorting: true,
      });
    }
  },
  // 取消排序
  cancelSorting: function () {
    // 恢复原来的排序
    this.setData({
      categories: this.data.categoriesBeforeSort,
      isSorting: false,
    });

    wx.showToast({
      title: "已取消排序",
      icon: "none",
    });
  },
  // 分类排序变化处理
  onCategorySort: function (e) {
    // 更新分类列表
    this.setData({
      categories: e.detail.list,
    });
  },

  // 分类项点击处理
  onCategoryTap: function (e) {
    const category = e.detail.item;
    // 可以在这里处理分类项的点击事件
  },

  // 保存分类排序
  saveCategoryOrder: function () {
    // 显示加载提示
    wx.showLoading({
      title: "保存排序中...",
    });

    // 构建排序数据
    const orders = this.data.categories.map((category, index) => ({
      id: category.id,
      sortOrder: index,
    }));

    // 调用API保存排序
    categories
      .updateCategoryOrder(orders)
      .then((res) => {
        wx.hideLoading();
        if (res.success) {
          this.setData({
            isSorting: false,
          });

          wx.showToast({
            title: "排序已保存",
            icon: "success",
          });

          // 刷新分类数据
          this.loadCategoriesAndDishes();
        } else {
          throw new Error(res.error?.message || "保存排序失败");
        }
      })
      .catch((err) => {
        wx.hideLoading();

        // 如果保存失败，恢复原来的排序
        this.setData({
          categories: this.data.categoriesBeforeSort,
          isSorting: false,
        });

        wx.showToast({
          title: err.message || "保存排序失败",
          icon: "none",
        });
      });
  },

  // 拖拽开始
  dragStart: function (e) {
    if (!this.data.isSorting) return;

    const index = e.currentTarget.dataset.index;
    const touch = e.touches[0];

    // 获取元素高度
    const query = wx.createSelectorQuery();
    query.select(".category-item").boundingClientRect();
    query.exec((res) => {
      if (res && res[0]) {
        this.setData({
          dragStartY: touch.clientY,
          dragStartIndex: index,
          dragCurrentIndex: index,
          dragItemHeight: res[0].height,
        });
      }
    });
  },

  // 拖拽移动
  dragMove: function (e) {
    if (!this.data.isSorting || this.data.dragStartIndex === -1) return;

    const touch = e.touches[0];
    const moveY = touch.clientY - this.data.dragStartY;
    const moveIndex = Math.round(moveY / this.data.dragItemHeight);

    let newIndex = this.data.dragStartIndex + moveIndex;

    // 确保新索引在有效范围内
    if (newIndex < 0) newIndex = 0;
    if (newIndex >= this.data.categories.length) newIndex = this.data.categories.length - 1;

    if (newIndex !== this.data.dragCurrentIndex) {
      // 更新列表顺序
      let categories = [...this.data.categories];
      const item = categories[this.data.dragStartIndex];

      // 从原位置移除
      categories.splice(this.data.dragStartIndex, 1);
      // 插入到新位置
      categories.splice(newIndex, 0, item);

      this.setData({
        categories: categories,
        dragCurrentIndex: newIndex,
      });
    }
  },

  // 拖拽结束
  dragEnd: function () {
    if (!this.data.isSorting) return;

    this.setData({
      dragStartIndex: -1,
      dragCurrentIndex: -1,
    });
  },
});
