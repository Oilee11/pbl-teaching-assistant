import axios from 'axios';  //axios帮助发起http请求

const api = axios.create({
  baseURL: 'http://localhost:8000',  //给每个请求添加基础地址
});

//请求拦截器
api.interceptors.request.use((config) => {  //config请求配置对象，包含URL，请求头，参数等
  const token = localStorage.getItem('token');  //取出登录成功之后存储的token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;  //添加token至请求头中
  }
  return config;
});

export default api;
