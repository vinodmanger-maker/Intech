
export enum UserRole {
  ADMIN = 'Admin',
  STAFF = 'Agent'
}

export enum CustomerStatus {
  ACTIVE = 'Active',
  SUSPENDED = 'Suspended',
  INACTIVE = 'Inactive'
}

export enum TicketStatus {
  OPEN = 'Open',
  PENDING = 'In Progress',
  RESOLVED = 'Resolved'
}

export enum TicketPriority {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High'
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  monthlyPlanAmount: number;
  totalDue: number;
  lastBilledDate: string;
  status: CustomerStatus;
  dueDay: number;
  photo?: string;
  assignedAssets?: string[]; // IDs of inventory items
}

export interface InventoryItem {
  id: string;
  name: string;
  category: 'Router' | 'ONU' | 'Cable' | 'Splitter' | 'Other';
  totalStock: number;
  availableStock: number;
  unit: string;
  lowStockThreshold: number;
}

export interface SupportTicket {
  id: string;
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  issue: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolvedByName?: string;
  startedBy?: string;
  startedByName?: string;
  assignedTo?: string;
}

export enum PaymentType {
  FULL = 'Full',
  PART = 'Part'
}

export interface Transaction {
  id: string;
  customerId: string;
  collectorId: string;
  collectorName: string;
  collectorRole: UserRole;
  amountPaid: number;
  paymentType: PaymentType;
  date: string;
  remainingDueAfter: number;
  notes?: string;
}

export interface QuotationItem {
  id: string;
  description: string;
  details?: string;
  quantity: number;
  unitPrice: number;
}

export interface Quotation {
  id: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: QuotationItem[];
  date: string;
  expiryDate: string;
  notes?: string;
  total: number;
  createdBy: string;
}

export interface DashboardStats {
  totalCollectionToday: number;
  weeklyCollection: number;
  monthlyCollection: number;
  yearlyCollection: number;
  staffCollectionToday: number;
  adminCollectionToday: number;
  totalPendingDues: number;
  activeCustomers: number;
  openTickets: number;
}
