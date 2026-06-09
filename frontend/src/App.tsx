import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import TeacherKB from './pages/TeacherKB';
import TeacherPBL from './pages/TeacherPBL';
import TeacherFeedback from './pages/TeacherFeedback';
import TeacherCodeAnalysis from './pages/TeacherCodeAnalysis';
import StudentQA from './pages/StudentQA';
import StudentResources from './pages/StudentResources';
import StudentNotes from './pages/StudentNotes';
import StudentCodeUpload from './pages/StudentCodeUpload';
import WebSearch from './pages/WebSearch';
// 根据角色自动重定向首页的组件
const HomeRedirect = () => {
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  
  if (user?.role === 'teacher') {
    return <Navigate to="/dashboard/kb" replace />;
  }
  return <Navigate to="/dashboard/qa" replace />;
};

/**
 * 应用主路由配置
 * 
 * 功能：
 * 1. 定义页面的访问路径
 * 2. 处理角色权限隔离（通过 Dashboard 内部逻辑和嵌套路由）
 * 3. 设置默认重定向
 */
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 登录与注册页面 */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* 仪表盘主界面，采用嵌套路由 */}
        <Route path="/dashboard" element={<Dashboard />}>
          {/* 根据角色自动重定向 */}
          <Route index element={<HomeRedirect />} />
          
          {/* 教师专属页面 */}
          <Route path="kb" element={<TeacherKB />} />
          <Route path="pbl" element={<TeacherPBL />} />
          <Route path="code-analysis" element={<TeacherCodeAnalysis />} />
          <Route path="feedback" element={<TeacherFeedback />} />
          <Route path="web-search" element={<WebSearch />} />
      
          
          {/* 学生专属页面 */}
          <Route path="qa" element={<StudentQA />} />
          <Route path="code-upload" element={<StudentCodeUpload />} />
          <Route path="resources" element={<StudentResources />} />
          <Route path="notes" element={<StudentNotes />} />
            </Route>        
        {/* 根路径重定向到登录页 */}
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
