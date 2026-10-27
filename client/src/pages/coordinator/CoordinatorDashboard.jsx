import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../context/AuthContext';
import { StatCard } from '../../components/StatCard';
import { ProgressBar } from '../../components/ProgressBar';
import { StatusBadge } from '../../components/StatusBadge';
import { RemarksModal } from '../../components/RemarksModal';
import { Modal } from '../../components/Modal';
import { 
  Building2, 
  Users, 
  Target, 
  Calendar, 
  Clock, 
  Download, 
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Filter,
  Check,
  ArrowRight,
  Sliders,
  Save,
  Database,
  Award,
  Sparkles,
  UserCheck,
  Eye
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

export const CoordinatorDashboard = () => {
  const { user, isMember } = useAuth();
  const navigate = useNavigate();

  const [month, setMonth] = useState('ALL'); // Default to Whole Year overview
  const [year, setYear] = useState(2026);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedRemarksEvent, setSelectedRemarksEvent] = useState(null);

  // Club Baseline Modal state
  const [isBaselineModalOpen, setIsBaselineModalOpen] = useState(false);
  const [existingAlumniInput, setExistingAlumniInput] = useState(0);
  const [existingEventsInput, setExistingEventsInput] = useState(0);
  const [savingBaseline, setSavingBaseline] = useState(false);
  const [baselineSuccessMsg, setBaselineSuccessMsg] = useState('');

  const fetchCoordinatorData = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get('/dashboard/coordinator', {
        params: { month, year }
      });
      if (res.data.success) {
        setDashboardData(res.data);
      }
    } catch (err) {
      console.error('Error fetching coordinator dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBaseline = async (e) => {
    e.preventDefault();
    if (!dashboardData?.club?.id) return;
    try {
      setSavingBaseline(true);
      await axiosClient.put(`/clubs/${dashboardData.club.id}/baseline`, {
        existing_alumni_count: Number(existingAlumniInput),
        existing_events_completed_count: Number(existingEventsInput)
      });
      setBaselineSuccessMsg('Club baseline counts updated successfully!');
      setTimeout(() => {
        setIsBaselineModalOpen(false);
        setBaselineSuccessMsg('');
      }, 800);
      fetchCoordinatorData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update baseline counts');
    } finally {
      setSavingBaseline(false);
    }
  };

  useEffect(() => {
    fetchCoordinatorData();
  }, [month, year]);

  const kpis = dashboardData?.kpis || {};
  const currentMonthLabel = MONTHS.find(m => String(m.value) === String(month))?.label || 'Selected Period';

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Club Container Header Banner (Unified Purple Gradient Theme) */}
      <div className="bg-gradient-to-r from-[#7C3AED] via-[#6D28D9] to-[#8B5CF6] rounded-3xl p-6 sm:p-8 text-white shadow-lg shadow-purple-500/10 flex flex-col md:flex-row md:items-center justify-between gap-6 border border-purple-400/20">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/10 text-purple-100 border border-white/20">
              {isMember ? 'Member Workspace • Read Only' : 'Coordinator Workspace'}
            </span>
            <span className="text-xs text-purple-100">
              {isMember ? 'Logged in as: ' : 'Coordinator: '}<strong>{user?.name}</strong>
            </span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight mt-2 text-white">
            {dashboardData?.club?.club_name || user?.club_name}
          </h1>
          <p className="text-sm text-purple-100/90 mt-1 max-w-2xl leading-relaxed">
            {dashboardData?.club?.description || (isMember ? 'View club recruitment progress, events, and member directory in read-only mode.' : 'Overview of recruitment targets, events, and club activities.')}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {isMember ? (
            <>
              <button
                onClick={() => navigate('/coordinator/events')}
                className="px-4 py-2.5 bg-white text-[#7C3AED] hover:bg-purple-50 font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2 justify-center"
              >
                <Calendar className="w-4 h-4" />
                <span>Explore Events</span>
              </button>
              <button
                onClick={() => navigate('/coordinator/members')}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/20 transition-all flex items-center gap-2 justify-center"
              >
                <Users className="w-4 h-4" />
                <span>Club Directory</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  setExistingAlumniInput(dashboardData?.club?.existing_alumni_count ?? 0);
                  setExistingEventsInput(dashboardData?.club?.existing_events_completed_count ?? 0);
                  setIsBaselineModalOpen(true);
                }}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/20 transition-all flex items-center gap-2 justify-center shadow-sm"
                title="Configure pre-existing alumni count and already completed events count"
              >
                <Sliders className="w-4 h-4" />
                <span>Club Baseline Counts</span>
              </button>
              <button
                onClick={() => navigate('/coordinator/events')}
                className="px-4 py-2.5 bg-white text-[#7C3AED] hover:bg-purple-50 font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2 justify-center"
              >
                <Calendar className="w-4 h-4" />
                <span>Schedule Event</span>
              </button>
              <button
                onClick={() => navigate('/coordinator/action-plan')}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/20 transition-all flex items-center gap-2 justify-center"
              >
                <Target className="w-4 h-4" />
                <span>Manage Action Plan</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Dynamic Filter Controls & Timeframe Selector */}
      <div className="bg-white p-5 rounded-3xl border border-[#CBD5E1] shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0F172A]">
          <Filter className="w-4 h-4 text-[#7C3AED]" />
          <span>Dashboard Period & Filters: <strong>{currentMonthLabel} {year === 'ALL' ? 'All Years' : year}</strong></span>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="px-3 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs font-bold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
          >
            {MONTHS.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="px-3 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs font-bold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
          >
            <option value="ALL">All Years</option>
            <option value={2025}>2025</option>
            <option value={2026}>2026</option>
            <option value={2027}>2027</option>
          </select>
        </div>
      </div>

      {/* Membership Overview Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard
          title="Total Club Members"
          value={kpis.total_members || 0}
          subtitle={`${kpis.student_members || 0} Students • ${kpis.actual_alumni || 0} Alumni`}
          icon={Users}
          color="purple"
          clickable={true}
          onClick={() => navigate('/coordinator/members?type=all')}
        />
        <StatCard
          title="Student Members"
          value={kpis.student_members || 0}
          subtitle="Auto-approved regular student members"
          icon={CheckCircle2}
          color="emerald"
          clickable={true}
          onClick={() => navigate('/coordinator/members?type=students')}
        />
      </div>

      {/* 1. Alumni Outreach & Recruitment: Dedicated Count Buttons */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#7C3AED]"></span>
            <h2 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
              Alumni Outreach & Recruitment Breakdown
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 font-medium">Click any count button to view list</span>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Actual Alumni"
            value={kpis.actual_alumni || 0}
            subtitle="Verified alumni network"
            icon={Users}
            color="purple"
            badge={`${kpis.progress_percent || 0}% Goal`}
            clickable={true}
            onClick={() => navigate('/coordinator/members?type=alumni')}
          />
          <StatCard
            title="Target Goal"
            value={kpis.target_members || 0}
            subtitle="Recruitment target"
            icon={Target}
            color="indigo"
            clickable={true}
            onClick={() => navigate('/coordinator/action-plan')}
          />
          <StatCard
            title="New Members"
            value={kpis.monthly_approved || kpis.portal_approved_alumni || 0}
            subtitle="Portal verified additions"
            icon={CheckCircle2}
            color="emerald"
            badge="Verified"
            clickable={true}
            onClick={() => navigate('/coordinator/members?type=alumni&status=approved&enrollment=new')}
          />
          <StatCard
            title="Pending Approvals"
            value={kpis.monthly_pending || 0}
            subtitle="Awaiting admin review"
            icon={AlertCircle}
            color="amber"
            badge={kpis.monthly_pending > 0 ? `${kpis.monthly_pending} Pending` : 'Zero Pending'}
            clickable={true}
            onClick={() => navigate('/coordinator/members?type=alumni&status=pending')}
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
          <span className="text-[11px] text-slate-400 font-medium">Click any count button to filter events</span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Events Completed"
            value={kpis.actual_completed_events || 0}
            subtitle="Conducted activities"
            icon={Award}
            color="emerald"
            badge="Conducted"
            clickable={true}
            onClick={() => navigate('/coordinator/events?status=COMPLETED')}
          />
          <StatCard
            title="Target Events"
            value={kpis.target_events || 0}
            subtitle="Goal for period"
            icon={Target}
            color="indigo"
            clickable={true}
            onClick={() => navigate('/coordinator/events')}
          />
          <StatCard
            title="New Portal Events"
            value={kpis.portal_completed_events || 0}
            subtitle="Completed this period"
            icon={Calendar}
            color="purple"
            clickable={true}
            onClick={() => navigate('/coordinator/events?status=COMPLETED')}
          />
          <StatCard
            title="Planned Events"
            value={kpis.planned_events || 0}
            subtitle="Scheduled upcoming"
            icon={Clock}
            color="amber"
            clickable={true}
            onClick={() => navigate('/coordinator/events?status=PLANNED')}
          />
        </div>
      </div>

      {/* Target Progress Dual-Grid Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alumni Outreach Progress Card */}
        <div className="bg-white rounded-3xl border border-[#CBD5E1] p-6 sm:p-8 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-4 pb-5 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#7C3AED] bg-purple-50 px-2.5 py-1 rounded-full border border-purple-100">
                  Alumni Outreach Performance
                </span>
                <h2 className="text-xl font-extrabold text-slate-900 mt-2">
                  Alumni Target • {currentMonthLabel} {year}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Actual Alumni: <strong>{kpis.existing_alumni || 0} Baseline</strong> + <strong>{kpis.monthly_approved || 0} Portal Approved</strong>
                </p>
              </div>

              <div className="text-right">
                <span className="text-[11px] text-slate-400 font-bold uppercase">Added / Target</span>
                <p className="text-lg font-extrabold text-[#7C3AED]">
                  {kpis.monthly_approved || 0} / {kpis.target_members || 0}
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <ProgressBar
                current={kpis.monthly_approved || 0}
                target={kpis.target_members || 0}
                size="lg"
                unit="new members"
              />

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 bg-purple-50/70 rounded-2xl border border-purple-100">
                  <p className="text-[10px] font-bold uppercase text-[#7C3AED]">Actual Alumni</p>
                  <p className="text-xl font-extrabold text-[#7C3AED] mt-0.5">{kpis.actual_alumni || 0}</p>
                  <p className="text-[9px] text-purple-600 font-medium">verified</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/60">
                  <p className="text-[10px] font-bold uppercase text-slate-400">Target Goal</p>
                  <p className="text-xl font-extrabold text-slate-900 mt-0.5">{kpis.target_members || 0}</p>
                  <p className="text-[9px] text-slate-400 font-medium">target</p>
                </div>
                <div className="p-3 bg-emerald-50/70 rounded-2xl border border-emerald-100">
                  <p className="text-[10px] font-bold uppercase text-[#16A34A]">New Added</p>
                  <p className="text-xl font-extrabold text-[#16A34A] mt-0.5">{kpis.monthly_approved || 0}</p>
                  <p className="text-[9px] text-emerald-600 font-medium">this month</p>
                </div>
                <div className="p-3 bg-amber-50/70 rounded-2xl border border-amber-100">
                  <p className="text-[10px] font-bold uppercase text-amber-700">Pending</p>
                  <p className="text-xl font-extrabold text-amber-700 mt-0.5">{kpis.monthly_pending || 0}</p>
                  <p className="text-[9px] text-amber-600 font-medium">review</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Events Conducted Progress Card */}
        <div className="bg-white rounded-3xl border border-[#CBD5E1] p-6 sm:p-8 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-4 pb-5 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#7C3AED] bg-purple-50 px-2.5 py-1 rounded-full border border-purple-100">
                  Events Completion Performance
                </span>
                <h2 className="text-xl font-extrabold text-slate-900 mt-2">
                  Completed Activities • {currentMonthLabel} {year}
                </h2>
              </div>

              <div className="text-right">
                <span className="text-[11px] text-slate-400 font-bold uppercase">Completed / Target</span>
                <p className="text-lg font-extrabold text-[#7C3AED]">
                  {kpis.portal_completed_events || 0} / {kpis.target_events || kpis.total_events || 0}
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <ProgressBar
                current={kpis.portal_completed_events || 0}
                target={kpis.target_events || kpis.total_events || 0}
                size="lg"
                unit="events"
              />

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 bg-emerald-50/70 rounded-2xl border border-emerald-100">
                  <p className="text-[10px] font-bold uppercase text-[#16A34A]">Completed</p>
                  <p className="text-xl font-extrabold text-[#16A34A] mt-0.5">{kpis.actual_completed_events || 0}</p>
                  <p className="text-[9px] text-emerald-600 font-medium">actual total</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/60">
                  <p className="text-[10px] font-bold uppercase text-slate-400">Target Events</p>
                  <p className="text-xl font-extrabold text-slate-900 mt-0.5">{kpis.target_events || kpis.total_events || 0}</p>
                  <p className="text-[9px] text-slate-400 font-medium">target</p>
                </div>
                <div className="p-3 bg-purple-50/70 rounded-2xl border border-purple-100">
                  <p className="text-[10px] font-bold uppercase text-[#7C3AED]">New Portal</p>
                  <p className="text-xl font-extrabold text-[#7C3AED] mt-0.5">{kpis.portal_completed_events || 0}</p>
                  <p className="text-[9px] text-purple-600 font-medium">this month</p>
                </div>
                <div className="p-3 bg-sky-50/70 rounded-2xl border border-sky-100">
                  <p className="text-[10px] font-bold uppercase text-sky-700">Scheduled</p>
                  <p className="text-xl font-extrabold text-sky-700 mt-0.5">{kpis.planned_events || 0}</p>
                  <p className="text-[9px] text-sky-600 font-medium">planned</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Events Overview List */}
      <div className="bg-white rounded-3xl border border-[#CBD5E1] shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Activities & Events Overview • {dashboardData?.events?.length || 0} Events
            </h2>
          </div>
          <button
            onClick={() => navigate('/coordinator/events')}
            className="text-xs font-bold text-[#7C3AED] hover:text-[#5B21B6] flex items-center gap-1.5"
          >
            <span>View All Events</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {dashboardData?.events?.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No events scheduled for {currentMonthLabel} {year}. Go to the <strong>Monthly Action Plan</strong> page to schedule activities.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {dashboardData?.events?.map((ev) => (
              <div
                key={ev.id}
                className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors"
              >
                <div className="space-y-2 max-w-3xl">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 bg-slate-100 text-slate-800 rounded-md font-bold text-[11px] border border-slate-200">
                      {ev.event_type}
                    </span>
                    <StatusBadge status={ev.status} />
                    <span className="text-[11px] font-semibold text-slate-500">
                      {ev.status === 'COMPLETED' ? '✓ Completed' : '○ Not Completed'}
                    </span>
                  </div>

                  <h4 className="text-base font-extrabold text-slate-900">{ev.event_name}</h4>
                  
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                    <span>📅 {ev.event_date} @ {ev.event_time}</span>
                    <span>📍 Venue: {ev.venue}</span>
                    {ev.alumni_details && (
                      <span className="text-slate-700 font-semibold">🎓 Alumni: {ev.alumni_details}</span>
                    )}
                  </div>
                </div>

                {/* Actions: Remarks Button & Report Download */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedRemarksEvent(ev)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all inline-flex items-center gap-1.5 ${
                      ev.remarks
                        ? 'bg-purple-50 hover:bg-purple-100 text-[#7C3AED] border-purple-200 shadow-sm'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-400 border-slate-200'
                    }`}
                    title={ev.remarks ? 'Click to view remarks' : 'No remarks recorded'}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>{ev.remarks ? 'Remarks' : 'None'}</span>
                  </button>

                  {ev.report_id ? (
                    <a
                      href={`/api/reports/download/${ev.report_id}`}
                      download
                      className="px-3 py-1.5 bg-[#7C3AED] hover:bg-[#5B21B6] text-white border border-[#7C3AED] rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-1.5 shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Report</span>
                    </a>
                  ) : (
                    <span className="text-slate-400 text-xs italic">No report</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Club Baseline Data Modal */}
      <Modal
        isOpen={isBaselineModalOpen}
        onClose={() => {
          setIsBaselineModalOpen(false);
          setBaselineSuccessMsg('');
        }}
        title="Configure Club Baseline Counts"
        subtitle={`Set pre-existing alumni members and historical completed events for ${dashboardData?.club?.club_name || 'your club'}`}
      >
        <form onSubmit={handleSaveBaseline} className="space-y-5">
          {baselineSuccessMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-[#16A34A] rounded-xl text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{baselineSuccessMsg}</span>
            </div>
          )}


          <div className="p-4 bg-purple-50/60 rounded-2xl border border-purple-100 text-xs text-purple-900 leading-relaxed space-y-1">
            <p className="font-bold flex items-center gap-1.5 text-[#7C3AED]">
              <Database className="w-3.5 h-3.5" />
              <span>Paper / Historical Baseline Counts</span>
            </p>
            <p className="text-slate-600">
              For historical paper records that have not been individually registered into the portal yet, you can maintain their baseline counts below. They will automatically be added to your <strong>Actual Alumni</strong> and <strong>Actual Completed Events</strong> totals.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Existing / Historical Alumni Member Count <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                max="10000"
                value={existingAlumniInput}
                onChange={(e) => setExistingAlumniInput(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-[#CBD5E1] rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
                placeholder="e.g. 15"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Total alumni registered in club records before portal adoption.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Already Completed Events Count <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                max="1000"
                value={existingEventsInput}
                onChange={(e) => setExistingEventsInput(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-[#CBD5E1] rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
                placeholder="e.g. 4"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Club activities and events already conducted and completed in previous terms.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsBaselineModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingBaseline}
              className="px-5 py-2.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold rounded-xl shadow-sm shadow-[#7C3AED]/20 transition-all flex items-center gap-2"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{savingBaseline ? 'Saving...' : 'Save Baseline Counts'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Remarks Modal */}
      <RemarksModal
        isOpen={!!selectedRemarksEvent}
        onClose={() => setSelectedRemarksEvent(null)}
        event={selectedRemarksEvent}
      />
    </div>
  );
};
