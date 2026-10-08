import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosClient from '../api/axiosClient';
import { 
  KeyRound, 
  Shield, 
  User, 
  Building, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  Check
} from 'lucide-react';

export const Settings = () => {
  const { user, isAdmin, isMember } = useAuth();

  // Password fields state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Password visibility toggles
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Form submission state
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (newPassword.length < 6) {
      setErrorMsg('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('New password and confirmation password do not match.');
      return;
    }

    if (currentPassword === newPassword) {
      setErrorMsg('New password must be different from current password.');
      return;
    }

    try {
      setLoading(true);
      const res = await axiosClient.put('/auth/change-password', {
        currentPassword,
        newPassword
      });

      if (res.data.success) {
        setSuccessMsg(res.data.message || 'Password updated successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to update password. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const isMatching = newPassword && confirmPassword && newPassword === confirmPassword;
  const isMismatch = confirmPassword && newPassword !== confirmPassword;
  const hasMinLength = newPassword.length >= 6;

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Account Settings
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your account profile, security credentials, and authentication options.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-[#CBD5E1] shadow-sm">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full flex items-center justify-center font-bold text-2xl bg-gradient-to-tr from-[#7C3AED] to-[#8B5CF6] text-white border-2 border-purple-200 shadow-sm mb-4">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <h2 className="text-base font-bold text-[#0F172A]">{user?.name}</h2>
              <p className="text-xs text-slate-500 mt-0.5">{user?.email}</p>

              <div className="mt-4">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                  isAdmin 
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : isMember
                    ? 'bg-[#EDE9FE] text-[#7C3AED] border-[#DDD6FE]'
                    : 'bg-emerald-50 text-[#16A34A] border-emerald-200'
                }`}>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{isAdmin ? 'Administrator' : isMember ? 'Club Member' : 'Club Coordinator'}</span>
                </span>
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-slate-100 space-y-3 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span className="flex items-center gap-1.5 text-slate-400 font-medium">
                  <User className="w-3.5 h-3.5" /> Full Name
                </span>
                <span className="font-bold text-[#0F172A]">{user?.name}</span>
              </div>

              <div className="flex items-center justify-between text-slate-600">
                <span className="flex items-center gap-1.5 text-slate-400 font-medium">
                  <Mail className="w-3.5 h-3.5" /> Email Address
                </span>
                <span className="font-bold text-[#0F172A] truncate max-w-[150px]">{user?.email}</span>
              </div>

              {!isAdmin && user?.club_name && (
                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-1.5 text-slate-400 font-medium">
                    <Building className="w-3.5 h-3.5" /> Assigned Club
                  </span>
                  <span className="font-bold text-[#7C3AED]">{user.club_name}</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-[#F8FAFC] p-5 rounded-2xl border border-[#CBD5E1] text-xs text-slate-600 space-y-2">
            <p className="font-bold text-[#7C3AED] flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-[#7C3AED]" /> Security Notice
            </p>
            <p className="text-slate-500 leading-relaxed">
              Use a strong password with at least 6 characters. Once changed, your credentials will be updated immediately.
            </p>
          </div>
        </div>

        {/* Change Password Card */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-[#CBD5E1] shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 bg-[#F8FAFC]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#EDE9FE] text-[#7C3AED] flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#0F172A]">Change Password</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Update your account password to maintain security.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8">
              {/* Alert Feedback Messages */}
              {successMsg && (
                <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2.5 animate-fade-in">
                  <CheckCircle2 className="w-5 h-5 text-[#16A34A] shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {errorMsg && (
                <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold flex items-center gap-2.5 animate-fade-in">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Current Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Current Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrent ? 'text' : 'password'}
                      required
                      placeholder="Enter current password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full pl-3.5 pr-10 py-2.5 bg-white border border-[#CBD5E1] rounded-xl text-xs font-medium text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent(!showCurrent)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      tabIndex={-1}
                    >
                      {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    New Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showNew ? 'text' : 'password'}
                      required
                      minLength={6}
                      placeholder="Enter new password (min. 6 characters)"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-3.5 pr-10 py-2.5 bg-white border border-[#CBD5E1] rounded-xl text-xs font-medium text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      tabIndex={-1}
                    >
                      {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {newPassword && (
                    <p className={`text-[11px] mt-1.5 flex items-center gap-1 ${hasMinLength ? 'text-[#16A34A] font-semibold' : 'text-amber-600'}`}>
                      {hasMinLength ? <Check className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                      <span>{hasMinLength ? 'At least 6 characters satisfied' : 'Password must be at least 6 characters'}</span>
                    </p>
                  )}
                </div>

                {/* Confirm New Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Confirm New Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      required
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`w-full pl-3.5 pr-10 py-2.5 bg-white border rounded-xl text-xs font-medium text-[#0F172A] focus:outline-none focus:ring-2 transition-all ${
                        isMismatch 
                          ? 'border-rose-400 focus:ring-rose-200 focus:border-rose-500'
                          : isMatching
                          ? 'border-emerald-400 focus:ring-emerald-200 focus:border-emerald-500'
                          : 'border-[#CBD5E1] focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      tabIndex={-1}
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {confirmPassword && (
                    <p className={`text-[11px] mt-1.5 flex items-center gap-1 ${isMatching ? 'text-[#16A34A] font-semibold' : 'text-rose-600'}`}>
                      {isMatching ? <Check className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                      <span>{isMatching ? 'Passwords match' : 'Passwords do not match'}</span>
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentPassword('');
                      setNewPassword('');
                      setConfirmPassword('');
                      setErrorMsg('');
                      setSuccessMsg('');
                    }}
                    className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-[#CBD5E1] rounded-xl text-xs font-bold transition-colors"
                  >
                    Clear
                  </button>

                  <button
                    type="submit"
                    disabled={loading || !currentPassword || !newPassword || !confirmPassword || isMismatch}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#7C3AED] hover:bg-[#6D28D9] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold shadow-sm shadow-[#7C3AED]/20 transition-all"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>{loading ? 'Updating Password...' : 'Update Password'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
