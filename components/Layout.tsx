
import React from 'react';
import { User, UserRole } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const Icons = {
  Dashboard: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
  ),
  Customers: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
  ),
  Helpdesk: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a2 2 0 0 1-2.51-2.51l-3.77 3.77Z"/><path d="m20 10 2 2"/><path d="m7.5 11.5 4.5 4.5-4 4-4-4 4-4Z"/><path d="m3.37 7.91-1.5-1.5a2 2 0 0 1 2.82-2.82l1.5 1.5"/><path d="m5 22 5-5"/><path d="m17 2 5 5"/></svg>
  ),
  Payments: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
  ),
  Quotation: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 2H10c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V6l-4-4z"/><path d="M16 2v4h4"/><path d="M12 18h4"/><path d="M12 14h4"/><path d="M12 10h1"/></svg>
  ),
  Inventory: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
  ),
  Logout: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
  ),
  Moon: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
  ),
  Sun: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
  )
};

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout, activeTab, setActiveTab, theme, toggleTheme }) => {
  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: Icons.Dashboard, color: 'text-indigo-500' },
    { id: 'customers', name: 'Customers', icon: Icons.Customers, color: 'text-teal-500' },
    { id: 'helpdesk', name: 'Helpdesk', icon: Icons.Helpdesk, color: 'text-rose-500' },
    { id: 'payments', name: 'Payments', icon: Icons.Payments, color: 'text-amber-500' },
    { id: 'inventory', name: 'Stock', icon: Icons.Inventory, color: 'text-purple-500' },
    { id: 'quotations', name: 'Quotations', icon: Icons.Quotation, color: 'text-blue-500' },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-transparent">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-72 bg-white/40 dark:bg-black/40 backdrop-blur-2xl border-r border-slate-200/30 dark:border-white/5 p-0 sticky top-0 h-screen transition-all duration-300 z-50">
        <div className="p-8 border-b border-slate-200/20 dark:border-white/5">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 bg-gradient-to-br from-brand-600 to-indigo-800 rounded-2xl flex items-center justify-center font-black text-white text-2xl shadow-xl shadow-brand-500/30">I</div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white leading-none">Intech</h1>
              <p className="text-[10px] font-black text-brand-600 dark:text-indigo-400 uppercase tracking-[0.3em] mt-1">Broadband</p>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 p-6 space-y-2 overflow-y-auto custom-scrollbar">
          <p className="px-3 py-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Navigation</p>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group ${
                activeTab === tab.id 
                ? 'bg-white dark:bg-white/10 shadow-2xl shadow-slate-200/50 dark:shadow-none border border-slate-200/50 dark:border-white/10 scale-105' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-white/5'
              }`}
            >
              <div className={`transition-all duration-300 ${activeTab === tab.id ? tab.color : 'text-slate-400 opacity-60 group-hover:opacity-100 group-hover:scale-110'}`}>
                <tab.icon />
              </div>
              <span className={`text-sm font-bold tracking-tight ${activeTab === tab.id ? 'text-slate-900 dark:text-white' : ''}`}>{tab.name}</span>
              {activeTab === tab.id && <div className={`ml-auto w-2 h-2 rounded-full animate-pulse ${tab.color.replace('text', 'bg')}`} />}
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-slate-200/20 dark:border-white/5 space-y-4">
          <div className="bg-gradient-to-r from-brand-600/10 to-transparent dark:from-white/10 rounded-2xl p-4 flex items-center gap-4 border border-white/20 dark:border-white/5">
            <div className="w-10 h-10 rounded-full bg-brand-500 flex items-center justify-center text-white font-black text-sm shadow-lg">
              {user.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-black text-slate-900 dark:text-white truncate uppercase tracking-tighter">{user.name}</p>
              <p className="text-[10px] text-slate-500 font-black uppercase opacity-70">{user.role}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button onClick={toggleTheme} className="flex items-center justify-center p-3 rounded-2xl border border-slate-200/50 dark:border-white/10 bg-white/50 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:scale-105 active:scale-95 transition-all">
              {theme === 'light' ? <Icons.Moon /> : <Icons.Sun />}
            </button>
            <button onClick={onLogout} className="flex items-center justify-center p-3 rounded-2xl border border-slate-200/50 dark:border-white/10 bg-white/50 dark:bg-white/5 text-rose-500 hover:bg-rose-500 hover:text-white active:scale-95 transition-all">
              <Icons.Logout />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 z-0">
        <header className="md:hidden glass-morphism border-b border-slate-200/50 dark:border-white/5 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
           <div className="flex items-center gap-3">
             <div className="w-11 h-11 bg-gradient-to-br from-brand-600 to-indigo-800 rounded-xl flex items-center justify-center font-black text-white text-xl shadow-lg ring-2 ring-indigo-500/20">I</div>
             <div className="flex flex-col -space-y-0.5">
               <span className="font-black text-slate-900 dark:text-white tracking-tighter uppercase text-xl leading-none">Intech</span>
               <span className="text-[9px] font-black text-brand-600 dark:text-indigo-400 uppercase tracking-[0.25em] leading-none">Broadband</span>
             </div>
           </div>
           <div className="flex items-center gap-2">
             <button onClick={toggleTheme} className="p-2.5 text-slate-500 dark:text-slate-400 bg-white/50 dark:bg-white/5 rounded-xl border border-slate-200/50 dark:border-white/10 active:scale-90 transition-transform">
               {theme === 'light' ? <Icons.Moon /> : <Icons.Sun />}
             </button>
             <button onClick={onLogout} className="p-2.5 text-rose-500 bg-white/50 dark:bg-white/5 rounded-xl border border-slate-200/50 dark:border-white/10 active:scale-90 transition-transform">
               <Icons.Logout />
             </button>
           </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10 lg:p-12">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden glass-morphism border-t border-slate-200/50 dark:border-white/5 grid grid-cols-6 h-20 sticky bottom-0 z-50 px-2 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center gap-1.5 transition-all ${
                activeTab === tab.id ? `${tab.color} scale-110 font-black` : 'text-slate-400 font-bold'
              }`}
            >
              <div className={`transition-transform duration-300 ${activeTab === tab.id ? 'scale-110' : 'opacity-70'}`}>
                <tab.icon />
              </div>
              <span className="text-[8px] font-black uppercase tracking-tighter">{tab.name.split(' ')[0]}</span>
              {activeTab === tab.id && <div className={`w-1 h-1 rounded-full ${tab.color.replace('text', 'bg')} -mb-1`} />}
            </button>
          ))}
        </nav>
      </main>
    </div>
  );
};

export default Layout;
