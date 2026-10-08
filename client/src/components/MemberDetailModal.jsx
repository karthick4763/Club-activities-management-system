import React from 'react';
import { Modal } from './Modal';
import { StatusBadge } from './StatusBadge';
import { 
  User, 
  Mail, 
  Phone, 
  Building2, 
  Briefcase, 
  GraduationCap, 
  Calendar, 
  ShieldCheck, 
  Clock, 
  MessageSquare, 
  CheckCircle2, 
  Hash, 
  Tag,
  Copy,
  Check
} from 'lucide-react';

export const MemberDetailModal = ({ isOpen, onClose, member }) => {
  const [copiedField, setCopiedField] = React.useState(null);

  if (!isOpen || !member) return null;

  const isAlumni = member.member_type === 'ALUMNI';
  const isCoord = member.role === 'COORDINATOR';

  const copyToClipboard = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 1800);
  };

  const getInitials = (name) => {
    if (!name) return 'M';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Member Profile Inspector"
      subtitle={`Detailed dossier for ${member.name}`}
    >
      <div className="space-y-5 text-xs text-[#0F172A] max-w-xl mx-auto">
        {/* Profile Header Hero Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-50 via-slate-50 to-indigo-50 border border-purple-100 flex flex-col sm:flex-row items-center sm:items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#7C3AED] text-white flex items-center justify-center font-extrabold text-lg shadow-md shadow-purple-500/20 shrink-0">
            {getInitials(member.name)}
          </div>
          <div className="space-y-1.5 flex-1 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h3 className="text-base font-extrabold text-slate-900">{member.name}</h3>
              <StatusBadge status={member.status} />
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-[11px]">
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold border ${
                isAlumni
                  ? 'bg-purple-100/70 text-[#7C3AED] border-purple-200'
                  : 'bg-sky-100/70 text-sky-800 border-sky-200'
              }`}>
                {isAlumni ? <Briefcase className="w-3 h-3" /> : <GraduationCap className="w-3 h-3" />}
                <span>{isAlumni ? 'Alumni Member' : 'Student Member'}</span>
              </span>

              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold border ${
                isCoord
                  ? 'bg-amber-100/70 text-amber-800 border-amber-200'
                  : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}>
                {isCoord ? <ShieldCheck className="w-3 h-3 text-amber-600" /> : <User className="w-3 h-3 text-slate-400" />}
                <span>{isCoord ? 'Club Coordinator' : 'Regular Member'}</span>
              </span>

              {member.club_name && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white text-slate-700 border border-[#CBD5E1] font-semibold">
                  <Building2 className="w-3 h-3 text-[#7C3AED]" />
                  <span>{member.club_name}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Section 1: Personal & Contact Information */}
        <div className="p-4 bg-white rounded-2xl border border-[#CBD5E1] space-y-3">
          <div className="flex items-center gap-1.5 font-bold text-slate-900 border-b border-slate-100 pb-2">
            <User className="w-3.5 h-3.5 text-[#7C3AED]" />
            <span>Personal & Contact Info</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <p className="text-[10px] font-bold uppercase text-slate-400">Email Address</p>
              <div className="flex items-center justify-between gap-1 mt-0.5">
                <span className="font-semibold text-slate-900 truncate">{member.email}</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(member.email, 'email')}
                  className="p-1 text-slate-400 hover:text-[#7C3AED] rounded"
                  title="Copy email"
                >
                  {copiedField === 'email' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase text-slate-400">Phone Number</p>
              <div className="flex items-center justify-between gap-1 mt-0.5">
                <span className="font-semibold text-slate-900">{member.phone}</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(member.phone, 'phone')}
                  className="p-1 text-slate-400 hover:text-[#7C3AED] rounded"
                  title="Copy phone"
                >
                  {copiedField === 'phone' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase text-slate-400">Gender</p>
              <p className="font-semibold text-slate-900 mt-0.5">{member.gender || 'Not Specified'}</p>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase text-slate-400">Date of Birth</p>
              <p className="font-semibold text-slate-900 mt-0.5">{member.dob || 'Not Provided'}</p>
            </div>
          </div>
        </div>

        {/* Section 2: Academic or Career Classification */}
        <div className="p-4 bg-white rounded-2xl border border-[#CBD5E1] space-y-3">
          <div className="flex items-center gap-1.5 font-bold text-slate-900 border-b border-slate-100 pb-2">
            {isAlumni ? <Briefcase className="w-3.5 h-3.5 text-[#7C3AED]" /> : <GraduationCap className="w-3.5 h-3.5 text-[#7C3AED]" />}
            <span>{isAlumni ? 'Professional & Alumni Career Profile' : 'Student Academic Details'}</span>
          </div>

          {isAlumni ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <p className="text-[10px] font-bold uppercase text-slate-400">Graduation Batch</p>
                <p className="font-bold text-[#7C3AED] mt-0.5">{member.batch || 'Alumni'}</p>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase text-slate-400">Company / Organization</p>
                <p className="font-semibold text-slate-900 mt-0.5">{member.company || 'Not Specified'}</p>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase text-slate-400">Domain / Industry</p>
                <p className="font-semibold text-slate-900 mt-0.5">{member.domain || 'Not Specified'}</p>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase text-slate-400">Position / Designation</p>
                <p className="font-semibold text-slate-900 mt-0.5">{member.position || 'Not Specified'}</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <p className="text-[10px] font-bold uppercase text-slate-400">Department</p>
                <p className="font-bold text-indigo-700 mt-0.5">{member.department || 'Not Specified'}</p>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase text-slate-400">Year of Study</p>
                <p className="font-semibold text-slate-900 mt-0.5">{member.year || 'Not Specified'}</p>
              </div>
            </div>
          )}
        </div>

        {/* Section 3: Registration & Verification Metadata */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
          <div className="flex items-center gap-1.5 font-bold text-slate-900 border-b border-slate-200 pb-2">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>Registration & Verification Audit Trail</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
            <div>
              <p className="text-[10px] font-bold uppercase text-slate-400">Record ID</p>
              <p className="font-semibold text-slate-700 mt-0.5">#{member.id}</p>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase text-slate-400">Submitted By</p>
              <p className="font-semibold text-slate-700 mt-0.5">{member.submitted_by_name || 'System / Coordinator'}</p>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase text-slate-400">Enrolled On</p>
              <p className="font-semibold text-slate-700 mt-0.5">
                {member.created_at ? new Date(member.created_at).toLocaleString() : 'N/A'}
              </p>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase text-slate-400">Approved Date</p>
              <p className="font-semibold text-slate-700 mt-0.5">
                {member.approved_at ? new Date(member.approved_at).toLocaleString() : (member.status === 'APPROVED' ? 'Auto-Approved' : 'Pending Verification')}
              </p>
            </div>
          </div>
        </div>

        {/* Section 4: Recorded Remarks if available */}
        {member.admin_remarks && (
          <div className="p-3.5 bg-rose-50 rounded-2xl border border-rose-200 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-rose-700">
              <MessageSquare className="w-3.5 h-3.5 text-rose-600" />
              <span>Admin Remarks</span>
            </div>
            <p className="text-xs text-rose-900 leading-relaxed whitespace-pre-wrap">
              {member.admin_remarks}
            </p>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-[#CBD5E1] rounded-xl text-xs font-bold transition-colors"
          >
            Close Dossier
          </button>
        </div>
      </div>
    </Modal>
  );
};
