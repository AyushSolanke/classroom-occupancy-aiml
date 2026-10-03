import React, { useState, useEffect } from 'react';
import {
  History,
  Download,
  Filter,
  Plus,
  Trash2,
  Calendar,
  Layers,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckCircle2
} from 'lucide-react';
import {
  getOccupancyHistory,
  createManualRecord,
  deleteOccupancyRecord,
  getExportUrl,
  BASE_SERVER_URL
} from '../services/api';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import Modal from '../components/common/Modal';

export default function OccupancyHistory({
  classrooms = [],
  refreshTrigger,
  setRefreshTrigger
}) {
  const [records, setRecords] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  // Filters
  const [filterClassroom, setFilterClassroom] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterSource, setFilterSource] = useState('ALL');

  // Manual Log Modal
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualClassroomId, setManualClassroomId] = useState(classrooms[0]?.id || 1);
  const [manualCount, setManualCount] = useState(25);

  // Image detail modal
  const [activeImageModal, setActiveImageModal] = useState(null);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const res = await getOccupancyHistory({
        classroom_id: filterClassroom || undefined,
        status: filterStatus !== 'ALL' ? filterStatus : undefined,
        source: filterSource !== 'ALL' ? filterSource : undefined,
        page,
        page_size: 12,
      });
      setRecords(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (err) {
      console.error('History load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [page, filterClassroom, filterStatus, filterSource, refreshTrigger]);

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    try {
      await createManualRecord(manualClassroomId, manualCount);
      setIsManualModalOpen(false);
      loadHistory();
      setRefreshTrigger((p) => p + 1);
    } catch (err) {
      alert(`Error logging manual record: ${err.message}`);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this occupancy log?')) {
      try {
        await deleteOccupancyRecord(id);
        loadHistory();
        setRefreshTrigger((p) => p + 1);
      } catch (err) {
        alert(err.message);
      }
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header and Actions */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-soft p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Occupancy History & Audit Log
          </h2>
          <p className="text-xs text-slate-500">
            Chronological records of all AI inferences, surveillance logs, and verifications ({total} total entries)
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <a
            href={getExportUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </a>

          <button
            onClick={() => setIsManualModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-campus-600 hover:bg-campus-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Manual Check-In</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-soft p-4 flex flex-wrap items-center gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-semibold text-slate-700">Filter By:</span>
        </div>

        {/* Classroom Filter */}
        <select
          value={filterClassroom}
          onChange={(e) => {
            setFilterClassroom(e.target.value);
            setPage(1);
          }}
          className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800"
        >
          <option value="">All Classrooms</option>
          {classrooms.map((cr) => (
            <option key={cr.id} value={cr.id}>
              {cr.name}
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={filterStatus}
          onChange={(e) => {
            setFilterStatus(e.target.value);
            setPage(1);
          }}
          className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800"
        >
          <option value="ALL">All Statuses</option>
          <option value="EMPTY">EMPTY</option>
          <option value="LOW OCCUPANCY">LOW OCCUPANCY</option>
          <option value="MODERATE OCCUPANCY">MODERATE OCCUPANCY</option>
          <option value="FULL">FULL</option>
        </select>

        {/* Source Filter */}
        <select
          value={filterSource}
          onChange={(e) => {
            setFilterSource(e.target.value);
            setPage(1);
          }}
          className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800"
        >
          <option value="ALL">All Detection Sources</option>
          <option value="IMAGE">IMAGE (Upload)</option>
          <option value="VIDEO">VIDEO</option>
          <option value="LIVE CAMERA">LIVE CAMERA</option>
          <option value="MANUAL">MANUAL</option>
        </select>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-soft overflow-hidden">
        {loading ? (
          <LoadingSpinner text="Loading occupancy records..." />
        ) : records.length === 0 ? (
          <EmptyState
            icon={History}
            title="No Records Found"
            description="No detection logs match the selected filter criteria."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200/70">
                <tr>
                  <th className="px-5 py-3.5">Timestamp</th>
                  <th className="px-4 py-3.5">Classroom</th>
                  <th className="px-4 py-3.5">Students Detected</th>
                  <th className="px-4 py-3.5">Occupancy %</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Source</th>
                  <th className="px-4 py-3.5">Confidence</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {records.map((r) => {
                  const dateObj = new Date(r.timestamp);
                  return (
                    <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-slate-800">
                          {dateObj.toLocaleDateString()}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {dateObj.toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-bold text-slate-900">
                          {r.classroom_name || `Hall #${r.classroom_id}`}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-bold text-slate-900">{r.detected_count}</span>
                        <span className="text-[11px] text-slate-400"> / {r.capacity}</span>
                      </td>
                      <td className="px-4 py-3.5 font-bold text-campus-700">
                        {r.occupancy_percentage}%
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={r.status} size="sm" />
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-600">
                          {r.source}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-[11px] text-slate-600">
                        {r.confidence_avg ? `${Math.round(r.confidence_avg * 100)}%` : '—'}
                      </td>
                      <td className="px-5 py-3.5 text-right space-x-1">
                        {r.image_path && (
                          <button
                            onClick={() => setActiveImageModal(`${BASE_SERVER_URL}${r.image_path}`)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-campus-600 hover:bg-campus-50 transition-colors"
                            title="View AI Detection"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(r.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div>
              Page <span className="font-bold text-slate-800">{page}</span> of{' '}
              <span className="font-bold text-slate-800">{totalPages}</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="p-1.5 rounded border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="p-1.5 rounded border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Manual Check-in Modal */}
      <Modal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        title="Log Ground-Truth Verification"
        subtitle="Record manual student count for classroom validation"
      >
        <form onSubmit={handleManualSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Select Classroom *
            </label>
            <select
              value={manualClassroomId}
              onChange={(e) => setManualClassroomId(Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
            >
              {classrooms.map((cr) => (
                <option key={cr.id} value={cr.id}>
                  {cr.name} (Cap: {cr.capacity})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Actual Student Count *
            </label>
            <input
              type="number"
              min="0"
              max="1000"
              required
              value={manualCount}
              onChange={(e) => setManualCount(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsManualModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-campus-600 hover:bg-campus-700 text-white rounded-lg font-semibold shadow-sm"
            >
              Submit Check-In
            </button>
          </div>
        </form>
      </Modal>

      {/* Image Preview Modal */}
      <Modal
        isOpen={Boolean(activeImageModal)}
        onClose={() => setActiveImageModal(null)}
        title="Annotated AI Detection Snapshot"
        maxWidth="max-w-2xl"
      >
        {activeImageModal && (
          <div className="rounded-lg overflow-hidden border border-slate-200 bg-black flex items-center justify-center">
            <img
              src={activeImageModal}
              alt="AI Detection Snapshot"
              className="max-h-[500px] w-full object-contain"
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
