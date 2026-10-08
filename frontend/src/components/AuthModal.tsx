import React from 'react';
import { useAuth } from '../context/AuthContext';
import { X, LogOut, CheckCircle2, Shield, Cloud } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/** Account panel for the signed-in user (sign-in itself lives in AuthForm). */
export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, signOut } = useAuth();

  if (!isOpen || !currentUser) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-[#121212] border border-white/20 p-6 text-white shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-white transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="text-[10px] font-mono tracking-[0.25em] text-neutral-400 uppercase">
            AUTHENTICATION // SECURE ACCESS
          </div>
          <h2 className="text-xl font-black uppercase tracking-tight text-white mt-1 flex items-center gap-2">
            <Shield className="w-5 h-5 text-white" />
            <span>STUDENT ACCOUNT</span>
          </h2>
          <p className="text-xs font-mono text-neutral-400 mt-1">
            Your goals, focus sprints and preferences are stored securely on the Milestone server.
          </p>
        </div>

        <div className="space-y-5">
          <div className="p-4 bg-[#1A1A1A] border border-white/10 flex items-center gap-3">
            {currentUser.photoURL ? (
              <img
                src={currentUser.photoURL}
                alt={currentUser.displayName || 'User'}
                className="w-12 h-12 rounded-full border border-white/20 object-cover"
              />
            ) : (
              <div className="w-12 h-12 bg-white text-black font-black flex items-center justify-center text-lg">
                {(currentUser.displayName || currentUser.email || 'U').charAt(0).toUpperCase()}
              </div>
            )}
            <div className="overflow-hidden">
              <div className="text-sm font-bold text-white truncate">
                {currentUser.displayName || 'Academic Scholar'}
              </div>
              <div className="text-xs font-mono text-neutral-400 truncate">{currentUser.email}</div>
              <div className="flex items-center gap-1.5 mt-1 text-[10px] font-mono text-emerald-400 uppercase tracking-wider">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>Server Sync Active</span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-[#181818] border border-white/5 space-y-2 text-xs font-mono text-neutral-300">
            <div className="flex justify-between">
              <span className="opacity-60">USER ID:</span>
              <span className="truncate max-w-[180px] text-white">{currentUser.uid}</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-60">SIGN-IN METHOD:</span>
              <span className="text-white">Email + JWT</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="opacity-60 flex items-center gap-1.5">
                <Cloud className="w-3 h-3" /> DATABASE:
              </span>
              <span className="text-emerald-400 font-bold">PostgreSQL</span>
            </div>
          </div>

          <button
            onClick={async () => {
              await signOut();
              onClose();
            }}
            className="w-full py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer border border-white/10"
          >
            <LogOut className="w-4 h-4" />
            <span>SIGN OUT</span>
          </button>
        </div>
      </div>
    </div>
  );
};
