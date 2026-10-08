import React, { useState, useEffect } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import {
  NavView,
  Goal,
  ScheduleBlock,
  FocusSessionLog,
  UserProfile,
  ChatMessage,
} from './types';
import {
  initialProfile,
  initialGoals,
  initialSchedule,
  initialFocusLogs,
  initialChatMessages,
} from './data/initialData';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { GoalsView } from './components/GoalsView';
import { TimerView } from './components/TimerView';
import { PlannerView } from './components/PlannerView';
import { AnalyticsView } from './components/AnalyticsView';
import { AssistantView } from './components/AssistantView';
import { SettingsView } from './components/SettingsView';
import { AuthModal } from './components/AuthModal';
import { LandingView } from './components/LandingView';
import { useAuth } from './context/AuthContext';
import { aiApi } from './api';
import { Target, X } from 'lucide-react';

const VIEW_ROUTES: NavView[] = [
  'dashboard',
  'goals',
  'timer',
  'planner',
  'analytics',
  'assistant',
  'settings',
];

export default function App() {
  const {
    currentUser,
    loading,
    saveProfile,
    fetchProfile,
    saveGoal,
    deleteGoal,
    fetchGoals,
    saveFocusLog,
    fetchFocusLogs,
  } = useAuth();

  const location = useLocation();
  const navigate = useNavigate();

  // The active view is derived from the URL so refreshes and deep links work.
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const pathView = pathSegments[0] as NavView | undefined;
  const isKnownRoute =
    pathSegments.length === 1 && pathView !== undefined && VIEW_ROUTES.includes(pathView);
  const currentView: NavView = isKnownRoute ? (pathView as NavView) : 'dashboard';
  const setCurrentView = (view: NavView) => navigate(`/${view}`);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  // User state
  const [userProfile, setUserProfile] = useState<UserProfile>(initialProfile);
  const [goals, setGoals] = useState<Goal[]>(initialGoals);
  const [schedule, setSchedule] = useState<ScheduleBlock[]>(initialSchedule);
  const [focusLogs, setFocusLogs] = useState<FocusSessionLog[]>(initialFocusLogs);
  const [messages, setMessages] = useState<ChatMessage[]>(initialChatMessages);

  // State for Timer launching
  const [timerSubject, setTimerSubject] = useState<string>('General Study');
  const [timerMinutes, setTimerMinutes] = useState<number>(25);

  // Modal triggers
  const [isGeneratorModalOpen, setIsGeneratorModalOpen] = useState(false);

  // When the signed-in user changes, load their data from the Django API
  useEffect(() => {
    if (!currentUser) {
      // Clear data on sign out
      setUserProfile(initialProfile);
      setGoals(initialGoals);
      setSchedule(initialSchedule);
      setFocusLogs(initialFocusLogs);
      setMessages(initialChatMessages);
      return;
    }

    let isMounted = true;

    async function loadCloudUserData() {
      try {
        // Fetch profile
        const cloudProf = await fetchProfile();
        if (cloudProf && isMounted) {
          setUserProfile(cloudProf);
        } else if (currentUser && isMounted) {
          const newProf: UserProfile = {
            name: currentUser.displayName || 'Academic Scholar',
            school: '',
            major: '',
            semester: '',
            dailyGoalHours: 4,
            pomodoroMinutes: 25,
            shortBreakMinutes: 5,
            longBreakMinutes: 15,
            soundVolume: 60,
          };
          setUserProfile(newProf);
          await saveProfile(newProf);
        }

        // Fetch goals
        const cloudGoals = await fetchGoals();
        if (isMounted) {
          setGoals(cloudGoals || []);
        }

        // Fetch focus logs
        const cloudLogs = await fetchFocusLogs();
        if (isMounted) {
          setFocusLogs(cloudLogs || []);
        }

        // Set personalized AI initial message
        if (isMounted) {
          const studentName = currentUser.displayName?.split(' ')[0] || 'Scholar';
          setMessages([
            {
              id: 'msg-welcome',
              role: 'assistant',
              text: `Hello ${studentName}! I am your AI Study Mentor. How can I assist you with your academic goals, course breakdown, or study schedule today?`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ]);
        }
      } catch (err) {
        console.error('Error loading user data:', err);
        if (isMounted) setSyncError('Could not load your data from the server.');
      }
    }

    loadCloudUserData();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.uid]);

  // Today's focus minutes calculation from real logs
  const todayStr = new Date().toISOString().split('T')[0];
  const todayFocusMinutes = focusLogs
    .filter((log) => log.timestamp.startsWith(todayStr))
    .reduce((acc, log) => acc + log.durationMinutes, 0);

  // Optimistic UI: state updates immediately, the server write follows. A failed
  // write surfaces a dismissible banner instead of failing silently.
  const persist = async (write: () => Promise<void>) => {
    try {
      await write();
      setSyncError(null);
    } catch (err) {
      console.error('Server sync failed:', err);
      setSyncError('Your last change could not be saved to the server.');
    }
  };

  // Handlers for goals
  const handleAddGoal = async (newGoal: Goal) => {
    setGoals((prev) => [newGoal, ...prev]);
    await persist(() => saveGoal(newGoal));
  };

  const handleUpdateGoal = async (updatedGoal: Goal) => {
    setGoals((prev) => prev.map((g) => (g.id === updatedGoal.id ? updatedGoal : g)));
    await persist(() => saveGoal(updatedGoal));
  };

  const handleDeleteGoal = async (goalId: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== goalId));
    await persist(() => deleteGoal(goalId));
  };

  // Handlers for schedule
  const handleToggleScheduleBlock = (id: string) => {
    setSchedule((prev) =>
      prev.map((s) => (s.id === id ? { ...s, completed: !s.completed } : s))
    );
  };

  const handleUpdateSchedule = (newSchedule: ScheduleBlock[]) => {
    setSchedule(newSchedule);
  };

  // Handler for timer launch from dashboard or schedule block
  const handleStartTimerForSubject = (subjectName: string, minutes: number) => {
    setTimerSubject(subjectName);
    setTimerMinutes(minutes);
    setCurrentView('timer');
  };

  // Handler for logging completed session
  const handleLogFocusSession = async (log: FocusSessionLog) => {
    setFocusLogs((prev) => [log, ...prev]);
    await persist(() => saveFocusLog(log));
  };

  // Handler for saving profile
  const handleSaveProfile = async (updated: UserProfile) => {
    setUserProfile(updated);
    await persist(() => saveProfile(updated));
  };

  // Handler for sending AI assistant message
  const handleSendChatMessage = async (userText: string) => {
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);

    try {
      // The current prompt is passed separately as `message`; including it in
      // history as well made Gemini receive the same user turn twice.
      const historyPayload = messages.slice(-6).map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const data = await aiApi.chat({
        message: userText,
        history: historyPayload,
      });
      const aiMsg: ChatMessage = {
        id: `msg-ai-${Date.now()}`,
        role: 'assistant',
        text: data.text || 'I am ready to help with your study goals!',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: unknown) {
      console.error(err);
      const detail = err instanceof Error ? err.message : 'Please try again.';
      const errorMsg: ChatMessage = {
        id: `msg-err-${Date.now()}`,
        role: 'assistant',
        text: `Sorry, the mentor service could not complete that request. ${detail}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    }
  };

  // While the stored JWT session is being restored, show the bold loader
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-[#F5F5F5] font-sans flex flex-col items-center justify-center p-6 selection:bg-white selection:text-black">
        <div className="w-12 h-12 bg-white text-black flex items-center justify-center font-black mb-4">
          <Target className="w-7 h-7 text-black animate-spin" />
        </div>
        <div className="text-[10px] font-mono tracking-[0.3em] uppercase opacity-70">
          SYSTEM // INITIALIZING
        </div>
        <div className="text-xl font-black uppercase tracking-tight text-white mt-2">
          CONNECTING TO MILESTONE...
        </div>
      </div>
    );
  }

  // Not authenticated: landing page (with the sign-in / register dialog on /login, /register)
  if (!currentUser) {
    return (
      <Routes>
        <Route path="/" element={<LandingView />} />
        <Route path="/login" element={<LandingView initialMode="login" />} />
        <Route path="/register" element={<LandingView initialMode="register" />} />
        <Route
          path="*"
          element={<Navigate to="/login" replace state={{ from: location.pathname }} />}
        />
      </Routes>
    );
  }

  // Authenticated but on "/", "/login" or an unknown path: go to the requested
  // page (if we bounced here from a protected link) or the dashboard.
  if (!isKnownRoute) {
    const from = (location.state as { from?: string } | null)?.from;
    const fromView = from?.split('/').filter(Boolean)[0] as NavView | undefined;
    const target = fromView && VIEW_ROUTES.includes(fromView) ? `/${fromView}` : '/dashboard';
    return <Navigate to={target} replace />;
  }

  // Once authenticated, show user's personal academic workspace
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#F5F5F5] font-sans antialiased flex flex-col selection:bg-white selection:text-black">
      
      {/* Top Navbar */}
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        streakDays={focusLogs.length > 0 ? 1 : 0}
        onQuickFocus={() => handleStartTimerForSubject('General Study', userProfile.pomodoroMinutes || 25)}
        onNewGoal={() => setCurrentView('goals')}
        userName={currentUser.displayName || userProfile.name || 'Scholar'}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />

      {syncError && (
        <div
          role="alert"
          className="max-w-7xl w-full mx-auto mt-4 px-4 sm:px-6 lg:px-8"
        >
          <div className="p-3 bg-rose-950/50 border border-rose-500/50 text-rose-200 text-xs font-mono flex items-center justify-between gap-3">
            <span>{syncError}</span>
            <button
              onClick={() => setSyncError(null)}
              className="text-rose-300 hover:text-white cursor-pointer"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {currentView === 'dashboard' && (
          <DashboardView
            userProfile={userProfile}
            goals={goals}
            schedule={schedule}
            onToggleScheduleBlock={handleToggleScheduleBlock}
            onStartTimerForSubject={handleStartTimerForSubject}
            setCurrentView={setCurrentView}
            onOpenNewGoalModal={() => setCurrentView('goals')}
            onOpenScheduleGenerator={() => {
              setCurrentView('planner');
              setIsGeneratorModalOpen(true);
            }}
            todayFocusMinutes={todayFocusMinutes}
          />
        )}

        {currentView === 'goals' && (
          <GoalsView
            goals={goals}
            onAddGoal={handleAddGoal}
            onUpdateGoal={handleUpdateGoal}
            onDeleteGoal={handleDeleteGoal}
          />
        )}

        {currentView === 'timer' && (
          <TimerView
            userProfile={userProfile}
            onLogSession={handleLogFocusSession}
            initialSubject={timerSubject}
            initialMinutes={timerMinutes}
          />
        )}

        {currentView === 'planner' && (
          <PlannerView
            schedule={schedule}
            onUpdateSchedule={handleUpdateSchedule}
            onToggleBlock={handleToggleScheduleBlock}
            onStartTimer={handleStartTimerForSubject}
            isGeneratorModalOpen={isGeneratorModalOpen}
            setIsGeneratorModalOpen={setIsGeneratorModalOpen}
          />
        )}

        {currentView === 'analytics' && (
          <AnalyticsView
            userProfile={userProfile}
            focusLogs={focusLogs}
            goals={goals}
          />
        )}

        {currentView === 'assistant' && (
          <AssistantView
            userProfile={userProfile}
            messages={messages}
            onSendMessage={handleSendChatMessage}
          />
        )}

        {currentView === 'settings' && (
          <SettingsView
            userProfile={userProfile}
            onSaveProfile={handleSaveProfile}
            onOpenAuth={() => setIsAuthModalOpen(true)}
          />
        )}
      </main>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* Footer Status Bar */}
      <footer className="border-t border-white/10 bg-[#0A0A0A] py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs tracking-widest uppercase opacity-60 gap-4 font-mono">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <span>System Status: Optimal / Active • User Authenticated</span>
          </div>
          <p>© 2026 Milestone • Academic Operating System</p>
          <div className="flex items-center gap-4 text-[10px]">
            <span>POSTGRESQL PERSISTENCE</span>
            <span>#FF3902</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
