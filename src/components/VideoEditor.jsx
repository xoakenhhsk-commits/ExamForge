import React, { useRef, useState } from 'react';
import CanvasOverlay from './CanvasOverlay';

export default function VideoEditor() {
  const [videoSrc, setVideoSrc] = useState(null);
  const videoRef = useRef(null);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoSrc(url);
    }
  };

  return (
    <div className="glass-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600 }}>Video & Canvas Editor</h2>
        <div className="file-upload-wrapper" style={{ width: 'auto' }}>
          <button className="btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
            Upload Video
          </button>
          <input type="file" accept="video/*" onChange={handleFileUpload} />
        </div>
      </div>

      <div className="video-container">
        {videoSrc ? (
          <>
            <video 
              ref={videoRef} 
              src={videoSrc} 
              className="video-player" 
              controls 
            />
            <CanvasOverlay videoRef={videoRef} />
          </>
        ) : (
          <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
            Please upload a video to start editing
          </div>
        )}
      </div>
    </div>
  );
}
