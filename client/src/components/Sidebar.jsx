import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  UserCheck, 
  Users, 
  CalendarDays, 
  FileText, 
  Building2, 
  Target, 
  Sparkles,
  Layers,
  Settings
} from 'lucide-react';

export const Sidebar = () => {
  const { user, isAdmin, isMember } = useAuth();
  const location = useLocation();

  const adminLinks = [
    { to: '/admin/dashboard', label: 'Admin Dashboard', icon: LayoutDashboard },
    { to: '/admin/members', label: 'Members', icon: Users, aliases: ['/members'] },
    { to: '/admin/clubs', label: 'All Clubs Overview', icon: Building2 },
    { to: '/admin/reports', label: 'All Event Reports', icon: FileText, aliases: ['/events-reports'] },
    { to: '/admin/settings', label: 'Settings', icon: Settings }
  ];

  const coordinatorLinks = [
    { to: '/coordinator/dashboard', label: 'Club Dashboard', icon: LayoutDashboard },
    { to: '/coordinator/action-plan', label: 'Monthly Action Plan', icon: Target },
    { to: '/coordinator/events', label: 'Club Events', icon: CalendarDays },
    { to: '/coordinator/members', label: 'Members', icon: Users },
    { to: '/coordinator/reports', label: 'Event Reports', icon: FileText },
    { to: '/coordinator/settings', label: 'Settings', icon: Settings }
  ];

  const memberLinks = [
    { to: '/member/dashboard', label: 'Club Dashboard', icon: LayoutDashboard },
    { to: '/coordinator/events', label: 'Club Events', icon: CalendarDays },
    { to: '/coordinator/members', label: 'Members', icon: Users },
    { to: '/coordinator/reports', label: 'Event Reports', icon: FileText },
    { to: '/coordinator/settings', label: 'Settings', icon: Settings }
  ];

  const links = isAdmin ? adminLinks : isMember ? memberLinks : coordinatorLinks;

  return (
    <aside className="w-64 bg-white border-r border-slate-200/80 min-h-[calc(100vh-65px)] flex flex-col justify-between p-4">
      <div className="space-y-6">
        {/* Container Role Banner */}
        <div className="p-3.5 rounded-xl border border-slate-200 bg-[#F8FAFC]">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isAdmin ? 'bg-[#7C3AED]' : isMember ? 'bg-purple-500' : 'bg-[#16A34A]'}`}></span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {isAdmin ? 'System Role' : isMember ? 'Club Member' : 'Club Coordinator'}
            </span>
          </div>
          <p className="font-bold text-sm text-[#0F172A] mt-1 truncate">
            {isAdmin ? 'System Administrator' : user?.club_name}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {isAdmin ? 'Overview & Approvals' : isMember ? 'Member Workspace • Read Only' : 'Coordinator Workspace'}
          </p>
        </div>

        {/* Navigation Section */}
        <nav className="space-y-1">
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Navigation
          </p>
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) => {
                  const isCurrentActive = isActive || (link.aliases && link.aliases.some(alias => location.pathname === alias));
                  return `flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-sm transition-all duration-150 ${
                    isCurrentActive
                      ? 'bg-[#7C3AED] text-white shadow-sm'
                      : 'text-slate-600 hover:text-[#7C3AED] hover:bg-purple-50'
                  }`;
                }}
              >
                <Icon className="w-4 h-4" />
                <span>{link.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="px-3 py-2 text-[11px] text-slate-400 text-center">
        Club Management System
      </div>
    </aside>
  );
};
