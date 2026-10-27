import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import { StatCard } from '../../components/StatCard';
import { ProgressBar } from '../../components/ProgressBar';
import { StatusBadge } from '../../components/StatusBadge';
import { Modal } from '../../components/Modal';
import { RemarksModal } from '../../components/RemarksModal';
import { 
  Building2, 
  Users, 
  UserCheck, 
  Calendar, 
  FileText, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Download, 
  Search,
  MessageSquare,
  Target,
  Database,
  Award,
  AlertCircle
} from 'lucide-react';

const MONTHS = [
  { value: 'ALL', label: 'Whole Year' },
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [allClubs, setAllClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState('ALL'); // Default to Whole Year
  const [year, setYear] = useState(2026);
  const [clubFilter, setClubFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Reschedule History Modal
  const [rescheduleHistory, setRescheduleHistory] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Remarks Modal State
  const [selectedRemarksEvent, setSelectedRemarksEvent] = useState(null);

  // Fetch complete club list once on mount
  useEffect(() => {
    const fetchClubsList = async () => {
      try {
        const res = await axiosClient.get('/clubs');
        if (res.data.success && res.data.clubs) {
          setAllClubs(res.data.clubs);
        }
      } catch (err) {
        console.error('Failed to load clubs list for dropdown:', err);
      }
    };
    fetchClubsList();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get('/dashboard/admin', {
        params: {
          month,
          year,
          club_id: clubFilter,
          status: statusFilter
        }
      });
      if (res.data.success) {
        setData(res.data);
        if (res.data.all_clubs && res.data.all_clubs.length > 0) {
          setAllClubs(res.data.all_clubs);
        }
      }
    } catch (err) {
      console.error('Failed to load admin dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [month, year, clubFilter, statusFilter]);

  const viewRescheduleHistory = async (eventId) => {
    try {
      setLoadingHistory(true);
      const res = await axiosClient.get(`/events/${eventId}/reschedules`);
      if (res.data.success) {
        setRescheduleHistory(res.data.history);
      }
    } catch (err) {
      console.error('Failed to fetch history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const kpis = data?.kpis || {};
  const currentMonthLabel = MONTHS.find(m => String(m.value) === String(month))?.label || 'Selected Period';

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Administrator Dashboard
        </h1>
      </div>

      {/* Global Combined Filter Bar at the TOP of Dashboard */}
      <div className="bg-white p-5 rounded-3xl border border-[#CBD5E1] shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0F172A]">
            <Filter className="w-4 h-4 text-[#7C3AED]" />
            <span>Dashboard Filter Controls</span>
          </div>
          <span className="text-[11px] font-semibold text-slate-400">
            Metrics dynamically adjust to selected filters
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Month / Year Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Month</label>
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs font-semibold text-[#0F172A] focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
            >
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* Year Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Year</label>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs font-semibold text-[#0F172A] focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
            >
              <option value="ALL">All Years</option>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
              <option value="2027">2027</option>
            </select>
          </div>

          {/* Club Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Club Filter</label>
            <select
              value={clubFilter}
              onChange={(e) => setClubFilter(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs font-semibold text-[#0F172A] focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
            >
              <option value="ALL">All Clubs</option>
              {(allClubs.length > 0 ? allClubs : (data?.all_clubs || data?.clubPerformance || [])).map((c) => (
                <option key={c.id || c.club_id} value={c.id || c.club_id}>
                  {c.club_name}
                </option>
              ))}
            </select>
          </div>

          {/* Event Status Filter */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Event Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs font-semibold text-[#0F172A] focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
            >
              <option value="ALL">All Event Statuses</option>
              <option value="COMPLETED">Completed</option>
              <option value="PLANNED">Planned</option>
              <option value="ONGOING">Ongoing</option>
              <option value="RESCHEDULED">Rescheduled</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Membership Overview Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard
          title="Total Members"
          value={kpis.total_members || 0}
          subtitle={`${kpis.student_members || 0} Students • ${kpis.actual_alumni || 0} Alumni (${kpis.existing_alumni || 0} Baseline + ${kpis.portal_approved_alumni || 0} Portal)`}
          icon={Users}
          color="indigo"
          clickable={true}
          onClick={() => navigate('/members?type=all&status=all')}
        />
        <StatCard
          title="Student Members"
          value={kpis.student_members || 0}
          subtitle="Auto-approved regular student members"
          icon={UserCheck}
          color="emerald"
          clickable={true}
          onClick={() => navigate('/members?type=students')}
        />
      </div>

      {/* 1. Alumni Outreach & Recruitment: Dedicated Count Buttons */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#7C3AED]"></span>
            <h2 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
              Alumni Outreach & Recruitment Breakdown
            </h2>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">Click any count button to view list</span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Actual Alumni"
            value={kpis.actual_alumni || 0}
            subtitle="Verified alumni network"
            icon={Building2}
            color="purple"
            badge="Verified"
            clickable={true}
            onClick={() => navigate('/members?type=alumni')}
          />
          <StatCard
            title="Target Goal"
            value={kpis.target_members || 0}
            subtitle="Recruitment target"
            icon={Target}
            color="indigo"
            clickable={true}
            onClick={() => {
              const el = document.getElementById('club-target-summary');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
          />
          <StatCard
            title="New Members"
            value={kpis.portal_approved_alumni || 0}
            subtitle="Portal verified additions"
            icon={CheckCircle2}
            color="emerald"
            badge="Verified"
            clickable={true}
            onClick={() => navigate('/members?type=alumni&status=approved')}
          />
          <StatCard
            title="Pending Approvals"
            value={kpis.pending_member_approvals || 0}
            subtitle="Awaiting admin review"
            icon={AlertCircle}
            color="amber"
            badge={kpis.pending_member_approvals > 0 ? `${kpis.pending_member_approvals} Pending` : 'All Clear'}
            clickable={true}
            onClick={() => navigate('/admin/members')}
          />
        </div>
      </div>

      {/* 2. Event Activities & Completion: Dedicated Count Buttons */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A]"></span>
            <h2 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
              Event Activities & Completion Breakdown
            </h2>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">Click any count button to filter activities</span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Actual Completed"
            value={kpis.actual_completed_events || 0}
            subtitle="Total verified events"
            icon={Award}
            color="emerald"
            badge="Conducted"
            clickable={true}
            onClick={() => navigate('/events-reports?status=COMPLETED')}
          />
          <StatCard
            title="Target Events"
            value={kpis.target_events || 0}
            subtitle="Goal for period"
            icon={Target}
            color="indigo"
            clickable={true}
            onClick={() => navigate('/events-reports')}
          />
          <StatCard
            title="New Completed"
            value={kpis.portal_completed_events || 0}
            subtitle="Conducted this month"
            icon={Calendar}
            color="purple"
            clickable={true}
            onClick={() => navigate('/events-reports?status=COMPLETED')}
          />
          <StatCard
            title="Planned Events"
            value={kpis.planned_events || 0}
            subtitle="Scheduled upcoming"
            icon={Clock}
            color="amber"
            clickable={true}
            onClick={() => navigate('/events-reports?status=PLANNED')}
          />
        </div>
      </div>

      {/* Club Target & Activity Summary */}
      <div id="club-target-summary" className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Club Target Performance Summary • {currentMonthLabel} {year === 'ALL' ? '' : year}
            </h2>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3 px-6">Club Name</th>
                <th className="py-3 px-4 text-center">Total Members</th>
                <th className="py-3 px-4 text-center">Students</th>
                <th className="py-3 px-4 text-center bg-slate-100/70 text-slate-700">Existing Baseline</th>
                <th className="py-3 px-4 text-center bg-purple-50/40 text-[#7C3AED]">Actual Alumni</th>
                <th className="py-3 px-4 text-center bg-purple-50/40 text-[#7C3AED]">Alumni Target</th>
                <th className="py-3 px-4 text-center">Pending Review</th>
                <th className="py-3 px-6 min-w-[160px]">Alumni Progress</th>
                <th className="py-3 px-4 text-center">Completed Events</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data?.clubPerformance?.map((club) => (
                <tr key={club.club_id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-4 px-6 font-bold text-slate-900 text-sm">
                    {club.club_name}
                  </td>
                  <td className="py-4 px-4 text-center font-bold text-slate-800 text-sm">
                    {club.total_members}
                  </td>
                  <td className="py-4 px-4 text-center font-semibold text-slate-600">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-[#16A34A] font-bold text-[11px] border border-emerald-200">
                      {club.student_members || 0}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center font-semibold text-slate-600 bg-slate-50/50">
                    <div className="text-[11px] font-bold text-slate-700">{club.existing_alumni_count || 0} Alumni</div>
                    <div className="text-[10px] text-slate-400">{club.existing_events_completed_count || 0} Events</div>
                  </td>
                  <td className="py-4 px-4 text-center font-bold text-[#16A34A] text-sm bg-purple-50/20">
                    <div>{club.actual_alumni}</div>
                    <div className="text-[10px] text-slate-400 font-normal">({club.existing_alumni_count || 0}b + {club.portal_approved_alumni || 0}p)</div>
                  </td>
                  <td className="py-4 px-4 text-center font-bold text-[#7C3AED] text-sm bg-purple-50/20">
                    {club.target_members}
                  </td>
                  <td className="py-4 px-4 text-center">
                    {club.pending_members > 0 ? (
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[11px]">
                        {club.pending_members} Pending
                      </span>
                    ) : (
                      <span className="text-slate-400 font-medium">0</span>
                    )}
                  </td>
                  <td className="py-4 px-6">
                    <ProgressBar
                      current={club.portal_approved_alumni}
                      target={club.target_members}
                      size="md"
                      unit="new members"
                    />
                  </td>
                  <td className="py-4 px-4 text-center font-bold text-slate-700">
                    <span className="text-[#16A34A]">{club.actual_completed_events}</span> / {club.target_events || club.total_events}
                    <div className="text-[10px] text-slate-400 font-normal">({club.existing_events_completed_count || 0}b + {club.portal_completed_events || 0}p)</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Filtered Events Table with Remarks & Report Downloads */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Filtered Events & Activities Overview • {data?.filteredEvents?.length || 0} Events
            </h2>
          </div>
        </div>

        {data?.filteredEvents?.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs font-medium">
            No events match the selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-3 px-6">Event Name & Type</th>
                  <th className="py-3 px-4">Club</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Venue</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-6 text-center">Remarks</th>
                  <th className="py-3 px-6 text-right">Actions / Report</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data?.filteredEvents?.map((event) => (
                  <tr key={event.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-6 font-bold text-slate-900">
                      <div>{event.event_name}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-[10px]">
                          {event.event_type}
                        </span>
                        {event.alumni_details && (
                          <span className="text-[11px] text-slate-400 font-normal">
                            Alumni: {event.alumni_details}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      <span className="px-2.5 py-1 rounded-md bg-purple-50 text-[#7C3AED] font-bold text-[11px] border border-purple-100">
                        {event.club_name}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-700">
                      {event.event_date} <span className="text-slate-400">@ {event.event_time}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {event.venue}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        <StatusBadge status={event.status} />
                        <p className="text-[10px] font-bold text-slate-500">
                          {event.status === 'COMPLETED' ? '✓ Completed' : '○ Not Completed'}
                        </p>
                      </div>
                    </td>
                    <td className="py-3.5 px-6 text-center">
                      <button
                        onClick={() => setSelectedRemarksEvent(event)}
                        className={`p-1.5 rounded-xl border transition-all inline-flex items-center gap-1.5 ${
                          event.remarks 
                            ? 'bg-purple-50 hover:bg-purple-100 text-[#7C3AED] border-purple-200 shadow-sm' 
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-400 border-slate-200'
                        }`}
                        title={event.remarks ? 'Click to view remarks box' : 'No remarks recorded'}
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold">{event.remarks ? 'View Remarks' : 'None'}</span>
                      </button>
                    </td>
                    <td className="py-3.5 px-6 text-right space-x-2">
                      {event.status === 'RESCHEDULED' && (
                        <button
                          onClick={() => viewRescheduleHistory(event.id)}
                          className="px-2.5 py-1 text-[11px] font-bold text-slate-700 bg-white hover:bg-slate-50 border border-[#CBD5E1] rounded-lg transition-colors inline-flex items-center gap-1"
                        >
                          <Clock className="w-3 h-3 text-[#7C3AED]" />
                          <span>History</span>
                        </button>
                      )}

                      {event.report_id ? (
                        <a
                          href={`/api/reports/download/${event.report_id}`}
                          download
                          className="px-2.5 py-1 text-[11px] font-bold text-white bg-[#7C3AED] hover:bg-[#5B21B6] rounded-lg transition-colors inline-flex items-center gap-1 shadow-sm"
                        >
                          <Download className="w-3 h-3" />
                          <span>Report</span>
                        </a>
                      ) : (
                        <span className="text-slate-400 text-[11px]">No Report</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reschedule History Modal */}
      <Modal
        isOpen={!!rescheduleHistory}
        onClose={() => setRescheduleHistory(null)}
        title="Event Reschedule Audit History"
        subtitle="Complete chronological timeline of date/time modifications"
      >
        <div className="space-y-4">
          {rescheduleHistory?.length === 0 ? (
            <p className="text-xs text-slate-500">No reschedule records found.</p>
          ) : (
            <div className="space-y-3">
              {rescheduleHistory?.map((item, idx) => (
                <div key={idx} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-slate-500 font-medium text-[11px]">
                    <span>Modified by: {item.rescheduled_by_name}</span>
                    <span>{new Date(item.created_at).toLocaleString()}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60 font-semibold">
                    <div className="text-rose-700">
                      <p className="text-[10px] text-slate-400 uppercase">Original Date</p>
                      <p>{item.old_date} @ {item.old_time}</p>
                    </div>
                    <div className="text-emerald-700">
                      <p className="text-[10px] text-slate-400 uppercase">Rescheduled Date</p>
                      <p>{item.new_date} @ {item.new_time}</p>
                    </div>
                  </div>
                  <div className="mt-2 pt-1.5 border-t border-slate-200/60">
                    <p className="text-[11px] text-slate-700"><span className="font-bold">Reason:</span> {item.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* Remarks Popup Modal */}
      <RemarksModal
        isOpen={!!selectedRemarksEvent}
        onClose={() => setSelectedRemarksEvent(null)}
        event={selectedRemarksEvent}
      />
    </div>
  );
};
