import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../../components/StatusBadge';
import { Modal } from '../../components/Modal';
import { RemarksModal } from '../../components/RemarksModal';
import { 
  CalendarDays, 
  Plus, 
  Clock, 
  UploadCloud, 
  Edit, 
  Trash2, 
  Download,
  MessageSquare,
  Check,
  Search,
  FileText
} from 'lucide-react';

const MONTHS = [
  { value: 'ALL', label: 'All Months' },
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

export const CoordinatorEvents = () => {
  const { user, isMember } = useAuth();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState('ALL');
  const [year, setYear] = useState(2026);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  // Remarks Popup State
  const [selectedRemarksEvent, setSelectedRemarksEvent] = useState(null);

  // Add / Edit Event Modal State
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);
  const [eventName, setEventName] = useState('');
  const [eventType, setEventType] = useState('');
  const [eventDate, setEventDate] = useState('2026-09-15');
  const [eventTime, setEventTime] = useState('10:00');
  const [venue, setVenue] = useState('');
  const [alumniDetails, setAlumniDetails] = useState('');
  const [remarks, setRemarks] = useState('');
  const [eventStatus, setEventStatus] = useState('PLANNED');
  const [savingEvent, setSavingEvent] = useState(false);

  // Reschedule Modal State
  const [rescheduleEvent, setRescheduleEvent] = useState(null);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('14:00');
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [submittingReschedule, setSubmittingReschedule] = useState(false);

  // Reschedule History Modal
  const [rescheduleHistory, setRescheduleHistory] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Report Modal State
  const [reportEvent, setReportEvent] = useState(null);
  const [reportFile, setReportFile] = useState(null);
  const [reportDesc, setReportDesc] = useState('');
  const [uploadingReport, setUploadingReport] = useState(false);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get('/events', {
        params: {
          month,
          year,
          status: statusFilter
        }
      });
      if (res.data.success) {
        setEvents(res.data.events);
      }
    } catch (err) {
      console.error('Failed to load events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [month, year, statusFilter]);

  const handleOpenAddEvent = () => {
    setEditingEventId(null);
    setEventName('');
    setEventType('');
    setEventDate(`${year}-${String(month === 'ALL' ? '09' : month).padStart(2, '0')}-15`);
    setEventTime('10:00');
    setVenue('');
    setAlumniDetails('');
    setRemarks('');
    setEventStatus('PLANNED');
    setIsEventModalOpen(true);
  };

  const handleOpenEditEvent = (ev) => {
    setEditingEventId(ev.id);
    setEventName(ev.event_name);
    setEventType(ev.event_type);
    setEventDate(ev.event_date);
    setEventTime(ev.event_time || '10:00');
    setVenue(ev.venue);
    setAlumniDetails(ev.alumni_details || '');
    setRemarks(ev.remarks || '');
    setEventStatus(ev.status || 'PLANNED');
    setIsEventModalOpen(true);
  };

  const handleSaveEvent = async (e) => {
    e.preventDefault();
    try {
      setSavingEvent(true);
      if (editingEventId) {
        await axiosClient.put(`/events/${editingEventId}`, {
          event_name: eventName,
          event_type: eventType,
          event_date: eventDate,
          event_time: eventTime,
          venue,
          alumni_details: alumniDetails,
          remarks,
          status: eventStatus
        });
      } else {
        await axiosClient.post('/events', {
          event_name: eventName,
          event_type: eventType,
          event_date: eventDate,
          event_time: eventTime,
          venue,
          alumni_details: alumniDetails,
          remarks,
          status: eventStatus
        });
      }
      setIsEventModalOpen(false);
      fetchEvents();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save event');
    } finally {
      setSavingEvent(false);
    }
  };

  const handleToggleCompletion = async (ev) => {
    if (isMember) return;
    const nextStatus = ev.status === 'COMPLETED' ? 'PLANNED' : 'COMPLETED';
    try {
      await axiosClient.put(`/events/${ev.id}/status`, {
        status: nextStatus
      });
      fetchEvents();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDeleteEvent = async (id) => {
    if (isMember) return;
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    try {
      await axiosClient.delete(`/events/${id}`);
      fetchEvents();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete event');
    }
  };

  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmittingReschedule(true);
      await axiosClient.post(`/events/${rescheduleEvent.id}/reschedule`, {
        new_date: newDate,
        new_time: newTime,
        reason: rescheduleReason
      });
      setRescheduleEvent(null);
      fetchEvents();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reschedule event');
    } finally {
      setSubmittingReschedule(false);
    }
  };

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

  const handleDeleteReport = async (reportId) => {
    if (isMember) return;
    if (!window.confirm('Are you sure you want to delete this event report?')) return;
    try {
      await axiosClient.delete(`/reports/${reportId}`);
      setReportEvent(null);
      fetchEvents();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete report');
    }
  };

  const handleReportUploadSubmit = async (e) => {
    e.preventDefault();
    try {
      setUploadingReport(true);
      const formData = new FormData();
      if (reportFile) {
        formData.append('report_file', reportFile);
      }
      formData.append('description', reportDesc);

      if (reportEvent.report_id) {
        await axiosClient.put(`/reports/${reportEvent.report_id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await axiosClient.post(`/reports/upload/${reportEvent.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      setReportEvent(null);
      setReportFile(null);
      setReportDesc('');
      fetchEvents();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save report');
    } finally {
      setUploadingReport(false);
    }
  };

  const filteredEvents = events.filter((ev) => {
    if (!search.trim()) return true;
    const query = search.toLowerCase();
    return (
      ev.event_name?.toLowerCase().includes(query) ||
      ev.event_type?.toLowerCase().includes(query) ||
      ev.venue?.toLowerCase().includes(query) ||
      ev.remarks?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Club Events and Activities
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Activities, remarks, completion status, and reports for <strong>{user?.club_name}</strong>
          </p>
        </div>

        {!isMember && (
          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenAddEvent}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-xl text-xs font-bold shadow-sm shadow-[#7C3AED]/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule New Event</span>
            </button>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-5 rounded-2xl border border-[#CBD5E1] shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search event name, type, venue..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs font-medium text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Month Filter */}
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="px-3 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs font-semibold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
            >
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>

            {/* Year Filter */}
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="px-3 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs font-semibold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
            >
              <option value="ALL">All Years</option>
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
              <option value={2027}>2027</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs font-semibold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
            >
              <option value="ALL">All Statuses</option>
              <option value="PLANNED">Planned</option>
              <option value="COMPLETED">Completed</option>
              <option value="ONGOING">Ongoing</option>
              <option value="RESCHEDULED">Rescheduled</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Events List */}
      <div className="bg-white rounded-3xl border border-[#CBD5E1] shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Scheduled Club Activities • {filteredEvents.length}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Overview of club activities, schedule, and uploaded documentation.
            </p>
          </div>
        </div>

        {filteredEvents.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs font-medium">
            <CalendarDays className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-700">No events found matching your criteria</p>
            {!isMember && (
              <p className="text-xs text-slate-400 mt-1">Click Schedule New Event to add an activity for your club.</p>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredEvents.map((ev) => (
              <div
                key={ev.id}
                className="p-6 hover:bg-slate-50/60 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-6"
              >
                <div className="space-y-2.5 max-w-3xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 bg-[#F8FAFC] text-slate-800 rounded-md font-bold text-[11px] border border-[#CBD5E1]">
                      {ev.event_type}
                    </span>
                    <StatusBadge status={ev.status} />

                    {/* Completion Toggle Button (Coordinators only) */}
                    {!isMember && (
                      <button
                        onClick={() => handleToggleCompletion(ev)}
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border transition-colors flex items-center gap-1 ${
                          ev.status === 'COMPLETED'
                            ? 'bg-emerald-50 text-[#16A34A] border-emerald-200 hover:bg-emerald-100'
                            : 'bg-white text-slate-600 border-[#CBD5E1] hover:bg-slate-50'
                        }`}
                        title="Click to toggle status"
                      >
                        {ev.status === 'COMPLETED' ? <Check className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        <span>{ev.status === 'COMPLETED' ? 'Completed' : 'Mark Completed'}</span>
                      </button>
                    )}

                    {/* Remarks Icon Button */}
                    <button
                      type="button"
                      onClick={() => setSelectedRemarksEvent(ev)}
                      className={`p-1.5 rounded-lg border transition-all inline-flex items-center gap-1 text-xs font-bold ${
                        ev.remarks
                          ? 'bg-[#EDE9FE] text-[#7C3AED] border-[#DDD6FE] hover:bg-[#DDD6FE]/60'
                          : 'bg-white text-slate-400 border-[#CBD5E1] hover:bg-slate-50'
                      }`}
                      title={ev.remarks ? 'View event remarks' : 'No remarks'}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Remarks</span>
                    </button>
                  </div>

                  <h3 className="text-lg font-extrabold text-slate-900">{ev.event_name}</h3>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 font-medium">
                    <span className="flex items-center gap-1">
                      Date: <strong className="text-slate-900">{ev.event_date}</strong>
                    </span>
                    <span className="flex items-center gap-1">
                      Time: <strong className="text-slate-900">{ev.event_time}</strong>
                    </span>
                    <span className="flex items-center gap-1">
                      Venue: <strong className="text-slate-900">{ev.venue}</strong>
                    </span>
                    {ev.alumni_details && (
                      <span className="text-[#7C3AED] font-semibold">
                        Guest: {ev.alumni_details}
                      </span>
                    )}
                  </div>

                  {/* Report summary if attached */}
                  {ev.report_id && (
                    <div className="p-2.5 bg-[#F8FAFC] rounded-xl border border-[#CBD5E1] text-xs text-slate-800 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 truncate">
                        <FileText className="w-3.5 h-3.5 text-[#7C3AED] shrink-0" />
                        <span className="font-semibold truncate">Report Document: {ev.report_file_name || 'Attached'}</span>
                      </div>
                      <a
                        href={`/api/reports/download/${ev.report_id}`}
                        download
                        className="px-2.5 py-1 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-lg font-bold text-[11px] shadow-sm shrink-0 flex items-center gap-1 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </a>
                    </div>
                  )}
                </div>

                {/* Actions Panel */}
                <div className="flex flex-wrap items-center gap-2 self-start lg:self-center">
                  {!isMember && (
                    <button
                      onClick={() => handleOpenEditEvent(ev)}
                      className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-[#CBD5E1] rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                      title="Edit Event Details"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                  )}

                  {!isMember && (
                    <button
                      onClick={() => {
                        setRescheduleEvent(ev);
                        setNewDate(ev.event_date);
                        setNewTime(ev.event_time || '14:00');
                        setRescheduleReason('');
                      }}
                      className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-[#CBD5E1] rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Reschedule</span>
                    </button>
                  )}

                  {ev.reschedule_count > 0 && (
                    <button
                      onClick={() => viewRescheduleHistory(ev.id)}
                      className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                      title="View Reschedule History"
                    >
                      History • {ev.reschedule_count}
                    </button>
                  )}

                  {!isMember && (
                    <button
                      onClick={() => {
                        setReportEvent(ev);
                        setReportFile(null);
                        setReportDesc('');
                      }}
                      className="px-3 py-2 bg-[#EDE9FE] hover:bg-[#DDD6FE] text-[#7C3AED] border border-[#DDD6FE] rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>{ev.report_id ? 'Update Report' : 'Upload Report'}</span>
                    </button>
                  )}

                  {!isMember && (
                    <button
                      onClick={() => handleDeleteEvent(ev.id)}
                      className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl border border-rose-200 transition-colors"
                      title="Delete Event"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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

      {/* Add / Edit Event Modal */}
      <Modal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        title={editingEventId ? 'Edit Event Activity' : 'Schedule New Club Event'}
        subtitle={`Activity details for ${user?.club_name}`}
      >
        <form onSubmit={handleSaveEvent} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Event Name</label>
            <input
              type="text"
              required
              placeholder="e.g. AI and Cloud Architecture Workshop"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs font-medium text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Event Type</label>
              <input
                type="text"
                required
                placeholder="e.g. Workshop, Seminar, Contest"
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs font-medium text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Venue</label>
              <input
                type="text"
                required
                placeholder="e.g. Seminar Hall A, Lab 3"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs font-medium text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Event Date</label>
              <input
                type="date"
                required
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs font-medium text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Event Time</label>
              <input
                type="time"
                required
                value={eventTime}
                onChange={(e) => setEventTime(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs font-medium text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
              <select
                value={eventStatus}
                onChange={(e) => setEventStatus(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs font-medium text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
              >
                <option value="PLANNED">Planned</option>
                <option value="ONGOING">Ongoing</option>
                <option value="COMPLETED">Completed</option>
                <option value="RESCHEDULED">Rescheduled</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Alumni or Resource Person Details</label>
            <input
              type="text"
              placeholder="e.g. John Doe, Senior Engineer"
              value={alumniDetails}
              onChange={(e) => setAlumniDetails(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs font-medium text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Event Remarks
            </label>
            <input
              type="text"
              placeholder="e.g. 85 attendees, certificates issued..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs font-medium text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsEventModalOpen(false)}
              className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-[#CBD5E1] rounded-xl text-xs font-bold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingEvent}
              className="px-4 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-xl text-xs font-bold shadow-sm transition-all"
            >
              {savingEvent ? 'Saving...' : 'Save Event'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Reschedule Modal */}
      <Modal
        isOpen={!!rescheduleEvent}
        onClose={() => setRescheduleEvent(null)}
        title="Reschedule Event"
        subtitle={`Audit record for ${rescheduleEvent?.event_name}`}
      >
        <form onSubmit={handleRescheduleSubmit} className="space-y-4">
          <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#CBD5E1] text-xs">
            <p className="text-slate-400 font-bold uppercase text-[10px]">Original Schedule</p>
            <p className="font-bold text-[#7C3AED] mt-0.5">
              {rescheduleEvent?.event_date} at {rescheduleEvent?.event_time}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">New Date</label>
              <input
                type="date"
                required
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs font-medium text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">New Time</label>
              <input
                type="time"
                required
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs font-medium text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Reason for Reschedule</label>
            <textarea
              rows={3}
              required
              placeholder="e.g. Resource person conflict, exam schedule overlap..."
              value={rescheduleReason}
              onChange={(e) => setRescheduleReason(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs font-medium text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setRescheduleEvent(null)}
              className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-[#CBD5E1] rounded-xl text-xs font-bold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingReschedule}
              className="px-4 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-xl text-xs font-bold shadow-sm transition-all"
            >
              {submittingReschedule ? 'Rescheduling...' : 'Confirm Reschedule'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Reschedule History Modal */}
      <Modal
        isOpen={!!rescheduleHistory}
        onClose={() => setRescheduleHistory(null)}
        title="Event Reschedule History"
        subtitle="Chronological log of date and time modifications"
      >
        <div className="space-y-4">
          {rescheduleHistory?.length === 0 ? (
            <p className="text-xs text-slate-500">No reschedule records found.</p>
          ) : (
            <div className="space-y-3">
              {rescheduleHistory?.map((item, idx) => (
                <div key={idx} className="p-3.5 bg-[#F8FAFC] rounded-xl border border-[#CBD5E1] space-y-1.5 text-xs">
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

      {/* Report Modal */}
      <Modal
        isOpen={!!reportEvent}
        onClose={() => setReportEvent(null)}
        title={reportEvent?.report_id ? "Edit Activity Report" : "Upload Activity Report"}
        subtitle={`Event: ${reportEvent?.event_name}`}
      >
        <form onSubmit={handleReportUploadSubmit} className="space-y-4">
          {reportEvent?.report_id && (
            <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#CBD5E1] text-xs flex items-center justify-between">
              <div>
                <span className="text-slate-400 font-bold uppercase text-[10px]">Current Document</span>
                <p className="font-bold text-[#7C3AED] mt-0.5 truncate max-w-[200px]">
                  {reportEvent.report_file_name || 'Report Document Attached'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleDeleteReport(reportEvent.report_id)}
                className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                <span>Delete</span>
              </button>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {reportEvent?.report_id ? 'Replace Document or Proof' : 'Select Document or Proof: PDF, DOCX, PNG, JPG'}
            </label>
            <input
              type="file"
              required={!reportEvent?.report_id}
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
              onChange={(e) => setReportFile(e.target.files[0])}
              className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#EDE9FE] file:text-[#7C3AED] hover:file:bg-[#DDD6FE] cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Description or Summary</label>
            <textarea
              rows={3}
              placeholder="e.g. Conducted successfully with attendance list attached..."
              value={reportDesc}
              onChange={(e) => setReportDesc(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs font-medium text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setReportEvent(null)}
              className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-[#CBD5E1] rounded-xl text-xs font-bold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploadingReport || (!reportEvent?.report_id && !reportFile)}
              className="px-4 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
            >
              {uploadingReport ? 'Saving...' : (reportEvent?.report_id ? 'Save Changes' : 'Upload and Complete')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
