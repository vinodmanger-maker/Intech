
import React, { useState } from 'react';
import { Customer, User, SupportTicket, TicketStatus, TicketPriority } from '../types';
import { storage } from '../services/storage';

interface SupportTicketsProps {
  user: User;
  customers: Customer[];
  onRefresh: () => void;
}

const SupportTickets: React.FC<SupportTicketsProps> = ({ user, customers, onRefresh }) => {
  const [tickets, setTickets] = useState<SupportTicket[]>(storage.getTickets());
  const [showAddModal, setShowAddModal] = useState(false);
  const [filter, setFilter] = useState<'ALL' | TicketStatus>('ALL');
  const [isManualEntry, setIsManualEntry] = useState(false);

  const filteredTickets = tickets.filter(t => filter === 'ALL' || t.status === filter);

  const handleAddTicket = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const priority = formData.get('priority') as TicketPriority;
    const issue = formData.get('issue') as string;

    if (isManualEntry) {
      const manualName = formData.get('manualName') as string;
      const manualPhone = formData.get('manualPhone') as string;
      
      storage.addTicket({
        customerName: manualName,
        customerPhone: manualPhone,
        issue: issue,
        priority: priority,
      });
    } else {
      const customerId = formData.get('customerId') as string;
      const customer = customers.find(c => c.id === customerId);

      if (customer) {
        storage.addTicket({
          customerId: customer.id,
          customerName: customer.name,
          customerPhone: customer.phone,
          issue: issue,
          priority: priority,
        });
      }
    }

    setTickets(storage.getTickets());
    setShowAddModal(false);
    onRefresh();
  };

  const updateStatus = (id: string, status: TicketStatus) => {
    storage.updateTicketStatus(id, status, user);
    setTickets(storage.getTickets());
    onRefresh();
  };

  const getPriorityColor = (p: TicketPriority) => {
    switch (p) {
      case TicketPriority.HIGH: return 'text-red-600 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900/40';
      case TicketPriority.MEDIUM: return 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-900/40';
      case TicketPriority.LOW: return 'text-slate-600 bg-slate-50 dark:bg-slate-900/20 border-slate-200 dark:border-slate-800/40';
    }
  };

  const getStatusColor = (s: TicketStatus) => {
    switch (s) {
      case TicketStatus.OPEN: return 'bg-red-500';
      case TicketStatus.PENDING: return 'bg-amber-500';
      case TicketStatus.RESOLVED: return 'bg-emerald-500';
    }
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-16 font-bold">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight uppercase italic tracking-tighter">Helpdesk</h2>
          <p className="text-slate-500 dark:text-slate-400 font-bold">Manage and track mission critical support requests.</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold shadow-lg active:scale-95 border border-blue-500 uppercase tracking-widest text-xs">+ Log Complaint</button>
      </div>

      <div className="flex bg-white dark:bg-black/40 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200 dark:border-white/10 w-fit font-bold shadow-xl">
        {(['ALL', TicketStatus.OPEN, TicketStatus.PENDING, TicketStatus.RESOLVED] as const).map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${filter === s ? 'bg-slate-900 dark:bg-blue-600 text-white shadow-md font-bold' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white font-bold'}`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 font-bold">
        {filteredTickets.map(ticket => (
          <div key={ticket.id} className="bg-white dark:bg-[#09090b] rounded-3xl border border-slate-200 dark:border-white/10 p-7 shadow-sm flex flex-col hover:shadow-2xl transition-all font-bold group hover:border-blue-500/40">
            <div className="flex justify-between items-start mb-5">
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${getPriorityColor(ticket.priority)}`}>
                {ticket.priority} Priority
              </span>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${getStatusColor(ticket.status)} animate-pulse`}></div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{ticket.status}</span>
              </div>
            </div>
            
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-1 uppercase tracking-tighter">
              {ticket.customerName}
              {!ticket.customerId && <span className="ml-2 text-[10px] bg-slate-100 dark:bg-white/10 text-slate-500 px-2 py-0.5 rounded uppercase font-black">Guest</span>}
            </h3>
            {ticket.customerPhone && <p className="text-xs font-bold text-slate-400 mb-3">{ticket.customerPhone}</p>}
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 flex-1 italic font-bold leading-relaxed">"{ticket.issue}"</p>
            
            <div className="pt-5 border-t border-slate-50 dark:border-white/5 space-y-4 font-bold">
              <div className="space-y-1.5 font-bold">
                <div className="flex justify-between items-center text-[9px] font-black uppercase text-slate-400 tracking-widest">
                  <span>Logged At:</span>
                  <span className="text-slate-600 dark:text-slate-300">{formatDateTime(ticket.createdAt)}</span>
                </div>
                {ticket.status !== TicketStatus.OPEN && ticket.startedByName && (
                  <div className="flex justify-between items-center text-[9px] font-black uppercase text-amber-600 dark:text-amber-400 tracking-widest">
                    <span>Assigned Agent:</span>
                    <span>{ticket.startedByName}</span>
                  </div>
                )}
                {ticket.resolvedAt && (
                  <div className="flex justify-between items-center text-[9px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-widest">
                    <span>Resolved At:</span>
                    <span>{formatDateTime(ticket.resolvedAt)}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end font-bold">
                <div className="flex gap-2 font-bold">
                  {ticket.status !== TicketStatus.RESOLVED && (
                    <>
                      {ticket.status === TicketStatus.OPEN && (
                        <button onClick={() => updateStatus(ticket.id, TicketStatus.PENDING)} className="px-4 py-2 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase rounded-lg border border-amber-200 dark:border-amber-500/30 transition-colors hover:bg-amber-100 font-bold">Start Work</button>
                      )}
                      <button onClick={() => updateStatus(ticket.id, TicketStatus.RESOLVED)} className="px-4 py-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase rounded-lg border border-emerald-200 dark:border-emerald-500/30 transition-colors hover:bg-emerald-100 font-bold">Resolve</button>
                    </>
                  )}
                  {ticket.status === TicketStatus.RESOLVED && (
                    <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase flex items-center gap-1.5 py-2">✓ COMPLETED</span>
                  )}
                </div>
              </div>
              
              {ticket.status === TicketStatus.RESOLVED && ticket.resolvedByName && (
                <div className="flex items-center justify-between bg-slate-50 dark:bg-white/5 p-3 rounded-xl border border-slate-100 dark:border-white/10 font-bold">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">SOLVED BY:</span>
                  <span className="text-[11px] font-black text-slate-700 dark:text-slate-100 font-bold uppercase tracking-tighter">{ticket.resolvedByName}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-black rounded-[2.5rem] w-full max-w-lg p-9 shadow-2xl animate-in zoom-in-95 border border-slate-200 dark:border-white/10 font-bold">
            <h3 className="text-2xl font-black mb-7 text-slate-900 dark:text-white uppercase italic tracking-tighter font-bold">Issue Report</h3>
            
            <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-xl border border-slate-200 dark:border-white/10 mb-7 font-bold">
              <button 
                onClick={() => setIsManualEntry(false)}
                className={`flex-1 py-2.5 text-[10px] font-black uppercase rounded-lg transition-all ${!isManualEntry ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm font-bold' : 'text-slate-400 font-bold'}`}
              >
                Subscriber
              </button>
              <button 
                onClick={() => setIsManualEntry(true)}
                className={`flex-1 py-2.5 text-[10px] font-black uppercase rounded-lg transition-all ${isManualEntry ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm font-bold' : 'text-slate-400 font-bold'}`}
              >
                Guest Entry
              </button>
            </div>

            <form onSubmit={handleAddTicket} className="space-y-6 font-bold">
              {!isManualEntry ? (
                <div className="space-y-2 font-bold">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1 font-bold">Select Active Subscriber</label>
                  <select name="customerId" required className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-5 py-3.5 font-bold dark:text-white outline-none focus:border-blue-500 font-bold">
                    <option value="" className="font-bold">Choose from list...</option>
                    {customers.map(c => <option key={c.id} value={c.id} className="font-bold">{c.name} ({c.phone})</option>)}
                  </select>
                </div>
              ) : (
                <div className="space-y-5 font-bold">
                  <div className="space-y-2 font-bold">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1 font-bold">Client Name</label>
                    <input name="manualName" required placeholder="Full name" className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-5 py-3.5 font-bold dark:text-white outline-none focus:border-blue-500 font-bold" />
                  </div>
                  <div className="space-y-2 font-bold">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1 font-bold">Mobile Link</label>
                    <input name="manualPhone" required placeholder="Phone number" className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-5 py-3.5 font-bold dark:text-white outline-none focus:border-blue-500 font-bold" />
                  </div>
                </div>
              )}

              <div className="space-y-2 font-bold">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1 font-bold">Task Priority</label>
                <div className="grid grid-cols-3 gap-2.5 font-bold">
                  {[TicketPriority.LOW, TicketPriority.MEDIUM, TicketPriority.HIGH].map(p => (
                    <label key={p} className="relative font-bold">
                      <input type="radio" name="priority" value={p} defaultChecked={p === TicketPriority.MEDIUM} className="peer sr-only" />
                      <div className="flex items-center justify-center py-2.5 text-[10px] font-black uppercase rounded-xl border border-slate-200 dark:border-white/10 peer-checked:bg-blue-600 peer-checked:text-white peer-checked:border-blue-600 cursor-pointer transition-all font-bold">
                        {p}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-2 font-bold">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1 font-bold">Issue Intelligence</label>
                <textarea name="issue" required rows={4} placeholder="Describe technical issue..." className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-5 py-3.5 font-bold dark:text-white outline-none focus:border-blue-500 resize-none font-bold"></textarea>
              </div>
              <div className="flex gap-4 pt-5 font-bold">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-3.5 font-black text-[10px] uppercase text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">Discard</button>
                <button type="submit" className="flex-1 py-3.5 bg-blue-600 text-white rounded-2xl font-black shadow-lg shadow-blue-500/20 active:scale-95 border border-blue-500 uppercase tracking-widest text-[10px] font-bold">CREATE TICKET</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportTickets;
