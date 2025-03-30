import request from '../request';

// 菜品相关 API
const dishesApi = {
  // 获取菜品列表
  getDishes: () => {
    return request('/api/dishes', 'GET');
  },
  
  // 创建菜品
  createDish: (dishData) => {
    return request('/api/dishes', 'POST', dishData);
  },
  
  // 更新菜品
  updateDish: (id, dishData) => {
    return request(`/api/dishes/${id}`, 'PUT', dishData);
  },
  
  // 删除菜品
  deleteDish: (id) => {
    return request(`/api/dishes/${id}`, 'DELETE');
  }
};

export default dishesApi;