import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../context/AuthContext';
import { StatCard } from '../../components/StatCard';
import { ProgressBar } from '../../components/ProgressBar';
import { StatusBadge } from '../../components/StatusBadge';
import { RemarksModal } from '../../components/RemarksModal';
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
  ArrowRight
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

      {/* Unified 4-Card KPI Metric Grid Structure */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Total Club Members"
          value={kpis.total_members || 0}
          subtitle={`${kpis.student_members || 0} Students • ${kpis.alumni_members || 0} Alumni`}
          icon={Users}
          color="purple"
          clickable={true}
          onClick={() => navigate('/coordinator/members?type=all')}
        />
        <StatCard
          title="Student Members"
          value={kpis.student_members || 0}
          subtitle="Auto-approved regular members"
          icon={CheckCircle2}
          color="emerald"
          clickable={true}
          onClick={() => navigate('/coordinator/members?type=students')}
        />
        <StatCard
          title="Alumni Target Goal"
          value={`${kpis.monthly_approved || 0} / ${kpis.target_members || 0}`}
          subtitle={`${kpis.monthly_pending || 0} Pending Alumni approvals`}
          icon={Target}
          color="amber"
          badge={kpis.monthly_pending > 0 ? `${kpis.monthly_pending} Pending` : 'Target Tracking'}
          clickable={true}
          onClick={() => navigate('/coordinator/members?type=alumni&status=pending')}
        />
        <StatCard
          title="Events Conducted"
          value={`${kpis.completed_events || 0} / ${kpis.total_events || 0}`}
          subtitle={`${kpis.rescheduled_events || 0} Rescheduled activities`}
          icon={Calendar}
          color="purple"
          clickable={true}
          onClick={() => navigate('/coordinator/events')}
        />
      </div>

      {/* Target Progress Card */}
      <div className="bg-white rounded-3xl border border-[#CBD5E1] p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#7C3AED] bg-purple-50 px-2.5 py-1 rounded-full border border-purple-100">
              Monthly Alumni Outreach Target Goal
            </span>
            <h2 className="text-xl font-extrabold text-slate-900 mt-2">
              Performance for {currentMonthLabel} {year}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Only approved <strong>Alumni members</strong> count toward achieving this target. Student members are auto-approved.
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400 font-bold uppercase">Alumni Goal Status</span>
            <p className="text-lg font-extrabold text-[#7C3AED]">
              {kpis.monthly_approved || 0} / {kpis.target_members || 0} Alumni Recruited
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <ProgressBar
            current={kpis.monthly_approved || 0}
            target={kpis.target_members || 0}
            size="lg"
          />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/60">
              <p className="text-[11px] font-bold uppercase text-slate-400">Target Goal</p>
              <p className="text-2xl font-extrabold text-slate-900 mt-0.5">{kpis.target_members || 0}</p>
            </div>
            <div className="p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-100">
              <p className="text-[11px] font-bold uppercase text-[#16A34A]">Approved Alumni</p>
              <p className="text-2xl font-extrabold text-[#16A34A] mt-0.5">{kpis.monthly_approved || 0}</p>
            </div>
            <div className="p-3.5 bg-amber-50/70 rounded-2xl border border-amber-100">
              <p className="text-[11px] font-bold uppercase text-amber-700">Pending Review</p>
              <p className="text-2xl font-extrabold text-amber-700 mt-0.5">{kpis.monthly_pending || 0}</p>
            </div>
            <div className="p-3.5 bg-purple-50/70 rounded-2xl border border-purple-100">
              <p className="text-[11px] font-bold uppercase text-[#7C3AED]">Remaining to Goal</p>
              <p className="text-2xl font-extrabold text-[#7C3AED] mt-0.5">{kpis.remaining_target || 0}</p>
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
            <p className="text-xs text-slate-500 mt-0.5">
              Showing scheduled activities for {currentMonthLabel} {year}.
            </p>
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

      {/* Remarks Modal */}
      <RemarksModal
        isOpen={!!selectedRemarksEvent}
        onClose={() => setSelectedRemarksEvent(null)}
        event={selectedRemarksEvent}
      />
    </div>
  );
};
