import React, { useState } from 'react';
import { UserProfile } from '../types';
import {
  User,
  GraduationCap,
  Sliders,
  Save,
  Check,
  ShieldCheck,
  LogOut,
  Cloud,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SettingsViewProps {
  userProfile: UserProfile;
  onSaveProfile: (updated: UserProfile) => void;
  onOpenAuth: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  userProfile,
  onSaveProfile,
  onOpenAuth,
}) => {
  const { currentUser, signOut } = useAuth();

  const [name, setName] = useState(userProfile.name || currentUser?.displayName || '');
  const [school, setSchool] = useState(userProfile.school || '');
  const [major, setMajor] = useState(userProfile.major || '');
  const [semester, setSemester] = useState(userProfile.semester || '');
  const [dailyGoalHours, setDailyGoalHours] = useState(userProfile.dailyGoalHours || 4);
  const [pomodoroMinutes, setPomodoroMinutes] = useState(userProfile.pomodoroMinutes || 25);
  const [shortBreakMinutes, setShortBreakMinutes] = useState(userProfile.shortBreakMinutes || 5);

  const [isSaved, setIsSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile({
      ...userProfile,
      name,
      school,
      major,
      semester,
      dailyGoalHours,
      pomodoroMinutes,
      shortBreakMinutes,
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="space-y-8 pb-12 max-w-3xl mx-auto">
      
      {/* Header */}
      <div className="bg-[#121212] border border-white/10 p-6 text-white">
        <div className="text-[10px] font-mono tracking-[0.2em] text-neutral-400 uppercase">MODULE // 06</div>
        <h1 className="text-2xl font-black uppercase text-white tracking-tight flex items-center gap-2.5 mt-0.5">
          <User className="w-6 h-6 text-white" />
          <span>STUDENT PROFILE & PREFERENCES</span>
        </h1>
        <p className="text-xs font-mono text-neutral-400 mt-1">
          Manage your account, academic preferences, and study sprint parameters.
        </p>
      </div>

      {/* Authentication & User Account Card */}
      <div className="bg-[#121212] border border-white/10 p-6 text-white space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <Cloud className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-black uppercase tracking-wider text-white">
              AUTHENTICATED USER ACCOUNT
            </h3>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 border border-emerald-500/40 text-emerald-400 bg-emerald-500/10">
            AUTHENTICATED // JWT SESSION ACTIVE
          </span>
        </div>

        {currentUser && (
          <div className="space-y-4 font-mono">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-[#1A1A1A] border border-white/10">
              <div className="flex items-center gap-4">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'User'}
                    className="w-12 h-12 rounded-full border border-white/20 object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 bg-white text-black font-black flex items-center justify-center text-lg">
                    {(currentUser.displayName || currentUser.email || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="overflow-hidden">
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    <span>{currentUser.displayName || name || 'Academic Scholar'}</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-xs text-neutral-400 truncate">{currentUser.email}</div>
                  <div className="text-[10px] text-neutral-500 truncate mt-0.5">UID: {currentUser.uid}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onOpenAuth}
                  className="px-3 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white text-xs font-bold uppercase tracking-wider border border-white/15 transition-colors cursor-pointer"
                >
                  ACCOUNT INFO
                </button>
                <button
                  type="button"
                  onClick={signOut}
                  className="px-3 py-2 bg-neutral-800 hover:bg-rose-950 text-white hover:text-rose-300 text-xs font-bold uppercase tracking-wider border border-white/10 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>SIGN OUT</span>
                </button>
              </div>
            </div>
            <p className="text-xs text-neutral-400">
              All your study goals, focus sprint logs, and preferences are automatically saved to your private account on the Milestone server.
            </p>
          </div>
        )}
      </div>

      {/* Free College Project Notice Banner */}
      <div className="p-4 bg-[#121212] border border-emerald-500/40 text-white flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="text-xs font-mono">
          <h4 className="font-bold text-emerald-300 uppercase tracking-wider">ACADEMIC PERSONAL PROJECT MODE</h4>
          <p className="mt-1 text-neutral-300 leading-relaxed">
            All AI scheduling tools, goal breakdown features, focus timers, and mentor assistants are 100% free with zero paywalls, pricing tiers, or subscriptions.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Profile Card */}
        <div className="bg-[#121212] border border-white/10 p-6 text-white space-y-4">
          <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-white" />
            <span>ACADEMIC INFORMATION</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-1">STUDENT NAME</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Alex Rivera"
                required
                className="w-full px-3.5 py-2.5 bg-[#1A1A1A] border border-white/20 text-xs text-white outline-hidden focus:border-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-1">UNIVERSITY / COLLEGE</label>
              <input
                type="text"
                value={school}
                onChange={(e) => setSchool(e.target.value)}
                placeholder="e.g., Stanford University"
                className="w-full px-3.5 py-2.5 bg-[#1A1A1A] border border-white/20 text-xs text-white outline-hidden focus:border-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-1">MAJOR / FIELD OF STUDY</label>
              <input
                type="text"
                value={major}
                onChange={(e) => setMajor(e.target.value)}
                placeholder="e.g., Computer Science"
                className="w-full px-3.5 py-2.5 bg-[#1A1A1A] border border-white/20 text-xs text-white outline-hidden focus:border-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-1">CURRENT TERM / SEMESTER</label>
              <input
                type="text"
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                placeholder="e.g., Fall 2026"
                className="w-full px-3.5 py-2.5 bg-[#1A1A1A] border border-white/20 text-xs text-white outline-hidden focus:border-white"
              />
            </div>
          </div>
        </div>

        {/* Study Preferences Card */}
        <div className="bg-[#121212] border border-white/10 p-6 text-white space-y-4">
          <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
            <Sliders className="w-4 h-4 text-white" />
            <span>FOCUS & TIMER PREFERENCES</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-1">DAILY TARGET (HOURS)</label>
              <input
                type="number"
                min="1"
                max="16"
                value={dailyGoalHours}
                onChange={(e) => setDailyGoalHours(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-[#1A1A1A] border border-white/20 text-xs text-white outline-hidden focus:border-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-1">DEFAULT SPRINT (MINS)</label>
              <input
                type="number"
                min="5"
                max="120"
                value={pomodoroMinutes}
                onChange={(e) => setPomodoroMinutes(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-[#1A1A1A] border border-white/20 text-xs text-white outline-hidden focus:border-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-1">SHORT BREAK (MINS)</label>
              <input
                type="number"
                min="1"
                max="30"
                value={shortBreakMinutes}
                onChange={(e) => setShortBreakMinutes(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-[#1A1A1A] border border-white/20 text-xs text-white outline-hidden focus:border-white"
              />
            </div>
          </div>
        </div>

        {/* Save control */}
        <div className="flex items-center justify-between">
          <button
            type="submit"
            className="w-full sm:w-auto px-8 py-3.5 bg-white text-black font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer hover:bg-neutral-200 transition-colors"
          >
            {isSaved ? <Check className="w-4 h-4 text-black" /> : <Save className="w-4 h-4 text-black" />}
            <span>{isSaved ? 'PREFERENCES SAVED!' : 'SAVE PREFERENCES'}</span>
          </button>
        </div>

      </form>

    </div>
  );
};
