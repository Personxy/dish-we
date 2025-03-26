const app = getApp()

Page({
  data: {
    isEditing: false, // 是否是编辑模式
    dishId: '', // 菜品ID
    categoryIndex: 0, // 分类选择器的索引
    categoryNames: [], // 分类名称列表
    tempImagePath: '', // 临时图片路径
    descriptionLength: 0, // 描述文字长度
    dishForm: { // 菜品表单数据
      name: '',
      categoryId: '',
      price: '',
      image: '',
      description: ''
    }
  },

  onLoad: function (options) {
    // 加载分类数据
    this.loadCategories()
    
    // 如果有ID参数，则为编辑模式
    if (options.id) {
      this.setData({
        isEditing: true,
        dishId: options.id
      })
      
      // 加载菜品数据
      this.loadDishData(options.id)
    }
  },

  // 加载分类数据
  loadCategories: function () {
    const categories = app.globalData.categories || []
    
    if (categories.length === 0) {
      wx.showModal({
        title: '提示',
        content: '请先添加分类',
        showCancel: false,
        success: () => {
          wx.navigateBack()
        }
      })
      return
    }
    
    const categoryNames = categories.map(item => item.name)
    
    this.setData({
      categoryNames,
      'dishForm.categoryId': categories[0].id
    })
  },

  // 加载菜品数据
  loadDishData: function (dishId) {
    const dishes = app.globalData.dishes || []
    const dish = dishes.find(item => item.id == dishId)
    
    if (!dish) {
      wx.showToast({
        title: '菜品不存在',
        icon: 'none',
        success: () => {
          setTimeout(() => {
            wx.navigateBack()
          }, 1500)
        }
      })
      return
    }
    
    // 获取分类索引
    const categories = app.globalData.categories || []
    const categoryIndex = categories.findIndex(item => item.id === dish.categoryId)
    
    this.setData({
      tempImagePath: dish.image,
      categoryIndex: categoryIndex > -1 ? categoryIndex : 0,
      descriptionLength: dish.description ? dish.description.length : 0,
      dishForm: {
        name: dish.name,
        categoryId: dish.categoryId,
        price: dish.price,
        image: dish.image,
        description: dish.description
      }
    })
  },

  // 选择图片
  chooseImage: function () {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        // 获取选中图片的临时路径
        const tempFilePath = res.tempFilePaths[0]
        
        this.setData({
          tempImagePath: tempFilePath,
          'dishForm.image': tempFilePath
        })
      }
    })
  },

  // 分类选择变化
  onCategoryChange: function (e) {
    const index = e.detail.value
    const categories = app.globalData.categories || []
    
    this.setData({
      categoryIndex: index,
      'dishForm.categoryId': categories[index].id
    })
  },

  // 名称输入
  onNameInput: function (e) {
    this.setData({
      'dishForm.name': e.detail.value
    })
  },

  // 价格输入
  onPriceInput: function (e) {
    let price = e.detail.value
    
    // 限制只能输入数字和小数点
    price = price.replace(/[^\d.]/g, '')
    
    // 限制只能有一个小数点
    if (price.split('.').length > 2) {
      price = price.split('.')[0] + '.' + price.split('.').slice(1).join('')
    }
    
    // 限制小数点后最多两位
    if (price.indexOf('.') > -1) {
      const integer = price.split('.')[0]
      let decimal = price.split('.')[1]
      
      if (decimal.length > 2) {
        decimal = decimal.substring(0, 2)
      }
      
      price = integer + '.' + decimal
    }
    
    this.setData({
      'dishForm.price': price
    })
  },

  // 描述输入
  onDescriptionInput: function (e) {
    const description = e.detail.value
    
    this.setData({
      'dishForm.description': description,
      descriptionLength: description.length
    })
  },

  // 保存菜品
  saveDish: function () {
    const { dishForm, isEditing, dishId } = this.data
    
    // 表单验证
    if (!this.validateForm()) {
      return
    }
    
    // 获取全局菜品数据
    const dishes = app.globalData.dishes || []
    
    if (isEditing) {
      // 编辑模式：更新现有菜品
      const index = dishes.findIndex(item => item.id == dishId)
      
      if (index > -1) {
        dishes[index] = {
          ...dishes[index],
          name: dishForm.name,
          categoryId: dishForm.categoryId,
          price: parseFloat(dishForm.price),
          image: dishForm.image,
          description: dishForm.description
        }
      }
    } else {
      // 添加模式：创建新菜品
      const newId = dishes.length > 0 ? Math.max(...dishes.map(item => item.id)) + 1 : 1
      
      dishes.push({
        id: newId,
        name: dishForm.name,
        categoryId: dishForm.categoryId,
        price: parseFloat(dishForm.price),
        image: dishForm.image,
        description: dishForm.description
      })
    }
    
    // 更新全局数据
    app.globalData.dishes = dishes
    
    wx.showToast({
      title: isEditing ? '菜品已更新' : '菜品已添加',
      icon: 'success',
      success: () => {
        setTimeout(() => {
          wx.navigateBack()
        }, 1500)
      }
    })
  },

  // 表单验证
  validateForm: function () {
    const { dishForm, tempImagePath } = this.data
    
    if (!tempImagePath) {
      wx.showToast({
        title: '请上传菜品图片',
        icon: 'none'
      })
      return false
    }
    
    if (!dishForm.name.trim()) {
      wx.showToast({
        title: '请输入菜品名称',
        icon: 'none'
      })
      return false
    }
    
    if (!dishForm.price) {
      wx.showToast({
        title: '请输入菜品价格',
        icon: 'none'
      })
      return false
    }
    
    // 价格必须大于0
    if (parseFloat(dishForm.price) <= 0) {
      wx.showToast({
        title: '价格必须大于0',
        icon: 'none'
      })
      return false
    }
    
    return true
  },

  // 取消
  cancel: function () {
    wx.navigateBack()
  }
}) 