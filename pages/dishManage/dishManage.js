const app = getApp()

Page({
  data: {
    currentTab: 'category', // 当前标签页：category-分类管理、dish-菜品管理
    categories: [], // 分类列表
    dishes: [], // 菜品列表
    filteredDishes: [], // 筛选后的菜品列表
    categoryIndex: 0, // 分类筛选的索引
    categoryNames: ['全部分类'], // 分类名称列表
    showCategoryModal: false, // 是否显示分类弹窗
    isEditingCategory: false, // 是否是编辑分类
    categoryForm: { // 分类表单数据
      id: '',
      name: ''
    }
  },

  onLoad: function () {
    // 加载分类和菜品数据
    this.loadCategoriesAndDishes()
  },

  onShow: function () {
    // 每次显示页面时刷新数据
    this.loadCategoriesAndDishes()
  },

  // 加载分类和菜品数据
  loadCategoriesAndDishes: function () {
    // 从全局获取分类和菜品数据
    const categories = app.globalData.categories || []
    const dishes = app.globalData.dishes || []
    
    // 处理分类数据：计算每个分类下的菜品数量
    const processedCategories = categories.map(category => {
      const dishCount = dishes.filter(dish => dish.categoryId === category.id).length
      return {
        ...category,
        dishCount
      }
    })
    
    // 生成分类名称列表：用于筛选菜品
    const categoryNames = ['全部分类'].concat(categories.map(item => item.name))
    
    this.setData({
      categories: processedCategories,
      dishes,
      filteredDishes: dishes, // 默认显示所有菜品
      categoryNames
    })
  },

  // 切换标签页
  switchTab: function (e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({
      currentTab: tab
    })
  },

  // 分类筛选变化
  onCategoryChange: function (e) {
    const index = e.detail.value
    this.setData({
      categoryIndex: index
    })
    
    // 筛选菜品
    this.filterDishes(index)
  },

  // 根据分类筛选菜品
  filterDishes: function (categoryIndex) {
    const { dishes, categories } = this.data
    
    let filteredDishes = []
    
    if (categoryIndex == 0) {
      // 全部分类
      filteredDishes = dishes
    } else {
      // 按分类筛选
      const categoryId = categories[categoryIndex - 1].id
      filteredDishes = dishes.filter(dish => dish.categoryId === categoryId)
    }
    
    this.setData({
      filteredDishes
    })
  },

  // 获取分类名称
  getCategoryName: function (categoryId) {
    const category = this.data.categories.find(item => item.id === categoryId)
    return category ? category.name : '未分类'
  },

  // 显示添加分类弹窗
  showAddCategory: function () {
    this.setData({
      showCategoryModal: true,
      isEditingCategory: false,
      categoryForm: {
        id: '',
        name: ''
      }
    })
  },

  // 显示编辑分类弹窗
  editCategory: function (e) {
    const category = e.currentTarget.dataset.category
    
    this.setData({
      showCategoryModal: true,
      isEditingCategory: true,
      categoryForm: {
        id: category.id,
        name: category.name
      }
    })
  },

  // 关闭分类弹窗
  closeCategoryModal: function () {
    this.setData({
      showCategoryModal: false
    })
  },

  // 分类名称输入
  onCategoryNameInput: function (e) {
    this.setData({
      'categoryForm.name': e.detail.value
    })
  },

  // 保存分类
  saveCategory: function () {
    const { categoryForm, isEditingCategory, categories } = this.data
    
    // 表单验证
    if (!categoryForm.name.trim()) {
      wx.showToast({
        title: '请输入分类名称',
        icon: 'none'
      })
      return
    }
    
    // 检查分类名称是否已存在
    const existingCategory = categories.find(
      item => item.name === categoryForm.name && item.id !== categoryForm.id
    )
    
    if (existingCategory) {
      wx.showToast({
        title: '分类名称已存在',
        icon: 'none'
      })
      return
    }
    
    if (isEditingCategory) {
      // 编辑分类
      const index = categories.findIndex(item => item.id === categoryForm.id)
      
      if (index > -1) {
        categories[index].name = categoryForm.name
      }
    } else {
      // 添加分类
      const newId = categories.length > 0 ? Math.max(...categories.map(item => item.id)) + 1 : 1
      
      categories.push({
        id: newId,
        name: categoryForm.name,
        dishCount: 0
      })
    }
    
    // 更新全局分类数据
    app.globalData.categories = categories.map(item => ({
      id: item.id,
      name: item.name
    }))
    
    // 更新页面数据
    this.setData({
      categories,
      showCategoryModal: false
    })
    
    // 更新分类名称列表
    this.updateCategoryNames()
    
    wx.showToast({
      title: isEditingCategory ? '分类已更新' : '分类已添加',
      icon: 'success'
    })
  },

  // 删除分类
  deleteCategory: function (e) {
    const categoryId = e.currentTarget.dataset.id
    const { categories, dishes } = this.data
    
    // 检查该分类下是否有菜品
    const hasDishes = dishes.some(dish => dish.categoryId === categoryId)
    
    if (hasDishes) {
      wx.showModal({
        title: '提示',
        content: '该分类下有菜品，删除将会清空该分类下的所有菜品，确定要删除吗？',
        success: (res) => {
          if (res.confirm) {
            this.confirmDeleteCategory(categoryId)
          }
        }
      })
    } else {
      wx.showModal({
        title: '提示',
        content: '确定要删除该分类吗？',
        success: (res) => {
          if (res.confirm) {
            this.confirmDeleteCategory(categoryId)
          }
        }
      })
    }
  },

  // 确认删除分类
  confirmDeleteCategory: function (categoryId) {
    let { categories, dishes } = this.data
    
    // 删除分类
    categories = categories.filter(item => item.id !== categoryId)
    
    // 删除该分类下的所有菜品
    dishes = dishes.filter(dish => dish.categoryId !== categoryId)
    
    // 更新全局数据
    app.globalData.categories = categories.map(item => ({
      id: item.id,
      name: item.name
    }))
    
    app.globalData.dishes = dishes
    
    // 更新页面数据
    this.setData({
      categories,
      dishes,
      filteredDishes: dishes
    })
    
    // 更新分类名称列表
    this.updateCategoryNames()
    
    wx.showToast({
      title: '分类已删除',
      icon: 'success'
    })
  },

  // 更新分类名称列表
  updateCategoryNames: function () {
    const categoryNames = ['全部分类'].concat(this.data.categories.map(item => item.name))
    
    this.setData({
      categoryNames,
      categoryIndex: 0
    })
  },

  // 添加菜品
  addDish: function () {
    // 检查是否有分类
    if (this.data.categories.length === 0) {
      wx.showModal({
        title: '提示',
        content: '请先添加分类',
        showCancel: false
      })
      return
    }
    
    // 跳转到菜品编辑页面
    wx.navigateTo({
      url: '/pages/dishEdit/dishEdit'
    })
  },

  // 编辑菜品
  editDish: function (e) {
    const dish = e.currentTarget.dataset.dish
    
    // 跳转到菜品编辑页面，并传递菜品数据
    wx.navigateTo({
      url: `/pages/dishEdit/dishEdit?id=${dish.id}`
    })
  },

  // 删除菜品
  deleteDish: function (e) {
    const dishId = e.currentTarget.dataset.id
    
    wx.showModal({
      title: '提示',
      content: '确定要删除该菜品吗？',
      success: (res) => {
        if (res.confirm) {
          let { dishes, filteredDishes } = this.data
          
          // 删除菜品
          dishes = dishes.filter(item => item.id !== dishId)
          filteredDishes = filteredDishes.filter(item => item.id !== dishId)
          
          // 更新全局数据
          app.globalData.dishes = dishes
          
          // 更新页面数据
          this.setData({
            dishes,
            filteredDishes
          })
          
          // 更新分类中的菜品数量
          this.updateCategoryDishCount()
          
          wx.showToast({
            title: '菜品已删除',
            icon: 'success'
          })
        }
      }
    })
  },

  // 更新分类中的菜品数量
  updateCategoryDishCount: function () {
    const { categories, dishes } = this.data
    
    const updatedCategories = categories.map(category => {
      const dishCount = dishes.filter(dish => dish.categoryId === category.id).length
      return {
        ...category,
        dishCount
      }
    })
    
    this.setData({
      categories: updatedCategories
    })
  }
}) 