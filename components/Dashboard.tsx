
import React, { useState } from 'react';
import { Customer, Transaction, User, UserRole, DashboardStats, CustomerStatus, TicketStatus } from '../types';
import { storage } from '../services/storage';

interface DashboardProps {
  user: User;
  customers: Customer[];
  transactions: Transaction[];
  onNavigate: (tab: string) => void;
  onRefresh: () => void;
}

const Icons = {
  Ticket: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="m9 12 2 2 4-4"/></svg>
  ),
  Collection: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 18V6"/></svg>
  ),
  Dues: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
  ),
  Users: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
  )
};

const Dashboard: React.FC<DashboardProps> = ({ user, customers, transactions, onNavigate, onRefresh }) => {
  const [showDuesModal, setShowDuesModal] = useState(false);
  const [showRevenueModal, setShowRevenueModal] = useState(false);
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const todayDayOfMonth = now.getDate();
  const tickets = storage.getTickets();

  const todayTransactions = React.useMemo(() => 
    transactions.filter(t => t.date.startsWith(todayStr)), 
  [transactions, todayStr]);

  const stats: DashboardStats = React.useMemo(() => {
    const startOfWeek = new Date(); startOfWeek.setDate(now.getDate() - 7);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    return {
      totalCollectionToday: todayTransactions.reduce((sum, t) => sum + t.amountPaid, 0),
      weeklyCollection: transactions.filter(t => new Date(t.date) >= startOfWeek).reduce((sum, t) => sum + t.amountPaid, 0),
      monthlyCollection: transactions.filter(t => new Date(t.date) >= startOfMonth).reduce((sum, t) => sum + t.amountPaid, 0),
      yearlyCollection: transactions.filter(t => new Date(t.date) >= startOfYear).reduce((sum, t) => sum + t.amountPaid, 0),
      staffCollectionToday: todayTransactions.filter(t => t.collectorRole === UserRole.STAFF).reduce((sum, t) => sum + t.amountPaid, 0),
      adminCollectionToday: todayTransactions.filter(t => t.collectorRole === UserRole.ADMIN).reduce((sum, t) => sum + t.amountPaid, 0),
      totalPendingDues: customers.reduce((sum, c) => sum + c.totalDue, 0),
      activeCustomers: customers.filter(c => c.status === CustomerStatus.ACTIVE).length,
      openTickets: tickets.filter(t => t.status !== TicketStatus.RESOLVED).length
    };
  }, [customers, transactions, todayTransactions, tickets]);

  const collectorBreakdown = React.useMemo(() => {
    const breakdown: Record<string, { amount: number, role: UserRole }> = {};
    todayTransactions.forEach(t => {
      if (!breakdown[t.collectorName]) breakdown[t.collectorName] = { amount: 0, role: t.collectorRole };
      breakdown[t.collectorName].amount += t.amountPaid;
    });
    return Object.entries(breakdown).sort((a, b) => b[1].amount - a[1].amount);
  }, [todayTransactions]);

  const topPending = customers.filter(c => c.totalDue > 0).sort((a, b) => b.totalDue - a.totalDue);
  const periodValue = selectedPeriod === 'weekly' ? stats.weeklyCollection : selectedPeriod === 'monthly' ? stats.monthlyCollection : stats.yearlyCollection;

  return (
    <div className="space-y-12 pb-16 animate-in fade-in slide-in-from-bottom-8 duration-1000">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter italic leading-none">
            {user.role === UserRole.ADMIN ? 'Operations Overview' : `Welcome, ${user.name}`}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-bold mt-3 tracking-wide">Business Intelligence • <span className="text-indigo-600 dark:text-indigo-400 uppercase">Live Operations</span></p>
        </div>
        <div className="glass-morphism px-6 py-3 rounded-2xl shadow-xl shadow-slate-200/20 dark:shadow-none">
           <div className="flex items-center gap-3">
             <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_15px_#10b981]"></div>
             <span className="text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">{now.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
           </div>
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <StatCard label="Live Tickets" value={stats.openTickets.toString()} trend="CRITICAL" icon={<Icons.Ticket />} color="rose" onClick={() => onNavigate('helpdesk')} />
        <StatCard label="Daily Intake" value={`₹${stats.totalCollectionToday.toLocaleString('en-IN')}`} trend="SETTLED" icon={<Icons.Collection />} color="indigo" onClick={() => setShowRevenueModal(true)} />
        <StatCard label="Customer Dues" value={`₹${stats.totalPendingDues.toLocaleString('en-IN')}`} trend="OVERDUE" icon={<Icons.Dues />} color="amber" onClick={() => setShowDuesModal(true)} />
        <StatCard label="Subscribers" value={stats.activeCustomers.toLocaleString()} trend="ACTIVE" icon={<Icons.Users />} color="teal" onClick={() => setShowUsersModal(true)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          <div className="glass-morphism rounded-[2.5rem] shadow-2xl overflow-hidden vibrant-card">
            <div className="px-10 py-8 border-b border-slate-200/20 dark:border-white/5 flex items-center justify-between bg-white/20 dark:bg-white/5">
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-[0.2em]">Priority Collections</h3>
              <button onClick={() => onNavigate('customers')} className="text-[11px] font-black text-brand-600 dark:text-brand-400 hover:text-indigo-700 transition-colors uppercase tracking-[0.2em]">View All →</button>
            </div>
            <div className="divide-y divide-slate-200/30 dark:divide-white/5 max-h-[600px] overflow-y-auto custom-scrollbar">
              {topPending.slice(0, 10).map(customer => (
                <div key={customer.id} className="px-10 py-6 flex items-center justify-between hover:bg-indigo-500/5 transition-all group">
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500/20 to-teal-700/20 flex items-center justify-center text-teal-600 dark:text-teal-400 font-black text-lg border border-teal-500/20 group-hover:scale-110 transition-transform shadow-lg">
                      {customer.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-4">
                        <p className="text-lg font-black text-slate-900 dark:text-white leading-none tracking-tight">{customer.name}</p>
                        {customer.dueDay === todayDayOfMonth && (
                          <span className="px-2.5 py-0.5 bg-rose-500 text-white text-[9px] font-black uppercase rounded-lg shadow-lg animate-pulse shadow-rose-500/40">Urgent</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 font-bold mt-2 uppercase tracking-tighter opacity-70">Cycle: Day {customer.dueDay} • {customer.phone}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-rose-600 dark:text-rose-500 tracking-tighter">₹{customer.totalDue}</p>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Pending</p>
                  </div>
                </div>
              ))}
              {topPending.length === 0 && (
                <div className="p-20 text-center">
                  <p className="text-slate-400 font-black uppercase tracking-[0.2em] italic">No pending dues. Great job!</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-10">
          {user.role === UserRole.ADMIN && (
            <div className="bg-gradient-to-br from-indigo-600 to-indigo-900 p-10 rounded-[2.5rem] shadow-2xl text-white vibrant-card relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
              <div className="flex items-center justify-between mb-8">
                 <h3 className="text-sm font-black uppercase tracking-[0.2em] opacity-80">Revenue Performance</h3>
                 <div className="flex bg-white/10 p-1 rounded-xl backdrop-blur-md">
                    {(['weekly', 'monthly', 'yearly'] as const).map(p => (
                      <button key={p} onClick={() => setSelectedPeriod(p)} className={`w-8 h-8 flex items-center justify-center text-[10px] font-black uppercase rounded-lg transition-all ${selectedPeriod === p ? 'bg-white text-indigo-900 shadow-xl' : 'text-white/60 hover:text-white'}`}>
                        {p.charAt(0)}
                      </button>
                    ))}
                 </div>
              </div>
              <div className="py-2">
                <p className="text-5xl font-black tracking-tightest">₹{periodValue.toLocaleString('en-IN')}</p>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] mt-6 text-white/50">Cumulative Yield ({selectedPeriod})</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-6">
             <button onClick={() => onNavigate('payments')} className="flex flex-col items-center justify-center p-10 bg-amber-500 hover:bg-amber-600 text-white rounded-[2.5rem] shadow-2xl shadow-amber-500/20 transition-all active:scale-95 group border border-amber-400">
                <div className="mb-4 group-hover:scale-110 group-hover:rotate-12 transition-transform drop-shadow-lg"><Icons.Collection /></div>
                <span className="text-[11px] font-black uppercase tracking-[0.2em]">COLLECT</span>
             </button>
             <button onClick={() => onNavigate('helpdesk')} className="flex flex-col items-center justify-center p-10 bg-rose-500 hover:bg-rose-600 text-white rounded-[2.5rem] shadow-2xl shadow-rose-500/20 transition-all active:scale-95 group border border-rose-400">
                <div className="mb-4 group-hover:scale-110 group-hover:-rotate-12 transition-transform drop-shadow-lg"><Icons.Ticket /></div>
                <span className="text-[11px] font-black uppercase tracking-[0.2em]">SUPPORT</span>
             </button>
          </div>

          <div className="glass-morphism p-10 rounded-[2.5rem] shadow-2xl vibrant-card">
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] mb-10">Force Performance</h3>
            <div className="space-y-10">
              {collectorBreakdown.map(([name, data]) => (
                <div key={name} className="space-y-4">
                  <div className="flex justify-between items-end">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-slate-900 dark:text-white tracking-tight uppercase">{name}</span>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 opacity-60">{data.role}</span>
                    </div>
                    <span className="text-sm font-black text-indigo-600 dark:text-indigo-400 neon-text-indigo">₹{data.amount.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-slate-200/50 dark:bg-white/5 rounded-full h-2.5 overflow-hidden border border-white/10">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 shadow-lg ${data.role === UserRole.ADMIN ? 'bg-gradient-to-r from-indigo-500 to-indigo-700 shadow-indigo-500/30' : 'bg-gradient-to-r from-teal-400 to-teal-600 shadow-teal-500/30'}`} 
                      style={{ width: `${stats.totalCollectionToday > 0 ? (data.amount / stats.totalCollectionToday) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
              ))}
              {collectorBreakdown.length === 0 && <p className="text-center py-10 text-slate-400 text-xs font-black uppercase tracking-[0.2em] italic opacity-50">Operational Silence</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {(showRevenueModal || showDuesModal || showUsersModal) && (
        <DashboardListModal 
          title={showRevenueModal ? "Audit: Daily Intake" : showDuesModal ? "Customer Dues" : "Audit: Fleet Base"} 
          subtitle={showRevenueModal ? `Liquidated Today: ₹${stats.totalCollectionToday}` : showDuesModal ? `Active Debt: ₹${stats.totalPendingDues}` : `Capacity: ${stats.activeCustomers} Units`} 
          onClose={() => { setShowRevenueModal(false); setShowDuesModal(false); setShowUsersModal(false); }}
        >
          <div className="space-y-4">
            {showRevenueModal && todayTransactions.map(t => (
              <div key={t.id} className="flex justify-between items-center p-6 glass-morphism rounded-3xl border border-indigo-500/10 hover:border-indigo-500/30 hover:scale-[1.01] transition-all group">
                <div>
                  <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{customers.find(c => c.id === t.customerId)?.name || 'Unknown'}</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2 group-hover:text-indigo-500 transition-colors">{t.collectorName} • {new Date(t.date).toLocaleTimeString()}</p>
                </div>
                <p className="text-xl font-black text-emerald-600 neon-text-teal">+ ₹{t.amountPaid}</p>
              </div>
            ))}

            {showDuesModal && topPending.map(c => (
              <div key={c.id} className="flex justify-between items-center p-6 glass-morphism rounded-3xl border border-amber-500/10 hover:border-amber-500/30 hover:scale-[1.01] transition-all group">
                <div>
                  <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{c.name}</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2 group-hover:text-amber-500 transition-colors">{c.phone} • Cycle: Day {c.dueDay}</p>
                </div>
                <p className="text-xl font-black text-rose-600 neon-text-rose">₹{c.totalDue}</p>
              </div>
            ))}

            {showUsersModal && customers.map(c => (
              <div key={c.id} className="flex justify-between items-center p-6 glass-morphism rounded-3xl border border-teal-500/10 hover:border-teal-500/30 hover:scale-[1.01] transition-all group">
                <div className="flex items-center gap-4">
                   <div className={`w-2.5 h-2.5 rounded-full ${c.status === CustomerStatus.ACTIVE ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : c.status === CustomerStatus.SUSPENDED ? 'bg-amber-500' : 'bg-slate-500'}`} />
                   <div>
                     <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{c.name}</p>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2 group-hover:text-teal-500 transition-colors">{c.status} • {c.phone}</p>
                   </div>
                </div>
                <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Plan: ₹{c.monthlyPlanAmount}</p>
              </div>
            ))}
          </div>
        </DashboardListModal>
      )}
    </div>
  );
};

const StatCard = ({ label, value, trend, icon, color, onClick }: any) => {
  const colors: any = { 
    indigo: "from-indigo-500 to-brand-700 shadow-indigo-500/40 border-indigo-400/30 text-indigo-600", 
    rose: "from-rose-500 to-rose-700 shadow-rose-500/40 border-rose-400/30 text-rose-600", 
    teal: "from-teal-500 to-teal-700 shadow-teal-500/40 border-teal-400/30 text-teal-600", 
    amber: "from-amber-500 to-amber-700 shadow-amber-500/40 border-amber-400/30 text-amber-600" 
  };
  
  return (
    <div onClick={onClick} className="glass-morphism p-8 rounded-[2.5rem] shadow-2xl transition-all duration-500 cursor-pointer group hover:-translate-y-2 hover:shadow-indigo-500/10 border-white/40 dark:border-white/5 active:scale-95 overflow-hidden relative">
      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${colors[color].split(' shadow')[0]} flex items-center justify-center mb-8 shadow-2xl text-white transition-all group-hover:scale-110 group-hover:rotate-6 z-10 relative`}>{icon}</div>
      <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-3 relative z-10">{label}</p>
      <div className="flex items-baseline gap-3 relative z-10">
        <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tightest uppercase italic leading-none">{value}</p>
        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md bg-slate-100 dark:bg-white/10 ${colors[color].split(' shadow')[2]}`}>{trend}</span>
      </div>
      <div className={`absolute -bottom-10 -right-10 w-32 h-32 bg-gradient-to-br ${colors[color].split(' shadow')[0]} opacity-5 blur-3xl group-hover:opacity-20 transition-opacity`}></div>
    </div>
  );
};

const DashboardListModal = ({ title, subtitle, onClose, children }: any) => (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-xl z-[100] flex items-center justify-center p-6 animate-in fade-in duration-500">
    <div className="glass-morphism dark:bg-black/90 rounded-[3rem] w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col shadow-[0_0_100px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-500 border-white/20 dark:border-white/10">
      <div className="p-10 border-b border-slate-200/20 dark:border-white/5 flex justify-between items-center bg-white/30 dark:bg-white/5">
        <div><h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">{title}</h3><p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-3">{subtitle}</p></div>
        <button onClick={onClose} className="w-12 h-12 flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded-2xl transition-all border border-transparent hover:border-slate-200 dark:hover:border-white/10">✕</button>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar p-10">{children}</div>
    </div>
  </div>
);

export default Dashboard;
