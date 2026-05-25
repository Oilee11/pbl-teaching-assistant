import React, { useState, useEffect } from 'react';
import { Upload, Trash2, FileText, Loader2 } from 'lucide-react';
import api from '../api';

export default function TeacherKB() {
  const [files, setFiles] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);  //  上传状态
  const [loading, setLoading] = useState(true);  //  加载状态

  const fetchFiles = async () => {
    try {
      const res = await api.get('/teacher/documents');
      setFiles(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {  //  useEffect只在挂载时执行一次，组件重新渲染无变化
    fetchFiles();
  }, []);  //  依赖数组

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {  //  HTMLInputElement文件选择器的变化事件类型。
    if (!e.target.files?.[0]) return;  //  没有选择文件
    setUploading(true);
    const formData = new FormData();   //  FormData 对象用于上传二进制文件。
    formData.append('file', e.target.files[0]);

    try {
      await api.post('/teacher/documents/upload', formData);
      fetchFiles();
    } catch (err) {
      alert('上传失败');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除该文档吗？')) return;
    try {
      await api.delete(`/teacher/documents/${id}`);
      fetchFiles();
    } catch (err) {
      alert('删除失败');
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold">知识库管理</h2>
        <label className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-blue-700 transition">
          <Upload className="w-5 h-5 mr-2" />
          {uploading ? '上传中...' : '上传文档'}
          
          <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} /> 
</label>
</div>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center"><Loader2 className="animate-spin inline-block mr-2" /> 加载中...</div>
        ) : files.length === 0 ? (
          <div className="p-8 text-center text-gray-500">暂无文档，请上传</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">文件名</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">类型</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">上传时间</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {files.map((file) => (
                <tr key={file.id}>
                  <td className="px-6 py-4 flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-gray-400" />
                    {file.filename}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{file.file_type}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{new Date(file.created_at).toLocaleString()}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleDelete(file.id)} className="text-red-600 hover:text-red-900">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
