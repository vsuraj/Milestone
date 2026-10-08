import React, { useState } from 'react';
import { LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export type AuthMode = 'login' | 'register';

interface AuthFormProps {
  initialMode?: AuthMode;
  onSuccess?: () => void;
}

/** Email + password sign-in / sign-up backed by Django + SimpleJWT. */
export const AuthForm: React.FC<AuthFormProps> = ({ initialMode = 'login', onSuccess }) => {
  const { login, register, authError, clearAuthError } = useAuth();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isRegister = mode === 'register';

  const switchMode = (next: AuthMode) => {
    setMode(next);
    clearAuthError();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    const ok = isRegister
      ? await register(name.trim(), email.trim(), password)
      : await login(email.trim(), password);
    setSubmitting(false);
    if (ok) onSuccess?.();
  };

  const inputClass =
    'w-full bg-[#0A0A0A] border border-white/20 focus:border-white text-white text-sm font-mono px-3 py-2.5 outline-hidden placeholder:text-neutral-600';
  const labelClass = 'block text-[10px] font-mono tracking-[0.2em] text-neutral-400 uppercase mb-1';

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate={false}>
      <div className="grid grid-cols-2 border border-white/20 text-xs font-mono font-bold uppercase tracking-widest">
        <button
          type="button"
          onClick={() => switchMode('login')}
          className={`py-2.5 cursor-pointer transition-colors ${
            !isRegister ? 'bg-white text-black' : 'text-neutral-400 hover:text-white'
          }`}
        >
          SIGN IN
        </button>
        <button
          type="button"
          onClick={() => switchMode('register')}
          className={`py-2.5 cursor-pointer transition-colors ${
            isRegister ? 'bg-white text-black' : 'text-neutral-400 hover:text-white'
          }`}
        >
          CREATE ACCOUNT
        </button>
      </div>

      {authError && (
        <div
          role="alert"
          className="p-3 bg-rose-950/50 border border-rose-500/50 text-rose-200 text-xs font-mono"
        >
          {authError}
        </div>
      )}

      {isRegister && (
        <div>
          <label htmlFor="auth-name" className={labelClass}>
            FULL NAME
          </label>
          <input
            id="auth-name"
            type="text"
            required
            maxLength={100}
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
            placeholder="Ada Lovelace"
          />
        </div>
      )}

      <div>
        <label htmlFor="auth-email" className={labelClass}>
          EMAIL
        </label>
        <input
          id="auth-email"
          type="email"
          required
          maxLength={255}
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
          placeholder="you@college.edu"
        />
      </div>

      <div>
        <label htmlFor="auth-password" className={labelClass}>
          PASSWORD
        </label>
        <input
          id="auth-password"
          type="password"
          required
          minLength={isRegister ? 8 : undefined}
          maxLength={128}
          autoComplete={isRegister ? 'new-password' : 'current-password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
          placeholder={isRegister ? 'At least 8 characters' : '••••••••'}
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full py-3.5 bg-white hover:bg-neutral-200 disabled:opacity-60 text-black font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-colors cursor-pointer"
      >
        {isRegister ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
        <span>
          {submitting ? 'CONNECTING...' : isRegister ? 'CREATE ACCOUNT' : 'SIGN IN'}
        </span>
      </button>
    </form>
  );
};
