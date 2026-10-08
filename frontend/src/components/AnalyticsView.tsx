import React from 'react';
import { FocusSessionLog, Goal, UserProfile } from '../types';
import {
  BarChart3,
  Calendar,
  TrendingUp,
  Clock,
  Sparkles,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts';

interface AnalyticsViewProps {
  userProfile: UserProfile;
  focusLogs: FocusSessionLog[];
  goals: Goal[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  userProfile,
  focusLogs,
  goals,
}) => {
  // Aggregate real focus logs by weekday
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayMinutesMap: Record<string, number> = {
    Mon: 0,
    Tue: 0,
    Wed: 0,
    Thu: 0,
    Fri: 0,
    Sat: 0,
    Sun: 0,
  };

  focusLogs.forEach((log) => {
    try {
      const d = new Date(log.timestamp);
      const dayName = days[d.getDay()];
      if (dayName && dayMinutesMap[dayName] !== undefined) {
        dayMinutesMap[dayName] += log.durationMinutes;
      }
    } catch {
      dayMinutesMap['Mon'] += log.durationMinutes;
    }
  });

  const weeklyData = [
    { day: 'Mon', hours: Number((dayMinutesMap['Mon'] / 60).toFixed(1)) },
    { day: 'Tue', hours: Number((dayMinutesMap['Tue'] / 60).toFixed(1)) },
    { day: 'Wed', hours: Number((dayMinutesMap['Wed'] / 60).toFixed(1)) },
    { day: 'Thu', hours: Number((dayMinutesMap['Thu'] / 60).toFixed(1)) },
    { day: 'Fri', hours: Number((dayMinutesMap['Fri'] / 60).toFixed(1)) },
    { day: 'Sat', hours: Number((dayMinutesMap['Sat'] / 60).toFixed(1)) },
    { day: 'Sun', hours: Number((dayMinutesMap['Sun'] / 60).toFixed(1)) },
  ];

  // Subject distribution from real logs
  const subjectMap: Record<string, number> = {};
  focusLogs.forEach((log) => {
    subjectMap[log.subject] = (subjectMap[log.subject] || 0) + log.durationMinutes;
  });

  const pieColors = ['#FFFFFF', '#D4D4D4', '#A3A3A3', '#737373', '#525252', '#262626'];
  const pieData = Object.keys(subjectMap).map((subject, index) => ({
    name: subject,
    value: subjectMap[subject],
    color: pieColors[index % pieColors.length],
  }));

  const totalMinutes = focusLogs.reduce((acc, log) => acc + log.durationMinutes, 0);
  const totalHours = (totalMinutes / 60).toFixed(1);
  const completedGoalsCount = goals.filter((g) => g.progress === 100).length;

  return (
    <div className="space-y-8 pb-12">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#121212] p-6 border border-white/10">
        <div>
          <div className="text-[10px] font-mono tracking-[0.2em] text-neutral-400 uppercase">MODULE // 04</div>
          <h1 className="text-2xl font-black uppercase text-white tracking-tight flex items-center gap-2.5 mt-0.5">
            <BarChart3 className="w-6 h-6 text-white" />
            <span>PRODUCTIVITY & FOCUS ANALYTICS</span>
          </h1>
          <p className="text-xs font-mono text-neutral-400 mt-1">
            Real metrics, subject allocation, and completed study sprint logs.
          </p>
        </div>
      </div>

      {/* Top Stat Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-[#121212] p-5 border border-white/10 flex items-center justify-between text-white">
          <div>
            <p className="text-[10px] font-mono uppercase text-neutral-400 tracking-wider">TOTAL FOCUS TIME</p>
            <h3 className="text-3xl font-mono font-black text-white mt-1">{totalHours}H</h3>
            <p className="text-xs font-mono text-neutral-400 mt-1 uppercase">
              {focusLogs.length} {focusLogs.length === 1 ? 'SESSION' : 'SESSIONS'} LOGGED
            </p>
          </div>
        </div>

        <div className="bg-[#121212] p-5 border border-white/10 flex items-center justify-between text-white">
          <div>
            <p className="text-[10px] font-mono uppercase text-neutral-400 tracking-wider">DAILY GOAL TARGET</p>
            <h3 className="text-3xl font-mono font-black text-white mt-1">{userProfile.dailyGoalHours}H</h3>
            <p className="text-xs font-mono text-neutral-400 mt-1 uppercase">
              SPRINT PRESET: {userProfile.pomodoroMinutes}M
            </p>
          </div>
        </div>

        <div className="bg-[#121212] p-5 border border-white/10 flex items-center justify-between text-white">
          <div>
            <p className="text-[10px] font-mono uppercase text-neutral-400 tracking-wider">ACTIVE GOALS</p>
            <h3 className="text-3xl font-mono font-black text-white mt-1">{goals.length}</h3>
            <p className="text-xs font-mono text-emerald-400 mt-1 uppercase flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{completedGoalsCount} COMPLETED</span>
            </p>
          </div>
        </div>

        <div className="bg-[#121212] p-5 border border-white/10 flex items-center justify-between text-white">
          <div>
            <p className="text-[10px] font-mono uppercase text-neutral-400 tracking-wider">DATABASE STATUS</p>
            <h3 className="text-2xl font-mono font-black text-emerald-400 mt-1">POSTGRESQL</h3>
            <p className="text-xs font-mono text-neutral-400 mt-1 uppercase">
              AUTHENTICATED SYNC
            </p>
          </div>
        </div>

      </div>

      {/* Charts Section: Weekly Bar Chart + Subject Pie Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Weekly Study Hours */}
        <div className="lg:col-span-2 bg-[#121212] border border-white/10 p-6 text-white">
          <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
            <div>
              <h3 className="text-base font-black uppercase tracking-tight text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-white" />
                <span>DAILY STUDY DISTRIBUTION (HOURS)</span>
              </h3>
              <p className="text-xs font-mono text-neutral-400 mt-0.5">Focus hours recorded per day</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                <XAxis dataKey="day" stroke="#737373" tick={{ fill: '#A3A3A3', fontSize: 11 }} />
                <YAxis stroke="#737373" tick={{ fill: '#A3A3A3', fontSize: 11 }} unit="h" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1A1A1A', borderColor: '#ffffff20', borderRadius: '0px', color: '#fff' }}
                  cursor={{ fill: '#ffffff10' }}
                  formatter={(val: any) => [`${val} hrs`, 'Focus Time']}
                />
                <Bar dataKey="hours" fill="#FFFFFF" radius={[0, 0, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Subject Breakdown */}
        <div className="bg-[#121212] border border-white/10 p-6 text-white">
          <div className="pb-4 border-b border-white/10 mb-4">
            <h3 className="text-base font-black uppercase tracking-tight text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-white" />
              <span>SUBJECT DISTRIBUTION</span>
            </h3>
            <p className="text-xs font-mono text-neutral-400 mt-0.5">Focus time split across courses</p>
          </div>

          {pieData.length === 0 ? (
            <div className="h-48 w-full flex flex-col items-center justify-center border border-dashed border-white/15 my-4 p-4 text-center">
              <Clock className="w-8 h-8 text-neutral-600 mb-2" />
              <p className="text-xs font-mono text-neutral-400 uppercase">NO SESSION LOGS YET</p>
              <p className="text-[10px] font-mono text-neutral-500 mt-1">Complete a focus timer session to see subject breakdown.</p>
            </div>
          ) : (
            <>
              <div className="h-48 w-full my-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1A1A1A', borderColor: '#ffffff20', borderRadius: '0px', color: '#fff' }}
                      formatter={(val: any) => [`${val} mins`, 'Duration']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2 font-mono text-xs">
                {pieData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between uppercase">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 border border-white/20" style={{ backgroundColor: item.color }} />
                      <span className="font-bold text-neutral-300">{item.name}</span>
                    </div>
                    <span className="font-bold text-white">{item.value}M</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

      </div>

      {/* Focus Session Logs Table */}
      <div className="bg-[#121212] border border-white/10 p-6 text-white space-y-4">
        <h3 className="text-base font-black uppercase tracking-tight text-white flex items-center gap-2">
          <Calendar className="w-5 h-5 text-white" />
          <span>RECENT FOCUS SESSION LOGS</span>
        </h3>

        {focusLogs.length === 0 ? (
          <div className="py-8 px-4 text-center border border-dashed border-white/15">
            <p className="text-xs font-mono text-neutral-400 uppercase">NO SESSIONS LOGGED YET</p>
            <p className="text-[11px] font-mono text-neutral-500 mt-1">Start a Pomodoro session in the Focus Space to log real study time.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest">
                  <th className="py-3 px-4">DATE & TIME</th>
                  <th className="py-3 px-4">SUBJECT</th>
                  <th className="py-3 px-4">DURATION</th>
                  <th className="py-3 px-4">TAG</th>
                  <th className="py-3 px-4">NOTES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono text-xs">
                {focusLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/5">
                    <td className="py-3.5 px-4 font-bold text-neutral-300">{log.timestamp}</td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-black bg-white px-2 py-0.5 uppercase text-[10px]">
                        {log.subject}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-white">{log.durationMinutes} MINS</td>
                    <td className="py-3.5 px-4">
                      <span className="bg-white/10 text-neutral-300 font-bold px-2 py-0.5 border border-white/10 uppercase text-[10px]">
                        {log.tag}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-neutral-400 max-w-xs truncate">{log.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
