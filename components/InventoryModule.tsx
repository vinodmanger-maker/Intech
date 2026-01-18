
import React, { useState } from 'react';
import { InventoryItem, User, UserRole } from '../types';
import { storage } from '../services/storage';

interface InventoryModuleProps {
  user: User;
}

const InventoryModule: React.FC<InventoryModuleProps> = ({ user }) => {
  const [items, setItems] = useState<InventoryItem[]>(() => storage.getInventory());
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newItem: InventoryItem = {
      id: editingItem?.id || Math.random().toString(36).substr(2, 9),
      name: formData.get('name') as string,
      category: formData.get('category') as any,
      totalStock: Number(formData.get('totalStock')),
      availableStock: Number(formData.get('availableStock')),
      unit: formData.get('unit') as string,
      lowStockThreshold: Number(formData.get('lowStockThreshold'))
    };

    storage.updateInventoryItem(newItem);
    setItems(storage.getInventory());
    setShowAddModal(false);
    setEditingItem(null);
  };

  const getStatusColor = (item: InventoryItem) => {
    if (item.availableStock === 0) return 'text-rose-600 bg-rose-50 dark:bg-rose-500/10 border-rose-100 dark:border-rose-500/30';
    if (item.availableStock <= item.lowStockThreshold) return 'text-amber-600 bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/30';
    return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/30';
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 font-bold">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 font-bold">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight font-bold uppercase italic tracking-tighter">Inventory Ledger</h2>
          <p className="text-slate-500 dark:text-slate-400 font-bold">Audit and track mission critical hardware deployments.</p>
        </div>
        {user.role === UserRole.ADMIN && (
          <button 
            onClick={() => { setEditingItem(null); setShowAddModal(true); }} 
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-7 py-3.5 rounded-2xl font-black shadow-lg active:scale-95 border border-indigo-500 uppercase tracking-[0.1em] text-[10px] font-bold"
          >
            + ADD HARDWARE
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 font-bold">
        {items.map(item => (
          <div key={item.id} className="bg-white dark:bg-[#09090b] p-7 rounded-[2rem] border border-slate-200 dark:border-white/10 shadow-sm hover:shadow-2xl transition-all flex flex-col font-bold group">
            <div className="flex justify-between items-start mb-8 font-bold">
              <div className="space-y-1.5 font-bold">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] font-bold">{item.category}</span>
                <h3 className="font-black text-slate-900 dark:text-white text-lg leading-tight uppercase tracking-tighter font-bold">{item.name}</h3>
              </div>
              {user.role === UserRole.ADMIN && (
                <button 
                  onClick={() => { setEditingItem(item); setShowAddModal(true); }}
                  className="p-2.5 text-slate-400 hover:text-indigo-600 dark:hover:text-white transition-colors font-bold bg-slate-50 dark:bg-white/5 rounded-xl border border-transparent dark:border-white/5"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                </button>
              )}
            </div>

            <div className="space-y-5 font-bold">
              <div className="flex justify-between items-end font-bold">
                 <div className="font-bold">
                   <p className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter font-bold">{item.availableStock}</p>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-bold">Stock {item.unit}</p>
                 </div>
                 <div className={`px-3 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-widest font-bold ${getStatusColor(item)}`}>
                   {item.availableStock === 0 ? 'DEPLETED' : item.availableStock <= item.lowStockThreshold ? 'CRITICAL' : 'OPTIMAL'}
                 </div>
              </div>

              <div className="w-full h-2.5 bg-slate-100 dark:bg-black/50 rounded-full overflow-hidden font-bold border border-transparent dark:border-white/5 shadow-inner">
                <div 
                  className={`h-full transition-all duration-1000 font-bold ${item.availableStock <= item.lowStockThreshold ? 'bg-amber-500' : 'bg-indigo-600'}`}
                  style={{ width: `${(item.availableStock / item.totalStock) * 100}%` }}
                />
              </div>

              <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest font-bold">
                <span className="font-bold">LOW: {item.lowStockThreshold}</span>
                <span className="font-bold">CAP: {item.totalStock}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[110] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-black rounded-[2.5rem] w-full max-md p-9 shadow-2xl animate-in zoom-in-95 border border-slate-200 dark:border-white/10 font-bold">
            <h3 className="text-2xl font-black mb-7 text-slate-900 dark:text-white uppercase italic tracking-tighter font-bold">
              {editingItem ? 'Adjust Unit' : 'Log Hardware'}
            </h3>
            
            <form onSubmit={handleSave} className="space-y-6 font-bold">
              <div className="space-y-2 font-bold">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1 font-bold">Item Identifier</label>
                <input name="name" required defaultValue={editingItem?.name} placeholder="e.g. WiFi-6 Broadband Node" className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-4 font-bold dark:text-white focus:border-indigo-500 outline-none font-bold" />
              </div>

              <div className="grid grid-cols-2 gap-5 font-bold">
                <div className="space-y-2 font-bold">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1 font-bold">Asset Class</label>
                  <select name="category" defaultValue={editingItem?.category || 'Router'} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-4 font-bold dark:text-white outline-none font-bold">
                    <option value="Router" className="font-bold">Router</option>
                    <option value="ONU" className="font-bold">ONU</option>
                    <option value="Cable" className="font-bold">Cable</option>
                    <option value="Splitter" className="font-bold">Splitter</option>
                    <option value="Other" className="font-bold">Other</option>
                  </select>
                </div>
                <div className="space-y-2 font-bold">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1 font-bold">Unit Metric</label>
                  <input name="unit" required defaultValue={editingItem?.unit || 'pcs'} placeholder="pcs/rolls/m" className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-4 font-bold dark:text-white outline-none font-bold" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 font-bold">
                <div className="space-y-2 font-bold">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1 font-bold">Capacity</label>
                  <input name="totalStock" type="number" required defaultValue={editingItem?.totalStock} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-3 font-bold dark:text-white outline-none font-bold" />
                </div>
                <div className="space-y-2 font-bold">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1 font-bold">Current</label>
                  <input name="availableStock" type="number" required defaultValue={editingItem?.availableStock} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-3 font-bold dark:text-white outline-none font-bold" />
                </div>
                <div className="space-y-2 font-bold">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1 font-bold">Alert</label>
                  <input name="lowStockThreshold" type="number" required defaultValue={editingItem?.lowStockThreshold} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-3 font-bold dark:text-white outline-none font-bold" />
                </div>
              </div>

              <div className="flex gap-4 pt-6 font-bold">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-4 font-black text-[10px] uppercase text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">Discard</button>
                <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white rounded-[1.5rem] font-black shadow-lg shadow-indigo-500/20 active:scale-95 border border-indigo-500 uppercase tracking-widest text-[10px] font-bold">
                  {editingItem ? 'COMMIT UPDATE' : 'ADD TO LEDGER'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryModule;
