import React, { useState } from 'react';
import { Search, Globe, Loader2, ExternalLink, Download, AlertCircle } from 'lucide-react';
import api from '../api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function WebSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const isTeacher = user?.role === 'teacher';

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setResults([]);

    try {
      // api 请求拦截器已自动从 localStorage 读取 token 并注入请求头
      const res = await api.get(`/teacher/web-search?query=${encodeURIComponent(query)}`);

      const resultsStr: string = res.data.results;

      // 情况 A：智谱 AI 联网搜索成功返回
      if (resultsStr.includes("【AI 联网搜索总结】")) {
        const cleanContent = resultsStr
          .replace("【AI 联网搜索总结】\n\n", "")
          .replace(/\n\n---\n\n提示：.*/, "");

        setResults([{
          id: 0,
          url: '',
          title: `AI 联网搜索：${query}`,
          content: cleanContent.trim(),
          isAIResult: true
        }]);
        return;
      }

      // 情况 B：搜索失败降级提示
      if (resultsStr.includes("联网搜索暂时不可用") || resultsStr.includes("联网检索未返回有效结果")) {
        setError(resultsStr);
        setResults([]);
        return;
      }

      // 情况 C：兼容旧格式（如果后端返回了其他格式）
      const items = resultsStr.split('---').map((item: string, index: number) => {
        const lines = item.trim().split('\n');
        const urlLine = lines.find((l: string) => l.startsWith('来源: '));
        const titleLine = lines.find((l: string) => l.startsWith('标题: '));
        const contentLines = lines.filter((l: string) => l.startsWith('内容: ') || l.startsWith('摘要: '));

        return {
          id: index,
          url: urlLine ? urlLine.replace('来源: ', '').trim() : '',
          title: titleLine ? titleLine.replace('标题: ', '').trim() : `${query} 相关资源 ${index + 1}`,
          content: contentLines.map((l: string) => l.replace('内容: ', '').replace('摘要: ', '')).join('\n').trim(),
          isAIResult: false
        };
      }).filter((i: any) => i.url || i.content);

      setResults(items);
    } catch (err: any) {
      console.error('搜索请求失败:', err);
      setError(err.response?.data?.detail || '搜索请求失败，请检查后端服务是否正常运行。');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 下载搜索结果为文本文件
   */
  const handleDownload = (result: any) => {
    const blob = new Blob(
      [`标题: ${result.title}\n来源: ${result.url || 'AI 联网搜索'}\n\n${result.content}`], 
      { type: 'text/plain;charset=utf-8' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${result.title.replace(/[^\w\u4e00-\u9fa5]/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // const handleAddToKB = async (result: any, index: number) => {
  //   setSaving(index);
  //   try {
  //     await api.post('/teacher/web-search/save', {
  //       url: result.url || 'AI 搜索生成',
  //       title: result.title,
  //       content: result.content
  //     });
  //     // 友好的非阻塞提示
  //     const msg = document.createElement('div');
  //     msg.className = 'fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50';
  //     msg.textContent = '已成功加入知识库！';
  //     document.body.appendChild(msg);
  //     setTimeout(() => document.body.removeChild(msg), 2000);
  //   } catch (err) {
  //     setError('加入知识库失败，请检查权限或网络连接。');
  //   } finally {
  //     setSaving(null);
  //   }
  // };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold flex items-center mb-2">
          <Globe className="mr-2 text-blue-600" /> 全网资源搜索
        </h2>
        <p className="text-gray-500 text-sm">通过 AI 联网搜索获取最新的教学案例、学术论文和行业动态</p>
      </div>

      {/* 搜索框 */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="relative">
          <input
            type="text"
            className="w-full p-4 pl-12 rounded-xl shadow-md border-none focus:ring-2 focus:ring-blue-500 text-lg"
            placeholder="输入想要搜索的教学资源关键词..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-6 h-6" />
          <button
            type="submit"
            disabled={loading}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : '联网搜索'}
          </button>
        </div>
      </form>

      {/* 错误提示 */}
      {error && (
        <div className="mb-6 bg-orange-50 border border-orange-200 text-orange-700 px-4 py-3 rounded-lg flex items-start">
          <AlertCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
          <div className="text-sm whitespace-pre-wrap">{error}</div>
        </div>
      )}

      {/* 搜索结果列表 */}
      <div className="space-y-6">
        {results.map((res, index) => (
          <div key={index} className="bg-white p-6 rounded-xl shadow-sm border hover:border-blue-200 transition">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold text-lg text-blue-600 flex items-center">
                {res.title}
                {res.url && (
                  <a href={res.url} target="_blank" rel="noreferrer" className="ml-2 text-gray-400 hover:text-blue-500">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
                {res.isAIResult && (
                  <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">AI 联网</span>
                )}
              </h3>
              <div className="flex space-x-2">
                <button 
                  onClick={() => handleDownload(res)}
                  className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition"
                  title="下载到本地"
                >
                  <Download className="w-5 h-5" />
                </button>
                {/* {isTeacher && (
                  // <button
                  //   onClick={() => handleAddToKB(res, index)}
                  //   disabled={saving === index}
                  //   className="flex items-center bg-green-50 text-green-600 px-3 py-1 rounded-lg hover:bg-green-100 transition text-sm font-medium disabled:opacity-50"
                  // >
                  //   {saving === index ? <Loader2 className="animate-spin w-4 h-4 mr-1" /> : <Plus className="w-4 h-4 mr-1" />}
                  //   加入知识库
                  // </button>
                )} */}
              </div>
            </div>
            <div className="prose prose-blue max-w-none prose-headings:mt-4 prose-headings:mb-2 prose-p:my-2 prose-ul:my-2 prose-li:my-0">
  <ReactMarkdown remarkPlugins={[remarkGfm]}>
    {res.content}
  </ReactMarkdown>
</div>
            {res.url && (
              <div className="text-xs text-gray-400 truncate">
                来源: {res.url}
              </div>
            )}
          </div>
        ))}

        {/* 空状态 */}
        {!loading && results.length === 0 && !error && query && (
          <div className="text-center py-20 text-gray-400 bg-white rounded-xl border border-dashed">
            <Globe className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>未找到相关资源，请换个关键词试试</p>
          </div>
        )}

        {!loading && results.length === 0 && !error && !query && (
          <div className="text-center py-20 text-gray-400 bg-white rounded-xl border border-dashed">
            <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>在上方输入关键词开始搜索</p>
          </div>
        )}
      </div>
    </div>
  );
}