import request from '../request';

// 分类相关 API
const categoryApi = {
  // 获取分类列表
  getCategories: () => {
    return request('/api/categories', 'GET', {});
  },
  
  // 创建分类
  createCategory: (categoryData) => {
    return request('/api/categories', 'POST', categoryData);
  },
  
  // 更新分类
  updateCategory: (id, categoryData) => {
    return request(`/api/categories/${id}`, 'PUT', categoryData);
  },
  
  // 删除分类
  deleteCategory: (id) => {
    return request(`/api/categories/${id}`, 'DELETE', {});
  }
};

export default categoryApi;