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
  },

  // onLoad: function () {
  //   // 加载分类和菜品数据
  //   this.loadCategoriesAndDishes()
  // },

  onShow: function () {
    // 每次显示页面时刷新数据
    this.loadCategoriesAndDishes();
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

          // 先设置基本分类数据
          this.setData({
            categories: categories.map(category => ({
              ...category,
              id: category._id, // 确保 id 字段一致
              dishCount: 0, // 初始化菜品数量为0
            })),
            categoryNames,
          });
          
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
  
  // 加载菜品数据
  loadDishes: function() {
    // 使用 API 获取菜品数据
    dishes.getDishes().then(res => {
      if (res.success) {
        const dishesData = res.data || [];

        // 更新全局数据
        app.globalData.dishes = dishesData;
        
        // 处理菜品数据，确保字段一致性
        const processedDishes = dishesData.map(dish => ({
          ...dish,
          id: dish._id, // 确保 id 字段一致
          categoryId: dish.category, // 确保 categoryId 字段一致
        }));

        this.setData({
          dishes: processedDishes,
          filteredDishes: processedDishes // 默认显示所有菜品
        });

        // 更新分类中的菜品数量
        this.updateCategoryDishCount();
      }
    }).catch(err => {
      console.error('获取菜品失败', err);
      wx.showToast({
        title: '获取菜品失败',
        icon: 'none'
      });
    });
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
    const { dishes, categories } = this.data;

    let filteredDishes = [];

    if (categoryIndex == 0) {
      // 全部分类
      filteredDishes = dishes;
    } else {
      // 按分类筛选
      const categoryId = categories[categoryIndex - 1].id;
      filteredDishes = dishes.filter((dish) => dish.categoryId === categoryId);
    }

    this.setData({
      filteredDishes,
    });
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
          dishes.deleteDish(dishId)
            .then(res => {
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
            .catch(err => {
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

  // 更新分类中的菜品数量
  updateCategoryDishCount: function () {
    const { categories, dishes } = this.data;

    const updatedCategories = categories.map((category) => {
      const dishCount = dishes.filter((dish) => dish.categoryId === category.id).length;
      return {
        ...category,
        dishCount,
      };
    });

    this.setData({
      categories: updatedCategories,
    });
  },
});
