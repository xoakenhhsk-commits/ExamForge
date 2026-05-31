const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const db = require('./db');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from public directory if needed, but we just serve admin.html directly
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// Root path confirmation route
app.get('/', (req, res) => {
  res.json({
    status: 'running',
    message: 'Backend Express Server for ExamCreator is active.',
    timestamp: new Date().toISOString()
  });
});

const JWT_SECRET = 'examcreator-secret-jwt-key-2026';

// Middleware for JWT Authentication
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    req.user = null;
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      req.user = null;
      return next();
    }
    req.user = user;
    next();
  });
}

// Helper to enforce authentication
function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: 'Bạn cần đăng nhập để thực hiện thao tác này!' });
  }
  next();
}

// AUTH API ENDPOINTS
app.post('/api/auth/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password || username.trim().length < 3 || password.length < 4) {
    return res.status(400).json({ message: 'Tên đăng nhập (tối thiểu 3 ký tự) và mật khẩu (tối thiểu 4 ký tự) không hợp lệ!' });
  }

  try {
    const user = db.registerUser(username, password);
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({
      message: 'Đăng ký tài khoản thành công!',
      token,
      user
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ tên đăng nhập và mật khẩu!' });
  }

  try {
    const user = db.loginUser(username, password);
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      message: 'Đăng nhập thành công!',
      token,
      user
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.get('/api/auth/me', authenticateToken, requireAuth, (req, res) => {
  res.json({ user: req.user });
});

// GET profile endpoint
app.get('/api/auth/profile', authenticateToken, requireAuth, (req, res) => {
  try {
    const profile = db.getUserProfile(req.user.id);
    res.json(profile);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT profile endpoint
app.put('/api/auth/profile', authenticateToken, requireAuth, (req, res) => {
  try {
    const updatedProfile = db.updateUserProfile(req.user.id, req.body);
    res.json({ message: 'Cập nhật hồ sơ cá nhân thành công!', user: updatedProfile });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Admin API
const DEV_PASSWORD = '123'; // Simple password for developer

app.get('/api/admin/users', (req, res) => {
  try {
    const { pw } = req.query;
    if (pw !== DEV_PASSWORD) {
      return res.status(401).json({ message: 'Mật khẩu developer không chính xác!' });
    }
    const users = db.getAllUsersAdmin();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// EXAMS API ENDPOINTS

// 1. List exams of logged in user
app.get('/api/exams', authenticateToken, requireAuth, (req, res) => {
  const exams = db.getUserExams(req.user.id);
  res.json(exams);
});

// 2. Get specific exam details (public sharing check included)
app.get('/api/exams/:id', authenticateToken, (req, res) => {
  const examId = req.params.id;
  const exam = db.getExam(examId);

  if (!exam) {
    return res.status(404).json({ message: 'Không tìm thấy đề thi!' });
  }

  // Check if owner
  if (req.user && exam.userId === req.user.id) {
    return res.json(exam);
  }

  // If not owner, check if exam is shared
  if (exam.isShared) {
    // Return exam without sensitive owner data if any, or just return full data
    return res.json({
      ...exam,
      isReadOnly: exam.sharePermission === 'view' // Tell client if they can only view
    });
  }

  return res.status(403).json({ message: 'Đề thi này ở chế độ riêng tư hoặc chưa được bật chia sẻ!' });
});

// 3. Create a new empty exam
app.post('/api/exams', authenticateToken, requireAuth, (req, res) => {
  const examId = Math.random().toString(36).substr(2, 9);
  
  const newExam = {
    id: examId,
    userId: req.user.id,
    ownerName: req.user.username,
    examTitle: req.body.examTitle || 'ĐỀ THI TRẮC NGHIỆM MÔN...',
    schoolDept: req.body.schoolDept || 'SỞ GIÁO DỤC VÀ ĐÀO TẠO...',
    schoolName: req.body.schoolName || 'TRƯỜNG THPT...',
    examYearSubject: req.body.examYearSubject || 'Môn thi: TOÁN HỌC - Năm học: 2025 - 2026',
    examDuration: req.body.examDuration || 'Thời gian làm bài: 90 phút (không kể thời gian giao đề)',
    fontFamily: req.body.fontFamily || "'Times New Roman', Times, serif",
    questions: req.body.questions || [{
      id: Math.random().toString(36).substr(2, 9),
      text: '',
      points: 1,
      options: [
        { id: Math.random().toString(36).substr(2, 9), text: '', isCorrect: false },
        { id: Math.random().toString(36).substr(2, 9), text: '', isCorrect: false },
        { id: Math.random().toString(36).substr(2, 9), text: '', isCorrect: false },
        { id: Math.random().toString(36).substr(2, 9), text: '', isCorrect: false }
      ]
    }],
    isShared: false,
    sharePermission: 'view',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.saveExam(examId, newExam);
  res.status(201).json(newExam);
});

// 4. Update / Save an exam (supports real-time autosave + collaborator checks)
app.put('/api/exams/:id', authenticateToken, (req, res) => {
  const examId = req.params.id;
  const exam = db.getExam(examId);

  if (!exam) {
    return res.status(404).json({ message: 'Không tìm thấy đề thi để lưu!' });
  }

  // Permission Check
  let canWrite = false;

  // Case A: Current user is the owner
  if (req.user && exam.userId === req.user.id) {
    canWrite = true;
  }
  // Case B: Shared public collaboration is enabled with 'edit' permission
  else if (exam.isShared && exam.sharePermission === 'edit') {
    canWrite = true;
  }

  if (!canWrite) {
    return res.status(403).json({ message: 'Bạn không có quyền chỉnh sửa đề thi này!' });
  }

  // Perform Update
  const updatedData = {
    ...exam,
    examTitle: req.body.examTitle !== undefined ? req.body.examTitle : exam.examTitle,
    schoolDept: req.body.schoolDept !== undefined ? req.body.schoolDept : exam.schoolDept,
    schoolName: req.body.schoolName !== undefined ? req.body.schoolName : exam.schoolName,
    examYearSubject: req.body.examYearSubject !== undefined ? req.body.examYearSubject : exam.examYearSubject,
    examDuration: req.body.examDuration !== undefined ? req.body.examDuration : exam.examDuration,
    fontFamily: req.body.fontFamily !== undefined ? req.body.fontFamily : exam.fontFamily,
    questions: req.body.questions !== undefined ? req.body.questions : exam.questions,
    updatedAt: new Date().toISOString()
  };

  db.saveExam(examId, updatedData);
  res.json({ message: 'Đã lưu đề thi thành công', exam: updatedData });
});

// 5. Update Share Settings of an exam
app.post('/api/exams/share-settings/:id', authenticateToken, requireAuth, (req, res) => {
  const examId = req.params.id;
  const exam = db.getExam(examId);

  if (!exam) {
    return res.status(404).json({ message: 'Không tìm thấy đề thi!' });
  }

  // Enforce owner check
  if (exam.userId !== req.user.id) {
    return res.status(403).json({ message: 'Bạn không có quyền thay đổi cài đặt chia sẻ của đề thi này!' });
  }

  const { isShared, sharePermission } = req.body;
  
  exam.isShared = isShared !== undefined ? !!isShared : exam.isShared;
  exam.sharePermission = sharePermission || exam.sharePermission;
  exam.updatedAt = new Date().toISOString();

  db.saveExam(examId, exam);
  res.json({ message: 'Cập nhật cài đặt chia sẻ thành công', exam });
});

// 6. Delete an exam
app.delete('/api/exams/:id', authenticateToken, requireAuth, (req, res) => {
  const examId = req.params.id;
  const exam = db.getExam(examId);

  if (!exam) {
    return res.status(404).json({ message: 'Không tìm thấy đề thi!' });
  }

  // Enforce owner check
  if (exam.userId !== req.user.id) {
    return res.status(403).json({ message: 'Bạn không có quyền xóa đề thi này!' });
  }

  db.deleteExam(examId);
  res.json({ message: 'Xóa đề thi thành công!' });
});

// =====================================
// ROOMS / ONLINE EXAM API ENDPOINTS
// =====================================

// Create a room from an exam
app.post('/api/rooms', authenticateToken, requireAuth, (req, res) => {
  const { examId, enableAntiCheat } = req.body;
  try {
    const room = db.createRoom(examId, req.user.id, enableAntiCheat);
    res.status(201).json({ message: 'Tạo phòng thi thành công!', room });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get user rooms
app.get('/api/rooms', authenticateToken, requireAuth, (req, res) => {
  try {
    const rooms = db.getUserRooms(req.user.id);
    res.json(rooms);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Student gets room details
app.get('/api/rooms/:code', (req, res) => {
  try {
    const roomCode = req.params.code.toUpperCase();
    const room = db.getRoom(roomCode);
    if (!room) return res.status(404).json({ message: 'Phòng thi không tồn tại!' });
    if (room.status !== 'active') return res.status(403).json({ message: 'Phòng thi đã đóng!' });
    
    // Fetch exam but strip out the correct answers for the student!
    const exam = db.getExam(room.examId);
    if (!exam) return res.status(404).json({ message: 'Không tìm thấy đề thi gốc!' });
    
    const studentExam = {
      examTitle: exam.examTitle,
      schoolDept: exam.schoolDept,
      schoolName: exam.schoolName,
      examYearSubject: exam.examYearSubject,
      examDuration: exam.examDuration,
      fontFamily: exam.fontFamily,
      questions: exam.questions.map(q => ({
        id: q.id,
        text: q.text,
        points: q.points !== undefined ? q.points : 1,
        options: q.options.map(opt => ({ id: opt.id, text: opt.text })) // No isCorrect
      }))
    };
    
    res.json({ roomCode, exam: studentExam, enableAntiCheat: room.enableAntiCheat !== false });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Student submits exam
app.put('/api/rooms/:code/close', authenticateToken, requireAuth, (req, res) => {
  try {
    const roomCode = req.params.code.toUpperCase();
    db.closeRoom(roomCode, req.user.id);
    res.json({ message: 'Phòng thi đã được đóng thành công!' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.put('/api/rooms/:code/open', authenticateToken, requireAuth, (req, res) => {
  try {
    const roomCode = req.params.code.toUpperCase();
    db.openRoom(roomCode, req.user.id);
    res.json({ message: 'Phòng thi đã được mở lại thành công!' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.delete('/api/rooms/:code', authenticateToken, requireAuth, (req, res) => {
  try {
    const roomCode = req.params.code.toUpperCase();
    db.deleteRoom(roomCode, req.user.id);
    res.json({ message: 'Xóa phòng thi thành công!' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.post('/api/rooms/:code/submit', (req, res) => {
  try {
    const roomCode = req.params.code.toUpperCase();
    const { studentName, answers, cheatCount } = req.body; // answers: { [questionId]: optionId }
    
    const room = db.getRoom(roomCode);
    if (!room) return res.status(404).json({ message: 'Phòng thi không tồn tại!' });
    
    const exam = db.getExam(room.examId);
    if (!exam) return res.status(404).json({ message: 'Không tìm thấy đề thi gốc!' });
    
    let correctCount = 0;
    let rawScore = 0;
    let maxScore = 0;
    const incorrectAnswers = [];
    
    exam.questions.forEach(q => {
      const qPoints = q.points !== undefined ? Number(q.points) : 1;
      maxScore += qPoints;
      
      const selectedOptionId = answers[q.id];
      const correctOption = q.options.find(opt => opt.isCorrect);
      if (correctOption && selectedOptionId === correctOption.id) {
        correctCount++;
        rawScore += qPoints;
      } else {
        incorrectAnswers.push({
          questionId: q.id,
          questionText: q.text,
          selectedOptionId,
          correctOptionId: correctOption ? correctOption.id : null,
          correctOptionText: correctOption ? correctOption.text : 'Chưa có đáp án'
        });
      }
    });
    
    if (maxScore === 0) maxScore = 10;
    
    // Penalty for cheating (Deduct 10% per cheat instance up to 50%)
    const penalty = Math.min(cheatCount * 0.1, 0.5);
    const finalScore = Math.max(0, rawScore * (1 - penalty)).toFixed(2);
    
    const submission = db.submitExam(roomCode, studentName, finalScore, cheatCount);
    res.json({ 
      message: 'Nộp bài thành công!', 
      score: finalScore, 
      maxScore,
      correctCount, 
      total: exam.questions.length,
      cheatPenaltyApplied: cheatCount > 0,
      cheatCount,
      incorrectAnswers
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend Express server is running on http://localhost:${PORT}`);
});

