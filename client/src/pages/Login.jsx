import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Layers, Lock, Mail, Shield, User, ArrowRight, AlertCircle, Code, Cpu, BookOpen, Film, Eye, EyeOff, Briefcase } from 'lucide-react';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
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

  const handleQuickFill = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
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

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Email Address
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
              Password
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
            disabled={loading}
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

        {/* Quick Demo Logins */}
        <div className="mt-8 pt-6 border-t border-slate-100">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 text-center">
            Quick Demo Accounts
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickFill('admin@club.edu', 'Admin@123')}
              className="p-2.5 bg-[#EDE9FE]/70 hover:bg-[#EDE9FE] border border-[#DDD6FE] rounded-xl text-left transition-colors col-span-2 sm:col-span-1"
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#7C3AED]">
                <Shield className="w-3.5 h-3.5 text-[#7C3AED]" />
                <span>Admin</span>
              </div>
              <p className="text-[11px] text-slate-500 truncate mt-0.5">admin@club.edu</p>
            </button>

            <button
              type="button"
              onClick={() => handleQuickFill('ai.coord@club.edu', 'Coord@123')}
              className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-[#CBD5E1] rounded-xl text-left transition-colors"
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#7C3AED]">
                <Cpu className="w-3.5 h-3.5 text-[#7C3AED]" />
                <span>AI Club</span>
              </div>
              <p className="text-[11px] text-slate-500 truncate mt-0.5">ai.coord@club.edu</p>
            </button>

            <button
              type="button"
              onClick={() => handleQuickFill('it.coord@club.edu', 'Coord@123')}
              className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-[#CBD5E1] rounded-xl text-left transition-colors"
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#7C3AED]">
                <Code className="w-3.5 h-3.5 text-[#7C3AED]" />
                <span>IT Club</span>
              </div>
              <p className="text-[11px] text-slate-500 truncate mt-0.5">it.coord@club.edu</p>
            </button>

            <button
              type="button"
              onClick={() => handleQuickFill('electronics.coord@club.edu', 'Coord@123')}
              className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-[#CBD5E1] rounded-xl text-left transition-colors"
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#7C3AED]">
                <Layers className="w-3.5 h-3.5 text-[#7C3AED]" />
                <span>Electronics</span>
              </div>
              <p className="text-[11px] text-slate-500 truncate mt-0.5">electronics.coord@club.edu</p>
            </button>

            <button
              type="button"
              onClick={() => handleQuickFill('auto.coord@club.edu', 'Coord@123')}
              className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-[#CBD5E1] rounded-xl text-left transition-colors"
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#7C3AED]">
                <User className="w-3.5 h-3.5 text-[#7C3AED]" />
                <span>Auto Club</span>
              </div>
              <p className="text-[11px] text-slate-500 truncate mt-0.5">auto.coord@club.edu</p>
            </button>

            <button
              type="button"
              onClick={() => handleQuickFill('entrepreneur.coord@club.edu', 'Coord@123')}
              className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-[#CBD5E1] rounded-xl text-left transition-colors"
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#7C3AED]">
                <Briefcase className="w-3.5 h-3.5 text-[#7C3AED]" />
                <span>Entrepreneur</span>
              </div>
              <p className="text-[11px] text-slate-500 truncate mt-0.5">entrepreneur.coord@club.edu</p>
            </button>

            <button
              type="button"
              onClick={() => handleQuickFill('rahul.s@student.edu', 'Member@123')}
              className="p-2.5 bg-emerald-50/70 hover:bg-emerald-100/70 border border-emerald-200/60 rounded-xl text-left transition-colors"
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#16A34A]">
                <User className="w-3.5 h-3.5 text-[#16A34A]" />
                <span>Student Member</span>
              </div>
              <p className="text-[11px] text-slate-500 truncate mt-0.5">rahul.s@student.edu</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
