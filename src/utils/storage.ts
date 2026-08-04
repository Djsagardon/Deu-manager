import { AppSettings, Customer, Transaction, PaymentClaim, UserProfile, TenantWorkspace } from '../types';

export const DEFAULT_SETTINGS: AppSettings = {
  // Firebase
  firebaseProjectId: 'due-manager-demo',
  firebaseApiKey: 'AIzaSyDemoKeyForDueManager2026',
  firebaseAuthMethod: 'phone',
  databaseType: 'firestore',
  storageBucket: 'due-manager-demo.appspot.com',

  // UPI & Payment
  upiId: '',
  preferredUpiApp: 'PhonePe',

  // Business & Admin
  appName: 'Due Manager',
  packageName: 'com.duemanager.app',
  adminName: 'Sagar Enterprise',
  adminPhone: '+91 98765 43210',
  currency: '₹',
  language: 'English',
  timeZone: 'Asia/Kolkata (IST)',
  country: 'India',

  // Branding & Theme
  primaryColor: '#2563EB',
  secondaryColor: '#10B981',
  logoUrl: '',
  darkMode: 'system',

  // WhatsApp
  whatsAppType: 'Business',
  defaultReminderMessage: `Hello {CustomerName},\n\nAccording to our records at {StoreName}, your pending amount is {Currency}{Amount}.\n\nPlease complete your payment using our UPI QR Code or click below to submit your payment transaction ID:\n{PayLink}\n\nUPI ID: {UpiId}\n\nThank you for your business!\nRegards,\n{StoreName}`,

  // Backup & Notifications
  autoBackup: false,
  notificationPreference: 'all',
  backupFrequency: 'daily',
};

const STORAGE_KEYS = {
  SETTINGS: 'due_manager_settings',
  ONBOARDED: 'due_manager_onboarded',
  USER_PROFILE: 'due_manager_user_profile',
  CURRENT_TENANT: 'due_manager_current_tenant',
  AUTH_TOKEN: 'due_manager_auth_token',
};

export function getStoredUserProfile(): UserProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function getStoredCurrentTenant(): TenantWorkspace | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_TENANT);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function saveAuthSession(userProfile: UserProfile, tenant: TenantWorkspace, token?: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(userProfile));
    localStorage.setItem(STORAGE_KEYS.CURRENT_TENANT, JSON.stringify(tenant));
    if (token) {
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
    }
  } catch (e) {
    console.warn('Failed to save auth session:', e);
  }
}

export function clearAuthSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_TENANT);
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.clear();
    }
  } catch (e) {
    console.warn('Failed to clear auth session:', e);
  }
}

export function getStoredSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (e) {
    return DEFAULT_SETTINGS;
  }
}

export function saveStoredSettings(settings: AppSettings): void {
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
}

// Live Firebase synchronization mode - No local persistence or offline caching for business records
export function getStoredCustomers(): Customer[] {
  return [];
}

export function saveStoredCustomers(_customers: Customer[]): void {
  // Disabled: Live Firebase synchronization mode only. No local cache writes.
}

export function getStoredTransactions(): Transaction[] {
  return [];
}

export function saveStoredTransactions(_transactions: Transaction[]): void {
  // Disabled: Live Firebase synchronization mode only. No local cache writes.
}

export function getStoredClaims(): PaymentClaim[] {
  return [];
}

export function saveStoredClaims(_claims: PaymentClaim[]): void {
  // Disabled: Live Firebase synchronization mode only. No local cache writes.
}

export function checkIsOnboarded(): boolean {
  return localStorage.getItem(STORAGE_KEYS.ONBOARDED) === 'true';
}

export function setOnboarded(val: boolean): void {
  localStorage.setItem(STORAGE_KEYS.ONBOARDED, val ? 'true' : 'false');
}
