import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Customer, Transaction, User, UserRole, CustomerStatus, PaymentType } from '../types';
import { storage } from '../services/storage';
import InvoiceDocument from './InvoiceDocument';

interface CustomerManagementProps {
  user: User;
  customers: Customer[];
  transactions: Transaction[];
  onAddCustomer: (customer: Omit<Customer, 'id' | 'totalDue' | 'lastBilledDate' | 'status'>) => void;
  onRecordPayment: (customerId: string, amount: number, notes: string) => Transaction | null;
  onRefresh: () => void;
}

const Icons = {
  Camera: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
  ),
  Upload: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
  ),
  Edit: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
  ),
  Repeat: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/></svg>
  ),
  Search: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
  ),
  Filter: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
  ),
  Receipt: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1Z"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 17.5V6.5"/></svg>
  ),
  Payment: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
  )
};

const CustomerManagement: React.FC<CustomerManagementProps> = ({ user, customers, transactions, onAddCustomer, onRecordPayment, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | CustomerStatus>('ALL');
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  // Quick Pay State
  const [showQuickPay, setShowQuickPay] = useState(false);
  const [quickPayAmount, setQuickPayAmount] = useState('');
  const [quickPayNotes, setQuickPayNotes] = useState('');

  // Ledger Filter States
  const [ledgerSearchTerm, setLedgerSearchTerm] = useState('');
  const [ledgerDateStart, setLedgerDateStart] = useState('');
  const [ledgerDateEnd, setLedgerDateEnd] = useState('');
  const [ledgerTypeFilter, setLedgerTypeFilter] = useState<'ALL' | PaymentType>('ALL');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const baseCustomers = user.role === UserRole.STAFF 
    ? customers.filter(c => c.totalDue > 0)
    : customers;

  const filteredCustomers = baseCustomers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.phone.includes(searchTerm);
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = (id: string, newStatus: CustomerStatus) => {
    storage.updateCustomerStatus(id, newStatus);
    onRefresh();
    if (selectedCustomer?.id === id) {
      setSelectedCustomer(prev => prev ? { ...prev, status: newStatus } : null);
    }
  };

  const startCamera = async () => {
    setIsCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setIsCameraActive(false);
      alert("Could not access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setPreviewPhoto(dataUrl);
        stopCamera();
      }
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const customerData = {
      name: formData.get('name') as string,
      phone: formData.get('phone') as string,
      address: formData.get('address') as string,
      monthlyPlanAmount: Number(formData.get('plan')),
      dueDay: Number(formData.get('dueDay')),
      photo: previewPhoto || undefined,
    };

    if (editingCustomer) {
      storage.updateCustomer(editingCustomer.id, customerData);
      onRefresh();
      if (selectedCustomer?.id === editingCustomer.id) {
        setSelectedCustomer({ ...selectedCustomer, ...customerData });
      }
    } else {
      onAddCustomer(customerData);
    }

    setShowFormModal(false);
    setEditingCustomer(null);
    setPreviewPhoto(null);
    stopCamera();
  };

  const handleQuickPaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !quickPayAmount) return;

    const transaction = onRecordPayment(selectedCustomer.id, Number(quickPayAmount), quickPayNotes);
    if (transaction) {
      setSelectedTransaction(transaction);
      setShowQuickPay(false);
      setQuickPayAmount('');
      setQuickPayNotes('');
      // Update local selected customer to reflect new balance immediately
      const updatedCustomer = storage.getCustomers().find(c => c.id === selectedCustomer.id);
      if (updatedCustomer) setSelectedCustomer(updatedCustomer);
    }
  };

  const openEditModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setPreviewPhoto(customer.photo || null);
    setShowFormModal(true);
  };

  const getStatusColor = (status: CustomerStatus) => {
    switch (status) {
      case CustomerStatus.ACTIVE: return 'bg-emerald-500';
      case CustomerStatus.SUSPENDED: return 'bg-amber-500';
      case CustomerStatus.INACTIVE: return 'bg-slate-500';
    }
  };

  const sendReminder = (customer: Customer) => {
    const text = `*Intech Broadband Payment Reminder*\n\nDear ${customer.name},\nThis is a friendly reminder that your monthly broadband dues of *₹${customer.totalDue}* are pending. Please settle your bill to avoid service interruption.\n\nThank you,\nTeam Intech Broadband`;
    const whatsappUrl = `https://wa.me/${customer.phone}?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  };

  // Memoized Ledger Filtering
  const ledgerTransactions = useMemo(() => {
    if (!selectedCustomer) return [];
    return transactions
      .filter(t => t.customerId === selectedCustomer.id)
      .filter(t => {
        const matchesSearch = 
          t.notes?.toLowerCase().includes(ledgerSearchTerm.toLowerCase()) || 
          t.collectorName.toLowerCase().includes(ledgerSearchTerm.toLowerCase()) ||
          t.amountPaid.toString().includes(ledgerSearchTerm);
        
        const txDateStr = t.date.split('T')[0];
        const matchesDateStart = !ledgerDateStart || txDateStr >= ledgerDateStart;
        const matchesDateEnd = !ledgerDateEnd || txDateStr <= ledgerDateEnd;
        const matchesType = ledgerTypeFilter === 'ALL' || t.paymentType === ledgerTypeFilter;

        return matchesSearch && matchesDateStart && matchesDateEnd && matchesType;
      });
  }, [transactions, selectedCustomer, ledgerSearchTerm, ledgerDateStart, ledgerDateEnd, ledgerTypeFilter]);

  const resetLedgerFilters = () => {
    setLedgerSearchTerm('');
    setLedgerDateStart('');
    setLedgerDateEnd('');
    setLedgerTypeFilter('ALL');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 min-h-full dark:bg-black dark:text-white -m-6 md:-m-10 lg:-m-12 p-6 md:p-10 lg:p-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">Hello {user.name}</h2>
          <p className="text-slate-500 dark:text-slate-400 font-bold tracking-tight">Manage subscriber accounts and field operations.</p>
        </div>
        {user.role === UserRole.ADMIN && (
          <button onClick={() => { setPreviewPhoto(null); setEditingCustomer(null); setShowFormModal(true); }} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-black shadow-xl active:scale-95 border border-indigo-500 uppercase tracking-widest text-xs transition-all">+ ADD ACCOUNT</button>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
          <input type="text" placeholder="Search by name or phone..." className="w-full bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-white/10 rounded-2xl px-12 py-5 focus:ring-4 focus:ring-indigo-500/10 outline-none font-bold dark:text-white transition-all group-hover:border-indigo-500/50" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          <span className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40">🔍</span>
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-white/10 rounded-2xl px-6 py-5 font-bold text-slate-700 dark:text-slate-300 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all">
          <option value="ALL">All Accounts</option>
          <option value={CustomerStatus.ACTIVE}>Active Only</option>
          <option value={CustomerStatus.SUSPENDED}>Suspended Only</option>
          <option value={CustomerStatus.INACTIVE}>Inactive Only</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredCustomers.map(customer => (
          <div key={customer.id} className="bg-white dark:bg-[#0a0a0a] rounded-[2.5rem] border border-slate-200 dark:border-white/10 p-8 shadow-sm hover:shadow-[0_0_30px_rgba(99,102,241,0.15)] transition-all flex flex-col group hover:border-indigo-500/50">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                <div 
                  onClick={() => setSelectedCustomer(customer)} 
                  className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-black flex items-center justify-center font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10 cursor-pointer overflow-hidden shadow-lg transition-transform group-hover:scale-105"
                >
                  {customer.photo ? (
                    <img src={customer.photo} alt={customer.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-black">{customer.name.charAt(0)}</span>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 dark:bg-white/5 rounded-full border border-slate-200 dark:border-white/10 w-fit">
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(customer.status)} shadow-[0_0_8px] shadow-current`}></div>
                    <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-300 tracking-widest">{customer.status}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                 <div className={`text-xs px-3.5 py-1.5 rounded-xl font-black uppercase tracking-widest shadow-sm ${customer.totalDue > 0 ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-800 dark:text-rose-400 border border-rose-100 dark:border-rose-500/20' : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20'}`}>₹{customer.totalDue} DUE</div>
                 {user.role === UserRole.ADMIN && (
                    <button onClick={() => openEditModal(customer)} className="p-2.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors bg-slate-50 dark:bg-white/5 rounded-xl border border-transparent dark:border-white/5" title="Edit Customer">
                       <Icons.Edit />
                    </button>
                 )}
              </div>
            </div>
            
            <h3 onClick={() => setSelectedCustomer(customer)} className="font-black text-slate-900 dark:text-white text-xl leading-tight mb-2 truncate cursor-pointer tracking-tight">{customer.name}</h3>
            <div className="flex items-center gap-2 mb-6">
               <p className="text-sm text-slate-500 dark:text-slate-400 font-bold">{customer.phone}</p>
            </div>
            
            <div className="flex gap-2 mb-8">
               {customer.totalDue > 0 && (
                 <button onClick={() => sendReminder(customer)} className="w-full py-3 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-100 dark:border-emerald-800/50 text-xs font-black flex items-center justify-center gap-3 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-all active:scale-95 shadow-sm" title="Send WhatsApp Reminder">
                   <span className="uppercase tracking-widest">Payment Reminder</span>
                 </button>
               )}
            </div>

            <div className="mt-auto flex items-center justify-between pt-6 border-t border-slate-100 dark:border-white/5">
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Yield Target</span>
                <span className="text-xs font-black dark:text-white">₹{customer.monthlyPlanAmount} / mo</span>
              </div>
              <button onClick={() => { setSelectedCustomer(customer); resetLedgerFilters(); }} className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em] hover:text-indigo-500 transition-colors">Audit Ledger →</button>
            </div>
          </div>
        ))}
      </div>

      {/* Ledger Modal */}
      {selectedCustomer && !selectedTransaction && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-2xl z-[100] flex items-center justify-center p-4 animate-in fade-in duration-500">
          <div className="bg-white dark:bg-[#050505] rounded-[3rem] w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-[0_0_100px_rgba(0,0,0,0.8)] border border-slate-200 dark:border-white/10 animate-in zoom-in-95">
            {/* Header */}
            <div className="p-10 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50/50 dark:bg-white/5">
              <div className="flex items-center gap-8">
                <div className="relative">
                  <div className="w-24 h-24 rounded-3xl bg-slate-200 dark:bg-black border-4 border-white dark:border-white/5 overflow-hidden shadow-2xl">
                    {selectedCustomer.photo ? (
                      <img src={selectedCustomer.photo} alt={selectedCustomer.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl font-black text-slate-400">{selectedCustomer.name.charAt(0)}</div>
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-4">
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">{selectedCustomer.name}</h3>
                    {user.role === UserRole.ADMIN && (
                      <button onClick={() => openEditModal(selectedCustomer)} className="p-2.5 text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl border border-indigo-100 dark:border-indigo-500/20 hover:scale-110 transition-all">
                        <Icons.Edit />
                      </button>
                    )}
                  </div>
                  <p className="text-sm font-bold text-slate-500 dark:text-slate-400 tracking-tight">{selectedCustomer.phone} • {selectedCustomer.address}</p>
                </div>
              </div>
              <button onClick={() => { setSelectedCustomer(null); setShowQuickPay(false); }} className="w-12 h-12 flex items-center justify-center bg-slate-100 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
               {/* Quick Summary Bar */}
               <div className="flex flex-wrap items-center justify-between gap-8 bg-slate-50 dark:bg-white/5 p-8 rounded-[2rem] border border-slate-200 dark:border-white/10 shadow-inner">
                  <div className="flex flex-wrap items-center gap-6">
                    {user.role === UserRole.ADMIN && (
                      <div className="flex flex-col gap-2">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] px-1">Control Status</p>
                        <div className="flex bg-slate-200/50 dark:bg-black p-1 rounded-2xl border border-slate-200 dark:border-white/10">
                          {[CustomerStatus.ACTIVE, CustomerStatus.SUSPENDED, CustomerStatus.INACTIVE].map(s => (
                            <button key={s} onClick={() => handleStatusChange(selectedCustomer.id, s)} className={`px-4 py-2 text-[10px] font-black uppercase rounded-xl transition-all ${selectedCustomer.status === s ? 'bg-white dark:bg-indigo-600 shadow-xl text-slate-900 dark:text-white font-bold' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-bold'}`}>{s}</button>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex flex-col gap-2">
                       <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] px-1">Billing Cycle</p>
                       <span className="px-5 py-2.5 bg-white dark:bg-black rounded-2xl border border-slate-200 dark:border-white/10 text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest shadow-sm">Day {selectedCustomer.dueDay}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-8 items-center">
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-1">Package Rate</p>
                      <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">₹{selectedCustomer.monthlyPlanAmount}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 ${selectedCustomer.totalDue > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>Accounts Receivable</p>
                      <p className={`text-3xl font-black tracking-tighter ${selectedCustomer.totalDue > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>₹{selectedCustomer.totalDue}</p>
                    </div>
                    {selectedCustomer.totalDue > 0 && (
                      <button 
                        onClick={() => {
                          setShowQuickPay(!showQuickPay);
                          setQuickPayAmount(selectedCustomer.totalDue.toString());
                        }} 
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-black shadow-2xl shadow-indigo-500/40 flex items-center gap-3 active:scale-95 transition-all text-xs uppercase tracking-widest border border-indigo-500"
                      >
                        <Icons.Payment /> Liquidate Dues
                      </button>
                    )}
                  </div>
               </div>

               {/* Quick Pay Form (In-ledger) */}
               {showQuickPay && (
                 <div className="bg-indigo-500/5 p-8 rounded-[2.5rem] border border-indigo-500/20 animate-in slide-in-from-top-4 duration-500 shadow-inner">
                   <div className="flex justify-between items-center mb-8">
                      <h4 className="text-sm font-black text-indigo-400 uppercase tracking-[0.2em] italic">Immediate Settlement Authorization</h4>
                      <button onClick={() => setShowQuickPay(false)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white bg-white/5 rounded-full">✕</button>
                   </div>
                   <form onSubmit={handleQuickPaySubmit} className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Collection Amount (₹)</label>
                        <input 
                          type="number" 
                          required
                          value={quickPayAmount}
                          onChange={(e) => setQuickPayAmount(e.target.value)}
                          placeholder="0.00" 
                          className="w-full bg-white dark:bg-black border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-4 font-black text-2xl text-indigo-500 outline-none focus:border-indigo-500 shadow-sm" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Transaction Note</label>
                        <input 
                          type="text" 
                          value={quickPayNotes}
                          onChange={(e) => setQuickPayNotes(e.target.value)}
                          placeholder="e.g. Cash / UPI Ref ID" 
                          className="w-full bg-white dark:bg-black border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-4 font-bold text-sm dark:text-white outline-none focus:border-indigo-500 shadow-sm" 
                        />
                      </div>
                      <div className="flex items-end">
                        <button type="submit" className="w-full bg-indigo-600 text-white py-4.5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl shadow-indigo-600/30 active:scale-95 transition-all border border-indigo-500">
                          Finalize Transaction
                        </button>
                      </div>
                   </form>
                 </div>
               )}
               
               {/* Ledger Controls */}
               <div className="space-y-6">
                 <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <h4 className="font-black text-slate-800 dark:text-slate-200 text-xs uppercase tracking-[0.3em] flex items-center gap-3">
                       <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                       Financial History Log
                    </h4>
                    <button onClick={resetLedgerFilters} className="text-[10px] font-black text-slate-400 hover:text-indigo-400 uppercase tracking-widest transition-colors">Reset Audit Filters</button>
                 </div>

                 {/* Filters Grid */}
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 bg-slate-50 dark:bg-white/5 p-6 rounded-[2rem] border border-slate-200 dark:border-white/10">
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1 flex items-center gap-2"><Icons.Search /> Query Filter</label>
                       <input 
                          type="text" 
                          placeholder="Agent / ID / Note" 
                          className="w-full bg-white dark:bg-black border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs font-bold dark:text-white outline-none focus:border-indigo-500 transition-all"
                          value={ledgerSearchTerm}
                          onChange={(e) => setLedgerSearchTerm(e.target.value)}
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1 flex items-center gap-2"><Icons.Filter /> Payment Class</label>
                       <select 
                          className="w-full bg-white dark:bg-black border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs font-bold dark:text-white outline-none focus:border-indigo-500 transition-all"
                          value={ledgerTypeFilter}
                          onChange={(e) => setLedgerTypeFilter(e.target.value as any)}
                       >
                          <option value="ALL">All Categories</option>
                          <option value={PaymentType.FULL}>Full Settlement</option>
                          <option value={PaymentType.PART}>Part Payment</option>
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Temporal Start</label>
                       <input 
                          type="date" 
                          className="w-full bg-white dark:bg-black border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs font-bold dark:text-white outline-none focus:border-indigo-500"
                          value={ledgerDateStart}
                          onChange={(e) => setLedgerDateStart(e.target.value)}
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Temporal End</label>
                       <input 
                          type="date" 
                          className="w-full bg-white dark:bg-black border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs font-bold dark:text-white outline-none focus:border-indigo-500"
                          value={ledgerDateEnd}
                          onChange={(e) => setLedgerDateEnd(e.target.value)}
                       />
                    </div>
                 </div>

                 <div className="border border-slate-200 dark:border-white/10 rounded-[2rem] overflow-hidden shadow-2xl bg-white dark:bg-black">
                   <div className="overflow-x-auto">
                     <table className="w-full text-left">
                       <thead>
                         <tr className="bg-slate-50 dark:bg-white/5 text-[10px] font-black uppercase text-slate-500 border-b border-slate-200 dark:border-white/10">
                           <th className="px-8 py-5">Timestamp</th>
                           <th className="px-8 py-5">Classification</th>
                           <th className="px-8 py-5 text-right">Yield Settled</th>
                           <th className="px-8 py-5 text-right">Post-Audit Balance</th>
                           <th className="px-8 py-5">Authorized Field Agent</th>
                           <th className="px-8 py-5 text-center">Protocol</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                         {ledgerTransactions.map(t => (
                           <tr key={t.id} className="text-sm font-bold hover:bg-slate-50 dark:hover:bg-indigo-500/5 transition-colors">
                             <td className="px-8 py-6">
                                <p className="text-slate-900 dark:text-slate-100">{new Date(t.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                                <p className="text-[10px] text-slate-400 font-black uppercase mt-1 tracking-widest">{new Date(t.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                             </td>
                             <td className="px-8 py-6">
                                <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-lg border ${t.paymentType === PaymentType.FULL ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20' : 'text-blue-600 bg-blue-50 dark:bg-blue-500/10 border-blue-100 dark:border-blue-500/20'}`}>
                                   {t.paymentType}
                                </span>
                                {t.notes && <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 font-bold italic truncate max-w-[150px]">{t.notes}</p>}
                             </td>
                             <td className="px-8 py-6 text-right">
                                <span className="text-emerald-600 dark:text-emerald-400 font-black tracking-tight">₹{t.amountPaid.toLocaleString()}</span>
                             </td>
                             <td className="px-8 py-6 text-right">
                                <span className="text-slate-900 dark:text-white font-black tracking-tight">₹{t.remainingDueAfter.toLocaleString()}</span>
                             </td>
                             <td className="px-8 py-6">
                                <div className="flex items-center gap-3">
                                   <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/10 border border-transparent dark:border-white/10 flex items-center justify-center text-[11px] font-black text-slate-500 dark:text-slate-300">{t.collectorName.charAt(0)}</div>
                                   <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">{t.collectorName}</span>
                                </div>
                             </td>
                             <td className="px-8 py-6 text-center">
                                <div className="flex items-center justify-center gap-3">
                                  <button 
                                    onClick={() => {
                                      setShowQuickPay(true);
                                      setQuickPayAmount(t.amountPaid.toString());
                                      if (t.notes) setQuickPayNotes(t.notes);
                                    }}
                                    className="p-3 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 rounded-xl hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-all active:scale-90 border border-transparent dark:border-amber-500/20"
                                    title="Re-process Transaction"
                                  >
                                    <Icons.Repeat />
                                  </button>
                                  <button 
                                    onClick={() => setSelectedTransaction(t)}
                                    className="p-3 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-all border border-transparent dark:border-indigo-500/20"
                                    title="Generate Receipt"
                                  >
                                    <Icons.Receipt />
                                  </button>
                                </div>
                             </td>
                           </tr>
                         ))}
                         {ledgerTransactions.length === 0 && (
                           <tr>
                              <td colSpan={6} className="py-24 text-center">
                                 <div className="w-16 h-16 bg-slate-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed dark:border-white/10">
                                   <Icons.Search />
                                 </div>
                                 <p className="text-slate-400 dark:text-slate-600 text-[10px] font-black uppercase tracking-[0.3em] italic">Operational Ledger is Clear</p>
                              </td>
                           </tr>
                         )}
                       </tbody>
                     </table>
                   </div>
                 </div>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Re-issued Invoice Receipt Modal */}
      {selectedTransaction && selectedCustomer && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-3xl z-[120] flex items-center justify-center p-4 animate-in fade-in duration-700">
           <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto custom-scrollbar shadow-[0_0_150px_rgba(99,102,241,0.2)]">
              <InvoiceDocument 
                transaction={selectedTransaction} 
                customer={selectedCustomer} 
                onClose={() => setSelectedTransaction(null)}
              />
           </div>
        </div>
      )}

      {showFormModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-2xl z-[110] flex items-center justify-center p-4 animate-in fade-in duration-500">
          <div className="bg-white dark:bg-[#050505] rounded-[3rem] w-full max-w-xl p-10 shadow-[0_0_80px_rgba(0,0,0,1)] animate-in zoom-in-95 border border-slate-200 dark:border-white/10 overflow-y-auto max-h-[95vh] custom-scrollbar">
            <h3 className="text-3xl font-black mb-8 text-slate-900 dark:text-white uppercase italic tracking-tighter">
              {editingCustomer ? 'Update Profile' : 'Subscriber Enlistment'}
            </h3>
            
            <div className="space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Biometric Verification</label>
                <div className="grid grid-cols-1 gap-4">
                  {!isCameraActive && !previewPhoto && (
                    <div className="flex gap-4">
                       <button onClick={startCamera} className="flex-1 flex flex-col items-center justify-center gap-3 p-10 bg-slate-50 dark:bg-black border-2 border-dashed border-slate-200 dark:border-white/10 rounded-3xl hover:border-indigo-500 dark:hover:border-indigo-500/50 transition-all group shadow-inner">
                          <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform"><Icons.Camera /></div>
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 group-hover:text-indigo-500 transition-colors">Digital Lens</span>
                       </button>
                       <button onClick={() => fileInputRef.current?.click()} className="flex-1 flex flex-col items-center justify-center gap-3 p-10 bg-slate-50 dark:bg-black border-2 border-dashed border-slate-200 dark:border-white/10 rounded-3xl hover:border-indigo-500 dark:hover:border-indigo-500/50 transition-all group shadow-inner">
                          <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform"><Icons.Upload /></div>
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 group-hover:text-indigo-500 transition-colors">Static Asset</span>
                       </button>
                    </div>
                  )}

                  {isCameraActive && (
                    <div className="relative rounded-[2.5rem] overflow-hidden bg-black aspect-video border-2 border-indigo-500 shadow-[0_0_30px_rgba(99,102,241,0.3)]">
                      <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                      <div className="absolute bottom-6 inset-x-0 flex justify-center gap-4">
                        <button onClick={capturePhoto} className="w-16 h-16 bg-white rounded-full border-4 border-slate-300 flex items-center justify-center shadow-2xl active:scale-90 transition-all">
                          <div className="w-12 h-12 bg-indigo-600 rounded-full" />
                        </button>
                        <button onClick={stopCamera} className="bg-black/50 backdrop-blur-md text-white px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-white/20">Cancel</button>
                      </div>
                    </div>
                  )}

                  {previewPhoto && (
                    <div className="relative rounded-[2.5rem] overflow-hidden border-2 border-indigo-500 aspect-video group shadow-2xl">
                      <img src={previewPhoto} className="w-full h-full object-cover" alt="Preview" />
                      <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center gap-4 backdrop-blur-sm">
                         <button onClick={() => { setPreviewPhoto(null); startCamera(); }} className="px-8 py-3 bg-white text-indigo-900 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl">Re-Verify</button>
                         <button onClick={() => setPreviewPhoto(null)} className="px-8 py-3 bg-rose-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl">Discard Asset</button>
                      </div>
                    </div>
                  )}
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                  <canvas ref={canvasRef} className="hidden" />
                </div>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Full Identity Name</label>
                  <input name="name" required defaultValue={editingCustomer?.name || ''} placeholder="Input Full Name" className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-4 font-black dark:text-white focus:border-indigo-500 transition-all outline-none shadow-sm" />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Secure Contact</label>
                    <input name="phone" required defaultValue={editingCustomer?.phone || ''} placeholder="10 Digit Number" className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-4 font-black dark:text-white focus:border-indigo-500 transition-all outline-none shadow-sm" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Fiscal Cycle Day</label>
                    <input name="dueDay" type="number" min="1" max="31" required defaultValue={editingCustomer?.dueDay || ''} placeholder="1-31" className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-4 font-black dark:text-white focus:border-indigo-500 transition-all outline-none shadow-sm" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Installation Grid Address</label>
                  <input name="address" required defaultValue={editingCustomer?.address || ''} placeholder="Location Details" className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-4 font-black dark:text-white focus:border-indigo-500 transition-all outline-none shadow-sm" />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Subscription Yield (₹)</label>
                  <input name="plan" type="number" required defaultValue={editingCustomer?.monthlyPlanAmount || ''} placeholder="Monthly Rate" className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-4 font-black text-2xl text-indigo-500 outline-none focus:border-indigo-500 shadow-sm" />
                </div>
                
                <div className="flex gap-4 pt-8">
                  <button type="button" onClick={() => { setShowFormModal(false); setEditingCustomer(null); setPreviewPhoto(null); stopCamera(); }} className="flex-1 py-4 font-black text-[10px] uppercase text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all tracking-widest">Discard</button>
                  <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-2xl shadow-indigo-600/30 active:scale-95 border border-indigo-500 uppercase tracking-[0.2em] text-[10px]">
                    {editingCustomer ? 'COMMIT CHANGES' : 'AUTHORIZE REGISTRATION'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerManagement;