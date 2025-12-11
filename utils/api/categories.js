import request from "../request";

// 分类相关 API
const categoryApi = {
  // 获取分类列表
  getCategories: () => {
    return request("/api/categories", "GET", {}, false);
  },

  // 创建分类
  createCategory: (categoryData) => {
    return request("/api/categories", "POST", categoryData);
  },

  // 更新分类
  updateCategory: (id, categoryData) => {
    return request(`/api/categories/${id}`, "PUT", categoryData);
  },

  // 删除分类
  deleteCategory: (id) => {
    return request(`/api/categories/${id}`, "DELETE", {});
  },
  //分类排序
  updateCategoryOrder: function (orders) {
    return request("/api/categories/order", "POST", {
      orders: orders,
    });
  },
};

export default categoryApi;
