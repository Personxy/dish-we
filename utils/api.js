// 封装各种请求方法
// API 入口文件
const userApi = require("./api/user").default;
const dishApi = require("./api/dish").default;
const orderApi = require("./api/order").default;
const categories = require("./api/categories").default;
const dishes = require("./api/dishes").default;  // 添加新的菜品 API

// 合并所有 API
const api = {
  user: userApi,
  dish: dishApi,
  order: orderApi,
  categories: categories,
  dishes: dishes,  // 添加到 API 对象中
};

module.exports = api;
