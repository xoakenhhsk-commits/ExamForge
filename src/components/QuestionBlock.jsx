import React, { useRef, useEffect } from 'react';
import { Trash2 } from 'lucide-react';

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

export default function QuestionBlock({ 
  question, 
  number, 
  updateQuestion, 
  removeQuestion, 
  showAnswers, 
  onHeightChange,
  isReadOnly
}) {
  const qRef = useRef(null);
  const containerRef = useRef(null);
  
  const adjustHeight = (el) => {
    if (el) {
      el.style.height = 'auto';
      el.style.height = (el.scrollHeight) + 'px';
    }
  };

  // Adjust height of question text area when text changes
  useEffect(() => {
    adjustHeight(qRef.current);
  }, [question.text]);

  // Set up ResizeObserver to monitor the height of the entire block
  useEffect(() => {
    if (!containerRef.current || !onHeightChange) return;

    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const height = entry.target.offsetHeight;
        onHeightChange(question.id, height);
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [question.id, onHeightChange]);

  const handleQuestionChange = (e) => {
    if (isReadOnly) return;
    updateQuestion(question.id, 'text', e.target.value);
    adjustHeight(e.target);
  };

  const handleOptionChange = (optionId, value, e) => {
    if (isReadOnly) return;
    const newOptions = question.options.map(opt => 
      opt.id === optionId ? { ...opt, text: value } : opt
    );
    updateQuestion(question.id, 'options', newOptions);
    adjustHeight(e.target);
  };

  const toggleCorrectOption = (optionId) => {
    if (isReadOnly) return;
    const newOptions = question.options.map(opt => ({
      ...opt,
      isCorrect: opt.id === optionId ? !opt.isCorrect : false // only 1 correct answer per question
    }));
    updateQuestion(question.id, 'options', newOptions);
  };

  return (
    <div className="question-block" ref={containerRef}>
      {!isReadOnly && (
        <button 
          className="delete-btn" 
          onClick={() => removeQuestion(question.id)}
          title="Xóa câu hỏi"
        >
          <Trash2 size={18} />
        </button>
      )}

      <div className="question-row">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span className="question-label">Câu {number}:</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>Điểm:</span>
            <input 
              type="number" 
              value={question.points !== undefined ? question.points : 1}
              onChange={(e) => updateQuestion(question.id, 'points', Number(e.target.value))}
              disabled={isReadOnly}
              min="0"
              step="0.25"
              style={{ width: '70px', padding: '4px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none' }}
            />
          </div>
        </div>
        <textarea
          ref={qRef}
          id={`q-text-${question.id}`}
          className="text-area-auto"
          value={question.text}
          onChange={handleQuestionChange}
          placeholder={isReadOnly ? "" : "Nhập nội dung câu hỏi..."}
          rows={1}
          disabled={isReadOnly}
        />
      </div>

      <div className="options-grid grid-2">
        {question.options.map((option, index) => {
          const isHighlighted = showAnswers && option.isCorrect;
          return (
            <div className={`option-row ${isHighlighted ? 'correct-option' : ''}`} key={option.id}>
              <span 
                className={`option-label ${isReadOnly ? '' : 'clickable-label'}`}
                onClick={() => toggleCorrectOption(option.id)}
                title={isReadOnly ? "" : "Đánh dấu là đáp án đúng"}
              >
                {OPTION_LABELS[index]}.
              </span>
              <textarea
                id={`opt-text-${question.id}-${option.id}`}
                className="text-area-auto"
                value={option.text}
                onChange={(e) => handleOptionChange(option.id, e.target.value, e)}
                placeholder={isReadOnly ? "" : `Nhập đáp án ${OPTION_LABELS[index]}...`}
                rows={1}
                disabled={isReadOnly}
                onFocus={(e) => adjustHeight(e.target)} // Ensure height is correct on focus
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}


