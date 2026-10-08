import React from 'react';
import { NavView } from '../types';
import {
  Target,
  LayoutDashboard,
  Timer,
  CalendarDays,
  BarChart3,
  Sparkles,
  Settings,
  Flame,
  Play,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  currentView: NavView;
  setCurrentView: (view: NavView) => void;
  streakDays: number;
  onQuickFocus: () => void;
  onNewGoal: () => void;
  userName: string;
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  setCurrentView,
  streakDays,
  onQuickFocus,
  userName,
  onOpenAuth,
}) => {
  const { currentUser, signOut } = useAuth();

  const navItems: { id: NavView; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'goals', label: 'Goals', icon: Target },
    { id: 'timer', label: 'Focus Space', icon: Timer },
    { id: 'planner', label: 'AI Schedule', icon: CalendarDays },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'assistant', label: 'AI Mentor', icon: Sparkles },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#0A0A0A]/95 backdrop-blur-md border-b border-white/10 text-[#F5F5F5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-8">
            <button
              onClick={() => setCurrentView('dashboard')}
              className="flex items-center gap-3 group text-left focus:outline-hidden cursor-pointer"
              id="brand-logo-btn"
            >
              <div className="w-9 h-9 bg-white text-black flex items-center justify-center font-black group-hover:bg-neutral-200 transition-colors">
                <Target className="w-5 h-5 text-black" />
              </div>
              <div className="flex flex-col">
                {/* <div className="text-[9px] font-mono tracking-[0.3em] uppercase opacity-60">SYSTEM // 2026</div> */}
                <span className="text-xl font-black uppercase tracking-tighter text-white leading-none">
                  MILESTONE
                </span>
              </div>
            </button>

            {/* Main Navigation Links - Desktop */}
            <nav className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentView(item.id)}
                    id={`nav-${item.id}`}
                    className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold uppercase tracking-widest transition-all cursor-pointer ${
                      isActive
                        ? 'bg-white text-black font-extrabold'
                        : 'text-neutral-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-black' : 'text-neutral-400'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Streak Counter */}
            <div
              className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400 text-[11px] font-mono font-bold uppercase tracking-wider"
              title="Active Streak"
            >
              <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>{streakDays}D STREAK</span>
            </div>

            {/* Quick Focus Button */}
            <button
              onClick={onQuickFocus}
              id="quick-focus-btn"
              className="hidden lg:flex items-center gap-2 px-3.5 py-2 bg-white text-black text-xs font-black uppercase tracking-widest hover:bg-neutral-200 transition-colors cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current text-black" />
              <span>FOCUS TIMER</span>
            </button>

            {/* User Profile Chip */}
            {currentUser && (
              <button
                onClick={onOpenAuth}
                id="auth-profile-btn"
                className="flex items-center gap-2 px-2.5 py-1.5 bg-[#161616] border border-white/20 hover:border-white/50 text-white transition-all cursor-pointer"
                title={`Signed in as ${currentUser.displayName || currentUser.email}`}
              >
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'Profile'}
                    className="w-5 h-5 rounded-full object-cover border border-white/20"
                  />
                ) : (
                  <div className="w-5 h-5 bg-white text-black font-bold text-xs flex items-center justify-center font-mono">
                    {(currentUser.displayName || currentUser.email || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="hidden sm:inline text-xs font-mono font-bold truncate max-w-[110px]">
                  {currentUser.displayName?.split(' ')[0] || userName || 'User'}
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500" title="Server Sync Active" />
              </button>
            )}

            {/* Settings Link */}
            <button
              onClick={() => setCurrentView('settings')}
              id="settings-avatar-btn"
              className={`flex items-center gap-2 p-2 border transition-all cursor-pointer ${
                currentView === 'settings'
                  ? 'border-white bg-white text-black'
                  : 'border-white/10 hover:border-white/30 text-white bg-[#161616]'
              }`}
              title="Settings & Profile"
            >
              <Settings className={`w-4 h-4 ${currentView === 'settings' ? 'text-black' : 'text-neutral-400'}`} />
            </button>

            {/* Quick Sign Out button */}
            <button
              onClick={signOut}
              id="nav-logout-btn"
              className="p-2 border border-white/10 hover:border-rose-400/50 hover:bg-rose-950/20 text-neutral-400 hover:text-rose-300 transition-all cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Sub-Navigation Bar */}
        <div className="md:hidden flex items-center justify-between py-2 border-t border-white/10 overflow-x-auto no-scrollbar gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-white text-black font-extrabold'
                    : 'text-neutral-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
