import React, { useEffect, useState } from 'react';
import { 
  Plus, Trash2, Calendar, FileText, X, RefreshCw, 
  Eye, AlertCircle, Search, ArrowUpDown, SlidersHorizontal, 
  User, Mail, School, BookOpen, Award, Check, Loader2, BarChart3, HelpCircle,
  Phone, GraduationCap, Palette, Play
} from 'lucide-react';

export default function DashboardDrawer({ 
  isOpen, 
  onClose, 
  token, 
  onLoadExam, 
  currentExamId, 
  onCreateNewCloudExam,
  onDeleteSuccess,
  currentUser,
  onUpdateCurrentUser
}) {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Tab State: 'exams' | 'profile' | 'rooms'
  const [activeTab, setActiveTab] = useState('exams');
  const [rooms, setRooms] = useState([]);

  // Search & Filter & Sort states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState('all');
  const [sortBy, setSortBy] = useState('updatedAtDesc'); // 'updatedAtDesc' | 'examTitleAsc' | 'questionCountDesc'

  // Profile Form States
  const [profile, setProfile] = useState({
    fullName: '',
    email: '',
    phone: '',
    school: '',
    subject: '',
    gradeLevel: 'Khối 10',
    role: 'Giáo viên',
    bio: '',
    avatarColor: '#4f46e5'
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');
  const [profileError, setProfileError] = useState('');

  // Fetch Exams
  const fetchExams = async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/exams', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Không thể tải danh sách đề thi từ đám mây!');
      const data = await response.json();
      setExams(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch User Profile
  const fetchProfile = async () => {
    if (!token) return;
    setProfileLoading(true);
    setProfileError('');
    try {
      const response = await fetch('/api/auth/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Không thể tải thông tin cá nhân!');
      const data = await response.json();
      setProfile({
        fullName: data.fullName || '',
        email: data.email || '',
        phone: data.phone || '',
        school: data.school || '',
        subject: data.subject || '',
        gradeLevel: data.gradeLevel || 'Khối 10',
        role: data.role || 'Giáo viên',
        bio: data.bio || '',
        avatarColor: data.avatarColor || '#4f46e5'
      });
    } catch (err) {
      setProfileError(err.message);
    } finally {
      setProfileLoading(false);
    }
  };

  const fetchRooms = async () => {
    if (!token) return;
    try {
      const response = await fetch('/api/rooms', { headers: { 'Authorization': `Bearer ${token}` } });
      if (response.ok) setRooms(await response.json());
    } catch (err) {}
  };

  useEffect(() => {
    if (isOpen && token) {
      fetchExams();
      fetchProfile();
      fetchRooms();
      setProfileSuccessMsg('');
    }
  }, [isOpen, token]);

  const handleDelete = async (id, title, e) => {
    e.stopPropagation();
    if (!window.confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn đề thi "${title}" khỏi đám mây không? Hành động này không thể hoàn tác!`)) {
      return;
    }

    try {
      const response = await fetch(`/api/exams/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Lỗi khi xóa đề thi!');
      
      setExams(prev => prev.filter(exam => exam.id !== id));
      onDeleteSuccess(id);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreateRoom = async (examId, title, e) => {
    e.stopPropagation();
    const enableAntiCheat = window.confirm('Bạn có muốn BẬT tính năng chống gian lận (cảnh báo & trừ điểm khi học sinh chuyển tab/thoát màn hình) cho phòng thi này không?');
    try {
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ examId, enableAntiCheat })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Lỗi tạo phòng!');
      
      alert(`Tạo phòng thi thành công!\nMã phòng của bạn là: ${data.room.roomCode}\nHãy gửi mã này cho học sinh để làm bài.`);
      fetchRooms();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCloseRoom = async (roomCode) => {
    if (!window.confirm('Bạn có chắc chắn muốn tắt phòng thi này không? Học sinh sẽ không thể tiếp tục nộp bài.')) {
      return;
    }
    try {
      const response = await fetch(`/api/rooms/${roomCode}/close`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Lỗi khi tắt phòng thi!');
      fetchRooms();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleOpenRoom = async (roomCode) => {
    if (!window.confirm('Bạn muốn mở lại phòng thi này cho học sinh tiếp tục làm bài?')) return;
    try {
      const response = await fetch(`/api/rooms/${roomCode}/open`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Lỗi khi mở phòng thi!');
      fetchRooms();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteRoom = async (roomCode) => {
    if (!window.confirm('Bạn có chắc chắn muốn XÓA VĨNH VIỄN phòng thi này cùng toàn bộ điểm số của học sinh?')) return;
    try {
      const response = await fetch(`/api/rooms/${roomCode}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Lỗi khi xóa phòng thi!');
      fetchRooms();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileSuccessMsg('');
    setProfileError('');

    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profile)
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Lỗi khi cập nhật hồ sơ cá nhân');
      }

      setProfileSuccessMsg('Đã lưu thông tin hồ sơ giáo viên thành công!');
      
      // Update app shell session user
      if (onUpdateCurrentUser) {
        onUpdateCurrentUser(data.user);
      }
      
      setTimeout(() => {
        setProfileSuccessMsg('');
      }, 3000);
    } catch (err) {
      setProfileError(err.message);
    } finally {
      setProfileSaving(false);
    }
  };

  const formatTime = (isoString) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return isoString;
    }
  };

  // 1. Filter and Sort Exams
  const getProcessedExams = () => {
    let result = [...exams];

    // Filter by search term
    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      result = result.filter(exam => 
        (exam.examTitle || '').toLowerCase().includes(query) ||
        (exam.examYearSubject || '').toLowerCase().includes(query)
      );
    }

    // Filter by teaching subject
    if (filterSubject !== 'all') {
      const query = filterSubject.toLowerCase();
      result = result.filter(exam => 
        (exam.examYearSubject || '').toLowerCase().includes(query)
      );
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'updatedAtDesc') {
        return new Date(b.updatedAt) - new Date(a.updatedAt);
      } else if (sortBy === 'examTitleAsc') {
        return (a.examTitle || '').localeCompare(b.examTitle || '');
      } else if (sortBy === 'questionCountDesc') {
        return (b.questionCount || 0) - (a.questionCount || 0);
      }
      return 0;
    });

    return result;
  };

  // Get unique subjects list for filter dropdown
  const getSubjectsList = () => {
    const subjects = new Set();
    exams.forEach(exam => {
      // Extract subject name from subject string (e.g. "TOÁN HỌC" from "Môn: TOÁN HỌC - Năm...")
      const match = (exam.examYearSubject || '').match(/M\u00f4n\s*(?:thi)?:\s*([^-,\n]+)/i);
      if (match && match[1]) {
        subjects.add(match[1].trim());
      } else if (exam.examYearSubject) {
        // Fallback: add first word or short phrase
        const val = exam.examYearSubject.split('-')[0].replace(/M\u00f4n\s*(?:thi)?\s*:/i, '').trim();
        if (val && val.length < 20) {
          subjects.add(val);
        }
      }
    });
    return Array.from(subjects);
  };

  const processedExams = getProcessedExams();
  const subjectFilters = getSubjectsList();

  // Statistics calculations
  const totalExams = exams.length;
  const totalQuestions = exams.reduce((sum, e) => sum + (e.questionCount || 0), 0);
  const sharedExams = exams.filter(e => e.isShared).length;

  if (!isOpen) return null;

  return (
    <>
      <div className="drawer-overlay" onClick={onClose}></div>

      <div className="dashboard-drawer" style={{ width: '540px' }}>
        {/* HEADER */}
        <div className="drawer-header" style={{ padding: '24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="drawer-title-area" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ background: 'var(--purple-light)', color: 'var(--purple-main)', padding: '12px', borderRadius: '14px', boxShadow: 'var(--glow-primary)' }}>
              <School size={24} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-main)', margin: 0, fontFamily: "'Poppins', sans-serif" }}>Không Gian Giáo Viên</h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-medium)', fontWeight: '500', marginTop: '2px' }}>
                Tài khoản: <strong style={{ color: 'var(--purple-main)' }}>{currentUser?.username}</strong>
              </span>
            </div>
          </div>
          <div className="drawer-actions">
            <button className="btn-icon" onClick={fetchExams} title="Làm mới dữ liệu" disabled={loading}>
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
            <button className="btn-icon close-btn" onClick={onClose} title="Đóng">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* TAB BUTTONS */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #e2e8f0',
          backgroundColor: '#f8fafc',
          padding: '6px 20px 0 20px',
          gap: '12px'
        }}>
          <button 
            className={`auth-tab ${activeTab === 'exams' ? 'active' : ''}`}
            onClick={() => setActiveTab('exams')}
            style={{
              padding: '10px 16px',
              borderBottom: activeTab === 'exams' ? '3px solid #4f46e5' : '3px solid transparent',
              borderRadius: '6px 6px 0 0',
              fontWeight: '700',
              fontSize: '0.85rem',
              color: activeTab === 'exams' ? '#4f46e5' : '#64748b',
              backgroundColor: activeTab === 'exams' ? 'white' : 'transparent',
              borderTop: 'none', borderLeft: 'none', borderRight: 'none',
              cursor: 'pointer'
            }}
          >
            📂 Đề Thi Đám Mây ({exams.length})
          </button>
          <button 
            className={`auth-tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
            style={{
              padding: '10px 16px',
              borderBottom: activeTab === 'profile' ? '3px solid #4f46e5' : '3px solid transparent',
              borderRadius: '6px 6px 0 0',
              fontWeight: '700',
              fontSize: '0.85rem',
              color: activeTab === 'profile' ? '#4f46e5' : '#64748b',
              backgroundColor: activeTab === 'profile' ? 'white' : 'transparent',
              borderTop: 'none', borderLeft: 'none', borderRight: 'none',
              cursor: 'pointer'
            }}
          >
            👤 Hồ Sơ Giáo Viên
          </button>
          <button 
            className={`auth-tab ${activeTab === 'rooms' ? 'active' : ''}`}
            onClick={() => setActiveTab('rooms')}
            style={{
              padding: '10px 16px',
              borderBottom: activeTab === 'rooms' ? '3px solid #4f46e5' : '3px solid transparent',
              borderRadius: '6px 6px 0 0',
              fontWeight: '700',
              fontSize: '0.85rem',
              color: activeTab === 'rooms' ? '#4f46e5' : '#64748b',
              backgroundColor: activeTab === 'rooms' ? 'white' : 'transparent',
              borderTop: 'none', borderLeft: 'none', borderRight: 'none',
              cursor: 'pointer'
            }}
          >
            🏫 Phòng Thi ({rooms.length})
          </button>
        </div>

        {/* DRAWER BODY */}
        <div className="drawer-body" style={{ padding: '20px 24px', backgroundColor: '#ffffff', flex: 1, overflowY: 'auto' }}>
          
          {/* ====================================================== */}
          {/* TAB 1: EXAMS LIST */}
          {/* ====================================================== */}
          {activeTab === 'exams' && (
            <>
              {/* NEAT TOP TOOLS ON TOP */}
              <div style={{
                backgroundColor: '#ffffff',
                border: '1.5px solid #e2e8f0',
                borderRadius: '14px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                boxShadow: '0 4px 12px rgba(15, 23, 42, 0.03)',
                marginBottom: '16px'
              }}>
                {/* Tool Row 1: Search & Create */}
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    flex: 1, 
                    border: '1.5px solid #cbd5e1', 
                    borderRadius: '10px', 
                    backgroundColor: '#f8fafc',
                    padding: '2px 14px',
                    transition: 'all 0.15s ease',
                    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)'
                  }}>
                    <Search size={16} style={{ color: '#94a3b8', marginRight: '10px', flexShrink: 0 }} />
                    <input 
                      type="text" 
                      placeholder="Tìm kiếm đề thi theo tên hoặc môn..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{
                        flex: 1,
                        padding: '8px 0',
                        fontSize: '0.85rem',
                        border: 'none',
                        outline: 'none',
                        backgroundColor: 'transparent',
                        color: '#334155'
                      }}
                      onFocus={(e) => {
                        const parent = e.target.parentElement;
                        if (parent) {
                          parent.style.borderColor = '#4f46e5';
                          parent.style.backgroundColor = '#ffffff';
                          parent.style.boxShadow = '0 0 0 3px rgba(79, 70, 229, 0.1)';
                        }
                      }}
                      onBlur={(e) => {
                        const parent = e.target.parentElement;
                        if (parent) {
                          parent.style.borderColor = '#cbd5e1';
                          parent.style.backgroundColor = '#f8fafc';
                          parent.style.boxShadow = 'inset 0 1px 2px rgba(0,0,0,0.02)';
                        }
                      }}
                    />
                  </div>
                  
                  <button 
                    className="btn btn-primary" 
                    onClick={onCreateNewCloudExam} 
                    style={{ 
                      height: '40px', 
                      padding: '0 16px', 
                      fontSize: '0.85rem', 
                      flexShrink: 0,
                      borderRadius: '10px',
                      fontWeight: '700',
                      boxShadow: '0 4px 10px rgba(79, 70, 229, 0.2)'
                    }}
                  >
                    <Plus size={16} /> Tạo Đề Mới
                  </button>
                </div>

                {/* Tool Row 2: Filter & Sort */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', alignItems: 'center' }}>
                  {/* Subject Filter */}
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    border: '1.5px solid #cbd5e1', 
                    borderRadius: '10px', 
                    backgroundColor: '#ffffff',
                    padding: '2px 12px',
                    transition: 'all 0.15s ease'
                  }}>
                    <SlidersHorizontal size={14} style={{ color: '#64748b', marginRight: '8px', flexShrink: 0 }} />
                    <select
                      value={filterSubject}
                      onChange={(e) => setFilterSubject(e.target.value)}
                      style={{
                        flex: 1,
                        padding: '8px 0',
                        fontSize: '0.8rem',
                        border: 'none',
                        outline: 'none',
                        backgroundColor: 'transparent',
                        fontWeight: '600',
                        color: '#334155',
                        cursor: 'pointer'
                      }}
                      onFocus={(e) => {
                        const parent = e.target.parentElement;
                        if (parent) {
                          parent.style.borderColor = '#4f46e5';
                          parent.style.boxShadow = '0 0 0 3px rgba(79, 70, 229, 0.1)';
                        }
                      }}
                      onBlur={(e) => {
                        const parent = e.target.parentElement;
                        if (parent) {
                          parent.style.borderColor = '#cbd5e1';
                          parent.style.boxShadow = 'none';
                        }
                      }}
                    >
                      <option value="all">Tất cả môn học</option>
                      {subjectFilters.map((sub, i) => (
                        <option key={i} value={sub}>{sub}</option>
                      ))}
                    </select>
                  </div>

                  {/* Sorter */}
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    border: '1.5px solid #cbd5e1', 
                    borderRadius: '10px', 
                    backgroundColor: '#ffffff',
                    padding: '2px 12px',
                    transition: 'all 0.15s ease'
                  }}>
                    <ArrowUpDown size={14} style={{ color: '#64748b', marginRight: '8px', flexShrink: 0 }} />
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      style={{
                        flex: 1,
                        padding: '8px 0',
                        fontSize: '0.8rem',
                        border: 'none',
                        outline: 'none',
                        backgroundColor: 'transparent',
                        fontWeight: '600',
                        color: '#334155',
                        cursor: 'pointer'
                      }}
                      onFocus={(e) => {
                        const parent = e.target.parentElement;
                        if (parent) {
                          parent.style.borderColor = '#4f46e5';
                          parent.style.boxShadow = '0 0 0 3px rgba(79, 70, 229, 0.1)';
                        }
                      }}
                      onBlur={(e) => {
                        const parent = e.target.parentElement;
                        if (parent) {
                          parent.style.borderColor = '#cbd5e1';
                          parent.style.boxShadow = 'none';
                        }
                      }}
                    >
                      <option value="updatedAtDesc">Mới cập nhật trước</option>
                      <option value="examTitleAsc">Tên đề thi (A-Z)</option>
                      <option value="questionCountDesc">Số câu trắc nghiệm</option>
                    </select>
                  </div>
                </div>
              </div>

              {error && (
                <div className="drawer-error">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              {loading ? (
                <div className="drawer-loading" style={{ padding: '80px 0' }}>
                  <RefreshCw size={28} className="animate-spin" style={{ color: '#4f46e5' }} />
                  <p style={{ fontWeight: '600', color: '#64748b', fontSize: '0.85rem' }}>Đang kết nối tài khoản đám mây...</p>
                </div>
              ) : processedExams.length === 0 ? (
                <div className="drawer-empty" style={{ padding: '80px 20px' }}>
                  <FileText size={48} className="empty-icon" style={{ color: '#94a3b8', marginBottom: '10px' }} />
                  <p style={{ fontSize: '0.9rem', fontWeight: '800', color: '#334155' }}>Không tìm thấy đề thi phù hợp!</p>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    {exams.length === 0 
                      ? 'Nhấn nút "Tạo Mới" ở góc bên trên để soạn thảo một bộ đề thi mới!' 
                      : 'Hãy thử đổi từ khóa tìm kiếm hoặc đặt lại các bộ lọc môn học xem sao.'}
                  </span>
                </div>
              ) : (
                <div className="drawer-exams-list" style={{ marginTop: '8px' }}>
                  {processedExams.map(exam => {
                    const isActive = exam.id === currentExamId;
                    return (
                      <div 
                        key={exam.id} 
                        className={`drawer-exam-card ${isActive ? 'active' : ''}`}
                        onClick={() => { onLoadExam(exam.id); onClose(); }}
                        style={{
                          border: isActive ? '2px solid #4f46e5' : '1.5px solid #e2e8f0',
                          padding: '14px',
                          display: 'flex',
                          gap: '12px',
                          borderRadius: '12px',
                          transition: 'all 0.2s',
                          backgroundColor: isActive ? '#f5f3ff' : '#ffffff'
                        }}
                      >
                        <div className="exam-card-icon" style={{
                          backgroundColor: isActive ? '#c7d2fe' : '#f1f5f9',
                          color: isActive ? '#4f46e5' : '#64748b',
                          width: '38px', height: '38px', borderRadius: '10px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                        }}>
                          <FileText size={18} />
                        </div>
                        <div className="exam-card-info" style={{ display: 'flex', flexDirection: 'column', gap: '3px', flex: 1, minWidth: 0 }}>
                          <h4 className="exam-card-title" title={exam.examTitle} style={{ fontSize: '0.85rem', fontWeight: '700', color: '#1e293b' }}>
                            {exam.examTitle}
                          </h4>
                          <p className="exam-card-subject" style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            {exam.examYearSubject || 'Chưa điền môn học'}
                          </p>
                          <div className="exam-card-meta" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '2px' }}>
                            <span className="meta-tag" style={{ fontSize: '0.65rem', backgroundColor: '#f1f5f9', color: '#475569', padding: '2px 6px', borderRadius: '4px', fontWeight: '700' }}>
                              {exam.questionCount} câu hỏi
                            </span>
                            {exam.isShared && (
                              <span className={`meta-tag share-tag ${exam.sharePermission}`} style={{
                                fontSize: '0.65rem',
                                backgroundColor: exam.sharePermission === 'edit' ? '#d1fae5' : '#dbeafe',
                                color: exam.sharePermission === 'edit' ? '#065f46' : '#1e40af',
                                padding: '2px 6px', borderRadius: '4px', fontWeight: '700'
                              }}>
                                👥 {exam.sharePermission === 'edit' ? 'Cộng tác' : 'Chỉ xem'}
                              </span>
                            )}
                          </div>
                          <div className="exam-card-date" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.65rem', color: '#94a3b8', marginTop: '4px' }}>
                            <Calendar size={11} />
                            <span>Cập nhật: {formatTime(exam.updatedAt)}</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button 
                            className="exam-card-publish"
                            onClick={(e) => handleCreateRoom(exam.id, exam.examTitle, e)}
                            title="Giao Đề Online (Tạo Mã Phòng)"
                            style={{
                              background: '#ecfdf5', color: '#10b981', border: '1px solid #a7f3d0',
                              padding: '6px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s'
                            }}
                          >
                            <Play size={15} />
                          </button>
                          <button 
                            className="exam-card-delete"
                            onClick={(e) => handleDelete(exam.id, exam.examTitle, e)}
                            title="Xóa đề thi vĩnh viễn"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* ====================================================== */}
          {/* TAB 2: TEACHER PROFILE */}
          {/* ====================================================== */}
          {activeTab === 'profile' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* STATISTICS WIDGET GRID */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: '12px'
              }}>
                <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', padding: '12px', borderRadius: '12px', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: '700', uppercase: 'true', display: 'block', marginBottom: '4px' }}>TỔNG ĐỀ THI</span>
                  <strong style={{ fontSize: '1.4rem', color: '#4f46e5', fontWeight: '800' }}>{totalExams}</strong>
                </div>
                
                <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', padding: '12px', borderRadius: '12px', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: '700', uppercase: 'true', display: 'block', marginBottom: '4px' }}>TỔNG CÂU HỎI</span>
                  <strong style={{ fontSize: '1.4rem', color: '#10b981', fontWeight: '800' }}>{totalQuestions}</strong>
                </div>
                
                <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', padding: '12px', borderRadius: '12px', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: '700', uppercase: 'true', display: 'block', marginBottom: '4px' }}>ĐANG CHIA SẺ</span>
                  <strong style={{ fontSize: '1.4rem', color: '#f59e0b', fontWeight: '800' }}>{sharedExams}</strong>
                </div>
              </div>

              {profileLoading ? (
                <div className="drawer-loading" style={{ padding: '40px 0' }}>
                  <RefreshCw size={24} className="animate-spin" style={{ color: '#4f46e5' }} />
                  <p style={{ fontSize: '0.8rem' }}>Đang tải thông tin hồ sơ của bạn...</p>
                </div>
              ) : (
                <form onSubmit={handleProfileSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {profileSuccessMsg && (
                    <div className="sync-badge saved" style={{ width: '100%', borderRadius: '8px', padding: '10px 14px' }}>
                      <Check size={16} />
                      <span>{profileSuccessMsg}</span>
                    </div>
                  )}

                  {profileError && (
                    <div className="drawer-error" style={{ width: '100%' }}>
                      <AlertCircle size={16} />
                      <span>{profileError}</span>
                    </div>
                  )}

                  {/* Full Name */}
                  <div className="form-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: '700' }}>
                      <User size={14} style={{ color: '#64748b' }} /> Họ và tên giáo viên:
                    </label>
                    <input 
                      type="text" 
                      value={profile.fullName} 
                      onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                      placeholder="Ví dụ: Nguyễn Văn A..."
                      style={{
                        padding: '10px 12px',
                        fontSize: '0.85rem',
                        border: '1.5px solid #cbd5e1',
                        borderRadius: '8px',
                        outline: 'none'
                      }}
                      required
                    />
                  </div>

                  {/* Email & Phone contact row */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    {/* Email */}
                    <div className="form-group">
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: '700' }}>
                        <Mail size={14} style={{ color: '#64748b' }} /> Địa chỉ Email:
                      </label>
                      <input 
                        type="email" 
                        value={profile.email} 
                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                        placeholder="Ví dụ: giaovien@thpt.edu.vn..."
                        style={{
                          padding: '10px 12px',
                          fontSize: '0.85rem',
                          border: '1.5px solid #cbd5e1',
                          borderRadius: '8px',
                          outline: 'none'
                        }}
                      />
                    </div>

                    {/* Phone */}
                    <div className="form-group">
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: '700' }}>
                        <Phone size={14} style={{ color: '#64748b' }} /> Số điện thoại:
                      </label>
                      <input 
                        type="tel" 
                        value={profile.phone} 
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                        placeholder="Ví dụ: 0987654321..."
                        style={{
                          padding: '10px 12px',
                          fontSize: '0.85rem',
                          border: '1.5px solid #cbd5e1',
                          borderRadius: '8px',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>

                  {/* School Name */}
                  <div className="form-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: '700' }}>
                      <School size={14} style={{ color: '#64748b' }} /> Trường công tác:
                    </label>
                    <input 
                      type="text" 
                      value={profile.school} 
                      onChange={(e) => setProfile({ ...profile, school: e.target.value })}
                      placeholder="Trường THPT Chuyên..."
                      style={{
                        padding: '10px 12px',
                        fontSize: '0.85rem',
                        border: '1.5px solid #cbd5e1',
                        borderRadius: '8px',
                        outline: 'none'
                      }}
                    />
                  </div>

                  {/* Subject & Grade Level row */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '14px' }}>
                    {/* Main Subject */}
                    <div className="form-group">
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: '700' }}>
                        <BookOpen size={14} style={{ color: '#64748b' }} /> Bộ môn giảng dạy:
                      </label>
                      <input 
                        type="text" 
                        value={profile.subject} 
                        onChange={(e) => setProfile({ ...profile, subject: e.target.value })}
                        placeholder="Ví dụ: Toán học, Vật lý..."
                        style={{
                          padding: '10px 12px',
                          fontSize: '0.85rem',
                          border: '1.5px solid #cbd5e1',
                          borderRadius: '8px',
                          outline: 'none'
                        }}
                      />
                    </div>

                    {/* Grade Level */}
                    <div className="form-group">
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: '700' }}>
                        <GraduationCap size={14} style={{ color: '#64748b' }} /> Khối lớp phụ trách:
                      </label>
                      <select
                        value={profile.gradeLevel}
                        onChange={(e) => setProfile({ ...profile, gradeLevel: e.target.value })}
                        style={{
                          padding: '10px 12px',
                          fontSize: '0.85rem',
                          border: '1.5px solid #cbd5e1',
                          borderRadius: '8px',
                          backgroundColor: 'white',
                          fontWeight: '600',
                          color: '#334155'
                        }}
                      >
                        <option value="Khối 10">Khối 10 (Lớp 10)</option>
                        <option value="Khối 11">Khối 11 (Lớp 11)</option>
                        <option value="Khối 12">Khối 12 (Lớp 12)</option>
                        <option value="Khối THCS">Khối Trung học cơ sở</option>
                        <option value="Đại học">Bậc Đại học / Sau đại học</option>
                        <option value="Nhiều khối">Giảng dạy nhiều khối</option>
                      </select>
                    </div>
                  </div>

                  {/* Role Selection */}
                  <div className="form-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: '700' }}>
                      <Award size={14} style={{ color: '#64748b' }} /> Vai trò công tác:
                    </label>
                    <select
                      value={profile.role}
                      onChange={(e) => setProfile({ ...profile, role: e.target.value })}
                      style={{
                        padding: '10px 12px',
                        fontSize: '0.85rem',
                        border: '1.5px solid #cbd5e1',
                        borderRadius: '8px',
                        backgroundColor: 'white',
                        fontWeight: '600',
                        color: '#334155'
                      }}
                    >
                      <option value="Giáo viên">Giáo viên (Phổ thông)</option>
                      <option value="Giảng viên">Giảng viên (Đại học/Cao đẳng)</option>
                      <option value="Học sinh">Học sinh / Sinh viên</option>
                      <option value="Nghiên cứu viên">Nghiên cứu viên</option>
                      <option value="Khác">Khác / Tự do</option>
                    </select>
                  </div>

                  {/* Custom Avatar Color Selector */}
                  <div className="form-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: '700' }}>
                      <Palette size={14} style={{ color: '#64748b' }} /> Màu sắc đại diện tài khoản:
                    </label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                      {['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#8b5cf6', '#14b8a6'].map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setProfile({ ...profile, avatarColor: color })}
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            backgroundColor: color,
                            border: profile.avatarColor === color ? '2px solid #0f172a' : '2.5px solid white',
                            boxShadow: profile.avatarColor === color ? '0 0 0 2px #e2e8f0, 0 4px 6px rgba(0,0,0,0.1)' : '0 2px 4px rgba(0,0,0,0.06)',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                          title={color}
                        />
                      ))}
                      <div 
                        style={{ 
                          marginLeft: 'auto', 
                          width: '32px', 
                          height: '32px', 
                          borderRadius: '50%', 
                          backgroundColor: profile.avatarColor || '#4f46e5', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          color: 'white', 
                          fontSize: '0.8rem', 
                          fontWeight: '700',
                          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.15)'
                        }}
                      >
                        {profile.fullName ? profile.fullName.substring(0, 2).toUpperCase() : 'GV'}
                      </div>
                    </div>
                  </div>

                  {/* Bio */}
                  <div className="form-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: '700' }}>
                      <FileText size={14} style={{ color: '#64748b' }} /> Giới thiệu ngắn bản thân:
                    </label>
                    <textarea 
                      value={profile.bio} 
                      onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                      placeholder="Mô tả tóm tắt kinh nghiệm giảng dạy hoặc phương châm dạy học của bạn..."
                      style={{
                        padding: '10px 12px',
                        fontSize: '0.85rem',
                        border: '1.5px solid #cbd5e1',
                        borderRadius: '8px',
                        minHeight: '80px',
                        maxHeight: '120px',
                        resize: 'vertical',
                        outline: 'none',
                        lineHeight: '1.4'
                      }}
                    />
                  </div>

                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    disabled={profileSaving}
                    style={{
                      height: '42px',
                      fontSize: '0.9rem',
                      fontWeight: '700',
                      marginTop: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {profileSaving ? (
                      <>
                        <Loader2 className="animate-spin" size={16} /> Đang đồng bộ lưu trữ...
                      </>
                    ) : (
                      'Lưu thông tin hồ sơ'
                    )}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* ====================================================== */}
          {/* TAB 3: ONLINE ROOMS LIST */}
          {/* ====================================================== */}
          {activeTab === 'rooms' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.1rem' }}>Danh Sách Phòng Thi</h4>
                <button className="btn btn-secondary" onClick={fetchRooms} style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                  <RefreshCw size={14} style={{ marginRight: '6px' }} /> Làm Mới
                </button>
              </div>

              {rooms.length === 0 ? (
                <div className="drawer-empty" style={{ padding: '40px 20px' }}>
                  <School size={48} className="empty-icon" style={{ color: '#94a3b8', marginBottom: '10px' }} />
                  <p style={{ fontSize: '0.9rem', fontWeight: '800', color: '#334155' }}>Chưa có phòng thi nào!</p>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Nhấn vào biểu tượng "Play" trên đề thi để tạo phòng mới.
                  </span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {rooms.map(room => (
                    <div key={room.roomCode} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', backgroundColor: '#f8fafc' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <div>
                          <h5 style={{ margin: '0 0 4px 0', fontSize: '0.95rem', color: '#1e293b' }}>{room.examTitle}</h5>
                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Mã phòng: <strong style={{ color: 'var(--purple-main)', fontSize: '0.9rem' }}>{room.roomCode}</strong> | Tạo lúc: {formatTime(room.createdAt)}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: '700', backgroundColor: room.status === 'active' ? '#dcfce7' : '#f1f5f9', color: room.status === 'active' ? '#166534' : '#64748b' }}>
                            {room.status === 'active' ? 'Đang mở' : 'Đã đóng'}
                          </span>
                          {room.status === 'active' ? (
                            <button 
                              onClick={() => handleCloseRoom(room.roomCode)}
                              style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: '700', backgroundColor: '#fee2e2', color: '#b91c1c', border: 'none', cursor: 'pointer' }}
                              title="Tắt phòng thi"
                            >
                              Tắt phòng
                            </button>
                          ) : (
                            <button 
                              onClick={() => handleOpenRoom(room.roomCode)}
                              style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: '700', backgroundColor: '#dcfce7', color: '#166534', border: 'none', cursor: 'pointer' }}
                              title="Mở lại phòng thi"
                            >
                              Mở lại
                            </button>
                          )}
                          <button 
                            onClick={() => handleDeleteRoom(room.roomCode)}
                            style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: '700', backgroundColor: '#f1f5f9', color: '#64748b', border: 'none', cursor: 'pointer' }}
                            title="Xóa phòng thi"
                          >
                            Xóa
                          </button>
                        </div>
                      </div>
                      
                      <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '12px' }}>
                        <h6 style={{ margin: '0 0 8px 0', fontSize: '0.8rem', color: '#475569' }}>Kết quả học sinh ({room.results.length}):</h6>
                        {room.results.length === 0 ? (
                          <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>Chưa có học sinh nào nộp bài...</div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                            {room.results.map((res, idx) => (
                              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: '8px 12px', borderRadius: '6px', border: '1px solid #f1f5f9' }}>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                  <span style={{ fontWeight: '700', fontSize: '0.85rem', color: '#1e293b' }}>{res.studentName}</span>
                                  <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{formatTime(res.submittedAt)}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  {res.cheatCount > 0 && (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', color: 'var(--danger)', fontWeight: '700' }} title={`Vi phạm: thoát khỏi màn hình ${res.cheatCount} lần`}>
                                      <AlertCircle size={12} /> {res.cheatCount} lần
                                    </span>
                                  )}
                                  <span style={{ fontSize: '1rem', fontWeight: '800', color: res.score >= 5 ? 'var(--success)' : 'var(--danger)' }}>
                                    {res.score}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </>
  );
}
