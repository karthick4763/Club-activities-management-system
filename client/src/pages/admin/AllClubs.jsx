import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import { Modal } from '../../components/Modal';
import { Building2, Users, Calendar, Plus, Mail, User, ShieldCheck, Edit, Lock, Eye, EyeOff } from 'lucide-react';

export const AllClubs = () => {
  const navigate = useNavigate();
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Club Modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [clubName, setClubName] = useState('');
  const [category, setCategory] = useState('Technical');
  const [description, setDescription] = useState('');
  const [coordName, setCoordName] = useState('');
  const [coordEmail, setCoordEmail] = useState('');
  const [coordPassword, setCoordPassword] = useState('');
  const [showAddPassword, setShowAddPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Edit Club Modal
  const [editingClub, setEditingClub] = useState(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('Technical');
  const [editDesc, setEditDesc] = useState('');
  const [editCoordName, setEditCoordName] = useState('');
  const [editCoordEmail, setEditCoordEmail] = useState('');
  const [editCoordPassword, setEditCoordPassword] = useState('');
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchClubs = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get('/clubs');
      if (res.data.success) {
        setClubs(res.data.clubs);
      }
    } catch (err) {
      console.error('Error loading clubs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClubs();
  }, []);

  const handleCreateClub = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await axiosClient.post('/clubs', {
        club_name: clubName,
        category,
        description,
        coordinator_name: coordName,
        coordinator_email: coordEmail,
        coordinator_password: coordPassword
      });
      setIsAddOpen(false);
      setClubName('');
      setCategory('Technical');
      setDescription('');
      setCoordName('');
      setCoordEmail('');
      setCoordPassword('');
      setShowAddPassword(false);
      fetchClubs();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create club');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEdit = (club) => {
    setEditingClub(club);
    setEditName(club.club_name);
    setEditCategory(club.category || 'Technical');
    setEditDesc(club.description || '');
    setEditCoordName(club.coordinator_name || '');
    setEditCoordEmail(club.coordinator_email || '');
    setEditCoordPassword('');
    setShowEditPassword(false);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      setSavingEdit(true);
      await axiosClient.put(`/clubs/${editingClub.id}`, {
        club_name: editName,
        category: editCategory,
        description: editDesc,
        coordinator_name: editCoordName,
        coordinator_email: editCoordEmail,
        coordinator_password: editCoordPassword
      });
      setEditingClub(null);
      fetchClubs();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update club');
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Club Workspaces
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Clubs assigned to student coordinators with independent workspaces • {clubs.length} Clubs
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="self-start md:self-auto flex items-center gap-2 px-4 py-2.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-xl text-xs font-bold shadow-sm shadow-[#7C3AED]/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Club</span>
        </button>
      </div>

      {/* Clubs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {clubs.map((club) => (
          <div
            key={club.id}
            className="bg-white rounded-2xl border border-[#CBD5E1] shadow-sm p-6 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">{club.club_name}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(club)}
                    className="p-2 text-slate-400 hover:text-[#7C3AED] hover:bg-slate-50 rounded-xl transition-colors"
                    title="Edit Club / Coordinator"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 font-bold">
                    <Building2 className="w-5 h-5" />
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-500 mt-3 line-clamp-2 leading-relaxed">
                {club.description || 'No description provided.'}
              </p>

              {/* Coordinator info */}
              <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#EDE9FE] text-[#7C3AED] flex items-center justify-center font-bold text-xs border border-[#DDD6FE]">
                  <User className="w-4 h-4" />
                </div>
                <div className="text-xs overflow-hidden">
                  <p className="font-bold text-slate-900 truncate">
                    {club.coordinator_name || 'Coordinator Unassigned'}
                  </p>
                  <p className="text-slate-400 text-[11px] truncate">
                    {club.coordinator_email || 'Awaiting assignment'}
                  </p>
                </div>
              </div>
            </div>

            {/* Metrics Footer with Interactive Drilldowns */}
            <div className="mt-6 pt-4 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-xs">
              <button
                type="button"
                onClick={() => navigate(`/admin/members?club=${encodeURIComponent(club.club_name)}&type=all`)}
                className="p-2 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200/60 hover:border-[#7C3AED]/40 transition-all cursor-pointer group text-left sm:text-center hover:scale-[1.02] active:scale-[0.98]"
                title={`View all members in ${club.club_name}`}
              >
                <p className="text-slate-400 text-[10px] font-bold uppercase group-hover:text-[#7C3AED] transition-colors">
                  Total ↗
                </p>
                <p className="text-base font-extrabold text-slate-900 mt-0.5">{club.total_members}</p>
              </button>

              <button
                type="button"
                onClick={() => navigate(`/admin/members?club=${encodeURIComponent(club.club_name)}&status=approved`)}
                className="p-2 bg-emerald-50/60 hover:bg-emerald-100/70 rounded-xl border border-emerald-100 hover:border-emerald-300 transition-all cursor-pointer group text-left sm:text-center hover:scale-[1.02] active:scale-[0.98]"
                title={`View approved members in ${club.club_name}`}
              >
                <p className="text-[#16A34A] text-[10px] font-bold uppercase group-hover:text-emerald-700 transition-colors">
                  Approved ↗
                </p>
                <p className="text-base font-extrabold text-[#16A34A] mt-0.5">{club.approved_members}</p>
              </button>

              <button
                type="button"
                onClick={() => navigate(`/admin/reports?club=${encodeURIComponent(club.club_name)}`)}
                className="p-2 bg-purple-50/60 hover:bg-purple-100/70 rounded-xl border border-purple-100 hover:border-purple-300 transition-all cursor-pointer group text-left sm:text-center hover:scale-[1.02] active:scale-[0.98]"
                title={`View event reports for ${club.club_name}`}
              >
                <p className="text-[#7C3AED] text-[10px] font-bold uppercase group-hover:text-[#6D28D9] transition-colors">
                  Events ↗
                </p>
                <p className="text-base font-extrabold text-[#7C3AED] mt-0.5">{club.total_events}</p>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Club Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Add New Club"
        subtitle="Create club details and assign a coordinator"
      >
        <form onSubmit={handleCreateClub} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Club Name</label>
            <input
              type="text"
              required
              value={clubName}
              onChange={(e) => setClubName(e.target.value)}
              placeholder="e.g. AI Club"
              className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs font-medium text-[#0F172A] focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs font-medium text-[#0F172A] focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
            >
              <option value="Technical">Technical</option>
              <option value="Non-Technical">Non-Technical</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mission, scope, and objectives of the club..."
              className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs font-medium text-[#0F172A] focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
            />
          </div>

          {/* Coordinator Section */}
          <div className="pt-3 border-t border-slate-100 space-y-3">
            <p className="text-xs font-bold text-[#7C3AED] uppercase tracking-wider flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-[#7C3AED]" />
              <span>Assign Club Coordinator</span>
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Coordinator Name</label>
                <input
                  type="text"
                  value={coordName}
                  onChange={(e) => setCoordName(e.target.value)}
                  placeholder="e.g. John Smith"
                  className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs font-medium text-[#0F172A]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Coordinator Email</label>
                <input
                  type="email"
                  value={coordEmail}
                  onChange={(e) => setCoordEmail(e.target.value)}
                  placeholder="john.coord@club.edu"
                  className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs font-medium text-[#0F172A]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Coordinator Password
              </label>
              <div className="relative">
                <input
                  type={showAddPassword ? 'text' : 'password'}
                  value={coordPassword}
                  onChange={(e) => setCoordPassword(e.target.value)}
                  placeholder="Default: Coord@123"
                  className="w-full pl-3 pr-10 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs font-medium text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
                />
                <button
                  type="button"
                  onClick={() => setShowAddPassword(!showAddPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  title={showAddPassword ? 'Hide password' : 'Show password'}
                >
                  {showAddPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-4 py-2 bg-white border border-[#CBD5E1] text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-sm shadow-[#7C3AED]/20 transition-colors"
            >
              {submitting ? 'Creating...' : 'Create Club'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Club Modal */}
      <Modal
        isOpen={!!editingClub}
        onClose={() => setEditingClub(null)}
        title="Edit Club & Coordinator"
        subtitle={`Updating "${editingClub?.club_name}"`}
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Club Name</label>
            <input
              type="text"
              required
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs font-medium text-[#0F172A] focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Category</label>
            <select
              value={editCategory}
              onChange={(e) => setEditCategory(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs font-medium text-[#0F172A] focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
            >
              <option value="Technical">Technical</option>
              <option value="Non-Technical">Non-Technical</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Description</label>
            <textarea
              rows={2}
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs font-medium text-[#0F172A] focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
            />
          </div>

          {/* Coordinator Section */}
          <div className="pt-3 border-t border-slate-100 space-y-3">
            <p className="text-xs font-bold text-[#7C3AED] uppercase tracking-wider flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-[#7C3AED]" />
              <span>Assigned Coordinator Details</span>
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Coordinator Name</label>
                <input
                  type="text"
                  value={editCoordName}
                  onChange={(e) => setEditCoordName(e.target.value)}
                  placeholder="e.g. John Smith"
                  className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs font-medium text-[#0F172A]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Coordinator Email</label>
                <input
                  type="email"
                  value={editCoordEmail}
                  onChange={(e) => setEditCoordEmail(e.target.value)}
                  placeholder="john.coord@club.edu"
                  className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs font-medium text-[#0F172A]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showEditPassword ? 'text' : 'password'}
                  value={editCoordPassword}
                  onChange={(e) => setEditCoordPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-3 pr-10 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs font-medium text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
                />
                <button
                  type="button"
                  onClick={() => setShowEditPassword(!showEditPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  title={showEditPassword ? 'Hide password' : 'Show password'}
                >
                  {showEditPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setEditingClub(null)}
              className="px-4 py-2 bg-white border border-[#CBD5E1] text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingEdit}
              className="px-4 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-sm shadow-[#7C3AED]/20 transition-colors"
            >
              {savingEdit ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};


