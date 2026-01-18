
import React, { useState, useEffect, useCallback } from 'react';
import { User, UserRole, Customer, Transaction } from './types';
import { storage } from './services/storage';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import CustomerManagement from './components/CustomerManagement';
import PaymentModule from './components/PaymentModule';
import SupportTickets from './components/SupportTickets';
import QuotationModule from './components/QuotationModule';
import InventoryModule from './components/InventoryModule';
import Login from './components/Login';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(() => storage.getAuthUser());
  const [activeTab, setActiveTab] = useState('dashboard');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('isp_theme') as 'light' | 'dark') || 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('isp_theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  useEffect(() => {
    storage.initializeMockData();
    refreshData();
  }, []);

  const refreshData = useCallback(() => {
    setCustomers(storage.getCustomers());
    setTransactions(storage.getTransactions());
  }, []);

  const handleAddCustomer = (customerData: Omit<Customer, 'id' | 'totalDue' | 'lastBilledDate' | 'status'>) => {
    storage.addCustomer(customerData);
    refreshData();
  };

  const handleRecordPayment = (customerId: string, amount: number, notes: string) => {
    if (!user) return null;
    const tx = storage.recordPayment(customerId, amount, user, notes);
    refreshData();
    return tx;
  };

  const handleLogin = (authenticatedUser: User) => {
    setUser(authenticatedUser);
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    storage.setAuthUser(null);
    setUser(null);
  };

  const renderContent = () => {
    if (!user) return null;

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard user={user} customers={customers} transactions={transactions} onNavigate={setActiveTab} onRefresh={refreshData} />;
      case 'customers':
        return (
          <CustomerManagement 
            user={user}
            customers={customers} 
            transactions={transactions} 
            onAddCustomer={handleAddCustomer} 
            onRecordPayment={handleRecordPayment}
            onRefresh={refreshData}
          />
        );
      case 'helpdesk':
        return (
          <SupportTickets 
            user={user} 
            customers={customers} 
            onRefresh={refreshData} 
          />
        );
      case 'payments':
        return (
          <PaymentModule 
            user={user} 
            customers={customers} 
            onRecordPayment={handleRecordPayment} 
          />
        );
      case 'inventory':
        return (
          <InventoryModule user={user} />
        );
      case 'quotations':
        return (
          <QuotationModule user={user} />
        );
      default:
        return <Dashboard user={user} customers={customers} transactions={transactions} onNavigate={setActiveTab} onRefresh={refreshData} />;
    }
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Layout 
      user={user} 
      onLogout={handleLogout} 
      activeTab={activeTab} 
      setActiveTab={setActiveTab}
      theme={theme}
      toggleTheme={toggleTheme}
    >
      {renderContent()}
    </Layout>
  );
};

export default App;
