const app = getApp();
import { dishes, categories } from "../../utils/api";

Page({
  data: {
    isEditing: false, // 是否是编辑模式
    dishId: "", // 菜品ID
    categoryIndex: 0, // 分类选择器的索引
    categoryNames: [], // 分类名称列表
    tempImagePath: "", // 临时图片路径
    descriptionLength: 0, // 描述文字长度
    isUploading: false, // 图片上传状态
    dishForm: {
      // 菜品表单数据
      name: "",
      categoryId: "",
      price: "",
      image: "",
      description: "",
    },
  },

  onLoad: function (options) {
    // 加载分类数据
    this.loadCategories();

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

      // 加载菜品数据
      // this.loadDishData(options.id)
    } else {
      // 设置页面标题为"添加菜品"
      wx.setNavigationBarTitle({
        title: "添加菜品",
      });
    }
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

          this.setData({
            categories: categories,
            categoryNames: categoryNames,
            "dishForm.categoryId": categories[0]._id, // 使用 _id 字段
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

  // 加载菜品数据
  loadDishData: function (dishId) {
    // 显示加载提示
    wx.showLoading({
      title: "加载中...",
    });

    // 使用API获取菜品详情
    dishes
      .getDishDetail(dishId)
      .then((res) => {
        wx.hideLoading();

        if (res.success) {
          const dish = res.data;

          if (!dish) {
            wx.showToast({
              title: "菜品不存在",
              icon: "none",
              success: () => {
                setTimeout(() => {
                  wx.navigateBack();
                }, 1500);
              },
            });
            return;
          }

          // 获取分类索引
          const categories = this.data.categoryNames || [];
          const category = this.data.categories.find((c) => c._id === dish.category);
          const categoryIndex = category ? this.data.categoryNames.indexOf(category.name) : 0;

          this.setData({
            tempImagePath: dish.image,
            categoryIndex: categoryIndex > -1 ? categoryIndex : 0,
            descriptionLength: dish.description ? dish.description.length : 0,
            dishForm: {
              name: dish.name,
              categoryId: dish.category, // 使用 category 字段
              price: dish.price,
              image: dish.image,
              description: dish.description,
            },
          });
        } else {
          wx.showToast({
            title: "获取菜品失败",
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
          title: "获取菜品失败",
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
        console.log(res)
        const tempFilePath = res.tempFiles[0].tempFilePath;

        this.setData({
          tempImagePath: tempFilePath,
          "dishForm.image": tempFilePath,
          isUploading: true, // 标记正在上传图片
        });

        // 选择图片后立即上传
        this.uploadDishImage(tempFilePath)
          .then((fileUrl) => {
            console.log(fileUrl,"url")
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

  // 分类选择变化
  onCategoryChange: function (e) {
    const index = e.detail.value;
    const categories = this.data.categories || [];

    this.setData({
      categoryIndex: index,
      "dishForm.categoryId": categories[index]._id, // 使用 _id 字段
    });
  },

  // 名称输入
  onNameInput: function (e) {
    this.setData({
      "dishForm.name": e.detail.value,
    });
  },

  // 价格输入
  // onPriceInput: function (e) {
  //   let price = e.detail.value;

  //   // 限制只能输入数字和小数点
  //   price = price.replace(/[^\d.]/g, "");

  //   // 限制只能有一个小数点
  //   if (price.split(".").length > 2) {
  //     price = price.split(".")[0] + "." + price.split(".").slice(1).join("");
  //   }

  //   // 限制小数点后最多两位
  //   if (price.indexOf(".") > -1) {
  //     const integer = price.split(".")[0];
  //     let decimal = price.split(".")[1];

  //     if (decimal.length > 2) {
  //       decimal = decimal.substring(0, 2);
  //     }

  //     price = integer + "." + decimal;
  //   }

  //   this.setData({
  //     "dishForm.price": price,
  //   });
  // },

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
              // 下载成功后，上传本地临时文件
              this.uploadLocalImage(res.tempFilePath)
                .then((fileUrl) => resolve(fileUrl))
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
        // 直接上传本地图片
        this.uploadLocalImage(imagePath)
          .then((fileUrl) => resolve(fileUrl))
          .catch((err) => reject(err));
      }
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
              console.log(data)
              resolve(data.data.image.url);
            } else {
              reject(new Error(data.error?.message || "上传失败"));
            }
          } catch (e) {
            console.log(e)
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

  // 保存菜品
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
      category: dishForm.categoryId, // 注意：后端使用 category 字段
      price: parseFloat(dishForm.price),
      description: dishForm.description,
      image:{
        url:dishForm.image,
        filename:dishForm.image
      } , // 已上传的图片URL
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
                wx.navigateBack();
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

    // if (!dishForm.price) {
    //   wx.showToast({
    //     title: "请输入菜品价格",
    //     icon: "none",
    //   });
    //   return false;
    // }

    // 价格必须大于0
    // if (parseFloat(dishForm.price) <= 0) {
    //   wx.showToast({
    //     title: "价格必须大于0",
    //     icon: "none",
    //   });
    //   return false;
    // }

    return true;
  },

  // 取消
  cancel: function () {
    wx.navigateBack();
  },
});
