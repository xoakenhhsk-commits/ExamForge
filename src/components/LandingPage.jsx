import React from 'react';
import { ArrowRight, FileText, Share2, Layers, Cloud } from 'lucide-react';
import './LandingPage.css';

export default function LandingPage({ onStart, onStudentPortal }) {
  return (
    <div className="landing-container">
      <nav className="landing-nav">
        <div className="landing-logo">
          <img src="/logo.png" alt="ExamForge Logo" />
          <span>ExamForge</span>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={onStudentPortal}>Học sinh: Vào Thi Online</button>
          <button className="btn btn-primary" onClick={onStart}>Truy cập Ứng dụng <ArrowRight size={16} /></button>
        </div>
      </nav>

      <main className="landing-main">
        <div className="hero-section">
          <div className="hero-badge">✨ Nền tảng Tạo Đề thi Hiện đại nhất</div>
          <h1 className="hero-title">Tạo & Trộn Đề Thi <br/><span className="gradient-text">Siêu Tốc, Thông Minh</span></h1>
          <p className="hero-subtitle">
            ExamForge giúp giáo viên xây dựng, định dạng, trộn và chia sẻ đề thi chuyên nghiệp chỉ trong vài phút. 
            Lưu trữ đám mây an toàn, cộng tác thời gian thực.
          </p>
          <div className="hero-actions">
            <button className="btn btn-primary btn-large" onClick={onStart}>
              Bắt đầu tạo đề thi ngay <ArrowRight size={18} />
            </button>
            <button className="btn btn-secondary btn-large" onClick={onStudentPortal} style={{ padding: '14px 24px' }}>
              Dành cho Học sinh: Nhập Mã Phòng
            </button>
          </div>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon"><FileText size={24} /></div>
            <h3>Giao diện Chuẩn A4</h3>
            <p>Trải nghiệm WYSIWYG thật như đang làm việc trên Microsoft Word với độ nét cao nhất.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon"><Layers size={24} /></div>
            <h3>Trộn Đề Hàng Loạt</h3>
            <p>Tạo ra hàng trăm mã đề khác nhau chỉ với 1 cú click. Tự động sinh mã đề thông minh.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon"><Cloud size={24} /></div>
            <h3>Đồng bộ Đám mây</h3>
            <p>Dữ liệu được tự động lưu ngay khi bạn gõ. Không bao giờ lo mất dữ liệu nữa.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon"><Share2 size={24} /></div>
            <h3>Cộng tác Thời gian thực</h3>
            <p>Gửi link cho đồng nghiệp để cùng soạn đề thi. Cập nhật ngay lập tức theo từng giây.</p>
          </div>
        </div>
      </main>
      
      <footer className="landing-footer">
        <p>&copy; {new Date().getFullYear()} ExamForge. Nền tảng Giáo dục Hiện đại.</p>
      </footer>
    </div>
  );
}
