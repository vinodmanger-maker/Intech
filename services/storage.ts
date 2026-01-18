
import { Customer, Transaction, User, UserRole, CustomerStatus, SupportTicket, TicketStatus, TicketPriority, Quotation, InventoryItem } from '../types';

const KEYS = {
  CUSTOMERS: 'isp_customers',
  TRANSACTIONS: 'isp_transactions',
  TICKETS: 'isp_tickets',
  QUOTATIONS: 'isp_quotations',
  INVENTORY: 'isp_inventory',
  AUTH_USER: 'isp_auth_user'
};

export const storage = {
  getCustomers: (): Customer[] => {
    const data = localStorage.getItem(KEYS.CUSTOMERS);
    return data ? JSON.parse(data) : [];
  },

  saveCustomers: (customers: Customer[]) => {
    localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(customers));
  },

  getTransactions: (): Transaction[] => {
    const data = localStorage.getItem(KEYS.TRANSACTIONS);
    return data ? JSON.parse(data) : [];
  },

  saveTransactions: (transactions: Transaction[]) => {
    localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(transactions));
  },

  getTickets: (): SupportTicket[] => {
    const data = localStorage.getItem(KEYS.TICKETS);
    return data ? JSON.parse(data) : [];
  },

  saveTickets: (tickets: SupportTicket[]) => {
    localStorage.setItem(KEYS.TICKETS, JSON.stringify(tickets));
  },

  getQuotations: (): Quotation[] => {
    const data = localStorage.getItem(KEYS.QUOTATIONS);
    return data ? JSON.parse(data) : [];
  },

  saveQuotations: (quotations: Quotation[]) => {
    localStorage.setItem(KEYS.QUOTATIONS, JSON.stringify(quotations));
  },

  getInventory: (): InventoryItem[] => {
    const data = localStorage.getItem(KEYS.INVENTORY);
    return data ? JSON.parse(data) : [];
  },

  saveInventory: (items: InventoryItem[]) => {
    localStorage.setItem(KEYS.INVENTORY, JSON.stringify(items));
  },

  getAuthUser: (): User | null => {
    const data = localStorage.getItem(KEYS.AUTH_USER);
    return data ? JSON.parse(data) : null;
  },

  setAuthUser: (user: User | null) => {
    if (user) {
      localStorage.setItem(KEYS.AUTH_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(KEYS.AUTH_USER);
    }
  },

  addQuotation: (quotation: Quotation) => {
    const quotes = storage.getQuotations();
    storage.saveQuotations([quotation, ...quotes]);
  },

  deleteQuotation: (id: string) => {
    const quotes = storage.getQuotations();
    storage.saveQuotations(quotes.filter(q => q.id !== id));
  },

  addCustomer: (customer: Omit<Customer, 'id' | 'totalDue' | 'lastBilledDate' | 'status'>) => {
    const customers = storage.getCustomers();
    const newCustomer: Customer = {
      ...customer,
      id: Math.random().toString(36).substr(2, 9),
      totalDue: customer.monthlyPlanAmount,
      lastBilledDate: new Date().toISOString(),
      status: CustomerStatus.ACTIVE,
      assignedAssets: []
    };
    storage.saveCustomers([...customers, newCustomer]);
    return newCustomer;
  },

  updateCustomer: (id: string, updates: Partial<Omit<Customer, 'id' | 'totalDue' | 'lastBilledDate'>>) => {
    const customers = storage.getCustomers();
    const index = customers.findIndex(c => c.id === id);
    if (index !== -1) {
      customers[index] = { ...customers[index], ...updates };
      storage.saveCustomers(customers);
      return customers[index];
    }
    return null;
  },

  addTicket: (ticketData: Omit<SupportTicket, 'id' | 'createdAt' | 'status'>) => {
    const tickets = storage.getTickets();
    const newTicket: SupportTicket = {
      ...ticketData,
      id: Math.random().toString(36).substr(2, 9),
      status: TicketStatus.OPEN,
      createdAt: new Date().toISOString(),
    };
    storage.saveTickets([newTicket, ...tickets]);
    return newTicket;
  },

  updateTicketStatus: (id: string, status: TicketStatus, user?: User) => {
    const tickets = storage.getTickets();
    const index = tickets.findIndex(t => t.id === id);
    if (index !== -1) {
      tickets[index].status = status;
      if (status === TicketStatus.PENDING && user) {
        tickets[index].startedBy = user.id;
        tickets[index].startedByName = user.name;
      }
      if (status === TicketStatus.RESOLVED && user) {
        tickets[index].resolvedAt = new Date().toISOString();
        tickets[index].resolvedBy = user.id;
        tickets[index].resolvedByName = user.name;
      }
      storage.saveTickets(tickets);
    }
  },

  updateCustomerStatus: (id: string, status: CustomerStatus) => {
    const customers = storage.getCustomers();
    const index = customers.findIndex(c => c.id === id);
    if (index !== -1) {
      customers[index].status = status;
      storage.saveCustomers(customers);
    }
  },

  updateInventoryItem: (item: InventoryItem) => {
    const inventory = storage.getInventory();
    const index = inventory.findIndex(i => i.id === item.id);
    if (index !== -1) {
      inventory[index] = item;
    } else {
      inventory.push(item);
    }
    storage.saveInventory(inventory);
  },

  recordPayment: (
    customerId: string, 
    amount: number, 
    user: User, 
    notes?: string
  ): Transaction | null => {
    const customers = storage.getCustomers();
    const customerIndex = customers.findIndex(c => c.id === customerId);
    
    if (customerIndex === -1) return null;

    const customer = customers[customerIndex];
    const remainingDue = customer.totalDue - amount;
    
    customers[customerIndex].totalDue = remainingDue;
    storage.saveCustomers(customers);

    const transactions = storage.getTransactions();
    const newTransaction: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      customerId,
      collectorId: user.id,
      collectorName: user.name,
      collectorRole: user.role,
      amountPaid: amount,
      paymentType: amount >= customer.totalDue ? 'Full' as any : 'Part' as any,
      date: new Date().toISOString(),
      remainingDueAfter: remainingDue,
      notes
    };
    
    storage.saveTransactions([newTransaction, ...transactions]);
    return newTransaction;
  },

  initializeMockData: () => {
    if (storage.getCustomers().length === 0) {
      const mockCustomers: Customer[] = [
        { id: '1', name: 'Abdur Rahman', phone: '8759114530', address: 'Kaliachak, Malda', monthlyPlanAmount: 500, totalDue: 500, lastBilledDate: '2023-10-01', status: CustomerStatus.ACTIVE, dueDay: 1 },
        { id: '2', name: 'John Doe', phone: '9123456789', address: 'Indiranagar, Bangalore', monthlyPlanAmount: 1000, totalDue: 1200, lastBilledDate: '2023-10-01', status: CustomerStatus.ACTIVE, dueDay: 5 },
        { id: '3', name: 'Sadia Sultana', phone: '9988776655', address: 'DLF Phase 3, Gurgaon', monthlyPlanAmount: 800, totalDue: 0, lastBilledDate: '2023-10-01', status: CustomerStatus.SUSPENDED, dueDay: 10 }
      ];
      storage.saveCustomers(mockCustomers);
    }
    if (storage.getTickets().length === 0) {
      const mockTickets: SupportTicket[] = [
        { id: 't1', customerId: '1', customerName: 'Abdur Rahman', issue: 'Internet connection is very slow since morning.', status: TicketStatus.OPEN, priority: TicketPriority.HIGH, createdAt: new Date().toISOString() },
        { id: 't2', customerId: '2', customerName: 'John Doe', issue: 'Fiber cable broken near the gate.', status: TicketStatus.PENDING, priority: TicketPriority.MEDIUM, createdAt: new Date().toISOString(), startedByName: 'Vinod' }
      ];
      storage.saveTickets(mockTickets);
    }
    if (storage.getInventory().length === 0) {
      const mockInventory: InventoryItem[] = [
        { id: 'inv1', name: 'Dual Band WiFi Router', category: 'Router', totalStock: 50, availableStock: 12, unit: 'pcs', lowStockThreshold: 10 },
        { id: 'inv2', name: 'GPN ONU Single Port', category: 'ONU', totalStock: 100, availableStock: 45, unit: 'pcs', lowStockThreshold: 15 },
        { id: 'inv3', name: 'Fiber Patch Cord 3M', category: 'Cable', totalStock: 200, availableStock: 5, unit: 'pcs', lowStockThreshold: 20 },
        { id: 'inv4', name: 'FRP Fiber Cable Roll', category: 'Cable', totalStock: 10, availableStock: 4, unit: 'rolls', lowStockThreshold: 2 }
      ];
      storage.saveInventory(mockInventory);
    }
  }
};
