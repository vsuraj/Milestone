import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, UserProfile } from '../types';
import {
  Sparkles,
  Send,
  User,
  BookOpen,
  Brain,
  Lightbulb,
  Clock,
  Loader2,
  HelpCircle,
} from 'lucide-react';

interface AssistantViewProps {
  userProfile: UserProfile;
  messages: ChatMessage[];
  onSendMessage: (userText: string) => Promise<void>;
}

export const AssistantView: React.FC<AssistantViewProps> = ({
  userProfile,
  messages,
  onSendMessage,
}) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userText = input;
    setInput('');
    setIsLoading(true);

    try {
      await onSendMessage(userText);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = [
    'How do I implement Active Recall for my exams?',
    'Create a 3-day revision plan for my Machine Learning midterm',
    'How do I stop procrastinating on heavy lab assignments?',
    'Explain the Feynman Technique in 3 simple steps',
  ];

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="bg-[#121212] border border-white/10 p-6 text-white flex items-center gap-4">
        <div className="w-10 h-10 bg-white text-black flex items-center justify-center shrink-0">
          <Sparkles className="w-5 h-5 text-black" />
        </div>
        <div>
          <div className="text-[10px] font-mono tracking-[0.2em] text-neutral-400 uppercase">MODULE // 05</div>
          <h1 className="text-xl font-black uppercase text-white tracking-tight mt-0.5">MILESTONE AI ACADEMIC MENTOR</h1>
          <p className="text-xs font-mono text-neutral-400 mt-0.5">
            Powered by Gemini AI • Evidence-based study advice, exam prep, & goal strategy
          </p>
        </div>
      </div>

      {/* Quick Prompt Chips */}
      <div className="space-y-2">
        <p className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-1.5">
          <HelpCircle className="w-3.5 h-3.5 text-white" />
          <span>SUGGESTED PROMPTS</span>
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {quickPrompts.map((promptText, idx) => (
            <button
              key={idx}
              onClick={() => {
                setInput(promptText);
              }}
              className="p-3 bg-[#121212] border border-white/10 hover:border-white/30 text-neutral-300 hover:text-white text-xs font-mono font-bold text-left uppercase tracking-wider transition-all cursor-pointer"
            >
              "{promptText.toUpperCase()}"
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages Container */}
      <div className="bg-[#121212] border border-white/10 p-6 min-h-[400px] max-h-[550px] overflow-y-auto space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${
              msg.role === 'user' ? 'flex-row-reverse' : ''
            }`}
          >
            <div
              className={`w-8 h-8 font-mono font-black text-xs flex items-center justify-center shrink-0 ${
                msg.role === 'user'
                  ? 'bg-white text-black'
                  : 'bg-white/10 border border-white/20 text-white'
              }`}
            >
              {msg.role === 'user' ? userProfile.name.charAt(0) : <Sparkles className="w-4 h-4 text-white" />}
            </div>

            <div
              className={`max-w-xl p-4 font-mono text-xs leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-white text-black font-bold'
                  : 'bg-[#1A1A1A] border border-white/15 text-white whitespace-pre-wrap'
              }`}
            >
              {msg.text}
              <div
                className={`text-[9px] font-mono mt-2 text-right uppercase tracking-widest ${
                  msg.role === 'user' ? 'text-neutral-600' : 'text-neutral-500'
                }`}
              >
                {msg.timestamp}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-3 text-xs font-mono text-neutral-400">
            <div className="w-8 h-8 bg-white/10 border border-white/20 text-white flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 animate-spin text-white" />
            </div>
            <div className="p-3 bg-[#1A1A1A] border border-white/15 text-neutral-300 font-mono text-xs flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>ANALYZING STUDY QUESTION...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <form onSubmit={handleSubmit} className="relative">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask your AI mentor about study techniques, schedules, or exam strategies..."
          disabled={isLoading}
          className="w-full pl-4 pr-12 py-3.5 bg-[#121212] border border-white/20 text-white font-mono placeholder:text-neutral-500 text-xs outline-hidden"
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="absolute right-2 top-2 p-2 bg-white text-black hover:bg-neutral-200 disabled:opacity-40 transition-colors cursor-pointer"
        >
          <Send className="w-4 h-4 text-black" />
        </button>
      </form>

    </div>
  );
};
