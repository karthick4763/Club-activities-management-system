import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../../components/Modal';
import { FileText, Download, UploadCloud, Trash2, Edit, CheckCircle2 } from 'lucide-react';

export const CoordinatorReports = () => {
  const { user, isMember } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit / Re-upload Modal State
  const [editReport, setEditReport] = useState(null);
  const [editFile, setEditFile] = useState(null);
  const [editDesc, setEditDesc] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get('/reports');
      if (res.data.success) {
        setReports(res.data.reports);
      }
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleDeleteReport = async (id) => {
    if (isMember) return;
    if (!window.confirm('Are you sure you want to delete this event report?')) return;
    try {
      const res = await axiosClient.delete(`/reports/${id}`);
      if (res.data.success) {
        fetchReports();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete report');
    }
  };

  const handleOpenEdit = (report) => {
    if (isMember) return;
    setEditReport(report);
    setEditDesc(report.description || '');
    setEditFile(null);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (isMember) return;
    try {
      setSavingEdit(true);
      const formData = new FormData();
      if (editFile) {
        formData.append('report_file', editFile);
      }
      formData.append('description', editDesc);

      const res = await axiosClient.put(`/reports/${editReport.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        setEditReport(null);
        fetchReports();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update report');
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
            Event Reports & Documentation
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Uploaded reports, documentation, and proofs for <strong>{user?.club_name}</strong>
          </p>
        </div>
      </div>

      {/* Reports Grid */}
      {reports.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#CBD5E1] p-12 text-center">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-700">No event reports uploaded yet</p>
          <p className="text-xs text-slate-400 mt-1">
            Reports uploaded for completed activities will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((report) => (
            <div
              key={report.id}
              className="bg-white rounded-2xl border border-[#CBD5E1] shadow-sm p-6 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-[#7C3AED] border border-purple-100">
                    Activity Report
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {new Date(report.uploaded_at).toLocaleDateString()}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 mt-3">{report.event_name}</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Type: {report.event_type} • Date: {report.event_date}
                </p>

                {report.description && (
                  <p className="text-xs text-[#0F172A] mt-3 p-3 bg-[#F8FAFC] rounded-xl border border-[#CBD5E1]">
                    "{report.description}"
                  </p>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-400 truncate max-w-[120px]" title={report.file_name}>
                  {report.file_name}
                </span>

                <div className="flex items-center gap-1.5">
                  <a
                    href={`/api/reports/download/${report.id}`}
                    download
                    className="p-1.5 bg-[#7C3AED] hover:bg-[#5B21B6] text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
                    title="Download Report"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>

                  {!isMember && (
                    <button
                      onClick={() => handleOpenEdit(report)}
                      className="p-1.5 bg-white hover:bg-purple-50 text-[#7C3AED] border border-[#CBD5E1] rounded-lg text-xs font-bold transition-colors"
                      title="Edit / Replace Report"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {!isMember && (
                    <button
                      onClick={() => handleDeleteReport(report.id)}
                      className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg text-xs font-bold transition-colors"
                      title="Delete Report"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit / Replace Report Modal (Coordinators Only) */}
      {!isMember && (
        <Modal
          isOpen={!!editReport}
          onClose={() => setEditReport(null)}
          title="Edit / Replace Activity Report"
          subtitle={`Event: "${editReport?.event_name}"`}
        >
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#CBD5E1] text-xs">
              <span className="text-slate-400 font-bold uppercase text-[10px]">Current File</span>
              <p className="font-bold text-[#7C3AED] mt-0.5 truncate">{editReport?.file_name}</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Replace File (Optional - leave blank to keep existing file)
              </label>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                onChange={(e) => setEditFile(e.target.files[0])}
                className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-purple-50 file:text-[#7C3AED] hover:file:bg-purple-100 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Description / Summary</label>
              <textarea
                rows={3}
                placeholder="Summary of activity, attendance, outcomes..."
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs font-medium text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditReport(null)}
                className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-[#CBD5E1] rounded-xl text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingEdit}
                className="px-4 py-2 bg-[#7C3AED] hover:bg-[#5B21B6] disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
              >
                {savingEdit ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
