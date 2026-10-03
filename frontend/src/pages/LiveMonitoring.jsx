import React, { useState, useRef, useEffect } from 'react';
import {
  Video,
  VideoOff,
  Camera,
  Play,
  Square,
  AlertTriangle,
  Sparkles,
  Zap,
  Info
} from 'lucide-react';
import StatusBadge from '../components/common/StatusBadge';
import { analyzeFrame } from '../services/api';

export default function LiveMonitoring({
  classrooms = [],
  selectedClassroomId,
  setSelectedClassroomId,
}) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [detectionResult, setDetectionResult] = useState(null);
  const [isInferring, setIsInferring] = useState(false);
  const [autoLogToDb, setAutoLogToDb] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);

  const activeClassroom =
    classrooms.find((c) => c.id === selectedClassroomId) || classrooms[0];

  const startCamera = async () => {
    setCameraError(null);
    try {
      const constraints = {
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsStreaming(true);
    } catch (err) {
      console.error('Camera access error:', err);
      let msg = 'Unable to access your camera device.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'Camera permission denied. Please allow camera access in browser permissions.';
      } else if (err.name === 'NotFoundError') {
        msg = 'No video capture camera device was detected on your computer.';
      }
      setCameraError(msg);
      setIsStreaming(false);
    }
  };

  const stopCamera = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
  };

  // Inference loop while streaming
  useEffect(() => {
    if (isStreaming && activeClassroom) {
      const runInference = async () => {
        if (!videoRef.current || !canvasRef.current || isInferring) return;
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (video.videoWidth === 0 || video.videoHeight === 0) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(
          async (blob) => {
            if (!blob) return;
            setIsInferring(true);
            try {
              const formData = new FormData();
              formData.append('classroom_id', activeClassroom.id);
              formData.append('frame', blob, 'frame.jpg');
              formData.append('save_record', autoLogToDb ? 'true' : 'false');

              const res = await analyzeFrame(formData);
              setDetectionResult(res);
            } catch (err) {
              console.warn('Frame inference skip/error:', err.message);
            } finally {
              setIsInferring(false);
            }
          },
          'image/jpeg',
          0.85
        );
      };

      // Run inference every 2000ms
      intervalRef.current = setInterval(runInference, 2000);
      runInference();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isStreaming, activeClassroom?.id, autoLogToDb]);

  // Clean up stream on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner / Classroom Selector */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-soft p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-campus-700 uppercase tracking-wider">
            Live Stream Feed
          </span>
          <h2 className="text-lg font-bold text-slate-900 mt-0.5">
            {activeClassroom ? activeClassroom.name : 'Select a Classroom'}
          </h2>
          <p className="text-xs text-slate-500">
            CCTV Stream ID:{' '}
            <span className="font-mono font-medium text-slate-700">
              {activeClassroom?.camera_id || 'CAM-DEFAULT'}
            </span>{' '}
            • Room Capacity: {activeClassroom?.capacity}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-600 font-medium">Target Hall:</label>
            <select
              value={selectedClassroomId || ''}
              onChange={(e) => setSelectedClassroomId(Number(e.target.value))}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium"
            >
              {classrooms.map((cr) => (
                <option key={cr.id} value={cr.id}>
                  {cr.name} ({cr.room_number})
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-1.5 text-xs text-slate-600 font-medium cursor-pointer">
            <input
              type="checkbox"
              checked={autoLogToDb}
              onChange={(e) => setAutoLogToDb(e.target.checked)}
              className="rounded text-campus-600 focus:ring-campus-500"
            />
            <span>Log detections to DB</span>
          </label>

          {!isStreaming ? (
            <button
              onClick={startCamera}
              className="inline-flex items-center gap-2 px-4 py-2 bg-campus-600 hover:bg-campus-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Start Camera</span>
            </button>
          ) : (
            <button
              onClick={stopCamera}
              className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
            >
              <Square className="w-4 h-4 fill-white" />
              <span>Stop Camera</span>
            </button>
          )}
        </div>
      </div>

      {/* Camera Error alert */}
      {cameraError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <div>
            <p className="font-bold">Camera Access Issue</p>
            <p>{cameraError}</p>
          </div>
        </div>
      )}

      {/* Main Video & Live Diagnostics Display */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stream Canvas */}
        <div className="lg:col-span-2 bg-slate-950 rounded-xl overflow-hidden shadow-card border border-slate-800 relative flex flex-col items-center justify-center min-h-[380px]">
          {/* Live Overlay Badge */}
          <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                isStreaming
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isStreaming ? 'bg-white animate-ping' : 'bg-slate-500'
                }`}
              />
              {isStreaming ? 'LIVE' : 'OFFLINE'}
            </span>

            {isInferring && (
              <span className="text-[11px] font-medium bg-black/60 backdrop-blur-sm text-campus-400 px-2 py-0.5 rounded border border-campus-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> YOLO Inference
              </span>
            )}
          </div>

          {/* Raw Video element */}
          <video
            ref={videoRef}
            playsInline
            muted
            className={`w-full max-h-[460px] object-contain ${
              detectionResult?.annotated_image_base64 ? 'hidden' : 'block'
            }`}
          />

          {/* AI Annotated Frame View */}
          {detectionResult?.annotated_image_base64 && isStreaming && (
            <img
              src={detectionResult.annotated_image_base64}
              alt="Live Detection Stream"
              className="w-full max-h-[460px] object-contain"
            />
          )}

          {/* Hidden Canvas for frame snapshots */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Stream Off State */}
          {!isStreaming && (
            <div className="text-center p-8 text-slate-400">
              <Camera className="w-12 h-12 mx-auto mb-3 text-slate-600" />
              <p className="text-sm font-semibold text-slate-200">
                Live Video Feed Stopped
              </p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                Click "Start Camera" above to initiate browser video stream and real-time student counting.
              </p>
            </div>
          )}
        </div>

        {/* Live Diagnostics Card */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-soft p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-campus-600" />
              Real-Time AI Telemetry
            </h3>

            <div className="space-y-4">
              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Students Detected
                </span>
                <div className="text-3xl font-extrabold text-slate-900 mt-0.5">
                  {detectionResult?.detected_students ?? 0}
                </div>
                <span className="text-xs text-slate-400">
                  Room Capacity: {activeClassroom?.capacity ?? 0}
                </span>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Live Occupancy
                </span>
                <div className="text-2xl font-bold text-campus-700 mt-0.5">
                  {detectionResult?.occupancy_percentage
                    ? `${detectionResult.occupancy_percentage}%`
                    : '0.0%'}
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 mt-1.5 overflow-hidden">
                  <div
                    className="h-2 rounded-full bg-campus-600 transition-all duration-300"
                    style={{
                      width: `${Math.min(
                        100,
                        detectionResult?.occupancy_percentage || 0
                      )}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Current Status
                </span>
                <div className="mt-1">
                  <StatusBadge
                    status={detectionResult?.status || 'EMPTY'}
                    size="lg"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400">Latency:</span>
                  <p className="font-semibold text-slate-800">
                    {detectionResult?.inference_time_ms
                      ? `${detectionResult.inference_time_ms} ms`
                      : '—'}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">Confidence:</span>
                  <p className="font-semibold text-slate-800">
                    {detectionResult?.confidence_avg
                      ? `${Math.round(detectionResult.confidence_avg * 100)}%`
                      : '—'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Energy Advice from Live State */}
          <div className="bg-campus-50/50 rounded-xl border border-campus-100 p-4">
            <div className="flex items-center gap-2 text-campus-800 font-bold text-xs">
              <Zap className="w-4 h-4 text-campus-600" />
              <span>Energy Recommendation</span>
            </div>
            <p className="text-xs text-campus-900/80 mt-1.5 leading-relaxed">
              {(detectionResult?.detected_students || 0) === 0
                ? 'Hall is currently vacant. Automated rule suggests powering down idle fans and projectors.'
                : (detectionResult?.occupancy_percentage || 0) < 35
                ? 'Low student density detected. Consider running HVAC in eco mode.'
                : 'Hall occupancy is normal. Maintain standard HVAC ventilation.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
