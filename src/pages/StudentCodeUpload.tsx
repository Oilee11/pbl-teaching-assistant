import React, { useState } from 'react';
import { Upload, FileCode, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown'; // 导入 ReactMarkdown 组件，用于渲染 Markdown 格式的内容
import remarkGfm from 'remark-gfm'; // 导入 remark-gfm 插件，用于解析 GitHub Flavored Markdown 格式
import api from '../api';

/**
 * 学生代码上传与分析页面
 */
export default function StudentCodeUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setAnalysis(null);

    const formData = new FormData();  // 创建 FormData FormData 对象，用于文件上传
    formData.append('file', file);

    try {
      const res = await api.post('/student/code/upload', formData);
      setAnalysis(res.data.analysis); // 存储AI返回的分析结果
    } catch (err) {
      alert('上传分析失败，请确保文件是文本格式（如 .py, .js）');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold flex items-center mb-2">
          <FileCode className="mr-2 text-blue-600" /> 代码学情分析
        </h2>
        <p className="text-gray-500 text-sm">上传您的项目代码，AI 将为您提供专业的知识点掌握情况分析与建议</p>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border-2 border-dashed border-gray-200 mb-10 text-center">
        <Upload className="w-12 h-12 mx-auto text-gray-300 mb-4" />
        <input 
          type="file" 
          id="code-upload" 
          className="hidden" 
          onChange={handleFileChange}
          accept=".py,.js,.java,.cpp,.c,.ts,.html,.css"
        />
        <label 
          htmlFor="code-upload"
          className="cursor-pointer text-blue-600 hover:underline font-medium"
        >
          {file ? file.name : '选择代码文件'}
        </label>
        <p className="text-xs text-gray-400 mt-2">支持 .py, .js, .java 等常见编程语言</p>
        
        {file && (
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="mt-6 bg-blue-600 text-white px-8 py-2 rounded-lg hover:bg-blue-700 transition flex items-center mx-auto"
          >
            {uploading ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle2 className="mr-2" />}
            开始 AI 分析
          </button>
        )}
      </div>

      {analysis && (
        <div className="bg-white p-8 rounded-2xl shadow-md border border-blue-100">
          <h3 className="text-xl font-bold mb-6 text-blue-600 border-b pb-4 flex items-center">
            <AlertCircle className="mr-2 w-5 h-5" /> 学情分析报告
          </h3>
          <div className="prose prose-blue max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {analysis}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}
