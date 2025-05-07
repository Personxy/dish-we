import request from '../request';

// 菜品相关 API
const dishesApi = {
  // 获取菜品列表
  getDishes: (params = {}) => {
    // 手动构建查询字符串
    let queryString = '';
    const queryParams = [];
    
    // 添加分页参数
    if (params.page) queryParams.push(`page=${params.page}`);
    if (params.limit) queryParams.push(`limit=${params.limit}`);
    
    // 添加筛选参数
    if (params.category) queryParams.push(`category=${params.category}`);
    if (params.isAvailable !== undefined) queryParams.push(`isAvailable=${params.isAvailable}`);
    if (params.search) queryParams.push(`search=${encodeURIComponent(params.search)}`);
    
    // 添加排序参数
    if (params.sort) queryParams.push(`sort=${encodeURIComponent(params.sort)}`);
    
    // 拼接查询字符串
    if (queryParams.length > 0) {
      queryString = '?' + queryParams.join('&');
    }
    
    // 构建完整URL
    const url = `/api/dishes${queryString}`;
    
    return request(url, 'GET');
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