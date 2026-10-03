import React, { useState } from 'react';
import { Eye, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';

export default function BoundingBoxViewer({
  originalImageUrl,
  annotatedImageUrl,
  analysisData,
}) {
  const [viewMode, setViewMode] = useState('side-by-side'); // 'side-by-side' or 'annotated'

  if (!analysisData && !annotatedImageUrl) return null;

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-soft overflow-hidden">
      {/* Header bar with inference summary */}
      <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/60">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-campus-100 text-campus-700 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              YOLOv8 Detection Results
            </h3>
            <p className="text-xs text-slate-500">
              Model: {analysisData?.model_used || 'Ultralytics YOLOv8 (person class)'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {analysisData?.status && (
            <StatusBadge status={analysisData.status} size="sm" />
          )}

          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-white text-xs">
            <button
              onClick={() => setViewMode('side-by-side')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                viewMode === 'side-by-side'
                  ? 'bg-campus-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Side by Side
            </button>
            <button
              onClick={() => setViewMode('annotated')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                viewMode === 'annotated'
                  ? 'bg-campus-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Annotated Only
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Strip */}
      {analysisData && (
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-slate-100 border-b border-slate-100 bg-white">
          <div className="p-3.5 text-center">
            <span className="text-[11px] font-semibold uppercase text-slate-400">
              Students Detected
            </span>
            <div className="text-xl font-extrabold text-campus-700 mt-0.5">
              {analysisData.detected_students ?? analysisData.person_count ?? 0}
            </div>
          </div>

          <div className="p-3.5 text-center">
            <span className="text-[11px] font-semibold uppercase text-slate-400">
              Occupancy %
            </span>
            <div className="text-xl font-extrabold text-slate-900 mt-0.5">
              {analysisData.occupancy_percentage ? `${analysisData.occupancy_percentage}%` : 'N/A'}
            </div>
          </div>

          <div className="p-3.5 text-center">
            <span className="text-[11px] font-semibold uppercase text-slate-400">
              Inference Speed
            </span>
            <div className="text-xl font-extrabold text-slate-800 mt-0.5">
              {analysisData.inference_time_ms ? `${analysisData.inference_time_ms} ms` : '—'}
            </div>
          </div>

          <div className="p-3.5 text-center">
            <span className="text-[11px] font-semibold uppercase text-slate-400">
              Avg. Confidence
            </span>
            <div className="text-xl font-extrabold text-slate-800 mt-0.5">
              {analysisData.confidence_avg ? `${Math.round(analysisData.confidence_avg * 100)}%` : '—'}
            </div>
          </div>
        </div>
      )}

      {/* Image Display */}
      <div className="p-4 bg-slate-950/5">
        {viewMode === 'side-by-side' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {originalImageUrl && (
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-slate-400" />
                  Original Classroom Image
                </span>
                <div className="rounded-lg overflow-hidden border border-slate-200 bg-black flex items-center justify-center min-h-[260px]">
                  <img
                    src={originalImageUrl}
                    alt="Original Classroom"
                    className="max-h-[380px] w-full object-contain"
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col">
              <span className="text-xs font-semibold text-campus-700 mb-1.5 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-campus-600" />
                AI Bounding Box Visualization
              </span>
              <div className="rounded-lg overflow-hidden border border-campus-300 bg-black flex items-center justify-center min-h-[260px]">
                <img
                  src={annotatedImageUrl}
                  alt="AI Detections"
                  className="max-h-[380px] w-full object-contain"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="rounded-lg overflow-hidden border border-slate-200 bg-black w-full flex items-center justify-center min-h-[320px]">
              <img
                src={annotatedImageUrl}
                alt="AI Detections"
                className="max-h-[460px] w-full object-contain"
              />
            </div>
          </div>
        )}
      </div>

      {/* Detections List & Explainability */}
      {analysisData?.detections && analysisData.detections.length > 0 && (
        <div className="p-5 border-t border-slate-100 bg-white">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5">
            Detections Explainability Breakdown ({analysisData.detections.length} Students Logged)
          </h4>
          <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-100 divide-y divide-slate-100">
            {analysisData.detections.map((d, idx) => (
              <div
                key={idx}
                className="px-3.5 py-2 flex items-center justify-between text-xs hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-campus-100 text-campus-800 font-bold text-[10px] flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <span className="font-medium text-slate-800">Student (Person)</span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    [{d.x1}, {d.y1}] to [{d.x2}, {d.y2}]
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-slate-600">
                    Confidence:
                  </span>
                  <span className="font-mono font-bold text-campus-700 bg-campus-50 px-1.5 py-0.5 rounded border border-campus-200">
                    {Math.round(d.confidence * 100)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
