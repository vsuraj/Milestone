import React, { useState } from 'react';
import { ScheduleBlock, Priority } from '../types';
import { aiApi } from '../api';
import {
  CalendarDays,
  Sparkles,
  Plus,
  CheckCircle2,
  Clock,
  BookOpen,
  Coffee,
  Trash2,
  Play,
  Loader2,
  AlertCircle,
  Zap,
  Check,
  RotateCcw,
  Edit3,
  X,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface PlannerViewProps {
  schedule: ScheduleBlock[];
  onUpdateSchedule: (newSchedule: ScheduleBlock[]) => void;
  onToggleBlock: (id: string) => void;
  onStartTimer: (subject: string, minutes: number) => void;
  isGeneratorModalOpen: boolean;
  setIsGeneratorModalOpen: (open: boolean) => void;
}

export const PlannerView: React.FC<PlannerViewProps> = ({
  schedule,
  onUpdateSchedule,
  onToggleBlock,
  onStartTimer,
  isGeneratorModalOpen,
  setIsGeneratorModalOpen,
}) => {
  const [filterType, setFilterType] = useState<string>('All');
  
  // AI Generator Form States
  const [availableHours, setAvailableHours] = useState<number>(6);
  const [coursesInput, setCoursesInput] = useState<string>('Computer Science, Operating Systems, Linear Algebra');
  const [focusPref, setFocusPref] = useState<string>('Pomodoro 25/5');
  const [goalsInput, setGoalsInput] = useState<string>('Review lecture notes & complete practice problem set');

  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [genError, setGenError] = useState<string | null>(null);

  // AI Confirmation & Modification Step States
  const [generatorStep, setGeneratorStep] = useState<'input' | 'confirm'>('input');
  const [proposedBlocks, setProposedBlocks] = useState<ScheduleBlock[]>([]);
  const [proposedAdvice, setProposedAdvice] = useState<string>('');

  // Manual Add Form State
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualTime, setManualTime] = useState('02:00 PM - 03:00 PM');
  const [manualSubject, setManualSubject] = useState('');
  const [manualActivity, setManualActivity] = useState('');
  const [manualType, setManualType] = useState<'Study' | 'Break' | 'Review' | 'Exam Prep' | 'Lecture'>('Study');

  const types = ['All', 'Study', 'Exam Prep', 'Lecture', 'Review', 'Break'];

  const filteredSchedule =
    filterType === 'All'
      ? schedule
      : schedule.filter((s) => s.type.toLowerCase() === filterType.toLowerCase());

  // Call Gemini API to generate schedule proposal
  const handleGenerateAiSchedule = async () => {
    setGenError(null);
    setIsGenerating(true);

    try {
      const coursesArray = coursesInput.split(',').map((c) => c.trim()).filter(Boolean);
      const data = await aiApi.generateSchedule({
        availableHours,
        courses: coursesArray,
        focusPreference: focusPref,
        studyGoals: goalsInput,
      });
      if (data.schedule && Array.isArray(data.schedule)) {
        const formattedBlocks: ScheduleBlock[] = data.schedule.map((b: any, index: number) => ({
          id: `sb-gen-${Date.now()}-${index}`,
          timeSlot: b.timeSlot || '09:00 AM - 10:00 AM',
          subject: b.subject || 'Study',
          activity: b.activity || 'Course work',
          type: (b.type as any) || 'Study',
          focusMethod: b.focusMethod || '25m Pomodoro',
          priority: (b.priority as Priority) || 'Medium',
          completed: false,
        }));

        setProposedBlocks(formattedBlocks);
        setProposedAdvice(data.aiAdvice || 'Balanced study sessions with strategic intervals.');
        setGeneratorStep('confirm'); // Transition to review & confirmation step!
      }
    } catch (err: any) {
      console.error(err);
      setGenError(err.message || 'Error generating schedule.');
    } finally {
      setIsGenerating(false);
    }
  };

  // User confirms they need the AI proposal
  const handleConfirmAiSchedule = () => {
    onUpdateSchedule(proposedBlocks);
    if (proposedAdvice) setAiAdvice(proposedAdvice);
    setIsGeneratorModalOpen(false);
    setGeneratorStep('input');

    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  // User discards the AI proposal
  const handleDiscardAiSchedule = () => {
    setProposedBlocks([]);
    setGeneratorStep('input');
    setIsGeneratorModalOpen(false);
  };

  // Block modification in proposed schedule
  const handleUpdateProposedBlock = (index: number, updatedFields: Partial<ScheduleBlock>) => {
    setProposedBlocks((prev) =>
      prev.map((block, i) => (i === index ? { ...block, ...updatedFields } : block))
    );
  };

  const handleDeleteProposedBlock = (index: number) => {
    setProposedBlocks((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddBlockToProposal = () => {
    const newBlock: ScheduleBlock = {
      id: `sb-custom-${Date.now()}`,
      timeSlot: '04:00 PM - 05:00 PM',
      subject: 'Review Session',
      activity: 'Flashcards & Summary Notes',
      type: 'Review',
      focusMethod: '25m Pomodoro',
      priority: 'Medium',
      completed: false,
    };
    setProposedBlocks((prev) => [...prev, newBlock]);
  };

  const handleManualAddBlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualSubject.trim()) return;

    const newBlock: ScheduleBlock = {
      id: `sb-${Date.now()}`,
      timeSlot: manualTime,
      subject: manualSubject,
      activity: manualActivity || 'Study session',
      type: manualType,
      focusMethod: '25m Sprint',
      priority: 'Medium',
      completed: false,
    };

    onUpdateSchedule([...schedule, newBlock]);
    setIsManualModalOpen(false);
    setManualSubject('');
    setManualActivity('');
  };

  const handleDeleteBlock = (id: string) => {
    onUpdateSchedule(schedule.filter((s) => s.id !== id));
  };

  return (
    <div className="space-y-8 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#121212] p-6 border border-white/10">
        <div>
          <div className="text-[10px] font-mono tracking-[0.2em] text-neutral-400 uppercase">MODULE // 01</div>
          <h1 className="text-2xl font-black uppercase text-white tracking-tight flex items-center gap-2.5 mt-0.5">
            <CalendarDays className="w-6 h-6 text-white" />
            <span>AI SCHEDULE & STUDY PLANNER</span>
          </h1>
          <p className="text-xs font-mono text-neutral-400 mt-1">
            Generate balanced daily study timetables with full preview and modification before applying.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setGeneratorStep('input');
              setIsGeneratorModalOpen(true);
            }}
            id="planner-ai-gen-btn"
            className="px-5 py-3 bg-white text-black hover:bg-neutral-200 font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-black" />
            <span>AI SCHEDULE GENERATOR</span>
          </button>
          <button
            onClick={() => setIsManualModalOpen(true)}
            className="px-4 py-3 bg-transparent text-white border border-white/20 hover:bg-white/10 font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>ADD BLOCK</span>
          </button>
        </div>
      </div>

      {/* AI Advice Banner if active */}
      {aiAdvice && (
        <div className="p-4 bg-[#1A1A1A] border border-white/20 text-white flex items-start gap-3">
          <Zap className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-mono text-xs font-bold uppercase text-amber-300">CONFIRMED AI STUDY STRATEGY:</h4>
            <p className="text-xs font-mono text-neutral-300 mt-1">{aiAdvice}</p>
          </div>
          <button
            onClick={() => setAiAdvice(null)}
            className="text-neutral-500 hover:text-white text-xs font-mono"
            title="Dismiss Advice"
          >
            ✕
          </button>
        </div>
      )}

      {/* Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
        {types.map((t) => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            className={`px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer border ${
              filterType === t
                ? 'bg-white text-black border-white'
                : 'bg-[#121212] text-neutral-400 border-white/10 hover:bg-white/5 hover:text-white'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Schedule Items Timeline */}
      <div className="bg-[#121212] border border-white/10 p-6 space-y-4">
        {filteredSchedule.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white uppercase">NO SCHEDULE BLOCKS FOUND</h3>
            <p className="text-xs font-mono text-neutral-400 mt-1">Use the AI Schedule Generator to auto-build your day.</p>
            <button
              onClick={() => {
                setGeneratorStep('input');
                setIsGeneratorModalOpen(true);
              }}
              className="mt-4 px-4 py-2 bg-white text-black text-xs font-black uppercase tracking-wider hover:bg-neutral-200 transition-colors"
            >
              GENERATE TIMETABLE WITH AI
            </button>
          </div>
        ) : (
          filteredSchedule.map((block) => (
            <div
              key={block.id}
              className={`p-4 border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                block.completed
                  ? 'bg-[#161616]/60 border-white/5 opacity-50'
                  : 'bg-[#161616] border-white/10 hover:border-white/30'
              }`}
            >
              <div className="flex items-start gap-4">
                <button
                  onClick={() => onToggleBlock(block.id)}
                  className="mt-1 focus:outline-hidden group cursor-pointer"
                  title="Toggle status"
                >
                  <CheckCircle2
                    className={`w-5 h-5 transition-colors ${
                      block.completed
                        ? 'text-emerald-400 fill-emerald-400'
                        : 'text-neutral-500 group-hover:text-white'
                    }`}
                  />
                </button>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-mono font-bold text-white bg-white/10 px-2.5 py-0.5 border border-white/15 uppercase">
                      {block.timeSlot}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-black bg-white px-2.5 py-0.5 uppercase">
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
                    className={`text-sm font-bold uppercase tracking-tight mt-2 ${
                      block.completed ? 'line-through text-neutral-500' : 'text-white'
                    }`}
                  >
                    {block.activity}
                  </h4>

                  <p className="text-xs font-mono text-neutral-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-neutral-500" />
                    <span>METHOD: {block.focusMethod.toUpperCase()}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                {!block.completed && (
                  <button
                    onClick={() => onStartTimer(block.subject, 25)}
                    className="px-3 py-1.5 bg-white text-black hover:bg-neutral-200 text-xs font-mono font-extrabold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current text-black" />
                    <span>START TIMER</span>
                  </button>
                )}
                <button
                  onClick={() => handleDeleteBlock(block.id)}
                  className="p-2 border border-white/10 text-neutral-400 hover:text-rose-400 hover:border-rose-400/40 transition-colors cursor-pointer"
                  title="Delete Block"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* AI Schedule Generator Modal with Step 1 (Input) and Step 2 (Confirm / Modify) */}
      {isGeneratorModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#121212] border border-white/20 max-w-2xl w-full p-6 text-white space-y-6 my-8">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-white text-black flex items-center justify-center font-black">
                  <Sparkles className="w-5 h-5 text-black" />
                </div>
                <div>
                  <div className="text-[10px] font-mono tracking-widest text-neutral-400 uppercase">
                    {generatorStep === 'input' ? 'STEP 01 // SPECIFICATION' : 'STEP 02 // REVIEW & CONFIRM'}
                  </div>
                  <h3 className="text-base font-black uppercase tracking-wider text-white">
                    {generatorStep === 'input' ? 'AI SCHEDULE GENERATOR' : 'CONFIRM OR MODIFY AI TIMETABLE'}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setIsGeneratorModalOpen(false)}
                className="text-neutral-400 hover:text-white font-mono text-base font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {genError && (
              <div className="p-3 bg-rose-900/30 border border-rose-500/50 text-rose-300 text-xs font-mono flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{genError}</span>
              </div>
            )}

            {/* STEP 1: PARAMETER INPUT */}
            {generatorStep === 'input' ? (
              <div className="space-y-4 font-mono">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-1">
                    TOTAL STUDY HOURS AVAILABLE TODAY: <span className="text-white font-black">{availableHours} HOURS</span>
                  </label>
                  <input
                    type="range"
                    min="2"
                    max="12"
                    value={availableHours}
                    onChange={(e) => setAvailableHours(Number(e.target.value))}
                    className="w-full accent-white cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-1">
                    COURSES & SUBJECTS (COMMA SEPARATED)
                  </label>
                  <input
                    type="text"
                    value={coursesInput}
                    onChange={(e) => setCoursesInput(e.target.value)}
                    placeholder="e.g. Organic Chem, CS450, Physics"
                    className="w-full px-3.5 py-2.5 bg-[#1A1A1A] border border-white/20 text-xs text-white outline-hidden focus:border-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-1">
                    PREFERRED FOCUS METHOD
                  </label>
                  <select
                    value={focusPref}
                    onChange={(e) => setFocusPref(e.target.value)}
                    className="w-full px-3 py-2 bg-[#1A1A1A] border border-white/20 text-xs text-white outline-hidden"
                  >
                    <option value="Pomodoro 25/5">Pomodoro (25m Study / 5m Break)</option>
                    <option value="Deep Work 50/10">Deep Work (50m Study / 10m Break)</option>
                    <option value="Quick Sprints 15m">Quick Sprints (15m Intervals)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-1">
                    TODAY'S MAIN TARGETS / DEADLINES
                  </label>
                  <textarea
                    value={goalsInput}
                    onChange={(e) => setGoalsInput(e.target.value)}
                    rows={2}
                    placeholder="e.g. Prepare for midterm, write lab report intro..."
                    className="w-full px-3.5 py-2.5 bg-[#1A1A1A] border border-white/20 text-xs text-white outline-hidden focus:border-white"
                  />
                </div>

                <div className="p-3 bg-[#1A1A1A] border border-white/10 text-xs text-neutral-400">
                  ⚡ Note: Generating will produce an interactive proposal. You will be able to review, modify any block, or discard before anything is saved.
                </div>

                <button
                  onClick={handleGenerateAiSchedule}
                  disabled={isGenerating}
                  className="w-full py-3.5 bg-white text-black font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer hover:bg-neutral-200 disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-black" />
                      <span>GENERATING TIMETABLE PROPOSAL...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-black" />
                      <span>GENERATE AI TIMETABLE PROPOSAL</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              /* STEP 2: CONFIRMATION & MODIFICATION REVIEW */
              <div className="space-y-5">
                
                {/* User Prompt Notice */}
                <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 text-xs font-mono space-y-1">
                  <div className="flex items-center gap-2 text-emerald-300 font-bold uppercase">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>DO YOU NEED THIS TIMETABLE OR NEED TO MODIFY IT?</span>
                  </div>
                  <p className="text-neutral-300">
                    Review each proposed block below. You can edit any times, subjects, or activities inline, delete blocks you don't need, or add custom blocks before applying.
                  </p>
                </div>

                {/* AI Advice */}
                {proposedAdvice && (
                  <div className="p-3 bg-[#1A1A1A] border border-white/10 text-xs font-mono">
                    <span className="text-amber-300 font-bold uppercase">AI STRATEGY: </span>
                    <span className="text-neutral-300">{proposedAdvice}</span>
                  </div>
                )}

                {/* Proposed Blocks List (Editable!) */}
                <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                  {proposedBlocks.map((block, idx) => (
                    <div key={block.id || idx} className="p-3.5 bg-[#181818] border border-white/15 space-y-2.5 font-mono">
                      
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1">
                          <span className="text-[10px] font-bold text-neutral-400">#{idx + 1}</span>
                          <input
                            type="text"
                            value={block.timeSlot}
                            onChange={(e) => handleUpdateProposedBlock(idx, { timeSlot: e.target.value })}
                            className="px-2 py-1 bg-[#121212] border border-white/20 text-xs text-white w-40 font-bold"
                            placeholder="Time slot"
                          />
                          <select
                            value={block.type}
                            onChange={(e) => handleUpdateProposedBlock(idx, { type: e.target.value as any })}
                            className="px-2 py-1 bg-[#121212] border border-white/20 text-xs text-white"
                          >
                            <option value="Study">Study</option>
                            <option value="Exam Prep">Exam Prep</option>
                            <option value="Lecture">Lecture</option>
                            <option value="Review">Review</option>
                            <option value="Break">Break</option>
                          </select>
                        </div>

                        <button
                          onClick={() => handleDeleteProposedBlock(idx)}
                          className="p-1.5 text-neutral-400 hover:text-rose-400 cursor-pointer"
                          title="Remove block from proposal"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="text-[9px] uppercase text-neutral-400 block mb-0.5">SUBJECT</label>
                          <input
                            type="text"
                            value={block.subject}
                            onChange={(e) => handleUpdateProposedBlock(idx, { subject: e.target.value })}
                            className="w-full px-2 py-1 bg-[#121212] border border-white/20 text-xs text-white"
                            placeholder="Subject"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] uppercase text-neutral-400 block mb-0.5">FOCUS METHOD</label>
                          <input
                            type="text"
                            value={block.focusMethod}
                            onChange={(e) => handleUpdateProposedBlock(idx, { focusMethod: e.target.value })}
                            className="w-full px-2 py-1 bg-[#121212] border border-white/20 text-xs text-white"
                            placeholder="e.g. 25m Pomodoro"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[9px] uppercase text-neutral-400 block mb-0.5">ACTIVITY DESCRIPTION</label>
                        <input
                          type="text"
                          value={block.activity}
                          onChange={(e) => handleUpdateProposedBlock(idx, { activity: e.target.value })}
                          className="w-full px-2 py-1 bg-[#121212] border border-white/20 text-xs text-white"
                          placeholder="Activity / Topic"
                        />
                      </div>

                    </div>
                  ))}

                  <button
                    onClick={handleAddBlockToProposal}
                    className="w-full py-2 bg-[#1A1A1A] hover:bg-white/10 border border-dashed border-white/20 text-xs font-mono uppercase text-neutral-300 hover:text-white flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>ADD ANOTHER BLOCK TO PROPOSAL</span>
                  </button>
                </div>

                {/* Primary Decision Action Buttons */}
                <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row gap-3">
                  
                  {/* Confirm Action */}
                  <button
                    onClick={handleConfirmAiSchedule}
                    className="flex-1 py-3.5 bg-white text-black font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer hover:bg-neutral-200 transition-colors"
                  >
                    <Check className="w-4 h-4 text-black" />
                    <span>YES, APPLY SCHEDULE ({proposedBlocks.length} BLOCKS)</span>
                  </button>

                  {/* Modify / Adjust parameters */}
                  <button
                    onClick={() => setGeneratorStep('input')}
                    className="py-3.5 px-4 bg-[#1A1A1A] hover:bg-white/10 border border-white/20 text-white font-mono text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>MODIFY PARAMETERS</span>
                  </button>

                  {/* Discard Action */}
                  <button
                    onClick={handleDiscardAiSchedule}
                    className="py-3.5 px-4 bg-transparent hover:bg-rose-950/40 border border-rose-500/30 text-rose-300 font-mono text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>DISCARD</span>
                  </button>

                </div>

              </div>
            )}

          </div>
        </div>
      )}

      {/* Manual Add Block Modal */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-white/20 max-w-md w-full p-6 text-white space-y-4">
            <h3 className="text-base font-black uppercase tracking-wider text-white">ADD SCHEDULE BLOCK</h3>
            <form onSubmit={handleManualAddBlock} className="space-y-3">
              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-neutral-300 mb-1">TIME SLOT</label>
                <input
                  type="text"
                  value={manualTime}
                  onChange={(e) => setManualTime(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-[#1A1A1A] border border-white/20 text-xs font-mono text-white outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-neutral-300 mb-1">SUBJECT</label>
                <input
                  type="text"
                  value={manualSubject}
                  onChange={(e) => setManualSubject(e.target.value)}
                  required
                  placeholder="e.g. Calculus III"
                  className="w-full px-3 py-2 bg-[#1A1A1A] border border-white/20 text-xs font-mono text-white outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-neutral-300 mb-1">ACTIVITY</label>
                <input
                  type="text"
                  value={manualActivity}
                  onChange={(e) => setManualActivity(e.target.value)}
                  placeholder="e.g. Problem set 4"
                  className="w-full px-3 py-2 bg-[#1A1A1A] border border-white/20 text-xs font-mono text-white outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-neutral-300 mb-1">BLOCK TYPE</label>
                <select
                  value={manualType}
                  onChange={(e) => setManualType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-[#1A1A1A] border border-white/20 text-xs font-mono text-white outline-hidden"
                >
                  <option value="Study">Study</option>
                  <option value="Exam Prep">Exam Prep</option>
                  <option value="Lecture">Lecture</option>
                  <option value="Review">Review</option>
                  <option value="Break">Break</option>
                </select>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-white text-black font-black text-xs uppercase tracking-wider hover:bg-neutral-200 cursor-pointer"
                >
                  ADD BLOCK
                </button>
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="w-full py-3 bg-transparent text-white border border-white/20 font-mono text-xs font-bold uppercase tracking-wider hover:bg-white/10 cursor-pointer"
                >
                  CANCEL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
