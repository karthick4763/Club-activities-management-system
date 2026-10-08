import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import * as XLSX from 'xlsx';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../../components/StatusBadge';
import { Modal } from '../../components/Modal';
import { RemarksModal } from '../../components/RemarksModal';
import { MemberDetailModal } from '../../components/MemberDetailModal';
import { 
  Users, 
  Plus, 
  Search, 
  Mail, 
  Phone, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Trash2, 
  GraduationCap, 
  Briefcase, 
  Shield, 
  ShieldCheck, 
  UserCheck, 
  MessageSquare, 
  FileSpreadsheet, 
  Download, 
  Upload, 
  FileUp, 
  Check, 
  AlertTriangle, 
  X,
  Eye
} from 'lucide-react';

export const ClubMembers = () => {
  const { user, isMember } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const parseType = (val) => {
    if (!val) return 'ALL';
    const v = val.toLowerCase();
    if (v === 'students' || v === 'student') return 'STUDENT';
    if (v === 'alumni') return 'ALUMNI';
    if (v === 'all') return 'ALL';
    return 'ALL';
  };

  const parseStatus = (val) => {
    if (!val) return 'ALL';
    const v = val.toLowerCase();
    if (v === 'pending') return 'PENDING';
    if (v === 'approved') return 'APPROVED';
    if (v === 'rejected') return 'REJECTED';
    if (v === 'all') return 'ALL';
    return 'ALL';
  };

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState(() => parseStatus(searchParams.get('status')));
  const [typeFilter, setTypeFilter] = useState(() => parseType(searchParams.get('type')));
  const [search, setSearch] = useState('');

  // Add Member Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('STUDENT'); // 'STUDENT' or 'ALUMNI'

  // Bulk Excel Import Modal State
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [bulkTab, setBulkTab] = useState('STUDENT'); // 'STUDENT' or 'ALUMNI'
  const [bulkRows, setBulkRows] = useState([]);
  const [bulkFileName, setBulkFileName] = useState('');
  const [bulkError, setBulkError] = useState('');
  const [bulkSuccess, setBulkSuccess] = useState('');
  const [bulkSubmitting, setBulkSubmitting] = useState(false);

  // Remarks Popup State
  const [remarksModal, setRemarksModal] = useState({
    isOpen: false,
    remarks: '',
    title: '',
    subtitle: ''
  });

  // Member Inspection Modal State
  const [selectedInspectMember, setSelectedInspectMember] = useState(null);

  // Student Form Fields
  const [studentName, setStudentName] = useState('');
  const [studentDept, setStudentDept] = useState('CSE');
  const [studentYear, setStudentYear] = useState('3rd Year');
  const [studentMobile, setStudentMobile] = useState('');
  const [studentEmail, setStudentEmail] = useState('');

  // Alumni Form Fields
  const [alumniName, setAlumniName] = useState('');
  const [alumniGender, setAlumniGender] = useState('Male');
  const [alumniMobile, setAlumniMobile] = useState('');
  const [alumniDob, setAlumniDob] = useState('1996-03-09');
  const [alumniEmail, setAlumniEmail] = useState('');
  const [alumniBatch, setAlumniBatch] = useState('BE 1996, CSE');
  const [alumniCompany, setAlumniCompany] = useState('');
  const [alumniDomain, setAlumniDomain] = useState('');
  const [alumniPosition, setAlumniPosition] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get('/members', {
        params: {
          status: statusFilter,
          member_type: typeFilter,
          search
        }
      });
      if (res.data.success) {
        setMembers(res.data.members);
      }
    } catch (err) {
      console.error('Failed to load club members:', err);
    } finally {
      setLoading(false);
    }
  };

  // Sync filters from URL search params
  useEffect(() => {
    const typeParam = searchParams.get('type');
    const statusParam = searchParams.get('status');

    if (typeParam) {
      setTypeFilter(parseType(typeParam));
    }
    if (statusParam) {
      setStatusFilter(parseStatus(statusParam));
    }
  }, [searchParams]);

  const updateFilters = (newType, newStatus) => {
    const nextType = newType !== undefined ? newType : typeFilter;
    const nextStatus = newStatus !== undefined ? newStatus : statusFilter;

    if (newType !== undefined) setTypeFilter(newType);
    if (newStatus !== undefined) setStatusFilter(newStatus);

    const params = {};
    if (nextType === 'STUDENT') params.type = 'students';
    else if (nextType === 'ALUMNI') params.type = 'alumni';
    else if (nextType === 'ALL') params.type = 'all';

    if (nextStatus && nextStatus !== 'ALL') params.status = nextStatus.toLowerCase();
    else if (nextStatus === 'ALL') params.status = 'all';

    setSearchParams(params, { replace: true });
  };

  useEffect(() => {
    fetchMembers();
  }, [statusFilter, typeFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchMembers();
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setFeedbackMessage('');
    try {
      setSubmitting(true);
      let payload = {};

      if (activeTab === 'STUDENT') {
        payload = {
          member_type: 'STUDENT',
          name: studentName,
          department: studentDept,
          year: studentYear,
          phone: studentMobile,
          email: studentEmail
        };
      } else {
        payload = {
          member_type: 'ALUMNI',
          name: alumniName,
          gender: alumniGender,
          phone: alumniMobile,
          dob: alumniDob,
          email: alumniEmail,
          batch: alumniBatch,
          company: alumniCompany,
          domain: alumniDomain,
          position: alumniPosition
        };
      }

      const res = await axiosClient.post('/members', payload);
      if (res.data.success) {
        setFeedbackMessage(res.data.message);
        if (activeTab === 'STUDENT') {
          setStudentName('');
          setStudentMobile('');
          setStudentEmail('');
        } else {
          setAlumniName('');
          setAlumniMobile('');
          setAlumniEmail('');
          setAlumniBatch('');
          setAlumniCompany('');
          setAlumniDomain('');
          setAlumniPosition('');
        }
        fetchMembers();
        setTimeout(() => {
          setIsAddOpen(false);
          setFeedbackMessage('');
        }, 1500);
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to submit member application.');
    } finally {
      setSubmitting(false);
    }
  };

  // Download Sample Excel Template
  const handleDownloadTemplate = (type) => {
    if (type === 'STUDENT') {
      const studentSample = [
        {
          'Full Name': 'Karthick S',
          'College Email': 'karthick.s@student.nec.edu.in',
          'Mobile Number': '9876543210',
          'Department': 'CSE',
          'Year of Study': '3rd Year',
          'Gender': 'Male'
        },
        {
          'Full Name': 'Ananya R',
          'College Email': 'ananya.r@student.nec.edu.in',
          'Mobile Number': '9876543211',
          'Department': 'ECE',
          'Year of Study': '2nd Year',
          'Gender': 'Female'
        }
      ];
      const ws = XLSX.utils.json_to_sheet(studentSample);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Student_Members');
      XLSX.writeFile(wb, 'student_members_template.xlsx');
    } else {
      const alumniSample = [
        {
          'Full Name': 'Velayutham R',
          'Email Address': 'rsvel_kumar@yahoo.co.uk',
          'Mobile Phone No': '9486676252',
          'Batch': 'BE 1996, CSE',
          'Company': 'Google',
          'Domain': 'Cloud AI',
          'Position': 'Senior Staff Engineer',
          'Gender': 'Male',
          'Date of Birth': '1974-06-15'
        },
        {
          'Full Name': 'Pooja Verma',
          'Email Address': 'pooja.verma@alumni.nec.edu.in',
          'Mobile Phone No': '9876543220',
          'Batch': 'BE 2018, IT',
          'Company': 'Microsoft',
          'Domain': 'Azure Security',
          'Position': 'Software Engineer II',
          'Gender': 'Female',
          'Date of Birth': '1996-03-09'
        }
      ];
      const ws = XLSX.utils.json_to_sheet(alumniSample);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Alumni_Members');
      XLSX.writeFile(wb, 'alumni_members_template.xlsx');
    }
  };

  // Handle Excel File Parse
  const handleFileUpload = (e) => {
    setBulkError('');
    setBulkSuccess('');
    const file = e.target.files?.[0];
    if (!file) return;

    setBulkFileName(file.name);
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) {
          setBulkError('The uploaded Excel file contains no readable worksheets.');
          return;
        }
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (json.length === 0) {
          setBulkError('The uploaded file is empty. Please populate the template and try again.');
          return;
        }

        const seenEmailsInFile = new Set();
        const seenPhonesInFile = new Set();

        const parsed = json.map((row, idx) => {
          const name = (row['Full Name'] || row.Name || row.name || row['Student Name'] || row['Alumni Name'] || '').toString().trim();
          const email = (row['College Email'] || row['Email Address'] || row.Email || row.email || '').toString().trim();
          const phone = (row['Mobile Number'] || row['Mobile Phone No'] || row['Phone Number'] || row.Phone || row.phone || row.Mobile || row.mobile || '').toString().trim();
          const gender = (row.Gender || row.gender || 'Male').toString().trim();
          
          let dept = (row.Department || row.department || row.Dept || row.dept || 'CSE').toString().trim();
          let year = (row['Year of Study'] || row.Year || row.year || '1st Year').toString().trim();
          let batch = (row.Batch || row.batch || row['Graduation Batch'] || '').toString().trim();
          let company = (row.Company || row.company || row.Organization || row.organization || '').toString().trim();
          let domain = (row.Domain || row.domain || row.Industry || row.industry || '').toString().trim();
          let position = (row.Position || row.position || row.Designation || row.designation || '').toString().trim();
          let dob = (row['Date of Birth'] || row.DOB || row.dob || '').toString().trim();

          const cleanEmail = email.toLowerCase().trim();
          const cleanPhone = phone.replace(/[^0-9]/g, '').slice(-10);

          const errors = [];
          if (!name) errors.push('Name is required');
          if (!email || !email.includes('@')) errors.push('Valid email is required');
          if (!phone || cleanPhone.length < 7) errors.push('Valid phone is required');
          if (bulkTab === 'ALUMNI' && !batch) errors.push('Batch is required');

          // Duplicate checks
          if (cleanEmail) {
            if (seenEmailsInFile.has(cleanEmail)) {
              errors.push('Duplicate email in this file');
            } else if (members.some(m => (m.email || '').toLowerCase().trim() === cleanEmail)) {
              errors.push('Email already registered in club');
            }
            seenEmailsInFile.add(cleanEmail);
          }

          if (cleanPhone.length >= 7) {
            if (seenPhonesInFile.has(cleanPhone)) {
              errors.push('Duplicate phone in this file');
            } else if (members.some(m => (m.phone || '').replace(/[^0-9]/g, '').slice(-10) === cleanPhone)) {
              errors.push('Phone already registered in club');
            }
            seenPhonesInFile.add(cleanPhone);
          }

          return {
            _id: idx + 1,
            _isValid: errors.length === 0,
            _error: errors.join(', '),
            member_type: bulkTab,
            name,
            email,
            phone,
            gender,
            department: dept,
            year,
            batch: batch || 'Alumni',
            company,
            domain,
            position,
            dob
          };
        });

        setBulkRows(parsed);
      } catch (err) {
        console.error('Excel parse error:', err);
        setBulkError('Failed to parse file. Please upload a valid .xlsx, .xls, or .csv file.');
      }
    };

    reader.readAsArrayBuffer(file);
  };

  // Submit Bulk Members to Server
  const handleBulkSubmit = async () => {
    setBulkError('');
    setBulkSuccess('');
    const validRows = bulkRows.filter(r => r._isValid);
    if (validRows.length === 0) {
      setBulkError('No valid rows available to import. Please check your data.');
      return;
    }

    try {
      setBulkSubmitting(true);
      const res = await axiosClient.post('/members/bulk', {
        members: validRows,
        club_id: user?.club_id
      });

      if (res.data.success) {
        setBulkSuccess(res.data.message || `Successfully imported ${res.data.importedCount} members!`);
        fetchMembers();
        setTimeout(() => {
          setIsBulkOpen(false);
          setBulkRows([]);
          setBulkFileName('');
          setBulkSuccess('');
        }, 2200);
      }
    } catch (err) {
      setBulkError(err.response?.data?.message || 'Failed to bulk import members.');
    } finally {
      setBulkSubmitting(false);
    }
  };

  const handleToggleRole = async (member) => {
    if (isMember) return;
    const targetRole = member.role === 'COORDINATOR' ? 'MEMBER' : 'COORDINATOR';
    if (targetRole === 'COORDINATOR' && member.member_type !== 'STUDENT') {
      alert('Only student members can become coordinator. Alumni members cannot become coordinator.');
      return;
    }
    const actionLabel = targetRole === 'COORDINATOR' ? 'promote this student member to Coordinator' : 'change this user back to standard Member';
    
    if (!window.confirm(`Are you sure you want to ${actionLabel}?`)) return;

    try {
      setActionLoadingId(member.id);
      const res = await axiosClient.put(`/members/${member.id}/role`, { role: targetRole });
      if (res.data.success) {
        fetchMembers();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update member role');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteMember = async (id, name) => {
    if (isMember) return;
    if (!window.confirm(`Are you sure you want to remove member "${name}"?`)) return;
    try {
      const res = await axiosClient.delete(`/members/${id}`);
      if (res.data.success) {
        fetchMembers();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to remove member');
    }
  };

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Club Members Roster
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Membership management for <strong>{user?.club_name}</strong> • Student and Alumni network
          </p>
        </div>

        {!isMember && (
          <div className="flex items-center gap-2.5 self-start md:self-auto">
            <button
              onClick={() => {
                setBulkError('');
                setBulkSuccess('');
                setBulkRows([]);
                setBulkFileName('');
                setIsBulkOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-purple-50 text-[#7C3AED] border border-[#DDD6FE] rounded-xl text-xs font-bold shadow-sm transition-all"
            >
              <FileSpreadsheet className="w-4 h-4 text-[#7C3AED]" />
              <span>Import via Excel</span>
            </button>
            <button
              onClick={() => {
                setFeedbackMessage('');
                setErrorMessage('');
                setIsAddOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-xl text-xs font-bold shadow-sm shadow-[#7C3AED]/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Member</span>
            </button>
          </div>
        )}
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-5 rounded-2xl border border-[#CBD5E1] shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search name, email, dept, batch..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs font-medium text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
            />
          </form>

          {/* Member Type Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            {[
              { id: 'ALL', label: 'All Members', icon: Users },
              { id: 'STUDENT', label: 'Students', icon: GraduationCap },
              { id: 'ALUMNI', label: 'Alumni', icon: Briefcase }
            ].map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => updateFilters(t.id, undefined)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    typeFilter === t.id
                      ? 'bg-white text-[#7C3AED] shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          {/* Status Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            {['ALL', 'APPROVED', 'PENDING', 'REJECTED'].map((s) => (
              <button
                key={s}
                onClick={() => updateFilters(undefined, s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  statusFilter === s
                    ? 'bg-white text-[#7C3AED] shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {s === 'ALL' ? 'All Status' : s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-2xl border border-[#CBD5E1] shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h2 className="text-sm font-bold text-slate-900">
            {members.length} Member{members.length !== 1 ? 's' : ''} Listed
          </h2>
          <span className="text-xs text-slate-500">
            Target recruitment tracks approved Alumni members • Only student members can become Coordinator
          </span>
        </div>

        {members.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs font-medium">
            No member records found matching your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#CBD5E1] text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-6">Member Profile</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Classification Details</th>
                  <th className="py-3.5 px-4">Contact Info</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-center">Remarks</th>
                  <th className="py-3.5 px-4">Added Date</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {members.map((m) => {
                  const isAlumni = m.member_type === 'ALUMNI';
                  const isCoord = m.role === 'COORDINATOR';
                  const hasRemarks = Boolean(m.admin_remarks);

                  return (
                    <tr key={m.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-900 text-sm">{m.name}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{m.email}</div>
                      </td>

                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-[11px] border ${
                          isCoord
                            ? 'bg-amber-50 text-amber-800 border-amber-200 shadow-sm'
                            : 'bg-[#F8FAFC] text-slate-700 border border-[#CBD5E1]'
                        }`}>
                          {isCoord ? <ShieldCheck className="w-3.5 h-3.5 text-amber-600" /> : <Users className="w-3.5 h-3.5 text-slate-400" />}
                          <span>{isCoord ? 'Coordinator' : 'Member'}</span>
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-extrabold text-[11px] border ${
                          isAlumni
                            ? 'bg-[#EDE9FE] text-[#7C3AED] border-[#DDD6FE]'
                            : 'bg-sky-50 text-sky-700 border-sky-200'
                        }`}>
                          {isAlumni ? <Briefcase className="w-3.5 h-3.5" /> : <GraduationCap className="w-3.5 h-3.5" />}
                          <span>{isAlumni ? 'Alumni' : 'Student'}</span>
                        </span>
                      </td>

                      <td className="py-4 px-4 text-slate-700 font-medium">
                        {isAlumni ? (
                          <div>
                            <div className="font-bold text-slate-900">
                              Batch: <span className="text-slate-800 font-semibold">{m.batch || 'N/A'}</span>
                            </div>
                            {(m.company || m.position || m.domain) && (
                              <div className="text-[11px] text-[#7C3AED] font-semibold mt-0.5">
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
                              Dept: <span className="text-slate-800 font-semibold">{m.department || 'N/A'}</span>
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
                        <StatusBadge status={m.status} />
                      </td>

                      <td className="py-4 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setRemarksModal({
                              isOpen: true,
                              remarks: m.admin_remarks || 'No remarks recorded for this member.',
                              title: 'Admin Remarks',
                              subtitle: m.name
                            });
                          }}
                          className={`p-2 rounded-xl transition-all inline-flex items-center justify-center ${
                            hasRemarks
                              ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 hover:scale-105 shadow-sm border border-rose-200'
                              : 'bg-white text-slate-400 hover:bg-slate-100 border border-[#CBD5E1]'
                          }`}
                          title={hasRemarks ? 'View recorded remarks' : 'No remarks'}
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                      </td>

                      <td className="py-4 px-4 text-slate-500 font-medium">
                        {new Date(m.created_at).toLocaleDateString()}
                      </td>

                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Inspect Member Details Button */}
                          <button
                            type="button"
                            onClick={() => setSelectedInspectMember(m)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-1.5 bg-purple-50 hover:bg-purple-100 text-[#7C3AED] border-purple-200 shadow-sm hover:scale-105"
                            title="Inspect full member profile details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Inspect</span>
                          </button>

                          {!isMember && (m.member_type === 'STUDENT' || isCoord) && (
                            <button
                              onClick={() => handleToggleRole(m)}
                              disabled={actionLoadingId === m.id}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-1 ${
                                isCoord
                                  ? 'bg-white text-slate-700 border-[#CBD5E1] hover:bg-slate-50'
                                  : 'bg-white text-[#7C3AED] border-[#DDD6FE] hover:bg-[#F5F3FF] shadow-sm'
                              }`}
                              title={isCoord ? 'Demote to Member' : 'Promote student to Coordinator'}
                            >
                              <Shield className="w-3.5 h-3.5" />
                              <span>{isCoord ? 'Make Member' : 'Make Coordinator'}</span>
                            </button>
                          )}

                          {!isMember && (
                            <button
                              onClick={() => handleDeleteMember(m.id, m.name)}
                              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-200"
                              title="Delete member"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Dual Tab Add Member Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Add Club Member"
        subtitle={`Registering new membership under ${user?.club_name}`}
      >
        <div className="space-y-4">
          {/* Form Switcher Tabs */}
          <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => {
                setActiveTab('STUDENT');
                setErrorMessage('');
                setFeedbackMessage('');
              }}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'STUDENT'
                  ? 'bg-white text-[#7C3AED] shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Student Member</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('ALUMNI');
                setErrorMessage('');
                setFeedbackMessage('');
              }}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'ALUMNI'
                  ? 'bg-white text-[#7C3AED] shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              <span>Alumni Member</span>
            </button>
          </div>

          {/* Context Banner */}
          {activeTab === 'STUDENT' ? (
            <div className="p-3 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-[11px] text-slate-700 font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
              <span>Student members are auto approved immediately upon registration.</span>
            </div>
          ) : (
            <div className="p-3 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-[11px] text-slate-700 font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#7C3AED] shrink-0" />
              <span>Alumni members require Admin approval. Only verified Alumni count toward outreach targets.</span>
            </div>
          )}

          {feedbackMessage && (
            <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
              <span>{feedbackMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 bg-rose-50 text-rose-800 rounded-xl text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleAddMember} className="space-y-4">
            {/* Student Member Form */}
            {activeTab === 'STUDENT' ? (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs font-medium text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Department *</label>
                    <select
                      value={studentDept}
                      onChange={(e) => setStudentDept(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs font-medium text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
                    >
                      <option value="CSE">CSE</option>
                      <option value="IT">IT</option>
                      <option value="ECE">ECE</option>
                      <option value="EEE">EEE</option>
                      <option value="MECH">MECH</option>
                      <option value="CIVIL">CIVIL</option>
                      <option value="AI&DS">AI & DS</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Year of Study *</label>
                    <select
                      value={studentYear}
                      onChange={(e) => setStudentYear(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs font-medium text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
                    >
                      <option value="1st Year">1st Year</option>
                      <option value="2nd Year">2nd Year</option>
                      <option value="3rd Year">3rd Year</option>
                      <option value="4th Year">4th Year</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    pattern="[0-9]{10}"
                    placeholder="10 digit mobile number"
                    value={studentMobile}
                    onChange={(e) => setStudentMobile(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs font-medium text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">College Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="student@institution.edu"
                    value={studentEmail}
                    onChange={(e) => setStudentEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs font-medium text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
                  />
                </div>
              </>
            ) : (
              /* Alumni Member Form */
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Velayutham R"
                      value={alumniName}
                      onChange={(e) => setAlumniName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs font-medium text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Gender</label>
                    <select
                      value={alumniGender}
                      onChange={(e) => setAlumniGender(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs font-medium text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Phone No *</label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 9486676252"
                      value={alumniMobile}
                      onChange={(e) => setAlumniMobile(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs font-medium text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Date of Birth</label>
                    <input
                      type="date"
                      value={alumniDob}
                      onChange={(e) => setAlumniDob(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs font-medium text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. rsvel_kumar@yahoo.co.uk"
                    value={alumniEmail}
                    onChange={(e) => setAlumniEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs font-medium text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Batch *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BE 1996, CSE"
                    value={alumniBatch}
                    onChange={(e) => setAlumniBatch(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs font-medium text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Specify graduation degree, year, and branch.</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Company / Organization</label>
                    <input
                      type="text"
                      placeholder="e.g. Google, Zoho, Infosys"
                      value={alumniCompany}
                      onChange={(e) => setAlumniCompany(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs font-medium text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Domain / Industry</label>
                    <input
                      type="text"
                      placeholder="e.g. Artificial Intelligence, Cloud, FinTech"
                      value={alumniDomain}
                      onChange={(e) => setAlumniDomain(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs font-medium text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Position / Designation</label>
                  <input
                    type="text"
                    placeholder="e.g. Senior Software Engineer, Director"
                    value={alumniPosition}
                    onChange={(e) => setAlumniPosition(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs font-medium text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
                  />
                </div>
              </>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-[#CBD5E1] rounded-xl text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 text-white bg-[#7C3AED] hover:bg-[#6D28D9] rounded-xl text-xs font-bold shadow-sm shadow-[#7C3AED]/20 disabled:opacity-50 transition-all"
              >
                {submitting 
                  ? 'Submitting...' 
                  : activeTab === 'STUDENT' 
                    ? 'Register Student' 
                    : 'Submit Alumni for Approval'}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Bulk Excel Import Modal */}
      <Modal
        isOpen={isBulkOpen}
        onClose={() => {
          setIsBulkOpen(false);
          setBulkError('');
          setBulkSuccess('');
        }}
        title="Bulk Import Members via Excel / CSV"
      >
        <div className="p-6 space-y-5 max-w-2xl mx-auto">
          {/* Member Category Switcher */}
          <div className="flex rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => {
                setBulkTab('STUDENT');
                setBulkRows([]);
                setBulkFileName('');
                setBulkError('');
              }}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                bulkTab === 'STUDENT'
                  ? 'bg-white text-[#7C3AED] shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Student Members (Bulk)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setBulkTab('ALUMNI');
                setBulkRows([]);
                setBulkFileName('');
                setBulkError('');
              }}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                bulkTab === 'ALUMNI'
                  ? 'bg-white text-[#7C3AED] shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              <span>Alumni Members (Bulk)</span>
            </button>
          </div>

          {/* Guidelines & Download Template */}
          <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1 text-xs">
              <p className="font-bold text-[#7C3AED]">
                {bulkTab === 'STUDENT'
                  ? 'Student Batch Import Instructions'
                  : 'Alumni Batch Import Instructions'}
              </p>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                {bulkTab === 'STUDENT'
                  ? 'Students will be enrolled and automatically approved. Columns: Full Name, College Email, Mobile Number, Department, Year of Study.'
                  : 'Alumni records will be created with PENDING status for Admin verification. Columns: Full Name, Email Address, Mobile Phone No, Batch, Company, Domain, Position.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleDownloadTemplate(bulkTab)}
              className="shrink-0 flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-purple-100/60 text-[#7C3AED] border border-purple-200 rounded-xl text-xs font-bold shadow-sm transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Template</span>
            </button>
          </div>

          {/* Feedback Messages */}
          {bulkError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{bulkError}</span>
            </div>
          )}

          {bulkSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-[#16A34A] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#16A34A]" />
              <span>{bulkSuccess}</span>
            </div>
          )}

          {/* File Upload Box */}
          <div className="relative border-2 border-dashed border-[#CBD5E1] hover:border-[#7C3AED] transition-colors rounded-2xl p-6 text-center bg-slate-50/50">
            <input
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center text-[#7C3AED]">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold text-slate-800">
                {bulkFileName ? bulkFileName : 'Click to select or drag and drop Excel / CSV file'}
              </p>
              <p className="text-[11px] text-slate-400">
                Supports Microsoft Excel (.xlsx, .xls) and CSV (.csv) files
              </p>
            </div>
          </div>

          {/* Preview Table */}
          {bulkRows.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>File Preview ({bulkRows.length} rows parsed)</span>
                <span className="text-[#16A34A]">
                  {bulkRows.filter(r => r._isValid).length} Valid • {bulkRows.filter(r => !r._isValid).length} Issues
                </span>
              </div>

              <div className="max-h-48 overflow-y-auto border border-[#CBD5E1] rounded-xl divide-y divide-slate-100 text-xs">
                {bulkRows.slice(0, 10).map((row) => (
                  <div
                    key={row._id}
                    className={`p-2.5 flex items-center justify-between gap-3 ${
                      row._isValid ? 'bg-white' : 'bg-rose-50/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {row._isValid ? (
                        <Check className="w-4 h-4 text-[#16A34A] shrink-0" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                      )}
                      <div className="truncate">
                        <span className="font-bold text-slate-900">{row.name || 'Unnamed'}</span>
                        <span className="text-slate-400 text-[11px] ml-2">({row.email || 'No email'})</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      {bulkTab === 'STUDENT' ? (
                        <span className="text-[11px] text-slate-600">{row.department} • {row.year}</span>
                      ) : (
                        <span className="text-[11px] text-purple-700 font-semibold">
                          {row.batch} {row.company ? `• ${row.company}` : ''}
                        </span>
                      )}
                      {!row._isValid && (
                        <span className="block text-[10px] text-rose-600 font-semibold">{row._error}</span>
                      )}
                    </div>
                  </div>
                ))}
                {bulkRows.length > 10 && (
                  <div className="p-2 text-center text-[11px] text-slate-400 bg-slate-50">
                    ...and {bulkRows.length - 10} more rows
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setIsBulkOpen(false);
                setBulkRows([]);
                setBulkFileName('');
                setBulkError('');
              }}
              className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-[#CBD5E1] rounded-xl text-xs font-bold transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={bulkSubmitting || bulkRows.filter(r => r._isValid).length === 0}
              onClick={handleBulkSubmit}
              className="px-5 py-2 text-white bg-[#7C3AED] hover:bg-[#6D28D9] rounded-xl text-xs font-bold shadow-sm shadow-[#7C3AED]/20 disabled:opacity-50 transition-all flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>
                {bulkSubmitting
                  ? 'Importing...'
                  : `Import ${bulkRows.filter(r => r._isValid).length} ${bulkTab === 'STUDENT' ? 'Students' : 'Alumni'}`}
              </span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Remarks Popup Modal */}
      <RemarksModal
        isOpen={remarksModal.isOpen}
        onClose={() => setRemarksModal({ ...remarksModal, isOpen: false })}
        title={remarksModal.title}
        subtitle={remarksModal.subtitle}
        remarks={remarksModal.remarks}
      />

      {/* Member Profile Inspector Modal */}
      <MemberDetailModal
        isOpen={Boolean(selectedInspectMember)}
        onClose={() => setSelectedInspectMember(null)}
        member={selectedInspectMember}
      />
    </div>
  );
};
