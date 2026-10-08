import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../context/AuthContext';
import { StatCard } from '../../components/StatCard';
import { StatusBadge } from '../../components/StatusBadge';
import { RemarksModal } from '../../components/RemarksModal';
import { 
  Building2, 
  Users, 
  Calendar, 
  FileText, 
  UserCheck, 
  Clock, 
  MapPin, 
  User, 
  MessageSquare, 
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Download
} from 'lucide-react';

export const MemberDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRemarksEvent, setSelectedRemarksEvent] = useState(null);

  useEffect(() => {
    const fetchMemberData = async () => {
      try {
        setLoading(true);
        // Fetch club dashboard & reports scoped to member's club
        const [dashRes, repRes] = await Promise.all([
          axiosClient.get('/dashboard/coordinator', { params: { month: 'ALL', year: 'ALL' } }),
          axiosClient.get('/reports')
        ]);

        if (dashRes.data.success) {
          setDashboardData(dashRes.data);
        }
        if (repRes.data.success) {
          setReports(repRes.data.reports || []);
        }
      } catch (err) {
        console.error('Error fetching member dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMemberData();
  }, []);

  const kpis = dashboardData?.kpis || {};
  const club = dashboardData?.club || {};
  const events = dashboardData?.events || [];

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Club Container Header Banner (Unified Purple Gradient Theme) */}
      <div className="bg-gradient-to-r from-[#7C3AED] via-[#6D28D9] to-[#8B5CF6] rounded-3xl p-6 sm:p-8 text-white shadow-lg shadow-purple-500/10 flex flex-col md:flex-row md:items-center justify-between gap-6 border border-purple-400/20">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/10 text-purple-100 border border-white/20">
              Student / Alumni Portal
            </span>
            <span className="text-xs text-purple-100">
              Welcome, <strong>{user?.name}</strong>
            </span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight mt-2 text-white">
            {club.club_name || user?.club_name || 'My Club'}
          </h1>
          <p className="text-sm text-purple-100/90 mt-1 max-w-2xl leading-relaxed">
            {club.description || 'Welcome to your club dashboard. View club activities, member directories, and event schedules.'}
          </p>
        </div>

        {/* Read-Only Interactive Navigation Privileges */}
        <div className="flex flex-col sm:flex-row gap-3">
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
        </div>
      </div>

      {/* Unified 4-Card KPI Metric Grid Structure (Aligned with Coordinator Dashboard) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Card 1: Total Club Members */}
        <StatCard
          title="Total Club Members"
          value={kpis.total_members || 0}
          subtitle={`${kpis.student_members || 0} Students • ${kpis.alumni_members || 0} Alumni`}
          icon={Users}
          color="purple"
          clickable={true}
          onClick={() => navigate('/coordinator/members?type=all')}
        />

        {/* Card 2: Student Members */}
        <StatCard
          title="Student Members"
          value={kpis.student_members || 0}
          subtitle="Auto-approved regular members"
          icon={CheckCircle2}
          color="emerald"
          clickable={true}
          onClick={() => navigate('/coordinator/members?type=students')}
        />

        {/* Card 3: Membership Status (Strictly Read-Only, No Editing Options) */}
        <StatCard
          title="Membership Status"
          value="APPROVED"
          subtitle={`Active regular member in ${user?.club_name || 'Club'}`}
          icon={UserCheck}
          color="emerald"
          badge="Verified"
          clickable={false}
        />

        {/* Card 4: Published Event Reports */}
        <StatCard
          title="Published Event Reports"
          value={reports.length}
          subtitle={`${events.length} Scheduled • ${events.filter(e => e.status === 'COMPLETED').length} Conducted`}
          icon={FileText}
          color="purple"
          clickable={true}
          onClick={() => navigate('/coordinator/reports')}
        />
      </div>

      {/* Club Activities Schedule Table (Read-Only) */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Club Activity Schedule & Events
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Stay up-to-date with upcoming workshops, hackathons, and guest speaker sessions
            </p>
          </div>
          <button
            onClick={() => navigate('/coordinator/events')}
            className="text-xs font-bold text-[#7C3AED] hover:text-[#5B21B6] flex items-center gap-1.5 self-start sm:self-auto"
          >
            <span>View All Events</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {events.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs font-medium">
            No events scheduled for this club yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#CBD5E1] text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-6">Event Details</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Date & Time</th>
                  <th className="py-3.5 px-4">Venue</th>
                  <th className="py-3.5 px-4">Alumni Guest / Speaker</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-center">Remarks</th>
                  <th className="py-3.5 px-6 text-right">Report</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {events.map((ev) => (
                  <tr key={ev.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900 text-sm">{ev.event_name}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{ev.description}</div>
                    </td>
                    <td className="py-4 px-4 font-semibold text-slate-700">
                      <span className="px-2.5 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-[11px]">
                        {ev.event_type}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-semibold text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{ev.event_date}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{ev.event_time}</div>
                    </td>
                    <td className="py-4 px-4 text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{ev.venue}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      {ev.alumni_details ? (
                        <div className="flex items-center gap-1.5 font-medium text-slate-700">
                          <User className="w-3.5 h-3.5 text-[#7C3AED]" />
                          <span className="truncate max-w-[180px]">{ev.alumni_details}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">None</span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <StatusBadge status={ev.status} />
                    </td>
                    <td className="py-4 px-4 text-center">
                      {ev.remarks ? (
                        <button
                          onClick={() => setSelectedRemarksEvent(ev)}
                          className="px-2.5 py-1 text-[#7C3AED] bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors border border-purple-200 text-xs font-bold inline-flex items-center gap-1"
                          title="View Coordinator Remarks"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      {ev.report_id ? (
                        <a
                          href={`/api/reports/download/${ev.report_id}`}
                          download
                          className="px-2.5 py-1 text-[11px] font-bold text-white bg-[#7C3AED] hover:bg-[#5B21B6] rounded-lg transition-colors inline-flex items-center gap-1 shadow-sm"
                        >
                          <Download className="w-3 h-3" />
                          <span>Report</span>
                        </a>
                      ) : (
                        <span className="text-slate-400 text-xs italic">No report</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Member Notices and Guidelines */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center gap-2.5 text-[#7C3AED] font-bold text-sm mb-3">
            <CheckCircle2 className="w-5 h-5 text-[#16A34A]" />
            <span>Member Benefits & Participation</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            As a registered club member, you receive priority registration for upcoming workshops, networking sessions with industry alumni, and access to all club learning resources and code repositories.
          </p>
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Roster Status: Auto-Approved</span>
            <span className="font-bold text-[#7C3AED]">Institutional Member</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center gap-2.5 text-[#7C3AED] font-bold text-sm mb-3">
            <ShieldCheck className="w-5 h-5 text-[#7C3AED]" />
            <span>Club Directory & Privacy</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Fellow members and alumni mentor profiles are visible in your club directory. Use contact info exclusively for institutional collaboration, project mentorship, and authorized campus events.
          </p>
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>View Mode: Read Only</span>
            <span className="font-bold text-[#16A34A]">Directory Active</span>
          </div>
        </div>
      </div>

      {/* Remarks Modal */}
      <RemarksModal
        isOpen={Boolean(selectedRemarksEvent)}
        onClose={() => setSelectedRemarksEvent(null)}
        event={selectedRemarksEvent}
      />
    </div>
  );
};
