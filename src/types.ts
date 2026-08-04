export type CurrencySymbol = '₹' | '$' | '€' | '£' | 'AED' | '৳';

export type PaymentMode = 'UPI' | 'Cash' | 'Bank Transfer' | 'Cheque' | 'Other';

export type TransactionType = 'LOAN_GIVEN' | 'MONEY_RECEIVED';

export type ClaimStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CORRECTION_NEEDED';

export type UserRole = 'SUPER_ADMIN' | 'COMPANY_ADMIN' | 'STAFF';

export type TenantStatus = 'ACTIVE' | 'TRIAL' | 'EXPIRED' | 'SUSPENDED' | 'PENDING_SETUP';

export interface SubscriptionPlan {
  id: string;
  name: string;
  priceMonthly: number;
  priceYearly: number;
  customerLimit: number; // -1 for unlimited
  loanLimit: number; // -1 for unlimited
  storageLimitMb: number;
  features: string[];
  badgeColor?: string;
  isPopular?: boolean;
  isActive: boolean;
}

export interface SettlementDetails {
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  branchName?: string;
  upiId?: string;
  updatedAt?: string;
}

export interface SupportTicket {
  id: string;
  tenantId?: string;
  name: string;
  mobileNumber: string;
  whatsAppNumber?: string;
  email?: string;
  subject: string;
  message: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  createdAt: string;
}

export interface TenantWorkspace {
  id: string;
  companyName: string;
  ownerName: string;
  ownerEmail: string;
  phone: string;
  planId: string;
  planName: string;
  status: TenantStatus;
  customerLimit: number;
  loanLimit: number;
  validUntil: string; // ISO date string
  createdAt: string;
  address?: string;
  businessType?: string;
  upiId?: string;
  usePlatformUpi?: boolean;
  platformUpiAcceptedTc?: boolean;
  settlementDetails?: SettlementDetails;
  currency: CurrencySymbol;
  timeZone?: string;
  logoUrl?: string;
  defaultReminderMessage?: string;
  isSetupComplete: boolean;
  customerCount?: number;
  txnCount?: number;
}

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  tenantId: string;
  phone?: string;
  status: 'ACTIVE' | 'DISABLED';
  createdAt: string;
}

export interface Invoice {
  id: string;
  tenantId: string;
  companyName: string;
  amount: number;
  currency: CurrencySymbol;
  planId: string;
  planName: string;
  status: 'PAID' | 'PENDING' | 'FAILED' | 'REFUNDED';
  paymentMethod: string;
  date: string;
  transactionRef: string;
  periodStart?: string;
  periodEnd?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  targetPlan?: string;
  targetTenantId?: string;
  createdAt: string;
  createdBy: string;
  priority?: 'HIGH' | 'NORMAL' | 'URGENT';
}

export interface Transaction {
  id: string;
  tenantId?: string;
  customerId: string;
  type: TransactionType;
  amount: number;
  date: string; // ISO String
  description: string;
  paymentMode: PaymentMode;
  receiptUrl?: string;
  createdByName?: string;
}

export interface Customer {
  id: string;
  tenantId?: string;
  name: string;
  phone: string;
  alternatePhone?: string;
  photoUrl?: string;
  address?: string;
  notes?: string;
  dateAdded: string; // ISO string
  lastUpdated?: string; // ISO string
  isArchived?: boolean;
}

export interface PaymentClaim {
  id: string;
  tenantId?: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  amount: number;
  utrNumber: string;
  date: string;
  screenshotUrl?: string;
  status: ClaimStatus;
  rejectionReason?: string;
}

export interface AppSettings {
  tenantId?: string;
  // Firebase
  firebaseProjectId: string;
  firebaseApiKey: string;
  firebaseAuthMethod: 'phone' | 'google' | 'email';
  databaseType: 'firestore' | 'realtime' | 'local';
  storageBucket: string;
  
  // UPI & Payments
  upiId: string;
  preferredUpiApp: 'Any' | 'PhonePe' | 'Google Pay' | 'Paytm' | 'BHIM';
  
  // Business / Admin
  appName: string;
  packageName: string;
  adminName: string;
  adminPhone: string;
  currency: CurrencySymbol;
  language: string;
  timeZone: string;
  country: string;
  
  // Branding & Theme
  primaryColor: string;
  secondaryColor: string;
  logoUrl?: string;
  darkMode: 'system' | 'light' | 'dark';
  
  // WhatsApp
  whatsAppType: 'Business' | 'Personal';
  defaultReminderMessage: string;
  
  // Backup & Notifications
  autoBackup: boolean;
  notificationPreference: 'all' | 'important' | 'none';
  backupFrequency: 'daily' | 'weekly' | 'manual';
}

export interface NotificationItem {
  id: string;
  tenantId?: string;
  title: string;
  message: string;
  category: 'PAYMENT_RECEIVED' | 'LOAN_DUE' | 'SUBSCRIPTION_EXPIRY' | 'SUBSCRIPTION_ACTIVATED' | 'SYSTEM' | 'SETTLEMENT';
  isRead: boolean;
  date: string;
  actionUrl?: string;
}

export interface CustomerSummary extends Customer {
  totalLoanGiven: number;
  totalMoneyReceived: number;
  remainingDue: number;
  lastTransactionDate?: string;
  paymentPercentage: number;
}
