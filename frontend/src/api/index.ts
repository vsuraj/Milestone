import { apiRequest, tokenStore } from './client';
import type {
  AppUser,
  FocusSessionLog,
  Goal,
  Milestone,
  Priority,
  ScheduleBlock,
  UserProfile,
} from '../types';

export { ApiError, onSessionExpired, refreshAccessToken, tokenStore } from './client';

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
interface ServerUser {
  id: number | string;
  email: string;
  displayName: string;
  photoURL?: string;
}

interface AuthResponse {
  access: string;
  refresh: string;
  user: ServerUser;
}

export function toAppUser(user: ServerUser): AppUser {
  return {
    uid: String(user.id),
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL || null,
  };
}

export const authApi = {
  async register(name: string, email: string, password: string): Promise<AppUser> {
    const data = await apiRequest<AuthResponse>('/api/auth/register/', {
      method: 'POST',
      body: { name, email, password },
      auth: false,
    });
    tokenStore.set(data.access, data.refresh);
    return toAppUser(data.user);
  },

  async login(email: string, password: string): Promise<AppUser> {
    const data = await apiRequest<AuthResponse>('/api/auth/login/', {
      method: 'POST',
      body: { email, password },
      auth: false,
    });
    tokenStore.set(data.access, data.refresh);
    return toAppUser(data.user);
  },

  async me(): Promise<AppUser> {
    return toAppUser(await apiRequest<ServerUser>('/api/auth/me/'));
  },

  async logout(): Promise<void> {
    const refresh = tokenStore.getRefresh();
    tokenStore.clear();
    if (!refresh) return;
    try {
      await apiRequest<null>('/api/auth/logout/', {
        method: 'POST',
        body: { refresh },
        auth: false,
      });
    } catch {
      /* the local session is already gone; blacklisting is best-effort */
    }
  },
};

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------
export const profileApi = {
  get: () => apiRequest<UserProfile>('/api/profile/'),
  save: (profile: UserProfile) =>
    apiRequest<UserProfile>('/api/profile/', { method: 'PUT', body: profile }),
};

// ---------------------------------------------------------------------------
// Goals (PUT is an upsert: creates the goal if it does not exist yet)
// ---------------------------------------------------------------------------
export const goalsApi = {
  list: () => apiRequest<Goal[]>('/api/goals/'),
  save: (goal: Goal) =>
    apiRequest<Goal>(`/api/goals/${encodeURIComponent(goal.id)}/`, {
      method: 'PUT',
      body: goal,
    }),
  remove: (goalId: string) =>
    apiRequest<null>(`/api/goals/${encodeURIComponent(goalId)}/`, { method: 'DELETE' }),
};

// ---------------------------------------------------------------------------
// Focus logs
// ---------------------------------------------------------------------------
export const focusApi = {
  list: () => apiRequest<FocusSessionLog[]>('/api/focus-logs/'),
  create: (log: FocusSessionLog) =>
    apiRequest<FocusSessionLog>('/api/focus-logs/', { method: 'POST', body: log }),
};

// ---------------------------------------------------------------------------
// AI (Gemini is called by Django; the browser never sees the API key)
// ---------------------------------------------------------------------------
export interface BreakdownResponse {
  milestones: Array<Partial<Milestone> & { subtasks?: Array<Record<string, any>> }>;
  studyTip: string;
}

export interface ScheduleResponse {
  schedule: Array<Partial<ScheduleBlock> & { priority?: Priority }>;
  aiAdvice: string;
}

export const aiApi = {
  breakdownGoal: (payload: {
    goalTitle: string;
    category?: string;
    detail?: string;
    targetDate?: string;
  }) =>
    apiRequest<BreakdownResponse>('/api/gemini/breakdown-goal/', {
      method: 'POST',
      body: payload,
    }),

  generateSchedule: (payload: {
    availableHours?: number;
    courses?: string[];
    focusPreference?: string;
    studyGoals?: string;
  }) =>
    apiRequest<ScheduleResponse>('/api/gemini/generate-schedule/', {
      method: 'POST',
      body: payload,
    }),

  chat: (payload: { message: string; history: Array<{ role: string; text: string }> }) =>
    apiRequest<{ text: string }>('/api/gemini/assistant-chat/', {
      method: 'POST',
      body: payload,
    }),
};
