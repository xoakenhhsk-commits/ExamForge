import React, { useState } from 'react';

export default function AutoTranslatePanel() {
  const [targetLang, setTargetLang] = useState('vi');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStatus, setProgressStatus] = useState('');
  const [videoFile, setVideoFile] = useState(null);
  const [outputVideoUrl, setOutputVideoUrl] = useState(null);

  const handleProcess = async () => {
    if (!videoFile) {
      alert("Please upload a video first!");
      return;
    }

    setIsProcessing(true);
    setProgressStatus('Uploading and starting Python Engine...');
    
    const formData = new FormData();
    formData.append('video', videoFile);
    formData.append('lang', targetLang);

    try {
      const response = await fetch('/api/translate-video', {
        method: 'POST',
        body: formData
      });

      if (!response.body) throw new Error("Stream not supported.");
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.substring(6));
              if (data.status === 'progress') {
                setProgressStatus(data.message);
              } else if (data.status === 'complete') {
                setProgressStatus('');
                setOutputVideoUrl(data.output_url);
              }
            } catch(e) {}
          }
        }
      }
    } catch (error) {
      console.error(error);
      setProgressStatus('Error occurred during processing.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="glass-panel">
      <h2 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1.2rem', fontWeight: 600 }}>1-Click Auto Translate</h2>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
        Automatically translates the video, lowers original volume, and burns hardsubs.
      </p>
      
      <div className="file-upload-wrapper" style={{ width: '100%', marginBottom: '1rem' }}>
        <button className="btn btn-secondary" style={{ width: '100%' }}>
          {videoFile ? videoFile.name : '1. Select Source Video'}
        </button>
        <input type="file" accept="video/*" onChange={e => setVideoFile(e.target.files[0])} />
      </div>

      <label>Target Language</label>
      <select 
        className="input-field" 
        value={targetLang} 
        onChange={(e) => setTargetLang(e.target.value)}
        style={{ appearance: 'auto', cursor: 'pointer' }}
      >
        <option value="vi">Vietnamese (Tiếng Việt)</option>
        <option value="en">English</option>
        <option value="ja">Japanese</option>
      </select>

      <button className="btn" style={{ width: '100%' }} onClick={handleProcess} disabled={isProcessing}>
        {isProcessing ? (
          <>
            <svg className="animate-spin" style={{ width: '18px', height: '18px', marginRight: '8px' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle><path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75"></path></svg>
            Processing...
          </>
        ) : (
          '🚀 Start Auto Translation'
        )}
      </button>

      {progressStatus && (
        <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'var(--accent-color)', fontWeight: 500, textAlign: 'center' }}>
          {progressStatus}
        </div>
      )}

      {outputVideoUrl && (
        <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#f2f2f7', borderRadius: '8px' }}>
          <label style={{ color: 'var(--text-primary)' }}>Final Rendered Video</label>
          <video src={outputVideoUrl} controls style={{ width: '100%', marginTop: '0.5rem', borderRadius: '4px' }} />
          <a href={outputVideoUrl} download className="btn btn-secondary" style={{ width: '100%', marginTop: '0.5rem' }}>
            Download Video
          </a>
        </div>
      )}
    </div>
  );
}
