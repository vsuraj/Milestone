import React from 'react';
import { Goal, ScheduleBlock, NavView, UserProfile } from '../types';
import {
  Timer,
  Target,
  CheckCircle2,
  Sparkles,
  Flame,
  ArrowRight,
  Plus,
  Play,
  Calendar,
  BookOpen,
  TrendingUp,
  Clock,
  Zap,
} from 'lucide-react';
import { motion } from 'motion/react';

interface DashboardViewProps {
  userProfile: UserProfile;
  goals: Goal[];
  schedule: ScheduleBlock[];
  onToggleScheduleBlock: (id: string) => void;
  onStartTimerForSubject: (subject: string, minutes: number) => void;
  setCurrentView: (view: NavView) => void;
  onOpenNewGoalModal: () => void;
  onOpenScheduleGenerator: () => void;
  todayFocusMinutes: number;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  userProfile,
  goals,
  schedule,
  onToggleScheduleBlock,
  onStartTimerForSubject,
  setCurrentView,
  onOpenNewGoalModal,
  onOpenScheduleGenerator,
  todayFocusMinutes,
}) => {
  const goalTargetMinutes = (userProfile.dailyGoalHours || 4) * 60;
  const focusProgress = Math.min(100, Math.round((todayFocusMinutes / goalTargetMinutes) * 100));

  const totalTasks = schedule.length;
  const completedTasks = schedule.filter((s) => s.completed).length;

  const activeGoals = goals.filter((g) => g.progress < 100);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'MORNING';
    if (hour < 18) return 'AFTERNOON';
    return 'EVENING';
  };

  const displayName = (userProfile.name || 'SCHOLAR').split(' ')[0].toUpperCase();

  return (
    <div className="space-y-8 pb-12">
      
      {/* Welcome & Overview Hero Header */}
      <div className="bg-[#121212] border border-white/10 p-6 sm:p-8 text-[#F5F5F5] relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="px-3 py-1 bg-white/10 border border-white/15 text-[10px] font-mono tracking-widest uppercase font-bold text-white">
                {userProfile.semester || 'ACTIVE SEMESTER'} // {userProfile.major || 'GENERAL ACADEMICS'}
              </span>
              <span className="text-[10px] font-mono tracking-widest text-emerald-400 uppercase">
                ● POSTGRESQL SYNC ACTIVE
              </span>
            </div>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tighter leading-[0.9]">
              GOOD {getGreeting()},<br />
              {displayName}
            </h1>
            <p className="mt-3 text-neutral-400 text-xs sm:text-sm max-w-xl font-mono">
              LOGGED <span className="text-white font-bold">{Math.floor(todayFocusMinutes / 60)}H {todayFocusMinutes % 60}M</span> FOCUS TODAY // TARGET {userProfile.dailyGoalHours}H DAILY
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onStartTimerForSubject('General Study', userProfile.pomodoroMinutes || 25)}
              id="dash-start-timer-btn"
              className="px-5 py-3 bg-white text-black text-xs font-black uppercase tracking-widest hover:bg-neutral-200 transition-colors flex items-center gap-2.5 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current text-black" />
              <span>START {userProfile.pomodoroMinutes || 25}M FOCUS</span>
            </button>
            <button
              onClick={onOpenScheduleGenerator}
              id="dash-ai-schedule-btn"
              className="px-5 py-3 bg-transparent text-white border border-white/20 hover:bg-white/10 text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>AI PLANNER</span>
            </button>
          </div>
        </div>
      </div>

      {/* Key Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Today's Focus Time */}
        <div className="bg-[#121212] border border-white/10 p-5 flex flex-col justify-between group hover:border-white/20 transition-all">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-mono uppercase text-neutral-400 tracking-wider">01 // METRIC</span>
            <Timer className="w-5 h-5 text-neutral-300" />
          </div>
          <div className="mt-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">FOCUS TIME TODAY</p>
            <h3 className="text-3xl font-black text-white uppercase tracking-tight mt-1">
              {Math.floor(todayFocusMinutes / 60)}H {todayFocusMinutes % 60}M
            </h3>
            <p className="text-xs font-mono text-neutral-400 mt-1">
              GOAL: {userProfile.dailyGoalHours}H <span className="text-white font-bold">({focusProgress}%)</span>
            </p>
          </div>
        </div>

        {/* Active Academic Goals */}
        <div className="bg-[#121212] border border-white/10 p-5 flex flex-col justify-between group hover:border-white/20 transition-all">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-mono uppercase text-neutral-400 tracking-wider">02 // METRIC</span>
            <Target className="w-5 h-5 text-neutral-300" />
          </div>
          <div className="mt-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">ACTIVE GOALS</p>
            <h3 className="text-3xl font-black text-white uppercase tracking-tight mt-1">
              {activeGoals.length} {activeGoals.length === 1 ? 'TARGET' : 'TARGETS'}
            </h3>
            <p className="text-xs font-mono text-emerald-400 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{goals.length > 0 ? 'CLOUD SYNCED' : 'READY TO INITIALIZE'}</span>
            </p>
          </div>
        </div>

        {/* Daily Tasks Progress */}
        <div className="bg-[#121212] border border-white/10 p-5 flex flex-col justify-between group hover:border-white/20 transition-all">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-mono uppercase text-neutral-400 tracking-wider">03 // METRIC</span>
            <CheckCircle2 className="w-5 h-5 text-neutral-300" />
          </div>
          <div className="mt-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">DAILY BLOCKS</p>
            <h3 className="text-3xl font-black text-white uppercase tracking-tight mt-1">
              {completedTasks}/{totalTasks}
            </h3>
            <p className="text-xs font-mono text-neutral-400 mt-1">
              {totalTasks === 0 ? 'NO BLOCKS SCHEDULED' : `${totalTasks - completedTasks} BLOCKS PENDING`}
            </p>
          </div>
        </div>

        {/* Focus Momentum */}
        <div className="bg-[#121212] border border-white/10 p-5 flex flex-col justify-between group hover:border-white/20 transition-all">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-mono uppercase text-neutral-400 tracking-wider">04 // METRIC</span>
            <Flame className="w-5 h-5 text-amber-400 fill-amber-400" />
          </div>
          <div className="mt-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">ACTIVE STREAK</p>
            <h3 className="text-3xl font-black text-amber-400 uppercase tracking-tight mt-1">
              {todayFocusMinutes > 0 ? '1 DAY' : '0 DAYS'}
            </h3>
            <p className="text-xs font-mono text-amber-400/90 mt-1 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5" />
              <span>{todayFocusMinutes > 0 ? 'SESSION LOGGED TODAY' : 'START A FOCUS SPRINT'}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Grid: Left Schedule Timeline, Right Goals & AI Mentor CTA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Today's Schedule Timeline */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#121212] border border-white/10 p-6">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
              <div>
                <div className="text-[10px] font-mono text-neutral-400 tracking-[0.2em] uppercase">TIMELINE // 01</div>
                <h2 className="text-xl font-black uppercase text-white tracking-tight flex items-center gap-2.5 mt-0.5">
                  <Calendar className="w-5 h-5 text-white" />
                  <span>TODAY'S STUDY SCHEDULE</span>
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={onOpenScheduleGenerator}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
                  id="dash-gen-schedule-link"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>AI SCHEDULE</span>
                </button>
                <button
                  onClick={() => setCurrentView('planner')}
                  className="p-1.5 text-neutral-400 hover:text-white border border-white/10 hover:border-white/30 cursor-pointer"
                  title="Full Planner View"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Timeline items or Empty State */}
            {schedule.length === 0 ? (
              <div className="py-12 px-6 border border-dashed border-white/15 text-center flex flex-col items-center justify-center space-y-3">
                <div className="w-12 h-12 bg-white/5 border border-white/10 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-neutral-400" />
                </div>
                <h4 className="text-sm font-black uppercase tracking-wider text-white">
                  NO STUDY BLOCKS SCHEDULED FOR TODAY
                </h4>
                <p className="text-xs font-mono text-neutral-400 max-w-md">
                  Use the Gemini AI Timetable generator to automatically structure your day around lectures, study sprints, and breaks.
                </p>
                <button
                  onClick={onOpenScheduleGenerator}
                  className="mt-2 px-5 py-2.5 bg-white text-black font-extrabold text-xs uppercase tracking-widest hover:bg-neutral-200 transition-colors cursor-pointer flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-black" />
                  <span>GENERATE TIMETABLE WITH AI</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {schedule.map((block) => (
                  <motion.div
                    key={block.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 border transition-all flex items-center justify-between gap-4 ${
                      block.completed
                        ? 'bg-[#161616]/60 border-white/5 opacity-50'
                        : 'bg-[#161616] border-white/10 hover:border-white/30'
                    }`}
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
                      <button
                        onClick={() => onToggleScheduleBlock(block.id)}
                        className="mt-0.5 focus:outline-hidden group cursor-pointer"
                        title={block.completed ? 'Mark pending' : 'Mark completed'}
                      >
                        <CheckCircle2
                          className={`w-5 h-5 transition-colors ${
                            block.completed
                              ? 'text-emerald-400 fill-emerald-400'
                              : 'text-neutral-500 group-hover:text-white'
                          }`}
                        />
                      </button>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-mono font-bold text-white bg-white/10 px-2 py-0.5 border border-white/15 uppercase">
                            {block.timeSlot}
                          </span>
                          <span className="text-[10px] font-mono font-bold text-black bg-white px-2 py-0.5 uppercase">
                            {block.subject}
                          </span>
                          <span
                            className={`text-[10px] font-mono font-bold px-2 py-0.5 uppercase border ${
                              block.type === 'Study'
                                ? 'border-indigo-400/30 text-indigo-300 bg-indigo-500/10'
                                : block.type === 'Exam Prep'
                                ? 'border-rose-400/30 text-rose-300 bg-rose-500/10'
                                : block.type === 'Lecture'
                                ? 'border-amber-400/30 text-amber-300 bg-amber-500/10'
                                : 'border-emerald-400/30 text-emerald-300 bg-emerald-500/10'
                            }`}
                          >
                            {block.type}
                          </span>
                        </div>
                        <h4
                          className={`text-sm font-bold uppercase tracking-tight mt-2 truncate ${
                            block.completed ? 'line-through text-neutral-500' : 'text-white'
                          }`}
                        >
                          {block.activity}
                        </h4>
                        <p className="text-xs font-mono text-neutral-400 mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-neutral-500" />
                          <span>METHOD: {block.focusMethod.toUpperCase()}</span>
                        </p>
                      </div>
                    </div>

                    {!block.completed && (
                      <button
                        onClick={() => onStartTimerForSubject(block.subject, userProfile.pomodoroMinutes || 25)}
                        className="shrink-0 p-2.5 bg-white text-black hover:bg-neutral-200 transition-colors cursor-pointer"
                        title="Launch timer for this block"
                      >
                        <Play className="w-4 h-4 fill-current text-black" />
                      </button>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Priority Goals & Quick AI Mentor */}
        <div className="space-y-6">
          
          {/* Priority Goals Widget */}
          <div className="bg-[#121212] border border-white/10 p-6">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
              <div>
                <div className="text-[10px] font-mono text-neutral-400 tracking-[0.2em] uppercase">MODULE // 02</div>
                <h2 className="text-lg font-black uppercase text-white tracking-tight flex items-center gap-2 mt-0.5">
                  <Target className="w-5 h-5 text-white" />
                  <span>PRIORITY GOALS</span>
                </h2>
              </div>
              <button
                onClick={onOpenNewGoalModal}
                className="p-1.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white cursor-pointer"
                title="Add New Goal"
                id="dash-add-goal-btn"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {goals.length === 0 ? (
              <div className="py-8 px-4 border border-dashed border-white/15 text-center space-y-3">
                <Target className="w-8 h-8 text-neutral-500 mx-auto" />
                <h4 className="text-xs font-black uppercase tracking-wider text-white">
                  NO ACADEMIC GOALS CREATED
                </h4>
                <p className="text-[11px] font-mono text-neutral-400 leading-relaxed">
                  Define your exams, course projects, or thesis milestones.
                </p>
                <button
                  onClick={onOpenNewGoalModal}
                  className="px-4 py-2 bg-white text-black font-extrabold text-xs uppercase tracking-widest hover:bg-neutral-200 transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>CREATE GOAL</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {goals.slice(0, 3).map((goal) => (
                  <div
                    key={goal.id}
                    className="p-4 bg-[#161616] border border-white/10 hover:border-white/30 transition-all cursor-pointer group"
                    onClick={() => setCurrentView('goals')}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-black bg-white px-2 py-0.5 uppercase">
                        {goal.category}
                      </span>
                      <span className="text-[10px] font-mono text-neutral-400 uppercase">
                        DUE: {goal.targetDate}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold uppercase tracking-tight text-white mt-2.5 line-clamp-1 group-hover:text-amber-300 transition-colors">
                      {goal.title}
                    </h4>

                    {/* Progress bar */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs font-mono text-neutral-400 mb-1">
                        <span>PROGRESS</span>
                        <span className="font-bold text-white">{goal.progress}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-white/10 overflow-hidden">
                        <div
                          className="h-full bg-white transition-all duration-500"
                          style={{ width: `${goal.progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-2 text-[10px] font-mono text-neutral-400 flex items-center justify-between">
                      <span>{goal.milestones.length} MILESTONES</span>
                      <span className="text-white font-bold group-hover:underline">
                        VIEW →
                      </span>
                    </div>
                  </div>
                ))}

                <button
                  onClick={() => setCurrentView('goals')}
                  className="w-full mt-4 py-2.5 text-center text-xs font-mono font-bold uppercase tracking-wider text-neutral-300 hover:text-white border border-white/10 hover:border-white/30 transition-colors cursor-pointer"
                >
                  VIEW ALL GOALS & AI BREAKDOWNS →
                </button>
              </div>
            )}
          </div>

          {/* AI Mentor Quick Assistant Card */}
          <div className="bg-[#1A1A1A] border border-white/20 p-6 text-white relative overflow-hidden">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-white text-black font-black flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-black" />
              </div>
              <div>
                <div className="text-[9px] font-mono tracking-widest text-neutral-400 uppercase">AI ADVISOR</div>
                <h3 className="font-black uppercase tracking-tight text-base">ACADEMIC MENTOR</h3>
              </div>
            </div>

            <p className="text-xs font-mono text-neutral-300 leading-relaxed mb-4">
              Ask Gemini AI for active recall strategies, exam prep revision blueprints, and study motivation.
            </p>

            <button
              onClick={() => setCurrentView('assistant')}
              id="dash-chat-mentor-btn"
              className="w-full py-3 bg-white text-black hover:bg-neutral-200 font-extrabold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-black" />
              <span>CONSULT AI MENTOR</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
