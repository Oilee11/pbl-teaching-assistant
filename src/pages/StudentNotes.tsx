import React, { useState, useEffect } from 'react';
import { StickyNote, Plus, Trash2, Save, X } from 'lucide-react';
import api from '../api';

/**
 * 学生学习笔记页面
 * 
 * 功能：
 * 1. 查看、创建和删除个人学习笔记
 * 2. 实时保存笔记内容
 */
export default function StudentNotes() {
  const [notes, setNotes] = useState<any[]>([]); // 笔记列表
  const [loading, setLoading] = useState(true); // 加载状态，获取笔记列表
  const [isAdding, setIsAdding] = useState(false); // 是否正在添加新笔记
  const [newTitle, setNewTitle] = useState(''); // 新笔记标题
  const [newContent, setNewContent] = useState(''); // 新笔记内容
  const [selectedNote, setSelectedNote] = useState<any>(null); // 当前选中的笔记详情

  //  获取笔记
  const fetchNotes = async () => {  
    try {
      const res = await api.get('/student/notes');
      setNotes(res.data);
    } catch (err) {
      console.error('获取笔记失败:', err);
    } finally {
      setLoading(false);  //  防止卡死在加载页面
    }
  };
  //  useEffect组件在特定时机执行副作用操作
  useEffect(() => {
    fetchNotes();
  }, []);  //  依赖数组，空数组表示"只在组件第一次挂载时执行"。重新渲染，再重新执行一次

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;  //  trim（）去掉字符串首尾空格，防止空格提交

    try {
      await api.post('/student/notes', { title: newTitle, content: newContent });  //  带请求体发送请求，后端对应函数要求
      setNewTitle('');
      setNewContent('');
      setIsAdding(false);
      fetchNotes();
    } catch (err) {
      alert('保存失败');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除此笔记吗？')) return;  //  取消时，return返回，不执行删除操作
    try {
      await api.delete(`/student/notes/${id}`);  //  对应下方id
      fetchNotes();
    } catch (err) {
      alert('删除失败');
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold flex items-center">
          <StickyNote className="mr-2 text-blue-600" /> 我的学习笔记
        </h2>
        <button
          onClick={() => setIsAdding(true)}  
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700 transition"
        >
          <Plus className="w-5 h-5 mr-1" /> 新建笔记
        </button>
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-xl shadow-md border-2 border-blue-500 mb-8">
          <div className="flex justify-between mb-4">
            <h3 className="font-bold">新建笔记</h3>
            <button onClick={() => setIsAdding(false)}><X className="text-gray-400" /></button>
          </div>
          <form onSubmit={handleCreate}>
            <input
              type="text"
              className="w-full p-2 border rounded mb-4 focus:ring-1 focus:ring-blue-500 outline-none"
              placeholder="笔记标题"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              required
            />
            <textarea
              className="w-full p-2 border rounded h-32 mb-4 focus:ring-1 focus:ring-blue-500 outline-none"
              placeholder="写下您的学习心得..."
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              required
            ></textarea>
            <div className="flex justify-end">
              <button
                type="submit"
                className="bg-green-600 text-white px-6 py-2 rounded-lg flex items-center hover:bg-green-700 transition"
              >
                <Save className="w-4 h-4 mr-2" /> 保存笔记
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-10">加载中...</div>
      ) : notes.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border-2 border-dashed text-gray-400">
          还没有笔记，点击右上角开始记录吧！
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 左侧列表 */}
          <div className="md:col-span-1 space-y-4 max-h-[600px] overflow-y-auto pr-2">
            {notes.map((note) => (
              <div 
                key={note.id} 
                onClick={() => setSelectedNote(note)}
                className={`bg-white p-4 rounded-xl shadow-sm border cursor-pointer transition-all ${selectedNote?.id === note.id ? 'border-blue-500 ring-2 ring-blue-50' : 'hover:border-blue-200'}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-gray-800 truncate pr-2">{note.title}</h3>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(note.id);
                    }}
                    className="text-gray-300 hover:text-red-500 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-gray-500 text-xs line-clamp-2 mb-2">{note.content}</p>
                <div className="text-[10px] text-gray-400">
                  {new Date(note.updated_at || note.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>

          {/* 右侧详情 */}
          <div className="md:col-span-2">
            {selectedNote ? (
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-blue-100 h-full min-h-[400px]">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 border-b pb-4">{selectedNote.title}</h3>
                <div className="prose prose-blue max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {selectedNote.content}
                  </p>
                </div>
                <div className="mt-10 pt-6 border-t border-gray-50 text-xs text-gray-400 flex justify-between">
                  <span>创建时间: {new Date(selectedNote.created_at).toLocaleString()}</span>
                  <span>最后更新: {new Date(selectedNote.updated_at || selectedNote.created_at).toLocaleString()}</span>
                </div>
              </div>
            ) : (
              <div className="bg-white/50 border-2 border-dashed border-gray-200 rounded-2xl h-full min-h-[400px] flex items-center justify-center text-gray-400">
                请在左侧选择一篇笔记查看详情
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
