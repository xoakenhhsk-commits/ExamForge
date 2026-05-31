import React, { useState } from 'react';
import { 
  Plus, Shuffle, Layers, Download, Eye, EyeOff, 
  ZoomIn, ZoomOut, LogIn, LogOut, User, Share2, 
  RefreshCw, Cloud, Check, AlertCircle, FileText, Sparkles, Save, Shield, School
} from 'lucide-react';

export default function Toolbar({ 
  onAddQuestion, 
  onShuffle, 
  onOpenBulkModal,
  onOpenBulkImport,
  onSave, 
  onExport,
  fontFamily,
  setFontFamily,
  showAnswers,
  setShowAnswers,
  zoom,
  setZoom,
  currentUser,
  onOpenAuthModal,
  onLogout,
  onOpenDashboard,
  onOpenShareModal,
  isCloudExam,
  syncStatus,
  isReadOnly
}) {
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const getSyncStatusBadge = () => {
    if (!isCloudExam) return null;
    
    switch (syncStatus) {
      case 'saving':
        return (
          <div className="sync-badge saving" title="Đang lưu...">
            <RefreshCw size={14} className="animate-spin" />
            <span>Đang lưu...</span>
          </div>
        );
      case 'saved':
        return (
          <div className="sync-badge saved" title="Đã lưu">
            <Check size={14} />
            <span>Đã lưu</span>
          </div>
        );
      case 'error':
        return (
          <div className="sync-badge error" title="Lỗi lưu đám mây">
            <AlertCircle size={14} />
            <span>Lỗi đồng bộ</span>
          </div>
        );
      default:
        return (
          <div className="sync-badge idle" title="Đã kết nối">
            <Cloud size={14} />
            <span>Đã kết nối</span>
          </div>
        );
    }
  };

  return (
    <div className="toolbar">
      {/* SECTION 1: Brand & Status (Left) */}
      <div className="toolbar-left-group">
        <div 
          className="toolbar-brand" 
        >
          <div className="ai-logo-glow">
            <img src="/logo.png" alt="AI Logo" />
          </div>
          ExamForge
        </div>

        {isCloudExam && !isReadOnly && currentUser && (
          <button 
            className="btn btn-share" 
            onClick={onOpenShareModal} 
            title="Chia sẻ & Cộng tác"
          >
            <Share2 size={16} />
            <span>Chia sẻ</span>
          </button>
        )}

        {getSyncStatusBadge()}
        {isReadOnly && (
          <div className="read-only-badge" title="Chỉ xem">
            👁️ Chỉ xem
          </div>
        )}
      </div>
      
      {/* SECTION 2: Formatting & AI Tools (Center) */}
      <div className="toolbar-controls">
        <select 
          className="font-selector"
          value={fontFamily}
          onChange={(e) => setFontFamily(e.target.value)}
          disabled={isReadOnly}
        >
          <option value="'Inter', sans-serif">Inter</option>
          <option value="'Poppins', sans-serif">Poppins</option>
          <option value="'Times New Roman', Times, serif">Times New Roman</option>
          <option value="Arial, sans-serif">Arial</option>
        </select>

        <div className="zoom-controls">
          <button className="btn-zoom" onClick={() => setZoom(prev => Math.max(50, prev - 10))}>
            <ZoomOut size={14} />
          </button>
          <span className="zoom-value">{zoom}%</span>
          <button className="btn-zoom" onClick={() => setZoom(prev => Math.min(200, prev + 10))}>
            <ZoomIn size={14} />
          </button>
        </div>

        <button 
          className={`btn btn-ai-glow ${showAnswers ? 'active' : ''}`}
          onClick={() => setShowAnswers(!showAnswers)}
          title="AI Hiển thị/Ẩn đáp án"
        >
          <Sparkles size={16} />
          <span>{showAnswers ? 'Đáp án: Bật' : 'Đáp án: Tắt'}</span>
        </button>
      </div>

      {/* SECTION 3: Document Actions & Profile (Right) */}
      <div className="toolbar-actions">
        {!isReadOnly && (
          <>
            {currentUser && (
              <button className="btn btn-primary" onClick={onOpenDashboard} title="Không gian giáo viên">
                <School size={16} /> <span>Không gian GV</span>
              </button>
            )}
            <button className="btn btn-primary" onClick={onAddQuestion} title="Thêm câu hỏi">
              <Plus size={16} /> <span>Thêm câu hỏi</span>
            </button>
            <button className="btn btn-secondary" onClick={onOpenBulkImport} title="Nhập nhanh">
              <FileText size={16} /> <span>Nhập nhanh</span>
            </button>
            <button className="btn btn-secondary" onClick={onShuffle} title="Trộn đề">
              <Shuffle size={16} /> <span>Trộn đề</span>
            </button>
            <button className="btn btn-secondary" onClick={onOpenBulkModal} title="Trộn đáp án">
              <Layers size={16} /> <span>Trộn đáp án</span>
            </button>
          </>
        )}

        {!isCloudExam && !isReadOnly && (
          <button className="btn btn-secondary" onClick={onSave} title="Lưu vào trình duyệt (Ctrl+S)">
            <Save size={16} /> <span>Lưu</span>
          </button>
        )}

        <button className="btn btn-secondary" onClick={onExport} title="Xuất Word">
          <Download size={16} /> <span>Xuất Word</span>
        </button>

        <div className="toolbar-divider"></div>

        {/* User Account Avatar */}
        {currentUser ? (
          <>
            <div className="user-profile-menu">
              <div className="profile-dropdown-wrapper">
                <button 
                  className="btn-profile-avatar"
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  title={`Tài khoản: ${currentUser.username}`}
                >
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div className="avatar-circle" style={{ backgroundColor: currentUser.avatarColor || '#8b5cf6' }}>
                      {currentUser.username.substring(0, 2).toUpperCase()}
                    </div>
                    <span className="username-text">{currentUser.username}</span>
                  </div>
                </button>

                {showUserDropdown && (
                  <>
                    <div className="dropdown-overlay" onClick={() => setShowUserDropdown(false)}></div>
                    <div className="profile-dropdown-content">
                      <div className="dropdown-user-info">
                        <User size={14} />
                        <span>{currentUser.username}</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            <button 
              className="btn btn-secondary btn-logout" 
              onClick={onLogout}
              title="Đăng xuất"
            >
              <LogOut size={16} /> <span>Đăng xuất</span>
            </button>
          </>
        ) : (
          <button className="btn btn-primary" onClick={onOpenAuthModal}>
            <LogIn size={16} /> <span>Đăng nhập</span>
          </button>
        )}
      </div>
    </div>
  );
}
