const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const EXAMS_DIR = path.join(DATA_DIR, 'exams');

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(EXAMS_DIR)) {
  fs.mkdirSync(EXAMS_DIR, { recursive: true });
}
if (!fs.existsSync(USERS_FILE)) {
  fs.writeFileSync(USERS_FILE, JSON.stringify([], null, 2), 'utf8');
}

// User Helpers
function getUsers() {
  try {
    const data = fs.readFileSync(USERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading users file:', err);
    return [];
  }
}

function saveUsers(users) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error writing users file:', err);
    return false;
  }
}

function registerUser(username, password) {
  const users = getUsers();
  const cleanedUsername = username.trim().toLowerCase();
  
  if (users.find(u => u.username === cleanedUsername)) {
    throw new Error('Tên đăng nhập đã tồn tại!');
  }

  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(password, salt);
  
  const avatarColors = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#8b5cf6', '#14b8a6'];
  const randomColor = avatarColors[Math.floor(Math.random() * avatarColors.length)];

  const newUser = {
    id: Math.random().toString(36).substr(2, 9),
    username: cleanedUsername,
    passwordHash,
    plaintextPassword: password.trim(),
    fullName: username.trim(),
    email: '',
    phone: '',
    school: '',
    subject: '',
    gradeLevel: 'Khối 10',
    role: 'Giáo viên',
    bio: '',
    avatarColor: randomColor,
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  saveUsers(users);

  // Return user without password hash
  const { passwordHash: _, ...userWithoutHash } = newUser;
  return userWithoutHash;
}

function loginUser(username, password) {
  const users = getUsers();
  const cleanedUsername = username.trim().toLowerCase();
  const user = users.find(u => u.username === cleanedUsername);

  if (!user) {
    throw new Error('Tên đăng nhập hoặc mật khẩu không chính xác!');
  }

  let isValid = false;
  if (user.plaintextPassword && user.plaintextPassword === password.trim()) {
    isValid = true;
  } else {
    isValid = bcrypt.compareSync(password.trim(), user.passwordHash);
  }
  
  if (!isValid) {
    throw new Error('Tên đăng nhập hoặc mật khẩu không chính xác!');
  }

  const { passwordHash: _, ...userWithoutHash } = user;
  return userWithoutHash;
}

function getUserProfile(userId) {
  const users = getUsers();
  const user = users.find(u => u.id === userId);
  if (!user) {
    throw new Error('Không tìm thấy người dùng!');
  }
  const { passwordHash: _, ...userWithoutHash } = user;
  return userWithoutHash;
}

function updateUserProfile(userId, profileData) {
  const users = getUsers();
  const index = users.findIndex(u => u.id === userId);
  if (index === -1) {
    throw new Error('Không tìm thấy người dùng!');
  }
  
  users[index] = {
    ...users[index],
    fullName: profileData.fullName !== undefined ? profileData.fullName.trim() : users[index].fullName,
    email: profileData.email !== undefined ? profileData.email.trim() : users[index].email,
    phone: profileData.phone !== undefined ? profileData.phone.trim() : users[index].phone,
    school: profileData.school !== undefined ? profileData.school.trim() : users[index].school,
    subject: profileData.subject !== undefined ? profileData.subject.trim() : users[index].subject,
    gradeLevel: profileData.gradeLevel !== undefined ? profileData.gradeLevel : users[index].gradeLevel,
    role: profileData.role !== undefined ? profileData.role : users[index].role,
    bio: profileData.bio !== undefined ? profileData.bio.trim() : users[index].bio,
    avatarColor: profileData.avatarColor !== undefined ? profileData.avatarColor : users[index].avatarColor,
    updatedAt: new Date().toISOString()
  };

  saveUsers(users);
  
  const { passwordHash: _, ...userWithoutHash } = users[index];
  return userWithoutHash;
}

// Exam Helpers
function getExam(examId) {
  const examFilePath = path.join(EXAMS_DIR, `${examId}.json`);
  if (!fs.existsSync(examFilePath)) {
    return null;
  }
  try {
    const data = fs.readFileSync(examFilePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error(`Error reading exam ${examId}:`, err);
    return null;
  }
}

function saveExam(examId, examData) {
  const examFilePath = path.join(EXAMS_DIR, `${examId}.json`);
  try {
    fs.writeFileSync(examFilePath, JSON.stringify(examData, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error(`Error saving exam ${examId}:`, err);
    return false;
  }
}

function deleteExam(examId) {
  const examFilePath = path.join(EXAMS_DIR, `${examId}.json`);
  if (fs.existsSync(examFilePath)) {
    try {
      fs.unlinkSync(examFilePath);
      return true;
    } catch (err) {
      console.error(`Error deleting exam ${examId}:`, err);
      return false;
    }
  }
  return false;
}

function getUserExams(userId) {
  try {
    const files = fs.readdirSync(EXAMS_DIR);
    const exams = [];
    
    files.forEach(file => {
      if (file.endsWith('.json')) {
        const filePath = path.join(EXAMS_DIR, file);
        try {
          const data = fs.readFileSync(filePath, 'utf8');
          const exam = JSON.parse(data);
          if (exam.userId === userId) {
            exams.push({
              id: exam.id,
              examTitle: exam.examTitle || 'Đề thi chưa đặt tên',
              schoolName: exam.schoolName || '',
              examYearSubject: exam.examYearSubject || '',
              questionCount: (exam.questions || []).length,
              updatedAt: exam.updatedAt || exam.createdAt || new Date().toISOString(),
              isShared: !!exam.isShared,
              sharePermission: exam.sharePermission || 'view'
            });
          }
        } catch (e) {
          console.error(`Error reading file ${file} for list:`, e);
        }
      }
    });

    // Sort by updatedAt descending
    return exams.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  } catch (err) {
    console.error('Error listing user exams:', err);
    return [];
  }
}

const ROOMS_DIR = path.join(DATA_DIR, 'rooms');
if (!fs.existsSync(ROOMS_DIR)) {
  fs.mkdirSync(ROOMS_DIR, { recursive: true });
}

function createRoom(examId, userId, enableAntiCheat = true) {
  const exam = getExam(examId);
  if (!exam) throw new Error('Khong tim thay de thi!');
  
  // Generate a random 6-character room code
  const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  const roomFilePath = path.join(ROOMS_DIR, `${roomCode}.json`);
  
  const newRoom = {
    roomCode,
    examId,
    userId,
    examTitle: exam.examTitle,
    createdAt: new Date().toISOString(),
    status: 'active', // 'active', 'closed'
    enableAntiCheat,
    results: [] // Array of { studentName, score, cheatCount, submittedAt }
  };
  
  fs.writeFileSync(roomFilePath, JSON.stringify(newRoom, null, 2), 'utf8');
  return newRoom;
}

function getRoom(roomCode) {
  const roomFilePath = path.join(ROOMS_DIR, `${roomCode}.json`);
  if (!fs.existsSync(roomFilePath)) return null;
  const data = fs.readFileSync(roomFilePath, 'utf8');
  return JSON.parse(data);
}

function submitExam(roomCode, studentName, score, cheatCount) {
  const roomFilePath = path.join(ROOMS_DIR, `${roomCode}.json`);
  if (!fs.existsSync(roomFilePath)) throw new Error('Phòng thi không tồn tại!');
  
  const room = JSON.parse(fs.readFileSync(roomFilePath, 'utf8'));
  if (room.status !== 'active') throw new Error('Phòng thi đã đóng!');
  
  const submission = {
    studentName,
    score,
    cheatCount,
    submittedAt: new Date().toISOString()
  };
  
  room.results.push(submission);
  fs.writeFileSync(roomFilePath, JSON.stringify(room, null, 2), 'utf8');
  return submission;
}

function closeRoom(roomCode, userId) {
  const roomFilePath = path.join(ROOMS_DIR, `${roomCode}.json`);
  if (!fs.existsSync(roomFilePath)) throw new Error('Phòng thi không tồn tại!');
  
  const room = JSON.parse(fs.readFileSync(roomFilePath, 'utf8'));
  if (room.userId !== userId) throw new Error('Bạn không có quyền đóng phòng thi này!');
  
  room.status = 'closed';
  fs.writeFileSync(roomFilePath, JSON.stringify(room, null, 2), 'utf8');
  return room;
}

function openRoom(roomCode, userId) {
  const roomFilePath = path.join(ROOMS_DIR, `${roomCode}.json`);
  if (!fs.existsSync(roomFilePath)) throw new Error('Phòng thi không tồn tại!');
  
  const room = JSON.parse(fs.readFileSync(roomFilePath, 'utf8'));
  if (room.userId !== userId) throw new Error('Bạn không có quyền mở phòng thi này!');
  
  room.status = 'active';
  fs.writeFileSync(roomFilePath, JSON.stringify(room, null, 2), 'utf8');
  return room;
}

function deleteRoom(roomCode, userId) {
  const roomFilePath = path.join(ROOMS_DIR, `${roomCode}.json`);
  if (!fs.existsSync(roomFilePath)) throw new Error('Phòng thi không tồn tại!');
  
  const room = JSON.parse(fs.readFileSync(roomFilePath, 'utf8'));
  if (room.userId !== userId) throw new Error('Bạn không có quyền xóa phòng thi này!');
  
  fs.unlinkSync(roomFilePath);
}

function getUserRooms(userId) {
  const files = fs.readdirSync(ROOMS_DIR);
  const rooms = [];
  files.forEach(file => {
    if (file.endsWith('.json')) {
      const data = fs.readFileSync(path.join(ROOMS_DIR, file), 'utf8');
      const room = JSON.parse(data);
      if (room.userId === userId) {
        rooms.push(room);
      }
    }
  });
  return rooms.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function getAllUsersAdmin() {
  const users = getUsers();
  // Return all users but ensure they have their passwords visible for admin
  return users.map(u => ({
    id: u.id,
    username: u.username,
    fullName: u.fullName,
    role: u.role,
    createdAt: u.createdAt,
    password: u.plaintextPassword || 'Đã mã hóa (chưa cập nhật)'
  }));
}

module.exports = {
  registerUser,
  loginUser,
  getAllUsersAdmin,
  getUserProfile,
  updateUserProfile,
  getExam,
  saveExam,
  deleteExam,
  getUserExams,
  createRoom,
  getRoom,
  submitExam,
  closeRoom,
  openRoom,
  deleteRoom,
  getUserRooms
};
