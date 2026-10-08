import React, { useState, useEffect, useRef } from 'react';
import { FocusSessionLog, UserProfile } from '../types';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Sparkles,
  Tag,
  FileText,
  CheckCircle,
  Clock,
  Music,
  CloudRain,
  Trees,
  Waves,
  Coffee,
  Zap,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface TimerViewProps {
  userProfile: UserProfile;
  onLogSession: (log: FocusSessionLog) => void;
  initialSubject?: string;
  initialMinutes?: number;
}

type TimerMode = 'pomodoro' | 'shortBreak' | 'longBreak';

export const TimerView: React.FC<TimerViewProps> = ({
  userProfile,
  onLogSession,
  initialSubject,
  initialMinutes,
}) => {
  const [mode, setMode] = useState<TimerMode>('pomodoro');
  const [subject, setSubject] = useState<string>(initialSubject || 'Machine Learning');
  const [tag, setTag] = useState<string>('Deep Work');

  // Time in seconds
  const getInitialSeconds = (m: TimerMode) => {
    if (initialMinutes && m === 'pomodoro') return initialMinutes * 60;
    if (m === 'pomodoro') return userProfile.pomodoroMinutes * 60;
    if (m === 'shortBreak') return userProfile.shortBreakMinutes * 60;
    return userProfile.longBreakMinutes * 60;
  };

  const [timeLeft, setTimeLeft] = useState<number>(getInitialSeconds('pomodoro'));
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Session Note State
  const [sessionNote, setSessionNote] = useState<string>('');
  const [isSessionCompleteModal, setIsSessionCompleteModal] = useState<boolean>(false);

  // Soundscape audio synthesizer state
  const [activeSound, setActiveSound] = useState<string | null>(null);
  const [volume, setVolume] = useState<number>(userProfile.soundVolume);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const noiseNodeRef = useRef<AudioNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  // Interval timer
  useEffect(() => {
    let timer: any = null;
    if (isRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isRunning && timeLeft === 0) {
      setIsRunning(false);
      handleTimerComplete();
    }
    return () => clearInterval(timer);
  }, [isRunning, timeLeft]);

  // Handle mode change
  const handleModeChange = (newMode: TimerMode) => {
    setMode(newMode);
    setIsRunning(false);
    if (newMode === 'pomodoro') setTimeLeft(userProfile.pomodoroMinutes * 60);
    else if (newMode === 'shortBreak') setTimeLeft(userProfile.shortBreakMinutes * 60);
    else setTimeLeft(userProfile.longBreakMinutes * 60);
  };

  const handleCustomMinutes = (mins: number) => {
    setMode('pomodoro');
    setIsRunning(false);
    setTimeLeft(mins * 60);
  };

  const handleTimerComplete = () => {
    confetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.5 },
    });

    if (mode === 'pomodoro') {
      setIsSessionCompleteModal(true);
    }
  };

  const saveSessionLog = () => {
    const durationMinutes = Math.round(
      (getInitialSeconds(mode) - timeLeft) / 60
    ) || userProfile.pomodoroMinutes;

    onLogSession({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      durationMinutes: durationMinutes > 0 ? durationMinutes : 25,
      subject,
      notes: sessionNote || 'Completed focus sprint',
      tag,
    });

    setIsSessionCompleteModal(false);
    setSessionNote('');
    setTimeLeft(userProfile.pomodoroMinutes * 60);
  };

  // Sound generator functions using Web Audio API
  const stopAudio = () => {
    if (noiseNodeRef.current) {
      try {
        (noiseNodeRef.current as any).stop?.();
        noiseNodeRef.current.disconnect();
      } catch (e) {}
      noiseNodeRef.current = null;
    }
    setActiveSound(null);
  };

  const toggleSound = (soundName: string) => {
    if (activeSound === soundName) {
      stopAudio();
      return;
    }

    stopAudio();

    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new AudioCtx();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const gain = ctx.createGain();
    gain.gain.value = volume / 100;
    gain.connect(ctx.destination);
    gainNodeRef.current = gain;

    if (soundName === 'rain') {
      // Pink noise simulation for Rain
      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        output[i] *= 0.11;
        b6 = white * 0.115926;
      }
      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = buffer;
      whiteNoise.loop = true;
      whiteNoise.connect(gain);
      whiteNoise.start();
      noiseNodeRef.current = whiteNoise;
    } else if (soundName === 'waves') {
      // Modulated brownian noise for Ocean Waves
      const bufferSize = ctx.sampleRate * 3;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = output[i];
        output[i] *= 1.8;
      }
      const brownNoise = ctx.createBufferSource();
      brownNoise.buffer = buffer;
      brownNoise.loop = true;
      brownNoise.connect(gain);
      brownNoise.start();
      noiseNodeRef.current = brownNoise;
    } else if (soundName === 'lofi') {
      // Gentle warm synth chord oscillator generator
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, ctx.currentTime); // A3 note
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.5;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 10;
      lfo.connect(osc.frequency);
      lfo.start();

      osc.connect(gain);
      osc.start();
      noiseNodeRef.current = osc;
    } else if (soundName === 'whitenoise') {
      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * 0.15;
      }
      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = buffer;
      whiteNoise.loop = true;
      whiteNoise.connect(gain);
      whiteNoise.start();
      noiseNodeRef.current = whiteNoise;
    }

    setActiveSound(soundName);
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    if (gainNodeRef.current && audioCtxRef.current) {
      gainNodeRef.current.gain.setValueAtTime(newVol / 100, audioCtxRef.current.currentTime);
    }
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const totalModeSecs = getInitialSeconds(mode);
  const progressPercent = Math.round(((totalModeSecs - timeLeft) / totalModeSecs) * 100);

  return (
    <div className={`space-y-8 pb-12 transition-all ${isFullscreen ? 'fixed inset-0 z-50 bg-[#0A0A0A] text-white p-8 flex flex-col items-center justify-center' : ''}`}>
      
      {/* Header bar */}
      {!isFullscreen && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#121212] p-6 border border-white/10">
          <div>
            <div className="text-[10px] font-mono tracking-[0.2em] text-neutral-400 uppercase">MODULE // 03</div>
            <h1 className="text-2xl font-black uppercase text-white tracking-tight flex items-center gap-2.5 mt-0.5">
              <Clock className="w-6 h-6 text-white" />
              <span>FOCUS SPACE & POMODORO</span>
            </h1>
            <p className="text-xs font-mono text-neutral-400 mt-1">
              Deep work timer with customizable sprint intervals and ambient soundscapes.
            </p>
          </div>

          <button
            onClick={() => setIsFullscreen(true)}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 transition-colors cursor-pointer shrink-0"
            id="timer-fullscreen-btn"
          >
            <Maximize2 className="w-4 h-4" />
            <span>FULLSCREEN MODE</span>
          </button>
        </div>
      )}

      {/* Main Timer Display Block */}
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Timer Mode Selector */}
        <div className="flex items-center justify-center gap-2 p-1.5 bg-[#121212] border border-white/10 max-w-md mx-auto">
          {(['pomodoro', 'shortBreak', 'longBreak'] as TimerMode[]).map((m) => (
            <button
              key={m}
              onClick={() => handleModeChange(m)}
              className={`flex-1 py-2 px-3 text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
                mode === m
                  ? 'bg-white text-black'
                  : 'text-neutral-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {m === 'pomodoro'
                ? 'SPRINT (25M)'
                : m === 'shortBreak'
                ? 'SHORT (5M)'
                : 'LONG (15M)'}
            </button>
          ))}
        </div>

        {/* Custom duration chips */}
        <div className="flex items-center justify-center gap-2 flex-wrap text-xs font-mono">
          <span className="text-neutral-400 uppercase">PRESETS:</span>
          {[15, 25, 45, 60].map((mins) => (
            <button
              key={mins}
              onClick={() => handleCustomMinutes(mins)}
              className="px-2.5 py-1 bg-[#121212] border border-white/10 hover:border-white/30 text-white font-bold cursor-pointer uppercase"
            >
              {mins}M
            </button>
          ))}
        </div>

        {/* Circular Clock Card */}
        <div className={`p-8 md:p-12 border text-center relative overflow-hidden flex flex-col items-center justify-center transition-all bg-[#121212] border-white/10 text-white`}>
          
          {isFullscreen && (
            <button
              onClick={() => setIsFullscreen(false)}
              className="absolute top-4 right-4 p-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20"
            >
              <Minimize2 className="w-5 h-5" />
            </button>
          )}

          {/* Subject & Tag selector */}
          <div className="flex items-center gap-2 mb-6">
            <span className="px-3 py-1 bg-white text-black text-xs font-mono font-bold uppercase flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-black" />
              <span>{subject}</span>
            </span>
            <span className="px-3 py-1 bg-white/10 text-neutral-300 border border-white/15 text-xs font-mono font-bold uppercase">
              {tag}
            </span>
          </div>

          {/* Giant Time Display */}
          <div className="relative my-4">
            <h2 className="text-7xl md:text-9xl font-black tracking-tighter font-mono select-none text-white">
              {formatTime(timeLeft)}
            </h2>
            <p className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-[0.2em] mt-3">
              {isRunning ? '● SESSION IN PROGRESS' : '○ PAUSED / READY'}
            </p>
          </div>

          {/* Progress bar */}
          <div className="w-full max-w-md h-2 bg-white/10 overflow-hidden my-6">
            <div
              className="h-full bg-white transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-center gap-4 mt-2">
            <button
              onClick={() => setIsRunning(!isRunning)}
              id="timer-start-toggle-btn"
              className={`px-8 py-3.5 text-black font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-colors cursor-pointer ${
                isRunning
                  ? 'bg-amber-400 hover:bg-amber-300'
                  : 'bg-white hover:bg-neutral-200'
              }`}
            >
              {isRunning ? (
                <>
                  <Pause className="w-4 h-4 fill-current text-black" />
                  <span>PAUSE SESSION</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current text-black" />
                  <span>START FOCUS</span>
                </>
              )}
            </button>

            <button
              onClick={() => {
                setIsRunning(false);
                setTimeLeft(getInitialSeconds(mode));
              }}
              className="p-3.5 bg-transparent border border-white/20 text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Reset Timer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Ambient Soundscapes Card */}
        <div className="bg-[#121212] border border-white/10 p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <h3 className="text-sm font-black uppercase text-white tracking-wider flex items-center gap-2">
              <Music className="w-4 h-4 text-white" />
              <span>AMBIENT SOUNDSCAPES</span>
            </h3>

            {/* Volume slider */}
            <div className="flex items-center gap-2 text-neutral-400 font-mono text-xs">
              {volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => handleVolumeChange(Number(e.target.value))}
                className="w-24 accent-white cursor-pointer"
              />
              <span className="text-xs font-bold text-white min-w-8">{volume}%</span>
            </div>
          </div>

          {/* Ambient Sound Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { id: 'rain', label: 'RAIN & THUNDER', icon: CloudRain },
              { id: 'waves', label: 'OCEAN WAVES', icon: Waves },
              { id: 'lofi', label: 'LO-FI SYNTH', icon: Music },
              { id: 'whitenoise', label: 'WHITE NOISE', icon: Zap },
            ].map((snd) => {
              const Icon = snd.icon;
              const isActive = activeSound === snd.id;
              return (
                <button
                  key={snd.id}
                  onClick={() => toggleSound(snd.id)}
                  className={`p-3.5 border text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2.5 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-white text-black border-white'
                      : 'bg-[#161616] text-neutral-300 border-white/10 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-black' : 'text-neutral-400'}`} />
                  <span>{snd.label}</span>
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* Session Completion Modal */}
      {isSessionCompleteModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-white/20 max-w-md w-full p-6 text-white space-y-5">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-white text-black flex items-center justify-center mx-auto">
                <CheckCircle className="w-7 h-7 text-black" />
              </div>
              <h3 className="text-xl font-black uppercase tracking-tight text-white">FOCUS SPRINT COMPLETE</h3>
              <p className="text-xs font-mono text-neutral-400">
                Log session summary to record your focus stats.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-neutral-300 mb-1">SUBJECT / COURSE</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1A1A1A] border border-white/20 text-xs font-mono text-white outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-neutral-300 mb-1">SESSION NOTES</label>
                <textarea
                  value={sessionNote}
                  onChange={(e) => setSessionNote(e.target.value)}
                  placeholder="What key concepts did you master?"
                  rows={3}
                  className="w-full px-3 py-2 bg-[#1A1A1A] border border-white/20 text-xs font-mono text-white outline-hidden"
                />
              </div>
            </div>

            <button
              onClick={saveSessionLog}
              className="w-full py-3 bg-white text-black font-black text-xs uppercase tracking-widest cursor-pointer hover:bg-neutral-200"
            >
              SAVE TO FOCUS STATS
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
