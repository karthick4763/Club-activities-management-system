import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosClient from '../api/axiosClient';
import { 
  KeyRound, 
  Shield, 
  User, 
  Building, 
  Building2,
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  EyeOff,
  Lock, 
  Mail, 
  ShieldCheck, 
  Check,
  Save,
  Sparkles,
  RefreshCw,
  Tag
} from 'lucide-react';

export const Settings = () => {
  const { user, isAdmin, isCoordinator, isMember, updateUser } = useAuth();

  // Password fields state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Password visibility toggles
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Password form submission state
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Club Information state (for Club Coordinator)
  const [clubName, setClubName] = useState('');
  const [clubDescription, setClubDescription] = useState('');
  const [clubCategory, setClubCategory] = useState('');
  const [originalClubName, setOriginalClubName] = useState('');
  const [originalDescription, setOriginalDescription] = useState('');
  const [loadingClub, setLoadingClub] = useState(false);
  const [savingClub, setSavingClub] = useState(false);
  const [clubSuccessMsg, setClubSuccessMsg] = useState('');
  const [clubErrorMsg, setClubErrorMsg] = useState('');

  const canEditClub = (isCoordinator || (!isAdmin && !isMember)) && !!user?.club_id;

  // Pre-load club info for coordinator
  useEffect(() => {
    if (canEditClub) {
      let isMounted = true;
      const fetchClubDetails = async () => {
        try {
          setLoadingClub(true);
          const res = await axiosClient.get(`/clubs/${user.club_id}`);
          if (isMounted && res.data?.success && res.data.club) {
            const data = res.data.club;
            setClubName(data.club_name || '');
            setClubDescription(data.description || '');
            setClubCategory(data.category || 'Technical');
            setOriginalClubName(data.club_name || '');
            setOriginalDescription(data.description || '');
          }
        } catch (err) {
          if (isMounted) {
            console.error('Failed to load club information:', err);
          }
        } finally {
          if (isMounted) {
            setLoadingClub(false);
          }
        }
      };

      fetchClubDetails();
      return () => {
        isMounted = false;
      };
    }
  }, [user?.club_id, canEditClub]);

  // Handle Club Information Update
  const handleClubSubmit = async (e) => {
    e.preventDefault();
    setClubErrorMsg('');
    setClubSuccessMsg('');

    if (!clubName.trim()) {
      setClubErrorMsg('Club name cannot be empty.');
      return;
    }

    try {
      setSavingClub(true);
      const res = await axiosClient.put(`/clubs/${user.club_id}`, {
        club_name: clubName.trim(),
        description: clubDescription.trim()
      });

      if (res.data?.success) {
        setClubSuccessMsg('Club profile updated successfully!');
        setOriginalClubName(clubName.trim());
        setOriginalDescription(clubDescription.trim());

        // Update local auth context so sidebar, navbar, and headers reflect change immediately
        if (updateUser) {
          updateUser({ club_name: clubName.trim() });
        }
      }
    } catch (err) {
      setClubErrorMsg(err.response?.data?.message || 'Failed to update club information. Please try again.');
    } finally {
      setSavingClub(false);
    }
  };

  const handleResetClubForm = () => {
    setClubName(originalClubName);
    setClubDescription(originalDescription);
    setClubErrorMsg('');
    setClubSuccessMsg('');
  };

  const isClubModified = 
    clubName.trim() !== originalClubName.trim() || 
    clubDescription.trim() !== originalDescription.trim();

  // Handle Password Change
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
          Account & Club Settings
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card & Info */}
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
                  <span className="font-bold text-[#7C3AED] truncate max-w-[150px]" title={user.club_name}>
                    {user.club_name}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Club Settings (if Coordinator) & Password Settings */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Club Profile & Information Card (Only for Coordinators) */}
          {canEditClub && (
            <div className="bg-white rounded-2xl border border-[#CBD5E1] shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-[#F8FAFC] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#EDE9FE] text-[#7C3AED] flex items-center justify-center">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#0F172A]">Club Information & Branding</h2>
                  </div>
                </div>

                {clubCategory && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 text-[#7C3AED] border border-purple-200 rounded-full text-xs font-bold">
                    <Tag className="w-3 h-3" />
                    <span>{clubCategory}</span>
                  </span>
                )}
              </div>

              <div className="p-6 sm:p-8">
                {/* Feedback Alerts */}
                {clubSuccessMsg && (
                  <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2.5 animate-fade-in">
                    <CheckCircle2 className="w-5 h-5 text-[#16A34A] shrink-0" />
                    <span>{clubSuccessMsg}</span>
                  </div>
                )}

                {clubErrorMsg && (
                  <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold flex items-center gap-2.5 animate-fade-in">
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                    <span>{clubErrorMsg}</span>
                  </div>
                )}

                {loadingClub ? (
                  <div className="py-8 flex flex-col items-center justify-center text-slate-400 gap-2">
                    <RefreshCw className="w-6 h-6 animate-spin text-[#7C3AED]" />
                    <span className="text-xs font-medium">Loading club details...</span>
                  </div>
                ) : (
                  <form onSubmit={handleClubSubmit} className="space-y-5">
                    {/* Club Name Field */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-bold text-slate-700">
                          Club Name *
                        </label>
                        <span className="text-[11px] text-slate-400">
                          Displayed across dashboard, events, and reports
                        </span>
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={clubName}
                          onChange={(e) => setClubName(e.target.value)}
                          placeholder="e.g. Artificial Intelligence Club"
                          className="w-full px-3.5 py-2.5 bg-white border border-[#CBD5E1] rounded-xl text-xs font-bold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] transition-all"
                        />
                      </div>
                    </div>

                    {/* Club Description Field */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-bold text-slate-700">
                          Club Description
                        </label>
                        <span className="text-[11px] text-slate-400">
                          Overview & purpose
                        </span>
                      </div>
                      <textarea
                        rows={4}
                        value={clubDescription}
                        onChange={(e) => setClubDescription(e.target.value)}
                        placeholder="Provide a description of your club's vision, core focus areas, and scheduled activities..."
                        className="w-full px-3.5 py-2.5 bg-white border border-[#CBD5E1] rounded-xl text-xs font-medium text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] transition-all resize-y"
                      />
                    </div>

                    {/* Submit Actions */}
                    <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={handleResetClubForm}
                        disabled={!isClubModified || savingClub}
                        className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-[#CBD5E1] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-xs font-bold transition-colors"
                      >
                        Reset Changes
                      </button>

                      <button
                        type="submit"
                        disabled={savingClub || !clubName.trim() || !isClubModified}
                        className="flex items-center gap-2 px-5 py-2.5 bg-[#7C3AED] hover:bg-[#6D28D9] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold shadow-sm shadow-[#7C3AED]/20 transition-all"
                      >
                        {savingClub ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Saving Changes...</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-3.5 h-3.5" />
                            <span>Save Club Information</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* Change Password Card */}
          <div className="bg-white rounded-2xl border border-[#CBD5E1] shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-[#F8FAFC]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#EDE9FE] text-[#7C3AED] flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#0F172A]">Change Password</h2>
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
