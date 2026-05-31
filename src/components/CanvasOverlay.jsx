import React, { useRef, useState, useEffect } from 'react';

export default function CanvasOverlay({ videoRef }) {
  const canvasRef = useRef(null);
  const [texts, setTexts] = useState([]);
  const [selectedTextId, setSelectedTextId] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Draw loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Resize canvas to match video display size
    const resizeCanvas = () => {
      if (videoRef.current) {
        canvas.width = videoRef.current.clientWidth;
        canvas.height = videoRef.current.clientHeight;
      }
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    let animationFrameId;
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      texts.forEach(t => {
        ctx.font = `bold ${t.fontSize}px ${t.fontFamily}`;
        ctx.fillStyle = t.color;
        ctx.textBaseline = 'top';
        
        // Add subtle shadow for better visibility on video
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        
        ctx.fillText(t.content, t.x, t.y);
        
        // Reset shadow for stroke
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        if (t.id === selectedTextId) {
          const metrics = ctx.measureText(t.content);
          ctx.strokeStyle = '#6366f1';
          ctx.lineWidth = 2;
          // Draw dashed selection box
          ctx.setLineDash([5, 5]);
          ctx.strokeRect(t.x - 6, t.y - 6, metrics.width + 12, t.fontSize + 12);
          ctx.setLineDash([]);
        }
      });
      animationFrameId = requestAnimationFrame(render);
    };
    render();
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [texts, selectedTextId, videoRef]);

  const handleMouseDown = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    let clickedId = null;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    for (let i = texts.length - 1; i >= 0; i--) {
      const t = texts[i];
      ctx.font = `bold ${t.fontSize}px ${t.fontFamily}`;
      const metrics = ctx.measureText(t.content);
      if (x >= t.x && x <= t.x + metrics.width && y >= t.y && y <= t.y + t.fontSize) {
        clickedId = t.id;
        setDragOffset({ x: x - t.x, y: y - t.y });
        break;
      }
    }
    
    setSelectedTextId(clickedId);
    if (clickedId) setIsDragging(true);
  };

  const handleMouseMove = (e) => {
    if (!isDragging || selectedTextId === null) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setTexts(prev => prev.map(t => 
      t.id === selectedTextId ? { ...t, x: x - dragOffset.x, y: y - dragOffset.y } : t
    ));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const addText = () => {
    setTexts([...texts, {
      id: Date.now(),
      content: 'Hello AI',
      x: 100,
      y: 100,
      color: '#ffffff',
      fontSize: 48,
      fontFamily: 'Inter'
    }]);
  };

  return (
    <>
      <canvas
        ref={canvasRef}
        className="canvas-overlay"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
      <div style={{ position: 'absolute', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '0.75rem', background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(10px)', padding: '0.75rem', borderRadius: '12px', zIndex: 10, border: '1px solid var(--panel-border)', flexWrap: 'wrap', justifyContent: 'center', boxShadow: 'var(--shadow-md)' }}>
        <button className="btn" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }} onClick={addText}>+ Add Text</button>
        {selectedTextId && (
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: 'rgba(0,0,0,0.05)', padding: '0.25rem 0.5rem', borderRadius: '8px' }}>
            <input 
              type="color" 
              value={texts.find(t => t.id === selectedTextId)?.color || '#ffffff'}
              onChange={e => setTexts(prev => prev.map(t => t.id === selectedTextId ? { ...t, color: e.target.value } : t))}
              style={{ width: '32px', height: '32px', padding: 0, border: 'none', borderRadius: '4px', cursor: 'pointer', background: 'transparent' }}
            />
            <input 
              type="text" 
              className="input-field" 
              style={{ marginBottom: 0, padding: '0.4rem', width: '140px', fontSize: '0.85rem' }}
              value={texts.find(t => t.id === selectedTextId)?.content || ''}
              onChange={e => setTexts(prev => prev.map(t => t.id === selectedTextId ? { ...t, content: e.target.value } : t))}
            />
             <input 
              type="number" 
              className="input-field" 
              style={{ marginBottom: 0, padding: '0.4rem', width: '60px', fontSize: '0.85rem' }}
              value={texts.find(t => t.id === selectedTextId)?.fontSize || 32}
              onChange={e => setTexts(prev => prev.map(t => t.id === selectedTextId ? { ...t, fontSize: parseInt(e.target.value) || 32 } : t))}
            />
             <button className="btn" style={{ padding: '0.4rem 0.8rem', background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.5)' }} onClick={() => setTexts(prev => prev.filter(t => t.id !== selectedTextId))}>
               Delete
             </button>
          </div>
        )}
      </div>
    </>
  );
}
