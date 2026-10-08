import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import { StatusBadge } from '../../components/StatusBadge';
import { Modal } from '../../components/Modal';
import { RemarksModal } from '../../components/RemarksModal';
import { 
  FileText, 
  Download, 
  Building2, 
  Calendar, 
  User, 
  Search, 
  Filter, 
  Trash2, 
  Clock, 
  MessageSquare, 
  CheckCircle2, 
  Layers,
  Sparkles
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

export const AllReports = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Parse query params with fallback defaults
  const parseStatus = (val) => {
    if (!val) return 'ALL';
    const v = val.toUpperCase();
    if (v === 'COMPLETED' || v === 'COMPLETE') return 'COMPLETED';
    if (v === 'RESCHEDULED') return 'RESCHEDULED';
    if (v === 'PLANNED') return 'PLANNED';
    if (v === 'ONGOING') return 'ONGOING';
    if (v === 'CANCELLED') return 'CANCELLED';
    return 'ALL';
  };

  const parseMonth = (val) => {
    if (!val || val.toUpperCase() === 'ALL') return 'ALL';
    const num = Number(val);
    return isNaN(num) ? 'ALL' : num;
  };

  const parseYear = (val) => {
    if (!val || val.toUpperCase() === 'ALL') return 2026;
    const num = Number(val);
    return isNaN(num) ? 2026 : num;
  };

  const [events, setEvents] = useState([]);
  const [reports, setReports] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter States
  const [selectedClub, setSelectedClub] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState(() => parseStatus(searchParams.get('status')));
  const [month, setMonth] = useState(() => parseMonth(searchParams.get('month')));
  const [year, setYear] = useState(() => parseYear(searchParams.get('year')));
  const [search, setSearch] = useState('');

  // Remarks Modal State
  const [selectedRemarksEvent, setSelectedRemarksEvent] = useState(null);

  // Reschedule Audit History Modal State
  const [rescheduleHistory, setRescheduleHistory] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Active View Tab: 'events' or 'reports'
  const [activeTab, setActiveTab] = useState('events');

  // Fetch initial list of clubs
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

  // Fetch Events matching active filters
  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get('/events', {
        params: {
          club_id: selectedClub,
          status: statusFilter,
          month,
          year
        }
      });
      if (res.data.success) {
        setEvents(res.data.events || []);
      }
    } catch (err) {
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Reports matching active club
  const fetchReports = async () => {
    try {
      const res = await axiosClient.get('/reports', {
        params: { club_id: selectedClub }
      });
      if (res.data.success) {
        setReports(res.data.reports || []);
      }
    } catch (err) {
      console.error('Error fetching reports:', err);
    }
  };

  useEffect(() => {
    fetchClubs();
  }, []);

  // Sync state when URL search params change
  useEffect(() => {
    const statusParam = searchParams.get('status');
    const monthParam = searchParams.get('month');
    const yearParam = searchParams.get('year');
    const clubParam = searchParams.get('club');

    if (statusParam !== null) {
      setStatusFilter(parseStatus(statusParam));
    }
    if (monthParam !== null) {
      setMonth(parseMonth(monthParam));
    }
    if (yearParam !== null) {
      setYear(parseYear(yearParam));
    }
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
    }
  }, [searchParams, clubs]);

  // Update filters and persist to URL query params
  const updateFilters = ({ newStatus, newMonth, newYear, newClub }) => {
    const nextStatus = newStatus !== undefined ? newStatus : statusFilter;
    const nextMonth = newMonth !== undefined ? newMonth : month;
    const nextYear = newYear !== undefined ? newYear : year;
    const nextClub = newClub !== undefined ? newClub : selectedClub;

    if (newStatus !== undefined) setStatusFilter(newStatus);
    if (newMonth !== undefined) setMonth(newMonth);
    if (newYear !== undefined) setYear(newYear);
    if (newClub !== undefined) setSelectedClub(newClub);

    const params = {};
    if (nextStatus) params.status = nextStatus.toLowerCase();
    if (nextMonth !== undefined) params.month = String(nextMonth);
    if (nextYear !== undefined) params.year = String(nextYear);

    if (nextClub && nextClub !== 'ALL') {
      const matched = clubs.find(c => String(c.id) === String(nextClub));
      params.club = matched ? matched.club_name : nextClub;
    }

    setSearchParams(params, { replace: true });
  };

  // Re-fetch events when query/filter conditions change
  useEffect(() => {
    fetchEvents();
    fetchReports();
  }, [selectedClub, statusFilter, month, year]);

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

  const handleDeleteReport = async (id) => {
    if (!window.confirm('Are you sure you want to delete this event report?')) return;
    try {
      const res = await axiosClient.delete(`/reports/${id}`);
      if (res.data.success) {
        fetchReports();
        fetchEvents();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete report');
    }
  };

  // Client-side search filtering
  const filteredEvents = events.filter((e) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      e.event_name?.toLowerCase().includes(q) ||
      e.event_type?.toLowerCase().includes(q) ||
      e.club_name?.toLowerCase().includes(q) ||
      e.venue?.toLowerCase().includes(q) ||
      e.alumni_details?.toLowerCase().includes(q)
    );
  });

  const currentMonthLabel = MONTHS.find(m => String(m.value) === String(month))?.label || 'Whole Year';

  // Metrics summary
  const completedCount = events.filter(e => e.status === 'COMPLETED').length;
  const rescheduledCount = events.filter(e => e.status === 'RESCHEDULED').length;
  const plannedCount = events.filter(e => e.status === 'PLANNED').length;

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Filtered Events & Activities Overview
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Detailed breakdown of scheduled, conducted, and rescheduled club events and uploaded reports
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl self-start md:self-auto border border-slate-200">
          <button
            onClick={() => setActiveTab('events')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'events'
                ? 'bg-[#7C3AED] text-white shadow-sm'
                : 'text-slate-600 hover:text-[#7C3AED]'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Events Breakdown ({events.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'reports'
                ? 'bg-[#7C3AED] text-white shadow-sm'
                : 'text-slate-600 hover:text-[#7C3AED]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Uploaded Reports ({reports.length})</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Summary Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Events</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">{events.length}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-purple-50 text-[#7C3AED] flex items-center justify-center font-bold">
            <Calendar className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Events Conducted</p>
            <p className="text-2xl font-extrabold text-[#16A34A] mt-0.5">{completedCount}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#16A34A] flex items-center justify-center font-bold">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-amber-600">Rescheduled</p>
            <p className="text-2xl font-extrabold text-amber-600 mt-0.5">{rescheduledCount}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#7C3AED]">Proof Reports</p>
            <p className="text-2xl font-extrabold text-[#7C3AED] mt-0.5">{reports.length}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-purple-50 text-[#7C3AED] flex items-center justify-center font-bold">
            <FileText className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-5 rounded-2xl border border-[#CBD5E1] shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0F172A]">
            <Filter className="w-4 h-4 text-[#7C3AED]" />
            <span>Event & Activity Filter Controls</span>
          </div>
          <span className="text-[11px] font-medium text-slate-400">
            Timeframe: {currentMonthLabel} {year === 'ALL' ? 'All Years' : year}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Month Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Month</label>
            <select
              value={month}
              onChange={(e) => updateFilters({ newMonth: e.target.value })}
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
              onChange={(e) => updateFilters({ newYear: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs font-semibold text-[#0F172A] focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
            >
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2027">2027</option>
              <option value="ALL">All Years</option>
            </select>
          </div>

          {/* Club Filter */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Club Filter</label>
            <select
              value={selectedClub}
              onChange={(e) => updateFilters({ newClub: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs font-semibold text-[#0F172A] focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
            >
              <option value="ALL">All Clubs</option>
              {clubs.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.club_name}
                </option>
              ))}
            </select>
          </div>

          {/* Search Box */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Search</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search event name, venue..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs font-medium text-[#0F172A] focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
              />
            </div>
          </div>
        </div>

        {/* Status Filter Tabs / Quick Switch */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <span className="text-xs font-bold text-slate-500 mr-1">Status:</span>
          {[
            { id: 'ALL', label: `All Events (${events.length})` },
            { id: 'COMPLETED', label: `Completed (${completedCount})` },
            { id: 'RESCHEDULED', label: `Rescheduled (${rescheduledCount})` },
            { id: 'PLANNED', label: `Planned (${plannedCount})` }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => updateFilters({ newStatus: tab.id })}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === tab.id
                  ? 'bg-[#7C3AED] text-white shadow-sm shadow-[#7C3AED]/20'
                  : 'bg-slate-100 text-slate-600 hover:text-[#7C3AED] hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main View: Events Table */}
      {activeTab === 'events' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Detailed Events & Activities Breakdown • Showing {filteredEvents.length} Event{filteredEvents.length !== 1 ? 's' : ''}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Target timeframe: {currentMonthLabel} {year === 'ALL' ? '' : year} • Status: {statusFilter === 'ALL' ? 'All Records' : statusFilter}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400 text-xs font-medium">
              Loading event records...
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs font-medium">
              No events found matching the selected filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-6">Event Name & Type</th>
                    <th className="py-3.5 px-4">Club</th>
                    <th className="py-3.5 px-4">Date & Time</th>
                    <th className="py-3.5 px-4">Venue</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-6 text-center">Remarks</th>
                    <th className="py-3.5 px-6 text-right">Actions / Report</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEvents.map((event) => (
                    <tr key={event.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 px-6 font-bold text-slate-900">
                        <div>{event.event_name}</div>
                        <div className="flex items-center gap-2 mt-1">
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
                      <td className="py-4 px-4 font-semibold text-slate-800">
                        <span className="px-2.5 py-1 rounded-md bg-[#EDE9FE] text-[#7C3AED] font-bold text-[11px] border border-[#DDD6FE]">
                          {event.club_name}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-medium text-slate-700">
                        {event.event_date} <span className="text-slate-400">@ {event.event_time}</span>
                      </td>
                      <td className="py-4 px-4 text-slate-600 font-medium">
                        {event.venue}
                      </td>
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          <StatusBadge status={event.status} />
                          <p className="text-[10px] font-bold text-slate-500">
                            {event.status === 'COMPLETED' ? '✓ Completed' : '○ Not Completed'}
                          </p>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <button
                          onClick={() => setSelectedRemarksEvent(event)}
                          className={`p-1.5 rounded-xl border transition-all inline-flex items-center gap-1.5 ${
                            event.remarks 
                              ? 'bg-[#EDE9FE] hover:bg-[#DDD6FE] text-[#7C3AED] border-[#DDD6FE] shadow-sm' 
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-400 border-slate-200'
                          }`}
                          title={event.remarks ? 'Click to view remarks box' : 'No remarks recorded'}
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-bold">{event.remarks ? 'View Remarks' : 'None'}</span>
                        </button>
                      </td>
                      <td className="py-4 px-6 text-right space-x-2">
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
                            className="px-2.5 py-1 text-[11px] font-bold text-white bg-[#7C3AED] hover:bg-[#6D28D9] rounded-lg transition-colors inline-flex items-center gap-1 shadow-sm shadow-[#7C3AED]/20"
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
      )}

      {/* Reports Grid (Active when tab is 'reports' or as secondary section) */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">
              Activity Reports Repository ({reports.length} Document{reports.length !== 1 ? 's' : ''})
            </h2>
          </div>

          {reports.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#CBD5E1] p-12 text-center">
              <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">No event reports uploaded yet</p>
              <p className="text-xs text-slate-400 mt-1">Reports uploaded for completed events will appear here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="bg-white rounded-2xl border border-[#CBD5E1] shadow-sm p-5 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#EDE9FE] text-[#7C3AED] border border-[#DDD6FE]">
                          {report.club_name}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {new Date(report.uploaded_at).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 mt-3 line-clamp-1">
                      {report.event_name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Type: {report.event_type} • Date: {report.event_date}
                    </p>

                    {report.description && (
                      <p className="text-xs text-slate-600 mt-3 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                        "{report.description}"
                      </p>
                    )}

                    <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>Uploaded by: <strong className="text-slate-700">{report.uploaded_by_name}</strong></span>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-400 truncate max-w-[140px]" title={report.file_name}>
                      {report.file_name}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <a
                        href={`/api/reports/download/${report.id}`}
                        download
                        className="px-3 py-1.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-xl text-xs font-bold shadow-sm shadow-[#7C3AED]/20 flex items-center gap-1.5 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </a>

                      <button
                        onClick={() => handleDeleteReport(report.id)}
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl border border-rose-200 transition-colors"
                        title="Delete Report"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reschedule History Modal */}
      <Modal
        isOpen={!!rescheduleHistory}
        onClose={() => setRescheduleHistory(null)}
        title="Event Reschedule Audit History"
        subtitle="Complete chronological timeline of date/time modifications"
      >
        <div className="space-y-4">
          {loadingHistory ? (
            <p className="text-xs text-slate-400">Loading audit history...</p>
          ) : rescheduleHistory?.length === 0 ? (
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
