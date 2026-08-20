import React, { useState } from 'react';
import { 
  Plus, Shuffle, Layers, Download, Eye, EyeOff, 
  ZoomIn, ZoomOut, LogIn, LogOut, User, Share2, 
  RefreshCw, Cloud, Check, AlertCircle, FileText, Sparkles, Save, Shield, School,
  Menu, X, SlidersHorizontal, Type
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <div className="toolbar-wrapper">
      <div className="toolbar">
        {/* SECTION 1: Brand & Status (Left) */}
        <div className="toolbar-left-group">
          <div className="toolbar-brand" title="ExamLab - AI Smart Exam Workspace">
            <div className="ai-logo-glow">
              <img src="/logo.svg" alt="ExamLab Logo" />
            </div>
            <span className="brand-title-text">ExamLab</span>
          </div>

          {isCloudExam && !isReadOnly && currentUser && (
            <button 
              className="btn btn-share btn-desktop-only" 
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
        
        {/* SECTION 2: Formatting & AI Tools (Center - Desktop) */}
        <div className="toolbar-controls desktop-controls">
          <select 
            className="font-selector"
            value={fontFamily}
            onChange={(e) => setFontFamily(e.target.value)}
            disabled={isReadOnly}
            aria-label="Chọn font chữ"
          >
            <option value="'Inter', sans-serif">Inter</option>
            <option value="'Be Vietnam Pro', sans-serif">Be Vietnam Pro</option>
            <option value="'Times New Roman', Times, serif">Times New Roman</option>
            <option value="Arial, sans-serif">Arial</option>
          </select>

          <div className="zoom-controls">
            <button className="btn-zoom" onClick={() => setZoom(prev => Math.max(50, prev - 10))} title="Thu nhỏ">
              <ZoomOut size={14} />
            </button>
            <span className="zoom-value">{zoom}%</span>
            <button className="btn-zoom" onClick={() => setZoom(prev => Math.min(200, prev + 10))} title="Phóng to">
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

        {/* SECTION 3: Document Actions & Profile (Right - Desktop) */}
        <div className="toolbar-actions desktop-actions">
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

        {/* MOBILE QUICK BAR (Visible on screens < 900px) */}
        <div className="mobile-quick-actions">
          {!isReadOnly && (
            <button 
              className="btn btn-primary btn-mobile-quick" 
              onClick={onAddQuestion} 
              title="Thêm câu hỏi"
            >
              <Plus size={18} />
              <span className="mobile-btn-label">Thêm câu</span>
            </button>
          )}

          <button 
            className={`btn btn-ai-glow btn-mobile-quick ${showAnswers ? 'active' : ''}`}
            onClick={() => setShowAnswers(!showAnswers)}
            title="Bật/Tắt đáp án"
          >
            <Sparkles size={16} />
          </button>

          <button 
            className="btn btn-secondary btn-mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            title="Mở menu công cụ"
            aria-label="Menu công cụ"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* MOBILE ACTION SHEET / SLIDE DOWN PANEL */}
      {mobileMenuOpen && (
        <div className="mobile-sheet-overlay" onClick={closeMobileMenu}>
          <div className="mobile-sheet-content" onClick={e => e.stopPropagation()}>
            <div className="mobile-sheet-header">
              <div className="mobile-sheet-title">
                <SlidersHorizontal size={18} />
                <span>Công cụ & Tùy chọn</span>
              </div>
              <button className="mobile-sheet-close" onClick={closeMobileMenu} aria-label="Đóng menu">
                <X size={18} />
              </button>
            </div>

            <div className="mobile-sheet-body">
              {/* Formatting Group */}
              <div className="mobile-sheet-section">
                <label className="mobile-section-label"><Type size={14} /> Phông chữ & Thu phóng</label>
                <div className="mobile-controls-row">
                  <select 
                    className="font-selector mobile-font-select"
                    value={fontFamily}
                    onChange={(e) => setFontFamily(e.target.value)}
                    disabled={isReadOnly}
                  >
                    <option value="'Inter', sans-serif">Inter</option>
                    <option value="'Be Vietnam Pro', sans-serif">Be Vietnam Pro</option>
                    <option value="'Times New Roman', Times, serif">Times New Roman</option>
                    <option value="Arial, sans-serif">Arial</option>
                  </select>

                  <div className="zoom-controls mobile-zoom">
                    <button className="btn-zoom" onClick={() => setZoom(prev => Math.max(50, prev - 10))}>
                      <ZoomOut size={14} />
                    </button>
                    <span className="zoom-value">{zoom}%</span>
                    <button className="btn-zoom" onClick={() => setZoom(prev => Math.min(200, prev + 10))}>
                      <ZoomIn size={14} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Main Actions Grid */}
              <div className="mobile-sheet-section">
                <label className="mobile-section-label">Hành động Đề thi</label>
                <div className="mobile-actions-grid">
                  {!isReadOnly && (
                    <>
                      {currentUser && (
                        <button className="mobile-action-btn primary" onClick={() => { onOpenDashboard(); closeMobileMenu(); }}>
                          <School size={18} />
                          <span>Không gian GV</span>
                        </button>
                      )}
                      <button className="mobile-action-btn" onClick={() => { onOpenBulkImport(); closeMobileMenu(); }}>
                        <FileText size={18} />
                        <span>Nhập nhanh</span>
                      </button>
                      <button className="mobile-action-btn" onClick={() => { onShuffle(); closeMobileMenu(); }}>
                        <Shuffle size={18} />
                        <span>Trộn đề thi</span>
                      </button>
                      <button className="mobile-action-btn" onClick={() => { onOpenBulkModal(); closeMobileMenu(); }}>
                        <Layers size={18} />
                        <span>Trộn đáp án</span>
                      </button>
                    </>
                  )}

                  {isCloudExam && !isReadOnly && currentUser && (
                    <button className="mobile-action-btn" onClick={() => { onOpenShareModal(); closeMobileMenu(); }}>
                      <Share2 size={18} />
                      <span>Chia sẻ</span>
                    </button>
                  )}

                  {!isCloudExam && !isReadOnly && (
                    <button className="mobile-action-btn" onClick={() => { onSave(); closeMobileMenu(); }}>
                      <Save size={18} />
                      <span>Lưu đề thi</span>
                    </button>
                  )}

                  <button className="mobile-action-btn export" onClick={() => { onExport(); closeMobileMenu(); }}>
                    <Download size={18} />
                    <span>Xuất file Word</span>
                  </button>
                </div>
              </div>

              {/* User Account Section */}
              <div className="mobile-sheet-section mobile-user-section">
                {currentUser ? (
                  <div className="mobile-user-card">
                    <div className="mobile-user-info">
                      <div className="avatar-circle" style={{ backgroundColor: currentUser.avatarColor || '#8b5cf6' }}>
                        {currentUser.username.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <strong>{currentUser.username}</strong>
                        <span className="user-role-tag">{currentUser.role === 'admin' ? 'Quản trị viên' : 'Giáo viên'}</span>
                      </div>
                    </div>
                    <button className="btn btn-secondary btn-logout" onClick={() => { onLogout(); closeMobileMenu(); }}>
                      <LogOut size={16} /> <span>Đăng xuất</span>
                    </button>
                  </div>
                ) : (
                  <button className="btn btn-primary btn-full-width" onClick={() => { onOpenAuthModal(); closeMobileMenu(); }}>
                    <LogIn size={18} /> <span>Đăng nhập / Đăng ký</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

