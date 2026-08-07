import React, { useState, useEffect } from 'react';
import { Wallet, Sparkles, ArrowRight } from 'lucide-react';
import { SplashScreen } from './components/SplashScreen';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { CustomerList } from './components/CustomerList';
import { CustomerDetail } from './components/CustomerDetail';
import { PaymentPortal } from './components/PaymentPortal';
import { Reports } from './components/Reports';
import { SettingsModal } from './components/SettingsModal';
import { FirstProfileSetupModal } from './components/FirstProfileSetupModal';
import { AddCustomerModal } from './components/AddCustomerModal';
import { AddTransactionModal } from './components/AddTransactionModal';
import { QrCodeModal } from './components/QrCodeModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { WhatsAppReminderModal } from './components/WhatsAppReminderModal';

// SaaS Commercial Extensions
import { EmailAuthModal } from './components/Auth/EmailAuthModal';
import { LogoutConfirmModal } from './components/Auth/LogoutConfirmModal';
import { PricingModal } from './components/Subscription/PricingModal';
import { CheckoutModal } from './components/Subscription/CheckoutModal';
import { SuperAdminPanel } from './components/SuperAdmin/SuperAdminPanel';
import { NotificationsModal } from './components/NotificationsModal';
import { InvoicesListModal } from './components/Billing/InvoicesListModal';
import { AndroidBottomNav } from './components/Navigation/AndroidBottomNav';
import { AndroidSettings } from './components/Settings/AndroidSettings';
import { FullScreenSubscription } from './components/Subscription/FullScreenSubscription';

import { MandatoryUpiModal } from './components/MandatoryUpiModal';
import { NotificationsCenterModal } from './components/NotificationsCenterModal';
import { PublicCustomerPaymentPage } from './components/PublicCustomerPaymentPage';

import {
  AppSettings,
  Customer,
  Transaction,
  PaymentClaim,
  CustomerSummary,
  TransactionType,
  UserProfile,
  TenantWorkspace,
  SubscriptionPlan,
  Invoice,
  Announcement,
  NotificationItem
} from './types';

import {
  getStoredSettings,
  saveStoredSettings,
  checkIsOnboarded,
  setOnboarded,
  getStoredUserProfile,
  getStoredCurrentTenant,
  saveAuthSession,
  clearAuthSession
} from './utils/storage';

import {
  calculateAllCustomerSummaries,
  calculateDashboardStats
} from './utils/calculator';

import {
  sendWhatsAppReminderWithQr
} from './utils/upi';

import {
  initAuth,
  signOutUser,
  auth,
  subscribeCustomersFromFirestore,
  subscribeTransactionsFromFirestore,
  subscribeClaimsFromFirestore,
  subscribeSettingsFromFirestore,
  saveCustomerToFirestore,
  saveTransactionToFirestore,
  saveClaimToFirestore,
  saveSettingsToFirestore,
  saveTenantWorkspaceToFirestore,
  saveUserProfileToFirestore,
  fetchUserProfileFromFirestore,
  fetchTenantWorkspaceFromFirestore,
  deleteCustomerFromFirestore,
  deleteTransactionFromFirestore,
  subscribeToNotifications,
  saveNotificationToFirestore,
  deleteNotificationFromFirestore
} from './utils/firebase';
import { onAuthStateChanged } from 'firebase/auth';

// Initial Commercial SaaS Plans Data (INR - ₹)
const INITIAL_PLANS: SubscriptionPlan[] = [
  {
    id: 'plan_trial',
    name: '15-Day Free Trial',
    priceMonthly: 0,
    priceYearly: 0,
    customerLimit: 15,
    loanLimit: 50,
    storageLimitMb: 100,
    features: ['Up to 15 Customer Accounts', '50 Ledger Entries', 'UPI QR Generation', 'WhatsApp Reminders'],
    isPopular: false,
    isActive: true,
  },
  {
    id: 'plan_basic',
    name: 'Basic Store',
    priceMonthly: 299,
    priceYearly: 2999,
    customerLimit: 100,
    loanLimit: 500,
    storageLimitMb: 1000,
    features: ['Up to 100 Customer Accounts', '500 Ledger Entries/mo', 'Auto Payment Claims Sync', 'Download PDF Reports'],
    isPopular: false,
    isActive: true,
  },
  {
    id: 'plan_standard',
    name: 'Standard Business',
    priceMonthly: 599,
    priceYearly: 5999,
    customerLimit: 500,
    loanLimit: -1,
    storageLimitMb: 5000,
    features: ['Up to 500 Customer Accounts', 'Unlimited Transactions', 'Automated WhatsApp Reminders', 'Multi-staff Access', 'Excel & PDF Export'],
    isPopular: true,
    isActive: true,
  },
  {
    id: 'plan_enterprise',
    name: 'Premium Growth',
    priceMonthly: 999,
    priceYearly: 9999,
    customerLimit: 2000,
    loanLimit: -1,
    storageLimitMb: 25000,
    features: ['Up to 2,000 Customers', 'Unlimited Loan Entries', 'Custom Branding & Logo', '24/7 Priority Support', 'Audit Logs & API Access'],
    isPopular: false,
    isActive: true,
  },
];

export default function App() {
  // Application State - Strict Live Firebase Synchronization Only
  const [settings, setSettings] = useState<AppSettings>(getStoredSettings);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [claims, setClaims] = useState<PaymentClaim[]>([]);

  // SaaS Multi-Tenant Engine State
  const [userProfile, setUserProfile] = useState<UserProfile | null>(getStoredUserProfile);
  const [currentTenant, setCurrentTenant] = useState<TenantWorkspace | null>(getStoredCurrentTenant);

  const [plans, setPlans] = useState<SubscriptionPlan[]>(INITIAL_PLANS);

  const [allTenants, setAllTenants] = useState<TenantWorkspace[]>([
    {
      id: 'tenant_demo_store',
      companyName: 'Sagar Traders & Enterprise',
      ownerName: 'Demo Store Owner',
      ownerEmail: 'store_owner@demo.com',
      phone: '+91 98765 43210',
      planId: 'plan_standard',
      planName: 'Standard Business',
      status: 'ACTIVE',
      customerLimit: 500,
      loanLimit: -1,
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      currency: '₹',
      isSetupComplete: true,
    },
    {
      id: 'tenant_apex',
      companyName: 'Apex General Store',
      ownerName: 'Rajesh Kumar',
      ownerEmail: 'rajesh@apex.com',
      phone: '+91 91234 56789',
      planId: 'plan_basic',
      planName: 'Basic Store',
      status: 'ACTIVE',
      customerLimit: 100,
      loanLimit: 500,
      validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      currency: '₹',
      isSetupComplete: true,
    },
  ]);

  const [invoices, setInvoices] = useState<Invoice[]>([
    {
      id: 'INV_1001',
      tenantId: 'tenant_demo_store',
      companyName: 'Sagar Traders & Enterprise',
      amount: 19,
      currency: '₹',
      planId: 'plan_standard',
      planName: 'Standard Business',
      status: 'PAID',
      paymentMethod: 'Credit Card (Razorpay)',
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      transactionRef: 'TXN_PG_987212',
    },
  ]);

  const [announcements, setAnnouncements] = useState<Announcement[]>([
    {
      id: 'ann_1',
      title: 'Welcome to Multi-Tenant Commercial SaaS Platform!',
      content: 'Your company ledger workspace is completely isolated and secure. Upgrade your plan anytime to unlock unlimited customer capacity.',
      createdAt: new Date().toISOString(),
      createdBy: 'Super Admin',
    },
  ]);

  // SaaS Modals State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(() => !getStoredUserProfile());
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState<boolean>(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [selectedCheckoutPlan, setSelectedCheckoutPlan] = useState<SubscriptionPlan | null>(null);
  const [checkoutBillingCycle, setCheckoutBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [isSuperAdminOpen, setIsSuperAdminOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isInvoicesOpen, setIsInvoicesOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isMandatoryUpiOpen, setIsMandatoryUpiOpen] = useState(false);

  // Network Connectivity
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Active View Tab
  const [activeTab, setActiveTab] = useState<'dashboard' | 'customers' | 'claims' | 'reports' | 'settings' | 'subscription'>('dashboard');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  // Modals Visibility
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSetupWizardOpen, setIsSetupWizardOpen] = useState(false);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
  const [defaultTxnType, setDefaultTxnType] = useState<TransactionType>('LOAN_GIVEN');
  const [defaultTxnCustomerId, setDefaultTxnCustomerId] = useState<string | undefined>(undefined);
  const [qrModalCustomer, setQrModalCustomer] = useState<CustomerSummary | null>(null);
  const [reminderCustomer, setReminderCustomer] = useState<CustomerSummary | null>(null);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState<boolean>(false);
  const [txnToDelete, setTxnToDelete] = useState<Transaction | null>(null);

  // Splash Screen & Silent Background Data Preloading
  const [isSplashLoading, setIsSplashLoading] = useState<boolean>(true);
  const [splashStatus, setSplashStatus] = useState<string>('Initializing Due Manager...');
  const [isAuthChecked, setIsAuthChecked] = useState<boolean>(false);

  // Public Customer Payment View Detection
  const [isPublicPaymentView] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    return params.get('mode') === 'pay' || params.has('customerPhone') || params.has('phone');
  });
  const [publicPaymentPhone] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    const params = new URLSearchParams(window.location.search);
    return params.get('phone') || params.get('customerPhone') || '';
  });

  // Dark Mode State
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    saveStoredSettings(settings);
    if (isOnline) {
      saveSettingsToFirestore(settings).catch((err) =>
        console.warn('Settings live sync note:', err)
      );
    }
  }, [settings, isOnline]);

  const [hasPermissionNotice, setHasPermissionNotice] = useState<boolean>(false);

  // Auto Login Check & Auth Listener
  useEffect(() => {
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setSplashStatus('Loading Profile & Store Ledger...');
        try {
          const fetchedProfile = await fetchUserProfileFromFirestore(firebaseUser.uid);
          const tenantId = fetchedProfile?.tenantId || `tenant_${firebaseUser.uid}`;
          const fetchedTenant = await fetchTenantWorkspaceFromFirestore(tenantId);
          if (fetchedProfile) {
            setUserProfile(fetchedProfile);
          }
          if (fetchedTenant) {
            setCurrentTenant(fetchedTenant);
            if (fetchedProfile) {
              saveAuthSession(fetchedProfile, fetchedTenant);
            }
          }
        } catch (err) {
          console.warn('Error syncing profile from Firestore on auth change:', err);
        }
      } else {
        const storedUser = getStoredUserProfile();
        if (!storedUser) {
          setUserProfile(null);
          setCurrentTenant(null);
          setIsAuthModalOpen(true);
        }
      }
      setIsAuthChecked(true);
    });
    return () => unsubscribe();
  }, []);

  // Splash Screen Preloader Dismissal Handler
  useEffect(() => {
    if (!isAuthChecked) return;

    if (!userProfile && !currentTenant) {
      setIsSplashLoading(false);
      return;
    }

    setSplashStatus('Preparing Dashboard Statistics...');
    const timer = setTimeout(() => {
      setIsSplashLoading(false);
    }, 900);

    return () => clearTimeout(timer);
  }, [isAuthChecked, userProfile, currentTenant]);

  // Logout Handlers
  const handleRequestLogout = () => {
    setIsLogoutConfirmOpen(true);
  };

  const performLogout = async () => {
    setIsLogoutConfirmOpen(false);
    try {
      await signOutUser();
    } catch (err) {
      console.warn('Sign out note:', err);
    }

    clearAuthSession();
    setUserProfile(null);
    setCurrentTenant(null);
    setCustomers([]);
    setTransactions([]);
    setClaims([]);
    setSelectedCustomerId(null);
    setActiveTab('dashboard');

    // Close all open modals
    setIsSettingsOpen(false);
    setIsAddCustomerOpen(false);
    setIsAddTransactionOpen(false);
    setIsPricingModalOpen(false);
    setIsCheckoutModalOpen(false);
    setIsSuperAdminOpen(false);
    setIsNotificationsOpen(false);
    setIsInvoicesOpen(false);

    // Open Login / Sign Up Screen
    setIsAuthModalOpen(true);

    // Reset history state so back button cannot re-enter protected screens
    if (typeof window !== 'undefined' && window.history) {
      window.history.replaceState(null, '', window.location.pathname);
    }

    showToast('Logged out successfully');
  };

  // Subscribe to Firestore using Tenant ID Isolation
  useEffect(() => {
    if (!userProfile || !currentTenant) {
      setCustomers([]);
      setTransactions([]);
      setClaims([]);
      return;
    }

    initAuth();
    const tenantId = currentTenant.id;

    const handleSyncError = (err: any, source: string) => {
      const msg = err?.message || String(err);
      if (msg.includes('permission') || msg.includes('Permission') || err?.code === 'permission-denied') {
        setHasPermissionNotice(true);
      } else {
        showToast(`⚠️ ${source} sync notice: ${msg}`);
      }
    };

    const unsubCustomers = subscribeCustomersFromFirestore(
      tenantId,
      (firestoreCustomers) => {
        setCustomers(firestoreCustomers);
        setHasPermissionNotice(false);
      },
      (err) => handleSyncError(err, 'Customer')
    );

    const unsubTxns = subscribeTransactionsFromFirestore(
      tenantId,
      (firestoreTxns) => {
        setTransactions(firestoreTxns);
        setHasPermissionNotice(false);
      },
      (err) => handleSyncError(err, 'Transaction')
    );

    const unsubClaims = subscribeClaimsFromFirestore(
      tenantId,
      (firestoreClaims) => {
        setClaims(firestoreClaims);
        setHasPermissionNotice(false);
      },
      (err) => handleSyncError(err, 'Claims')
    );

    const unsubSettings = subscribeSettingsFromFirestore(
      tenantId,
      (firestoreSettings) => {
        if (firestoreSettings) {
          setSettings(firestoreSettings);
          setHasPermissionNotice(false);
        }
      },
      (err) => {
        const msg = err?.message || String(err);
        if (msg?.includes('permission') || err?.code === 'permission-denied') {
          setHasPermissionNotice(true);
        }
      }
    );

    const unsubNotifications = subscribeToNotifications(
      tenantId,
      (items) => {
        setNotifications(items);
      },
      (err) => console.warn('Notification sync note:', err)
    );

    return () => {
      if (unsubCustomers) unsubCustomers();
      if (unsubTxns) unsubTxns();
      if (unsubClaims) unsubClaims();
      if (unsubSettings) unsubSettings();
      if (unsubNotifications) unsubNotifications();
    };
  }, [currentTenant?.id, userProfile]);

  // Mandatory UPI Check Effect
  useEffect(() => {
    if (userProfile && currentTenant) {
      const tenantUpi = currentTenant.upiId ? currentTenant.upiId.trim() : '';
      const settingsUpi = settings.upiId ? settings.upiId.trim() : '';
      if (!tenantUpi && !settingsUpi) {
        setIsMandatoryUpiOpen(true);
      } else {
        setIsMandatoryUpiOpen(false);
      }
    }
  }, [userProfile, currentTenant?.upiId, settings.upiId]);

  const handleSaveMandatoryUpi = async (newUpiId: string) => {
    const updatedSettings = { ...settings, upiId: newUpiId };
    setSettings(updatedSettings);
    saveStoredSettings(updatedSettings);
    if (isOnline) {
      await saveSettingsToFirestore(updatedSettings).catch(console.warn);
    }

    if (currentTenant) {
      const updatedTenant = { ...currentTenant, upiId: newUpiId };
      setCurrentTenant(updatedTenant);
      saveAuthSession(userProfile!, updatedTenant);
      if (isOnline) {
        await saveTenantWorkspaceToFirestore(updatedTenant).catch(console.warn);
      }
    }

    setIsMandatoryUpiOpen(false);
    showToast('✅ Mandatory Store UPI ID saved and verified!');
  };

  const handleMarkNotificationAsRead = async (id: string) => {
    const item = notifications.find((n) => n.id === id);
    if (item) {
      const updated = { ...item, isRead: true };
      setNotifications((prev) => prev.map((n) => (n.id === id ? updated : n)));
      if (isOnline) await saveNotificationToFirestore(updated);
    }
  };

  const handleMarkAllNotificationsAsRead = async () => {
    const updated = notifications.map((n) => ({ ...n, isRead: true }));
    setNotifications(updated);
    if (isOnline) {
      for (const item of updated) {
        await saveNotificationToFirestore(item);
      }
    }
    showToast('All notifications marked as read.');
  };

  const handleDeleteNotification = async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (isOnline) await deleteNotificationFromFirestore(id);
  };

  const handleClearAllNotifications = async () => {
    const toDelete = [...notifications];
    setNotifications([]);
    if (isOnline) {
      for (const n of toDelete) {
        await deleteNotificationFromFirestore(n.id);
      }
    }
    showToast('Notification history cleared.');
  };

  const handleTestPushNotification = async () => {
    const tenantId = currentTenant?.id || 'tenant_demo_store';
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      tenantId,
      title: '🔔 Test Payment Received',
      message: 'Payment received of ₹1,500 via UPI QR Code from customer Rohan Sharma.',
      category: 'PAYMENT_RECEIVED',
      isRead: false,
      date: new Date().toISOString(),
    };
    setNotifications((prev) => [newNotif, ...prev]);
    if (isOnline) await saveNotificationToFirestore(newNotif);
    showToast('🔔 Push alert triggered & added to Notification Center!');
  };

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 6000);
  };

  const guardOnlineOperation = (): boolean => {
    if (!isOnline || (typeof navigator !== 'undefined' && !navigator.onLine)) {
      showToast('⚠️ No Internet Connection. Please connect to the internet to perform database operations.');
      return false;
    }
    return true;
  };

  const customerSummaries = calculateAllCustomerSummaries(customers, transactions);
  const dashboardStats = calculateDashboardStats(customers, transactions);
  const pendingClaimsCount = claims.filter((c) => c.status === 'PENDING').length;
  const dueCustomersCount = customerSummaries.filter((c) => c.remainingDue > 0).length;

  const selectedCustomerSummary = selectedCustomerId
    ? customerSummaries.find((c) => c.id === selectedCustomerId) || null
    : null;

  // Tenant Limit Check
  const checkCustomerCapacityLimit = (): boolean => {
    if (!currentTenant) return true;
    if (currentTenant.customerLimit === -1) return true;
    if (customers.length >= currentTenant.customerLimit) {
      showToast(
        `⚠️ Workspace Capacity Reached! Your active plan (${currentTenant.planName}) allows maximum ${currentTenant.customerLimit} customers. Please upgrade your plan.`
      );
      setIsPricingModalOpen(true);
      return false;
    }
    return true;
  };

  const handleSaveCustomer = async (
    customerData: Omit<Customer, 'id' | 'dateAdded'>,
    editId?: string
  ) => {
    if (!guardOnlineOperation()) return;
    if (!editId && !checkCustomerCapacityLimit()) return;

    try {
      const tenantId = currentTenant?.id || 'tenant_demo_store';
      if (editId) {
        const existing = customers.find((c) => c.id === editId);
        const updatedCust: Customer = {
          id: editId,
          tenantId,
          dateAdded: existing?.dateAdded || new Date().toISOString(),
          ...customerData,
        };
        await saveCustomerToFirestore(updatedCust);
        showToast('Customer record updated successfully.');
      } else {
        const newCust: Customer = {
          ...customerData,
          id: `cust-${Date.now()}`,
          tenantId,
          dateAdded: new Date().toISOString(),
        };
        await saveCustomerToFirestore(newCust);
        showToast('New customer record saved successfully.');
      }
    } catch (error: any) {
      showToast(`❌ Operation Failed: ${error?.message || 'Could not save data'}`);
    }
  };

  const handleDeleteCustomer = async (customerId: string) => {
    if (!guardOnlineOperation()) return;

    try {
      const txnsToDelete = transactions.filter((t) => t.customerId === customerId);
      setCustomers((prev) => prev.filter((c) => c.id !== customerId));
      setTransactions((prev) => prev.filter((t) => t.customerId !== customerId));

      await deleteCustomerFromFirestore(customerId, txnsToDelete);
      if (selectedCustomerId === customerId) setSelectedCustomerId(null);
      showToast('Customer record and transaction history deleted.');
    } catch (error: any) {
      showToast(`❌ Deletion Failed: ${error?.message || 'Could not delete data'}`);
    }
  };

  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const handleAddOrEditTransaction = async (txnData: {
    id?: string;
    customerId: string;
    type: TransactionType;
    amount: number;
    description: string;
    paymentMode: any;
    date: string;
  }) => {
    if (!guardOnlineOperation()) return;

    try {
      const tenantId = currentTenant?.id || 'tenant_demo_store';
      if (txnData.id) {
        const updatedTxn: Transaction = {
          id: txnData.id,
          tenantId,
          customerId: txnData.customerId,
          type: txnData.type,
          amount: txnData.amount,
          description: txnData.description,
          paymentMode: txnData.paymentMode,
          date: txnData.date,
        };
        await saveTransactionToFirestore(updatedTxn);
        showToast('Transaction entry updated successfully.');
      } else {
        const newTxn: Transaction = {
          id: `txn-${Date.now()}`,
          tenantId,
          customerId: txnData.customerId,
          type: txnData.type,
          amount: txnData.amount,
          description: txnData.description,
          paymentMode: txnData.paymentMode,
          date: txnData.date,
        };
        await saveTransactionToFirestore(newTxn);
        showToast('New transaction entry saved successfully.');
      }
      setEditingTransaction(null);
    } catch (error: any) {
      showToast(`❌ Operation Failed: ${error?.message || 'Could not save transaction'}`);
    }
  };

  const handleDeleteTransaction = (txnId: string) => {
    const targetTxn = transactions.find((t) => t.id === txnId);
    if (targetTxn) {
      setTxnToDelete(targetTxn);
    } else {
      showToast('⚠️ Transaction entry not found.');
    }
  };

  const handleConfirmDeleteTransaction = async (txnId: string) => {
    if (!guardOnlineOperation()) return;

    setTransactions((prev) => prev.filter((t) => t.id !== txnId));

    try {
      await deleteTransactionFromFirestore(txnId);
      showToast('Transaction entry deleted permanently.');
    } catch (error: any) {
      showToast(`❌ Deletion Failed: ${error?.message || 'Could not delete entry'}`);
    } finally {
      setTxnToDelete(null);
    }
  };

  const handleSendReminder = (customer: CustomerSummary) => {
    setReminderCustomer(customer);
    setIsReminderModalOpen(true);
  };

  const handleAutoVerifyPayment = async (paymentData: {
    customerId: string;
    customerName: string;
    customerPhone: string;
    amount: number;
    utrNumber: string;
  }) => {
    if (!guardOnlineOperation()) return;

    let targetCust = customers.find((c) => c.id === paymentData.customerId);
    if (!targetCust && paymentData.customerPhone) {
      const cleanPhone = paymentData.customerPhone.replace(/\D/g, '');
      targetCust = customers.find((c) => c.phone.replace(/\D/g, '') === cleanPhone);
    }

    const assignedId = targetCust ? targetCust.id : (customers[0]?.id || 'cust-1');
    const assignedName = targetCust ? targetCust.name : paymentData.customerName;
    const tenantId = currentTenant?.id || 'tenant_demo_store';

    const newTxn: Transaction = {
      id: `txn-autoverified-${Date.now()}`,
      tenantId,
      customerId: assignedId,
      type: 'MONEY_RECEIVED',
      amount: paymentData.amount,
      date: new Date().toISOString(),
      description: `Auto-Verified UPI Payment (UTR #${paymentData.utrNumber})`,
      paymentMode: 'UPI',
    };

    const autoClaim: PaymentClaim = {
      id: `claim-auto-${Date.now()}`,
      tenantId,
      customerId: assignedId,
      customerName: assignedName,
      customerPhone: paymentData.customerPhone,
      amount: paymentData.amount,
      utrNumber: paymentData.utrNumber,
      status: 'APPROVED',
      date: new Date().toISOString(),
    };

    try {
      await saveTransactionToFirestore(newTxn);
      await saveClaimToFirestore(autoClaim);

      showToast(
        `⚡ Payment Auto-Verified! Received ${settings.currency}${paymentData.amount.toLocaleString(
          'en-IN'
        )} from ${assignedName} (UTR #${paymentData.utrNumber}). Synced successfully.`
      );
    } catch (error: any) {
      showToast(`❌ Auto Verification Sync Failed: ${error?.message || 'Sync error'}`);
    }
  };

  const handleSubmitClaim = async (claimData: Omit<PaymentClaim, 'id' | 'status' | 'date'>) => {
    if (!guardOnlineOperation()) return;

    const tenantId = currentTenant?.id || 'tenant_demo_store';
    const newClaim: PaymentClaim = {
      ...claimData,
      id: `claim-${Date.now()}`,
      tenantId,
      status: 'PENDING',
      date: new Date().toISOString(),
    };
    try {
      await saveClaimToFirestore(newClaim);
      showToast('Payment claim submitted successfully.');
    } catch (error: any) {
      showToast(`❌ Submission Failed: ${error?.message || 'Submission error'}`);
    }
  };

  const handleApproveClaim = async (claimId: string) => {
    if (!guardOnlineOperation()) return;

    const claim = claims.find((c) => c.id === claimId);
    if (!claim) return;

    const tenantId = currentTenant?.id || 'tenant_demo_store';
    const updatedClaim: PaymentClaim = { ...claim, status: 'APPROVED' };

    const newTxn: Transaction = {
      id: `txn-claim-${Date.now()}`,
      tenantId,
      customerId: claim.customerId !== 'guest' ? claim.customerId : customers[0]?.id || 'cust-1',
      type: 'MONEY_RECEIVED',
      amount: claim.amount,
      date: new Date().toISOString(),
      description: `Payment Claim Approved (UTR: ${claim.utrNumber})`,
      paymentMode: 'UPI',
    };

    try {
      await saveClaimToFirestore(updatedClaim);
      await saveTransactionToFirestore(newTxn);
      showToast('Claim approved and ledger balance updated successfully.');
    } catch (error: any) {
      showToast(`❌ Approval Failed: ${error?.message || 'Approval error'}`);
    }
  };

  const handleRejectClaim = async (claimId: string, reason: string) => {
    if (!guardOnlineOperation()) return;

    const claim = claims.find((c) => c.id === claimId);
    if (!claim) return;

    const updatedClaim: PaymentClaim = { ...claim, status: 'REJECTED', rejectionReason: reason };
    try {
      await saveClaimToFirestore(updatedClaim);
      showToast('Claim status updated successfully.');
    } catch (error: any) {
      showToast(`❌ Operation Failed: ${error?.message || 'Update error'}`);
    }
  };

  const handleRequestCorrection = async (claimId: string) => {
    if (!guardOnlineOperation()) return;

    const claim = claims.find((c) => c.id === claimId);
    if (!claim) return;

    const updatedClaim: PaymentClaim = { ...claim, status: 'CORRECTION_NEEDED' };
    try {
      await saveClaimToFirestore(updatedClaim);
      showToast('Correction request updated successfully.');
    } catch (error: any) {
      showToast(`❌ Operation Failed: ${error?.message || 'Update error'}`);
    }
  };

  // SaaS Super Admin & Tenant Handlers
  const handleUpdateTenantStatus = (tenantId: string, status: TenantWorkspace['status']) => {
    setAllTenants((prev) =>
      prev.map((t) => (t.id === tenantId ? { ...t, status } : t))
    );
    if (currentTenant?.id === tenantId) {
      setCurrentTenant((prev) => (prev ? { ...prev, status } : null));
    }
    showToast(`Tenant ${tenantId} status updated to ${status}.`);
  };

  const handleUpdateTenantPlan = (tenantId: string, planId: string) => {
    const selectedPlan = plans.find((p) => p.id === planId);
    if (!selectedPlan) return;

    setAllTenants((prev) =>
      prev.map((t) =>
        t.id === tenantId
          ? {
              ...t,
              planId: selectedPlan.id,
              planName: selectedPlan.name,
              customerLimit: selectedPlan.customerLimit,
              loanLimit: selectedPlan.loanLimit,
            }
          : t
      )
    );

    if (currentTenant?.id === tenantId) {
      setCurrentTenant((prev) =>
        prev
          ? {
              ...prev,
              planId: selectedPlan.id,
              planName: selectedPlan.name,
              customerLimit: selectedPlan.customerLimit,
              loanLimit: selectedPlan.loanLimit,
            }
          : null
      );
    }
    showToast(`Tenant plan updated to ${selectedPlan.name}.`);
  };

  const handleDeleteTenant = (tenantId: string) => {
    setAllTenants((prev) => prev.filter((t) => t.id !== tenantId));
    showToast(`Company workspace ${tenantId} removed.`);
  };

  const handleSavePlan = (updatedPlan: SubscriptionPlan) => {
    setPlans((prev) => prev.map((p) => (p.id === updatedPlan.id ? updatedPlan : p)));
    showToast(`Plan ${updatedPlan.name} configuration saved.`);
  };

  const handleCreateAnnouncement = (title: string, content: string) => {
    const newAnn: Announcement = {
      id: `ann_${Date.now()}`,
      title,
      content,
      createdAt: new Date().toISOString(),
      createdBy: userProfile?.name || 'Super Admin',
    };
    setAnnouncements((prev) => [newAnn, ...prev]);
  };

  // Live Sync for Public Payment View when unauthenticated
  useEffect(() => {
    if (isPublicPaymentView && !userProfile) {
      const params = new URLSearchParams(window.location.search);
      const urlTenant = params.get('tenant') || params.get('tenantId') || 'default_tenant';

      const unsubSettings = subscribeSettingsFromFirestore(
        urlTenant,
        (s) => { if (s) setSettings(s); }
      );
      const unsubCustomers = subscribeCustomersFromFirestore(
        urlTenant,
        (cList) => { if (cList) setCustomers(cList); }
      );

      return () => {
        unsubSettings();
        unsubCustomers();
      };
    }
  }, [isPublicPaymentView, userProfile]);

  if (isPublicPaymentView) {
    return (
      <PublicCustomerPaymentPage
        phoneParam={publicPaymentPhone}
        customers={customerSummaries}
        settings={settings}
        currentTenant={currentTenant}
        onPaymentSubmitted={handleSubmitClaim}
      />
    );
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-between relative overflow-hidden font-sans">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-96 bg-indigo-600/20 blur-[120px] pointer-events-none rounded-full" />

        <header className="relative z-10 p-6 flex items-center justify-between max-w-md mx-auto w-full">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-blue-600 flex items-center justify-center font-black text-white shadow-lg">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-black text-base text-white leading-tight">Due Manager</h1>
              <p className="text-[10px] text-indigo-300 font-bold tracking-wider uppercase">Commercial Store Ledger</p>
            </div>
          </div>
        </header>

        <div className="relative z-10 max-w-md mx-auto w-full px-6 py-10 text-center space-y-6 my-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-extrabold text-xs">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Multi-Tenant Store Workspace</span>
          </div>

          <h2 className="text-3xl font-black text-white leading-tight">
            Manage Customer Dues, Loans & Payment Claims
          </h2>

          <p className="text-xs text-slate-300 leading-relaxed max-w-xs mx-auto font-medium">
            Keep clear store ledger balances, issue UPI QR codes, and send WhatsApp payment reminders automatically.
          </p>

          <button
            type="button"
            onClick={() => setIsAuthModalOpen(true)}
            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-black rounded-2xl shadow-xl transition-all text-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Log In or Create Store Workspace</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <footer className="relative z-10 p-6 text-center text-[11px] text-slate-500">
          Due Manager v2.4.0 • Safe & Encrypted Store Platform
        </footer>

        <EmailAuthModal
          isOpen={isAuthModalOpen}
          onClose={() => {
            if (userProfile) {
              setIsAuthModalOpen(false);
            }
          }}
          plans={plans}
          existingTenants={allTenants}
          onLoginSuccess={(uProfile, tenant) => {
            setUserProfile(uProfile);
            setCurrentTenant(tenant);
            saveAuthSession(uProfile, tenant);
            if (!allTenants.some((t) => t.id === tenant.id)) {
              setAllTenants((prev) => [tenant, ...prev]);
            }
            setIsAuthModalOpen(false);
            showToast(`Welcome ${uProfile.name || uProfile.email}! Connected to ${tenant.companyName}.`);
          }}
        />

        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 px-5 py-3.5 rounded-2xl shadow-2xl border border-slate-700/50 dark:border-slate-300 font-bold text-xs flex items-center gap-3 animate-bounce">
            <span>🔔</span>
            {toastMessage}
          </div>
        )}
      </div>
    );
  }

  if (isSplashLoading) {
    return <SplashScreen statusMessage={splashStatus} isReady={false} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {!isOnline && (
        <div className="bg-rose-600 text-white font-extrabold text-center py-2.5 px-4 text-xs shadow-md flex items-center justify-center gap-2 sticky top-0 z-50">
          <span className="text-base">⚠️</span>
          <span>No Internet Connection. Please connect to the internet to continue.</span>
        </div>
      )}

      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setSelectedCustomerId(null);
        }}
        settings={settings}
        pendingClaimsCount={pendingClaimsCount}
        unreadNotificationsCount={notifications.filter((n) => !n.isRead).length}
        userProfile={userProfile}
        currentTenant={currentTenant}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenSetupWizard={() => setIsSetupWizardOpen(true)}
        onOpenAddCustomer={() => {
          setEditingCustomer(null);
          setIsAddCustomerOpen(true);
        }}
        onOpenAddTransaction={() => {
          setDefaultTxnCustomerId(undefined);
          setDefaultTxnType('LOAN_GIVEN');
          setIsAddTransactionOpen(true);
        }}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenPricingModal={() => setActiveTab('subscription')}
        onOpenSuperAdmin={() => setIsSuperAdminOpen(true)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenInvoices={() => setIsInvoicesOpen(true)}
        onLogout={handleRequestLogout}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        isOnline={isOnline}
      />

      {/* Cloud Permission Helper Banner */}
      {hasPermissionNotice && (
        <div id="cloud-permission-notice" className="bg-amber-50 dark:bg-amber-950/60 border-b border-amber-300 dark:border-amber-700/80 p-4 shadow-sm">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-amber-900 dark:text-amber-100 text-sm">
            <div className="flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">🔐</span>
              <div>
                <p className="font-bold text-amber-950 dark:text-amber-50 text-base">
                  Connected to Workspace: <code className="bg-amber-200/80 dark:bg-amber-900/80 px-2 py-0.5 rounded font-mono text-xs text-amber-950 dark:text-amber-100">due-manager-ultimate</code>
                </p>
                <p className="mt-1 text-xs text-amber-800 dark:text-amber-200">
                  Cloud permissions are currently verifying access for your account.
                </p>
              </div>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold whitespace-nowrap shadow-md transition-colors flex items-center gap-1.5 self-end md:self-center cursor-pointer"
            >
              <span>🔄</span> Retry Connection
            </button>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-32">
        {selectedCustomerSummary ? (
          <CustomerDetail
            customer={selectedCustomerSummary}
            transactions={transactions}
            settings={settings}
            onBack={() => setSelectedCustomerId(null)}
            onEditCustomer={(cust) => {
              setEditingCustomer(cust);
              setIsAddCustomerOpen(true);
            }}
            onDeleteCustomer={handleDeleteCustomer}
            onAddTransactionForCustomer={(type) => {
              setDefaultTxnCustomerId(selectedCustomerSummary.id);
              setDefaultTxnType(type);
              setEditingTransaction(null);
              setIsAddTransactionOpen(true);
            }}
            onEditTransaction={(txn) => {
              setEditingTransaction(txn);
              setIsAddTransactionOpen(true);
            }}
            onDeleteTransaction={handleDeleteTransaction}
            onSendReminder={handleSendReminder}
            onShowQr={(cust) => setQrModalCustomer(cust)}
          />
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <Dashboard
                stats={dashboardStats}
                settings={settings}
                onSelectCustomer={(id) => setSelectedCustomerId(id)}
                onOpenAddCustomer={() => {
                  setEditingCustomer(null);
                  setIsAddCustomerOpen(true);
                }}
                onOpenAddTransaction={() => {
                  setDefaultTxnCustomerId(undefined);
                  setDefaultTxnType('LOAN_GIVEN');
                  setEditingTransaction(null);
                  setIsAddTransactionOpen(true);
                }}
                onSendReminder={handleSendReminder}
                onShowQr={(cust) => setQrModalCustomer(cust)}
                transactions={transactions}
              />
            )}

            {activeTab === 'customers' && (
              <CustomerList
                customers={customerSummaries}
                settings={settings}
                onSelectCustomer={(id) => setSelectedCustomerId(id)}
                onOpenAddCustomer={() => {
                  setEditingCustomer(null);
                  setIsAddCustomerOpen(true);
                }}
                onEditCustomer={(cust) => {
                  setEditingCustomer(cust);
                  setIsAddCustomerOpen(true);
                }}
                onDeleteCustomer={handleDeleteCustomer}
                onSendReminder={handleSendReminder}
                onShowQr={(cust) => setQrModalCustomer(cust)}
              />
            )}

            {activeTab === 'claims' && (
              <PaymentPortal
                claims={claims}
                customers={customerSummaries}
                settings={settings}
                onSubmitClaim={handleSubmitClaim}
                onApproveClaim={handleApproveClaim}
                onRejectClaim={handleRejectClaim}
                onRequestCorrection={handleRequestCorrection}
                onAutoVerifyPayment={handleAutoVerifyPayment}
              />
            )}

            {activeTab === 'reports' && (
              <Reports
                customers={customerSummaries}
                transactions={transactions}
                settings={settings}
              />
            )}

            {activeTab === 'settings' && (
              <AndroidSettings
                settings={settings}
                currentTenant={currentTenant}
                userProfile={userProfile}
                plans={plans}
                invoices={invoices}
                onUpdateUserProfile={async (profileData) => {
                  if (userProfile) {
                    const updatedProf: UserProfile = {
                      ...userProfile,
                      name: profileData.name,
                      phone: profileData.phone,
                    };
                    setUserProfile(updatedProf);
                    await saveUserProfileToFirestore(updatedProf).catch(console.warn);
                  }
                  if (currentTenant) {
                    const updatedTen: TenantWorkspace = {
                      ...currentTenant,
                      companyName: profileData.companyName,
                      ownerName: profileData.name,
                      phone: profileData.phone,
                      isSetupComplete: true,
                    };
                    setCurrentTenant(updatedTen);
                    await saveTenantWorkspaceToFirestore(updatedTen).catch(console.warn);
                    if (userProfile) {
                      saveAuthSession(userProfile, updatedTen);
                    }
                  }
                }}
                onUpdateCompanyProfile={(companyData) => {
                  if (currentTenant) {
                    const updated = { ...currentTenant, ...companyData };
                    setCurrentTenant(updated);
                    setAllTenants((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
                    saveTenantWorkspaceToFirestore(updated).catch((err) =>
                      console.warn('Tenant workspace save warning:', err)
                    );
                    if (userProfile) {
                      const updatedProfile: UserProfile = {
                        ...userProfile,
                        name: companyData.ownerName || userProfile.name,
                        phone: companyData.phone !== undefined ? companyData.phone : userProfile.phone,
                      };
                      setUserProfile(updatedProfile);
                      saveUserProfileToFirestore(updatedProfile).catch((err) =>
                        console.warn('User profile save warning:', err)
                      );
                    }
                  }
                }}
                onUpdateSettings={(newSettings) => setSettings(newSettings)}
                onOpenPricingModal={() => setActiveTab('subscription')}
                onOpenInvoices={() => setIsInvoicesOpen(true)}
                onLogout={handleRequestLogout}
                showToast={showToast}
              />
            )}

            {activeTab === 'subscription' && (
              <FullScreenSubscription
                currentTenant={currentTenant}
                plans={plans}
                settings={settings}
                invoices={invoices}
                onBack={() => setActiveTab('dashboard')}
                onSubscriptionActivated={(updatedTenant, newInvoice) => {
                  setCurrentTenant(updatedTenant);
                  setAllTenants((prev) => prev.map((t) => (t.id === updatedTenant.id ? updatedTenant : t)));
                  setInvoices((prev) => [newInvoice, ...prev]);
                  setActiveTab('dashboard');
                }}
                showToast={showToast}
              />
            )}
          </>
        )}
      </main>

      {/* Android Mobile Navigation Bar with Floating Action Button */}
      <AndroidBottomNav
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setSelectedCustomerId(null);
          setActiveTab(tab);
        }}
        pendingClaimsCount={pendingClaimsCount}
        onOpenAddTransaction={() => {
          setDefaultTxnCustomerId(undefined);
          setDefaultTxnType('LOAN_GIVEN');
          setEditingTransaction(null);
          setIsAddTransactionOpen(true);
        }}
      />

      {/* Global Modals */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={(newSettings) => setSettings(newSettings)}
      />

      <FirstProfileSetupModal
        isOpen={Boolean(
          userProfile &&
            currentTenant &&
            (!currentTenant.isSetupComplete ||
              !userProfile.name ||
              !currentTenant.companyName ||
              !userProfile.phone ||
              (!currentTenant.upiId && !settings.upiId))
        )}
        initialName={userProfile?.name || ''}
        initialCompanyName={currentTenant?.companyName || ''}
        initialPhone={userProfile?.phone || currentTenant?.phone || ''}
        initialUpiId={currentTenant?.upiId || settings.upiId || ''}
        onSaveProfile={async (data) => {
          if (!userProfile || !currentTenant) return;

          const updatedProfile: UserProfile = {
            ...userProfile,
            name: data.name,
            phone: data.phone,
          };

          const updatedTenant: TenantWorkspace = {
            ...currentTenant,
            companyName: data.companyName,
            ownerName: data.name,
            phone: data.phone,
            upiId: data.upiId,
            isSetupComplete: true,
          };

          const updatedSettings: AppSettings = {
            ...settings,
            appName: data.companyName,
            adminName: data.name,
            adminPhone: data.phone,
            upiId: data.upiId,
          };

          setUserProfile(updatedProfile);
          setCurrentTenant(updatedTenant);
          setSettings(updatedSettings);

          saveAuthSession(updatedProfile, updatedTenant);
          saveStoredSettings(updatedSettings);

          if (isOnline) {
            await saveUserProfileToFirestore(updatedProfile).catch(console.warn);
            await saveTenantWorkspaceToFirestore(updatedTenant).catch(console.warn);
            await saveSettingsToFirestore(updatedSettings, updatedTenant.id).catch(console.warn);
          }

          showToast(`✅ Profile setup completed for ${data.companyName}!`);
        }}
      />

      <AddCustomerModal
        isOpen={isAddCustomerOpen}
        onClose={() => {
          setIsAddCustomerOpen(false);
          setEditingCustomer(null);
        }}
        onSaveCustomer={handleSaveCustomer}
        editingCustomer={editingCustomer}
      />

      <AddTransactionModal
        isOpen={isAddTransactionOpen}
        onClose={() => {
          setIsAddTransactionOpen(false);
          setEditingTransaction(null);
        }}
        customers={customerSummaries}
        settings={settings}
        onSaveTransaction={handleAddOrEditTransaction}
        defaultCustomerId={defaultTxnCustomerId}
        defaultType={defaultTxnType}
        editingTransaction={editingTransaction}
      />

      {qrModalCustomer && (
        <QrCodeModal
          isOpen={!!qrModalCustomer}
          onClose={() => setQrModalCustomer(null)}
          customer={qrModalCustomer}
          settings={settings}
        />
      )}

      {txnToDelete && (
        <DeleteConfirmModal
          isOpen={!!txnToDelete}
          txn={txnToDelete}
          customer={customers.find((c) => c.id === txnToDelete.customerId)}
          currencySymbol={settings?.currency || '₹'}
          onClose={() => setTxnToDelete(null)}
          onConfirmDelete={handleConfirmDeleteTransaction}
        />
      )}

      {/* WhatsApp Reminder Modal */}
      <WhatsAppReminderModal
        isOpen={isReminderModalOpen}
        onClose={() => {
          setIsReminderModalOpen(false);
          setReminderCustomer(null);
        }}
        customer={reminderCustomer}
        settings={settings}
        onNotify={(msg) => showToast(msg)}
      />

      {/* Email & Password Firebase Authentication Modal */}
      <EmailAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => {
          if (userProfile) {
            setIsAuthModalOpen(false);
          }
        }}
        plans={plans}
        existingTenants={allTenants}
        onLoginSuccess={(uProfile, tenant) => {
          setUserProfile(uProfile);
          setCurrentTenant(tenant);
          saveAuthSession(uProfile, tenant);
          if (!allTenants.some((t) => t.id === tenant.id)) {
            setAllTenants((prev) => [tenant, ...prev]);
          }
          setIsAuthModalOpen(false);
          showToast(`Welcome ${uProfile.name || uProfile.email}! Connected to ${tenant.companyName}.`);
        }}
      />

      {/* Logout Confirmation Dialog */}
      <LogoutConfirmModal
        isOpen={isLogoutConfirmOpen}
        onClose={() => setIsLogoutConfirmOpen(false)}
        onConfirmLogout={performLogout}
        userPhoneOrName={userProfile?.phone || userProfile?.name || currentTenant?.companyName}
      />

      <PricingModal
        isOpen={isPricingModalOpen}
        onClose={() => setIsPricingModalOpen(false)}
        plans={plans}
        currentTenant={currentTenant}
        onSelectPlanForCheckout={(plan, cycle) => {
          setSelectedCheckoutPlan(plan);
          setCheckoutBillingCycle(cycle);
          setIsPricingModalOpen(false);
          setIsCheckoutModalOpen(true);
        }}
      />

      <CheckoutModal
        isOpen={isCheckoutModalOpen}
        onClose={() => setIsCheckoutModalOpen(false)}
        plan={selectedCheckoutPlan}
        billingCycle={checkoutBillingCycle}
        currentTenant={currentTenant}
        onPaymentSuccess={(invoice, updatedTenant) => {
          setInvoices((prev) => [invoice, ...prev]);
          setCurrentTenant(updatedTenant);
          setAllTenants((prev) =>
            prev.map((t) => (t.id === updatedTenant.id ? updatedTenant : t))
          );
          showToast(`🎉 Subscription Payment Verified! Upgraded to ${updatedTenant.planName}.`);
        }}
      />

      <SuperAdminPanel
        isOpen={isSuperAdminOpen}
        onClose={() => setIsSuperAdminOpen(false)}
        tenants={allTenants}
        plans={plans}
        invoices={invoices}
        announcements={announcements}
        onUpdateTenantStatus={handleUpdateTenantStatus}
        onUpdateTenantPlan={handleUpdateTenantPlan}
        onDeleteTenant={handleDeleteTenant}
        onSavePlan={handleSavePlan}
        onCreateAnnouncement={handleCreateAnnouncement}
      />

      <NotificationsCenterModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onMarkAsRead={handleMarkNotificationAsRead}
        onMarkAllAsRead={handleMarkAllNotificationsAsRead}
        onDeleteNotification={handleDeleteNotification}
        onClearAll={handleClearAllNotifications}
        onTestTriggerPush={handleTestPushNotification}
      />

      <MandatoryUpiModal
        isOpen={isMandatoryUpiOpen}
        currentTenant={currentTenant}
        settings={settings}
        onSaveUpiId={handleSaveMandatoryUpi}
      />

      <InvoicesListModal
        isOpen={isInvoicesOpen}
        onClose={() => setIsInvoicesOpen(false)}
        invoices={invoices.filter((i) => i.tenantId === currentTenant?.id)}
        tenant={currentTenant}
      />

      {/* Global Toast Notification Popup */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 px-5 py-3.5 rounded-2xl shadow-2xl border border-slate-700/50 dark:border-slate-300 font-bold text-xs flex items-center gap-3 animate-bounce">
          <span>🔔</span>
          {toastMessage}
        </div>
      )}
    </div>
  );
}
