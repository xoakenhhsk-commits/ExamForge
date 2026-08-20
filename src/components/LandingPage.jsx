import React from 'react';
import { ArrowRight, FileText, Share2, Layers, Cloud, Sparkles, Smartphone, CheckCircle } from 'lucide-react';
import './LandingPage.css';

export default function LandingPage({ onStart, onStudentPortal }) {
  return (
    <div className="landing-container">
      <nav className="landing-nav">
        <div className="landing-logo">
          <img src="/logo.svg" alt="ExamLab Logo" />
          <span>ExamLab</span>
        </div>
        <div className="landing-nav-actions">
          <button className="btn btn-secondary btn-nav" onClick={onStudentPortal}>
            <span className="nav-text-desktop">Học sinh Thi Online</span>
            <span className="nav-text-mobile">Thi Online</span>
          </button>
          <button className="btn btn-primary btn-nav" onClick={onStart}>
            <span className="nav-text-desktop">Soạn Đề Thi</span>
            <span className="nav-text-mobile">Soạn đề</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </nav>

      <main className="landing-main">
        <div className="hero-section">
          <div className="hero-badge">
            <Sparkles size={16} /> Nền tảng Tạo Đề thi Chuẩn & Thông minh AI
          </div>
          <h1 className="hero-title">
            Tạo & Trộn Đề Thi <br/>
            <span className="gradient-text">Siêu Tốc, Chuẩn A4</span>
          </h1>
          <p className="hero-subtitle">
            ExamLab giúp giáo viên xây dựng, định dạng, trộn và chia sẻ đề thi chuyên nghiệp chỉ trong vài phút. 
            Tương thích hoàn hảo mọi thiết bị, lưu trữ đám mây và thi trực tuyến tức thì.
          </p>
          <div className="hero-actions">
            <button className="btn btn-primary btn-large" onClick={onStart}>
              Bắt đầu tạo đề thi ngay <ArrowRight size={18} />
            </button>
            <button className="btn btn-secondary btn-large btn-student-cta" onClick={onStudentPortal}>
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
            <p>Dữ liệu được tự động lưu ngay khi bạn gõ. Không bao giờ lo mất dữ liệu.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon"><Smartphone size={24} /></div>
            <h3>Tối ưu Di động & Online</h3>
            <p>Làm bài thi mượt mà trên điện thoại, máy tính bảng với tính năng chống gian lận thông minh.</p>
          </div>
        </div>
      </main>
      
      <footer className="landing-footer">
        <p>&copy; {new Date().getFullYear()} ExamLab. Nền tảng Giáo dục & Đề thi Thông minh.</p>
      </footer>
    </div>
  );
}

