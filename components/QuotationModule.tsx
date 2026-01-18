import React, { useState, useRef, useEffect } from 'react';
import { Quotation, QuotationItem, User, UserRole } from '../types';
import { storage } from '../services/storage';
import html2pdf from 'html2pdf.js';

interface QuotationModuleProps {
  user: User;
}

type QuotationView = 'list' | 'create' | 'preview';

const QuotationModule: React.FC<QuotationModuleProps> = ({ user }) => {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [view, setView] = useState<QuotationView>('list');
  const [activeQuotation, setActiveQuotation] = useState<Quotation | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const quotationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuotations(storage.getQuotations());
  }, []);

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [items, setItems] = useState<Omit<QuotationItem, 'id'>[]>([
    { description: 'Fiber Monthly Subscription', details: 'High Speed 50Mbps Symmetric bandwidth', quantity: 1, unitPrice: 500 }
  ]);
  const [notes, setNotes] = useState('Standard installation charges apply. Connectivity subject to technical feasibility.');

  const addItem = () => setItems([...items, { description: '', details: '', quantity: 1, unitPrice: 0 }]);
  const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));
  const updateItem = (index: number, field: keyof Omit<QuotationItem, 'id'>, value: string | number) => {
    const newItems = [...items];
    (newItems[index] as any)[field] = value;
    setItems(newItems);
  };

  const calculateTotal = () => items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);

  const handleSave = () => {
    const newQuotation: Quotation = {
      id: Math.random().toString(36).substr(2, 9),
      customerName,
      customerPhone,
      customerAddress,
      items: items.map(item => ({ ...item, id: Math.random().toString(36).substr(2, 5) })),
      date: new Date().toISOString(),
      expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      notes,
      total: calculateTotal(),
      createdBy: user.name
    };

    storage.addQuotation(newQuotation);
    setQuotations(storage.getQuotations());
    setActiveQuotation(newQuotation);
    setView('preview');
    resetForm();
  };

  const resetForm = () => {
    setCustomerName('');
    setCustomerPhone('');
    setCustomerAddress('');
    setItems([{ description: 'Fiber Monthly Subscription', details: 'High Speed 50Mbps Symmetric bandwidth', quantity: 1, unitPrice: 500 }]);
    setNotes('Standard installation charges apply. Connectivity subject to technical feasibility.');
  };

  const deleteQuotation = (id: string) => {
    storage.deleteQuotation(id);
    setQuotations(storage.getQuotations());
  };

  const handlePrint = () => window.print();

  const handleDownloadPDF = async () => {
    if (!quotationRef.current || !activeQuotation) return;
    
    setIsGenerating(true);
    
    const element = quotationRef.current;
    const opt = {
      margin: 10,
      filename: `Quotation_${activeQuotation.id.toUpperCase()}_${activeQuotation.customerName.replace(/\s+/g, '_')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    try {
      await html2pdf().from(element).set(opt).save();
    } catch (error) {
      console.error('PDF Generation failed:', error);
      alert('Failed to generate PDF. Please try using the Print option.');
    } finally {
      setIsGenerating(false);
    }
  };

  const goBackToList = () => {
    setActiveQuotation(null);
    setView('list');
    setQuotations(storage.getQuotations());
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 font-bold">
      {view === 'list' && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 print:hidden font-bold">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Sales Quotations</h2>
            <p className="text-slate-500 font-bold">Create and manage professional estimates for potential clients.</p>
          </div>
          <button 
            onClick={() => { resetForm(); setView('create'); }} 
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-bold shadow-lg active:scale-95 border border-indigo-500 uppercase tracking-widest text-xs"
          >
            + NEW QUOTATION
          </button>
        </div>
      )}

      {view === 'list' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 print:hidden font-bold">
          {quotations.map(q => (
            <div key={q.id} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg transition-all group font-bold">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center font-bold">Q</div>
                <button onClick={() => deleteQuotation(q.id)} className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 font-bold">✕</button>
              </div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-lg leading-tight mb-1 truncate">{q.customerName}</h3>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">₹{q.total.toLocaleString()} Total</p>
              <div className="flex items-center justify-between pt-4 border-t border-slate-50 dark:border-slate-800">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(q.date).toLocaleDateString()}</span>
                <button 
                  onClick={() => { setActiveQuotation(q); setView('preview'); }} 
                  className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest hover:underline font-bold"
                >
                  View Document →
                </button>
              </div>
            </div>
          ))}
          {quotations.length === 0 && (
            <div className="col-span-full py-20 text-center bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
              <p className="text-slate-400 font-bold uppercase tracking-widest italic text-sm">No active quotations found</p>
            </div>
          )}
        </div>
      )}

      {view === 'create' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 print:hidden font-bold">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-4xl p-8 shadow-2xl animate-in zoom-in-95 border border-slate-200 dark:border-slate-800 overflow-y-auto max-h-[95vh] font-bold">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tight font-bold">Quotation</h3>
              <button onClick={goBackToList} className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center transition-transform hover:rotate-90 font-bold">✕</button>
            </div>

            <div className="space-y-8 font-bold">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-bold">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 font-bold">Customer Name</label>
                  <input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Full Name" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-bold dark:text-white outline-none focus:border-indigo-500 font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 font-bold">Contact Number</label>
                  <input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="Mobile Number" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-bold dark:text-white outline-none focus:border-indigo-500 font-bold" />
                </div>
              </div>
              <div className="space-y-2 font-bold">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 font-bold">Installation Address</label>
                <input value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} placeholder="Complete Address" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-bold dark:text-white outline-none focus:border-indigo-500 font-bold" />
              </div>

              <div className="space-y-4 font-bold">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 font-bold">Proposed Services</label>
                  <button onClick={addItem} className="text-xs font-black text-indigo-600 uppercase hover:underline font-bold">+ Add Row</button>
                </div>
                
                <div className="hidden md:grid grid-cols-12 gap-3 px-1 font-bold">
                   <div className="col-span-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Service Item</div>
                   <div className="col-span-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Details / Technical Specs</div>
                   <div className="col-span-1 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Qty</div>
                   <div className="col-span-2 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Unit Price</div>
                   <div className="col-span-1"></div>
                </div>

                <div className="space-y-4 font-bold">
                  {items.map((item, idx) => (
                    <div key={idx} className="flex flex-col md:grid md:grid-cols-12 gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/50 group font-bold">
                      <div className="col-span-4 space-y-1 font-bold">
                        <label className="md:hidden text-[9px] font-bold text-slate-400 uppercase">Service</label>
                        <input value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)} placeholder="e.g. Fiber Install" className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm font-bold dark:text-white outline-none focus:border-indigo-500 font-bold" />
                      </div>
                      <div className="col-span-4 space-y-1 font-bold">
                        <label className="md:hidden text-[9px] font-bold text-slate-400 uppercase">Details</label>
                        <input value={item.details} onChange={e => updateItem(idx, 'details', e.target.value)} placeholder="Specifics..." className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm font-bold dark:text-white outline-none focus:border-indigo-500 font-bold" />
                      </div>
                      <div className="col-span-1 space-y-1 font-bold">
                        <label className="md:hidden text-[9px] font-bold text-slate-400 uppercase text-center block font-bold">Qty</label>
                        <input type="number" value={item.quantity} onChange={e => updateItem(idx, 'quantity', Number(e.target.value))} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-2 text-sm font-bold dark:text-white outline-none text-center font-bold" />
                      </div>
                      <div className="col-span-2 space-y-1 font-bold">
                        <label className="md:hidden text-[9px] font-bold text-slate-400 uppercase text-right block font-bold">Price (₹)</label>
                        <input type="number" value={item.unitPrice} onChange={e => updateItem(idx, 'unitPrice', Number(e.target.value))} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold dark:text-white outline-none text-right font-bold" />
                      </div>
                      <div className="col-span-1 flex items-center justify-end font-bold">
                        <button onClick={() => removeItem(idx)} className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-colors opacity-60 group-hover:opacity-100 font-bold">✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2 font-bold">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 font-bold">Additional Terms / Notes</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold dark:text-white outline-none focus:border-indigo-500 resize-none font-bold"></textarea>
              </div>

              <div className="pt-6 border-t dark:border-slate-800 flex justify-between items-center font-bold">
                <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Estimated</p>
                   <p className="text-2xl font-black text-indigo-600">₹{calculateTotal().toLocaleString()}</p>
                </div>
                <div className="flex gap-3 font-bold">
                  <button onClick={goBackToList} className="px-6 py-3 font-bold text-slate-500">Discard</button>
                  <button onClick={handleSave} className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black shadow-lg shadow-indigo-500/20 border border-indigo-500 active:scale-95 uppercase tracking-widest text-xs font-bold">FINALIZE & VIEW</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {view === 'preview' && activeQuotation && (
        <div className="max-w-4xl mx-auto space-y-8 animate-in zoom-in-95 duration-500 font-bold">
           <div className="flex flex-wrap gap-4 items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm print:hidden font-bold">
              <button onClick={goBackToList} className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 transition-colors font-bold">
                 <span>←</span> Back to List
              </button>
              <div className="flex gap-2 font-bold">
                <button onClick={handlePrint} className="flex items-center gap-2 px-6 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-bold">Print</button>
                <button onClick={handleDownloadPDF} disabled={isGenerating} className={`flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 active:scale-95 transition-all font-bold ${isGenerating ? 'opacity-70 cursor-wait' : ''}`}>
                  {isGenerating ? 'Generating...' : 'Download PDF'}
                </button>
              </div>
           </div>

           <div ref={quotationRef} className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden print:shadow-none print:border-0 print:rounded-none font-bold">
              <div className="p-12 flex flex-col md:flex-row justify-between items-start gap-8 bg-slate-50/50 dark:bg-slate-800/30 border-b dark:border-slate-800 font-bold">
                 <div className="space-y-6 font-bold">
                    <div className="flex items-center gap-4 font-bold">
                       <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center font-bold text-white text-3xl shadow-xl">I</div>
                       <div className="font-bold">
                          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white leading-none">Intech</h1>
                          <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em]">Broadband</span>
                       </div>
                    </div>
                    <div className="space-y-1 font-bold">
                       <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Formal Proposal</p>
                       <p className="text-xl font-black text-slate-900 dark:text-white">#QUO-{activeQuotation.id.toUpperCase()}</p>
                    </div>
                 </div>
                 <div className="text-right space-y-3 font-bold">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-full border border-indigo-100 dark:border-indigo-800 text-[11px] font-black uppercase tracking-widest">Official Quote</div>
                    <div className="space-y-1 font-bold">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Issue Date: {new Date(activeQuotation.date).toLocaleDateString()}</p>
                      <p className="text-xs font-bold text-rose-600 uppercase tracking-widest">Valid Until: {new Date(activeQuotation.expiryDate).toLocaleDateString()}</p>
                    </div>
                 </div>
              </div>

              <div className="p-12 grid grid-cols-1 md:grid-cols-2 gap-12 border-b dark:border-slate-800 font-bold">
                 <div className="space-y-4 font-bold">
                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Customer Details</h4>
                    <div className="space-y-2 font-bold">
                       <p className="text-xl font-black text-slate-900 dark:text-white">{activeQuotation.customerName}</p>
                       <p className="text-base font-bold text-slate-500 dark:text-slate-400">{activeQuotation.customerPhone}</p>
                       <p className="text-sm font-bold text-slate-400 dark:text-slate-500 leading-relaxed max-w-sm">{activeQuotation.customerAddress}</p>
                    </div>
                 </div>
                 <div className="md:text-right space-y-4 font-bold">
                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Service Provider</h4>
                    <div className="space-y-1 font-bold">
                       <p className="text-base font-black text-slate-900 dark:text-white">Intech Broadband</p>
                       <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Kaliachak, Malda</p>
                       <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Contact: 8759114530</p>
                    </div>
                 </div>
              </div>

              <div className="p-12 font-bold">
                 <table className="w-full font-bold">
                    <thead>
                       <tr className="border-b-2 dark:border-slate-800 font-bold">
                          <th className="text-left py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Item / Service Description</th>
                          <th className="text-center py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Qty</th>
                          <th className="text-right py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Unit Price</th>
                          <th className="text-right py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Total</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-slate-800 font-bold">
                       {activeQuotation.items.map((item, idx) => (
                         <tr key={idx} className="group font-bold">
                            <td className="py-6 pr-4 font-bold">
                               <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{item.description}</p>
                               {item.details && <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1 italic leading-snug">{item.details}</p>}
                            </td>
                            <td className="py-6 text-center text-sm font-bold text-slate-500">{item.quantity}</td>
                            <td className="py-6 text-right text-sm font-bold text-slate-500">₹{item.unitPrice.toLocaleString()}</td>
                            <td className="py-6 text-right font-black text-slate-900 dark:text-white">₹{(item.quantity * item.unitPrice).toLocaleString()}</td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
              </div>

              <div className="p-12 grid grid-cols-1 md:grid-cols-2 gap-12 bg-slate-50/50 dark:bg-slate-800/30 font-bold">
                 <div className="space-y-4 font-bold">
                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Terms & Notes</h4>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 leading-relaxed italic border-l-4 border-indigo-200 dark:border-indigo-800 pl-4">{activeQuotation.notes}</p>
                 </div>
                 <div className="space-y-4 font-bold">
                    <div className="flex justify-between items-center py-2 font-bold">
                       <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-[0.2em]">Total Quote Value</span>
                       <span className="text-3xl font-black text-indigo-600">₹{activeQuotation.total.toLocaleString()}</span>
                    </div>
                 </div>
              </div>

              <div className="p-10 text-center border-t dark:border-slate-800 font-bold">
                 <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Intech Broadband — Connect to the Future</p>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default QuotationModule;