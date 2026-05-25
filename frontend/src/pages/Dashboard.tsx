import React from 'react';
import { useNavigate, Outlet, Link, useLocation } from 'react-router-dom';
import { 
  BookOpen, 
  FileText, 
  MessageSquare, 
  StickyNote, 
  LogOut, 
  LayoutDashboard,
  MessageCircle
} from 'lucide-react';//图标库

export default function Dashboard() {//export对应import，以便其他组件可以使用
  const navigate = useNavigate();//代码控制实现页面跳转
  const location = useLocation();//判断当前页面路径，组件变化，重新执行函数、渲染
  const userStr = localStorage.getItem('user');//获取当前登录用户的信息，用户退出后清空。只会记录每次登录的用户信息
  const user = userStr ? JSON.parse(userStr) : null;//localstorage只能存储字符串

  //防止跳过用户登录，通过输入网址直接进入界面
  if (!user) {
    navigate('/login');
    return null;//停止渲染该组件
  }

  //退出，同事触发同步执行
  const handleLogout = () => {
    localStorage.removeItem('token');//删除请求头的token，
    localStorage.removeItem('user');//删除localstorage保存的用户信息
    navigate('/login');
  };

  const teacherMenus = [
    { name: '知识库管理', path: '/dashboard/kb', icon: BookOpen },
    { name: 'PBL教案生成', path: '/dashboard/pbl', icon: FileText },
    { name: '学生代码分析', path: '/dashboard/code-analysis', icon: FileText },
    { name: '学生反馈', path: '/dashboard/feedback', icon: MessageCircle },
    { name: '全网资源搜索', path: '/dashboard/web-search', icon: BookOpen },
  ];

  const studentMenus = [
    { name: '知识问答', path: '/dashboard/qa', icon: MessageSquare },
    { name: '代码学情分析', path: '/dashboard/code-upload', icon: FileText },
    { name: '资源检索', path: '/dashboard/resources', icon: BookOpen },
    { name: '学习笔记', path: '/dashboard/notes', icon: StickyNote },
  ];

  const menus = user.role === 'teacher' ? teacherMenus : studentMenus;

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        <div className="p-6">
          <h1 className="text-xl font-bold text-blue-600">PBL 教学系统</h1>
          <p className="text-xs text-gray-500 mt-1">欢迎, {user.username} ({user.role === 'teacher' ? '教师' : '学生'})</p>
        </div>
        <nav className="mt-6">
          {menus.map((menu) => (  //map数组方法，对每一项执行下列函数。menu自定义参数，代表数组的每一项
            <Link  
            //点击时不刷新界面，自动实现路由转换
            //React里的函数组件,本质上还是渲染<a>标签，多增加了功能
            // =function Link（props）  props是对象，属性集合
            // {return <a href={props.to} classname={props.classname}> {props.children} </a>}
              key={menu.path}
              to={menu.path}
              className={`flex items-center px-6 py-3 text-sm transition-colors ${
                location.pathname === menu.path
                  ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <menu.icon className="w-5 h-5 mr-3" />
              {menu.name}
            </Link>
          ))}
          <button  //所有传给组件的数据都要存到开始标签里
            onClick={handleLogout}  //不添加括号，把函数传给React，点击时自动调用
            className="flex items-center w-full px-6 py-3 mt-10 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3" />   
            退出登录
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-8">
        <Outlet />
      </div>
    </div>
  );
}
