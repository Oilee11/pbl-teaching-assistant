import React, { useState, useEffect } from 'react';
import { MessageCircle, Star, Calendar, User, ChevronDown, ChevronUp } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import api from '../api';

/**
 * 反馈卡片组件，支持展开收起
 */
function FeedbackCard({ fb }: { fb: any }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center text-sm text-gray-500">
          <User className="w-4 h-4 mr-1" /> 学生: {fb.student_name} (ID: {fb.student_id})
          <span className="mx-2">|</span>
          <Calendar className="w-4 h-4 mr-1" /> {new Date(fb.created_at).toLocaleString()}
        </div>
        <div className="flex">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`w-4 h-4 ${star <= fb.rating ? 'text-yellow-400 fill-current' : 'text-gray-200'}`}
            />
          ))}
        </div>
      </div>
      
      <div className="mb-3">
        <p className="text-xs font-bold text-gray-400 uppercase mb-1">提问内容:</p>
        <p className="text-gray-800 bg-gray-50 p-3 rounded">{fb.question}</p>
      </div>
      
      <div className="mb-3">
        <div className="flex justify-between items-center mb-1">
          <p className="text-xs font-bold text-gray-400 uppercase">AI 回答:</p>
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-blue-600 text-xs flex items-center hover:underline bg-white px-2 py-1 rounded shadow-sm border border-blue-100"
          >
            {isExpanded ? <><ChevronUp className="w-3 h-3 mr-1" /> 收起</> : <><ChevronDown className="w-3 h-3 mr-1" /> 展开详情</>}
          </button>
        </div>
        <div className={`text-gray-600 text-sm transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-24 opacity-80 overflow-hidden'}`}>
          <div className="bg-blue-50/30 p-4 rounded-lg border border-blue-100/50 prose prose-blue prose-sm max-h-[500px] overflow-y-auto">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {fb.answer}
            </ReactMarkdown>
          </div>
        </div>
      </div>

      {fb.comment && (
        <div className="mt-4 pt-4 border-t border-dashed">
          <p className="text-xs font-bold text-blue-400 uppercase mb-1">学生评价:</p>
          <p className="text-blue-600 italic">"{fb.comment}"</p>
        </div>
      )}
    </div>
  );
}

/**
 * 教师反馈页面组件
 * 
 * 功能：
 * 1. 从后端获取所有学生的评价反馈
 * 2. 以卡片形式展示问题、回答、评分和评论
 * 3. 方便教师了解 AI 助手的表现和学生的学习痛点
 */
export default function TeacherFeedback() {
  const [feedbacks, setFeedbacks] = useState<any[]>([]); // 存储反馈列表的状态
  const [loading, setLoading] = useState(true); // 加载状态

  // 组件加载时执行，获取反馈数据
  useEffect(() => {

  //  fetchFeedbacks函数写在useEffect里面，只在组件挂载时执行一次，状态变化页面重新渲染时不重新执行
  //  组件挂载：创建实例执行整个函数体，生产真实DOM节点，插入页面
  //  重新渲染：页面状态变化，执行除useEffect（useEffect依赖数组变化除外）以外的所有函数体，生成虚拟DOM节点，对比真实DOM，插入更新节点
    const fetchFeedbacks = async () => {
      try {
        const res = await api.get('/teacher/feedbacks');
        setFeedbacks(res.data);
      } catch (err) {
        console.error('获取反馈失败:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFeedbacks();
  }, []);

  return (
    <div className="max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 flex items-center">
        <MessageCircle className="mr-2 text-blue-600" /> 学生反馈查看
      </h2>

      {loading ? (
        <div className="text-center p-10">加载反馈中...</div>
      ) : feedbacks.length === 0 ? (
        <div className="bg-white p-10 rounded-lg shadow text-center text-gray-500">
          目前还没有学生提交反馈。
        </div>
      ) : (
        <div className="grid gap-6">
          {feedbacks.map((fb) => (
            <FeedbackCard key={fb.id} fb={fb} />
          ))}
        </div>
      )}
    </div>
  );
}
