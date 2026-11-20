import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Layers, Lock, Mail, ArrowRight, AlertCircle, Eye, EyeOff } from 'lucide-react';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Single Sign-On (SSO) States
  const [ssoLogin, setSsoLogin] = useState(false);
  const [ssoToken, setSsoToken] = useState('');
  const [ssoLoading, setSsoLoading] = useState(false);

  const { login, ssoLogin: ssoLoginUser } = useAuth();
  const navigate = useNavigate();

  // 1. Read Base64-encoded email / SSO token from URL parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const emailFromUrl = params.get("email");
    const tokenFromUrl = params.get("sso_token") || params.get("token");

    if (tokenFromUrl) {
      setSsoToken(tokenFromUrl);
    }

    if (emailFromUrl) {
      try {
        const decodedEmail = atob(emailFromUrl);
        setEmail(decodedEmail);
        setSsoLogin(true);
      } catch (e) {
        setEmail(emailFromUrl);
        setSsoLogin(true);
      }
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  // 2. Trigger automated SSO login when email and ssoLogin flag are ready
  useEffect(() => {
    if (ssoLogin && email) {
      handleSSOLogin(email, ssoToken);
      setSsoLogin(false);
    }
  }, [email, ssoLogin]);

  const handleSSOLogin = async (targetEmail, targetToken) => {
    setError('');
    setSsoLoading(true);

    try {
      const user = await ssoLoginUser(targetEmail, targetToken);

      if (user.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else if (user.role === 'MEMBER') {
        navigate('/member/dashboard');
      } else {
        navigate('/coordinator/dashboard');
      }
    } catch (err) {
      console.error('SSO Login Failed:', err);
      setError(err.response?.data?.message || err.message || 'Alumni SSO Login failed. Please sign in manually.');
    } finally {
      setSsoLoading(false);
    }
  };

  const handleLogin = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(email, password);

      if (user.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else if (user.role === 'MEMBER') {
        navigate('/member/dashboard');
      } else {
        navigate('/coordinator/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8">
      {/* Background ambient accents */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#7C3AED]/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#8B5CF6]/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-xl p-8 sm:p-10 border border-[#CBD5E1]">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-tr from-[#7C3AED] to-[#8B5CF6] rounded-2xl flex items-center justify-center text-white mx-auto shadow-md shadow-[#7C3AED]/25 mb-4">
            <Layers className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-extrabold text-[#0F172A] tracking-tight">
            Club Activities Portal
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Sign in to access your club workspace or administrator dashboard
          </p>
        </div>

        {ssoLoading && (
          <div className="mb-6 p-4 rounded-xl bg-purple-50 border border-purple-200 text-purple-800 text-sm flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-[#7C3AED] border-t-transparent rounded-full animate-spin shrink-0"></div>
            <div>
              <p className="font-bold text-xs">Authenticating Single Sign-On...</p>
              <p className="text-[11px] text-purple-600">Connecting your session for {email || 'account'}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Clean Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              EMAIL ADDRESS
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@club.edu"
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#CBD5E1] rounded-xl text-sm font-medium text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 focus:border-[#7C3AED] transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              PASSWORD
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 bg-white border border-[#CBD5E1] rounded-xl text-sm font-medium text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 focus:border-[#7C3AED] transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || ssoLoading}
            className="w-full mt-2 py-3 px-4 bg-[#7C3AED] hover:bg-[#6D28D9] active:bg-[#5B21B6] text-white font-bold text-sm rounded-xl shadow-md shadow-[#7C3AED]/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
