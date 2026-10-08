import { Goal, ScheduleBlock, FocusSessionLog, UserProfile, ChatMessage } from '../types';

export const initialProfile: UserProfile = {
  name: 'Student',
  school: '',
  major: '',
  semester: '',
  dailyGoalHours: 4,
  pomodoroMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  soundVolume: 60,
};

// No demo data - new users start with their own real goals & records on the server
export const initialGoals: Goal[] = [];

export const initialSchedule: ScheduleBlock[] = [];

export const initialFocusLogs: FocusSessionLog[] = [];

export const initialChatMessages: ChatMessage[] = [];
