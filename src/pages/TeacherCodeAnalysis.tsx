import React, { useState, useEffect } from 'react';
import { FileCode, User, Calendar, Search, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import api from '../api';

/**
 * 教师查看学生代码分析汇总页面
 */
export default function TeacherCodeAnalysis() {
  const [codes, setCodes] = useState<any[]>([]);  //学生代码列表
  const [loading, setLoading] = useState(true);  //加载状态
  const [expandedId, setExpandedId] = useState<number | null>(null);  //当前展开的项的ID

  useEffect(() => {
    const fetchCodes = async () => {
      try {
        const res = await api.get('/teacher/student-codes');
        setCodes(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCodes();
  }, []);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold flex items-center mb-2">
          <FileCode className="mr-2 text-blue-600" /> 学生代码学情分析
        </h2>
        <p className="text-gray-500 text-sm">查看学生提交的代码项目及 AI 自动生成的学情评估报告</p>
      </div>

      {loading ? (
        <div className="text-center py-20"><Loader2 className="animate-spin inline-block mr-2" /> 正在加载学情数据...</div>
      ) : codes.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border-2 border-dashed text-gray-400">
          暂无学生提交代码数据
        </div>
      ) : (
        <div className="space-y-6">
          {codes.map((item) => (
            <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="bg-blue-50 p-3 rounded-lg text-blue-600">
                      <User className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-800">学生: {item.student_name}</h3>
                      <div className="flex items-center text-xs text-gray-400 mt-1">
                        <span className="mr-2">ID: {item.student_id}</span>
                        <span className="mx-2">|</span>
                        <FileCode className="w-3 h-3 mr-1" /> {item.filename}
                        <span className="mx-2">|</span>
                        <Calendar className="w-3 h-3 mr-1" /> {new Date(item.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                    className="flex items-center text-blue-600 text-sm font-medium hover:underline"
                  >
                    {expandedId === item.id ? <><ChevronUp className="w-4 h-4 mr-1" /> 收起分析</> : <><ChevronDown className="w-4 h-4 mr-1" /> 查看详细报告</>}
                  </button>
                </div>
                
              {/*短路求值：条件&&表达式：当条件为true时，返回表达式*/}
                {expandedId === item.id && (
                  <div className="mt-6 pt-6 border-t border-dashed">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* 代码预览 */}
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase mb-3">源代码预览:</p>
                        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-auto max-h-[400px] font-mono text-sm">
                          <pre>{item.content}</pre>
                        </div>
                      </div>
                      
                      {/* AI 分析 */}
                      <div>
                        <p className="text-xs font-bold text-blue-400 uppercase mb-3 text-right">AI 学情报告:</p>
                        <div className="prose prose-blue prose-sm max-w-none bg-blue-50/30 p-4 rounded-lg border border-blue-100 h-[400px] overflow-auto">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {item.analysis}
                          </ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
