import React, { forwardRef, useState, useRef, useEffect } from 'react';
import { PosterState, TextElement } from '../types';

interface PosterCanvasProps {
  data: PosterState;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onUpdatePosition: (id: string, x: number, y: number) => void;
}

const PosterCanvas = forwardRef<HTMLDivElement, PosterCanvasProps>(({ data, selectedId, onSelect, onUpdatePosition }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [draggedId, setDraggedId] = useState<string | null>(null);

  // Helper to map font names to CSS classes or families
  const getFontFamily = (font: string) => {
    switch (font) {
      case 'Amiri': return '"Amiri", serif';
      case 'Aref Ruqaa': return '"Aref Ruqaa", serif';
      case 'Lalezar': return '"Lalezar", cursive';
      case 'Tajawal': return '"Tajawal", sans-serif';
      default: return '"Cairo", sans-serif';
    }
  };

  const handlePointerDown = (e: React.PointerEvent, elementId: string, currentX: number, currentY: number) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect(elementId);
    setDraggedId(elementId);
    setIsDragging(true);
    
    // Calculate offset so we don't snap to top-left of element
    const clientX = e.clientX;
    const clientY = e.clientY;
    
    // We need to work in the coordinate space of the container (1280x720 scaled)
    // But since we are updating the raw X/Y which are in 1280x720 space, we handle delta in the move event
    setDragOffset({ x: clientX, y: clientY });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !draggedId || !containerRef.current) return;
    
    e.preventDefault();
    
    // Calculate Scale Factor (because the canvas might be scaled down via CSS transform in the parent)
    // We need to know the actual rendered size vs the internal 1280 width
    const rect = containerRef.current.getBoundingClientRect();
    const scale = rect.width / 1280;

    const deltaX = (e.clientX - dragOffset.x) / scale;
    const deltaY = (e.clientY - dragOffset.y) / scale;

    const elementKey = draggedId as keyof typeof data.elements;
    const currentEl = data.elements[elementKey];

    onUpdatePosition(draggedId, currentEl.x + deltaX, currentEl.y + deltaY);
    
    setDragOffset({ x: e.clientX, y: e.clientY });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    setDraggedId(null);
  };

  // Attach global mouse up to catch drops outside the element
  useEffect(() => {
    const handleGlobalUp = () => {
      if (isDragging) {
        setIsDragging(false);
        setDraggedId(null);
      }
    };
    window.addEventListener('pointerup', handleGlobalUp);
    return () => window.removeEventListener('pointerup', handleGlobalUp);
  }, [isDragging]);

  const renderTextElement = (key: string, el: TextElement) => {
    const isSelected = selectedId === key;
    
    return (
      <div
        key={key}
        onPointerDown={(e) => handlePointerDown(e, key, el.x, el.y)}
        className={`absolute cursor-move select-none p-2 border-2 transition-colors ${
          isSelected ? 'border-blue-500 bg-blue-50/10' : 'border-transparent hover:border-blue-300/50'
        }`}
        style={{
          left: `${el.x}px`,
          top: `${el.y}px`,
          fontSize: `${el.fontSize}px`,
          fontFamily: getFontFamily(el.fontFamily),
          color: el.color,
          lineHeight: 1.2,
          whiteSpace: 'pre-wrap',
          textAlign: 'center',
          maxWidth: el.width ? `${el.width}px` : 'auto',
          textShadow: '2px 2px 0px rgba(255,255,255,0.8)',
          zIndex: isSelected ? 50 : 10,
        }}
      >
        {el.text || <span className="opacity-50 text-gray-400 italic">نص فارغ</span>}
        
        {/* Resize Handles (Visual Only for now to indicate selection) */}
        {isSelected && (
          <>
            <div className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 rounded-full" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full" />
            <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 rounded-full" />
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 rounded-full" />
          </>
        )}
      </div>
    );
  };

  return (
    <div className="w-full flex justify-center p-4">
      <div
        ref={ref}
        className="relative overflow-hidden shadow-2xl bg-[#FDF3E3]"
        style={{
          width: '1280px',
          height: '720px',
          minWidth: '1280px',
          minHeight: '720px',
        }}
      >
        {/* Inner container for scaling/events reference */}
        <div 
          ref={containerRef}
          className="w-full h-full relative"
          onPointerMove={handlePointerMove}
        >
          {/* Background Layer */}
          {data.backgroundImage ? (
            <img 
              src={data.backgroundImage} 
              alt="Background" 
              className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
            />
          ) : (
            <div className="absolute inset-0 w-full h-full pointer-events-none select-none">
              <div className="absolute top-0 left-0 w-full h-4 bg-[#8B1E1E]"></div>
              <div className="absolute bottom-0 left-0 w-full h-4 bg-[#8B1E1E]"></div>
              <div className="absolute top-0 left-0 w-32 h-32 border-r-4 border-b-4 border-[#8B1E1E] rounded-br-[4rem] opacity-20"></div>
              <div className="absolute top-0 right-0 w-32 h-32 border-l-4 border-b-4 border-[#8B1E1E] rounded-bl-[4rem] opacity-20"></div>
              <div className="absolute top-1/3 left-16 right-16 bottom-1/4 border-2 border-dashed border-[#8B1E1E]/50 rounded-[3rem]"></div>
            </div>
          )}

          {/* Render All Text Elements */}
          {Object.entries(data.elements).map(([key, element]) => 
            renderTextElement(key, element as TextElement)
          )}
        </div>
      </div>
    </div>
  );
});

PosterCanvas.displayName = 'PosterCanvas';

export default PosterCanvas;