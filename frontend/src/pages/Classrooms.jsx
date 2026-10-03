import React, { useState, useEffect } from 'react';
import {
  School,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  Building,
  Video,
  Users,
  AlertCircle
} from 'lucide-react';
import {
  getClassrooms,
  createClassroom,
  updateClassroom,
  deleteClassroom
} from '../services/api';
import Modal from '../components/common/Modal';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';

export default function Classrooms({
  classrooms = [],
  setClassrooms,
  setActivePage,
  setSelectedClassroomId,
  setRefreshTrigger
}) {
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClassroom, setEditingClassroom] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    building: '',
    floor: 1,
    room_number: '',
    capacity: 60,
    camera_id: '',
    department: '',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getClassrooms({ search: search || undefined });
      setClassrooms(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleOpenCreate = () => {
    setEditingClassroom(null);
    setFormData({
      name: '',
      building: '',
      floor: 1,
      room_number: '',
      capacity: 50,
      camera_id: '',
      department: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cr) => {
    setEditingClassroom(cr);
    setFormData({
      name: cr.name,
      building: cr.building,
      floor: cr.floor,
      room_number: cr.room_number,
      capacity: cr.capacity,
      camera_id: cr.camera_id || '',
      department: cr.department || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingClassroom) {
        await updateClassroom(editingClassroom.id, formData);
      } else {
        await createClassroom(formData);
      }
      setIsModalOpen(false);
      loadData();
      setRefreshTrigger((p) => p + 1);
    } catch (err) {
      alert(`Error saving classroom: ${err.message}`);
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to remove '${name}'?`)) {
      try {
        await deleteClassroom(id);
        loadData();
        setRefreshTrigger((p) => p + 1);
      } catch (err) {
        alert(`Error deleting: ${err.message}`);
      }
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Bar */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-soft p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Campus Classrooms & Lecture Halls
          </h2>
          <p className="text-xs text-slate-500">
            Configure room capacities, surveillance camera streams, and departments
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-campus-600 hover:bg-campus-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Classroom</span>
        </button>
      </div>

      {/* Search and Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-soft overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by hall name, building, or room..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-campus-500/20 focus:border-campus-500"
            />
          </div>
        </div>

        {loading ? (
          <LoadingSpinner text="Fetching classrooms..." />
        ) : classrooms.length === 0 ? (
          <EmptyState
            icon={School}
            title="No Classrooms Found"
            description="Add your first classroom to begin monitoring student occupancy."
            actionLabel="Add Classroom"
            onAction={handleOpenCreate}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200/70">
                <tr>
                  <th className="px-5 py-3.5">Classroom Name</th>
                  <th className="px-4 py-3.5">Location</th>
                  <th className="px-4 py-3.5">Capacity</th>
                  <th className="px-4 py-3.5">Camera ID</th>
                  <th className="px-4 py-3.5">Latest Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {classrooms.map((cr) => (
                  <tr key={cr.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-slate-900">{cr.name}</div>
                      <div className="text-[11px] text-slate-400">{cr.department || 'General'}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div>{cr.building}</div>
                      <div className="text-[11px] text-slate-400">
                        Floor {cr.floor} • Room {cr.room_number}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-bold text-slate-900">{cr.capacity}</span>
                      <span className="text-[11px] text-slate-400"> seats</span>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-[11px] text-slate-700">
                      {cr.camera_id || 'Not Assigned'}
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge
                        status={cr.latest_occupancy?.status || 'EMPTY'}
                        size="sm"
                      />
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-1">
                      <button
                        onClick={() => {
                          setSelectedClassroomId(cr.id);
                          setActivePage('live-monitoring');
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-campus-600 hover:bg-campus-50 transition-colors"
                        title="Live Monitor"
                      >
                        <Video className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(cr)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                        title="Edit Details"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(cr.id, cr.name)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete Classroom"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Classroom Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingClassroom ? 'Edit Classroom' : 'Add New Classroom'}
        subtitle="Configure hall capacity and camera surveillance parameters"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Classroom Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Lecture Theatre 101 - CS Block"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Building Block *
              </label>
              <input
                type="text"
                required
                placeholder="Aryabhatta Block"
                value={formData.building}
                onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Room Number *
              </label>
              <input
                type="text"
                required
                placeholder="101"
                value={formData.room_number}
                onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Capacity (Students) *
              </label>
              <input
                type="number"
                min="5"
                max="1000"
                required
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Floor
              </label>
              <input
                type="number"
                value={formData.floor}
                onChange={(e) => setFormData({ ...formData, floor: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Camera Stream ID
              </label>
              <input
                type="text"
                placeholder="CAM-LH101"
                value={formData.camera_id}
                onChange={(e) => setFormData({ ...formData, camera_id: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Department
              </label>
              <input
                type="text"
                placeholder="Computer Science"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-campus-600 hover:bg-campus-700 text-white rounded-lg font-semibold shadow-sm"
            >
              {editingClassroom ? 'Save Changes' : 'Create Classroom'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
