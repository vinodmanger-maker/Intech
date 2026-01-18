import React, { useState, useMemo } from 'react';
import { Customer, Transaction, UserRole } from '../types';
import * as XLSX from 'xlsx';

interface ReportsProps {
  transactions: Transaction[];
  customers: Customer[];
}

type ReportType = 'collections' | 'dues';
type TimeRange = 'today' | 'week' | 'month' | 'all';

const Reports: React.FC<ReportsProps> = ({ transactions, customers }) => {
  const [reportType, setReportType] = useState<ReportType>('collections');
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [filterRole, setFilterRole] = useState<'ALL' | UserRole>('ALL');

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date();
  startOfWeek.setDate(now.getDate() - 7);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const txDate = new Date(t.date);
      const roleMatch = filterRole === 'ALL' || t.collectorRole === filterRole;
      
      let dateMatch = true;
      if (timeRange === 'today') dateMatch = txDate >= startOfToday;
      else if (timeRange === 'week') dateMatch = txDate >= startOfWeek;
      else if (timeRange === 'month') dateMatch = txDate >= startOfMonth;

      return roleMatch && dateMatch;
    });
  }, [transactions, timeRange, filterRole]);

  const pendingCustomers = useMemo(() => {
    return customers.filter(c => c.totalDue > 0).sort((a, b) => b.totalDue - a.totalDue);
  }, [customers]);

  const stats = useMemo(() => {
    if (reportType === 'collections') {
      const total = filteredTransactions.reduce((sum, t) => sum + t.amountPaid, 0);
      return {
        label1: 'Revenue',
        value1: `₹${total.toLocaleString('en-IN')}`,
        label2: 'Tx Count',
        value2: filteredTransactions.length,
        label3: 'Avg. Receipt',
        value3: filteredTransactions.length ? `₹${Math.round(total / filteredTransactions.length)}` : '₹0'
      };
    } else {
      const total = pendingCustomers.reduce((sum, c) => sum + c.totalDue, 0);
      return {
        label1: 'Outstanding',
        value1: `₹${total.toLocaleString('en-IN')}`,
        label2: 'Accounts',
        value2: pendingCustomers.length,
        label3: 'Avg. Due',
        value3: pendingCustomers.length ? `₹${Math.round(total / pendingCustomers.length)}` : '₹0'
      };
    }
  }, [reportType, filteredTransactions, pendingCustomers]);

  const getCustomerName = (id: string) => customers.find(c => c.id === id)?.name || 'Unknown Sub';

  const handleExport = () => {
    let dataToExport: any[] = [];
    let fileName = '';

    if (reportType === 'collections') {
      fileName = `Intech_Collections_${timeRange}_${new Date().toISOString().split('T')[0]}.xlsx`;
      dataToExport = filteredTransactions.map(t => ({
        'Date': new Date(t.date).toLocaleDateString(),
        'Time': new Date(t.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        'Subscriber Name': getCustomerName(t.customerId),
        'Amount Paid (₹)': t.amountPaid,
        'Balance After (₹)': t.remainingDueAfter,
        'Collected By': t.collectorName,
        'Role': t.collectorRole,
        'Notes': t.notes || ''
      }));
    } else {
      fileName = `Intech_Outstanding_Dues_${new Date().toISOString().split('T')[0]}.xlsx`;
      dataToExport = pendingCustomers.map(c => ({
        'Subscriber Name': c.name,
        'Phone': c.phone,
        'Address': c.address,
        'Monthly Plan (₹)': c.monthlyPlanAmount,
        'Total Due (₹)': c.totalDue,
        'Due Day': c.dueDay,
        'Status': c.status
      }));
    }

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, reportType === 'collections' ? 'Collections' : 'Dues');
    XLSX.writeFile(workbook, fileName);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-16">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 font-bold">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Business Reports</h2>
          <p className="text-slate-500 dark:text-slate-400 font-bold">Detailed financial health and subscriber audit logs.</p>
        </div>
        
        <div className="flex bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm self-start lg:self-auto font-bold">
          <button 
            onClick={() => setReportType('collections')}
            className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${reportType === 'collections' ? 'bg-slate-900 dark:bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
          >
            Collection Audit
          </button>
          <button 
            onClick={() => setReportType('dues')}
            className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${reportType === 'dues' ? 'bg-slate-900 dark:bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
          >
            Outstanding Dues
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard label={stats.label1} value={stats.value1} icon="💰" color="blue" />
        <StatCard label={stats.label2} value={stats.value2} icon="🧾" color="emerald" />
        <StatCard label={stats.label3} value={stats.value3} icon="📊" color="amber" />
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-6 items-end font-bold">
        {reportType === 'collections' && (
          <>
            <div className="flex-1 space-y-2 w-full font-bold">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Time Horizon</label>
              <div className="flex bg-slate-50 dark:bg-slate-800 p-1 rounded-xl border dark:border-slate-700 font-bold">
                {(['today', 'week', 'month', 'all'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTimeRange(t)}
                    className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${timeRange === t ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-bold' : 'text-slate-400 hover:text-slate-600 font-bold'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 space-y-2 w-full font-bold">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Authorized By</label>
              <select 
                className="w-full bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-bold dark:text-white outline-none focus:border-blue-600 font-bold"
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value as any)}
              >
                <option value="ALL">All Roles</option>
                <option value={UserRole.ADMIN}>Admins Only</option>
                <option value={UserRole.STAFF}>Agents Only</option>
              </select>
            </div>
          </>
        )}
        
        {reportType === 'dues' && (
          <div className="flex-1 space-y-2 w-full font-bold">
            <p className="text-sm font-bold text-slate-500 py-2">
              Showing <span className="text-red-800 dark:text-red-500 font-bold">{pendingCustomers.length}</span> accounts with unpaid balances.
            </p>
          </div>
        )}

        <button 
          onClick={handleExport}
          className="w-full md:w-auto px-6 py-2.5 bg-blue-600 text-white border border-blue-500 rounded-xl font-bold text-sm hover:bg-blue-700 shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <span>📥</span> Export Report (.xlsx)
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden min-h-[400px]">
        {reportType === 'collections' ? (
          filteredTransactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left font-bold">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800 border-b dark:border-slate-800">
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Transaction</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Subscriber</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Paid</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Balance After</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Collected By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800 font-bold">
                  {filteredTransactions.map(t => (
                    <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-bold">
                      <td className="px-6 py-5 font-bold">
                        <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{new Date(t.date).toLocaleDateString()}</p>
                        <p className="text-[10px] text-slate-400 font-black uppercase">{new Date(t.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-sm font-bold text-slate-900 dark:text-slate-100 italic">{getCustomerName(t.customerId)}</p>
                      </td>
                      <td className="px-6 py-5 text-right font-bold text-emerald-600">₹{t.amountPaid}</td>
                      <td className="px-6 py-5 text-right font-bold text-slate-900 dark:text-white">₹{t.remainingDueAfter}</td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2 font-bold">
                          <div className={`w-2 h-2 rounded-full ${t.collectorRole === UserRole.ADMIN ? 'bg-indigo-600' : 'bg-blue-500'}`}></div>
                          <span className="text-[10px] font-black text-slate-500 uppercase">{t.collectorName}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyReport message="No collections found for this period." icon="🔍" />
          )
        ) : (
          pendingCustomers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left font-bold">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800 border-b dark:border-slate-800">
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Subscriber</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Monthly Plan</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Total Due</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Due Day</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800 font-bold">
                  {pendingCustomers.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-bold">
                      <td className="px-6 py-5 font-bold">
                        <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{c.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold truncate max-w-xs">{c.address}</p>
                      </td>
                      <td className="px-6 py-5 text-sm text-slate-600 dark:text-slate-400 font-bold">{c.phone}</td>
                      <td className="px-6 py-5 font-bold text-sm">₹{c.monthlyPlanAmount}</td>
                      <td className="px-6 py-5 text-right font-bold text-red-800 dark:text-red-500">₹{c.totalDue}</td>
                      <td className="px-6 py-5 text-center font-bold">
                        <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest border border-slate-200 dark:border-slate-700">DAY {c.dueDay}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyReport message="Zero outstanding dues!" icon="🏆" />
          )
        )}
      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon, color }: any) => {
  const colors: any = {
    blue: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-600/30",
    emerald: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-600/30",
    amber: "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-600/30",
    rose: "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-400 border-red-600/30"
  };

  return (
    <div className={`bg-white dark:bg-slate-900 p-6 rounded-3xl border ${colors[color]} shadow-sm flex items-center gap-5 transition-all hover:shadow-md font-bold`}>
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-sm ${colors[color]} border`}>{icon}</div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{value}</p>
      </div>
    </div>
  );
};

const EmptyReport = ({ message, icon }: { message: string, icon: string }) => (
  <div className="flex flex-col items-center justify-center py-32 space-y-4">
    <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-5xl opacity-40 border border-dashed border-slate-300 dark:border-slate-700">{icon}</div>
    <div className="text-center">
      <p className="text-sm font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest italic">{message}</p>
    </div>
  </div>
);

export default Reports;