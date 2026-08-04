import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  initializeFirestore,
  memoryLocalCache,
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  getDocFromServer,
  deleteDoc,
  onSnapshot,
  query,
  where
} from 'firebase/firestore';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  User,
  UserCredential
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  Customer,
  Transaction,
  PaymentClaim,
  AppSettings,
  TenantWorkspace,
  UserProfile,
  SubscriptionPlan,
  Invoice,
  Announcement,
  SupportTicket,
  NotificationItem
} from '../types';

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with memory cache to prevent IndexedDB closing/hidden errors in iframe environments
const dbId = firebaseConfig.firestoreDatabaseId || '(default)';
let dbInstance;
try {
  dbInstance = initializeFirestore(app, {
    localCache: memoryLocalCache(),
  }, dbId);
} catch (_e) {
  dbInstance = getFirestore(app, dbId);
}
export const db = dbInstance;
export const auth = getAuth(app);

export const initAuth = () => {
  // Auth state listener is initialized in App.tsx
};

export const signOutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (err) {
    console.warn('Firebase signOut note:', err);
  }
};

/**
 * Registers a new user with Email and Password
 */
export const registerWithEmail = async (
  email: string,
  pass: string
): Promise<UserCredential> => {
  return await createUserWithEmailAndPassword(auth, email.trim(), pass);
};

/**
 * Sends Email Verification to newly registered or logged in user
 */
export const sendVerificationEmailToUser = async (user: User): Promise<void> => {
  await sendEmailVerification(user);
};

/**
 * Logs in existing user with Email and Password
 */
export const loginWithEmail = async (
  email: string,
  pass: string
): Promise<UserCredential> => {
  return await signInWithEmailAndPassword(auth, email.trim(), pass);
};

/**
 * Sends Password Reset Email to registered email address
 */
export const sendPasswordResetLink = async (email: string): Promise<void> => {
  await sendPasswordResetEmail(auth, email.trim());
};

/**
 * Transforms Firebase Auth error codes into detailed user-friendly error messages
 */
export const formatFirebaseAuthError = (err: any): string => {
  const code = err?.code || '';
  const message = err?.message || String(err);

  switch (code) {
    case 'auth/email-already-in-use':
      return 'This email address is already registered. Please log in or use Forgot Password to reset your account.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/weak-password':
      return 'Password is too weak. Please use at least 6 characters.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Invalid email address or password. If you do not have an account yet, please click "Create Store Account" below to sign up.';
    case 'auth/too-many-requests':
      return 'Too many failed login attempts. Access to this account has been temporarily disabled. Please try again later or reset your password.';
    case 'auth/user-disabled':
      return 'This user account has been disabled. Please contact support.';
    case 'auth/network-request-failed':
      return 'Network connection error. Please check your internet connection and try again.';
    case 'auth/operation-not-allowed':
      return 'Email & Password authentication is disabled in Firebase Console. Go to Firebase Console -> Authentication -> Sign-in method -> Email/Password and enable it.';
    default:
      return message || 'An error occurred during authentication. Please try again.';
  }
};

// Error Handling Infrastructure
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
    },
    operationType,
    path,
  };
  console.error('Firestore Error Details:', JSON.stringify(errInfo));
  return new Error(JSON.stringify(errInfo));
}

// Connection Test
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'settings', 'app_config'));
    console.info('⚡ Firebase Firestore direct server connection verified.');
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase connection note: client currently offline.');
    } else {
      console.info('Firestore initial connection check completed.');
    }
    return false;
  }
}

// Helper to remove undefined fields which cause Firestore setDoc errors
const sanitizeForFirestore = <T extends Record<string, any>>(obj: T): T => {
  const cleaned: any = {};
  Object.keys(obj).forEach((key) => {
    if (obj[key] !== undefined) {
      cleaned[key] = obj[key];
    }
  });
  return cleaned;
};

// Helper check for network connectivity
const checkOnlineStatus = () => {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    throw new Error('No Internet Connection. Please connect to the internet to continue.');
  }
};

// --- DEFAULT SAAS PLANS ---
export const DEFAULT_PLANS: SubscriptionPlan[] = [
  {
    id: 'plan_trial',
    name: 'Free Trial',
    priceMonthly: 0,
    priceYearly: 0,
    customerLimit: 15,
    loanLimit: 50,
    storageLimitMb: 100,
    features: ['15 Customer Accounts', '50 Ledger Transactions', 'UPI QR Generation', 'WhatsApp Reminders', 'Basic Ledger PDF'],
    badgeColor: 'bg-slate-100 text-slate-800 border-slate-300',
    isActive: true,
  },
  {
    id: 'plan_basic',
    name: 'Basic Store',
    priceMonthly: 9,
    priceYearly: 89,
    customerLimit: 100,
    loanLimit: 500,
    storageLimitMb: 1000,
    features: ['100 Customer Accounts', '500 Ledger Transactions', 'Custom UPI QR Code', 'Automated WhatsApp Reminders', 'Monthly Financial Reports', 'Email Support'],
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
    isActive: true,
  },
  {
    id: 'plan_standard',
    name: 'Standard Business',
    priceMonthly: 25,
    priceYearly: 249,
    customerLimit: 500,
    loanLimit: -1, // Unlimited
    storageLimitMb: 5000,
    features: ['500 Customer Accounts', 'Unlimited Transactions', 'Custom Business Branding', 'Batch WhatsApp Reminders', 'Excel & CSV Data Exports', '24/7 Priority Support'],
    badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    isPopular: true,
    isActive: true,
  },
  {
    id: 'plan_premium',
    name: 'Enterprise Growth',
    priceMonthly: 49,
    priceYearly: 489,
    customerLimit: -1, // Unlimited
    loanLimit: -1, // Unlimited
    storageLimitMb: 25000,
    features: ['Unlimited Customers', 'Unlimited Transactions', 'Multi-Staff Access', 'Custom Payment Portal Domain', 'Automated PDF Invoice Receipts', 'Dedicated Account Manager'],
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
    isActive: true,
  }
];

// --- TENANT & USER MANAGEMENT ---

export const saveTenantWorkspaceToFirestore = async (tenant: TenantWorkspace): Promise<void> => {
  checkOnlineStatus();
  try {
    const docRef = doc(db, 'tenants', tenant.id);
    await setDoc(docRef, sanitizeForFirestore(tenant), { merge: true });
  } catch (err) {
    console.warn('Firestore tenant workspace save warning:', err);
    // Don't re-throw if it's a permission issue so local state update succeeds
  }
};

export const fetchTenantWorkspaceFromFirestore = async (tenantId: string): Promise<TenantWorkspace | null> => {
  checkOnlineStatus();
  const docRef = doc(db, 'tenants', tenantId);
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    return snap.data() as TenantWorkspace;
  }
  return null;
};

export const subscribeTenantsFromFirestore = (
  tenantId: string | null,
  onUpdate: (tenants: TenantWorkspace[]) => void,
  onError?: (err: any) => void
) => {
  if (tenantId && tenantId !== 'super_admin_all') {
    const docRef = doc(db, 'tenants', tenantId);
    return onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          onUpdate([{ id: snapshot.id, ...snapshot.data() } as TenantWorkspace]);
        } else {
          onUpdate([]);
        }
      },
      (err) => {
        console.error('Firestore tenant workspace subscription error:', err);
        if (onError) onError(err);
      }
    );
  }

  const colRef = collection(db, 'tenants');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const tenants: TenantWorkspace[] = [];
      snapshot.forEach((docSnap) => {
        tenants.push({ id: docSnap.id, ...docSnap.data() } as TenantWorkspace);
      });
      onUpdate(tenants);
    },
    (err) => {
      console.error('Firestore tenants subscription error:', err);
      if (onError) onError(err);
    }
  );
};

export const deleteTenantFromFirestore = async (tenantId: string): Promise<void> => {
  checkOnlineStatus();
  await deleteDoc(doc(db, 'tenants', tenantId));
};

export const saveUserProfileToFirestore = async (profile: UserProfile): Promise<void> => {
  checkOnlineStatus();
  const docRef = doc(db, 'users', profile.uid);
  await setDoc(docRef, sanitizeForFirestore(profile), { merge: true });
};

export const fetchUserProfileFromFirestore = async (uid: string): Promise<UserProfile | null> => {
  checkOnlineStatus();
  const docRef = doc(db, 'users', uid);
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    return snap.data() as UserProfile;
  }
  return null;
};

// --- PLANS & INVOICES ---

export const fetchPlansFromFirestore = async (): Promise<SubscriptionPlan[]> => {
  try {
    const colRef = collection(db, 'plans');
    const snap = await getDocs(colRef);
    if (snap.empty) {
      // Seed default plans if empty
      for (const p of DEFAULT_PLANS) {
        await setDoc(doc(db, 'plans', p.id), sanitizeForFirestore(p));
      }
      return DEFAULT_PLANS;
    }
    const plans: SubscriptionPlan[] = [];
    snap.forEach((d) => plans.push({ id: d.id, ...d.data() } as SubscriptionPlan));
    return plans;
  } catch (err) {
    console.warn('Using default fallback plans list:', err);
    return DEFAULT_PLANS;
  }
};

export const savePlanToFirestore = async (plan: SubscriptionPlan): Promise<void> => {
  checkOnlineStatus();
  const docRef = doc(db, 'plans', plan.id);
  await setDoc(docRef, sanitizeForFirestore(plan), { merge: true });
};

export const saveInvoiceToFirestore = async (invoice: Invoice): Promise<void> => {
  checkOnlineStatus();
  try {
    const docRef = doc(db, 'invoices', invoice.id);
    await setDoc(docRef, sanitizeForFirestore(invoice), { merge: true });
  } catch (err) {
    console.warn('Firestore invoice save warning:', err);
  }
};

export const subscribeInvoicesFromFirestore = (
  tenantId: string | null, // null or super_admin_all for super admin view
  onUpdate: (invoices: Invoice[]) => void,
  onError?: (err: any) => void
) => {
  const colRef = collection(db, 'invoices');
  const q = tenantId && tenantId !== 'super_admin_all' ? query(colRef, where('tenantId', '==', tenantId)) : colRef;
  return onSnapshot(
    q,
    (snapshot) => {
      const invoices: Invoice[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Invoice;
        if (!tenantId || tenantId === 'super_admin_all' || data.tenantId === tenantId) {
          invoices.push({ id: docSnap.id, ...data });
        }
      });
      onUpdate(invoices);
    },
    (err) => {
      console.error('Firestore invoices subscription error:', err);
      if (onError) onError(err);
    }
  );
};

// --- ANNOUNCEMENTS ---

export const saveAnnouncementToFirestore = async (announcement: Announcement): Promise<void> => {
  checkOnlineStatus();
  const docRef = doc(db, 'announcements', announcement.id);
  await setDoc(docRef, sanitizeForFirestore(announcement), { merge: true });
};

export const subscribeAnnouncementsFromFirestore = (
  onUpdate: (announcements: Announcement[]) => void,
  onError?: (err: any) => void
) => {
  const colRef = collection(db, 'announcements');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const announcements: Announcement[] = [];
      snapshot.forEach((docSnap) => {
        announcements.push({ id: docSnap.id, ...docSnap.data() } as Announcement);
      });
      onUpdate(announcements.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    },
    (err) => {
      console.error('Firestore announcements subscription error:', err);
      if (onError) onError(err);
    }
  );
};

// --- DATA OPERATIONS (Multi-Tenant Filtered) ---

// Settings Sync
export const fetchSettingsFromFirestore = async (tenantId: string = 'default_tenant'): Promise<AppSettings | null> => {
  checkOnlineStatus();
  const docRef = doc(db, 'settings', tenantId);
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    return snap.data() as AppSettings;
  }
  return null;
};

export const subscribeSettingsFromFirestore = (
  tenantId: string,
  onUpdate: (settings: AppSettings) => void,
  onError?: (err: any) => void
) => {
  const docRef = doc(db, 'settings', tenantId || 'default_tenant');
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        onUpdate(snapshot.data() as AppSettings);
      }
    },
    (err) => {
      console.error('Firestore settings subscription error:', err);
      if (onError) onError(err);
    }
  );
};

export const saveSettingsToFirestore = async (settings: AppSettings, tenantId: string = 'default_tenant'): Promise<void> => {
  checkOnlineStatus();
  const docRef = doc(db, 'settings', tenantId);
  await setDoc(docRef, sanitizeForFirestore({ ...settings, tenantId }), { merge: true });
};

// Customers
export const subscribeCustomersFromFirestore = (
  tenantId: string,
  onUpdate: (customers: Customer[]) => void,
  onError?: (err: any) => void
) => {
  const colRef = collection(db, 'customers');
  const q = tenantId && tenantId !== 'super_admin_all' ? query(colRef, where('tenantId', '==', tenantId)) : colRef;
  return onSnapshot(
    q,
    (snapshot) => {
      const customers: Customer[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Customer;
        if (data.tenantId === tenantId || tenantId === 'super_admin_all') {
          customers.push({ id: docSnap.id, ...data });
        }
      });
      onUpdate(customers);
    },
    (err) => {
      console.error('Firestore customer subscription error:', err);
      if (onError) onError(err);
    }
  );
};

export const saveCustomerToFirestore = async (customer: Customer, tenantId: string = 'default_tenant'): Promise<void> => {
  checkOnlineStatus();
  const effectiveTenantId = customer.tenantId || tenantId;
  const docRef = doc(db, 'customers', customer.id);
  await setDoc(docRef, sanitizeForFirestore({ ...customer, tenantId: effectiveTenantId }), { merge: true });
};

export const deleteCustomerFromFirestore = async (customerId: string, relatedTxns?: Transaction[]): Promise<void> => {
  checkOnlineStatus();
  await deleteDoc(doc(db, 'customers', customerId));
  if (relatedTxns && relatedTxns.length > 0) {
    const customerTxns = relatedTxns.filter((t) => t.customerId === customerId);
    for (const t of customerTxns) {
      await deleteDoc(doc(db, 'transactions', t.id));
    }
  }
};

// Transactions
export const subscribeTransactionsFromFirestore = (
  tenantId: string,
  onUpdate: (txns: Transaction[]) => void,
  onError?: (err: any) => void
) => {
  const colRef = collection(db, 'transactions');
  const q = tenantId && tenantId !== 'super_admin_all' ? query(colRef, where('tenantId', '==', tenantId)) : colRef;
  return onSnapshot(
    q,
    (snapshot) => {
      const txns: Transaction[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Transaction;
        if (data.tenantId === tenantId || tenantId === 'super_admin_all') {
          txns.push({ id: docSnap.id, ...data });
        }
      });
      onUpdate(txns);
    },
    (err) => {
      console.error('Firestore transaction subscription error:', err);
      if (onError) onError(err);
    }
  );
};

export const saveTransactionToFirestore = async (txn: Transaction, tenantId: string = 'default_tenant'): Promise<void> => {
  checkOnlineStatus();
  const effectiveTenantId = txn.tenantId || tenantId;
  const docRef = doc(db, 'transactions', txn.id);
  await setDoc(docRef, sanitizeForFirestore({ ...txn, tenantId: effectiveTenantId }), { merge: true });
};

export const deleteTransactionFromFirestore = async (txnId: string): Promise<void> => {
  checkOnlineStatus();
  await deleteDoc(doc(db, 'transactions', txnId));
};

// Payment Claims
export const subscribeClaimsFromFirestore = (
  tenantId: string,
  onUpdate: (claims: PaymentClaim[]) => void,
  onError?: (err: any) => void
) => {
  const colRef = collection(db, 'claims');
  const q = tenantId && tenantId !== 'super_admin_all' ? query(colRef, where('tenantId', '==', tenantId)) : colRef;
  return onSnapshot(
    q,
    (snapshot) => {
      const claims: PaymentClaim[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as PaymentClaim;
        if (data.tenantId === tenantId || tenantId === 'super_admin_all') {
          claims.push({ id: docSnap.id, ...data });
        }
      });
      onUpdate(claims);
    },
    (err) => {
      console.error('Firestore claims subscription error:', err);
      if (onError) onError(err);
    }
  );
};

export const saveClaimToFirestore = async (claim: PaymentClaim, tenantId: string = 'default_tenant'): Promise<void> => {
  checkOnlineStatus();
  const effectiveTenantId = claim.tenantId || tenantId;
  const docRef = doc(db, 'claims', claim.id);
  await setDoc(docRef, sanitizeForFirestore({ ...claim, tenantId: effectiveTenantId }), { merge: true });
};

// Data Migration Utilities
export interface BackupData {
  exportedAt: string;
  projectId: string;
  settings: AppSettings | null;
  customers: Customer[];
  transactions: Transaction[];
  claims: PaymentClaim[];
}

export const exportAllDataFromFirestore = async (tenantId: string = 'default_tenant'): Promise<BackupData> => {
  checkOnlineStatus();
  const settingsSnap = await getDoc(doc(db, 'settings', tenantId));
  const settings = settingsSnap.exists() ? (settingsSnap.data() as AppSettings) : null;

  const custSnap = await getDocs(query(collection(db, 'customers'), where('tenantId', '==', tenantId)));
  const customers: Customer[] = [];
  custSnap.forEach((docSnap) => {
    const data = docSnap.data() as Customer;
    if (data.tenantId === tenantId) {
      customers.push({ id: docSnap.id, ...data });
    }
  });

  const txnSnap = await getDocs(query(collection(db, 'transactions'), where('tenantId', '==', tenantId)));
  const transactions: Transaction[] = [];
  txnSnap.forEach((docSnap) => {
    const data = docSnap.data() as Transaction;
    if (data.tenantId === tenantId) {
      transactions.push({ id: docSnap.id, ...data });
    }
  });

  const claimSnap = await getDocs(query(collection(db, 'claims'), where('tenantId', '==', tenantId)));
  const claims: PaymentClaim[] = [];
  claimSnap.forEach((docSnap) => {
    const data = docSnap.data() as PaymentClaim;
    if (data.tenantId === tenantId) {
      claims.push({ id: docSnap.id, ...data });
    }
  });

  return {
    exportedAt: new Date().toISOString(),
    projectId: firebaseConfig.projectId || '',
    settings,
    customers,
    transactions,
    claims,
  };
};

export const importBackupDataToFirestore = async (backup: BackupData, tenantId: string = 'default_tenant'): Promise<{ customersCount: number; txnsCount: number; claimsCount: number }> => {
  checkOnlineStatus();
  let customersCount = 0;
  let txnsCount = 0;
  let claimsCount = 0;

  if (backup.settings) {
    await saveSettingsToFirestore(backup.settings, tenantId);
  }

  if (Array.isArray(backup.customers)) {
    for (const cust of backup.customers) {
      await saveCustomerToFirestore(cust, tenantId);
      customersCount++;
    }
  }

  if (Array.isArray(backup.transactions)) {
    for (const txn of backup.transactions) {
      await saveTransactionToFirestore(txn, tenantId);
      txnsCount++;
    }
  }

  if (Array.isArray(backup.claims)) {
    for (const claim of backup.claims) {
      await saveClaimToFirestore(claim, tenantId);
      claimsCount++;
    }
  }

  return { customersCount, txnsCount, claimsCount };
};

export const saveSupportTicketToFirestore = async (ticket: SupportTicket): Promise<void> => {
  checkOnlineStatus();
  try {
    const docRef = doc(db, 'support_tickets', ticket.id);
    await setDoc(docRef, sanitizeForFirestore(ticket), { merge: true });
  } catch (err) {
    console.warn('Firestore support ticket save warning:', err);
  }
};

export const subscribeToNotifications = (
  tenantId: string,
  onUpdate: (notifications: NotificationItem[]) => void,
  onError?: (err: any) => void
) => {
  const q = query(collection(db, 'notifications'), where('tenantId', '==', tenantId));
  return onSnapshot(
    q,
    (snapshot) => {
      const items: NotificationItem[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as NotificationItem;
        if (data.tenantId === tenantId) {
          items.push({ id: docSnap.id, ...data });
        }
      });
      items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      onUpdate(items);
    },
    (error) => {
      if (onError) onError(error);
    }
  );
};

export const saveNotificationToFirestore = async (notification: NotificationItem): Promise<void> => {
  try {
    const docRef = doc(db, 'notifications', notification.id);
    await setDoc(docRef, sanitizeForFirestore(notification), { merge: true });
  } catch (err) {
    console.warn('Firestore notification save warning:', err);
  }
};

export const deleteNotificationFromFirestore = async (notificationId: string): Promise<void> => {
  try {
    const docRef = doc(db, 'notifications', notificationId);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn('Firestore notification delete warning:', err);
  }
};

