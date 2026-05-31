import React, { useState } from 'react';
import { Eye, EyeOff, Lock, User, X, Loader2 } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [isLoginTab, setIsLoginTab] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Vui lòng điền đầy đủ thông tin!');
      return;
    }

    setLoading(true);

    const url = isLoginTab ? '/api/auth/login' : '/api/auth/register';

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password: password.trim() }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Đã xảy ra lỗi, vui lòng thử lại!');
      }

      // Success
      localStorage.setItem('examcreator_token', data.token);
      localStorage.setItem('examcreator_user', JSON.stringify(data.user));
      onAuthSuccess(data.token, data.user);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="auth-modal-close" onClick={onClose} aria-label="Close">
          <X size={20} />
        </button>

        <div className="auth-header">
          <h2>📄 ExamCreator</h2>
          <p>Lưu trữ đề thi thời gian thực và cộng tác thiết kế cùng bạn bè!</p>
        </div>

        <div className="auth-tabs">
          <button 
            type="button" 
            className={`auth-tab ${isLoginTab ? 'active' : ''}`}
            onClick={() => { setIsLoginTab(true); setError(''); }}
          >
            Đăng nhập
          </button>
          <button 
            type="button" 
            className={`auth-tab ${!isLoginTab ? 'active' : ''}`}
            onClick={() => { setIsLoginTab(false); setError(''); }}
          >
            Đăng ký
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="auth-error-badge">{error}</div>}

          <div className="auth-form-group">
            <label htmlFor="username">Tên đăng nhập</label>
            <div className="auth-input-wrapper">
              <User size={18} className="auth-input-icon" />
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nhập tên đăng nhập..."
                required
                autoComplete="username"
              />
            </div>
          </div>

          <div className="auth-form-group">
            <label htmlFor="password">Mật khẩu</label>
            <div className="auth-input-wrapper">
              <Lock size={18} className="auth-input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isLoginTab ? 'Nhập mật khẩu...' : 'Đặt mật khẩu tối thiểu 4 ký tự...'}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="auth-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? (
              <span className="btn-loading-content">
                <Loader2 className="animate-spin" size={18} /> 
                {isLoginTab ? ' Đang đăng nhập...' : ' Đang đăng ký...'}
              </span>
            ) : (
              isLoginTab ? 'Đăng nhập ngay' : 'Tạo tài khoản mới'
            )}
          </button>
        </form>

        <div className="auth-footer-tip">
          {isLoginTab ? (
            <p>Chưa có tài khoản đám mây? <span onClick={() => { setIsLoginTab(false); setError(''); }}>Đăng ký ngay</span></p>
          ) : (
            <p>Đã có tài khoản đám mây? <span onClick={() => { setIsLoginTab(true); setError(''); }}>Đăng nhập</span></p>
          )}
        </div>
      </div>
    </div>
  );
}
