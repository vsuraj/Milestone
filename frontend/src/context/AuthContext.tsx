import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  ApiError,
  authApi,
  focusApi,
  goalsApi,
  onSessionExpired,
  profileApi,
  refreshAccessToken,
  tokenStore,
} from '../api';
import { AppUser, FocusSessionLog, Goal, UserProfile } from '../types';
import { initialProfile } from '../data/initialData';

interface AuthContextType {
  currentUser: AppUser | null;
  /** True only while the stored session is being restored on first load. */
  loading: boolean;
  authError: string | null;
  clearAuthError: () => void;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  saveProfile: (profile: UserProfile) => Promise<void>;
  fetchProfile: () => Promise<UserProfile | null>;
  saveGoal: (goal: Goal) => Promise<void>;
  deleteGoal: (goalId: string) => Promise<void>;
  fetchGoals: () => Promise<Goal[]>;
  saveFocusLog: (log: FocusSessionLog) => Promise<void>;
  fetchFocusLogs: () => Promise<FocusSessionLog[]>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Restore the session (refresh token -> access token -> /me) on first load.
  useEffect(() => {
    let cancelled = false;

    async function restore() {
      try {
        if (tokenStore.getRefresh()) {
          const access = await refreshAccessToken();
          if (access) {
            const user = await authApi.me();
            if (!cancelled) setCurrentUser(user);
          }
        }
      } catch (err) {
        console.error('Could not restore session:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    restore();
    return () => {
      cancelled = true;
    };
  }, []);

  // If a token refresh fails mid-session, drop back to the landing page.
  useEffect(() => {
    onSessionExpired(() => {
      setCurrentUser(null);
      setAuthError('Your session has expired. Please sign in again.');
    });
    return () => onSessionExpired(null);
  }, []);

  const clearAuthError = useCallback(() => setAuthError(null), []);

  const login = useCallback(async (email: string, password: string) => {
    setAuthError(null);
    try {
      setCurrentUser(await authApi.login(email, password));
      return true;
    } catch (err) {
      setAuthError(
        err instanceof ApiError && err.status === 401
          ? 'Incorrect email or password.'
          : err instanceof Error
            ? err.message
            : 'Authentication failed. Please try again.',
      );
      return false;
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    setAuthError(null);
    try {
      setCurrentUser(await authApi.register(name, email, password));
      return true;
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
      return false;
    }
  }, []);

  const signOut = useCallback(async () => {
    setAuthError(null);
    await authApi.logout();
    setCurrentUser(null);
  }, []);

  const fetchProfile = useCallback(async (): Promise<UserProfile | null> => {
    if (!currentUser) return null;
    const data = await profileApi.get();
    return {
      name: data.name || currentUser.displayName || initialProfile.name,
      school: data.school ?? initialProfile.school,
      major: data.major ?? initialProfile.major,
      semester: data.semester ?? initialProfile.semester,
      dailyGoalHours: data.dailyGoalHours ?? initialProfile.dailyGoalHours,
      pomodoroMinutes: data.pomodoroMinutes ?? initialProfile.pomodoroMinutes,
      shortBreakMinutes: data.shortBreakMinutes ?? initialProfile.shortBreakMinutes,
      longBreakMinutes: data.longBreakMinutes ?? initialProfile.longBreakMinutes,
      soundVolume: data.soundVolume ?? initialProfile.soundVolume,
    };
  }, [currentUser]);

  const saveProfile = useCallback(
    async (profile: UserProfile) => {
      if (!currentUser) return;
      const saved = await profileApi.save(profile);
      // Keep the navbar / settings header in sync with the saved display name.
      setCurrentUser((prev) => (prev ? { ...prev, displayName: saved.name } : prev));
    },
    [currentUser],
  );

  const fetchGoals = useCallback(async () => (currentUser ? goalsApi.list() : []), [currentUser]);

  const saveGoal = useCallback(
    async (goal: Goal) => {
      if (!currentUser) return;
      await goalsApi.save(goal);
    },
    [currentUser],
  );

  const deleteGoal = useCallback(
    async (goalId: string) => {
      if (!currentUser) return;
      await goalsApi.remove(goalId);
    },
    [currentUser],
  );

  const fetchFocusLogs = useCallback(
    async () => (currentUser ? focusApi.list() : []),
    [currentUser],
  );

  const saveFocusLog = useCallback(
    async (log: FocusSessionLog) => {
      if (!currentUser) return;
      await focusApi.create(log);
    },
    [currentUser],
  );

  const value = useMemo<AuthContextType>(
    () => ({
      currentUser,
      loading,
      authError,
      clearAuthError,
      login,
      register,
      signOut,
      saveProfile,
      fetchProfile,
      saveGoal,
      deleteGoal,
      fetchGoals,
      saveFocusLog,
      fetchFocusLogs,
    }),
    [
      currentUser,
      loading,
      authError,
      clearAuthError,
      login,
      register,
      signOut,
      saveProfile,
      fetchProfile,
      saveGoal,
      deleteGoal,
      fetchGoals,
      saveFocusLog,
      fetchFocusLogs,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
