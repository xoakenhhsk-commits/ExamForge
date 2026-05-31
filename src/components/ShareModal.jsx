import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Users, ShieldAlert, Share2, Eye, Edit } from 'lucide-react';

export default function ShareModal({ 
  isOpen, 
  onClose, 
  examId, 
  token,
  initialIsShared,
  initialSharePermission,
  onShareSettingsChange
}) {
  const [isShared, setIsShared] = useState(initialIsShared || false);
  const [sharePermission, setSharePermission] = useState(initialSharePermission || 'view');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setIsShared(initialIsShared);
    setSharePermission(initialSharePermission || 'view');
  }, [initialIsShared, initialSharePermission, isOpen]);

  if (!isOpen) return null;

  // Generate public collaboration link using the current window's host/port!
  const shareUrl = `${window.location.origin}/?sharedExamId=${examId}`;

  const handleToggleShare = async () => {
    const nextIsShared = !isShared;
    setIsShared(nextIsShared);
    await updateShareSettings(nextIsShared, sharePermission);
  };

  const handlePermissionChange = async (permission) => {
    setSharePermission(permission);
    await updateShareSettings(isShared, permission);
  };

  const updateShareSettings = async (shared, permission) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/exams/share-settings/${examId}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isShared: shared, sharePermission: permission })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Lỗi khi cập nhật cài đặt chia sẻ!');
      
      onShareSettingsChange(shared, permission);
    } catch (err) {
      alert(err.message);
      // Revert local states
      setIsShared(initialIsShared);
      setSharePermission(initialSharePermission);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content share-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>👥 Chia Sẻ Liên Kết Cộng Tác</h3>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <p className="share-modal-desc">
            Bật tính năng chia sẻ để gửi liên kết cho đồng nghiệp, bạn bè cùng xem hoặc cùng biên soạn đề thi trực tuyến.
          </p>

          <div className="share-toggle-card">
            <div className="share-toggle-info">
              <Share2 size={24} className="share-card-icon" />
              <div>
                <h4>Chia sẻ qua liên kết công khai</h4>
                <p>Bất kỳ ai có liên kết đều có thể truy cập đề thi này</p>
              </div>
            </div>
            <label className="switch">
              <input 
                type="checkbox" 
                checked={isShared} 
                onChange={handleToggleShare}
                disabled={loading}
              />
              <span className="slider round"></span>
            </label>
          </div>

          {isShared && (
            <div className="share-configurations fade-in">
              <div className="form-group">
                <label className="share-config-label">Thiết lập quyền của bạn bè:</label>
                <div className="share-permission-selector">
                  <button 
                    type="button" 
                    className={`permission-btn ${sharePermission === 'view' ? 'active' : ''}`}
                    onClick={() => handlePermissionChange('view')}
                    disabled={loading}
                  >
                    <Eye size={16} />
                    <div className="permission-btn-text">
                      <strong>Chỉ xem đề thi</strong>
                      <span>Bạn bè chỉ xem, không thể gõ chữ hay chỉnh sửa</span>
                    </div>
                  </button>

                  <button 
                    type="button" 
                    className={`permission-btn ${sharePermission === 'edit' ? 'active' : ''}`}
                    onClick={() => handlePermissionChange('edit')}
                    disabled={loading}
                  >
                    <Edit size={16} />
                    <div className="permission-btn-text">
                      <strong>Cho phép chỉnh sửa</strong>
                      <span>Bạn bè được chỉnh sửa, thay đổi tự động lưu thời gian thực</span>
                    </div>
                  </button>
                </div>
              </div>

              <div className="share-url-container">
                <label htmlFor="share-url-input">Đường dẫn chia sẻ cộng tác:</label>
                <div className="share-url-input-group">
                  <input 
                    type="text" 
                    id="share-url-input"
                    value={shareUrl} 
                    readOnly 
                    onClick={handleCopyLink}
                  />
                  <button 
                    className={`btn btn-copy ${copied ? 'copied' : 'btn-primary'}`} 
                    onClick={handleCopyLink}
                    title="Sao chép đường dẫn"
                  >
                    {copied ? <><Check size={16} /> Đã sao chép</> : <><Copy size={16} /> Sao chép</>}
                  </button>
                </div>
              </div>

              {sharePermission === 'edit' && (
                <div className="share-warning-banner">
                  <ShieldAlert size={18} />
                  <span>
                    <strong>Cảnh báo:</strong> Bất cứ ai có liên kết này đều có quyền chỉnh sửa, thêm hoặc xóa câu hỏi trong đề thi của bạn. Hãy chia sẻ cẩn thận!
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Đóng lại
          </button>
        </div>
      </div>
    </div>
  );
}
