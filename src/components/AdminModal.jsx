import React, { useState, useEffect } from 'react';
import { Shield, X, RefreshCw, User, Lock, Clock } from 'lucide-react';

export default function AdminModal({ isOpen, onClose }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/users');
      if (!res.ok) throw new Error('Không thể lấy danh sách tài khoản');
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="auth-modal-overlay" onClick={onClose} style={{ zIndex: 10000 }}>
      <div className="auth-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px', width: '90%' }}>
        <button className="auth-modal-close" onClick={onClose} aria-label="Close">
          <X size={20} />
        </button>

        <div className="auth-header" style={{ marginBottom: '20px' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#ef4444' }}>
            <Shield size={24} /> Admin Database
          </h2>
          <p>Quản lý tài khoản và mật khẩu người dùng hệ thống</p>
        </div>

        {error && <div className="auth-error-badge" style={{ marginBottom: '15px' }}>{error}</div>}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
          <button 
            onClick={fetchUsers} 
            disabled={loading}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '6px', 
              padding: '6px 12px', borderRadius: '6px', 
              border: '1px solid #cbd5e1', background: '#f8fafc', 
              cursor: 'pointer', fontSize: '0.85rem' 
            }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> 
            Làm mới
          </button>
        </div>

        <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '12px', color: '#475569' }}><User size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-2px' }}/> Tên đăng nhập</th>
                <th style={{ padding: '12px', color: '#475569' }}>Họ tên</th>
                <th style={{ padding: '12px', color: '#475569' }}><Lock size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-2px' }}/> Mật khẩu</th>
                <th style={{ padding: '12px', color: '#475569' }}><Clock size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-2px' }}/> Ngày đăng ký</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
                    {loading ? 'Đang tải dữ liệu...' : 'Chưa có tài khoản nào trong hệ thống.'}
                  </td>
                </tr>
              ) : (
                users.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '12px', fontWeight: 'bold', color: '#334155' }}>{u.username}</td>
                    <td style={{ padding: '12px', color: '#475569' }}>{u.fullName || '-'}</td>
                    <td style={{ padding: '12px', fontFamily: 'monospace', color: '#ef4444', fontWeight: 'bold' }}>{u.password}</td>
                    <td style={{ padding: '12px', color: '#64748b', fontSize: '0.8rem' }}>
                      {new Date(u.createdAt).toLocaleDateString('vi-VN')} {new Date(u.createdAt).toLocaleTimeString('vi-VN')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
