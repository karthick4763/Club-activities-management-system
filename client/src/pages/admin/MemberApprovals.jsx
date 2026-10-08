import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import { StatusBadge } from '../../components/StatusBadge';
import { Modal } from '../../components/Modal';
import { RemarksModal } from '../../components/RemarksModal';
import { 
  UserCheck, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Trash2, 
  Briefcase, 
  GraduationCap, 
  Mail, 
  Phone, 
  MessageSquare 
} from 'lucide-react';

export const MemberApprovals = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const parseType = (val) => {
    if (!val) return 'ALL';
    const v = val.toLowerCase();
    if (v === 'students' || v === 'student') return 'STUDENT';
    if (v === 'alumni') return 'ALUMNI';
    if (v === 'all') return 'ALL';
    return 'ALL';
  };

  const parseStatus = (val, currentType) => {
    if (!val) {
      if (currentType === 'STUDENT') return 'APPROVED';
      if (currentType === 'ALL') return 'ALL';
      return 'ALL';
    }
    const v = val.toLowerCase();
    if (v === 'pending') return 'PENDING';
    if (v === 'approved') return 'APPROVED';
    if (v === 'rejected') return 'REJECTED';
    if (v === 'all') return 'ALL';
    return 'ALL';
  };

  const initialType = parseType(searchParams.get('type'));
  const initialStatus = parseStatus(searchParams.get('status'), initialType);

  const [members, setMembers] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClub, setSelectedClub] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState(initialType);
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [search, setSearch] = useState('');

  // Remarks Popup State
  const [remarksPopup, setRemarksPopup] = useState({
    isOpen: false,
    remarks: '',
    title: '',
    subtitle: ''
  });

  // Action Modal State
  const [activeMember, setActiveMember] = useState(null);
  const [modalType, setModalType] = useState('APPROVE');
  const [remarks, setRemarks] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchClubs = async () => {
    try {
      const res = await axiosClient.get('/clubs');
      if (res.data.success) {
        setClubs(res.data.clubs);
      }
    } catch (err) {
      console.error('Error fetching clubs:', err);
    }
  };

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get('/members', {
        params: {
          club_id: selectedClub,
          member_type: typeFilter,
          status: statusFilter,
          search
        }
      });
      if (res.data.success) {
        setMembers(res.data.members);
      }
    } catch (err) {
      console.error('Error fetching members:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClubs();
  }, []);

  // Sync state from URL parameters whenever searchParams or clubs change
  useEffect(() => {
    const typeParam = searchParams.get('type');
    const statusParam = searchParams.get('status');
    const clubParam = searchParams.get('club');

    const nextType = parseType(typeParam);
    const nextStatus = parseStatus(statusParam, nextType);

    setTypeFilter(nextType);
    setStatusFilter(nextStatus);

    if (clubParam) {
      if (clubs.length > 0) {
        const found = clubs.find(
          c => String(c.id) === clubParam || c.club_name.toLowerCase() === clubParam.toLowerCase()
        );
        if (found) {
          setSelectedClub(found.id);
        } else if (clubParam.toUpperCase() === 'ALL') {
          setSelectedClub('ALL');
        }
      }
    } else {
      setSelectedClub('ALL');
    }
  }, [searchParams, clubs]);

  const updateFilters = (newType, newStatus, newClub) => {
    const nextType = newType !== undefined ? newType : typeFilter;
    const nextStatus = newStatus !== undefined ? newStatus : statusFilter;
    const nextClub = newClub !== undefined ? newClub : selectedClub;

    if (newType !== undefined) setTypeFilter(newType);
    if (newStatus !== undefined) setStatusFilter(newStatus);
    if (newClub !== undefined) setSelectedClub(newClub);

    const params = {};
    if (nextType === 'STUDENT') params.type = 'students';
    else if (nextType === 'ALUMNI') params.type = 'alumni';
    else if (nextType === 'ALL') params.type = 'all';

    if (nextStatus) params.status = nextStatus.toLowerCase();

    if (nextClub && nextClub !== 'ALL') {
      const matchedClub = clubs.find(c => String(c.id) === String(nextClub));
      params.club = matchedClub ? matchedClub.club_name : nextClub;
    }

    setSearchParams(params, { replace: true });
  };

  useEffect(() => {
    fetchMembers();
  }, [selectedClub, typeFilter, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchMembers();
  };

  const handleStatusChange = async (member, newStatus) => {
    if (newStatus === member.status) return;

    if (newStatus === 'REJECTED') {
      setActiveMember(member);
      setModalType('REJECT');
      setRemarks(member.admin_remarks || '');
      return;
    }

    try {
      setProcessing(true);
      await axiosClient.put(`/members/${member.id}/status`, { status: newStatus });
      fetchMembers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    } finally {
      setProcessing(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      setProcessing(true);
      await axiosClient.put(`/members/${id}/status`, { status: 'APPROVED' });
      setActiveMember(null);
      fetchMembers();
    } catch (err) {
      alert(err.response?.data?.message || 'Approval failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (id) => {
    try {
      setProcessing(true);
      await axiosClient.put(`/members/${id}/status`, { status: 'REJECTED', remarks });
      setActiveMember(null);
      setRemarks('');
      fetchMembers();
    } catch (err) {
      alert(err.response?.data?.message || 'Rejection failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleToggleRole = async (member) => {
    const nextRole = member.role === 'COORDINATOR' ? 'MEMBER' : 'COORDINATOR';
    if (nextRole === 'COORDINATOR' && member.member_type !== 'STUDENT') {
      alert('Only student members can become coordinator. Alumni members cannot become coordinator.');
      return;
    }
    const confirmMsg = nextRole === 'COORDINATOR'
      ? `Promote "${member.name}" to Coordinator?`
      : `Demote "${member.name}" back to Member?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      setProcessing(true);
      await axiosClient.put(`/members/${member.id}/role`, { role: nextRole });
      fetchMembers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update member role');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Club Members & Directory
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Review and authorize newly submitted Alumni outreach connections, student rosters, and club memberships.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-5 rounded-2xl border border-[#CBD5E1] shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search member name, email, batch..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs font-medium text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
          />
        </form>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Member Type Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            {[
              { id: 'ALUMNI', label: 'Alumni', icon: Briefcase },
              { id: 'STUDENT', label: 'Students', icon: GraduationCap },
              { id: 'ALL', label: 'All Records', icon: UserCheck }
            ].map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => updateFilters(t.id, undefined, undefined)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    typeFilter === t.id
                      ? 'bg-[#7C3AED] text-white shadow-sm'
                      : 'text-slate-600 hover:text-[#7C3AED]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          {/* Club Filter */}
          <select
            value={selectedClub}
            onChange={(e) => updateFilters(undefined, undefined, e.target.value)}
            className="px-3 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs font-semibold text-[#0F172A] focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
          >
            <option value="ALL">All Clubs</option>
            {clubs.map((c) => (
              <option key={c.id} value={c.id}>
                {c.club_name}
              </option>
            ))}
          </select>

          {/* Status Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            {['PENDING', 'APPROVED', 'REJECTED', 'ALL'].map((s) => (
              <button
                key={s}
                onClick={() => updateFilters(undefined, s, undefined)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  statusFilter === s
                    ? 'bg-[#7C3AED] text-white shadow-sm'
                    : 'text-slate-600 hover:text-[#7C3AED]'
                }`}
              >
                {s === 'ALL' ? 'All Status' : s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h2 className="text-sm font-bold text-slate-900">
            Showing {members.length} Member Application{members.length !== 1 ? 's' : ''}
          </h2>
          <span className="text-xs text-slate-500">
            Approve or reject alumni applications, and assign coordinator roles to student members
          </span>
        </div>

        {members.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <UserCheck className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-700">No applications match criteria</p>
            <p className="text-xs text-slate-400 mt-1">Try clearing filters or changing status or type selection.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-6">Member Profile</th>
                  <th className="py-3.5 px-4">Club</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Classification Details</th>
                  <th className="py-3.5 px-4">Contact Info</th>
                  <th className="py-3.5 px-4">Status / Role</th>
                  <th className="py-3.5 px-4 text-center">Remarks</th>
                  <th className="py-3.5 px-6 text-right">Delete</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {members.map((m) => {
                  const isAlumni = m.member_type === 'ALUMNI';
                  const hasRemarks = Boolean(m.admin_remarks);

                  return (
                    <tr key={m.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-900 text-sm">{m.name}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Submitted: {new Date(m.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="py-4 px-4 font-semibold text-slate-800">
                        <span className="px-2.5 py-1 rounded-md bg-purple-50 text-[#7C3AED] font-bold text-[11px] border border-purple-100">
                          {m.club_name}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-extrabold text-[11px] border ${
                          isAlumni
                            ? 'bg-purple-50 text-[#7C3AED] border-purple-200'
                            : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                        }`}>
                          {isAlumni ? <Briefcase className="w-3 h-3" /> : <GraduationCap className="w-3 h-3" />}
                          <span>{isAlumni ? 'Alumni' : 'Student'}</span>
                        </span>
                      </td>
                      <td className="py-4 px-4 text-slate-700 font-medium">
                        {isAlumni ? (
                          <div>
                            <div className="font-bold text-slate-900">
                              Batch: <span className="text-[#7C3AED] font-semibold">{m.batch || 'N/A'}</span>
                            </div>
                            {(m.company || m.domain || m.position) && (
                              <div className="text-[11px] text-purple-700 font-semibold mt-0.5">
                                {[m.position, m.company].filter(Boolean).join(' at ')}
                                {m.domain ? ` • ${m.domain}` : ''}
                              </div>
                            )}
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              {m.gender ? `Gender: ${m.gender}` : ''} {m.dob ? `• DOB: ${m.dob}` : ''}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="font-bold text-slate-900">
                              Dept: <span className="text-indigo-700 font-semibold">{m.department || 'N/A'}</span>
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              Year: {m.year || 'N/A'}
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4 text-slate-600 space-y-0.5">
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span>{m.email}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{m.phone}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        {isAlumni ? (
                          /* Interactive Status Dropdown for Alumni */
                          <div className="inline-block relative">
                            <select
                              value={m.status}
                              onChange={(e) => handleStatusChange(m, e.target.value)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 ${
                                m.status === 'APPROVED'
                                  ? 'bg-emerald-50 text-[#16A34A] border-emerald-300 hover:bg-emerald-100'
                                  : m.status === 'REJECTED'
                                  ? 'bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100'
                                  : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                              }`}
                            >
                              <option value="PENDING" className="bg-white text-slate-800 font-semibold">PENDING</option>
                              <option value="APPROVED" className="bg-white text-slate-800 font-semibold">APPROVED</option>
                              <option value="REJECTED" className="bg-white text-slate-800 font-semibold">REJECTED</option>
                            </select>
                          </div>
                        ) : (
                          /* Student Role Control */
                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold border ${
                              m.role === 'COORDINATOR'
                                ? 'bg-purple-50 text-[#7C3AED] border-purple-200'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}>
                              {m.role === 'COORDINATOR' ? 'Coordinator' : 'Member'}
                            </span>
                            <button
                              type="button"
                              disabled={processing}
                              onClick={() => handleToggleRole(m)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border ${
                                m.role === 'COORDINATOR'
                                  ? 'bg-white text-[#7C3AED] border-[#CBD5E1] hover:bg-purple-50'
                                  : 'bg-[#7C3AED] text-white border-[#7C3AED] hover:bg-[#5B21B6]'
                              }`}
                            >
                              {m.role === 'COORDINATOR' ? 'Make Member' : 'Make Coordinator'}
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setRemarksPopup({
                              isOpen: true,
                              remarks: m.admin_remarks || 'No remarks recorded.',
                              title: 'Admin Remarks',
                              subtitle: m.name
                            });
                          }}
                          className={`p-2 rounded-xl transition-all inline-flex items-center justify-center ${
                            hasRemarks
                              ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 shadow-sm'
                              : 'bg-slate-50 text-slate-400 hover:bg-slate-100 border border-slate-200'
                          }`}
                          title={hasRemarks ? 'View recorded remarks' : 'No remarks'}
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={async () => {
                            if (!window.confirm(`Are you sure you want to delete member record "${m.name}"?`)) return;
                            try {
                              await axiosClient.delete(`/members/${m.id}`);
                              fetchMembers();
                            } catch (err) {
                              alert(err.response?.data?.message || 'Failed to delete member');
                            }
                          }}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors inline-flex items-center"
                          title="Delete Member Record"
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
      </div>

      {/* Confirmation / Remarks Modal for Rejection */}
      <Modal
        isOpen={!!activeMember}
        onClose={() => setActiveMember(null)}
        title={modalType === 'APPROVE' ? 'Approve Member Application' : 'Reject Member Application'}
        subtitle={`Action for ${activeMember?.name} • ${activeMember?.club_name}`}
      >
        <div className="space-y-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-[#CBD5E1] space-y-1 text-xs">
            <p><span className="font-bold">Applicant:</span> {activeMember?.name}</p>
            <p><span className="font-bold">Type:</span> {activeMember?.member_type}</p>
            <p><span className="font-bold">Email:</span> {activeMember?.email}</p>
            <p><span className="font-bold">{activeMember?.member_type === 'ALUMNI' ? 'Batch:' : 'Department:'}</span> {activeMember?.member_type === 'ALUMNI' ? activeMember?.batch : `${activeMember?.department} • ${activeMember?.year}`}</p>
            <p><span className="font-bold">Club:</span> {activeMember?.club_name}</p>
          </div>

          {modalType === 'REJECT' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Remarks or Reason for Rejection
              </label>
              <textarea
                rows={3}
                required
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Specify reasons such as eligibility mismatch or duplicate entry..."
                className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs font-medium text-[#0F172A] focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              onClick={() => setActiveMember(null)}
              className="px-4 py-2 bg-white border border-[#CBD5E1] text-[#7C3AED] hover:bg-purple-50 rounded-xl text-xs font-bold transition-colors"
            >
              Cancel
            </button>
            {modalType === 'APPROVE' ? (
              <button
                onClick={() => handleApprove(activeMember.id)}
                disabled={processing}
                className="px-4 py-2 bg-[#16A34A] hover:bg-[#15803d] text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-200 transition-colors flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm Approve</span>
              </button>
            ) : (
              <button
                onClick={() => handleReject(activeMember.id)}
                disabled={processing || !remarks.trim()}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-200 transition-colors flex items-center gap-1.5"
              >
                <XCircle className="w-4 h-4" />
                <span>Confirm Reject</span>
              </button>
            )}
          </div>
        </div>
      </Modal>

      {/* Remarks Popup */}
      <RemarksModal
        isOpen={remarksPopup.isOpen}
        onClose={() => setRemarksPopup({ ...remarksPopup, isOpen: false })}
        title={remarksPopup.title}
        subtitle={remarksPopup.subtitle}
        remarks={remarksPopup.remarks}
      />
    </div>
  );
};

