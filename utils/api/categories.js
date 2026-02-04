import request from "../request";

// 分类相关 API
const categoryApi = {
  // 获取分类列表
  getCategories: (params = {}) => {
    const queryParams = [];
    if (params.withDishCount !== undefined) queryParams.push(`withDishCount=${params.withDishCount}`);
    const queryString = queryParams.length ? `?${queryParams.join("&")}` : "";
    return request(`/api/categories${queryString}`, "GET", {}, false).then((res) => {
      if (res?.success && Array.isArray(res.data)) {
        const data = res.data.map((category) => ({
          ...category,
          id: category?.id || category?._id,
          dishCount: category?.dishCount !== undefined ? Number(category.dishCount) : category?.dishCount,
        }));
        return { ...res, data };
      }
      return res;
    });
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
