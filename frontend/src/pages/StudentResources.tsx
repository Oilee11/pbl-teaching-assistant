import React, { useState } from 'react';
import { Search, FileText, Download, Loader2 } from 'lucide-react';
import api from '../api';

/**
 * 学生资源检索页面
 * 
 * 功能：
 * 1. 提供搜索框，支持关键词和语义搜索
 * 2. 从后端检索知识库中相关的文档资源
 * 3. 展示检索结果，支持预览信息
 */
export default function StudentResources() {
  const [query, setQuery] = useState(''); // 搜索词
  const [results, setResults] = useState<any[]>([]); // 搜索结果
  const [searching, setSearching] = useState(false); // 搜索状态

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setSearching(true);
    try {
      const res = await api.get(`/student/resources?query=${encodeURIComponent(query)}`);  //  encodeURLComponent把字符串编码成URL安全格式
      setResults(res.data);
    } catch (err) {
      console.error('检索失败:', err);
      alert('检索失败，请重试');
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">资源中心</h2>
      
      {/* 搜索框 */}
      <form onSubmit={handleSearch} className="mb-10">
        <div className="relative">
          <input
            type="text"
            className="w-full p-4 pl-12 rounded-xl shadow-md border-none focus:ring-2 focus:ring-blue-500 text-lg"
            placeholder="输入关键词，搜索课程资料、案例等..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-6 h-6" />
          <button
            type="submit"
            disabled={searching}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition flex items-center"
          >
            {searching ? <Loader2 className="animate-spin w-5 h-5" /> : '搜索'}
          </button>
        </div>
      </form>

      {/* 结果展示 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {searching ? (
          <div className="col-span-2 text-center py-10 text-gray-500">正在为您检索最相关的资源...</div>
        ) : results.length === 0 ? (
          <div className="col-span-2 text-center py-10 text-gray-400 border-2 border-dashed rounded-xl">
            {query ? '未找到相关资源' : '在上方输入内容开始搜索'}
          </div>
        ) : (
          results.map((res) => (
            <div key={res.id} className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition group">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <FileText className="w-5 h-5 text-blue-500 mr-2" />
                    <span className="text-xs font-bold text-blue-500 uppercase">{res.file_type}</span>
                  </div>
                  <h3 className="font-bold text-gray-800 mb-2 group-hover:text-blue-600 transition">{res.filename}</h3>
                  <p className="text-xs text-gray-400">上传于: {new Date(res.created_at).toLocaleDateString()}</p>
                </div>
                <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">
                  <Download className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
