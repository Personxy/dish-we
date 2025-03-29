import request from '../request';

// 订单相关 API
const orderApi = {
  // 提交订单
  submitOrder: (orderData) => {
    return request('/api/orders', 'POST', orderData);
  },
  
  // 获取订单列表
  getOrders: (params) => {
    return request('/api/orders', 'GET', params);
  },
  
  // 获取订单详情
  getOrderDetail: (id) => {
    return request(`/api/orders/${id}`, 'GET', {});
  },
  
  // 取消订单
  cancelOrder: (id) => {
    return request(`/api/orders/${id}/cancel`, 'POST', {});
  },
  
  // 完成订单
  completeOrder: (id) => {
    return request(`/api/orders/${id}/complete`, 'POST', {});
  }
};

export default orderApi;