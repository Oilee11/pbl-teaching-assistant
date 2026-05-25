import React, { useState } from 'react';
import { Send, User, Bot, Star, Loader2 } from 'lucide-react';
import api from '../api';

export default function StudentQA() {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastQA, setLastQA] = useState<any>(null);

const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || loading) return;

    const newMsg = { role: 'user', content: question };
    setMessages([...messages, newMsg]);
    setLoading(true);
    setQuestion('');
    setShowFeedback(false); // 清除上一个回答的反馈框
    setRating(0); // 重置评分
    setComment(''); // 重置评论

    try {
      const res = await api.post('/student/qa', { question: newMsg.content });
      const botMsg = { role: 'bot', content: res.data.answer, sources: res.data.sources };
      setMessages((prev) => [...prev, botMsg]);
      setLastQA(botMsg);
      setShowFeedback(true);
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'bot', content: '抱歉，系统出现错误。' }]);
    } finally {
      setLoading(false);
    }
  };

  const submitFeedback = async () => {
    try {
      await api.post('/student/feedback', {
        question: messages[messages.length - 2].content,
        answer: lastQA.content,
        rating,
        comment
      });
      alert('感谢您的反馈！');
      setShowFeedback(false);
      setRating(0);
      setComment('');
    } catch (err) {
      alert('提交反馈失败');
    }
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-full">
      <div className="flex-1 overflow-auto space-y-6 mb-6 p-4">
        {messages.length === 0 && (
          <div className="text-center mt-20 text-gray-400">
            <Bot className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p>有什么我可以帮您的吗？您可以询问关于课程知识的问题。</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`p-2 rounded-full h-10 w-10 flex items-center justify-center flex-shrink-0 ${
                msg.role === 'user' ? 'bg-blue-600 ml-3' : 'bg-white shadow-sm border mr-3'
              }`}>
                {msg.role === 'user' ? <User className="text-white w-6 h-6" /> : <Bot className="text-blue-600 w-6 h-6" />}
              </div>
              <div className={`p-4 rounded-2xl shadow-sm ${
                msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none'
              }`}>
                <div className="whitespace-pre-wrap">{msg.content}</div>
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-gray-100 text-xs text-gray-400">
                    来源: {msg.sources.join(', ')}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white p-4 rounded-2xl shadow-sm border rounded-tl-none">
              <Loader2 className="animate-spin text-blue-600" />
            </div>
          </div>
        )}
      </div>

      {showFeedback && (
        <div className="bg-white p-4 rounded-lg shadow-md mb-4 border border-blue-100">
          <p className="text-sm font-medium mb-2">对回答满意吗？</p>
          <div className="flex items-center space-x-2 mb-3">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className={`w-5 h-5 cursor-pointer transition ${s <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                onClick={() => setRating(s)}
              />
            ))}
          </div>
          <textarea
            className="w-full p-2 border rounded text-sm mb-2"
            placeholder="写下您的评价（可选）"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          ></textarea>
          <div className="flex justify-end space-x-2">
            <button onClick={() => setShowFeedback(false)} className="px-3 py-1 text-sm text-gray-500">取消</button>
            <button onClick={submitFeedback} className="px-3 py-1 text-sm bg-blue-600 text-white rounded">提交</button>
          </div>
        </div>
      )}

      <form onSubmit={handleSend} className="relative">
        <input
          type="text"
          className="w-full p-4 pr-16 rounded-xl shadow-lg border-none focus:ring-2 focus:ring-blue-500"
          placeholder="请输入您的问题..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !question.trim()}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-blue-600 disabled:text-gray-400"
        >
          <Send className="w-6 h-6" />
        </button>
      </form>
    </div>
  );
}