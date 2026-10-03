import React, { useState } from 'react';
import {
  UploadCloud,
  FileImage,
  Film,
  Sparkles,
  Sliders,
  CheckCircle,
  AlertCircle,
  Clock,
  Users
} from 'lucide-react';
import { analyzeImage, analyzeVideo, BASE_SERVER_URL } from '../services/api';
import BoundingBoxViewer from '../components/ai/BoundingBoxViewer';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function ClassroomAnalysis({
  classrooms = [],
  selectedClassroomId,
  setSelectedClassroomId,
  setRefreshTrigger,
}) {
  const [activeTab, setActiveTab] = useState('image'); // 'image' or 'video'
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [confidence, setConfidence] = useState(0.35);
  const [videoSampleRate, setVideoSampleRate] = useState(5);
  const [saveToDb, setSaveToDb] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [videoResult, setVideoResult] = useState(null);

  const activeClassroom =
    classrooms.find((c) => c.id === selectedClassroomId) || classrooms[0];

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setError(null);
    setAnalysisResult(null);
    setVideoResult(null);

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => setPreviewUrl(reader.result);
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      setError('Please select an image or video file to analyze.');
      return;
    }
    if (!activeClassroom) {
      setError('Please select a target classroom.');
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('classroom_id', activeClassroom.id);
    formData.append('file', selectedFile);

    try {
      if (activeTab === 'image') {
        formData.append('save_record', saveToDb ? 'true' : 'false');
        formData.append('confidence_threshold', confidence.toString());
        const res = await analyzeImage(formData);
        setAnalysisResult(res);
      } else {
        formData.append('process_every_n_frames', videoSampleRate.toString());
        const res = await analyzeVideo(formData);
        setVideoResult(res);
      }
      setRefreshTrigger((p) => p + 1);
    } catch (err) {
      setError(err.message || 'Error occurred during AI processing.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Media Type Tabs & Configuration */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-soft p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setActiveTab('image');
                setSelectedFile(null);
                setPreviewUrl(null);
                setAnalysisResult(null);
                setVideoResult(null);
              }}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'image'
                  ? 'bg-campus-600 text-white shadow-sm'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <FileImage className="w-4 h-4" />
              <span>Classroom Photo (JPG, PNG)</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('video');
                setSelectedFile(null);
                setPreviewUrl(null);
                setAnalysisResult(null);
                setVideoResult(null);
              }}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'video'
                  ? 'bg-campus-600 text-white shadow-sm'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Film className="w-4 h-4" />
              <span>Surveillance Video (MP4, AVI)</span>
            </button>
          </div>

          {/* Target Classroom Selector */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-600">
              Target Classroom:
            </label>
            <select
              value={selectedClassroomId || ''}
              onChange={(e) => setSelectedClassroomId(Number(e.target.value))}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-medium"
            >
              {classrooms.map((cr) => (
                <option key={cr.id} value={cr.id}>
                  {cr.name} (Cap: {cr.capacity})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Upload Zone & Settings */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-5">
          {/* File Picker */}
          <div className="lg:col-span-2">
            <label className="border-2 border-dashed border-slate-200 hover:border-campus-400 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer bg-slate-50/50 hover:bg-campus-50/20 transition-all text-center">
              <UploadCloud className="w-10 h-10 text-campus-600 mb-2" />
              <span className="text-sm font-semibold text-slate-800">
                {selectedFile ? selectedFile.name : `Click to browse or drag & drop ${activeTab}`}
              </span>
              <span className="text-xs text-slate-400 mt-1">
                {activeTab === 'image'
                  ? 'Supported formats: JPG, JPEG, PNG, WEBP (Max 15MB)'
                  : 'Supported formats: MP4, AVI, MOV, WEBM (Max 100MB)'}
              </span>
              <input
                type="file"
                accept={activeTab === 'image' ? 'image/*' : 'video/*'}
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>

          {/* Hyperparameters Card */}
          <div className="bg-slate-50 rounded-xl border border-slate-100 p-4 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <Sliders className="w-4 h-4 text-campus-600" />
              <span>Inference Parameters</span>
            </div>

            {activeTab === 'image' ? (
              <div>
                <div className="flex justify-between text-xs font-medium text-slate-600">
                  <span>Confidence Threshold:</span>
                  <span className="font-bold text-campus-700">{confidence}</span>
                </div>
                <input
                  type="range"
                  min="0.10"
                  max="0.90"
                  step="0.05"
                  value={confidence}
                  onChange={(e) => setConfidence(parseFloat(e.target.value))}
                  className="w-full accent-campus-600 mt-1"
                />
              </div>
            ) : (
              <div>
                <div className="flex justify-between text-xs font-medium text-slate-600">
                  <span>Sample Every N Frames:</span>
                  <span className="font-bold text-campus-700">{videoSampleRate}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="30"
                  step="1"
                  value={videoSampleRate}
                  onChange={(e) => setVideoSampleRate(parseInt(e.target.value))}
                  className="w-full accent-campus-600 mt-1"
                />
              </div>
            )}

            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={saveToDb}
                onChange={(e) => setSaveToDb(e.target.checked)}
                className="rounded text-campus-600 focus:ring-campus-500"
              />
              <span>Save detection record to database</span>
            </label>

            <button
              onClick={handleAnalyze}
              disabled={loading || !selectedFile}
              className="w-full py-2.5 px-4 bg-campus-600 hover:bg-campus-700 text-white font-semibold text-xs rounded-lg shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>{loading ? 'Running YOLO Inference...' : 'Execute AI Detection'}</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Loading Indicator */}
      {loading && (
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-soft p-12 text-center">
          <LoadingSpinner
            text={
              activeTab === 'image'
                ? 'Running YOLOv8 person detection and computing occupancy...'
                : 'Processing video frames and computing occupancy timeline...'
            }
            size="lg"
          />
        </div>
      )}

      {/* Image Analysis Results */}
      {analysisResult && !loading && (
        <BoundingBoxViewer
          originalImageUrl={previewUrl}
          annotatedImageUrl={analysisResult.annotated_image_base64 || `${BASE_SERVER_URL}${analysisResult.annotated_image_url}`}
          analysisData={analysisResult}
        />
      )}

      {/* Video Analysis Results */}
      {videoResult && !loading && (
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-soft p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Video Analysis Summary
              </h3>
              <p className="text-xs text-slate-500">
                Processed {videoResult.sampled_frames_processed} sampled frames out of{' '}
                {videoResult.total_video_frames} total frames
              </p>
            </div>
            <span className="text-xs px-2.5 py-1 bg-campus-50 text-campus-800 border border-campus-200 rounded-full font-bold">
              Status: {videoResult.status}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-100 text-center">
              <span className="text-xs text-slate-400 font-semibold uppercase">
                Peak Students
              </span>
              <div className="text-2xl font-bold text-slate-900 mt-1">
                {videoResult.peak_students_detected}
              </div>
            </div>
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-100 text-center">
              <span className="text-xs text-slate-400 font-semibold uppercase">
                Average Students
              </span>
              <div className="text-2xl font-bold text-slate-900 mt-1">
                {videoResult.average_students_detected}
              </div>
            </div>
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-100 text-center">
              <span className="text-xs text-slate-400 font-semibold uppercase">
                Peak Occupancy %
              </span>
              <div className="text-2xl font-bold text-campus-700 mt-1">
                {videoResult.occupancy_percentage}%
              </div>
            </div>
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-100 text-center">
              <span className="text-xs text-slate-400 font-semibold uppercase">
                Record Saved
              </span>
              <div className="text-sm font-bold text-emerald-700 mt-2 flex items-center justify-center gap-1">
                <CheckCircle className="w-4 h-4" /> Logged
              </div>
            </div>
          </div>

          {videoResult.annotated_image_base64 && (
            <div className="pt-3 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                Peak Detection Frame (Highest Occupancy)
              </h4>
              <div className="relative rounded-lg overflow-hidden border border-slate-200 bg-slate-900/5 max-h-[420px] flex items-center justify-center">
                <img
                  src={videoResult.annotated_image_base64}
                  alt="Peak Video Detection Frame"
                  className="max-h-[420px] w-auto object-contain mx-auto rounded"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
