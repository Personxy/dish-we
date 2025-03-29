// 封装各种请求方法
// API 入口文件
const userApi = require("./api/user").default;
const dishApi = require("./api/dish").default;
const orderApi = require("./api/order").default;

// 合并所有 API
const api = {
  user: userApi,
  dish: dishApi,
  order: orderApi,
};

module.exports = api;
