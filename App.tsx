import React, { useState, useRef, useCallback } from 'react';
import { toPng } from 'html-to-image';
import { PosterState, FontFamily, TextElement } from './types';
import PosterCanvas from './components/PosterCanvas';
import { enhancePosterContent } from './services/geminiService';
import { Loader2, Download, Wand2, Upload, Trash2, Type, Move, Palette } from 'lucide-react';

const INITIAL_STATE: PosterState = {
  backgroundImage: null,
  elements: {
    date: {
      id: 'date',
      label: 'التاريخ',
      text: 'الخميس 07 أوت 2025',
      x: 400,
      y: 120,
      fontSize: 48,
      fontFamily: 'Cairo',
      color: '#004d40'
    },
    honorific: {
      id: 'honorific',
      label: 'اللقب العلمي',
      text: 'الدكتور',
      x: 550,
      y: 220,
      fontSize: 36,
      fontFamily: 'Amiri',
      color: '#004d40'
    },
    name: {
      id: 'name',
      label: 'اسم المحاضر',
      text: 'عبد الرحمان بن إبراهيم نجار',
      x: 400,
      y: 270,
      fontSize: 60,
      fontFamily: 'Amiri',
      color: '#1a1a1a'
    },
    title: {
      id: 'title',
      label: 'عنوان المحاضرة',
      text: 'من التماسك الاجتماعي إلى التقدم الحضاري\nقراءة في مفهوم رأس المال الاجتماعي',
      x: 165,
      y: 400,
      fontSize: 72,
      fontFamily: 'Lalezar',
      color: '#b71c1c',
      width: 950
    }
  }
};

const FONTS: { label: string; value: FontFamily }[] = [
  { label: 'القاهرة (Cairo)', value: 'Cairo' },
  { label: 'أميري (Amiri)', value: 'Amiri' },
  { label: 'عارف رقعة (Aref Ruqaa)', value: 'Aref Ruqaa' },
  { label: 'لاليزار (Lalezar)', value: 'Lalezar' },
  { label: 'تجوال (Tajawal)', value: 'Tajawal' },
];

const COLORS = [
  '#000000', '#1a1a1a', '#ffffff', 
  '#b71c1c', '#c62828', '#8B1E1E',
  '#004d40', '#00695c', '#00796b',
  '#1e3a8a', '#1e40af', '#3730a3'
];

export default function App() {
  const posterRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>('title'); // Default select title
  
  const [data, setData] = useState<PosterState>(INITIAL_STATE);

  // --- Element Updates ---

  const updateElement = (id: string, updates: Partial<typeof INITIAL_STATE.elements.date>) => {
    setData(prev => ({
      ...prev,
      elements: {
        ...prev.elements,
        [id]: { ...prev.elements[id as keyof typeof prev.elements], ...updates }
      }
    }));
  };

  const handlePositionUpdate = (id: string, x: number, y: number) => {
    updateElement(id, { x, y });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setData(prev => ({ ...prev, backgroundImage: event.target!.result as string }));
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleAiEnhancement = async () => {
    const { date, title } = data.elements;
    if (!date.text && !title.text) return;
    
    setAiLoading(true);
    try {
      const result = await enhancePosterContent(date.text, title.text);
      setData(prev => ({
        ...prev,
        elements: {
          ...prev.elements,
          date: { ...prev.elements.date, text: result.formattedDate || prev.elements.date.text },
          title: { ...prev.elements.title, text: result.enhancedTitle || prev.elements.title.text }
        }
      }));
    } finally {
      setAiLoading(false);
    }
  };

  const handleDownload = useCallback(async () => {
    // Deselect before download to hide handles
    const currentSelection = selectedId;
    setSelectedId(null);
    
    // Wait for render cycle to clear selection handles
    setTimeout(async () => {
      if (posterRef.current === null) return;
      setLoading(true);
      try {
        const dataUrl = await toPng(posterRef.current, { cacheBust: true, pixelRatio: 1 });
        const link = document.createElement('a');
        link.download = `poster-${Date.now()}.png`;
        link.href = dataUrl;
        link.click();
      } catch (err) {
        console.error("Failed to generate image", err);
        alert("حدث خطأ أثناء حفظ الصورة");
      } finally {
        setLoading(false);
        setSelectedId(currentSelection); // Restore selection
      }
    }, 100);
  }, [posterRef, selectedId]);

  const selectedElement = selectedId ? data.elements[selectedId as keyof typeof data.elements] : null;

  return (
    <div className="h-screen flex flex-col bg-gray-100 overflow-hidden">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 py-3 px-6 z-20">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-teal-700 rounded-lg flex items-center justify-center text-white font-bold text-lg">
              م
            </div>
            <h1 className="text-xl font-bold text-gray-800 hidden sm:block">صانع المحاضرات</h1>
          </div>
          <div className="flex gap-3">
             <button
              onClick={handleAiEnhancement}
              disabled={aiLoading}
              className="px-3 py-2 bg-indigo-50 text-indigo-700 text-sm font-medium rounded-lg hover:bg-indigo-100 transition flex items-center gap-2 border border-indigo-200"
            >
              {aiLoading ? <Loader2 className="animate-spin" size={16} /> : <Wand2 size={16} />}
              <span className="hidden sm:inline">تحسين النصوص (AI)</span>
            </button>
            <button
              onClick={handleDownload}
              disabled={loading}
              className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-sm font-bold rounded-lg transition flex items-center gap-2 shadow-sm"
            >
              {loading ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
              <span>حفظ الصورة</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Sidebar: Controls */}
        <div className="w-full md:w-80 bg-white border-l border-gray-200 overflow-y-auto flex-shrink-0 z-10 shadow-lg flex flex-col">
          
          {/* Section: Element Selection */}
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">طبقات التصميم</h3>
            <div className="space-y-2">
              {(Object.values(data.elements) as TextElement[]).map((el) => (
                <button
                  key={el.id}
                  onClick={() => setSelectedId(el.id)}
                  className={`w-full text-right px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-all ${
                    selectedId === el.id 
                      ? 'bg-blue-600 text-white shadow-md' 
                      : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Move size={14} className={selectedId === el.id ? 'text-blue-200' : 'text-gray-400'} />
                  {el.label}
                </button>
              ))}
            </div>
          </div>

          {/* Section: Properties Editor */}
          <div className="flex-1 p-4 space-y-6">
            {selectedElement ? (
              <div className="space-y-5 animate-fadeIn">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                  <span className="p-1 bg-blue-100 text-blue-600 rounded">
                    <Type size={16} />
                  </span>
                  <span className="font-bold text-gray-800">خصائص {selectedElement.label}</span>
                </div>

                {/* Text Content */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500">النص</label>
                  <textarea
                    value={selectedElement.text}
                    onChange={(e) => updateElement(selectedElement.id, { text: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm min-h-[80px]"
                  />
                </div>

                {/* Font Family */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500">نوع الخط</label>
                  <select
                    value={selectedElement.fontFamily}
                    onChange={(e) => updateElement(selectedElement.id, { fontFamily: e.target.value as FontFamily })}
                    className="w-full p-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  >
                    {FONTS.map(f => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                </div>

                {/* Font Size */}
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <label className="text-xs font-semibold text-gray-500">حجم الخط</label>
                    <span className="text-xs text-gray-400">{selectedElement.fontSize}px</span>
                  </div>
                  <input
                    type="range"
                    min="16"
                    max="150"
                    value={selectedElement.fontSize}
                    onChange={(e) => updateElement(selectedElement.id, { fontSize: parseInt(e.target.value) })}
                    className="w-full accent-blue-600 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                 {/* Colors */}
                 <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-500 flex items-center gap-1">
                    <Palette size={12} />
                    لون النص
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {COLORS.map(color => (
                      <button
                        key={color}
                        onClick={() => updateElement(selectedElement.id, { color })}
                        className={`w-6 h-6 rounded-full border border-gray-200 ${selectedElement.color === color ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

              </div>
            ) : (
              <div className="text-center text-gray-400 py-10">
                <p>اضغط على أي عنصر في التصميم لتعديله</p>
              </div>
            )}
            
            <hr className="border-gray-100" />
            
            {/* Background Settings */}
            <div className="space-y-3">
               <h4 className="text-sm font-bold text-gray-700">الخلفية</h4>
               <div 
                 onClick={() => fileInputRef.current?.click()}
                 className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition"
               >
                 <Upload className="text-gray-400 mb-2" size={24} />
                 <span className="text-xs text-gray-500 text-center">رفع صورة خلفية</span>
                 <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
               </div>
               {data.backgroundImage && (
                 <button 
                   onClick={() => {
                     setData(prev => ({ ...prev, backgroundImage: null }));
                     if (fileInputRef.current) fileInputRef.current.value = '';
                   }}
                   className="w-full py-1 text-red-500 text-xs border border-red-200 rounded hover:bg-red-50 flex items-center justify-center gap-1"
                 >
                   <Trash2 size={12} /> حذف الخلفية
                 </button>
               )}
            </div>

          </div>
        </div>

        {/* Main Canvas Area */}
        <div className="flex-1 bg-gray-200 overflow-auto flex items-center justify-center p-4 relative">
          <div className="absolute inset-0 pattern-grid opacity-10 pointer-events-none"></div>
          
          <div className="transform scale-[0.45] md:scale-[0.6] lg:scale-[0.7] xl:scale-[0.8] origin-center shadow-2xl transition-transform duration-200">
             <PosterCanvas 
               ref={posterRef} 
               data={data}
               selectedId={selectedId}
               onSelect={setSelectedId}
               onUpdatePosition={handlePositionUpdate}
             />
          </div>
          
          <div className="absolute bottom-4 left-4 bg-white/80 backdrop-blur px-3 py-1 rounded-full text-xs text-gray-500 shadow-sm">
            يمكنك سحب العناصر لتحريكها
          </div>
        </div>

      </div>
    </div>
  );
}