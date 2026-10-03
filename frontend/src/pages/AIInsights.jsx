import React, { useState, useEffect } from 'react';
import {
  BrainCircuit,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Lightbulb,
  CalendarCheck,
  AlertCircle
} from 'lucide-react';
import { getAIInsights } from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function AIInsights({ refreshTrigger, setActivePage }) {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchInsights = async () => {
      setLoading(true);
      try {
        const data = await getAIInsights();
        setInsights(data);
      } catch (err) {
        console.error('Insights error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, [refreshTrigger]);

  if (loading) {
    return <LoadingSpinner text="Synthesizing historical AI insights..." />;
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-soft p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-campus-600" />
            <h2 className="text-base font-bold text-slate-900">
              AI Timetable & Space Optimization Insights
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Data-driven recommendations derived from real historical classroom occupancy logs
          </p>
        </div>

        <button
          onClick={() => setActivePage('analyze')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-campus-600 hover:bg-campus-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors self-start sm:self-auto"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Upload More Media</span>
        </button>
      </div>

      {/* Insights Cards */}
      <div className="space-y-4">
        {insights.map((item, idx) => {
          const isHigh = item.impact_level === 'High';
          const isMedium = item.impact_level === 'Medium';

          return (
            <div
              key={idx}
              className="bg-white rounded-xl border border-slate-200/90 shadow-soft p-5 transition-all hover:border-slate-300"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      item.category === 'utilization'
                        ? 'bg-amber-50 text-amber-700'
                        : item.category === 'scheduling'
                        ? 'bg-blue-50 text-blue-700'
                        : 'bg-campus-50 text-campus-700'
                    }`}
                  >
                    <Lightbulb className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {item.title}
                    </h3>
                    <p className="text-xs font-semibold text-slate-600 mt-0.5">
                      {item.summary}
                    </p>
                  </div>
                </div>

                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border shrink-0 ${
                    isHigh
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : isMedium
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  {item.impact_level} Impact
                </span>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 text-xs space-y-2">
                <p className="text-slate-600 leading-relaxed">
                  <span className="font-semibold text-slate-800">Observation: </span>
                  {item.detail}
                </p>

                <div className="p-3 bg-campus-50/50 border border-campus-100/80 rounded-lg text-campus-900">
                  <span className="font-bold">Strategic Recommendation: </span>
                  {item.recommendation}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
