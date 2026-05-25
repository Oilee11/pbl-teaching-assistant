import React, { useState } from 'react';  //usestate：react的记忆功能，变化重新渲染界面
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';

export default function Login() {
  const [username, setUsername] = useState('');  //useState记住username的值为‘ ’，setUsername为修改username值的函数
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {  //表单提交事件
    e.preventDefault();  //阻止默认行为，阻止默认提交表单后刷新界面
    setError(null);
    try {
      const formData = new FormData();  //FormData：浏览器内置的表单数据打包器
      formData.append('username', username);
      formData.append('password', password);
      
      const res = await api.post('/auth/login', formData);  //经过拦截器发送请求获得token
      localStorage.setItem('token', res.data.access_token);
      
      // Get user info to check role
      const userRes = await api.get('/auth/me');
      localStorage.setItem('user', JSON.stringify(userRes.data));
      
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || '登录失败');  //?.：可选链，如果 response 不存在，不报错，返回 undefined；data：错误体；detail：具体错误信息
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-bold mb-6 text-center text-blue-600">PBL 备课智能体登录</h2>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">用户名</label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={username}  //受控组件，由React控制状态
              onChange={(e) => setUsername(e.target.value)}  //浏览器输入框输入新值-创建事件-传给onChange回调函数执行-重置-React重新渲染整个Login组件-比对新旧-只更新改动的地方的真实DOM
              required  //HTML5 校验，空的时候不让提交
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">密码</label>
            <input
              type="password"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"  //HTML默认机制，点击提交
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700 transition"
          >
            登录
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
          还没有账号？ <Link to="/register" className="text-blue-600 hover:underline">去注册</Link>
        </p>
      </div>
    </div>
  );
}
