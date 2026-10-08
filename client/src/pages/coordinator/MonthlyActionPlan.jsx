import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../../components/StatusBadge';
import { ProgressBar } from '../../components/ProgressBar';
import { Modal } from '../../components/Modal';
import { RemarksModal } from '../../components/RemarksModal';
import { 
  CalendarDays, 
  Target, 
  Plus, 
  Clock, 
  UploadCloud, 
  Trash2, 
  CheckCircle2, 
  Save, 
  Download,
  AlertCircle,
  MessageSquare,
  Check
} from 'lucide-react';

const MONTHS = [
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

export const MonthlyActionPlan = () => {
  const { user, isMember } = useAuth();

  const [month, setMonth] = useState(9);
  const [year, setYear] = useState(2026);
  const [plan, setPlan] = useState(null);
  const [targetInput, setTargetInput] = useState(0);
  const [savingTarget, setSavingTarget] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedRemarksEvent, setSelectedRemarksEvent] = useState(null);

  // Add Event Modal (Events can ONLY be added, not edited)
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [eventName, setEventName] = useState('');
  const [eventType, setEventType] = useState(''); // Text Box (not dropdown)
  const [eventDate, setEventDate] = useState('2026-09-15');
  const [eventTime, setEventTime] = useState('10:00');
  const [venue, setVenue] = useState('');
  const [alumniDetails, setAlumniDetails] = useState('');
  const [remarks, setRemarks] = useState('');
  const [eventStatus, setEventStatus] = useState('PLANNED');
  const [savingEvent, setSavingEvent] = useState(false);

  // Report Modal
  const [reportEvent, setReportEvent] = useState(null);
  const [reportFile, setReportFile] = useState(null);
  const [reportDesc, setReportDesc] = useState('');
  const [uploadingReport, setUploadingReport] = useState(false);

  const fetchActionPlan = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get('/action-plans', {
        params: { month, year }
      });
      if (res.data.success && res.data.plans.length > 0) {
        const currentPlan = res.data.plans[0];
        setPlan(currentPlan);
        setTargetInput(currentPlan.target_members || 0);
      } else {
        setPlan(null);
        setTargetInput(0);
      }
    } catch (err) {
      console.error('Error fetching action plan:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActionPlan();
  }, [month, year]);

  const handleSaveTarget = async (e) => {
    e.preventDefault();
    try {
      setSavingTarget(true);
      await axiosClient.post('/action-plans', {
        month,
        year,
        target_members: Number(targetInput)
      });
      fetchActionPlan();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update target');
    } finally {
      setSavingTarget(false);
    }
  };

  const handleOpenAddEvent = () => {
    setEventName('');
    setEventType('');
    setEventDate(`${year}-${String(month).padStart(2, '0')}-15`);
    setEventTime('10:00');
    setVenue('');
    setAlumniDetails('');
    setRemarks('');
    setEventStatus('PLANNED');
    setIsEventModalOpen(true);
  };

  const handleSaveEvent = async (e) => {
    e.preventDefault();
    try {
      setSavingEvent(true);
      await axiosClient.post('/events', {
        action_plan_id: plan?.id,
        event_name: eventName,
        event_type: eventType,
        event_date: eventDate,
        event_time: eventTime,
        venue,
        alumni_details: alumniDetails,
        remarks,
        status: eventStatus
      });
      setIsEventModalOpen(false);
      fetchActionPlan();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to schedule event');
    } finally {
      setSavingEvent(false);
    }
  };

  const handleToggleCompletion = async (ev) => {
    const nextStatus = ev.status === 'COMPLETED' ? 'PLANNED' : 'COMPLETED';
    try {
      await axiosClient.put(`/events/${ev.id}/status`, {
        status: nextStatus
      });
      fetchActionPlan();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDeleteEvent = async (id) => {
    if (!window.confirm('Are you sure you want to delete this event from the action plan?')) return;
    try {
      await axiosClient.delete(`/events/${id}`);
      fetchActionPlan();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete event');
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (!window.confirm('Are you sure you want to delete this event report?')) return;
    try {
      await axiosClient.delete(`/reports/${reportId}`);
      setReportEvent(null);
      fetchActionPlan();
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

      if (reportEvent.report_id && !reportFile) {
        await axiosClient.put(`/reports/${reportEvent.report_id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else if (reportEvent.report_id && reportFile) {
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
      fetchActionPlan();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save report');
    } finally {
      setUploadingReport(false);
    }
  };

  const currentMonthName = MONTHS.find(m => m.value === Number(month))?.label || 'Selected Month';

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Monthly Action Plan & Target Planner
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Define recruitment targets and organize events for {user?.club_name}.
          </p>
        </div>

        {/* Month & Year Selector */}
        <div className="flex items-center gap-3">
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="px-3.5 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs font-bold text-[#0F172A] shadow-sm focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
          >
            {MONTHS.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>

          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="px-3.5 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs font-bold text-[#0F172A] shadow-sm focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
          >
            <option value={2025}>2025</option>
            <option value={2026}>2026</option>
            <option value={2027}>2027</option>
          </select>
        </div>
      </div>

      {/* Target Management Card */}
      <div className="bg-white rounded-3xl border border-[#CBD5E1] p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#7C3AED] bg-[#EDE9FE] px-2.5 py-1 rounded-full border border-[#DDD6FE]">
              Monthly Alumni Outreach Target
            </span>
            <h2 className="text-xl font-extrabold text-slate-900 mt-2">
              {currentMonthName} {year} Alumni Target
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Only approved <strong>Alumni members</strong> count toward target completion. Students are auto-approved.
            </p>
          </div>

          {/* Form to update target (Coordinators Only) */}
          {!isMember ? (
            <form onSubmit={handleSaveTarget} className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-slate-50 border border-[#CBD5E1] rounded-xl px-3 py-1.5">
                <label className="text-xs font-bold text-slate-500">Alumni Target:</label>
                <input
                  type="number"
                  min="0"
                  max="500"
                  value={targetInput}
                  onChange={(e) => setTargetInput(e.target.value)}
                  className="w-16 bg-white border border-[#CBD5E1] rounded-lg px-2 py-1 text-center text-sm font-extrabold text-[#7C3AED] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
                />
              </div>

              <button
                type="submit"
                disabled={savingTarget}
                className="px-4 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-xl text-xs font-bold shadow-sm shadow-[#7C3AED]/20 transition-colors flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{savingTarget ? 'Saving...' : 'Save Alumni Target'}</span>
              </button>
            </form>
          ) : (
            <div className="flex items-center gap-2 bg-[#EDE9FE] border border-[#DDD6FE] rounded-2xl px-4 py-2 text-[#7C3AED]">
              <Target className="w-4 h-4 text-[#7C3AED]" />
              <span className="text-xs font-bold">Target Goal: {plan?.target_members || 0}</span>
            </div>
          )}
        </div>

        {/* Progress Display */}
        <div className="mt-6 space-y-4">
          <ProgressBar
            current={plan?.approved_members || 0}
            target={plan?.target_members || 0}
            size="lg"
          />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/60">
              <p className="text-[11px] font-bold uppercase text-slate-400">Target Goal</p>
              <p className="text-xl font-extrabold text-slate-900 mt-0.5">{plan?.target_members || 0}</p>
            </div>
            <div className="p-3 bg-emerald-50/70 rounded-2xl border border-emerald-100">
              <p className="text-[11px] font-bold uppercase text-[#16A34A]">Approved Alumni</p>
              <p className="text-xl font-extrabold text-[#16A34A] mt-0.5">{plan?.approved_members || 0}</p>
            </div>
            <div className="p-3 bg-amber-50/70 rounded-2xl border border-amber-100">
              <p className="text-[11px] font-bold uppercase text-amber-700">Pending Review</p>
              <p className="text-xl font-extrabold text-amber-700 mt-0.5">{plan?.pending_members || 0}</p>
            </div>
            <div className="p-3 bg-purple-50/70 rounded-2xl border border-purple-100">
              <p className="text-[11px] font-bold uppercase text-[#7C3AED]">Remaining to Goal</p>
              <p className="text-xl font-extrabold text-[#7C3AED] mt-0.5">{plan?.remaining_target || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Events Section */}
      <div className="bg-white rounded-3xl border border-[#CBD5E1] shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Action Plan Activities & Events • {plan?.events?.length || 0} Events
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Activities scheduled under this monthly plan.
            </p>
          </div>

          {!isMember && (
            <button
              onClick={handleOpenAddEvent}
              className="px-4 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-xl text-xs font-bold shadow-sm shadow-[#7C3AED]/20 transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule Activity</span>
            </button>
          )}
        </div>

        {plan?.events?.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No events scheduled for {currentMonthName} {year}. {!isMember ? 'Click "Schedule Activity" to add an event.' : ''}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {plan?.events?.map((ev) => (
              <div key={ev.id} className="p-6 hover:bg-slate-50/60 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 bg-slate-100 text-slate-800 rounded-md font-bold text-[11px] border border-slate-200">
                      {ev.event_type}
                    </span>
                    <StatusBadge status={ev.status} />
                    {!isMember ? (
                      <button
                        onClick={() => handleToggleCompletion(ev)}
                        className={`px-2 py-0.5 rounded-full text-[11px] font-bold border transition-colors flex items-center gap-1 ${
                          ev.status === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200'
                            : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
                        }`}
                        title="Click to toggle Completed / Not Completed"
                      >
                        {ev.status === 'COMPLETED' ? <Check className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        <span>{ev.status === 'COMPLETED' ? 'Marked Completed' : 'Mark Completed'}</span>
                      </button>
                    ) : (
                      <span className="text-[11px] font-bold text-slate-500">
                        {ev.status === 'COMPLETED' ? '✓ Completed' : '○ Not Completed'}
                      </span>
                    )}
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

                <div className="flex flex-wrap items-center gap-2">
                  {/* Remarks Button */}
                  <button
                    onClick={() => setSelectedRemarksEvent(ev)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 ${
                      ev.remarks
                        ? 'bg-[#EDE9FE] hover:bg-[#DDD6FE] text-[#7C3AED] border-[#DDD6FE] shadow-sm'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-400 border-slate-200'
                    }`}
                    title={ev.remarks ? 'View remarks' : 'No remarks'}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>{ev.remarks ? 'Remarks' : 'None'}</span>
                  </button>

                  {!isMember && (
                    <>
                      <button
                        onClick={() => setReportEvent(ev)}
                        className="px-3 py-1.5 bg-[#EDE9FE] hover:bg-[#DDD6FE] text-[#7C3AED] border border-[#DDD6FE] rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
                      >
                        <UploadCloud className="w-3.5 h-3.5 text-[#7C3AED]" />
                        <span>{ev.report_id ? 'Update Report' : 'Upload Report'}</span>
                      </button>

                      <button
                        onClick={() => handleDeleteEvent(ev.id)}
                        className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg text-xs transition-colors"
                        title="Delete Event"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}

                  {isMember && ev.report_id && (
                    <a
                      href={`/api/reports/download/${ev.report_id}`}
                      download
                      className="px-3 py-1.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white border border-[#7C3AED] rounded-xl text-xs font-bold transition-colors flex items-center gap-1 shadow-sm shadow-[#7C3AED]/20"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Report</span>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Schedule Activity Modal (Add Only) */}
      <Modal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        title="Schedule New Activity in Action Plan"
        subtitle={`Action Plan for ${currentMonthName} ${year}`}
      >
        <form onSubmit={handleSaveEvent} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Event Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. AI & Cloud Architecture Workshop"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs font-medium text-[#0F172A] focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Event Type - Free-form Text Box */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Event Type *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Workshop, Seminar, Hackathon"
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs font-medium text-[#0F172A] focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Venue *</label>
              <input
                type="text"
                required
                placeholder="e.g. Seminar Hall A, Lab 3"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs font-medium text-[#0F172A] focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Event Date *</label>
              <input
                type="date"
                required
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs font-medium text-[#0F172A] focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Event Time *</label>
              <input
                type="time"
                required
                value={eventTime}
                onChange={(e) => setEventTime(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs font-medium text-[#0F172A] focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
              <select
                value={eventStatus}
                onChange={(e) => setEventStatus(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs font-medium text-[#0F172A] focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
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
              className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs font-medium text-[#0F172A] focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
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
              className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs font-medium text-[#0F172A] focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsEventModalOpen(false)}
              className="px-4 py-2 bg-white border border-[#CBD5E1] text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingEvent}
              className="px-4 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-xl text-xs font-bold shadow-sm shadow-[#7C3AED]/20 transition-colors"
            >
              {savingEvent ? 'Saving...' : 'Save Activity'}
            </button>
          </div>
        </form>
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
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs flex items-center justify-between">
              <div>
                <span className="text-slate-400 font-bold uppercase text-[10px]">Current Report</span>
                <p className="font-bold text-slate-800 mt-0.5 truncate max-w-[200px]">
                  {reportEvent.report_file_name || 'Report Document Attached'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleDeleteReport(reportEvent.report_id)}
                className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                <span>Delete Report</span>
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
              className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs font-medium text-[#0F172A] focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setReportEvent(null)}
              className="px-4 py-2 bg-white border border-[#CBD5E1] text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploadingReport || (!reportEvent?.report_id && !reportFile)}
              className="px-4 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-sm shadow-[#7C3AED]/20 transition-colors"
            >
              {uploadingReport ? 'Saving...' : (reportEvent?.report_id ? 'Save Changes' : 'Upload and Complete')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
