import React, { useState, useEffect, useCallback, useRef } from 'react';
import './App.css';
import Toolbar from './components/Toolbar';
import QuestionBlock from './components/QuestionBlock';
import AuthModal from './components/AuthModal';
import DashboardDrawer from './components/DashboardDrawer';
import ShareModal from './components/ShareModal';
import BulkImportModal from './components/BulkImportModal';
import LandingPage from './components/LandingPage';
import OnlineExamPortal from './components/OnlineExamPortal';
import { 
  Document, Packer, Paragraph, TextRun, HeadingLevel, 
  Table, TableRow, TableCell, WidthType, BorderStyle 
} from 'docx';
import { saveAs } from 'file-saver';
import { Plus, Shuffle, Layers, Save, Download, Eye, EyeOff, ZoomIn, ZoomOut, FileText } from 'lucide-react';

const generateId = () => Math.random().toString(36).substr(2, 9);
const OPTION_LABELS = ['A', 'B', 'C', 'D'];
const CODE_ICONS = ['🌸', '🌟', '🍀', '🍎', '☀️', '🎈', '⚡', '💎', '🎨', '🚀', '🐬', '🐱', '🌈', '🍒', '🍭', '🍓', '🌲', '🍇'];

const createEmptyQuestion = () => ({
  id: generateId(),
  text: '',
  points: 1,
  options: [
    { id: generateId(), text: '', isCorrect: false },
    { id: generateId(), text: '', isCorrect: false },
    { id: generateId(), text: '', isCorrect: false },
    { id: generateId(), text: '', isCorrect: false }
  ]
});

function App() {
  const [isStarted, setIsStarted] = useState(false);
  const [isStudentPortal, setIsStudentPortal] = useState(false);
  const [examTitle, setExamTitle] = useState('ĐỀ THI TRẮC NGHIỆM MÔN...');
  const [questions, setQuestions] = useState([]);
  const [fontFamily, setFontFamily] = useState("'Times New Roman', Times, serif");
  const [showAnswers, setShowAnswers] = useState(true);
  const [questionHeights, setQuestionHeights] = useState({});

  // Vietnamese High School Header States
  const [schoolDept, setSchoolDept] = useState('SỞ GIÁO DỤC VÀ ĐÀO TẠO HÀ NỘI');
  const [schoolName, setSchoolName] = useState('TRƯỜNG THPT CHUYÊN HÀ NỘI - AMSTERDAM');
  const [examYearSubject, setExamYearSubject] = useState('Môn thi: TOÁN HỌC - Năm học: 2025 - 2026');
  const [examDuration, setExamDuration] = useState('Thời gian làm bài: 90 phút (không kể thời gian giao đề)');

  // Page Zoom State (50% - 200%)
  const [zoom, setZoom] = useState(100);

  // Custom Context Menu State
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0 });

  // Bulk Shuffle States
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkCount, setBulkCount] = useState(4);
  const [codeType, setCodeType] = useState('number'); // 'number' or 'icon'

  // ==========================================
  // CLOUD & COLLABORATION STATES
  // ==========================================
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isCloudExam, setIsCloudExam] = useState(false);
  const [currentExamId, setCurrentExamId] = useState(null);
  const [syncStatus, setSyncStatus] = useState('idle'); // 'idle' | 'saving' | 'saved' | 'error'
  const [isReadOnly, setIsReadOnly] = useState(false);

  // Share configurations
  const [isShared, setIsShared] = useState(false);
  const [sharePermission, setSharePermission] = useState('view');
  const [examOwnerName, setExamOwnerName] = useState('');

  // Modals visibility
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);

  // Refs for focusing & skipping redundant auto-saves
  const activeElementRef = useRef({ id: null, start: 0, end: 0 });
  const isLoadingRef = useRef(false);
  const isPollingUpdateRef = useRef(false);

  // ==========================================
  // INITIAL DATA & AUTH LOADING
  // ==========================================
  useEffect(() => {
    // 1. Load Local Auth session
    const savedToken = localStorage.getItem('examcreator_token');
    const savedUser = localStorage.getItem('examcreator_user');
    let loadedUser = null;

    if (savedToken && savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setToken(savedToken);
      setCurrentUser(parsedUser);
      loadedUser = parsedUser;
    }

    // 2. Check for Shared Exam Link
    const sharedExamId = new URLSearchParams(window.location.search).get('sharedExamId');

    if (sharedExamId) {
      setIsStarted(true); // Auto start if opening a shared link
      isLoadingRef.current = true;
      fetch(`/api/exams/${sharedExamId}`, {
        headers: savedToken ? { 'Authorization': `Bearer ${savedToken}` } : {}
      })
      .then(res => {
        if (!res.ok) throw new Error('Đề thi này không tồn tại hoặc chưa được bật chia sẻ!');
        return res.json();
      })
      .then(data => {
        // Load Shared Exam Details
        setCurrentExamId(sharedExamId);
        setIsCloudExam(true);
        setExamTitle(data.examTitle || 'ĐỀ THI TRẮC NGHIỆM MÔN...');
        setQuestions(data.questions || []);
        setFontFamily(data.fontFamily || "'Times New Roman', Times, serif");
        setSchoolDept(data.schoolDept || 'SỞ GIÁO DỤC VÀ ĐÀO TẠO...');
        setSchoolName(data.schoolName || 'TRƯỜNG THPT...');
        setExamYearSubject(data.examYearSubject || '');
        setExamDuration(data.examDuration || '');
        
        setIsShared(!!data.isShared);
        setSharePermission(data.sharePermission || 'view');
        setExamOwnerName(data.ownerName || '');

        // Determine if Readonly:
        // Readonly if current user is not owner AND shared permission is 'view'
        const userIsOwner = loadedUser && data.userId === loadedUser.id;
        const readOnlyState = !userIsOwner && data.sharePermission === 'view';
        setIsReadOnly(readOnlyState);
      })
      .catch(err => {
        alert(err.message);
        // Clear search query param so user goes back to clean workspace
        window.history.replaceState({}, document.title, window.location.pathname);
        loadDefaultWorkspace(loadedUser, savedToken);
      });
    } else {
      loadDefaultWorkspace(loadedUser, savedToken);
    }
  }, []);

  const loadDefaultWorkspace = (user, jwtToken) => {
    // If logged in, fetch user's last exam
    if (user && jwtToken) {
      isLoadingRef.current = true;
      fetch('/api/exams', {
        headers: { 'Authorization': `Bearer ${jwtToken}` }
      })
      .then(res => res.json())
      .then(exams => {
        if (exams && exams.length > 0) {
          // Load their most recent exam
          loadExamDetails(exams[0].id, jwtToken);
        } else {
          // If no cloud exams, auto-create one so their workspace is synced from start!
          autoCreateFirstCloudExam(jwtToken);
        }
      })
      .catch(err => {
        console.error('Failed to load cloud exams list, fallback to local.', err);
        loadLocalFallback();
      });
    } else {
      // Guest Mode: load from local Storage
      loadLocalFallback();
    }
  };

  const loadLocalFallback = () => {
    const localData = localStorage.getItem('examcreator_guest_exam');
    if (localData) {
      try {
        const data = JSON.parse(localData);
        if (data.questions && data.questions.length > 0) {
          setExamTitle(data.examTitle || 'ĐỀ THI MÔN TOÁN');
          setQuestions(data.questions);
          setFontFamily(data.fontFamily || "'Times New Roman', Times, serif");
          setSchoolDept(data.schoolDept || 'SỞ GIÁO DỤC VÀ ĐÀO TẠO AN GIANG');
          setSchoolName(data.schoolName || 'TRƯỜNG THPT CHI LĂNG');
          setExamYearSubject(data.examYearSubject || 'Môn thi: TOÁN HỌC - Năm học: 2025 - 2026');
          setExamDuration(data.examDuration || 'Thời gian làm bài: 90 phút (không kể thời gian phát đề)');
          setIsCloudExam(false);
          setCurrentExamId(null);
          setIsReadOnly(false);
          return;
        }
      } catch (e) {
        console.error(e);
      }
    }

    // Load real default exam from server so user always has real data working
    fetch('/api/default-exam')
      .then(res => {
        if (!res.ok) throw new Error('No default exam');
        return res.json();
      })
      .then(data => {
        if (data && data.questions && data.questions.length > 0) {
          setExamTitle(data.examTitle || 'ĐỀ THI MÔN TOÁN');
          setQuestions(data.questions);
          setFontFamily(data.fontFamily || "'Times New Roman', Times, serif");
          setSchoolDept(data.schoolDept || 'SỞ GIÁO DỤC VÀ ĐÀO TẠO AN GIANG');
          setSchoolName(data.schoolName || 'TRƯỜNG THPT CHI LĂNG');
          setExamYearSubject(data.examYearSubject || 'Môn thi: TOÁN HỌC - Năm học: 2025 - 2026');
          setExamDuration(data.examDuration || 'Thời gian làm bài: 90 phút (không kể thời gian phát đề)');
        } else {
          setQuestions([createEmptyQuestion()]);
        }
      })
      .catch(() => {
        setQuestions([createEmptyQuestion()]);
      })
      .finally(() => {
        setIsCloudExam(false);
        setCurrentExamId(null);
        setIsReadOnly(false);
      });
  };

  const loadExamDetails = (examId, jwtToken) => {
    isLoadingRef.current = true;
    fetch(`/api/exams/${examId}`, {
      headers: { 'Authorization': `Bearer ${jwtToken}` }
    })
    .then(res => res.json())
    .then(data => {
      setCurrentExamId(data.id);
      setIsCloudExam(true);
      setExamTitle(data.examTitle || 'ĐỀ THI TRẮC NGHIỆM MÔN...');
      setQuestions(data.questions || []);
      setFontFamily(data.fontFamily || "'Times New Roman', Times, serif");
      setSchoolDept(data.schoolDept || 'SỞ GIÁO DỤC VÀ ĐÀO TẠO...');
      setSchoolName(data.schoolName || 'TRƯỜNG THPT...');
      setExamYearSubject(data.examYearSubject || '');
      setExamDuration(data.examDuration || '');
      
      setIsShared(!!data.isShared);
      setSharePermission(data.sharePermission || 'view');
      setExamOwnerName(data.ownerName || '');
      setIsReadOnly(false); // They own this exam, so they have full write access
    })
    .catch(err => {
      console.error('Error loading exam details:', err);
      loadLocalFallback();
    });
  };

  const autoCreateFirstCloudExam = (jwtToken) => {
    isLoadingRef.current = true;
    // Create new exam with whatever is currently in workspace!
    const currentData = {
      examTitle,
      schoolDept,
      schoolName,
      examYearSubject,
      examDuration,
      fontFamily,
      questions: questions.length > 0 ? questions : [createEmptyQuestion()]
    };

    fetch('/api/exams', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwtToken}`
      },
      body: JSON.stringify(currentData)
    })
    .then(res => res.json())
    .then(data => {
      setCurrentExamId(data.id);
      setIsCloudExam(true);
      setQuestions(data.questions);
      setExamOwnerName(data.ownerName);
      setIsReadOnly(false);
    })
    .catch(err => console.error('Failed to auto-create first cloud document.', err));
  };

  // ==========================================
  // DEBOUCED REAL-TIME AUTO-SAVE
  // ==========================================
  useEffect(() => {
    // 1. Stop if in Readonly mode
    if (isReadOnly) return;

    // 2. If Guest Mode: Auto-Save to localStorage
    if (!isCloudExam || !currentExamId) {
      localStorage.setItem('examcreator_guest_exam', JSON.stringify({
        examTitle, questions, fontFamily, schoolDept, schoolName, examYearSubject, examDuration
      }));
      return;
    }

    // 3. Skip save if triggered by page loading
    if (isLoadingRef.current) {
      isLoadingRef.current = false;
      return;
    }

    // 4. Skip save if triggered by collaborative polling update
    if (isPollingUpdateRef.current) {
      isPollingUpdateRef.current = false;
      return;
    }

    // 5. Trigger Auto-Save Debounce timer (1.5 seconds)
    setSyncStatus('saving');
    const timer = setTimeout(() => {
      const syncData = {
        examTitle,
        schoolDept,
        schoolName,
        examYearSubject,
        examDuration,
        fontFamily,
        questions
      };

      fetch(`/api/exams/${currentExamId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify(syncData)
      })
      .then(res => {
        if (!res.ok) throw new Error('Network response not ok');
        return res.json();
      })
      .then(() => {
        setSyncStatus('saved');
      })
      .catch(err => {
        console.error('Real-time sync failed:', err);
        setSyncStatus('error');
      });
    }, 1500);

    return () => clearTimeout(timer);
  }, [examTitle, questions, fontFamily, schoolDept, schoolName, examYearSubject, examDuration, currentExamId, isCloudExam, isReadOnly, token]);

  // ==========================================
  // REAL-TIME COLLABORATIVE POLLING
  // ==========================================
  useEffect(() => {
    if (!isCloudExam || !currentExamId) return;

    const interval = setInterval(() => {
      // If we are actively editing/saving, skip polling to avoid overwriting user draft
      if (syncStatus === 'saving') return;

      fetch(`/api/exams/${currentExamId}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      .then(res => {
        if (res.status === 403) {
          // Sharing settings closed or disabled by owner
          alert('Quyền truy cập đề thi này đã bị chủ sở hữu đóng hoặc thu hồi!');
          window.location.href = window.location.pathname;
          return;
        }
        if (!res.ok) throw new Error('Failed to fetch updates');
        return res.json();
      })
      .then(data => {
        if (!data) return;

        // Check if read-only permission changed dynamically
        const userIsOwner = currentUser && data.userId === currentUser.id;
        const nextReadOnly = !userIsOwner && data.sharePermission === 'view';
        if (isReadOnly !== nextReadOnly) {
          setIsReadOnly(nextReadOnly);
        }

        // Compare server state to local state to see if anything changed
        const localState = {
          examTitle, schoolDept, schoolName, examYearSubject, examDuration, fontFamily, questions
        };
        const serverState = {
          examTitle: data.examTitle || '',
          schoolDept: data.schoolDept || '',
          schoolName: data.schoolName || '',
          examYearSubject: data.examYearSubject || '',
          examDuration: data.examDuration || '',
          fontFamily: data.fontFamily || "'Times New Roman', Times, serif",
          questions: data.questions || []
        };

        if (JSON.stringify(localState) !== JSON.stringify(serverState) && syncStatus !== 'saving') {
          // Flag that the next state change is due to a server sync, so we don't save it back!
          isPollingUpdateRef.current = true;

          setExamTitle(data.examTitle || 'ĐỀ THI TRẮC NGHIỆM MÔN...');
          setQuestions(data.questions || []);
          setFontFamily(data.fontFamily || "'Times New Roman', Times, serif");
          setSchoolDept(data.schoolDept || 'SỞ GIÁO DỤC VÀ ĐÀO TẠO...');
          setSchoolName(data.schoolName || 'TRƯỜNG THPT...');
          setExamYearSubject(data.examYearSubject || '');
          setExamDuration(data.examDuration || '');
          
          setIsShared(!!data.isShared);
          setSharePermission(data.sharePermission || 'view');
          setExamOwnerName(data.ownerName || '');
        }
      })
      .catch(err => {
        console.error('Collaboration poll error:', err);
      });
    }, 3000); // Check every 3 seconds for extremely fast and responsive collaboration updates!

    return () => clearInterval(interval);
  }, [isCloudExam, currentExamId, syncStatus, token, currentUser, isReadOnly, examTitle, schoolDept, schoolName, examYearSubject, examDuration, fontFamily, questions]);

  // ==========================================
  // COLLABORATION CLONING & ACTIONS
  // ==========================================
  const handleCloneToMyAccount = () => {
    if (!currentUser) {
      alert('Vui lòng đăng nhập tài khoản đám mây của riêng bạn trước khi nhân bản đề thi!');
      setIsAuthModalOpen(true);
      return;
    }

    const currentData = {
      examTitle: `${examTitle} (Bản sao)`,
      schoolDept,
      schoolName,
      examYearSubject,
      examDuration,
      fontFamily,
      questions
    };

    fetch('/api/exams', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(currentData)
    })
    .then(res => res.json())
    .then(data => {
      // Load cloned exam
      setCurrentExamId(data.id);
      setIsCloudExam(true);
      setExamTitle(data.examTitle);
      setQuestions(data.questions);
      setExamOwnerName(data.ownerName);
      setIsShared(false);
      setIsReadOnly(false);
      
      // Clear shared link from URL bar
      window.history.replaceState({}, document.title, window.location.pathname);
      alert('Đã nhân bản thành công! Đề thi này hiện thuộc sở hữu đám mây của bạn và sẵn sàng tự động đồng bộ.');
    })
    .catch(err => {
      alert('Không thể nhân bản đề thi. Vui lòng thử lại!');
    });
  };

  // ==========================================
  // AUTHENTICATION SUCCESS & LOGOUT
  // ==========================================
  const handleAuthSuccess = (newToken, newUser) => {
    setToken(newToken);
    setCurrentUser(newUser);

    // Prompt user to sync guest work to their new account!
    if (!isCloudExam && questions.length > 0 && (questions[0].text !== '' || questions.length > 1)) {
      const confirmSync = window.confirm('Bạn có muốn đồng bộ đề thi đang thiết kế dở này lên tài khoản đám mây của mình không?');
      if (confirmSync) {
        isLoadingRef.current = true;
        // Create new exam on backend
        const currentData = {
          examTitle, schoolDept, schoolName, examYearSubject, examDuration, fontFamily, questions
        };
        fetch('/api/exams', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${newToken}`
          },
          body: JSON.stringify(currentData)
        })
        .then(res => res.json())
        .then(data => {
          setCurrentExamId(data.id);
          setIsCloudExam(true);
          setQuestions(data.questions);
          setExamOwnerName(data.ownerName);
          setIsReadOnly(false);
          alert('Đề thi của bạn đã được lưu đám mây thành công!');
        })
        .catch(err => console.error('Failed to sync guest exam.', err));
        return;
      }
    }

    // Otherwise, load their cloud workspace
    loadDefaultWorkspace(newUser, newToken);
  };

  const handleLogout = () => {
    if (window.confirm('Bạn có chắc chắn muốn đăng xuất tài khoản đám mây này không?')) {
      localStorage.removeItem('examcreator_token');
      localStorage.removeItem('examcreator_user');
      setToken(null);
      setCurrentUser(null);
      
      // Reset workspace to guest local fallback
      loadLocalFallback();
    }
  };

  const handleUpdateCurrentUser = (updatedUser) => {
    setCurrentUser(updatedUser);
    localStorage.setItem('examcreator_user', JSON.stringify(updatedUser));
  };

  const handleCreateNewCloudExam = () => {
    isLoadingRef.current = true;
    fetch('/api/exams', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        examTitle: 'ĐỀ THI TRẮC NGHIỆM MÔN...',
        questions: [createEmptyQuestion()]
      })
    })
    .then(res => res.json())
    .then(data => {
      setCurrentExamId(data.id);
      setIsCloudExam(true);
      setExamTitle(data.examTitle);
      setQuestions(data.questions);
      setFontFamily(data.fontFamily);
      setSchoolDept(data.schoolDept);
      setSchoolName(data.schoolName);
      setExamYearSubject(data.examYearSubject);
      setExamDuration(data.examDuration);
      setIsShared(false);
      setExamOwnerName(data.ownerName);
      setIsReadOnly(false);
      alert('Đã tạo một đề thi đám mây mới trống thành công!');
    })
    .catch(err => alert('Lỗi khi tạo đề thi mới trên đám mây!'));
  };

  const handleDeleteExamSuccess = (deletedId) => {
    // If active exam was deleted, reset workspace
    if (currentExamId === deletedId) {
      loadDefaultWorkspace(currentUser, token);
    }
  };

  // ==========================================
  // QUESTION ACTIONS & MULTIPAGE PREVIEW
  // ==========================================
  const handleAddQuestion = useCallback(() => {
    if (isReadOnly) return;
    setQuestions(prev => [...prev, createEmptyQuestion()]);
  }, [isReadOnly]);

  const handleRemoveQuestion = useCallback((id) => {
    if (isReadOnly) return;
    setQuestions(prev => {
      if (prev.length === 1) return prev;
      return prev.filter(q => q.id !== id);
    });
    setQuestionHeights(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, [isReadOnly]);

  const handleUpdateQuestion = useCallback((id, field, value) => {
    if (isReadOnly) return;
    setQuestions(prev => prev.map(q => 
      q.id === id ? { ...q, [field]: value } : q
    ));
  }, [isReadOnly]);

  const handleImportQuestions = useCallback((parsedQuestions) => {
    if (isReadOnly) return;
    if (parsedQuestions && parsedQuestions.length > 0) {
      setQuestions(prev => {
        // If there's only 1 question and it's empty, we overwrite it. Otherwise, we append.
        if (prev.length === 1 && prev[0].text === '' && prev[0].options.every(o => o.text === '')) {
          return parsedQuestions;
        }
        return [...prev, ...parsedQuestions];
      });
      alert(`Đã nhập thành công ${parsedQuestions.length} câu hỏi vào đề thi!`);
    }
  }, [isReadOnly]);

  const shuffleArray = (array) => {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
  };

  const handleShuffle = useCallback(() => {
    if (isReadOnly) return;
    if (!window.confirm('Bạn có chắc chắn muốn trộn câu hỏi và đáp án không?')) return;
    
    setQuestions(prev => {
      const shuffledQuestions = shuffleArray(prev).map(q => ({
        ...q,
        options: shuffleArray(q.options)
      }));
      return shuffledQuestions;
    });
  }, [isReadOnly]);

  const handleSave = useCallback(() => {
    // Fallback saving for guest mode
    if (!isCloudExam) {
      const data = { 
        examTitle, 
        questions, 
        fontFamily,
        schoolDept,
        schoolName,
        examYearSubject,
        examDuration
      };
      fetch('/api/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      .then(res => res.json())
      .then(resData => alert(resData.message))
      .catch(err => alert('Lỗi khi lưu đề thi vào Backend'));
    }
  }, [examTitle, questions, fontFamily, schoolDept, schoolName, examYearSubject, examDuration, isCloudExam]);

  // Context Menu
  const handleContextMenu = useCallback((e) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY
    });
  }, []);

  useEffect(() => {
    const handleWindowClick = () => {
      setContextMenu(prev => {
        if (prev.visible) return { ...prev, visible: false };
        return prev;
      });
    };
    window.addEventListener('click', handleWindowClick);
    return () => window.removeEventListener('click', handleWindowClick);
  }, []);

  // Restoring focus range
  useEffect(() => {
    if (activeElementRef.current.id) {
      const el = document.getElementById(activeElementRef.current.id);
      if (el && document.activeElement !== el) {
        el.focus();
        try {
          el.setSelectionRange(activeElementRef.current.start, activeElementRef.current.end);
        } catch (err) {
          // Safe catch
        }
      }
    }
  });

  // Track height adjustments
  const handleHeightChange = useCallback((id, height) => {
    setQuestionHeights(prev => {
      if (prev[id] === height) return prev;
      return { ...prev, [id]: height };
    });
  }, []);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isReadOnly) return;
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleAddQuestion();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 's' && !e.shiftKey) {
        e.preventDefault();
        if (isCloudExam) {
          alert('Đề thi này đã được tự động lưu lên đám mây của bạn liên tục!');
        } else {
          handleSave();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        handleShuffle();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleAddQuestion, handleSave, handleShuffle, isCloudExam, isReadOnly]);

  // Pagination calculation logic
  const PAGE_LIMIT = 983; 
  const HEADER_ESTIMATE = 190; 

  const getPages = useCallback(() => {
    const pages = [];
    let currentPage = [];
    let currentHeight = 0;

    questions.forEach((q) => {
      const qHeight = questionHeights[q.id] || 160;
      const limit = pages.length === 0 ? (PAGE_LIMIT - HEADER_ESTIMATE) : PAGE_LIMIT;
      const gap = currentPage.length > 0 ? 24 : 0;

      if (currentHeight + qHeight + gap > limit && currentPage.length > 0) {
        pages.push(currentPage);
        currentPage = [q];
        currentHeight = qHeight;
      } else {
        currentPage.push(q);
        currentHeight += qHeight + gap;
      }
    });

    if (currentPage.length > 0) {
      pages.push(currentPage);
    }

    return pages.length > 0 ? pages : [[]];
  }, [questions, questionHeights]);

  // Export headers helpers
  const createDocxHeader = useCallback((docFont, code) => {
    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 60, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  children: [new TextRun({ text: schoolDept.toUpperCase(), bold: true, font: docFont, size: 20 })],
                  alignment: "center"
                }),
                new Paragraph({
                  children: [new TextRun({ text: schoolName.toUpperCase(), bold: true, font: docFont, size: 20 })],
                  alignment: "center"
                }),
                new Paragraph({
                  children: [new TextRun({ text: "------------------", font: docFont, size: 16 })],
                  alignment: "center"
                }),
                new Paragraph({
                  children: [new TextRun({ text: examTitle.toUpperCase(), bold: true, font: docFont, size: 22 })],
                  alignment: "center"
                }),
                new Paragraph({
                  children: [new TextRun({ text: `${examYearSubject}`, italic: true, font: docFont, size: 18 })],
                  alignment: "center"
                }),
                new Paragraph({
                  children: [new TextRun({ text: `${examDuration}`, italic: true, font: docFont, size: 18 })],
                  alignment: "center"
                })
              ],
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE }
              }
            }),
            new TableCell({
              width: { size: 40, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  children: [new TextRun({ text: `MÃ ĐỀ THI: ${code}`, bold: true, font: docFont, size: 22, color: "4F46E5" })],
                  alignment: "center"
                }),
                new Paragraph({ text: "" }),
                new Paragraph({
                  children: [new TextRun({ text: "Họ và tên: ....................................", font: docFont, size: 20 })]
                }),
                new Paragraph({
                  children: [new TextRun({ text: "Lớp: ..............................................", font: docFont, size: 20 })]
                }),
                new Paragraph({ text: "" }),
                new Table({
                  width: { size: 100, type: WidthType.PERCENTAGE },
                  rows: [
                    new TableRow({
                      children: [
                        new TableCell({
                          children: [new Paragraph({ children: [new TextRun({ text: "Điểm số", bold: true, font: docFont, size: 16 })], alignment: "center" })],
                          width: { size: 50, type: WidthType.PERCENTAGE }
                        }),
                        new TableCell({
                          children: [new Paragraph({ children: [new TextRun({ text: "Chữ ký GT", bold: true, font: docFont, size: 16 })], alignment: "center" })],
                          width: { size: 50, type: WidthType.PERCENTAGE }
                        })
                      ]
                    }),
                    new TableRow({
                      children: [
                        new TableCell({
                          children: [new Paragraph({ text: "" })],
                          height: 500
                        }),
                        new TableCell({
                          children: [new Paragraph({ text: "" })],
                          height: 500
                        })
                      ]
                    })
                  ]
                })
              ],
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE }
              }
            })
          ]
        })
      ]
    });
  }, [schoolDept, schoolName, examTitle, examYearSubject, examDuration]);

  const handleExport = useCallback(() => {
    let docFont = "Times New Roman";
    if (fontFamily.includes("Arial")) docFont = "Arial";
    if (fontFamily.includes("Playfair Display")) docFont = "Playfair Display";
    if (fontFamily.includes("Inter")) docFont = "Inter";

    const headerTable = createDocxHeader(docFont, "101");
    const docChildren = [
      headerTable,
      new Paragraph({ text: "", spacing: { after: 200 } })
    ];

    questions.forEach((q, index) => {
      docChildren.push(new Paragraph({
        children: [
          new TextRun({ text: `Câu ${index + 1} (${q.points !== undefined ? q.points : 1} điểm): `, bold: true, font: docFont }),
          new TextRun({ text: q.text, font: docFont })
        ],
        spacing: { before: 200, after: 100 }
      }));

      q.options.forEach((opt, optIndex) => {
        const isOptCorrect = showAnswers && opt.isCorrect;
        docChildren.push(new Paragraph({
          children: [
            new TextRun({ 
              text: `${OPTION_LABELS[optIndex]}. `, 
              bold: true,
              color: isOptCorrect ? "00b050" : "000000",
              font: docFont
            }),
            new TextRun({ 
              text: opt.text, 
              color: isOptCorrect ? "00b050" : "000000",
              bold: isOptCorrect,
              font: docFont
            })
          ],
          indent: { left: 720 }
        }));
      });
    });

    const doc = new Document({
      sections: [{
        properties: {},
        children: docChildren,
      }]
    });

    Packer.toBlob(doc).then(blob => {
      saveAs(blob, `${examTitle}.docx`);
    });
  }, [examTitle, questions, fontFamily, showAnswers, createDocxHeader]);

  const handleBulkShuffleAndExport = useCallback(() => {
    if (questions.length === 0) {
      alert("Vui lòng thêm ít nhất 1 câu hỏi để trộn đề!");
      return;
    }

    if (!window.confirm(`Bạn chuẩn bị trộn hàng loạt và xuất ${bulkCount} mã đề thi. Trình duyệt sẽ tự động tải về ${bulkCount} tệp đề thi kèm theo 1 tệp đáp án tổng hợp. Bạn có muốn tiếp tục?`)) {
      return;
    }

    let docFont = "Times New Roman";
    if (fontFamily.includes("Arial")) docFont = "Arial";
    if (fontFamily.includes("Playfair Display")) docFont = "Playfair Display";
    if (fontFamily.includes("Inter")) docFont = "Inter";

    const codes = [];
    for (let i = 0; i < bulkCount; i++) {
      if (codeType === 'number') {
        codes.push((101 + i).toString());
      } else {
        codes.push(CODE_ICONS[i % CODE_ICONS.length]);
      }
    }

    const bulkAnswers = {};

    codes.forEach((code) => {
      bulkAnswers[code] = {};
      const shuffledQList = shuffleArray(questions);

      const finalQList = shuffledQList.map((q, qIndex) => {
        const shuffledOpts = shuffleArray(q.options);
        const correctOptIndex = shuffledOpts.findIndex(opt => opt.isCorrect);
        const correctLetter = OPTION_LABELS[correctOptIndex] || 'A';
        
        bulkAnswers[code][qIndex + 1] = correctLetter;

        return {
          ...q,
          options: shuffledOpts
        };
      });

      const headerTable = createDocxHeader(docFont, code);
      const docChildren = [
        headerTable,
        new Paragraph({ text: "", spacing: { after: 200 } })
      ];

      finalQList.forEach((q, index) => {
        docChildren.push(new Paragraph({
          children: [
            new TextRun({ text: `Câu ${index + 1} (${q.points !== undefined ? q.points : 1} điểm): `, bold: true, font: docFont }),
            new TextRun({ text: q.text, font: docFont })
          ],
          spacing: { before: 180, after: 100 }
        }));

        q.options.forEach((opt, optIndex) => {
          docChildren.push(new Paragraph({
            children: [
              new TextRun({ 
                text: `${OPTION_LABELS[optIndex]}. `, 
                bold: true,
                font: docFont
              }),
              new TextRun({ 
                text: opt.text, 
                font: docFont
              })
            ],
            indent: { left: 720 }
          }));
        });
      });

      const doc = new Document({
        sections: [{
          properties: {},
          children: docChildren,
        }]
      });

      Packer.toBlob(doc).then(blob => {
        saveAs(blob, `${examTitle}_MA_DE_${code}.docx`);
      });
    });

    const answerDocChildren = [
      new Paragraph({
        alignment: "center",
        children: [
          new TextRun({ 
            text: `BẢNG ĐÁP ÁN CÁC MÃ ĐỀ THI`, 
            bold: true, 
            font: docFont,
            size: 32, 
            color: "0F172A"
          }),
        ],
        spacing: { after: 100 }
      }),
      new Paragraph({
        alignment: "center",
        children: [
          new TextRun({ 
            text: `Đề thi: ${examTitle}`, 
            italic: true, 
            font: docFont,
            size: 22, 
            color: "64748B"
          }),
        ],
        spacing: { after: 400 }
      }),
    ];

    const headerCells = [
      new TableCell({
        children: [new Paragraph({ 
          children: [new TextRun({ text: "Câu hỏi", bold: true, font: docFont })],
          alignment: "center"
        })],
        width: { size: 1500, type: WidthType.DXA }
      })
    ];
    codes.forEach(code => {
      headerCells.push(
        new TableCell({
          children: [new Paragraph({ 
            children: [new TextRun({ text: `Mã đề ${code}`, bold: true, font: docFont })],
            alignment: "center"
          })],
          width: { size: 1500, type: WidthType.DXA }
        })
      );
    });

    const tableRows = [
      new TableRow({ children: headerCells })
    ];

    for (let qNum = 1; qNum <= questions.length; qNum++) {
      const cells = [
        new TableCell({
          children: [new Paragraph({ 
            children: [new TextRun({ text: `Câu ${qNum}`, font: docFont })],
            alignment: "center"
          })],
          width: { size: 1500, type: WidthType.DXA }
        })
      ];

      codes.forEach(code => {
        const ans = bulkAnswers[code][qNum] || '-';
        cells.push(
          new TableCell({
            children: [new Paragraph({ 
              children: [new TextRun({ text: ans, bold: true, font: docFont, color: "16A34A" })],
              alignment: "center"
            })],
            width: { size: 1500, type: WidthType.DXA }
          })
        );
      });

      tableRows.push(
        new TableRow({ children: cells })
      );
    }

    const answerTable = new Table({
      rows: tableRows
    });

    answerDocChildren.push(answerTable);

    const answerDoc = new Document({
      sections: [{
        properties: {},
        children: answerDocChildren,
      }]
    });

    Packer.toBlob(answerDoc).then(blob => {
      saveAs(blob, `${examTitle}_BANG_DAP_AN_CHUNG.docx`);
    });

    setIsBulkModalOpen(false);
  }, [questions, bulkCount, codeType, examTitle, fontFamily, createDocxHeader]);

  const pages = getPages();

  if (!isStarted) {
    if (isStudentPortal) {
      return <OnlineExamPortal onBack={() => setIsStudentPortal(false)} />;
    }
    return (
      <LandingPage 
        onStart={() => setIsStarted(true)} 
        onStudentPortal={() => setIsStudentPortal(true)}
      />
    );
  }

  return (
    <div className="app-container">
      {/* Collaboration Status Banner */}
      {isCloudExam && currentUser?.username !== examOwnerName && (
        <div className={`collaboration-status-banner ${isReadOnly ? 'readonly' : ''}`}>
          <span>
            {isReadOnly 
              ? `👁️ Bạn đang xem đề thi của ${examOwnerName || 'chủ sở hữu'} (Chế độ Chỉ xem)` 
              : `👥 Bạn đang cùng cộng tác thiết kế đề thi của ${examOwnerName || 'chủ sở hữu'}`}
          </span>
          <button className="collaboration-status-banner-btn" onClick={handleCloneToMyAccount}>
            Tạo bản sao đám mây của tôi
          </button>
        </div>
      )}

      <div className="toolbar-wrapper">
        <Toolbar 
          onAddQuestion={handleAddQuestion} 
          onShuffle={handleShuffle} 
          onOpenBulkModal={() => setIsBulkModalOpen(true)}
          onOpenBulkImport={() => setIsBulkImportOpen(true)}
          onSave={handleSave} 
          onExport={handleExport}
          fontFamily={fontFamily}
          setFontFamily={setFontFamily}
          showAnswers={showAnswers}
          setShowAnswers={setShowAnswers}
          zoom={zoom}
          setZoom={setZoom}
          
          currentUser={currentUser}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          onLogout={handleLogout}
          onOpenDashboard={() => setIsDashboardOpen(true)}
          onOpenShareModal={() => setIsShareModalOpen(true)}
          isCloudExam={isCloudExam}
          syncStatus={syncStatus}
          isReadOnly={isReadOnly}
        />
      </div>

      <div className="workspace" onContextMenu={handleContextMenu}>
        {pages.map((pageQuestions, pageIndex) => (
          <div 
            key={pageIndex} 
            className="document-page-wrapper"
            style={{ 
              width: `${794 * (zoom / 100)}px`, 
              height: `${1123 * (zoom / 100)}px`
            }}
          >
            <div 
              className="document-page" 
              style={{ 
                fontFamily,
                transform: `scale(${zoom / 100})`,
                transformOrigin: 'top center',
                margin: 0
              }}
            >
              {pageIndex === 0 && (
                <div className="exam-school-header">
                  <div className="header-left">
                    <input 
                      type="text"
                      id="header-dept-input"
                      value={schoolDept}
                      onChange={(e) => !isReadOnly && setSchoolDept(e.target.value)}
                      placeholder="SỞ GIÁO DỤC VÀ ĐÀO TẠO..."
                      className="header-inline-input dept-input"
                      style={{ fontFamily }}
                      disabled={isReadOnly}
                    />
                    <input 
                      type="text"
                      id="header-school-input"
                      value={schoolName}
                      onChange={(e) => !isReadOnly && setSchoolName(e.target.value)}
                      placeholder="TRƯỜNG THPT..."
                      className="header-inline-input school-input"
                      style={{ fontFamily }}
                      disabled={isReadOnly}
                    />
                    <div className="header-divider-line"></div>
                    <input 
                      type="text"
                      id="header-title-input"
                      value={examTitle}
                      onChange={(e) => !isReadOnly && setExamTitle(e.target.value)}
                      placeholder="ĐỀ THI HỌC KỲ..."
                      className="header-inline-input exam-title-input"
                      style={{ fontFamily }}
                      disabled={isReadOnly}
                    />
                    <div className="sub-info-row">
                      <input 
                        type="text"
                        id="header-subject-input"
                        value={examYearSubject}
                        onChange={(e) => !isReadOnly && setExamYearSubject(e.target.value)}
                        placeholder="Môn thi: TOÁN - Năm học: 2025 - 2026"
                        className="header-inline-input sub-input"
                        style={{ fontFamily }}
                        disabled={isReadOnly}
                      />
                      <input 
                        type="text"
                        id="header-duration-input"
                        value={examDuration}
                        onChange={(e) => !isReadOnly && setExamDuration(e.target.value)}
                        placeholder="Thời gian làm bài: 90 phút"
                        className="header-inline-input sub-input"
                        style={{ fontFamily }}
                        disabled={isReadOnly}
                      />
                    </div>
                  </div>

                  <div className="header-right">
                    <div className="exam-code-box">
                      MÃ ĐỀ: {codeType === 'number' ? '101' : CODE_ICONS[0]}
                    </div>
                    <div className="student-info-lines">
                      <div className="student-line">Họ và tên: ............................................</div>
                      <div className="student-line">Lớp: ....................................................</div>
                    </div>
                    <table className="grade-box-table">
                      <thead>
                        <tr>
                          <th>Điểm số</th>
                          <th>Chữ ký GT</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td></td>
                          <td></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="question-list">
                {pageQuestions.map((q) => {
                  const globalIndex = questions.findIndex(item => item.id === q.id) + 1;
                  return (
                    <QuestionBlock 
                      key={q.id} 
                      question={q} 
                      number={globalIndex}
                      updateQuestion={handleUpdateQuestion}
                      removeQuestion={handleRemoveQuestion}
                      showAnswers={showAnswers}
                      onHeightChange={handleHeightChange}
                      isReadOnly={isReadOnly}
                    />
                  );
                })}
                
                {pageQuestions.length === 0 && pageIndex === 0 && (
                  <div className="empty-state">
                    Chưa có câu hỏi nào. Hãy nhấn "Thêm câu hỏi" để bắt đầu!
                  </div>
                )}
              </div>

              <div className="page-footer">
                Trang {pageIndex + 1} / {pages.length}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Floating Custom Context Menu */}
      {contextMenu.visible && (
        <div 
          className="context-menu"
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
          onClick={(e) => e.stopPropagation()}
        >
          {!isReadOnly && (
            <>
              <div className="context-menu-item" onClick={() => { handleAddQuestion(); setContextMenu({ visible: false, x: 0, y: 0 }); }}>
                <span className="context-menu-item-icon"><Plus size={16} /></span>
                Thêm câu hỏi mới
              </div>
              <div className="context-menu-item" onClick={() => { handleShuffle(); setContextMenu({ visible: false, x: 0, y: 0 }); }}>
                <span className="context-menu-item-icon"><Shuffle size={16} /></span>
                Xáo trộn đề thi
              </div>
              <div className="context-menu-item" onClick={() => { setIsBulkModalOpen(true); setContextMenu({ visible: false, x: 0, y: 0 }); }}>
                <span className="context-menu-item-icon"><Layers size={16} /></span>
                Trộn đề hàng loạt
              </div>
              <div className="context-menu-divider"></div>
              <div className="context-menu-item" onClick={() => { 
                if (questions.length > 0) {
                  const pts = Number((10 / questions.length).toFixed(2));
                  setQuestions(prev => prev.map(q => ({...q, points: pts})));
                }
                setContextMenu({ visible: false, x: 0, y: 0 }); 
              }}>
                <span className="context-menu-item-icon">⭐</span>
                Chia đều điểm (Thang 10)
              </div>
              <div className="context-menu-divider"></div>
            </>
          )}
          <div className="context-menu-item" onClick={() => { setShowAnswers(prev => !prev); setContextMenu({ visible: false, x: 0, y: 0 }); }}>
            <span className="context-menu-item-icon">{showAnswers ? <EyeOff size={16} /> : <Eye size={16} />}</span>
            {showAnswers ? "Ẩn đáp án đúng" : "Hiện đáp án đúng"}
          </div>
          <div className="context-menu-divider"></div>
          <div className="context-menu-item" onClick={() => { setZoom(prev => Math.min(200, prev + 10)); setContextMenu({ visible: false, x: 0, y: 0 }); }}>
            <span className="context-menu-item-icon"><ZoomIn size={16} /></span>
            Phóng to (+10%)
          </div>
          <div className="context-menu-item" onClick={() => { setZoom(prev => Math.max(50, prev - 10)); setContextMenu({ visible: false, x: 0, y: 0 }); }}>
            <span className="context-menu-item-icon"><ZoomOut size={16} /></span>
            Thu nhỏ (-10%)
          </div>
          {!isReadOnly && (
            <>
              <div className="context-menu-divider"></div>
              {!isCloudExam && (
                <div className="context-menu-item" onClick={() => { handleSave(); setContextMenu({ visible: false, x: 0, y: 0 }); }}>
                  <span className="context-menu-item-icon"><Save size={16} /></span>
                  Lưu vào hệ thống
                </div>
              )}
            </>
          )}
          <div className="context-menu-item" onClick={() => { handleExport(); setContextMenu({ visible: false, x: 0, y: 0 }); }}>
            <span className="context-menu-item-icon"><Download size={16} /></span>
            Tải file Word (.docx)
          </div>
        </div>
      )}

      {/* Bulk Shuffle Config Modal */}
      {isBulkModalOpen && (
        <div className="modal-overlay" onClick={() => setIsBulkModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🎨 Trộn Đề Thi Hàng Loạt</h3>
              <button className="modal-close-btn" onClick={() => setIsBulkModalOpen(false)}>
                &times;
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label>Số lượng mã đề cần tạo (2 - 20):</label>
                <div className="form-input-range">
                  <input 
                    type="range" 
                    min="2" 
                    max="20" 
                    value={bulkCount} 
                    onChange={(e) => setBulkCount(parseInt(e.target.value))}
                  />
                  <span className="range-value">{bulkCount}</span>
                </div>
              </div>
              
              <div className="form-group">
                <label>Kiểu hiển thị mã đề:</label>
                <div className="code-type-cards">
                  <div 
                    className={`code-card ${codeType === 'number' ? 'active' : ''}`}
                    onClick={() => setCodeType('number')}
                  >
                    <span className="code-card-icon">🔢</span>
                    <span className="code-card-title">Mã đề bằng Số</span>
                    <span className="code-card-desc">Sử dụng số thứ tự: 101, 102, 103...</span>
                  </div>
                  
                  <div 
                    className={`code-card ${codeType === 'icon' ? 'active' : ''}`}
                    onClick={() => setCodeType('icon')}
                  >
                    <span className="code-card-icon">🌸</span>
                    <span className="code-card-title">Mã đề bằng Icon</span>
                    <span className="code-card-desc">Sử dụng ký hiệu: 🌸, 🌟, 🍀...</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setIsBulkModalOpen(false)}>
                Hủy bỏ
              </button>
              <button className="btn btn-primary" onClick={handleBulkShuffleAndExport}>
                Bắt đầu trộn & Tải về
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cloud Authentication Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Bulk Import Modal */}
      <BulkImportModal 
        isOpen={isBulkImportOpen} 
        onClose={() => setIsBulkImportOpen(false)} 
        onImport={handleImportQuestions}
      />

      {/* Cloud Exams Dashboard Drawer */}
      <DashboardDrawer 
        isOpen={isDashboardOpen} 
        onClose={() => setIsDashboardOpen(false)}
        token={token}
        onLoadExam={(examId) => loadExamDetails(examId, token)}
        currentExamId={currentExamId}
        onCreateNewCloudExam={handleCreateNewCloudExam}
        onDeleteSuccess={handleDeleteExamSuccess}
        currentUser={currentUser}
        onUpdateCurrentUser={handleUpdateCurrentUser}
        onLogout={handleLogout}
      />

      {/* Collaboration Share Modal */}
      {currentExamId && (
        <ShareModal 
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          examId={currentExamId}
          token={token}
          initialIsShared={isShared}
          initialSharePermission={sharePermission}
          onShareSettingsChange={(shared, perm) => {
            setIsShared(shared);
            setSharePermission(perm);
          }}
        />
      )}
    </div>
  );
}

export default App;
