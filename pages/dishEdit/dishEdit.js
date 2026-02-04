const app = getApp();
import { dishes, categories } from "../../utils/api";

Page({
  data: {
    activeTab: "basic", // 当前激活的 Tab
    isEditing: false, // 是否是编辑模式
    dishId: "", // 菜品ID
    categoryIndex: 0, // 分类选择器的索引
    categoryNames: [], // 分类名称列表
    tempImagePath: "", // 临时图片路径
    descriptionLength: 0, // 描述文字长度
    isUploading: false, // 图片上传状态
    showIngredientModal: false,
    unitOptions: [
      "克",
      "千克",
      "毫升",
      "升",
      "勺",
      "茶匙",
      "汤匙",
      "杯",
      "个",
      "只",
      "条",
      "片",
      "根",
      "把",
      "束",
      "瓣",
      "适量",
    ],
    unitIndex: 0,
    ingredientForm: {
      name: "",
      amount: "",
      unit: "克",
    },

    dishForm: {
      // 菜品表单数据
      name: "",
      categoryId: "",
      image: "",
      description: "",
      difficulty: 1,
      ingredients: [],
    },
    categories: [], // 分类列表
    difficultyText: ["简单", "较简单", "中等", "较难", "困难"],
  },

  // 切换 Tab
  switchTab: function (e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({
      activeTab: tab,
    });
  },

  onLoad: function (options) {
    // 加载分类数据

    // 如果有ID参数，则为编辑模式
    if (options.id) {
      this.setData({
        isEditing: true,
        dishId: options.id,
      });

      // 设置页面标题为"编辑菜品"
      wx.setNavigationBarTitle({
        title: "编辑菜品",
      });

      // 如果有传递的菜品数据，直接使用
      if (options.dishData) {
        try {
          const dishData = JSON.parse(decodeURIComponent(options.dishData));
          this.setDishData(dishData);
        } catch (error) {
          console.error("解析菜品数据失败", error);
          wx.showToast({
            title: "获取菜品数据失败",
            icon: "none",
            success: () => {
              setTimeout(() => {
                wx.navigateBack();
              }, 1500);
            },
          });
        }
      } else {
        // 如果没有传递菜品数据，则尝试从全局数据中获取
        const globalDishes = app.globalData.dishes || [];
        const dish = globalDishes.find((d) => d._id === options.id || d.id === options.id);

        if (dish) {
          this.setDishData(dish);
        } else {
          wx.showToast({
            title: "获取菜品数据失败",
            icon: "none",
            success: () => {
              setTimeout(() => {
                wx.navigateBack();
              }, 1500);
            },
          });
        }
      }
    } else {
      // 设置页面标题为"添加菜品"
      wx.setNavigationBarTitle({
        title: "添加菜品",
      });
    }
    this.loadCategories();
  },

  // 设置菜品数据到表单
  setDishData: function (dish) {
    this.setData({
      tempImagePath: dish.image.url || "", // 确保设置了 tempImagePath
      descriptionLength: dish.description ? dish.description.length : 0,
      dishForm: {
        name: dish.name || "",
        categoryId: dish.category._id || "", // 兼容两种字段名
        categoryName: dish.category.name, // 添加分类名称
        image: dish.image.url || "",
        description: dish.description || "",
        difficulty: dish.difficulty || 1,
        ingredients: dish.ingredients || [],
      },
    });
  },

  // 加载分类数据
  loadCategories: function () {
    // 显示加载提示
    wx.showLoading({
      title: "加载中...",
    });

    // 使用API获取分类数据
    categories
      .getCategories()
      .then((res) => {
        wx.hideLoading();

        if (res.success) {
          const categories = res.data || [];

          if (categories.length === 0) {
            wx.showModal({
              title: "提示",
              content: "请先添加分类",
              showCancel: false,
              success: () => {
                wx.navigateBack();
              },
            });
            return;
          }

          const categoryNames = categories.map((item) => item.name);
          const categoryIndex = categories.findIndex((item) => item._id === this.data.dishForm.categoryId);
          this.setData({
            categories: categories,
            categoryIndex: categoryIndex,
            categoryNames: categoryNames,
          });
        } else {
          wx.showToast({
            title: "获取分类失败",
            icon: "none",
            success: () => {
              setTimeout(() => {
                wx.navigateBack();
              }, 1500);
            },
          });
        }
      })
      .catch((err) => {
        wx.hideLoading();
        wx.showToast({
          title: "获取分类失败",
          icon: "none",
          success: () => {
            setTimeout(() => {
              wx.navigateBack();
            }, 1500);
          },
        });
      });
  },

  // 选择图片
  chooseImage: function () {
    wx.chooseMedia({
      count: 1,
      sizeType: ["compressed"],
      sourceType: ["album", "camera"],
      success: (res) => {
        // 获取选中图片的临时路径
        console.log(res);
        const tempFilePath = res.tempFiles[0].tempFilePath;

        this.setData({
          tempImagePath: tempFilePath,
          "dishForm.image": tempFilePath,
          isUploading: true, // 标记正在上传图片
        });

        // 选择图片后立即上传
        this.uploadDishImage(tempFilePath)
          .then((fileUrl) => {
            console.log(fileUrl, "url");
            this.setData({
              "dishForm.image": fileUrl,
              isUploading: false,
            });
            // let dishForm=this.data.dishForm
            // dishForm.image=fileUrl
            wx.showToast({
              title: "图片上传成功",
              icon: "success",
              duration: 1500,
            });
          })
          .catch((err) => {
            this.setData({ isUploading: false });
            wx.showToast({
              title: err.message || "图片上传失败",
              icon: "none",
            });
          });
      },
    });
  },
  // 预览图片（放大查看）
  previewImage: function () {
    const url = this.data.tempImagePath || (this.data.dishForm.image ? this.data.dishForm.image.url : "");
    if (url) {
      wx.previewImage({
        urls: [url],
        current: url,
      });
    }
  },
  // 删除图片
  deleteImage: function (e) {
    // 不再需要阻止事件冒泡，因为我们在 wxml 中使用了 catchtap
    // e.stopPropagation();

    wx.showModal({
      title: "提示",
      content: "确定要删除图片吗？",
      success: (res) => {
        if (res.confirm) {
          this.setData({
            tempImagePath: "",
            "dishForm.image": null,
          });
        }
      },
    });
  },
  // 设置难度
  setDifficulty: function (e) {
    // 从事件对象中获取 level 值
    const level = e.detail.level;

    // 确保 level 是有效的数字
    if (!isNaN(level) && level > 0 && level <= 5) {
      this.setData({
        "dishForm.difficulty": level,
      });
    }
  },
  // 显示食材弹窗
  showIngredientModal: function () {
    this.setData({
      showIngredientModal: true,
      unitIndex: 0,
      ingredientForm: {
        name: "",
        amount: "",
        unit: "克",
      },
    });
  },
  editIngredient: function (e) {
    const { index, ingredient } = e.detail;

    // 找到对应单位的索引
    const unitIndex = this.data.unitOptions.findIndex((unit) => unit === ingredient.unit);

    this.setData({
      showIngredientModal: true,
      editingIngredientIndex: index,
      ingredientForm: {
        name: ingredient.name,
        amount: ingredient.amount,
        unit: ingredient.unit,
      },
      unitIndex: unitIndex !== -1 ? unitIndex : 0,
    });
  },
  // 隐藏食材弹窗
  hideIngredientModal: function () {
    this.setData({
      showIngredientModal: false,
    });
  },

  // 食材名称输入
  onIngredientNameInput: function (e) {
    this.setData({
      "ingredientForm.name": e.detail.value,
    });
  },

  // 食材用量输入
  onIngredientAmountInput: function (e) {
    this.setData({
      "ingredientForm.amount": e.detail.value,
    });
  },

  // 食材单位选择
  onIngredientUnitChange: function (e) {
    const index = e.detail.value;
    this.setData({
      unitIndex: index,
      "ingredientForm.unit": this.data.unitOptions[index],
    });
  },

  // 添加食材
  addIngredient: function () {
    const { name, amount, unit } = this.data.ingredientForm;
    const editingIndex = this.data.editingIngredientIndex;

    // 验证
    if (!name.trim()) {
      wx.showToast({
        title: "请输入食材名称",
        icon: "none",
      });
      return;
    }

    if (!amount) {
      wx.showToast({
        title: "请输入食材用量",
        icon: "none",
      });
      return;
    }

    const ingredients = this.data.dishForm.ingredients || [];
    const newIngredient = {
      name: name.trim(),
      amount: parseFloat(amount),
      unit: unit,
    };

    // 如果是编辑模式
    if (editingIndex !== undefined && editingIndex !== null) {
      ingredients[editingIndex] = newIngredient;
    } else {
      // 添加模式
      ingredients.push(newIngredient);
    }

    this.setData({
      "dishForm.ingredients": ingredients,
      showIngredientModal: false,
      editingIngredientIndex: null,
    });
  },

  // 删除食材
  deleteIngredient: function (e) {
    const index = e.currentTarget.dataset.index;
    const ingredients = this.data.dishForm.ingredients;
    ingredients.splice(index, 1);

    this.setData({
      "dishForm.ingredients": ingredients,
    });
  },
  // 分类选择变化
  onCategoryChange: function (e) {
    const index = e.detail.value;
    const category = this.data.categories[index];

    this.setData({
      categoryIndex: index,
      "dishForm.categoryId": category._id,
      "dishForm.categoryName": category.name,
    });
  },

  // 名称输入
  onNameInput: function (e) {
    this.setData({
      "dishForm.name": e.detail.value,
    });
  },

  // 描述输入
  onDescriptionInput: function (e) {
    const description = e.detail.value;

    this.setData({
      "dishForm.description": description,
      descriptionLength: description.length,
    });
  },

  // 上传菜品图片
  uploadDishImage: function (imagePath) {
    return new Promise((resolve, reject) => {
      // 如果是网络图片URL，先下载再上传
      if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
        wx.showLoading({
          title: "下载图片中...",
        });

        // 先下载网络图片到本地
        wx.downloadFile({
          url: imagePath,
          success: (res) => {
            if (res.statusCode === 200) {
              wx.hideLoading();
              // 下载成功后，检查文件大小并可能压缩
              this.checkAndCompressImage(res.tempFilePath)
                .then((compressedPath) => {
                  // 上传压缩后的图片
                  this.uploadLocalImage(compressedPath)
                    .then((fileUrl) => resolve(fileUrl))
                    .catch((err) => reject(err));
                })
                .catch((err) => reject(err));
            } else {
              wx.hideLoading();
              reject(new Error("下载图片失败"));
            }
          },
          fail: (err) => {
            wx.hideLoading();
            console.error("下载图片失败", err);
            reject(new Error("下载图片失败"));
          },
        });
      } else {
        // 直接检查本地图片大小并可能压缩
        this.checkAndCompressImage(imagePath)
          .then((compressedPath) => {
            // 上传压缩后的图片
            this.uploadLocalImage(compressedPath)
              .then((fileUrl) => resolve(fileUrl))
              .catch((err) => reject(err));
          })
          .catch((err) => reject(err));
      }
    });
  },

  // 检查图片大小并在需要时压缩
  checkAndCompressImage: function (imagePath) {
    return new Promise((resolve, reject) => {
      // 获取文件信息
      wx.getFileSystemManager().getFileInfo({
        filePath: imagePath,
        success: (res) => {
          const sizeInMB = res.size / (1024 * 1024);
          console.log("图片大小:", sizeInMB.toFixed(2) + "MB");

          // 如果图片大于5MB，进行压缩
          if (sizeInMB > 5) {
            wx.showLoading({
              title: "压缩图片中...",
            });

            // 使用微信小程序的压缩图片API
            wx.compressImage({
              src: imagePath,
              quality: 80, // 压缩质量，范围0-100
              success: (res) => {
                wx.hideLoading();
                console.log("图片已压缩:", res.tempFilePath);

                // 再次检查压缩后的大小
                wx.getFileSystemManager().getFileInfo({
                  filePath: res.tempFilePath,
                  success: (info) => {
                    const compressedSizeInMB = info.size / (1024 * 1024);
                    console.log("压缩后大小:", compressedSizeInMB.toFixed(2) + "MB");

                    // 如果压缩后仍然大于5MB，尝试更高压缩率
                    if (compressedSizeInMB > 5) {
                      wx.compressImage({
                        src: imagePath,
                        quality: 50, // 更高压缩率
                        success: (result) => {
                          resolve(result.tempFilePath);
                        },
                        fail: (err) => {
                          console.error("二次压缩失败", err);
                          // 即使二次压缩失败，仍然使用第一次压缩的结果
                          resolve(res.tempFilePath);
                        },
                      });
                    } else {
                      resolve(res.tempFilePath);
                    }
                  },
                  fail: (err) => {
                    console.error("获取压缩后图片信息失败", err);
                    // 即使获取信息失败，仍然使用压缩后的图片
                    resolve(res.tempFilePath);
                  },
                });
              },
              fail: (err) => {
                wx.hideLoading();
                console.error("压缩图片失败", err);
                // 如果压缩失败，仍然使用原图
                resolve(imagePath);
              },
            });
          } else {
            // 如果图片小于5MB，直接使用原图
            resolve(imagePath);
          }
        },
        fail: (err) => {
          console.error("获取图片信息失败", err);
          // 如果获取信息失败，仍然使用原图
          resolve(imagePath);
        },
      });
    });
  },

  // 上传本地图片到服务器
  uploadLocalImage: function (localPath) {
    return new Promise((resolve, reject) => {
      const serverUrl = wx.getStorageSync("serverUrl");
      const token = wx.getStorageSync("token");
      const { isEditing, dishId } = this.data;

      // 根据是否编辑模式选择不同的上传接口
      const uploadUrl = isEditing
        ? `${serverUrl}/api/dishes/${dishId}/upload-image`
        : `${serverUrl}/api/dishes/upload-image`;

      wx.uploadFile({
        url: uploadUrl,
        filePath: localPath,
        name: "image",
        header: {
          Authorization: `Bearer ${token}`,
        },
        success: function (res) {
          try {
            const data = JSON.parse(res.data);
            if (data.success) {
              console.log(data);
              resolve(data.data.image.url);
            } else {
              reject(new Error(data.error?.message || "上传失败"));
            }
          } catch (e) {
            console.log(e);
            reject(new Error("解析响应失败"));
          }
        },
        fail: function (err) {
          console.error("上传失败", err);
          reject(new Error("上传失败"));
        },
      });
    });
  },

  // 修改保存菜品方法
  saveDish: function () {
    const { dishForm, isEditing, dishId, isUploading } = this.data;

    // 表单验证
    if (!this.validateForm()) {
      return;
    }

    // 如果图片正在上传中，提示等待
    if (isUploading) {
      wx.showToast({
        title: "图片上传中，请稍候",
        icon: "none",
      });
      return;
    }

    // 显示加载提示
    wx.showLoading({
      title: isEditing ? "更新中..." : "创建中...",
    });

    // 准备提交的数据
    const dishData = {
      name: dishForm.name,
      difficulty: this.data.dishForm.difficulty,
      ingredients: this.data.dishForm.ingredients || [],
      category: dishForm.categoryId, // 使用 category 字段

      description: dishForm.description,
      image: {
        url: dishForm.image, // 已上传的图片URL
      },
    };

    // 根据是否编辑模式调用不同的API
    const savePromise = isEditing ? dishes.updateDish(dishId, dishData) : dishes.createDish(dishData);
    savePromise
      .then((res) => {
        if (res.success) {
          wx.hideLoading();

          wx.showToast({
            title: isEditing ? "菜品已更新" : "菜品已添加",
            icon: "success",
            success: () => {
              setTimeout(() => {
                // 如果是创建菜品，直接跳转到菜品管理页面
                if (!isEditing) {
                  wx.redirectTo({
                    url: "/pages/dishManage/dishManage?tab=dish",
                  });
                } else {
                  // 如果是编辑菜品，返回上一页
                  wx.navigateBack();
                }
              }, 1500);
            },
          });
        } else {
          throw new Error(res.error?.message || (isEditing ? "更新失败" : "创建失败"));
        }
      })
      .catch((err) => {
        wx.hideLoading();
        wx.showToast({
          title: err.message || (isEditing ? "更新失败" : "创建失败"),
          icon: "none",
        });
      });
  },

  // 表单验证
  validateForm: function () {
    const { dishForm, tempImagePath, isUploading } = this.data;

    if (isUploading) {
      wx.showToast({
        title: "图片上传中，请稍候",
        icon: "none",
      });
      return false;
    }

    if (!tempImagePath) {
      wx.showToast({
        title: "请上传菜品图片",
        icon: "none",
      });
      return false;
    }

    if (!dishForm.name.trim()) {
      wx.showToast({
        title: "请输入菜品名称",
        icon: "none",
      });
      return false;
    }

    return true;
  },

  // 取消
  cancel: function () {
    wx.navigateBack();
  },
});
