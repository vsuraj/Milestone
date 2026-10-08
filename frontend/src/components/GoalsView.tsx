import React, { useState, useMemo } from 'react';
import { Goal, Milestone, SubTask, Category, Priority } from '../types';
import { aiApi } from '../api';
import {
  Target,
  Plus,
  Sparkles,
  CheckCircle2,
  Calendar,
  ChevronDown,
  ChevronRight,
  Trash2,
  AlertCircle,
  Lightbulb,
  Clock,
  Layers,
  Loader2,
  Check,
  Edit3,
  X,
  Folder,
  FolderOpen,
  FolderPlus,
  ListTree,
  Search,
  CheckSquare,
  Square,
  FileText,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'motion/react';

interface GoalsViewProps {
  goals: Goal[];
  onAddGoal: (goal: Goal) => void;
  onUpdateGoal: (goal: Goal) => void;
  onDeleteGoal: (goalId: string) => void;
}

export const GoalsView: React.FC<GoalsViewProps> = ({
  goals,
  onAddGoal,
  onUpdateGoal,
  onDeleteGoal,
}) => {
  // Folder structure state
  const folderCategories: Category[] = ['Academic', 'Projects', 'Career', 'Personal', 'Health'];
  const [activeFolder, setActiveFolder] = useState<string>('All');
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({
    Academic: true,
    Projects: true,
    Career: true,
    Personal: true,
    Health: true,
  });

  // Dropdown states for Goals and Milestones
  const [expandedGoals, setExpandedGoals] = useState<Record<string, boolean>>({});
  const [expandedMilestones, setExpandedMilestones] = useState<Record<string, boolean>>({});

  // Search query
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State: 'input' | 'confirm'
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalStep, setModalStep] = useState<'input' | 'confirm'>('input');
  const [targetGoalIdForAi, setTargetGoalIdForAi] = useState<string | null>(null);

  // Modal form states
  const [goalTitle, setGoalTitle] = useState('');
  const [category, setCategory] = useState<Category>('Academic');
  const [targetDate, setTargetDate] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('High');

  // AI Proposal States
  const [proposedMilestones, setProposedMilestones] = useState<Milestone[]>([]);
  const [proposedAiTip, setProposedAiTip] = useState<string>('');

  // AI loading state
  const [isAiBreakingDown, setIsAiBreakingDown] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Toggle single folder expand/collapse
  const toggleFolder = (folderName: string) => {
    setOpenFolders((prev) => ({
      ...prev,
      [folderName]: !prev[folderName],
    }));
  };

  // Toggle single goal dropdown
  const toggleGoalDropdown = (goalId: string) => {
    setExpandedGoals((prev) => ({
      ...prev,
      [goalId]: !prev[goalId],
    }));
  };

  // Toggle single milestone dropdown
  const toggleMilestoneDropdown = (milestoneId: string) => {
    setExpandedMilestones((prev) => ({
      ...prev,
      [milestoneId]: !prev[milestoneId],
    }));
  };

  // Expand / Collapse all dropdowns
  const handleExpandAll = () => {
    const allFolders: Record<string, boolean> = {};
    folderCategories.forEach((c) => (allFolders[c] = true));
    setOpenFolders(allFolders);

    const allG: Record<string, boolean> = {};
    const allM: Record<string, boolean> = {};
    goals.forEach((g) => {
      allG[g.id] = true;
      g.milestones.forEach((m) => {
        allM[m.id] = true;
      });
    });
    setExpandedGoals(allG);
    setExpandedMilestones(allM);
  };

  const handleCollapseAll = () => {
    setExpandedGoals({});
    setExpandedMilestones({});
  };

  // Group goals by Folder / Category
  const groupedGoals = useMemo(() => {
    const map: Record<string, Goal[]> = {
      Academic: [],
      Projects: [],
      Career: [],
      Personal: [],
      Health: [],
    };

    goals.forEach((g) => {
      const cat = g.category || 'Academic';
      if (!map[cat]) map[cat] = [];

      // Check search match
      const query = searchQuery.trim().toLowerCase();
      if (!query) {
        map[cat].push(g);
      } else {
        const matchesTitle = g.title.toLowerCase().includes(query);
        const matchesDesc = (g.description || '').toLowerCase().includes(query);
        const matchesMilestone = g.milestones.some((m) =>
          m.title.toLowerCase().includes(query) ||
          m.subtasks.some((st) => st.title.toLowerCase().includes(query))
        );

        if (matchesTitle || matchesDesc || matchesMilestone) {
          map[cat].push(g);
        }
      }
    });

    return map;
  }, [goals, searchQuery]);

  // Handle toggling subtask completion & recalculating progress
  const handleToggleSubtask = (goal: Goal, milestoneId: string, subtaskId: string) => {
    const updatedMilestones = goal.milestones.map((m) => {
      if (m.id !== milestoneId) return m;

      const updatedSubtasks = m.subtasks.map((st) =>
        st.id === subtaskId ? { ...st, completed: !st.completed } : st
      );

      const allSubtasksDone = updatedSubtasks.length > 0 && updatedSubtasks.every((st) => st.completed);

      return {
        ...m,
        subtasks: updatedSubtasks,
        completed: allSubtasksDone,
      };
    });

    // Calculate total subtasks across goal
    let totalSubtasks = 0;
    let completedSubtasks = 0;

    updatedMilestones.forEach((m) => {
      m.subtasks.forEach((st) => {
        totalSubtasks++;
        if (st.completed) completedSubtasks++;
      });
    });

    const newProgress =
      totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

    if (newProgress === 100 && goal.progress < 100) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }

    const updatedGoal: Goal = {
      ...goal,
      milestones: updatedMilestones,
      progress: newProgress,
    };

    onUpdateGoal(updatedGoal);
  };

  // Quick add a new milestone to an existing goal
  const handleQuickAddMilestoneToGoal = (goal: Goal) => {
    const newM: Milestone = {
      id: `m-${Date.now()}`,
      title: 'New Milestone Target',
      dueDate: goal.targetDate || 'Next week',
      priority: goal.priority || 'Medium',
      completed: false,
      subtasks: [
        { id: `st-${Date.now()}-1`, title: 'Initial preparation and reading', estimatedMinutes: 25, completed: false },
      ],
    };

    const updatedMilestones = [...goal.milestones, newM];
    const updatedGoal: Goal = {
      ...goal,
      milestones: updatedMilestones,
    };
    onUpdateGoal(updatedGoal);

    // Expand this goal and milestone dropdown
    setExpandedGoals((prev) => ({ ...prev, [goal.id]: true }));
    setExpandedMilestones((prev) => ({ ...prev, [newM.id]: true }));
  };

  // Quick add subtask to milestone
  const handleQuickAddSubtaskToMilestone = (goal: Goal, milestoneId: string) => {
    const newSt: SubTask = {
      id: `st-${Date.now()}`,
      title: 'Action item & practice sprint',
      estimatedMinutes: 30,
      completed: false,
    };

    const updatedMilestones = goal.milestones.map((m) => {
      if (m.id !== milestoneId) return m;
      return {
        ...m,
        subtasks: [...m.subtasks, newSt],
      };
    });

    const updatedGoal: Goal = {
      ...goal,
      milestones: updatedMilestones,
    };
    onUpdateGoal(updatedGoal);
    setExpandedMilestones((prev) => ({ ...prev, [milestoneId]: true }));
  };

  // AI Breakdown call -> generates proposal and transitions to 'confirm' step
  const handleAiBreakdown = async () => {
    if (!goalTitle.trim()) {
      setAiError('Please enter a goal title first before generating AI breakdown.');
      return;
    }

    setAiError(null);
    setIsAiBreakingDown(true);

    try {
      const data = await aiApi.breakdownGoal({
        goalTitle,
        category,
        detail: description,
        targetDate,
      });
      if (data.milestones && Array.isArray(data.milestones)) {
        const formattedMilestones: Milestone[] = data.milestones.map((m: any, mIdx: number) => ({
          id: `m-${Date.now()}-${mIdx}`,
          title: m.title || `Milestone ${mIdx + 1}`,
          dueDate: m.dueDate || targetDate || 'Week 1',
          priority: (m.priority as Priority) || priority,
          completed: false,
          subtasks: Array.isArray(m.subtasks)
            ? m.subtasks.map((st: any, stIdx: number) => ({
                id: `st-${Date.now()}-${mIdx}-${stIdx}`,
                title: st.title || 'Review core chapter',
                estimatedMinutes: st.estimatedMinutes || 30,
                completed: false,
              }))
            : [],
        }));

        setProposedMilestones(formattedMilestones);
        setProposedAiTip(data.studyTip || 'Break tasks into focused 25-minute study sprints.');
        setModalStep('confirm'); // Transition to review & confirmation step
      }
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || 'Failed to breakdown goal using AI.');
    } finally {
      setIsAiBreakingDown(false);
    }
  };

  // Trigger AI breakdown on existing goal
  const handleBreakdownExistingGoal = (goal: Goal) => {
    setTargetGoalIdForAi(goal.id);
    setGoalTitle(goal.title);
    setCategory(goal.category);
    setTargetDate(goal.targetDate);
    setDescription(goal.description || '');
    setPriority(goal.priority);
    setModalStep('input');
    setIsModalOpen(true);
  };

  // Open modal with specific category preselected
  const handleOpenAddGoalInFolder = (folderName: Category) => {
    resetForm();
    setCategory(folderName);
    setIsModalOpen(true);
  };

  // User confirms the AI proposal
  const handleConfirmAiGoal = () => {
    if (targetGoalIdForAi) {
      // Updating existing goal with confirmed proposal
      const existing = goals.find((g) => g.id === targetGoalIdForAi);
      if (existing) {
        const updatedGoal: Goal = {
          ...existing,
          title: goalTitle,
          category,
          targetDate: targetDate || 'Next month',
          priority,
          description,
          milestones: proposedMilestones,
          aiTip: proposedAiTip,
        };
        onUpdateGoal(updatedGoal);
        setExpandedGoals((prev) => ({ ...prev, [targetGoalIdForAi]: true }));
      }
    } else {
      // Creating new goal
      const createdGoal: Goal = {
        id: `g-${Date.now()}`,
        title: goalTitle,
        category,
        targetDate: targetDate || 'Next month',
        progress: 0,
        priority,
        description,
        milestones: proposedMilestones,
        tags: [`#${category}`, '#Milestone'],
        createdAt: new Date().toISOString().split('T')[0],
        aiTip: proposedAiTip || 'Break tasks into manageable 25-minute study sprints.',
      };
      onAddGoal(createdGoal);
      setOpenFolders((prev) => ({ ...prev, [category]: true }));
      setExpandedGoals((prev) => ({ ...prev, [createdGoal.id]: true }));
    }

    setIsModalOpen(false);
    resetForm();

    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  // User discards the AI proposal
  const handleDiscardAiGoal = () => {
    setProposedMilestones([]);
    setProposedAiTip('');
    setModalStep('input');
    setIsModalOpen(false);
    setTargetGoalIdForAi(null);
  };

  // Proposed Milestones inline modification helpers
  const handleUpdateMilestone = (mIdx: number, fields: Partial<Milestone>) => {
    setProposedMilestones((prev) =>
      prev.map((m, i) => (i === mIdx ? { ...m, ...fields } : m))
    );
  };

  const handleDeleteMilestone = (mIdx: number) => {
    setProposedMilestones((prev) => prev.filter((_, i) => i !== mIdx));
  };

  const handleAddMilestone = () => {
    const newM: Milestone = {
      id: `m-new-${Date.now()}`,
      title: 'New Milestone',
      dueDate: targetDate || 'Next week',
      priority: priority,
      completed: false,
      subtasks: [
        { id: `st-new-${Date.now()}`, title: 'Initial preparation & reading', estimatedMinutes: 30, completed: false },
      ],
    };
    setProposedMilestones((prev) => [...prev, newM]);
  };

  const handleUpdateSubtask = (mIdx: number, stIdx: number, fields: Partial<SubTask>) => {
    setProposedMilestones((prev) =>
      prev.map((m, i) => {
        if (i !== mIdx) return m;
        const updatedSt = m.subtasks.map((st, j) => (j === stIdx ? { ...st, ...fields } : st));
        return { ...m, subtasks: updatedSt };
      })
    );
  };

  const handleDeleteSubtask = (mIdx: number, stIdx: number) => {
    setProposedMilestones((prev) =>
      prev.map((m, i) => {
        if (i !== mIdx) return m;
        return { ...m, subtasks: m.subtasks.filter((_, j) => j !== stIdx) };
      })
    );
  };

  const handleAddSubtask = (mIdx: number) => {
    const newSt: SubTask = {
      id: `st-add-${Date.now()}`,
      title: 'Complete chapter practice problems',
      estimatedMinutes: 30,
      completed: false,
    };
    setProposedMilestones((prev) =>
      prev.map((m, i) => {
        if (i !== mIdx) return m;
        return { ...m, subtasks: [...m.subtasks, newSt] };
      })
    );
  };

  const handleManualAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle.trim()) return;

    const newGoal: Goal = {
      id: `g-${Date.now()}`,
      title: goalTitle,
      category,
      targetDate: targetDate || 'TBD',
      progress: 0,
      priority,
      description,
      milestones: [
        {
          id: `m-${Date.now()}-1`,
          title: 'Initial Research & Task Setup',
          dueDate: targetDate || 'Soon',
          priority: priority,
          completed: false,
          subtasks: [
            { id: `st-${Date.now()}-1`, title: 'Define key learning objectives', estimatedMinutes: 30, completed: false },
            { id: `st-${Date.now()}-2`, title: 'Gather course reference material', estimatedMinutes: 45, completed: false },
          ],
        },
      ],
      tags: [`#${category}`],
      createdAt: new Date().toISOString().split('T')[0],
    };

    onAddGoal(newGoal);
    setOpenFolders((prev) => ({ ...prev, [category]: true }));
    setExpandedGoals((prev) => ({ ...prev, [newGoal.id]: true }));
    setIsModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setGoalTitle('');
    setCategory('Academic');
    setTargetDate('');
    setDescription('');
    setPriority('High');
    setAiError(null);
    setModalStep('input');
    setTargetGoalIdForAi(null);
    setProposedMilestones([]);
    setProposedAiTip('');
  };

  const activeCategoryList = activeFolder === 'All' ? folderCategories : [activeFolder as Category];

  return (
    <div className="space-y-8 pb-12">
      
      {/* Page Title & Main Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#121212] p-6 border border-white/10">
        <div>
          <div className="text-[10px] font-mono tracking-[0.2em] text-neutral-400 uppercase">MODULE // 02</div>
          <h1 className="text-2xl font-black uppercase text-white tracking-tight flex items-center gap-2.5 mt-0.5">
            <ListTree className="w-6 h-6 text-white" />
            <span>GOALS EXPLORER & DIRECTORY TREE</span>
          </h1>
          <p className="text-xs font-mono text-neutral-400 mt-1">
            Organized folder directories with expandable dropdown sublists for milestones and subtasks.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <button
            onClick={handleExpandAll}
            className="px-3 py-2 bg-transparent text-neutral-300 hover:text-white border border-white/20 hover:bg-white/10 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Expand all folders and dropdowns"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>EXPAND ALL</span>
          </button>
          <button
            onClick={handleCollapseAll}
            className="px-3 py-2 bg-transparent text-neutral-400 hover:text-white border border-white/10 hover:bg-white/10 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Collapse all dropdowns"
          >
            <Minimize2 className="w-3.5 h-3.5" />
            <span>COLLAPSE</span>
          </button>
          <button
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            id="goals-new-goal-btn"
            className="px-5 py-3 bg-white text-black hover:bg-neutral-200 font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 text-black" />
            <span>NEW GOAL</span>
          </button>
        </div>
      </div>

      {/* Folder Navigation Tabs & Filter Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        
        {/* Folder Selectors */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setActiveFolder('All')}
            className={`px-3.5 py-2 text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 border ${
              activeFolder === 'All'
                ? 'bg-white text-black border-white'
                : 'bg-[#121212] text-neutral-400 border-white/10 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>ALL FOLDERS ({goals.length})</span>
          </button>

          {folderCategories.map((cat) => {
            const count = groupedGoals[cat]?.length || 0;
            const isCurrent = activeFolder === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveFolder(cat)}
                className={`px-3.5 py-2 text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 border ${
                  isCurrent
                    ? 'bg-white text-black border-white'
                    : 'bg-[#121212] text-neutral-400 border-white/10 hover:bg-white/5 hover:text-white'
                }`}
              >
                {openFolders[cat] ? (
                  <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <Folder className="w-3.5 h-3.5 text-neutral-400" />
                )}
                <span>{cat.toUpperCase()}</span>
                <span className={`text-[10px] px-1.5 py-0.2 font-mono ${isCurrent ? 'bg-black text-white' : 'bg-white/10 text-neutral-300'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search goals or subtasks..."
            className="w-full pl-9 pr-3 py-2 bg-[#121212] border border-white/15 focus:border-white text-xs font-mono text-white outline-hidden"
          />
        </div>

      </div>

      {/* Directory Folder Tree Container */}
      <div className="space-y-6">
        {activeCategoryList.map((folderCat) => {
          const folderGoals = groupedGoals[folderCat] || [];
          const isOpen = openFolders[folderCat] ?? true;
          const completedCount = folderGoals.filter((g) => g.progress === 100).length;

          return (
            <div
              key={folderCat}
              className="bg-[#121212] border border-white/15 overflow-hidden transition-all shadow-md"
            >
              {/* Folder Header */}
              <div
                className="p-4 sm:p-5 bg-[#161616] border-b border-white/10 flex items-center justify-between gap-3 cursor-pointer hover:bg-[#1C1C1C] transition-colors"
                onClick={() => toggleFolder(folderCat)}
              >
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className="p-1 text-neutral-400 hover:text-white transition-transform"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFolder(folderCat);
                    }}
                  >
                    {isOpen ? <ChevronDown className="w-5 h-5 text-white" /> : <ChevronRight className="w-5 h-5 text-neutral-400" />}
                  </button>

                  <div className="flex items-center gap-2.5">
                    {isOpen ? (
                      <FolderOpen className="w-5 h-5 text-amber-300" />
                    ) : (
                      <Folder className="w-5 h-5 text-neutral-400" />
                    )}
                    <span className="text-base font-black uppercase tracking-tight text-white">
                      /{folderCat.toUpperCase()}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-white/10 text-neutral-300 border border-white/15 uppercase">
                      {folderGoals.length} {folderGoals.length === 1 ? 'GOAL' : 'GOALS'}
                    </span>
                    {completedCount > 0 && (
                      <span className="text-[10px] font-mono text-emerald-400 uppercase hidden sm:inline">
                        • {completedCount} COMPLETED
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => handleOpenAddGoalInFolder(folderCat)}
                    className="px-2.5 py-1.5 bg-white/10 hover:bg-white text-white hover:text-black border border-white/20 text-[11px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
                    title={`Add new goal to /${folderCat}`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>ADD GOAL</span>
                  </button>
                </div>
              </div>

              {/* Folder Contents (Goals List Dropdown Tree) */}
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-4 sm:p-6 space-y-4"
                  >
                    {folderGoals.length === 0 ? (
                      <div className="py-8 px-4 text-center border border-dashed border-white/15 font-mono text-xs text-neutral-400 space-y-2">
                        <p>No goals inside directory /{folderCat}.</p>
                        <button
                          onClick={() => handleOpenAddGoalInFolder(folderCat)}
                          className="px-3.5 py-1.5 bg-white text-black font-bold uppercase text-[11px] inline-flex items-center gap-1.5 cursor-pointer hover:bg-neutral-200"
                        >
                          <Plus className="w-3.5 h-3.5 text-black" />
                          <span>CREATE GOAL IN /{folderCat.toUpperCase()}</span>
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {folderGoals.map((goal, gIdx) => {
                          const isGoalOpen = expandedGoals[goal.id] ?? false;
                          const totalSubtasksInGoal = goal.milestones.reduce(
                            (acc, m) => acc + m.subtasks.length,
                            0
                          );
                          const completedSubtasksInGoal = goal.milestones.reduce(
                            (acc, m) => acc + m.subtasks.filter((st) => st.completed).length,
                            0
                          );

                          return (
                            <div
                              key={goal.id}
                              className={`border transition-all ${
                                isGoalOpen
                                  ? 'bg-[#141414] border-white'
                                  : 'bg-[#141414] border-white/15 hover:border-white/40'
                              }`}
                            >
                              {/* Goal Level Header (Click to expand sublist) */}
                              <div
                                className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-[#1A1A1A] transition-colors"
                                onClick={() => toggleGoalDropdown(goal.id)}
                              >
                                <div className="flex items-start gap-3 flex-1">
                                  <button
                                    type="button"
                                    className="p-1 mt-0.5 text-neutral-400 hover:text-white"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleGoalDropdown(goal.id);
                                    }}
                                  >
                                    {isGoalOpen ? (
                                      <ChevronDown className="w-5 h-5 text-white" />
                                    ) : (
                                      <ChevronRight className="w-5 h-5 text-neutral-400" />
                                    )}
                                  </button>

                                  <div className="space-y-1.5 min-w-0 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-[10px] font-mono text-neutral-500 font-bold">
                                        0{gIdx + 1} //
                                      </span>
                                      <span
                                        className={`px-2 py-0.5 text-[9px] font-mono font-bold uppercase border ${
                                          goal.priority === 'High'
                                            ? 'border-rose-400/40 text-rose-300 bg-rose-500/10'
                                            : goal.priority === 'Medium'
                                            ? 'border-amber-400/40 text-amber-300 bg-amber-500/10'
                                            : 'border-white/20 text-neutral-300 bg-white/5'
                                        }`}
                                      >
                                        {goal.priority} PRIORITY
                                      </span>
                                      <span className="text-xs font-mono text-neutral-400 flex items-center gap-1">
                                        <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                                        <span>DUE: {goal.targetDate}</span>
                                      </span>
                                    </div>

                                    <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-white">
                                      {goal.title}
                                    </h3>

                                    {goal.description && (
                                      <p className="text-xs font-mono text-neutral-400 line-clamp-1">
                                        {goal.description}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                {/* Right Stats & Controls */}
                                <div
                                  className="flex items-center gap-4 sm:gap-6 shrink-0 self-end md:self-center"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {/* Progress bar */}
                                  <div className="w-28 sm:w-36 font-mono text-xs">
                                    <div className="flex justify-between text-neutral-400 mb-1 text-[11px]">
                                      <span>PROGRESS</span>
                                      <span className="text-white font-bold">{goal.progress}%</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-white/10 overflow-hidden">
                                      <div
                                        className="h-full bg-white transition-all duration-300"
                                        style={{ width: `${goal.progress}%` }}
                                      />
                                    </div>
                                    <div className="text-[10px] text-neutral-500 mt-1 text-right">
                                      {completedSubtasksInGoal}/{totalSubtasksInGoal} TASKS
                                    </div>
                                  </div>

                                  {/* Action Buttons */}
                                  <div className="flex items-center gap-1.5">
                                    <button
                                      onClick={() => handleBreakdownExistingGoal(goal)}
                                      className="px-2.5 py-1.5 bg-white/5 hover:bg-white/20 border border-white/20 text-neutral-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-mono uppercase"
                                      title="Ask AI to break down / expand milestones"
                                    >
                                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                                      <span className="hidden sm:inline">AI ASSIST</span>
                                    </button>

                                    <button
                                      onClick={() => toggleGoalDropdown(goal.id)}
                                      className="px-3 py-1.5 bg-white/10 hover:bg-white text-white hover:text-black transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-mono font-bold uppercase"
                                    >
                                      <span>{isGoalOpen ? 'CLOSE' : 'SUBLIST'}</span>
                                      <span className="text-[10px] opacity-75">
                                        ({goal.milestones.length})
                                      </span>
                                    </button>

                                    <button
                                      onClick={() => onDeleteGoal(goal.id)}
                                      className="p-1.5 border border-white/10 text-neutral-400 hover:text-rose-400 hover:border-rose-400/40 transition-colors cursor-pointer"
                                      title="Delete Goal"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {/* Milestone Sublist Dropdown Section */}
                              <AnimatePresence>
                                {isGoalOpen && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="border-t border-white/15 bg-[#101010] p-4 sm:p-6 space-y-4"
                                  >
                                    {/* AI Tip Banner if exists */}
                                    {goal.aiTip && (
                                      <div className="p-3 bg-[#1A1A1A] border border-white/15 flex items-start gap-2.5 text-xs font-mono text-neutral-300">
                                        <Lightbulb className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
                                        <div>
                                          <span className="font-bold text-white uppercase">AI STRATEGY TIP: </span>
                                          <span>{goal.aiTip}</span>
                                        </div>
                                      </div>
                                    )}

                                    {/* Sublist Navigation Header */}
                                    <div className="flex items-center justify-between pb-2 border-b border-white/10">
                                      <div className="flex items-center gap-2">
                                        <Layers className="w-4 h-4 text-neutral-400" />
                                        <h4 className="text-xs font-mono font-black uppercase tracking-wider text-neutral-300">
                                          MILESTONES & SUBTASKS SUBLIST ({goal.milestones.length})
                                        </h4>
                                      </div>
                                      <button
                                        onClick={() => handleQuickAddMilestoneToGoal(goal)}
                                        className="text-[11px] font-mono text-neutral-300 hover:text-white uppercase flex items-center gap-1 cursor-pointer"
                                      >
                                        <Plus className="w-3.5 h-3.5" />
                                        <span>ADD MILESTONE</span>
                                      </button>
                                    </div>

                                    {/* Milestones Nested List */}
                                    {goal.milestones.length === 0 ? (
                                      <div className="py-6 px-4 border border-dashed border-white/15 text-center text-xs font-mono text-neutral-400 space-y-2">
                                        <p>No milestones created yet in this goal.</p>
                                        <div className="flex justify-center gap-2">
                                          <button
                                            onClick={() => handleBreakdownExistingGoal(goal)}
                                            className="px-3 py-1.5 bg-white text-black font-bold uppercase text-[11px] inline-flex items-center gap-1.5 cursor-pointer hover:bg-neutral-200"
                                          >
                                            <Sparkles className="w-3.5 h-3.5 text-black" />
                                            <span>AUTO-GENERATE WITH AI</span>
                                          </button>
                                          <button
                                            onClick={() => handleQuickAddMilestoneToGoal(goal)}
                                            className="px-3 py-1.5 bg-[#1A1A1A] border border-white/20 text-white font-bold uppercase text-[11px] inline-flex items-center gap-1.5 cursor-pointer hover:bg-white/10"
                                          >
                                            <Plus className="w-3.5 h-3.5" />
                                            <span>ADD MILESTONE MANUALLY</span>
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="space-y-3 pl-2 sm:pl-4 border-l-2 border-white/10">
                                        {goal.milestones.map((milestone, mIdx) => {
                                          const isMilestoneOpen = expandedMilestones[milestone.id] ?? true;
                                          const completedSubtasks = milestone.subtasks.filter((st) => st.completed).length;

                                          return (
                                            <div
                                              key={milestone.id}
                                              className="bg-[#181818] border border-white/10 overflow-hidden"
                                            >
                                              {/* Milestone Accordion Header */}
                                              <div
                                                className="p-3.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-[#202020] transition-colors"
                                                onClick={() => toggleMilestoneDropdown(milestone.id)}
                                              >
                                                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                                  <button
                                                    type="button"
                                                    className="p-0.5 text-neutral-400 hover:text-white"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      toggleMilestoneDropdown(milestone.id);
                                                    }}
                                                  >
                                                    {isMilestoneOpen ? (
                                                      <ChevronDown className="w-4 h-4 text-white" />
                                                    ) : (
                                                      <ChevronRight className="w-4 h-4 text-neutral-400" />
                                                    )}
                                                  </button>

                                                  <span className="text-[10px] font-mono font-bold text-neutral-400">
                                                    M{mIdx + 1}
                                                  </span>

                                                  <h5 className="text-xs sm:text-sm font-bold uppercase tracking-tight text-white truncate">
                                                    {milestone.title}
                                                  </h5>

                                                  <span className="text-[10px] font-mono text-neutral-400 uppercase hidden sm:inline">
                                                    • DUE: {milestone.dueDate}
                                                  </span>
                                                </div>

                                                <div
                                                  className="flex items-center gap-3 shrink-0"
                                                  onClick={(e) => e.stopPropagation()}
                                                >
                                                  <span className="text-[10px] font-mono px-2 py-0.5 bg-black/40 text-neutral-300 border border-white/10">
                                                    {completedSubtasks}/{milestone.subtasks.length} SUBTASKS
                                                  </span>

                                                  <button
                                                    onClick={() => handleQuickAddSubtaskToMilestone(goal, milestone.id)}
                                                    className="text-[10px] font-mono text-neutral-400 hover:text-white uppercase flex items-center gap-1 cursor-pointer"
                                                    title="Add subtask to milestone"
                                                  >
                                                    <Plus className="w-3 h-3" />
                                                    <span className="hidden sm:inline">SUBTASK</span>
                                                  </button>
                                                </div>
                                              </div>

                                              {/* Subtasks Dropdown List */}
                                              <AnimatePresence>
                                                {isMilestoneOpen && (
                                                  <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="border-t border-white/10 bg-[#141414] p-3 sm:p-4 space-y-2"
                                                  >
                                                    {milestone.subtasks.length === 0 ? (
                                                      <div className="py-2 text-[11px] font-mono text-neutral-500 italic">
                                                        No subtasks under this milestone.
                                                      </div>
                                                    ) : (
                                                      milestone.subtasks.map((st) => (
                                                        <div
                                                          key={st.id}
                                                          onClick={() => handleToggleSubtask(goal, milestone.id, st.id)}
                                                          className="flex items-center justify-between p-2.5 bg-[#181818] border border-white/5 hover:border-white/20 transition-all cursor-pointer group"
                                                        >
                                                          <div className="flex items-center gap-3 min-w-0">
                                                            {st.completed ? (
                                                              <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                                                            ) : (
                                                              <Square className="w-4 h-4 text-neutral-500 group-hover:text-white shrink-0" />
                                                            )}
                                                            <span
                                                              className={`text-xs font-mono truncate ${
                                                                st.completed
                                                                  ? 'line-through text-neutral-500'
                                                                  : 'text-neutral-200'
                                                              }`}
                                                            >
                                                              {st.title}
                                                            </span>
                                                          </div>

                                                          <span className="text-[10px] font-mono text-neutral-400 flex items-center gap-1 shrink-0 ml-2">
                                                            <Clock className="w-3 h-3 text-neutral-500" />
                                                            <span>~{st.estimatedMinutes}M</span>
                                                          </span>
                                                        </div>
                                                      ))
                                                    )}

                                                    <button
                                                      onClick={() => handleQuickAddSubtaskToMilestone(goal, milestone.id)}
                                                      className="text-[10px] font-mono text-neutral-400 hover:text-white uppercase flex items-center gap-1 cursor-pointer pt-1"
                                                    >
                                                      <Plus className="w-3 h-3" />
                                                      <span>+ ADD ANOTHER SUBTASK</span>
                                                    </button>
                                                  </motion.div>
                                                )}
                                              </AnimatePresence>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Goal Modal (Step 1: Input / Step 2: Confirm & Modify) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#121212] border border-white/20 max-w-2xl w-full p-6 text-white space-y-6 my-8">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-white text-black flex items-center justify-center font-black">
                  <Target className="w-5 h-5 text-black" />
                </div>
                <div>
                  <div className="text-[10px] font-mono tracking-widest text-neutral-400 uppercase">
                    {modalStep === 'input' ? 'STEP 01 // GOAL SPECIFICATION' : 'STEP 02 // AI PROPOSAL CONFIRMATION'}
                  </div>
                  <h3 className="text-base font-black uppercase tracking-wider text-white">
                    {modalStep === 'input' ? 'CREATE ACADEMIC GOAL' : 'CONFIRM OR MODIFY AI BREAKDOWN'}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-neutral-400 hover:text-white font-mono text-base font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {aiError && (
              <div className="p-3 bg-rose-900/30 border border-rose-500/50 text-rose-300 text-xs font-mono flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{aiError}</span>
              </div>
            )}

            {/* STEP 1: INITIAL GOAL PARAMETERS */}
            {modalStep === 'input' ? (
              <form onSubmit={handleManualAddGoal} className="space-y-4 font-mono">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-1">
                    GOAL TITLE *
                  </label>
                  <input
                    type="text"
                    value={goalTitle}
                    onChange={(e) => setGoalTitle(e.target.value)}
                    placeholder="e.g., Master Operating Systems & Complete Final Lab"
                    required
                    className="w-full px-3.5 py-2.5 bg-[#1A1A1A] border border-white/20 focus:border-white text-xs text-white outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-1">
                      DIRECTORY / FOLDER
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as Category)}
                      className="w-full px-3 py-2 bg-[#1A1A1A] border border-white/20 text-xs text-white outline-hidden"
                    >
                      <option value="Academic">/Academic</option>
                      <option value="Projects">/Projects</option>
                      <option value="Career">/Career</option>
                      <option value="Personal">/Personal</option>
                      <option value="Health">/Health</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-1">PRIORITY</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as Priority)}
                      className="w-full px-3 py-2 bg-[#1A1A1A] border border-white/20 text-xs text-white outline-hidden"
                    >
                      <option value="High">High Priority</option>
                      <option value="Medium">Medium Priority</option>
                      <option value="Low">Low Priority</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-1">TARGET DATE</label>
                    <input
                      type="date"
                      value={targetDate}
                      onChange={(e) => setTargetDate(e.target.value)}
                      className="w-full px-3 py-2 bg-[#1A1A1A] border border-white/20 text-xs text-white outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-1">DESCRIPTION</label>
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Brief details or exam date..."
                      className="w-full px-3 py-2 bg-[#1A1A1A] border border-white/20 text-xs text-white outline-hidden"
                    />
                  </div>
                </div>

                <div className="pt-3 flex flex-col sm:flex-row items-center gap-3">
                  <button
                    type="button"
                    onClick={handleAiBreakdown}
                    disabled={isAiBreakingDown}
                    id="modal-ai-breakdown-btn"
                    className="w-full sm:w-1/2 py-3.5 bg-white text-black hover:bg-neutral-200 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isAiBreakingDown ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-black" />
                        <span>GENERATING PROPOSAL...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-black" />
                        <span>AUTO-BREAKDOWN WITH AI</span>
                      </>
                    )}
                  </button>

                  <button
                    type="submit"
                    disabled={isAiBreakingDown}
                    className="w-full sm:w-1/2 py-3.5 bg-transparent text-white border border-white/20 hover:bg-white/10 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    SAVE WITHOUT AI
                  </button>
                </div>
              </form>
            ) : (
              /* STEP 2: CONFIRMATION & MODIFICATION REVIEW */
              <div className="space-y-5">
                
                {/* Decision Prompt Notice */}
                <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 text-xs font-mono space-y-1">
                  <div className="flex items-center gap-2 text-emerald-300 font-bold uppercase">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>DO YOU NEED THIS BREAKDOWN OR WANT TO MODIFY IT?</span>
                  </div>
                  <p className="text-neutral-300">
                    Gemini AI produced the milestones and study subtasks below for folder /{category}. You can edit any milestone title, due date, or estimated subtask time before confirming.
                  </p>
                </div>

                {/* AI Study Tip (Editable) */}
                <div className="p-3 bg-[#1A1A1A] border border-white/15 text-xs font-mono space-y-1">
                  <label className="text-amber-300 font-bold uppercase text-[10px] block">AI STUDY STRATEGY TIP</label>
                  <input
                    type="text"
                    value={proposedAiTip}
                    onChange={(e) => setProposedAiTip(e.target.value)}
                    className="w-full px-2 py-1 bg-[#121212] border border-white/20 text-xs text-white"
                  />
                </div>

                {/* Proposed Milestones List (Editable) */}
                <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
                  {proposedMilestones.map((m, mIdx) => (
                    <div key={m.id || mIdx} className="p-4 bg-[#181818] border border-white/15 space-y-3 font-mono">
                      
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1">
                          <span className="text-[10px] font-bold text-neutral-400">M{mIdx + 1}</span>
                          <input
                            type="text"
                            value={m.title}
                            onChange={(e) => handleUpdateMilestone(mIdx, { title: e.target.value })}
                            className="w-full px-2 py-1 bg-[#121212] border border-white/20 text-xs font-bold text-white uppercase"
                            placeholder="Milestone title"
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={m.dueDate}
                            onChange={(e) => handleUpdateMilestone(mIdx, { dueDate: e.target.value })}
                            className="w-24 px-2 py-1 bg-[#121212] border border-white/20 text-[11px] text-neutral-300"
                            placeholder="Due date"
                          />
                          <button
                            onClick={() => handleDeleteMilestone(mIdx)}
                            className="p-1 text-neutral-400 hover:text-rose-400 cursor-pointer"
                            title="Remove milestone"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Subtasks inside milestone */}
                      <div className="space-y-2 pl-3 border-l-2 border-white/20">
                        {m.subtasks.map((st, stIdx) => (
                          <div key={st.id || stIdx} className="flex items-center gap-2">
                            <input
                              type="text"
                              value={st.title}
                              onChange={(e) => handleUpdateSubtask(mIdx, stIdx, { title: e.target.value })}
                              className="flex-1 px-2 py-1 bg-[#121212] border border-white/10 text-xs text-neutral-200"
                              placeholder="Subtask name"
                            />
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min="5"
                                max="240"
                                value={st.estimatedMinutes}
                                onChange={(e) =>
                                  handleUpdateSubtask(mIdx, stIdx, { estimatedMinutes: Number(e.target.value) })
                                }
                                className="w-14 px-1.5 py-1 bg-[#121212] border border-white/10 text-xs text-white text-center"
                              />
                              <span className="text-[10px] text-neutral-400">MINS</span>
                            </div>
                            <button
                              onClick={() => handleDeleteSubtask(mIdx, stIdx)}
                              className="p-1 text-neutral-500 hover:text-rose-400 cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}

                        <button
                          onClick={() => handleAddSubtask(mIdx)}
                          className="text-[10px] uppercase text-neutral-400 hover:text-white flex items-center gap-1 cursor-pointer pt-1"
                        >
                          <Plus className="w-3 h-3" />
                          <span>ADD SUBTASK</span>
                        </button>
                      </div>

                    </div>
                  ))}

                  <button
                    onClick={handleAddMilestone}
                    className="w-full py-2 bg-[#1A1A1A] hover:bg-white/10 border border-dashed border-white/20 text-xs font-mono uppercase text-neutral-300 hover:text-white flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>ADD ANOTHER MILESTONE TO PROPOSAL</span>
                  </button>
                </div>

                {/* Primary Decision Action Buttons */}
                <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row gap-3">
                  
                  {/* Confirm Action */}
                  <button
                    onClick={handleConfirmAiGoal}
                    className="flex-1 py-3.5 bg-white text-black font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer hover:bg-neutral-200 transition-colors"
                  >
                    <Check className="w-4 h-4 text-black" />
                    <span>YES, CONFIRM & SAVE ({proposedMilestones.length} MILESTONES)</span>
                  </button>

                  {/* Modify / Go back to parameters */}
                  <button
                    onClick={() => setModalStep('input')}
                    className="py-3.5 px-4 bg-[#1A1A1A] hover:bg-white/10 border border-white/20 text-white font-mono text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>MODIFY PARAMETERS</span>
                  </button>

                  {/* Discard Action */}
                  <button
                    onClick={handleDiscardAiGoal}
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
    </div>
  );
};
