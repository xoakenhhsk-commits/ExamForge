import React, { useState, useEffect, useCallback } from 'react';
import { Play, ArrowLeft, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import './OnlineExamPortal.css';

export default function OnlineExamPortal({ onBack }) {
  const [roomCode, setRoomCode] = useState('');
  const [studentName, setStudentName] = useState('');
  const [status, setStatus] = useState('joining'); // 'joining' | 'taking' | 'finished'
  
  const [examData, setExamData] = useState(null);
  const [enableAntiCheat, setEnableAntiCheat] = useState(true);
  const [answers, setAnswers] = useState({}); // { questionId: selectedOptionId }
  
  const [cheatCount, setCheatCount] = useState(0);
  const [showCheatWarning, setShowCheatWarning] = useState(false);
  const [cheatMessage, setCheatMessage] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!roomCode.trim() || !studentName.trim()) {
      setError('Vui lòng nhập Mã phòng và Họ tên!');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`/api/rooms/${roomCode.trim()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Lỗi kết nối!');
      
      setExamData(data.exam);
      setEnableAntiCheat(data.enableAntiCheat !== false);
      setStatus('taking');
      setCheatCount(0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (qId, optId) => {
    setAnswers(prev => ({ ...prev, [qId]: optId }));
  };

  const handleSubmitExam = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn nộp bài? Hành động này không thể hoàn tác!')) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/rooms/${roomCode.trim()}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentName: studentName.trim(), answers, cheatCount })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Lỗi khi nộp bài!');
      
      setResult(data);
      setStatus('finished');
    } catch (err) {
      setError(err.message);
      alert('Không thể nộp bài: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Anti-Cheat: Detect leaving page
  useEffect(() => {
    if (status !== 'taking' || !enableAntiCheat) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setCheatCount(prev => prev + 1);
        setCheatMessage('CẢNH BÁO: Bạn đã rời khỏi màn hình hoặc tab làm bài! Hệ thống đã ghi nhận vi phạm và sẽ trừ điểm thi của bạn.');
        setShowCheatWarning(true);
      }
    };

    const handleWindowBlur = () => {
      setCheatCount(prev => prev + 1);
      setCheatMessage('CẢNH BÁO: Bạn đã thoát khỏi cửa sổ làm bài! Hành động này được tính là gian lận.');
      setShowCheatWarning(true);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [status]);

  if (status === 'joining') {
    return (
      <div className="portal-container">
        <button className="back-btn" onClick={onBack}><ArrowLeft size={16} /> Quay lại Workspace</button>
        <div className="portal-box">
          <div className="portal-header">
            <Play size={40} className="portal-icon" />
            <h2>Vào Phòng Thi Online</h2>
            <p>Nhập mã phòng do giáo viên cung cấp để bắt đầu làm bài</p>
          </div>
          <form onSubmit={handleJoin} className="portal-form">
            {error && <div className="portal-error">{error}</div>}
            <input 
              type="text" 
              placeholder="Họ và tên học sinh..." 
              value={studentName}
              onChange={e => setStudentName(e.target.value)}
            />
            <input 
              type="text" 
              placeholder="MÃ PHÒNG (Ví dụ: X9Z2K)..." 
              value={roomCode}
              onChange={e => setRoomCode(e.target.value.toUpperCase())}
              maxLength={6}
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Đang kết nối...' : 'Tham Gia Phòng Thi'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (status === 'taking' && examData) {
    const OPTION_LABELS = ['A', 'B', 'C', 'D'];
    return (
      <div className="taking-container">
        <div className="taking-header">
          <div className="taking-info">
            <h3>{examData.examTitle}</h3>
            <p>Học sinh: <strong>{studentName}</strong> | Môn thi: {examData.examYearSubject}</p>
          </div>
          <div className="taking-actions">
            {cheatCount > 0 && (
              <div className="cheat-warning">
                <AlertTriangle size={16} /> Vi phạm: {cheatCount} lần
              </div>
            )}
            <button className="submit-exam-btn" onClick={handleSubmitExam} disabled={loading}>
              {loading ? 'Đang nộp...' : 'Nộp Bài'}
            </button>
          </div>
        </div>

        <div className="taking-body">
          {examData.questions.map((q, qIndex) => (
            <div key={q.id} className="taking-question">
              <h4>Câu {qIndex + 1} ({q.points !== undefined ? q.points : 1} điểm): {q.text}</h4>
              <div className="taking-options">
                {q.options.map((opt, optIndex) => (
                  <label 
                    key={opt.id} 
                    className={`taking-option ${answers[q.id] === opt.id ? 'selected' : ''}`}
                  >
                    <input 
                      type="radio" 
                      name={`question_${q.id}`}
                      value={opt.id}
                      checked={answers[q.id] === opt.id}
                      onChange={() => handleSelectOption(q.id, opt.id)}
                    />
                    <span className="opt-label">{OPTION_LABELS[optIndex]}.</span>
                    <span className="opt-text">{opt.text}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (status === 'finished' && result) {
    return (
      <div className="portal-container">
        <button className="back-btn" onClick={onBack}><ArrowLeft size={16} /> Về Trang Chủ</button>
        <div className="portal-box results-box">
          <CheckCircle size={56} className="success-icon" />
          <h2>Nộp Bài Thành Công!</h2>
          <p>Học sinh: <strong>{studentName}</strong></p>
          
          <div className="score-display">
            <h3>{result.score} / {result.maxScore || 10}</h3>
            <p>Đúng {result.correctCount} / {result.total} câu</p>
          </div>

          {result.cheatPenaltyApplied && (
            <div className="cheat-penalty">
              <AlertTriangle size={16} /> 
              Bạn đã bị trừ điểm vì thoát khỏi màn hình làm bài {result.cheatCount} lần!
            </div>
          )}

          {result.incorrectAnswers && result.incorrectAnswers.length > 0 && (
            <div className="incorrect-answers" style={{ marginTop: '20px', textAlign: 'left', backgroundColor: '#fef2f2', padding: '16px', borderRadius: '8px', border: '1px solid #fecaca' }}>
              <h4 style={{ color: '#b91c1c', marginTop: 0, marginBottom: '12px' }}>Các câu trả lời sai:</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {result.incorrectAnswers.map(ans => (
                  <li key={ans.questionId} style={{ fontSize: '0.85rem' }}>
                    <strong>Câu hỏi:</strong> {ans.questionText}<br/>
                    <span style={{ color: '#b91c1c' }}>❌ Bạn chọn sai</span><br/>
                    <span style={{ color: '#15803d' }}>✅ Đáp án đúng: {ans.correctOptionText}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="results-note">Điểm số đã được gửi trực tiếp cho giáo viên.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {showCheatWarning && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', maxWidth: '400px', textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
            <AlertTriangle size={48} color="#e3342f" style={{ marginBottom: '20px', margin: '0 auto' }} />
            <h3 style={{ color: '#e3342f', marginBottom: '10px' }}>Vi Phạm Nội Quy!</h3>
            <p style={{ marginBottom: '20px', color: '#333' }}>{cheatMessage}</p>
            <button 
              onClick={() => setShowCheatWarning(false)}
              style={{ backgroundColor: '#e3342f', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Tôi đã hiểu
            </button>
          </div>
        </div>
      )}
    </>
  );
}
