import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, Shield, Layers, Building, Settings } from 'lucide-react';

export const Navbar = () => {
  const { user, logout, isAdmin, isMember } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-[#7C3AED] text-white border-b border-[#6D28D9] px-6 py-3.5 flex items-center justify-between shadow-sm">
      {/* Brand & Context */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white font-bold shadow-sm">
          <Layers className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-base font-bold text-white leading-tight">
            Club Activities Management
          </h1>
          <p className="text-xs text-purple-100/90 flex items-center gap-1.5 mt-0.5">
            {isAdmin ? (
              <span className="inline-flex items-center gap-1 text-purple-100 font-medium">
                <Shield className="w-3.5 h-3.5 text-purple-200" /> Administrator Portal
              </span>
            ) : isMember ? (
              <span className="inline-flex items-center gap-1 text-purple-100 font-semibold">
                <Building className="w-3.5 h-3.5 text-purple-200" /> {user?.club_name || 'Club'} • Member • Read Only
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-purple-100 font-semibold">
                <Building className="w-3.5 h-3.5 text-emerald-300" /> {user?.club_name || 'Club Workspace'} • Coordinator
              </span>
            )}
          </p>
        </div>
      </div>

      {/* User Actions */}
      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-3 pr-3 border-r border-purple-400/40">
          <div className="text-right">
            <p className="text-sm font-bold text-white">{user?.name}</p>
            <p className="text-xs text-purple-200">{user?.email}</p>
          </div>
          <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm bg-[#5B21B6] text-white border border-white/20 shadow-sm">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
        </div>

        <Link
          to={isAdmin ? '/admin/settings' : '/coordinator/settings'}
          title="Account Settings"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition-colors"
        >
          <Settings className="w-4 h-4" />
          <span className="hidden sm:inline">Settings</span>
        </Link>

        <button
          onClick={logout}
          title="Sign out"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-white/10 hover:bg-rose-600 border border-white/20 rounded-xl transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
};
