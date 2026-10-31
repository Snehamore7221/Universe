import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Eye,
  Shield,
  FileCheck,
  UserCheck,
  Scale,
  Play,
  Pause,
  RotateCcw,
  Upload,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  X,
  Sliders,
  Clock,
  Layers,
  Sparkles,
  ExternalLink,
  Edit2,
  PlusCircle,
  MousePointerClick,
  Activity,
  User,
  Check
} from 'lucide-react';
import { MODULES } from '../data/seed';

// ===========================================================================
// Baseline 2x2 Seating Grid Matching CCTV Surveillance Benchmark Footage
// (Stored in native 1920x1080 resolution coordinates)
// ===========================================================================

const DEFAULT_MANUAL_STUDENTS = [
  {
    id: 's_001',
    studentName: 'Sneha (S1)',
    row: 2,
    bench: 2,
    seat: 2,
    seatId: 'R2-B2-S2',
    benchId: 'B02',
    nativeW: 1920,
    nativeH: 1080,
    roi: { x: 1060, y: 560, width: 440, height: 380 },
    pctX: (1060 / 1920) * 100,
    pctY: (560 / 1080) * 100,
    pctW: (440 / 1920) * 100,
    pctH: (380 / 1080) * 100
  },
  {
    id: 's_002',
    studentName: 'Rahul (S2)',
    row: 2,
    bench: 1,
    seat: 1,
    seatId: 'R2-B1-S1',
    benchId: 'B01',
    nativeW: 1920,
    nativeH: 1080,
    roi: { x: 180, y: 560, width: 440, height: 380 },
    pctX: (180 / 1920) * 100,
    pctY: (560 / 1080) * 100,
    pctW: (440 / 1920) * 100,
    pctH: (380 / 1080) * 100
  },
  {
    id: 's_003',
    studentName: 'Aarav (S3)',
    row: 1,
    bench: 2,
    seat: 2,
    seatId: 'R1-B2-S2',
    benchId: 'B02',
    nativeW: 1920,
    nativeH: 1080,
    roi: { x: 1060, y: 120, width: 440, height: 380 },
    pctX: (1060 / 1920) * 100,
    pctY: (120 / 1080) * 100,
    pctW: (440 / 1920) * 100,
    pctH: (380 / 1080) * 100
  },
  {
    id: 's_004',
    studentName: 'Priya (S4)',
    row: 1,
    bench: 1,
    seat: 1,
    seatId: 'R1-B1-S1',
    benchId: 'B01',
    nativeW: 1920,
    nativeH: 1080,
    roi: { x: 180, y: 120, width: 440, height: 380 },
    pctX: (180 / 1920) * 100,
    pctY: (120 / 1080) * 100,
    pctW: (440 / 1920) * 100,
    pctH: (380 / 1080) * 100
  }
];

const DEFAULT_CV_THRESHOLDS = {
  minMovementArea: 350,
  outsideRatioThreshold: 0.25,
  minPersistenceFrames: 3,
  cooldownSeconds: 4
};

// ===========================================================================
// Coordinate Transformation & Letterbox Helpers
// ===========================================================================

function getVideoRenderInfo(videoElement, containerElement) {
  if (!containerElement) {
    return {
      videoWidth: 1920,
      videoHeight: 1080,
      renderedWidth: 800,
      renderedHeight: 450,
      offsetX: 0,
      offsetY: 0,
      scaleFactorX: 2.4,
      scaleFactorY: 2.4
    };
  }

  const containerRect = containerElement.getBoundingClientRect();
  const containerWidth = containerRect.width || 800;
  const containerHeight = containerRect.height || 450;

  const videoWidth = videoElement && videoElement.videoWidth ? videoElement.videoWidth : 1920;
  const videoHeight = videoElement && videoElement.videoHeight ? videoElement.videoHeight : 1080;

  const containerAspect = containerWidth / containerHeight;
  const videoAspect = videoWidth / videoHeight;

  let renderedWidth = containerWidth;
  let renderedHeight = containerHeight;
  let offsetX = 0;
  let offsetY = 0;

  if (videoAspect > containerAspect) {
    // Letterbox: black bars top and bottom
    renderedWidth = containerWidth;
    renderedHeight = containerWidth / videoAspect;
    offsetY = (containerHeight - renderedHeight) / 2;
  } else {
    // Pillarbox: black bars left and right
    renderedHeight = containerHeight;
    renderedWidth = containerHeight * videoAspect;
    offsetX = (containerWidth - renderedWidth) / 2;
  }

  return {
    videoWidth,
    videoHeight,
    renderedWidth,
    renderedHeight,
    offsetX,
    offsetY,
    scaleFactorX: videoWidth / renderedWidth,
    scaleFactorY: videoHeight / renderedHeight
  };
}

function clientToRenderedCoords(clientX, clientY, containerElement, renderInfo) {
  if (!containerElement || !renderInfo) return { rx: 0, ry: 0 };
  const rect = containerElement.getBoundingClientRect();
  const mouseX = clientX - rect.left - renderInfo.offsetX;
  const mouseY = clientY - rect.top - renderInfo.offsetY;
  const rx = Math.max(0, Math.min(renderInfo.renderedWidth, mouseX));
  const ry = Math.max(0, Math.min(renderInfo.renderedHeight, mouseY));
  return { rx, ry };
}

function renderedRectToNativeROI(dragStart, dragCurrent, renderInfo) {
  const minX = Math.min(dragStart.rx, dragCurrent.rx);
  const minY = Math.min(dragStart.ry, dragCurrent.ry);
  const width = Math.abs(dragCurrent.rx - dragStart.rx);
  const height = Math.abs(dragCurrent.ry - dragStart.ry);

  const nativeX = Math.round(minX * renderInfo.scaleFactorX);
  const nativeY = Math.round(minY * renderInfo.scaleFactorY);
  const nativeW = Math.round(width * renderInfo.scaleFactorX);
  const nativeH = Math.round(height * renderInfo.scaleFactorY);

  const pctX = (nativeX / renderInfo.videoWidth) * 100;
  const pctY = (nativeY / renderInfo.videoHeight) * 100;
  const pctW = (nativeW / renderInfo.videoWidth) * 100;
  const pctH = (nativeH / renderInfo.videoHeight) * 100;

  return {
    x: nativeX,
    y: nativeY,
    width: nativeW,
    height: nativeH,
    nativeW: renderInfo.videoWidth,
    nativeH: renderInfo.videoHeight,
    pctX,
    pctY,
    pctW,
    pctH
  };
}

function formatSeconds(secs) {
  const s = Math.max(0, Math.floor(secs || 0));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${String(m).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
}

export default function ExamMonitoring() {
  const moduleData = MODULES.find((m) => m.id === 'exam-monitoring');

  // 1. Backend Connectivity Status
  const [backendStatus, setBackendStatus] = useState('checking'); // 'online' | 'offline' | 'checking'
  const [serverVideos, setServerVideos] = useState([]);
  const [selectedVideoFilename, setSelectedVideoFilename] = useState('examination_cctv_footage.mp4');

  // 2. Video Player & Playback State
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const fileInputRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [localVideoUrl, setLocalVideoUrl] = useState(null);

  // 3. Rendered Geometry for Aspect-Ratio Alignment
  const [renderInfo, setRenderInfo] = useState({
    videoWidth: 1920,
    videoHeight: 1080,
    renderedWidth: 800,
    renderedHeight: 450,
    offsetX: 0,
    offsetY: 0,
    scaleFactorX: 2.4,
    scaleFactorY: 2.4
  });

  const updateGeometry = useCallback(() => {
    if (containerRef.current) {
      const info = getVideoRenderInfo(videoRef.current, containerRef.current);
      setRenderInfo(info);
      if (videoRef.current?.duration && !isNaN(videoRef.current.duration)) {
        setDuration(videoRef.current.duration);
      }
    }
  }, []);

  useEffect(() => {
    updateGeometry();
    const handleResize = () => updateGeometry();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateGeometry, localVideoUrl, selectedVideoFilename]);

  // 4. Manual ROI Drawing State
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [dragStart, setDragStart] = useState({ rx: 0, ry: 0 });
  const [dragCurrent, setDragCurrent] = useState({ rx: 0, ry: 0 });
  const [pendingDrawnROI, setPendingDrawnROI] = useState(null); // Newly drawn box awaiting modal save
  const [editingStudent, setEditingStudent] = useState(null);   // Existing student being edited
  const [showROIOverlay, setShowROIOverlay] = useState(true);
  const [selectedStudentId, setSelectedStudentId] = useState(null);

  // 5. Configured Students State
  const [students, setStudents] = useState(() => {
    try {
      const saved = localStorage.getItem('universe_exam_students');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_MANUAL_STUDENTS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('universe_exam_students', JSON.stringify(students));
    } catch {}
  }, [students]);

  // 6. Computer Vision Engine & Incidents
  const [thresholds, setThresholds] = useState(DEFAULT_CV_THRESHOLDS);
  const [showConfigDrawer, setShowConfigDrawer] = useState(false);
  const [cvJobState, setCvJobState] = useState('idle'); // 'idle' | 'processing' | 'completed' | 'failed'
  const [cvProgress, setCvProgress] = useState(null);
  const [currentVideoId, setCurrentVideoId] = useState(null);
  const pollIntervalRef = useRef(null);

  const [incidents, setIncidents] = useState(() => {
    try {
      const saved = localStorage.getItem('universe_exam_incidents');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  const [inspectedIncident, setInspectedIncident] = useState(null);
  const [toast, setToast] = useState(null);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const showToast = useCallback((type, message) => {
    setToast({ type, message });
  }, []);

  // Check Backend Health & Fetch Available Videos
  const checkBackendHealth = useCallback(async () => {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        setBackendStatus('online');
        const vidRes = await fetch('/api/videos', {
          headers: { Authorization: 'Bearer demo_faculty_token_dev' }
        });
        if (vidRes.ok) {
          const data = await vidRes.json();
          if (data.success && Array.isArray(data.videos)) {
            setServerVideos(data.videos);
            if (data.videos.length > 0 && !data.videos.some((v) => v.filename === selectedVideoFilename)) {
              setSelectedVideoFilename(data.videos[0].filename);
            }
          }
        }
      } else {
        setBackendStatus('offline');
      }
    } catch {
      setBackendStatus('offline');
    }
  }, [selectedVideoFilename]);

  useEffect(() => {
    checkBackendHealth();
  }, [checkBackendHealth]);

  // Video Streaming Source
  const videoSrc = useMemo(() => {
    if (localVideoUrl) return localVideoUrl;
    if (selectedVideoFilename) return `/api/videos/stream/${encodeURIComponent(selectedVideoFilename)}`;
    return null;
  }, [localVideoUrl, selectedVideoFilename]);

  // Video playback controls
  const handleTogglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(() => {});
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    updateGeometry();
    if (videoRef.current) {
      setDuration(videoRef.current.duration || 0);
    }
  };

  const handleSeek = (seconds) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, Math.min(seconds, duration || 3600));
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  // Video File Upload handler
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    setLocalVideoUrl(objectUrl);
    setSelectedVideoFilename(file.name);
    setIsPlaying(false);
    showToast('success', `Selected video: ${file.name}`);

    if (backendStatus === 'online') {
      const formData = new FormData();
      formData.append('cctvVideo', file);
      try {
        const res = await fetch('/api/videos/upload', {
          method: 'POST',
          headers: { Authorization: 'Bearer demo_faculty_token_dev' },
          body: formData
        });
        const data = await res.json();
        if (data.success && data.video) {
          setSelectedVideoFilename(data.video.filename);
          showToast('success', `Video stored in local surveillance buffer (${data.video.sizeFormatted})`);
          checkBackendHealth();
        }
      } catch (err) {
        showToast('error', `Upload error: ${err.message}`);
      }
    }
  };

  // Synchronize student visual states with current playback time
  const studentStates = useMemo(() => {
    return students.map((s) => {
      const studentIncidents = incidents.filter(
        (inc) =>
          inc.seatId === s.seatId ||
          inc.studentName === s.studentName ||
          (inc.row === s.row && inc.bench === s.bench && inc.seat === s.seat)
      );

      const isViolatingNow = studentIncidents.some(
        (inc) => Math.abs((inc.timeSec || 0) - currentTime) <= 2.5
      );

      return {
        ...s,
        isViolatingNow,
        incidentCount: studentIncidents.length,
        lastIncident: studentIncidents[studentIncidents.length - 1] || null
      };
    });
  }, [students, incidents, currentTime]);

  // =========================================================================
  // Mouse Drag-to-Draw ROI Handlers
  // =========================================================================

  const handleMouseDown = (e) => {
    if (!isDrawingMode || !containerRef.current) return;
    e.preventDefault();

    const info = getVideoRenderInfo(videoRef.current, containerRef.current);
    setRenderInfo(info);

    const coords = clientToRenderedCoords(e.clientX, e.clientY, containerRef.current, info);
    setIsMouseDown(true);
    setDragStart(coords);
    setDragCurrent(coords);
  };

  const handleMouseMove = (e) => {
    if (!isDrawingMode || !isMouseDown || !containerRef.current) return;
    e.preventDefault();

    const coords = clientToRenderedCoords(e.clientX, e.clientY, containerRef.current, renderInfo);
    setDragCurrent(coords);
  };

  const handleMouseUp = (e) => {
    if (!isDrawingMode || !isMouseDown || !containerRef.current) return;
    e.preventDefault();
    setIsMouseDown(false);
    setIsDrawingMode(false);

    const rawWidth = Math.abs(dragCurrent.rx - dragStart.rx);
    const rawHeight = Math.abs(dragCurrent.ry - dragStart.ry);

    if (rawWidth < 15 || rawHeight < 15) {
      showToast('warning', 'Drawn region was too small. Click and drag a box across the student desk.');
      return;
    }

    const nativeROI = renderedRectToNativeROI(dragStart, dragCurrent, renderInfo);
    setPendingDrawnROI(nativeROI);
  };

  // Preview style during drag
  const dragPreviewStyle = useMemo(() => {
    if (!isMouseDown) return { display: 'none' };
    const left = renderInfo.offsetX + Math.min(dragStart.rx, dragCurrent.rx);
    const top = renderInfo.offsetY + Math.min(dragStart.ry, dragCurrent.ry);
    const width = Math.abs(dragCurrent.rx - dragStart.rx);
    const height = Math.abs(dragCurrent.ry - dragStart.ry);

    return {
      position: 'absolute',
      left: `${left}px`,
      top: `${top}px`,
      width: `${width}px`,
      height: `${height}px`,
      border: '2px dashed #f59e0b',
      backgroundColor: 'rgba(245, 158, 11, 0.25)',
      borderRadius: '4px',
      pointerEvents: 'none',
      zIndex: 20
    };
  }, [isMouseDown, dragStart, dragCurrent, renderInfo]);

  // =========================================================================
  // Save or Edit Student ROI
  // =========================================================================

  const handleSaveStudentROI = ({ studentName, row, bench, seat, roi }) => {
    const cleanName = studentName.trim() || `Candidate R${row}-B${bench}-S${seat}`;
    const seatId = `R${row}-B${bench}-S${seat}`;
    const benchId = `B${String(bench).padStart(2, '0')}`;
    const nativeW = roi.nativeW || 1920;
    const nativeH = roi.nativeH || 1080;

    const newEntry = {
      id: editingStudent ? editingStudent.id : `student_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      studentName: cleanName,
      row: Number(row) || 1,
      bench: Number(bench) || 1,
      seat: Number(seat) || 1,
      seatId,
      benchId,
      nativeW,
      nativeH,
      roi: {
        x: Number(roi.x),
        y: Number(roi.y),
        width: Number(roi.width),
        height: Number(roi.height)
      },
      pctX: (roi.x / nativeW) * 100,
      pctY: (roi.y / nativeH) * 100,
      pctW: (roi.width / nativeW) * 100,
      pctH: (roi.height / nativeH) * 100
    };

    if (editingStudent) {
      setStudents((prev) => prev.map((s) => (s.id === editingStudent.id ? newEntry : s)));
      showToast('success', `Updated ROI for ${cleanName} (${seatId})`);
    } else {
      setStudents((prev) => [...prev, newEntry]);
      showToast('success', `Added ROI for ${cleanName} (${seatId})`);
    }

    setPendingDrawnROI(null);
    setEditingStudent(null);
  };

  const handleDeleteStudentROI = (studentId) => {
    setStudents((prev) => prev.filter((s) => s.id !== studentId));
    if (selectedStudentId === studentId) setSelectedStudentId(null);
    showToast('success', 'Student ROI removed.');
  };

  const handleResetToDefaultROIs = () => {
    setStudents(DEFAULT_MANUAL_STUDENTS);
    showToast('success', 'Restored 2×2 benchmark classroom grid.');
  };

  const handleClearAllROIs = () => {
    if (window.confirm('Clear all mapped student ROIs? You will need to draw new ones before running analysis.')) {
      setStudents([]);
      setSelectedStudentId(null);
      showToast('warning', 'All student ROIs cleared.');
    }
  };

  // =========================================================================
  // Computer Vision Processing Pipeline
  // =========================================================================

  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  };

  const handleStartAnalysis = async () => {
    if (backendStatus !== 'online') {
      showToast('error', 'OpenCV backend is offline. Ensure port 5000 server is active.');
      return;
    }
    if (students.length === 0) {
      showToast('warning', 'Please draw or load at least one student ROI on the video first.');
      return;
    }

    setCvJobState('processing');
    setCvProgress({ percent: 5, currentFrame: 0, totalFrames: 0, message: 'Initializing OpenCV worker...' });
    stopPolling();

    try {
      const res = await fetch('/api/videos/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer demo_faculty_token_dev'
        },
        body: JSON.stringify({
          filename: selectedVideoFilename,
          studentROIs: students,
          cvConfig: {
            min_movement_area: Number(thresholds.minMovementArea),
            outside_ratio_threshold: Number(thresholds.outsideRatioThreshold),
            min_persistence_frames: Number(thresholds.minPersistenceFrames),
            alert_cooldown_frames: Number(thresholds.cooldownSeconds) * 10
          }
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to initialize CV analysis.');
      }

      const videoId = data.videoId;
      setCurrentVideoId(videoId);
      showToast('success', 'OpenCV video stream processing started.');

      pollIntervalRef.current = setInterval(async () => {
        try {
          const statusRes = await fetch(`/api/videos/process/status/${videoId}`, {
            headers: { Authorization: 'Bearer demo_faculty_token_dev' }
          });
          const statusData = await statusRes.json();

          if (statusData.success) {
            setCvProgress({
              percent: Math.min(100, Math.round(statusData.percent || 0)),
              currentFrame: statusData.currentFrame || 0,
              totalFrames: statusData.totalFrames || 0,
              message: statusData.message || 'Processing frames...'
            });

            if (statusData.status === 'completed') {
              stopPolling();
              setCvJobState('completed');
              const foundIncidents = statusData.incidents || [];
              setIncidents(foundIncidents);
              showToast('success', `OpenCV Analysis complete: ${foundIncidents.length} boundary violations logged.`);
            } else if (statusData.status === 'failed') {
              stopPolling();
              setCvJobState('failed');
              showToast('error', `CV analysis failed: ${statusData.error || 'Worker error'}`);
            }
          }
        } catch {}
      }, 600);
    } catch (err) {
      stopPolling();
      setCvJobState('failed');
      showToast('error', err.message);
    }
  };

  const handleStopAnalysis = async () => {
    stopPolling();
    if (currentVideoId) {
      try {
        await fetch('/api/videos/stop', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer demo_faculty_token_dev'
          },
          body: JSON.stringify({ videoId: currentVideoId })
        });
      } catch {}
    }
    setCvJobState('idle');
    setCvProgress(null);
    showToast('warning', 'Computer Vision processing stopped by instructor.');
  };

  const handleClearIncidents = async () => {
    try {
      await fetch('/api/incidents', {
        method: 'DELETE',
        headers: { Authorization: 'Bearer demo_faculty_token_dev' }
      });
    } catch {}
    setIncidents([]);
    setInspectedIncident(null);
    localStorage.removeItem('universe_exam_incidents');
    showToast('success', 'Incident log history cleared.');
  };

  const handleUpdateIncidentStatus = async (id, newStatus, note = '') => {
    setIncidents((prev) =>
      prev.map((inc) => (inc._id === id || inc.id === id ? { ...inc, status: newStatus, note } : inc))
    );
    if (inspectedIncident && (inspectedIncident._id === id || inspectedIncident.id === id)) {
      setInspectedIncident((prev) => ({ ...prev, status: newStatus, note }));
    }

    try {
      await fetch(`/api/incidents/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer demo_faculty_token_dev'
        },
        body: JSON.stringify({ status: newStatus, note })
      });
      showToast('success', `Incident status updated: ${newStatus}`);
    } catch {}
  };

  return (
    <div className="exam-monitoring-module">
      {/* ================================================================= */}
      {/* 1. WORKFLOW PIPELINE & ENTRY POINT HEADER                         */}
      {/* ================================================================= */}
      <div className="uni-card" style={{ marginBottom: '24px' }}>
        <div className="uni-card-header" style={{ flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div className="uni-card-title">
              <Eye size={20} color="var(--brand-green-700)" />
              <span>Responsible Examination Monitoring</span>
            </div>
            <div className="uni-card-desc">
              Four-step ethical proctoring workflow: Upload Video → Draw Student ROIs → Run Non-AI OpenCV → Human Ombudsman Review.
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span
              className={`uni-badge ${backendStatus === 'online' ? 'uni-badge-green' : 'uni-badge-amber'}`}
              style={{ fontSize: '0.76rem' }}
            >
              {backendStatus === 'online'
                ? '● OpenCV Engine Online (Port 5000)'
                : '○ Backend Offline / Standalone Disconnected'}
            </span>

            {/* Direct Entry Point to Standalone Application */}
            <a
              href="http://localhost:3000"
              target="_blank"
              rel="noopener noreferrer"
              className="uni-btn uni-btn-secondary uni-btn-sm"
              title="Open full standalone examination surveillance studio on port 3000"
              style={{ textDecoration: 'none' }}
            >
              <ExternalLink size={13} />
              <span>Launch Standalone Studio (:3000)</span>
            </a>
          </div>
        </div>

        {/* Four-Step Workflow Indicator */}
        <div className="uni-card-body" style={{ paddingTop: '8px', paddingBottom: '16px' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '12px'
            }}
          >
            {[
              { step: '1', title: 'Upload CCTV Video', desc: 'Select benchmark or upload exam footage' },
              { step: '2', title: 'Draw Student ROIs', desc: 'Click & drag desk boundaries; assign names' },
              { step: '3', title: 'OpenCV Processing', desc: 'MOG2 foreground subtraction & contour analysis' },
              { step: '4', title: 'Human Ombudsman Review', desc: 'Inspect snapshots; instructor decides' }
            ].map((st) => (
              <div
                key={st.step}
                style={{
                  padding: '10px 14px',
                  background: 'var(--bg-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  borderLeft: '3px solid var(--brand-green-600)'
                }}
              >
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--brand-green-800)', textTransform: 'uppercase' }}>
                  STEP {st.step}
                </div>
                <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {st.title}
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {st.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* TOAST NOTIFICATION */}
      {toast && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            backgroundColor: toast.type === 'success' ? '#f0fdf4' : toast.type === 'warning' ? '#fffbeb' : '#fef2f2',
            border: `1px solid ${toast.type === 'success' ? 'var(--brand-green-200)' : toast.type === 'warning' ? '#fde68a' : '#fecaca'}`,
            borderRadius: 'var(--radius-sm)',
            marginBottom: '20px',
            fontSize: '0.82rem',
            color: toast.type === 'success' ? 'var(--brand-green-800)' : toast.type === 'warning' ? '#b45309' : '#b91c1c'
          }}
        >
          {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          <span style={{ flex: 1 }}>{toast.message}</span>
          <button type="button" onClick={() => setToast(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* ================================================================= */}
      {/* 2. SURVEILLANCE DASHBOARD: Video Viewport + ROI Drawer            */}
      {/* ================================================================= */}
      <div className="uni-grid-2" style={{ gap: '24px', marginBottom: '24px', alignItems: 'start' }}>
        {/* LEFT COLUMN: Video Stream & Interactive Drawing Viewport */}
        <div className="uni-card">
          <div className="uni-card-header" style={{ flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <div className="uni-card-title">
                <Play size={18} color="var(--brand-green-700)" />
                <span>CCTV Examination Footage</span>
              </div>
              <div className="uni-card-desc">
                {selectedVideoFilename} • {formatSeconds(currentTime)} / {formatSeconds(duration)}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {/* DRAW ROI BUTTON */}
              <button
                type="button"
                className={`uni-btn uni-btn-sm ${isDrawingMode ? 'uni-btn-primary' : 'uni-btn-secondary'}`}
                onClick={() => setIsDrawingMode((prev) => !prev)}
                title="Click and drag on the video to define a new student area"
                style={{
                  backgroundColor: isDrawingMode ? '#f59e0b' : undefined,
                  borderColor: isDrawingMode ? '#d97706' : undefined,
                  color: isDrawingMode ? '#fff' : undefined
                }}
              >
                <PlusCircle size={14} />
                <span>{isDrawingMode ? 'Drawing Active (Click & Drag)' : '+ Draw Student ROI'}</span>
              </button>

              <button
                type="button"
                className={`uni-btn uni-btn-sm ${showROIOverlay ? 'uni-btn-primary' : 'uni-btn-secondary'}`}
                onClick={() => setShowROIOverlay((prev) => !prev)}
                title="Toggle Seating ROI overlay"
              >
                <Layers size={13} />
                <span>{showROIOverlay ? 'Hide ROIs' : 'Show ROIs'}</span>
              </button>

              <input
                type="file"
                ref={fileInputRef}
                accept="video/mp4,video/avi,video/mov"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
              <button
                type="button"
                className="uni-btn uni-btn-secondary uni-btn-sm"
                onClick={() => fileInputRef.current?.click()}
                title="Upload CCTV footage"
              >
                <Upload size={13} />
                <span>Upload</span>
              </button>
            </div>
          </div>

          <div className="uni-card-body" style={{ padding: 0 }}>
            {/* Draw Mode Active Banner */}
            {isDrawingMode && (
              <div
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#fffbeb',
                  borderBottom: '1px solid #fde68a',
                  color: '#b45309',
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MousePointerClick size={16} />
                  <span>
                    <strong>Draw Mode Active:</strong> Click and drag a rectangle over a student's desk to map their monitoring zone.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDrawingMode(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, color: '#b45309' }}
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Video Viewport with Exact Aspect-Ratio Letterbox Clamping */}
            <div
              ref={containerRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              style={{
                position: 'relative',
                width: '100%',
                backgroundColor: '#0f172a',
                overflow: 'hidden',
                aspectRatio: '16/9',
                cursor: isDrawingMode ? 'crosshair' : 'default',
                userSelect: 'none'
              }}
            >
              <video
                ref={videoRef}
                src={videoSrc}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                playsInline
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  display: 'block',
                  pointerEvents: 'none'
                }}
              />

              {/* Drag Preview Box during interactive drawing */}
              <div style={dragPreviewStyle} />

              {/* Exact Aligned Student ROI Overlays */}
              {showROIOverlay && (
                <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                  {studentStates.map((s) => {
                    const isFlagged = s.isViolatingNow;
                    const isSelected = selectedStudentId === s.id;

                    const left = renderInfo.offsetX + (s.pctX / 100) * renderInfo.renderedWidth;
                    const top = renderInfo.offsetY + (s.pctY / 100) * renderInfo.renderedHeight;
                    const width = (s.pctW / 100) * renderInfo.renderedWidth;
                    const height = (s.pctH / 100) * renderInfo.renderedHeight;

                    const borderColor = isFlagged ? '#ef4444' : isSelected ? '#0284c7' : '#10b981';
                    const bgTint = isFlagged
                      ? 'rgba(239, 68, 68, 0.22)'
                      : isSelected
                      ? 'rgba(2, 132, 199, 0.15)'
                      : 'rgba(16, 185, 129, 0.08)';

                    return (
                      <div
                        key={s.id}
                        style={{
                          position: 'absolute',
                          left: `${left}px`,
                          top: `${top}px`,
                          width: `${width}px`,
                          height: `${height}px`,
                          border: `2px solid ${borderColor}`,
                          backgroundColor: bgTint,
                          borderRadius: '4px',
                          transition: 'border-color 150ms ease, background-color 150ms ease',
                          pointerEvents: isDrawingMode ? 'none' : 'auto',
                          cursor: 'pointer',
                          zIndex: 10
                        }}
                        onClick={() => setSelectedStudentId(s.id)}
                        title={`${s.studentName} (${s.seatId})`}
                      >
                        <div
                          style={{
                            position: 'absolute',
                            top: 4,
                            left: 4,
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: '3px',
                            backgroundColor: isFlagged ? '#ef4444' : 'rgba(15, 23, 42, 0.85)',
                            color: '#ffffff',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {s.studentName} ({s.seatId})
                        </div>

                        {isFlagged && (
                          <div
                            style={{
                              position: 'absolute',
                              bottom: 4,
                              left: 4,
                              right: 4,
                              fontSize: '0.64rem',
                              fontWeight: 800,
                              padding: '2px 4px',
                              borderRadius: '2px',
                              backgroundColor: '#b91c1c',
                              color: '#fff',
                              textAlign: 'center',
                              letterSpacing: '0.04em'
                            }}
                          >
                            ⚠️ MOVEMENT VIOLATION
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Video Controls Toolbar */}
            <div
              style={{
                padding: '12px 18px',
                background: 'var(--bg-subtle)',
                borderTop: '1px solid var(--border-light)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}
            >
              <button
                type="button"
                className="uni-btn uni-btn-primary uni-btn-sm"
                onClick={handleTogglePlay}
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                <span>{isPlaying ? 'Pause' : 'Play'}</span>
              </button>

              <button
                type="button"
                className="uni-btn uni-btn-secondary uni-btn-sm"
                onClick={() => handleSeek(0)}
                title="Restart Video"
              >
                <RotateCcw size={14} />
              </button>

              <input
                type="range"
                min="0"
                max={duration || 100}
                step="0.1"
                value={currentTime}
                onChange={(e) => handleSeek(Number(e.target.value))}
                style={{ flex: 1, accentColor: 'var(--brand-green-600)', cursor: 'pointer' }}
                aria-label="Seek video timeline"
              />

              <span style={{ fontSize: '0.8rem', fontFamily: 'monospace', fontWeight: 600 }}>
                {formatSeconds(currentTime)} / {formatSeconds(duration)}
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Configured Student ROIs & Computer Vision Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Configured Student ROIs Management Card */}
          <div className="uni-card">
            <div className="uni-card-header" style={{ flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <div className="uni-card-title">
                  <User size={18} color="var(--brand-green-700)" />
                  <span>Configured Student ROIs ({students.length})</span>
                </div>
                <div className="uni-card-desc">
                  Draw rectangles directly on the video to map candidate desks.
                </div>
              </div>

              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  className="uni-btn uni-btn-secondary uni-btn-sm"
                  onClick={handleResetToDefaultROIs}
                  title="Reset to 2x2 Benchmark Grid"
                >
                  <RotateCcw size={13} />
                  <span>Reset 2×2</span>
                </button>
                <button
                  type="button"
                  className="uni-btn uni-btn-secondary uni-btn-sm"
                  onClick={handleClearAllROIs}
                  disabled={students.length === 0}
                  style={{ color: '#dc2626' }}
                  title="Remove all student ROIs"
                >
                  <Trash2 size={13} />
                  <span>Clear</span>
                </button>
              </div>
            </div>

            <div className="uni-card-body" style={{ maxHeight: '290px', overflowY: 'auto' }}>
              {students.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.84rem' }}>
                  No student monitoring zones defined yet.{' '}
                  <button
                    type="button"
                    onClick={() => setIsDrawingMode(true)}
                    style={{ color: 'var(--brand-green-700)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Click here to draw a student zone on the video.
                  </button>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
                  {studentStates.map((s) => (
                    <div
                      key={s.id}
                      onClick={() => {
                        setSelectedStudentId(s.id);
                        if (s.lastIncident?.timeSec !== undefined) {
                          handleSeek(s.lastIncident.timeSec);
                        }
                      }}
                      style={{
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-sm)',
                        border: `1px solid ${s.isViolatingNow ? '#f87171' : selectedStudentId === s.id ? 'var(--accent-blue-300)' : 'var(--border-default)'}`,
                        backgroundColor: s.isViolatingNow ? '#fef2f2' : selectedStudentId === s.id ? 'var(--accent-blue-50)' : 'var(--bg-surface)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'all 150ms ease'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <strong style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>{s.studentName}</strong>
                          <span className="code-pill">{s.seatId}</span>
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          Native ROI: {s.roi.width}×{s.roi.height}px at ({s.roi.x}, {s.roi.y})
                        </div>
                        {s.isViolatingNow && (
                          <div style={{ fontSize: '0.72rem', color: '#b91c1c', fontWeight: 700, marginTop: '2px' }}>
                            ⚡ Active Movement Boundary Violation
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className={`uni-badge ${s.incidentCount > 0 ? 'uni-badge-amber' : 'uni-badge-neutral'}`} style={{ fontSize: '0.7rem' }}>
                          {s.incidentCount} Flag{s.incidentCount !== 1 ? 's' : ''}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingStudent(s);
                          }}
                          className="uni-btn uni-btn-secondary uni-btn-sm"
                          style={{ padding: '4px 6px' }}
                          title="Edit Student Name & Seat"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteStudentROI(s.id);
                          }}
                          style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: 4 }}
                          title="Delete ROI"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Computer Vision Processing Controls Card */}
          <div className="uni-card">
            <div className="uni-card-header">
              <div className="uni-card-title">
                <Sparkles size={18} color="var(--brand-green-700)" />
                <span>OpenCV Computer Vision Engine</span>
              </div>
              <button
                type="button"
                className="uni-btn uni-btn-secondary uni-btn-sm"
                onClick={() => setShowConfigDrawer((prev) => !prev)}
                title="Adjust OpenCV Thresholds"
              >
                <Sliders size={13} />
                <span>Thresholds</span>
              </button>
            </div>
            <div className="uni-card-body">
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                Executes MOG2 background subtraction, morphological noise removal, and spatial boundary ratio analysis against defined student ROIs.
              </p>

              {/* Progress Bar when Active */}
              {cvJobState === 'processing' && cvProgress && (
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600 }}>{cvProgress.message}</span>
                    <strong>{cvProgress.percent}%</strong>
                  </div>
                  <div style={{ height: '8px', background: 'var(--slate-200)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${cvProgress.percent}%`,
                        height: '100%',
                        background: 'var(--brand-green-600)',
                        transition: 'width 250ms ease'
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Thresholds drawer */}
              {showConfigDrawer && (
                <div
                  style={{
                    padding: '12px',
                    background: 'var(--bg-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    marginBottom: '14px',
                    fontSize: '0.8rem',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '10px'
                  }}
                >
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '2px' }}>Min Motion Area (px)</label>
                    <input
                      type="number"
                      className="uni-input"
                      value={thresholds.minMovementArea}
                      onChange={(e) => setThresholds({ ...thresholds, minMovementArea: Number(e.target.value) })}
                      style={{ width: '100%', padding: '4px 8px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '2px' }}>Outside Ratio</label>
                    <input
                      type="number"
                      step="0.05"
                      className="uni-input"
                      value={thresholds.outsideRatioThreshold}
                      onChange={(e) => setThresholds({ ...thresholds, outsideRatioThreshold: Number(e.target.value) })}
                      style={{ width: '100%', padding: '4px 8px' }}
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {cvJobState === 'processing' ? (
                  <button
                    type="button"
                    className="uni-btn uni-btn-secondary"
                    onClick={handleStopAnalysis}
                    style={{ color: '#dc2626' }}
                  >
                    <X size={15} />
                    <span>Stop Analysis</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    className="uni-btn uni-btn-primary"
                    onClick={handleStartAnalysis}
                    disabled={backendStatus !== 'online'}
                  >
                    <Activity size={15} />
                    <span>Run Computer Vision Analysis</span>
                  </button>
                )}

                {serverVideos.length > 0 && (
                  <select
                    className="uni-input"
                    value={selectedVideoFilename}
                    onChange={(e) => {
                      setSelectedVideoFilename(e.target.value);
                      setLocalVideoUrl(null);
                    }}
                    style={{ fontSize: '0.8rem', padding: '6px 10px', maxWidth: '220px' }}
                    aria-label="Select examination video file"
                  >
                    {serverVideos.map((v) => (
                      <option key={v.id} value={v.filename}>
                        {v.filename}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* 3. FLAGGED INCIDENTS AUDIT TABLE                                   */}
      {/* ================================================================= */}
      <div className="uni-card" style={{ marginBottom: '24px' }}>
        <div className="uni-card-header" style={{ flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div className="uni-card-title">
              <FileCheck size={18} color="var(--brand-green-700)" />
              <span>Flagged Surveillance Incidents ({incidents.length})</span>
            </div>
            <div className="uni-card-desc">
              Timestamped boundary violations and neighbor overlap anomalies detected by OpenCV.
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {incidents.length > 0 && (
              <button
                type="button"
                className="uni-btn uni-btn-secondary uni-btn-sm"
                onClick={handleClearIncidents}
                style={{ color: '#dc2626' }}
              >
                <Trash2 size={13} />
                <span>Clear Incidents</span>
              </button>
            )}
          </div>
        </div>

        <div className="uni-card-body" style={{ padding: 0, overflowX: 'auto' }}>
          {incidents.length === 0 ? (
            <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.86rem' }}>
              No incidents logged for this examination session. Click "Run Computer Vision Analysis" above to evaluate video footage.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-subtle)', textAlign: 'left', borderBottom: '1px solid var(--border-default)' }}>
                  <th style={{ padding: '10px 16px', color: 'var(--text-secondary)' }}>Timestamp</th>
                  <th style={{ padding: '10px 16px', color: 'var(--text-secondary)' }}>Candidate Name</th>
                  <th style={{ padding: '10px 16px', color: 'var(--text-secondary)' }}>Seat ID</th>
                  <th style={{ padding: '10px 16px', color: 'var(--text-secondary)' }}>Violation Type</th>
                  <th style={{ padding: '10px 16px', color: 'var(--text-secondary)' }}>Outside Ratio</th>
                  <th style={{ padding: '10px 16px', color: 'var(--text-secondary)' }}>Status</th>
                  <th style={{ padding: '10px 16px', color: 'var(--text-secondary)', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {incidents.map((inc, idx) => (
                  <tr key={inc._id || inc.id || idx} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '10px 16px', whiteSpace: 'nowrap' }}>
                      <button
                        type="button"
                        onClick={() => handleSeek(inc.timeSec || 0)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--brand-green-700)',
                          cursor: 'pointer',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                        title="Seek video to this timestamp"
                      >
                        <Clock size={12} />
                        <span>{inc.timestamp || formatSeconds(inc.timeSec)}</span>
                      </button>
                    </td>
                    <td style={{ padding: '10px 16px', fontWeight: 600 }}>{inc.studentName}</td>
                    <td style={{ padding: '10px 16px' }}>
                      <code className="code-pill">{inc.seatId}</code>
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      <span className="uni-badge uni-badge-amber">
                        {inc.relatedStudent ? `Neighbor Overlap (${inc.relatedStudent})` : 'Boundary Violation'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      {Math.round((inc.outsideRatio || 0) * 100)}% outside desk
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      <span
                        className={`uni-badge ${
                          inc.status === 'Reviewed'
                            ? 'uni-badge-green'
                            : inc.status === 'Dismissed'
                            ? 'uni-badge-neutral'
                            : 'uni-badge-amber'
                        }`}
                        style={{ fontSize: '0.74rem' }}
                      >
                        {inc.status || 'Needs Review'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button
                        type="button"
                        className="uni-btn uni-btn-secondary uni-btn-sm"
                        onClick={() => setInspectedIncident(inc)}
                        style={{ marginRight: 6 }}
                      >
                        <Eye size={12} />
                        <span>Inspect Evidence</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ================================================================= */}
      {/* 4. MODAL: Student Name & Seat Assignment Form                     */}
      {/* ================================================================= */}
      {(pendingDrawnROI || editingStudent) && (
        <StudentROIModal
          initialROI={pendingDrawnROI || editingStudent?.roi}
          initialStudent={editingStudent}
          existingStudents={students}
          onSave={handleSaveStudentROI}
          onClose={() => {
            setPendingDrawnROI(null);
            setEditingStudent(null);
          }}
        />
      )}

      {/* ================================================================= */}
      {/* 5. MODAL: Evidence Snapshot Inspector                             */}
      {/* ================================================================= */}
      {inspectedIncident && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: 20
          }}
          onClick={() => setInspectedIncident(null)}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 'var(--radius-md)',
              maxWidth: 620,
              width: '100%',
              boxShadow: 'var(--shadow-lg)',
              border: '1px solid var(--border-default)',
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="uni-card-header" style={{ background: '#f8fafc' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
                <Shield size={18} color="var(--brand-green-700)" />
                <span>Auditable Incident Evidence Snapshot</span>
              </div>
              <button
                type="button"
                onClick={() => setInspectedIncident(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                aria-label="Close modal"
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: 20 }}>
              {/* Evidence Snapshot Image */}
              {inspectedIncident.evidencePath ? (
                <div
                  style={{
                    borderRadius: 'var(--radius-sm)',
                    overflow: 'hidden',
                    border: '1px solid var(--border-light)',
                    marginBottom: 16,
                    backgroundColor: '#0f172a'
                  }}
                >
                  <img
                    src={inspectedIncident.evidencePath}
                    alt={`Evidence frame for ${inspectedIncident.studentName}`}
                    style={{ width: '100%', maxHeight: '320px', objectFit: 'contain', display: 'block' }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              ) : (
                <div
                  style={{
                    padding: 24,
                    textAlign: 'center',
                    background: 'var(--bg-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    marginBottom: 16,
                    color: 'var(--text-muted)',
                    fontSize: '0.84rem'
                  }}
                >
                  No snapshot file available for this record.
                </div>
              )}

              {/* Metadata Details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.82rem', marginBottom: 16 }}>
                <div><strong>Candidate Name:</strong> {inspectedIncident.studentName}</div>
                <div><strong>Desk / Seat:</strong> <code>{inspectedIncident.seatId}</code></div>
                <div><strong>Timestamp:</strong> {inspectedIncident.timestamp} ({inspectedIncident.timeSec}s)</div>
                <div><strong>Outside Ratio:</strong> {Math.round((inspectedIncident.outsideRatio || 0) * 100)}%</div>
                <div><strong>Violation:</strong> {inspectedIncident.relatedStudent ? `Neighbor Overlap (${inspectedIncident.relatedStudent})` : 'Boundary Breach'}</div>
                <div><strong>Current Status:</strong> <span className="uni-badge uni-badge-amber">{inspectedIncident.status || 'Needs Review'}</span></div>
              </div>

              {/* Human Review Ombudsman Mandate */}
              <div
                style={{
                  padding: 12,
                  background: '#f0fdf4',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--brand-green-200)',
                  fontSize: '0.78rem',
                  color: 'var(--brand-green-800)',
                  marginBottom: 16
                }}
              >
                ⚖️ <strong>Human Review Mandate:</strong> In compliance with the Responsible Examination Monitoring protocol, automated OpenCV motion flags cannot impose academic penalties without instructor review.
              </div>

              {/* Status Update Action Buttons */}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="uni-btn uni-btn-secondary uni-btn-sm"
                  onClick={() => handleUpdateIncidentStatus(inspectedIncident._id || inspectedIncident.id, 'Dismissed', 'Dismissed by instructor')}
                >
                  Dismiss Flag
                </button>
                <button
                  type="button"
                  className="uni-btn uni-btn-primary uni-btn-sm"
                  onClick={() => handleUpdateIncidentStatus(inspectedIncident._id || inspectedIncident.id, 'Reviewed', 'Verified by instructor')}
                >
                  Mark as Reviewed
                </button>
              </div>
            </div>

            <div className="uni-card-footer" style={{ justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="uni-btn uni-btn-secondary uni-btn-sm"
                onClick={() => setInspectedIncident(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ===========================================================================
// Sub-Component: Student ROI Assignment Modal Dialog
// ===========================================================================

function StudentROIModal({ initialROI, initialStudent, existingStudents, onSave, onClose }) {
  const isEditing = !!initialStudent;
  const nextNum = (existingStudents ? existingStudents.length : 0) + 1;

  const [studentName, setStudentName] = useState(
    initialStudent ? initialStudent.studentName : `Candidate ${nextNum}`
  );
  const [row, setRow] = useState(initialStudent ? initialStudent.row : Math.ceil(nextNum / 2));
  const [bench, setBench] = useState(initialStudent ? initialStudent.bench : ((nextNum - 1) % 2) + 1);
  const [seat, setSeat] = useState(initialStudent ? initialStudent.seat : ((nextNum - 1) % 2) + 1);

  const [roiX, setRoiX] = useState(initialROI ? initialROI.x : 0);
  const [roiY, setRoiY] = useState(initialROI ? initialROI.y : 0);
  const [roiW, setRoiW] = useState(initialROI ? initialROI.width : 200);
  const [roiH, setRoiH] = useState(initialROI ? initialROI.height : 200);

  const computedSeatId = `R${row}-B${bench}-S${seat}`;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      studentName: studentName.trim() || `Candidate ${computedSeatId}`,
      row,
      bench,
      seat,
      roi: {
        x: Number(roiX),
        y: Number(roiY),
        width: Number(roiW),
        height: Number(roiH),
        nativeW: initialROI?.nativeW || 1920,
        nativeH: initialROI?.nativeH || 1080
      }
    });
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 120,
        padding: 20
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 'var(--radius-md)',
          maxWidth: 480,
          width: '100%',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--border-default)',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="uni-card-header" style={{ background: '#f8fafc' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
            <User size={18} color="var(--brand-green-700)" />
            <span>{isEditing ? 'Edit Student Desk ROI' : 'Assign Candidate to Desk ROI'}</span>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Student Name */}
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                Candidate Name
              </label>
              <input
                type="text"
                className="uni-input"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                style={{ width: '100%' }}
                required
                autoFocus
              />
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2, display: 'block' }}>
                Assigned label for examination seating; evaluated spatially by OpenCV.
              </span>
            </div>

            {/* Seating Identifiers: Row, Bench, Seat */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                  Row
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  className="uni-input"
                  value={row}
                  onChange={(e) => setRow(Number(e.target.value))}
                  style={{ width: '100%' }}
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                  Bench #
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  className="uni-input"
                  value={bench}
                  onChange={(e) => setBench(Number(e.target.value))}
                  style={{ width: '100%' }}
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                  Seat #
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  className="uni-input"
                  value={seat}
                  onChange={(e) => setSeat(Number(e.target.value))}
                  style={{ width: '100%' }}
                  required
                />
              </div>
            </div>

            <div style={{ padding: '8px 12px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-xs)', fontSize: '0.78rem' }}>
              Generated Seat Identifier: <code className="code-pill">{computedSeatId}</code>
            </div>

            {/* Native Resolution Coordinates (Editable) */}
            <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: 10 }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                Native Coordinates ({initialROI?.nativeW || 1920}×{initialROI?.nativeH || 1080}px):
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 6 }}>
                <div>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>X</label>
                  <input type="number" className="uni-input" value={roiX} onChange={(e) => setRoiX(Number(e.target.value))} style={{ width: '100%', padding: '3px 6px' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Y</label>
                  <input type="number" className="uni-input" value={roiY} onChange={(e) => setRoiY(Number(e.target.value))} style={{ width: '100%', padding: '3px 6px' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>W</label>
                  <input type="number" className="uni-input" value={roiW} onChange={(e) => setRoiW(Number(e.target.value))} style={{ width: '100%', padding: '3px 6px' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>H</label>
                  <input type="number" className="uni-input" value={roiH} onChange={(e) => setRoiH(Number(e.target.value))} style={{ width: '100%', padding: '3px 6px' }} />
                </div>
              </div>
            </div>
          </div>

          <div className="uni-card-footer" style={{ justifyContent: 'flex-end', gap: 10 }}>
            <button type="button" className="uni-btn uni-btn-secondary uni-btn-sm" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="uni-btn uni-btn-primary uni-btn-sm">
              <Check size={14} />
              <span>{isEditing ? 'Update Student ROI' : 'Save Student ROI'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
