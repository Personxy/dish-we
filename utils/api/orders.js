import request from '../request';

// 订单相关 API
const ordersApi = {
  // 获取订单列表
  getOrders: (params = {}) => {
    // 手动构建查询字符串
    let queryString = '';
    const queryParams = [];
    
    // 添加分页参数
    if (params.page) queryParams.push(`page=${params.page}`);
    if (params.limit) queryParams.push(`limit=${params.limit}`);
    
    // 添加筛选参数
    if (params.status) queryParams.push(`status=${params.status}`);
    if (params.startDate) queryParams.push(`startDate=${encodeURIComponent(params.startDate)}`);
    if (params.endDate) queryParams.push(`endDate=${encodeURIComponent(params.endDate)}`);
    
    // 添加排序参数
    if (params.sort) queryParams.push(`sort=${encodeURIComponent(params.sort)}`);
    
    // 拼接查询字符串
    if (queryParams.length > 0) {
      queryString = '?' + queryParams.join('&');
    }
    
    // 构建完整URL
    const url = `/api/orders${queryString}`;
    
    return request(url, 'GET');
  },
  
  // 创建订单
  createOrder: (orderData) => {
    return request('/api/orders', 'POST', orderData);
  },
  
  // 取消订单
  cancelOrder: (id) => {
    return request(`/api/orders/${id}`, 'DELETE');
  }
};

export default ordersApi;