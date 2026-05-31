import React, { useState } from 'react';

export default function VoiceDubbingPanel() {
  const [text, setText] = useState('');
  const [voice, setVoice] = useState('vi-VN-Standard-A');
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setAudioUrl(null);
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice })
      });
      
      if (response.status === 503) {
        const data = await response.json();
        console.warn("Backend fell back to mock audio because of missing Google Credentials:", data.error);
        setAudioUrl(data.fallbackUrl);
      } else if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      } else {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
      }
    } catch (err) {
      console.error("Failed to generate audio:", err);
      alert("Error generating audio. See console for details.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <h2 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.2rem', fontWeight: 600 }}>AI Voice Dubbing</h2>
      
      <label>Google TTS Voice</label>
      <select 
        className="input-field" 
        value={voice} 
        onChange={(e) => setVoice(e.target.value)}
        style={{ appearance: 'auto', backgroundColor: '#f2f2f7', cursor: 'pointer' }}
      >
        <option value="vi-VN-Standard-A">Vietnamese - Female (Standard A)</option>
        <option value="vi-VN-Standard-B">Vietnamese - Male (Standard B)</option>
        <option value="vi-VN-Standard-C">Vietnamese - Female (Standard C)</option>
        <option value="vi-VN-Standard-D">Vietnamese - Male (Standard D)</option>
        <option value="en-US-Neural2-A">English US - Male (Neural2 A)</option>
        <option value="en-US-Neural2-C">English US - Female (Neural2 C)</option>
      </select>

      <label>Text to Dub</label>
      <textarea 
        className="input-field" 
        rows="8" 
        placeholder="Nhập nội dung cần lồng tiếng vào đây..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        style={{ resize: 'vertical', flex: 1, minHeight: '150px' }}
      ></textarea>

      <button 
        className="btn" 
        onClick={handleGenerate} 
        disabled={isGenerating || !text} 
        style={{ 
          opacity: (!text || isGenerating) ? 0.6 : 1, 
          marginTop: '1rem',
          cursor: (!text || isGenerating) ? 'not-allowed' : 'pointer',
          justifyContent: 'center'
        }}
      >
        {isGenerating ? (
          <>
            <svg className="animate-spin" style={{ animation: 'spin 1s linear infinite', width: '20px', height: '20px' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            Generating Audio...
          </>
        ) : (
          'Generate Voice (Google TTS)'
        )}
      </button>

      {/* Add spin animation to index.css if not present, or inject here */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      {audioUrl && (
        <div style={{ marginTop: '2rem', padding: '1rem', background: 'var(--panel-bg)', borderRadius: '12px', border: '1px solid var(--panel-border)' }}>
          <label style={{ color: 'var(--accent-color)', fontWeight: 600 }}>Preview Generated Audio</label>
          <audio src={audioUrl} controls style={{ width: '100%', marginTop: '0.5rem', outline: 'none' }} />
        </div>
      )}
    </div>
  );
}
