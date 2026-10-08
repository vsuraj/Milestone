import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AuthForm, AuthMode } from './AuthForm';
import { Target, Sparkles, Timer, CalendarDays, BarChart3, ShieldCheck, ArrowRight, CheckCircle2, LogIn, X } from 'lucide-react';

interface LandingViewProps {
  /** When set (routes /login and /register) the auth dialog opens immediately. */
  initialMode?: AuthMode;
}

export const LandingView: React.FC<LandingViewProps> = ({ initialMode }) => {
  const { loading, authError, clearAuthError } = useAuth();
  const navigate = useNavigate();
  const [isAuthOpen, setIsAuthOpen] = useState(initialMode !== undefined);
  const [authMode, setAuthMode] = useState<AuthMode>(initialMode ?? 'login');

  const openAuth = (mode: AuthMode) => {
    clearAuthError();
    setAuthMode(mode);
    setIsAuthOpen(true);
  };

  const closeAuth = () => {
    clearAuthError();
    setIsAuthOpen(false);
    if (initialMode !== undefined) navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#F5F5F5] font-sans flex flex-col justify-between p-6 sm:p-10 lg:p-12 selection:bg-white selection:text-black">
      
      {/* Top Header Navigation */}
      <header className="flex justify-between items-baseline mb-8 lg:mb-12">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white text-black flex items-center justify-center font-black">
            <Target className="w-5 h-5 text-black" />
          </div>
          <span className="text-xs tracking-[0.3em] font-mono font-bold uppercase opacity-70">
            SYSTEM // 2026 // MILESTONE
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono uppercase tracking-widest">
          <span className="hidden sm:inline px-3 py-1 border border-white/20 text-neutral-400 text-[10px]">
            ACADEMIC EDITION
          </span>
          <button
            onClick={() => openAuth('login')}
            disabled={loading}
            className="px-4 py-2 bg-white text-black font-extrabold hover:bg-neutral-200 transition-colors cursor-pointer text-xs uppercase tracking-widest flex items-center gap-2"
          >
            <span>{loading ? 'CONNECTING...' : 'SIGN IN'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="flex-1 flex flex-col justify-between py-4 lg:py-6">
        
        {/* Massive Headline & Description */}
        <div className="relative mb-10 lg:mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            <div className="lg:col-span-8">
              <div className="text-xs font-mono tracking-[0.25em] text-neutral-400 uppercase mb-3">
                01 // PERSONAL ACADEMIC PLATFORM
              </div>
              <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-[104px] leading-[0.88] font-black tracking-tighter uppercase text-white">
                STUDENT<br />OPERATING<br />SYSTEM
              </h1>
            </div>

            <div className="lg:col-span-4 lg:pt-8 flex flex-col justify-between h-full space-y-6">
              <p className="text-sm sm:text-base leading-relaxed text-neutral-300 font-mono">
                An exploratory interface combining intelligent AI study timetables, granular milestone tracking, and Pomodoro focus sprints. Built for college scholars.
              </p>

              <div className="flex flex-wrap gap-2 font-mono text-[10px] tracking-widest uppercase">
                <span className="px-3 py-1 border border-white/20 text-white">REACT 19</span>
                <span className="px-3 py-1 border border-white/20 text-white">DJANGO + POSTGRES</span>
                <span className="px-3 py-1 border border-white/20 text-white">GEMINI 3.5</span>
                <span className="px-3 py-1 border border-white/20 text-white">100% FREE</span>
              </div>

              {/* Free college project guarantee banner */}
              <div className="p-4 bg-[#141414] border border-white/10 text-xs font-mono flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-neutral-300">
                  College Personal Project • No paywalls, no subscriptions, no pricing tiers.
                </span>
              </div>
            </div>

          </div>
        </div>

        {/* Error notice if sign-in failed */}
        {authError && !isAuthOpen && (
          <div className="mb-6 p-4 bg-rose-950/60 border border-rose-500/50 text-rose-200 text-xs font-mono">
            {authError}
          </div>
        )}

        {/* Interactive Feature Modules Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Module 01: Goals */}
          <div className="group relative bg-[#141414] border border-white/10 p-6 flex flex-col justify-between min-h-[190px] transition-all hover:border-white/30">
            <span className="text-[10px] opacity-40 font-mono">01 // ARCHITECT</span>
            <div>
              <h3 className="text-xl font-black uppercase text-white">GOALS & SUBTASKS</h3>
              <p className="text-xs font-mono text-neutral-400 mt-1 line-clamp-2">
                Break large syllabi and projects into actionable milestones.
              </p>
            </div>
            <div className="h-0.5 w-0 group-hover:w-full bg-white transition-all duration-300"></div>
          </div>

          {/* Module 02: Timer */}
          <div className="group relative bg-[#141414] border border-white/10 p-6 flex flex-col justify-between min-h-[190px] transition-all hover:border-white/30">
            <span className="text-[10px] opacity-40 font-mono">02 // SPRINT</span>
            <div>
              <h3 className="text-xl font-black uppercase text-white">FOCUS SPACE</h3>
              <p className="text-xs font-mono text-neutral-400 mt-1 line-clamp-2">
                Pomodoro sprint timer with customizable intervals and sound.
              </p>
            </div>
            <div className="h-0.5 w-0 group-hover:w-full bg-white transition-all duration-300"></div>
          </div>

          {/* Module 03: AI Planner */}
          <div className="group relative bg-[#141414] border border-white/10 p-6 flex flex-col justify-between min-h-[190px] transition-all hover:border-white/30">
            <span className="text-[10px] opacity-40 font-mono">03 // INTELLIGENCE</span>
            <div>
              <h3 className="text-xl font-black uppercase text-white">AI TIMETABLE</h3>
              <p className="text-xs font-mono text-neutral-400 mt-1 line-clamp-2">
                Auto-generate balanced study schedules powered by Gemini.
              </p>
            </div>
            <div className="h-0.5 w-0 group-hover:w-full bg-white transition-all duration-300"></div>
          </div>

          {/* Module 04: The Primary Action Card (Sign in / Create account) */}
          <button
            onClick={() => openAuth('login')}
            disabled={loading}
            id="landing-sign-in-action"
            className="group relative bg-white text-black p-6 flex flex-col justify-between min-h-[190px] transition-all hover:bg-neutral-200 cursor-pointer text-left focus:outline-hidden"
          >
            <div className="flex justify-between items-center w-full">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider opacity-60">
                04 // ACTION
              </span>
              <LogIn className="w-5 h-5 text-black" />
            </div>

            <div>
              <h3 className="text-2xl font-black uppercase leading-tight tracking-tight">
                {loading ? 'CONNECTING...' : 'SIGN IN OR CREATE ACCOUNT'}
              </h3>
              <p className="text-[11px] font-mono font-medium opacity-70 mt-1">
                Enter your workspace & save your study goals
              </p>
            </div>

            <div className="flex items-center justify-between w-full pt-2">
              <span className="text-[10px] font-mono uppercase font-bold tracking-widest">
                LAUNCH SYSTEM
              </span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

        </div>

      </main>

      {/* Footer Status Bar */}
      <footer className="mt-8 lg:mt-12 flex flex-col sm:flex-row justify-between items-center border-t border-white/10 pt-6 text-xs font-mono uppercase tracking-widest text-neutral-400 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span>System Status: Optimal / Ready For Authentication</span>
        </div>
        <div className="text-center">
          Milestone • Personal College Project © 2026
        </div>
        <div className="flex items-center gap-6">
          <div className="flex flex-col text-right">
            <span className="text-[9px] uppercase opacity-50">ENGINE</span>
            <span className="text-[10px] text-white">GEMINI 3.5 FLASH LITE</span>
          </div>
          <div className="flex flex-col text-right">
            <span className="text-[9px] uppercase opacity-50">HASH</span>
            <span className="text-[10px] text-white">#FF3902</span>
          </div>
        </div>
      </footer>

      {/* Auth dialog (email + password, Django JWT) */}
      {isAuthOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-label="Sign in or create an account"
        >
          <div className="relative w-full max-w-md bg-[#121212] border border-white/20 p-6 text-white shadow-2xl">
            <button
              onClick={closeAuth}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="mb-6">
              <div className="text-[10px] font-mono tracking-[0.25em] text-neutral-400 uppercase">
                AUTHENTICATION // SECURE ACCESS
              </div>
              <h2 className="text-xl font-black uppercase tracking-tight text-white mt-1">
                STUDENT ACCOUNT
              </h2>
              <p className="text-xs font-mono text-neutral-400 mt-1">
                Sign in to keep your goals and focus sessions across devices.
              </p>
            </div>
            <AuthForm key={authMode} initialMode={authMode} />
          </div>
        </div>
      )}

    </div>
  );
};
