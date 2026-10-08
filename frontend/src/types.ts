export type NavView =
  | 'dashboard'
  | 'goals'
  | 'timer'
  | 'planner'
  | 'analytics'
  | 'assistant'
  | 'settings';

export type Priority = 'High' | 'Medium' | 'Low';
export type Category = 'Academic' | 'Personal' | 'Career' | 'Health' | 'Projects';

export interface SubTask {
  id: string;
  title: string;
  estimatedMinutes: number;
  completed: boolean;
}

export interface Milestone {
  id: string;
  title: string;
  dueDate: string;
  priority: Priority;
  completed: boolean;
  subtasks: SubTask[];
}

export interface Goal {
  id: string;
  title: string;
  category: Category;
  targetDate: string;
  progress: number;
  priority: Priority;
  description?: string;
  milestones: Milestone[];
  tags: string[];
  createdAt: string;
  aiTip?: string;
}

export interface ScheduleBlock {
  id: string;
  timeSlot: string;
  subject: string;
  activity: string;
  type: 'Study' | 'Break' | 'Review' | 'Exam Prep' | 'Lecture';
  focusMethod: string;
  priority: Priority;
  completed: boolean;
}

export interface FocusSessionLog {
  id: string;
  timestamp: string;
  durationMinutes: number;
  subject: string;
  notes: string;
  tag: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export interface UserProfile {
  name: string;
  school: string;
  major: string;
  semester: string;
  dailyGoalHours: number;
  pomodoroMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  soundVolume: number; // 0 - 100
}

/** The signed-in user as exposed by the Django API (`/api/auth/me/`). */
export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
}
