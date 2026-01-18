
import React, { useState } from 'react';
import { Customer, User, UserRole, PaymentType, Transaction } from '../types';
import InvoiceDocument from './InvoiceDocument';

interface PaymentModuleProps {
  user: User;
  customers: Customer[];
  onRecordPayment: (customerId: string, amount: number, notes: string) => Transaction | null;
}

const Icons = {
  Cash: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 18V6"/></svg>
  ),
  User: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
  )
};

const PaymentModule: React.FC<PaymentModuleProps> = ({ user, customers, onRecordPayment }) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [lastTransaction, setLastTransaction] = useState<Transaction | null>(null);

  const selectableCustomers = user.role === UserRole.STAFF ? customers.filter(c => c.totalDue > 0) : customers;
  const selectedCustomer = selectableCustomers.find(c => c.id === selectedCustomerId);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || !amount) return;

    const transaction = onRecordPayment(selectedCustomerId, Number(amount), notes);
    setLastTransaction(transaction);
    setSelectedCustomerId('');
    setAmount('');
    setNotes('');
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 dark:bg-black min-h-full -m-6 md:-m-10 lg:-m-12 p-6 md:p-10 lg:p-12">
      <div className="max-w-3xl mx-auto space-y-10">
        {!lastTransaction ? (
          <div className="bg-white dark:bg-[#0a0a0a] rounded-[3rem] border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden print:hidden transition-all hover:border-indigo-500/30">
            <div className="p-10 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/30 dark:bg-white/5">
              <div className="space-y-1">
                <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Collect Payment</h2>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Operator: {user.name}</p>
                </div>
              </div>
              <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-[0_0_20px_rgba(79,70,229,0.4)] border border-indigo-500">
                <Icons.Cash />
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-10 space-y-10">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2 flex items-center gap-2">
                  <Icons.User /> Subscriber Account
                </label>
                <div className="relative group">
                  <select 
                    required 
                    className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-white/10 rounded-2xl px-6 py-5 font-black text-lg text-slate-900 dark:text-white outline-none cursor-pointer focus:border-indigo-500 transition-all appearance-none shadow-inner group-hover:border-white/20" 
                    value={selectedCustomerId} 
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                  >
                    <option value="" className="font-bold">{selectableCustomers.length === 0 ? 'No subscribers found' : 'Select Account...'}</option>
                    {selectableCustomers.map(c => (
                      <option key={c.id} value={c.id} className="font-bold bg-black text-white">
                        {c.name} (Due: ₹{c.totalDue})
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                    ▼
                  </div>
                </div>
              </div>

              {selectedCustomer && (
                <div className="bg-slate-900 dark:bg-black p-8 rounded-[2rem] text-white shadow-2xl space-y-8 border border-slate-800 dark:border-indigo-500/20 animate-in zoom-in-95 font-bold relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-indigo-500/10 transition-colors"></div>
                  <div className="flex justify-between items-end relative z-10">
                    <div>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] mb-2">Liquid Balance</p>
                      <span className="text-5xl font-black tracking-tighter italic">₹{selectedCustomer.totalDue.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex flex-col gap-3">
                      <button 
                        type="button" 
                        onClick={() => setAmount(selectedCustomer.totalDue.toString())} 
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-600/30 transition-all border border-indigo-400 active:scale-95"
                      >
                        Settle Full
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setAmount((selectedCustomer.totalDue / 2).toString())} 
                        className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest border border-white/10 transition-all active:scale-95"
                      >
                        Settle Half
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2 font-bold">Yield Settlement (₹)</label>
                <div className="relative group">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-4xl font-black text-slate-300 dark:text-slate-800 transition-colors group-focus-within:text-indigo-500">₹</span>
                  <input 
                    required 
                    type="number" 
                    placeholder="0.00" 
                    className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-white/10 rounded-2xl pl-16 pr-8 py-6 text-5xl font-black text-slate-900 dark:text-indigo-500 outline-none focus:border-indigo-500 transition-all shadow-inner placeholder:text-slate-200 dark:placeholder:text-slate-900" 
                    value={amount} 
                    onChange={(e) => setAmount(e.target.value)} 
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2 font-bold">Transaction Reference</label>
                <input 
                  type="text" 
                  placeholder="e.g. UPI ID / Cash Receipt No." 
                  className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-white/10 rounded-2xl px-6 py-4 font-bold text-sm dark:text-white outline-none focus:border-indigo-500 transition-all shadow-inner" 
                  value={notes} 
                  onChange={(e) => setNotes(e.target.value)} 
                />
              </div>

              <button 
                type="submit" 
                disabled={!selectedCustomerId || !amount} 
                className={`w-full py-6 rounded-3xl text-xs font-black uppercase tracking-[0.3em] transition-all shadow-2xl active:scale-95 ${!selectedCustomerId || !amount ? 'bg-slate-100 dark:bg-white/5 text-slate-400 cursor-not-allowed border border-slate-200 dark:border-white/5' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-500/40 border border-indigo-500 neon-text-indigo'}`}
              >
                AUTHORIZE SETTLEMENT
              </button>
            </form>
          </div>
        ) : (
          <div className="animate-in zoom-in-95 duration-700">
            <InvoiceDocument 
              transaction={lastTransaction} 
              customer={customers.find(c => c.id === lastTransaction.customerId)!} 
              onClose={() => setLastTransaction(null)}
            />
          </div>
        )}
      </div>
      
      {/* Visual background element */}
      <div className="fixed bottom-0 right-0 w-96 h-96 bg-indigo-600/5 blur-[120px] rounded-full -mb-48 -mr-48 pointer-events-none"></div>
    </div>
  );
};

export default PaymentModule;
