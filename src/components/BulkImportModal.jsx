import React, { useState } from 'react';
import { FileText, Play, X, AlertCircle, CheckCircle, Info } from 'lucide-react';

export default function BulkImportModal({ isOpen, onClose, onImport }) {
  const [inputText, setInputText] = useState('');
  const [parsedCount, setParsedCount] = useState(0);
  const [parsedQuestions, setParsedQuestions] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const parseExamText = (text) => {
    if (!text.trim()) {
      setParsedCount(0);
      setParsedQuestions([]);
      setErrorMsg('');
      return;
    }

    try {
      // Regular expression to find questions starting with "Câu X:" or "Câu X."
      // Supports case-insensitive "câu", "câu hỏi"
      const questionRegex = /(?:C\u00e2u\s+\d+[:\.]|C\u00e2u\s+H\u1ecfi\s+\d+[:\.]|Question\s+\d+[:\.]|\d+[:\.])\s*/gi;
      
      // Split the text by the question regex
      const parts = text.split(questionRegex);
      
      // Find matches to get the original numbers (to align)
      const matches = text.match(questionRegex) || [];
      
      // The first part before any "Câu 1:" is usually intro/metadata
      const parsedList = [];

      let currentIndex = 0;
      for (let i = 1; i < parts.length; i++) {
        const questionTextRaw = parts[i].trim();
        if (!questionTextRaw) continue;

        // Split options. Typical formats: A. text, B. text, C. text, D. text
        // Or A) text, B) text, C) text, D) text
        const optionRegex = /\b([A-D])[\.\)\/\-]\s*/g;
        const optionParts = questionTextRaw.split(optionRegex);
        
        // The first part is the question body
        const questionBody = optionParts[0].trim();
        const optionsList = [];

        // Parse option choices
        for (let j = 1; j < optionParts.length; j += 2) {
          const letter = optionParts[j];
          let optText = optionParts[j + 1] ? optionParts[j + 1].trim() : '';
          
          // Clean up trailing commas/semicolons or linebreaks
          optText = optText.split(/\n/)[0].trim(); // take first line of option
          
          // Check for correct answer mark (e.g. trailing "*" or prefix "*", or [x] or [X])
          let isCorrect = false;
          if (optText.startsWith('*')) {
            isCorrect = true;
            optText = optText.substring(1).trim();
          } else if (optText.endsWith('*')) {
            isCorrect = true;
            optText = optText.substring(0, optText.length - 1).trim();
          } else if (optText.startsWith('[x]') || optText.startsWith('[X]')) {
            isCorrect = true;
            optText = optText.substring(3).trim();
          }

          optionsList.push({
            id: Math.random().toString(36).substr(2, 9),
            text: optText,
            isCorrect
          });
        }

        // Fill standard 4 options if not enough, or trim if too many
        while (optionsList.length < 4) {
          const nextLetter = ['A', 'B', 'C', 'D'][optionsList.length];
          optionsList.push({
            id: Math.random().toString(36).substr(2, 9),
            text: '',
            isCorrect: false
          });
        }

        // If no option was marked correct, default first option to false, or keep as is
        // Let's check if at least one correct option exists
        const hasCorrect = optionsList.some(o => o.isCorrect);

        parsedList.push({
          id: Math.random().toString(36).substr(2, 9),
          text: questionBody,
          points: 1,
          options: optionsList.slice(0, 4) // restrict to 4 options A, B, C, D
        });
      }

      setParsedQuestions(parsedList);
      setParsedCount(parsedList.length);
      
      if (parsedList.length === 0) {
        setErrorMsg('Không tìm thấy câu hỏi nào hợp lệ! Vui lòng kiểm tra lại định dạng (ví dụ: Câu 1: ...)');
      } else {
        setErrorMsg('');
      }
    } catch (err) {
      setErrorMsg('Đã xảy ra lỗi trong quá trình phân tích cú pháp văn bản!');
      console.error(err);
    }
  };

  const handleTextChange = (e) => {
    const text = e.target.value;
    setInputText(text);
    parseExamText(text);
  };

  const handleImportSubmit = () => {
    if (parsedQuestions.length === 0) return;
    onImport(parsedQuestions);
    setInputText('');
    setParsedQuestions([]);
    setParsedCount(0);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '780px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.5rem' }}>⚡</span>
            <h3>Nhập Câu Hỏi Nhanh Từ Văn Bản</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
          {/* Left panel: input text area */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#334155' }}>
              Dán nội dung đề thi vào đây:
            </label>
            <textarea
              value={inputText}
              onChange={handleTextChange}
              placeholder="Ví dụ dán:&#10;Câu 1: Hà Nội thuộc nước nào?&#10;A. Pháp&#10;B. Việt Nam*&#10;C. Hoa Kỳ&#10;D. Nhật Bản&#10;&#10;Câu 2: Số nguyên tố chẵn duy nhất là?&#10;A. 2*&#10;B. 4&#10;C. 6&#10;D. 8"
              style={{
                width: '100%',
                height: '320px',
                padding: '12px',
                borderRadius: '10px',
                border: '1.5px solid #cbd5e1',
                fontSize: '0.85rem',
                fontFamily: 'monospace',
                resize: 'none',
                outline: 'none',
                lineHeight: '1.5',
                backgroundColor: '#f8fafc'
              }}
            />
            {errorMsg && (
              <div className="drawer-error" style={{ marginTop: '5px' }}>
                <AlertCircle size={16} />
                <span style={{ fontSize: '0.75rem' }}>{errorMsg}</span>
              </div>
            )}
            {parsedCount > 0 && (
              <div className="sync-badge saved" style={{ alignSelf: 'flex-start', marginTop: '5px' }}>
                <CheckCircle size={14} />
                <span>Phát hiện thành công {parsedCount} câu hỏi!</span>
              </div>
            )}
          </div>

          {/* Right panel: guide / instructions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: '#f1f5f9', padding: '16px', borderRadius: '12px', overflowY: 'auto', maxHeight: '380px' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px', color: '#1e293b' }}>
              <Info size={16} /> Hướng Dẫn Định Dạng
            </h4>
            
            <div style={{ fontSize: '0.75rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '8px', lineHeight: '1.5' }}>
              <p>Hệ thống tự động nhận diện câu hỏi từ các văn bản được soạn thảo sẵn từ MS Word hoặc tài liệu PDF của bạn.</p>
              
              <div style={{ borderLeft: '3px solid #6366f1', paddingLeft: '8px', margin: '4px 0', fontStyle: 'italic' }}>
                <strong>Câu hỏi:</strong> Bắt đầu bằng <code>Câu 1:</code>, <code>Câu 2.</code> hoặc <code>Question 1:</code>
              </div>
              
              <div style={{ borderLeft: '3px solid #10b981', paddingLeft: '8px', margin: '4px 0', fontStyle: 'italic' }}>
                <strong>Đáp án:</strong> Bắt đầu bằng các chữ cái <code>A.</code>, <code>B.</code>, <code>C.</code>, <code>D.</code> hoặc <code>A)</code>, <code>B)</code>
              </div>

              <div style={{ borderLeft: '3px solid #f59e0b', paddingLeft: '8px', margin: '4px 0', fontStyle: 'italic' }}>
                <strong>Đáp án đúng:</strong> Thêm ký hiệu dấu sao <code>*</code> ở đầu/cuối phương án hoặc tiền tố <code>[x]</code> để tự động đánh dấu đáp án đúng.
              </div>

              <h5 style={{ fontWeight: '700', color: '#1e293b', marginTop: '10px', fontSize: '0.8rem' }}>Mẫu chuẩn khuyên dùng:</h5>
              <pre style={{
                backgroundColor: '#ffffff',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                fontFamily: 'monospace',
                fontSize: '0.7rem',
                color: '#334155',
                overflowX: 'auto'
              }}>
{`Câu 1: Trái Đất quay quanh mặt trời mất bao lâu?
A. 12 giờ
B. 24 giờ
C. 365 ngày*
D. 30 ngày

Câu 2: Công thức hóa học của nước là?
A. H2O*
B. CO2
C. NaCl
D. HCl`}
              </pre>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Hủy bỏ
          </button>
          <button 
            className="btn btn-primary" 
            onClick={handleImportSubmit} 
            disabled={parsedQuestions.length === 0}
            style={{ display: 'flex', gap: '6px', alignItems: 'center' }}
          >
            <Play size={14} /> Dán & Nhập {parsedQuestions.length > 0 ? `(${parsedQuestions.length} câu)` : ''}
          </button>
        </div>
      </div>
    </div>
  );
}
