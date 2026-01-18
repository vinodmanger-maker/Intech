
import React from 'react';
import { Transaction, Customer } from '../types';

interface InvoiceDocumentProps {
  transaction: Transaction;
  customer: Customer;
  onClose?: () => void;
}

const InvoiceDocument: React.FC<InvoiceDocumentProps> = ({ transaction, customer, onClose }) => {
  const shareReceipt = () => {
    const text = `*Intech Broadband Receipt*\n--------------------------\nSub: ${customer.name}\nDate: ${new Date(transaction.date).toLocaleDateString()}\nPlan: ₹${customer.monthlyPlanAmount}\nPaid: ₹${transaction.amountPaid}\nBal: ₹${transaction.remainingDueAfter}\nColl by: ${transaction.collectorName}\n--------------------------\nThank you!`;
    const whatsappUrl = `https://wa.me/${customer.phone}?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  };

  const printReceipt = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-in zoom-in-95 duration-500 font-bold">
      {/* Control Bar - Hidden on Print */}
      <div className="flex flex-wrap gap-4 items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800/40 shadow-sm print:hidden font-bold">
        {onClose && (
          <button onClick={onClose} className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 transition-colors font-bold">
            <span>←</span> Back
          </button>
        )}
        <div className="flex gap-2 ml-auto font-bold">
          <button onClick={shareReceipt} className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-emerald-100 transition-colors font-bold">
            WhatsApp
          </button>
          <button onClick={printReceipt} className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 active:scale-95 transition-all font-bold">
            Print Invoice
          </button>
        </div>
      </div>

      {/* The Invoice Document */}
      <div id="invoice-receipt" className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800/50 shadow-2xl overflow-hidden print:shadow-none print:border-0 print:rounded-none mx-auto max-w-3xl font-bold">
        {/* Invoice Header */}
        <div className="p-10 flex flex-col md:flex-row justify-between items-start gap-8 bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800/40 font-bold">
          <div className="space-y-4 font-bold">
            <div className="flex items-center gap-3 font-bold">
              <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center font-bold text-white text-2xl shadow-lg font-bold">I</div>
              <div className="font-bold">
                <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white leading-none font-bold">Intech</h1>
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest font-bold">Broadband</span>
              </div>
            </div>
            <div className="space-y-1 font-bold">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-bold">Official Receipt</p>
              <p className="text-lg font-black text-slate-900 dark:text-white font-bold">#TXN-{transaction.id.toUpperCase()}</p>
            </div>
          </div>
          <div className="text-right space-y-2 font-bold">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-full border border-emerald-100 dark:border-emerald-800/40 text-[10px] font-black uppercase font-bold">
              Payment Received
            </div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest font-bold">{new Date(transaction.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-bold">{new Date(transaction.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        </div>

        {/* Billing Info */}
        <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-12 border-b border-slate-100 dark:border-slate-800/30 font-bold">
          <div className="space-y-3 font-bold">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] font-bold">Bill To</h4>
            <div className="space-y-1 font-bold">
              <p className="text-lg font-black text-slate-900 dark:text-white font-bold">{customer.name}</p>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400 font-bold">{customer.phone}</p>
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 max-w-[200px] font-bold">{customer.address}</p>
            </div>
          </div>
          <div className="md:text-right space-y-3 font-bold">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] font-bold">Collector Information</h4>
            <div className="space-y-1 font-bold">
              <p className="text-sm font-bold text-slate-900 dark:text-white font-bold">{transaction.collectorName}</p>
              <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest font-bold">Intech Broadband</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter font-bold">Kaliachak, Malda</p>
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="p-10 font-bold">
          <table className="w-full font-bold">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800/40 font-bold">
                <th className="text-left py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest font-bold">Description</th>
                <th className="text-right py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest font-bold">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/30 font-bold">
              <tr className="font-bold">
                <td className="py-6 font-bold">
                  <p className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight font-bold">Broadband Monthly Subscription</p>
                  <div className="flex flex-col mt-1 gap-1 font-bold">
                    <p className="text-[10px] text-slate-500 dark:text-slate-500 uppercase font-bold">Fiber Connectivity Services</p>
                    <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-widest font-bold">Monthly Plan: ₹{customer.monthlyPlanAmount.toLocaleString('en-IN')}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-500 uppercase font-bold">Payment Type: {transaction.paymentType} Payment</p>
                  </div>
                  {transaction.notes && <p className="text-[9px] bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded mt-3 inline-block font-bold text-slate-500 uppercase italic font-bold">Note: {transaction.notes}</p>}
                </td>
                <td className="py-6 text-right font-bold">
                  <p className="text-xl font-black text-slate-900 dark:text-white font-bold">₹{transaction.amountPaid.toLocaleString('en-IN')}</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="p-10 bg-slate-50/50 dark:bg-slate-800/20 flex justify-end font-bold">
          <div className="w-full md:w-1/2 space-y-4 font-bold">
            <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-widest font-bold">
              <span className="font-bold">Subtotal</span>
              <span className="text-slate-900 dark:text-white font-bold">₹{transaction.amountPaid.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-widest font-bold">
              <span className="font-bold">Taxes (Included)</span>
              <span className="text-slate-900 dark:text-white font-bold">₹0.00</span>
            </div>
            <div className="h-px bg-slate-200 dark:bg-slate-800/40 font-bold"></div>
            <div className="flex justify-between items-center py-2 font-bold">
              <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] font-bold">Total Paid</span>
              <span className="text-2xl font-black text-indigo-600 font-bold">₹{transaction.amountPaid.toLocaleString('en-IN')}</span>
            </div>
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800/60 flex justify-between items-center shadow-sm font-bold">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-bold">Remaining Balance</span>
              <span className="text-sm font-black text-rose-600 font-bold">₹{transaction.remainingDueAfter.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Footer Footer */}
        <div className="p-10 text-center font-bold">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 font-bold">This is a system generated electronic receipt.</p>
          <p className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest font-bold">Intech Broadband © 2025</p>
        </div>
      </div>
    </div>
  );
};

export default InvoiceDocument;
