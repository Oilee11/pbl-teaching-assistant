import React, { useState, useEffect, useRef } from 'react';
import { Send, FileText, Loader2, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import api from '../api';

export default function TeacherPBL() {
  const [courseName, setCourseName] = useState('');
  const [requirements, setRequirements] = useState('');
  const [generating, setGenerating] = useState(false);
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  const fetchPlans = async () => {
    try {
      const res = await api.get('/teacher/lesson-plans');
      setPlans(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    try {
      const res = await api.post('/teacher/lesson-plans/generate', { course_name: courseName, requirements });
      setPlans([res.data, ...plans]);
      setSelectedPlan(res.data);
      setCourseName('');
      setRequirements('');
    } catch (err) {
      alert('生成失败');
    } finally {
      setGenerating(false);
    }
  };

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    
    // 创建一个临时的克隆容器用于打印，设置更好的样式
    const printContainer = reportRef.current.cloneNode(true) as HTMLDivElement;
    printContainer.style.width = '210mm'; // A4 宽度
    printContainer.style.padding = '20mm';
    printContainer.style.background = 'white';
    printContainer.style.position = 'absolute';
    printContainer.style.left = '-9999px';
    printContainer.style.top = '0';
    document.body.appendChild(printContainer);

    try {
      const canvas = await html2canvas(printContainer, {
        scale: 2,
        useCORS: true,
        logging: false,
        windowWidth: printContainer.scrollWidth,
        windowHeight: printContainer.scrollHeight
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210; 
      const pageHeight = 295;  
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      // 第一页
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // 如果有剩余内容，继续分页
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save(`${selectedPlan.course_name}_项目式教案.pdf`);
    } finally {
      document.body.removeChild(printContainer);
    }
  };

  return (
    <div className="grid grid-cols-12 gap-8 max-w-6xl mx-auto">
      {/* Form and History List */}
      <div className="col-span-4 space-y-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-bold mb-4">生成新教案</h3>
          <form onSubmit={handleGenerate}>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">课程名称</label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">教学要求</label>
              <textarea
                className="w-full px-3 py-2 border rounded h-32"
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                required
                placeholder="例如：需要包含操作系统学习基础，重点关注进程同步..."
              ></textarea>
            </div>
            <button
              type="submit"
              disabled={generating}
              className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700 disabled:bg-blue-400 transition flex items-center justify-center"
            >
              {generating ? <Loader2 className="animate-spin mr-2" /> : <Send className="mr-2" />}
              开始生成
            </button>
          </form>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-bold mb-4">历史教案</h3>
          <div className="space-y-2">
            {plans.map((plan) => (
              <div
                key={plan.id}
                onClick={() => setSelectedPlan(plan)}
                className={`p-3 border rounded cursor-pointer transition-colors ${
                  selectedPlan?.id === plan.id ? 'bg-blue-50 border-blue-600' : 'hover:bg-gray-50'
                }`}
              >
                <div className="font-medium text-sm truncate">{plan.course_name}</div>
                <div className="text-xs text-gray-500">{new Date(plan.created_at).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content Display */}
      <div className="col-span-8">
        {selectedPlan ? (
          <div className="bg-white p-8 rounded-lg shadow h-full flex flex-col">
            <div className="flex justify-between items-start mb-6 border-b pb-4">
              <div>
                <h2 className="text-2xl font-bold">{selectedPlan.course_name}</h2>
                <p className="text-sm text-gray-500 mt-1">生成时间: {new Date(selectedPlan.created_at).toLocaleString()}</p>
              </div>
              <button 
                onClick={handleExportPDF}
                className="flex items-center text-blue-600 hover:text-blue-800"
              >
                <Download className="w-5 h-5 mr-1" /> 导出PDF
              </button>
            </div>
            <div ref={reportRef} className="flex-1 overflow-auto prose prose-blue max-w-none p-8 bg-white rounded-lg">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {selectedPlan.content}
              </ReactMarkdown>
            </div>
          </div>
        ) : (
          <div className="bg-white p-8 rounded-lg shadow h-full flex items-center justify-center text-gray-400 border-2 border-dashed">
            <div className="text-center">
              <FileText className="w-16 h-16 mx-auto mb-4 opacity-20" />
              请在左侧选择或生成一个教案
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
