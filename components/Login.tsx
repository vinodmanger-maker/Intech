
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { storage } from '../services/storage';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [welcomeUser, setWelcomeUser] = useState<string | null>(null);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Good Morning";
    if (hour >= 12 && hour < 16) return "Good Afternoon";
    if (hour >= 16 && hour < 20) return "Good Evening";
    return "Welcome Back";
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    let authenticatedUser: User | null = null;
    let welcomeName = '';

    if (password === '1234') {
      authenticatedUser = {
        id: 'admin',
        name: 'Vinod',
        role: UserRole.ADMIN
      };
      welcomeName = 'Vinod';
    } else if (password === '0000') {
      authenticatedUser = {
        id: 'agent',
        name: 'Subhajit',
        role: UserRole.STAFF
      };
      welcomeName = 'Subhajit';
    }

    if (authenticatedUser) {
      setWelcomeUser(welcomeName);
      storage.setAuthUser(authenticatedUser);
      
      setTimeout(() => {
        onLogin(authenticatedUser!);
      }, 1200);
    } else {
      setError('Invalid Access PIN');
      setPassword('');
    }
  };

  if (welcomeUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-600 dark:bg-brand-900 animate-in fade-in duration-500">
        <div className="text-center space-y-4 animate-in zoom-in duration-700">
          <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-3xl mx-auto shadow-xl border border-white/20">
            👋
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            {getGreeting()}, <span className="opacity-80 italic">{welcomeUser}</span>
          </h2>
          <div className="flex items-center justify-center gap-3">
            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
            <p className="text-white/60 font-black uppercase tracking-widest text-[10px]">Authorizing Agent Session...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#f8fafc] dark:bg-slate-950">
      <div className="max-w-[360px] w-full space-y-8 animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-brand-600 rounded-xl flex items-center justify-center font-black text-white text-2xl shadow-xl shadow-brand-500/20 mb-6">I</div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tightest uppercase italic">Intech <span className="text-brand-600 not-italic">Portal</span></h1>
          <p className="mt-1.5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em]">Broadband Management System</p>
        </div>

        <div className="bg-white dark:bg-[#0f172a] p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl shadow-slate-200/50 dark:shadow-none">
          <form className="space-y-6" onSubmit={handleLogin}>
            <div className="space-y-4">
              <div className="text-center">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-4">Security Access PIN</label>
                <input
                  type="password"
                  required
                  autoFocus
                  maxLength={4}
                  placeholder="••••"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-4 text-center text-4xl font-black tracking-[0.6em] text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-600 transition-all placeholder:tracking-normal placeholder:text-slate-200 dark:placeholder:text-slate-800"
                  value={password}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setPassword(val);
                  }}
                />
              </div>
              {error && (
                <div className="bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/20 p-2.5 rounded-lg text-center animate-shake">
                  <p className="text-[10px] font-bold text-rose-600 uppercase tracking-wide">{error}</p>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-brand-500/20 active:scale-[0.98] transition-all border border-brand-500"
            >
              Verify & Enter
            </button>
          </form>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Broadband Secured Session</p>
          </div>
          <p className="text-[9px] font-medium text-slate-300 dark:text-slate-700">&copy; 2025 Intech Broadband</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
