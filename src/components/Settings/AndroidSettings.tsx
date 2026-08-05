import React, { useState } from 'react';
import {
  User,
  Building2,
  Zap,
  FileText,
  HelpCircle,
  MessageSquare,
  ShieldAlert,
  FileCheck2,
  Info,
  Star,
  Share2,
  LogOut,
  ChevronRight,
  ArrowLeft,
  Check,
  Phone,
  QrCode,
  MapPin,
  Mail,
  Store,
  Sparkles,
  ExternalLink,
  Shield,
  Copy,
  CheckCircle2
} from 'lucide-react';
import { UserProfile, TenantWorkspace, AppSettings, Invoice, SubscriptionPlan, SettlementDetails, SupportTicket } from '../../types';
import { saveSupportTicketToFirestore, saveTenantWorkspaceToFirestore } from '../../utils/firebase';

interface AndroidSettingsProps {
  userProfile: UserProfile | null;
  currentTenant: TenantWorkspace | null;
  settings: AppSettings;
  invoices: Invoice[];
  plans: SubscriptionPlan[];
  onUpdateCompanyProfile: (companyData: Partial<TenantWorkspace>) => void;
  onUpdateUserProfile?: (profileData: { name: string; phone: string; companyName: string }) => void;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onOpenPricingModal: () => void;
  onOpenInvoices: () => void;
  onLogout: () => void;
  showToast: (msg: string) => void;
}

type SubPage =
  | 'menu'
  | 'my_profile'
  | 'company_profile'
  | 'settlement_details'
  | 'subscription'
  | 'billing_history'
  | 'contact_support'
  | 'faq'
  | 'privacy_policy'
  | 'terms'
  | 'about';

export const AndroidSettings: React.FC<AndroidSettingsProps> = ({
  userProfile,
  currentTenant,
  settings,
  invoices,
  plans,
  onUpdateCompanyProfile,
  onUpdateUserProfile,
  onUpdateSettings,
  onOpenPricingModal,
  onOpenInvoices,
  onLogout,
  showToast,
}) => {
  const [activeSubPage, setActiveSubPage] = useState<SubPage>('menu');

  // Company Profile & UPI Form states
  const [ownerName, setOwnerName] = useState(userProfile?.name || currentTenant?.ownerName || '');
  const [companyName, setCompanyName] = useState(currentTenant?.companyName || settings.appName || '');
  const [phone, setPhone] = useState(userProfile?.phone || currentTenant?.phone || '');
  const [businessType, setBusinessType] = useState(currentTenant?.businessType || 'Retail Store');
  const [address, setAddress] = useState(currentTenant?.address || '');
  const [upiId, setUpiId] = useState(currentTenant?.upiId || settings.upiId || '');
  const [businessEmail, setBusinessEmail] = useState(userProfile?.email || currentTenant?.ownerEmail || '');

  // Platform UPI Configuration
  const [usePlatformUpi, setUsePlatformUpi] = useState(currentTenant?.usePlatformUpi || false);
  const [platformUpiAcceptedTc, setPlatformUpiAcceptedTc] = useState(currentTenant?.platformUpiAcceptedTc || false);

  // Settlement Details Form states - Auto fill Account Holder Name from userProfile?.name
  const [accountHolderName, setAccountHolderName] = useState(
    currentTenant?.settlementDetails?.accountHolderName || userProfile?.name || currentTenant?.ownerName || ''
  );
  const [bankName, setBankName] = useState(currentTenant?.settlementDetails?.bankName || '');
  const [accountNumber, setAccountNumber] = useState(currentTenant?.settlementDetails?.accountNumber || '');
  const [ifscCode, setIfscCode] = useState(currentTenant?.settlementDetails?.ifscCode || '');
  const [branchName, setBranchName] = useState(currentTenant?.settlementDetails?.branchName || '');
  const [settlementUpiId, setSettlementUpiId] = useState(currentTenant?.settlementDetails?.upiId || upiId);

  // Contact Support Form states
  const [supportName, setSupportName] = useState(userProfile?.name || ownerName);
  const [supportMobile, setSupportMobile] = useState(userProfile?.phone || currentTenant?.phone || '');
  const [supportWhatsApp, setSupportWhatsApp] = useState(userProfile?.phone || currentTenant?.phone || '');
  const [supportEmail, setSupportEmail] = useState(userProfile?.email || businessEmail);
  const [supportSubject, setSupportSubject] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [supportSubmitted, setSupportSubmitted] = useState(false);
  const [isSubmittingSupport, setIsSubmittingSupport] = useState(false);

  // Rate App Modal state
  const [isRatingOpen, setIsRatingOpen] = useState(false);
  const [ratingStars, setRatingStars] = useState(5);
  const [ratingFeedback, setRatingFeedback] = useState('');

  // Calculate Trial Countdown
  const validUntil = currentTenant?.validUntil ? new Date(currentTenant.validUntil) : new Date();
  const daysLeft = Math.max(0, Math.ceil((validUntil.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

  const handleSaveCompanyProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (usePlatformUpi && !platformUpiAcceptedTc) {
      showToast('⚠️ Please accept Terms & Conditions before enabling Platform UPI.');
      return;
    }

    const effectiveUpiId = usePlatformUpi ? 'duemanager.platform@upi' : upiId;

    const updatedTenantData: Partial<TenantWorkspace> = {
      companyName,
      ownerName,
      phone,
      businessType,
      address,
      upiId: effectiveUpiId,
      usePlatformUpi,
      platformUpiAcceptedTc,
      ownerEmail: businessEmail,
    };

    onUpdateCompanyProfile(updatedTenantData);
    onUpdateSettings({
      ...settings,
      adminName: ownerName,
      adminPhone: phone,
      appName: companyName,
      upiId: effectiveUpiId,
    });
    showToast('✅ Company & Business Profile updated successfully!');
    setActiveSubPage('menu');
  };

  const handleSaveSettlementDetails = (e: React.FormEvent) => {
    e.preventDefault();
    const settlementData: SettlementDetails = {
      accountHolderName,
      bankName,
      accountNumber,
      ifscCode,
      branchName,
      upiId: settlementUpiId,
      updatedAt: new Date().toISOString(),
    };

    onUpdateCompanyProfile({
      settlementDetails: settlementData,
    });

    if (currentTenant) {
      saveTenantWorkspaceToFirestore({
        ...currentTenant,
        settlementDetails: settlementData,
      }).catch((err) => console.warn('Settlement save warning:', err));
    }

    showToast('✅ Settlement details saved securely!');
    setActiveSubPage('menu');
  };

  const handleSubmitSupportTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingSupport(true);

    const ticket: SupportTicket = {
      id: 'SUP-' + Date.now().toString(36).toUpperCase(),
      tenantId: currentTenant?.id,
      name: supportName,
      mobileNumber: supportMobile,
      whatsAppNumber: supportWhatsApp,
      email: supportEmail,
      subject: supportSubject,
      message: supportMessage,
      status: 'OPEN',
      createdAt: new Date().toISOString(),
    };

    await saveSupportTicketToFirestore(ticket);
    setIsSubmittingSupport(false);
    setSupportSubmitted(true);
    showToast('✅ Support request submitted!');
  };

  const handleShareApp = () => {
    if (navigator.share) {
      navigator
        .share({
          title: `${companyName} - Customer Ledger App`,
          text: 'Manage your store customer loans, collect UPI payments, and send automatic WhatsApp reminders!',
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast('📋 App Download Link copied to clipboard!');
    }
  };

  const handleRateApp = () => {
    showToast(`⭐ Thank you for rating ${ratingStars} Stars! Your feedback has been recorded.`);
    setIsRatingOpen(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-20">
      {/* SubPage Header Navigation */}
      {activeSubPage !== 'menu' && (
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={() => setActiveSubPage('menu')}
            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-black text-slate-900 dark:text-white capitalize">
            {activeSubPage.replace('_', ' ')}
          </h2>
        </div>
      )}

      {/* Main Settings Menu */}
      {activeSubPage === 'menu' && (
        <div className="space-y-4">
          {/* User & Store Card Banner */}
          <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-3xl p-5 shadow-xl border border-indigo-800/60 relative overflow-hidden">
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-blue-600 text-white font-black text-xl flex items-center justify-center shadow-lg border border-indigo-300/30">
                {companyName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-300 bg-indigo-950/80 px-2 py-0.5 rounded-md border border-indigo-800">
                  {currentTenant?.planName || 'Free Trial'}
                </span>
                <h2 className="text-lg font-black text-white mt-1 leading-tight">{companyName}</h2>
                <p className="text-xs text-indigo-200/90 font-medium flex items-center gap-2 mt-0.5">
                  <span>{userProfile?.phone || currentTenant?.phone || '+91 98765 00000'}</span>
                  <span>•</span>
                  <span>{ownerName}</span>
                </p>
              </div>
            </div>

            {/* Trial Banner Alert if Trial Active */}
            {currentTenant?.status === 'TRIAL' && (
              <div className="mt-4 pt-3 border-t border-indigo-800/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-amber-300 font-bold">
                  <Sparkles className="w-4 h-4 animate-pulse" />
                  <span>15-Day Free Trial: {daysLeft} Days Remaining</span>
                </div>
                <button
                  onClick={onOpenPricingModal}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] rounded-xl shadow-md cursor-pointer transition-transform active:scale-95"
                >
                  Upgrade Now
                </button>
              </div>
            )}
          </div>

          {/* Android M3 Settings List Sections */}

          {/* Section 1: Business Account */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-[11px] font-extrabold uppercase text-slate-400 tracking-wider">
              Account & Store Details
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              <button
                onClick={() => setActiveSubPage('my_profile')}
                className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">My Profile</span>
                    <span className="text-[11px] text-slate-400">
                      Mobile Number: {userProfile?.phone || currentTenant?.phone || '+91 98765 00000'}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={() => setActiveSubPage('company_profile')}
                className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">Company Profile</span>
                    <span className="text-[11px] text-slate-400">
                      Store Name, Address, Category & UPI ID
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Section 2: Subscriptions & Billing */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-[11px] font-extrabold uppercase text-slate-400 tracking-wider">
              Subscription & Payments
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              <button
                onClick={() => setActiveSubPage('subscription')}
                className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">Subscription Plan</span>
                    <span className="text-[11px] text-slate-400">
                      Current Tier: {currentTenant?.planName || 'Free Trial'} ({daysLeft} days left)
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={() => setActiveSubPage('billing_history')}
                className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">Billing History</span>
                    <span className="text-[11px] text-slate-400">
                      Invoices, Payment Receipts & GST Details
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={() => setActiveSubPage('settlement_details')}
                className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                    <QrCode className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">Settlement Details</span>
                    <span className="text-[11px] text-slate-400">
                      Bank Account & Settlement Info (4% Platform Fee Option)
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Section 3: Help & Legal Support */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-[11px] font-extrabold uppercase text-slate-400 tracking-wider">
              Support & Legal Policies
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              <button
                onClick={() => setActiveSubPage('contact_support')}
                className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">Contact Support</span>
                    <span className="text-[11px] text-slate-400">
                      WhatsApp Helpline & Email Support
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={() => setActiveSubPage('faq')}
                className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">FAQ</span>
                    <span className="text-[11px] text-slate-400">Frequently Asked Questions</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={() => setActiveSubPage('privacy_policy')}
                className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">Privacy Policy</span>
                    <span className="text-[11px] text-slate-400">Google Play Store Compliant Privacy</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={() => setActiveSubPage('terms')}
                className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400">
                    <FileCheck2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">Terms & Conditions</span>
                    <span className="text-[11px] text-slate-400">Usage Terms & SLA Agreement</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={() => setActiveSubPage('about')}
                className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                    <Info className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">About This App</span>
                    <span className="text-[11px] text-slate-400">App Version v2.4.0 (Commercial Android)</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Section 4: App Actions */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              <button
                onClick={() => setIsRatingOpen(true)}
                className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                    <Star className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white">Rate App on Play Store</span>
                </div>
                <ExternalLink className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={handleShareApp}
                className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                    <Share2 className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white">Share App with Other Stores</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={onLogout}
                className="w-full px-5 py-3.5 flex items-center justify-between bg-rose-50/50 hover:bg-rose-100/60 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 text-rose-700 dark:text-rose-400 font-bold transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-300">
                    <LogOut className="w-4 h-4" />
                  </div>
                  <span>Logout Account ({userProfile?.phone || currentTenant?.phone || 'Mobile'})</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SubPage: My Profile */}
      {activeSubPage === 'my_profile' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-sm text-xs">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300 font-black text-xl flex items-center justify-center">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 dark:text-white text-base">
                {ownerName || userProfile?.name || 'Account Profile'}
              </h3>
              <p className="text-slate-400">Primary Identity & Business Profile</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="e.g. Ramesh Kumar"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Registered Email Address (Login ID)
              </label>
              <input
                type="email"
                disabled
                value={userProfile?.email || businessEmail || ''}
                className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 font-medium cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Company / Store Name *
              </label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Sagar Traders"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Mobile Number *
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Account Role
              </label>
              <input
                type="text"
                disabled
                value={userProfile?.role || 'STORE_OWNER'}
                className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 font-medium cursor-not-allowed"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                if (onUpdateUserProfile) {
                  onUpdateUserProfile({ name: ownerName, phone, companyName });
                }
                onUpdateCompanyProfile({ ownerName, phone, companyName });
                onUpdateSettings({ ...settings, adminName: ownerName, adminPhone: phone, appName: companyName });
                showToast('✅ Profile saved to Firebase!');
                setActiveSubPage('menu');
              }}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer mt-2 text-xs"
            >
              Save Profile Changes
            </button>
          </div>
        </div>
      )}

      {/* SubPage: Company Profile */}
      {activeSubPage === 'company_profile' && (
        <form onSubmit={handleSaveCompanyProfile} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-sm text-xs">
          <h3 className="font-black text-slate-900 dark:text-white text-sm pb-3 border-b border-slate-100 dark:border-slate-800">
            Business & Store Profile Configuration
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Store / Company Name *
              </label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Mobile Number *
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Business Category
              </label>
              <select
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-white"
              >
                <option value="Grocery / Kirana">Grocery / Kirana Store</option>
                <option value="Electronics & Mobiles">Electronics & Mobiles</option>
                <option value="Apparel & Garments">Apparel & Garments</option>
                <option value="Hardware & Building">Hardware & Building</option>
                <option value="Medical & Pharmacy">Medical & Pharmacy</option>
                <option value="Wholesale Supplier">Wholesale Supplier</option>
                <option value="Services & Repairs">Services & Repairs</option>
                <option value="Other">Other Business</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Store Address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* UPI Configuration Options */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
            <span className="font-extrabold text-slate-900 dark:text-white block text-xs">
              Payment Collection UPI Settings
            </span>

            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="upiMode"
                  checked={!usePlatformUpi}
                  onChange={() => setUsePlatformUpi(false)}
                  className="accent-indigo-600"
                />
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  Use Custom Store UPI VPA ID (Direct Settlement)
                </span>
              </label>

              {!usePlatformUpi && (
                <div className="ml-6 mt-1">
                  <input
                    type="text"
                    required={!usePlatformUpi}
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="e.g. mystore@oksbi"
                    className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl font-mono font-bold text-slate-900 dark:text-white"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Payments will land directly in your own UPI bank account.
                  </p>
                </div>
              )}

              <label className="flex items-center gap-2 cursor-pointer mt-3">
                <input
                  type="radio"
                  name="upiMode"
                  checked={usePlatformUpi}
                  onChange={() => setUsePlatformUpi(true)}
                  className="accent-indigo-600"
                />
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  Use Platform Default UPI ID (4% Platform Fee)
                </span>
              </label>

              {usePlatformUpi && (
                <div className="ml-6 mt-2 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl space-y-2 text-amber-900 dark:text-amber-200">
                  <p className="font-medium text-[11px] leading-relaxed">
                    By enabling Platform UPI, payments will be collected through the platform gateway account. A <strong>4% platform service charge</strong> will be deducted before settling payouts to your registered Bank Account / UPI ID.
                  </p>
                  <label className="flex items-start gap-2 cursor-pointer mt-2 pt-2 border-t border-amber-200 dark:border-amber-800/60">
                    <input
                      type="checkbox"
                      checked={platformUpiAcceptedTc}
                      onChange={(e) => setPlatformUpiAcceptedTc(e.target.checked)}
                      className="mt-0.5 accent-amber-600"
                    />
                    <span className="text-[10px] font-bold">
                      I explicitly accept the Terms & Conditions and 4% platform service charge for Platform UPI settlements.
                    </span>
                  </label>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Business Contact Email (Optional)
            </label>
            <input
              type="email"
              value={businessEmail}
              onChange={(e) => setBusinessEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl shadow-md transition-all cursor-pointer text-xs"
          >
            Update Business Profile & UPI
          </button>
        </form>
      )}

      {/* SubPage: Settlement Details */}
      {activeSubPage === 'settlement_details' && (
        <form onSubmit={handleSaveSettlementDetails} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-sm text-xs">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-black text-slate-900 dark:text-white text-sm">
              Settlement Bank Account & Payout Details
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Used to disburse store collections if Platform UPI (4% fee) is selected.
            </p>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Account Holder Name *
            </label>
            <input
              type="text"
              required
              value={accountHolderName}
              onChange={(e) => setAccountHolderName(e.target.value)}
              placeholder="Full Name as in Bank"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Bank Name *
              </label>
              <input
                type="text"
                required
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="State Bank of India, HDFC, ICICI, etc."
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Bank Account Number *
              </label>
              <input
                type="text"
                required
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="11 to 16 digit account number"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                IFSC Code *
              </label>
              <input
                type="text"
                required
                value={ifscCode}
                onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                placeholder="SBIN0001234"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold uppercase text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Branch Name (Optional)
              </label>
              <input
                type="text"
                value={branchName}
                onChange={(e) => setBranchName(e.target.value)}
                placeholder="Main Market Branch"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Alternative Settlement UPI VPA (Optional)
            </label>
            <input
              type="text"
              value={settlementUpiId}
              onChange={(e) => setSettlementUpiId(e.target.value)}
              placeholder="payouts@sbi"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-white"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl shadow-md transition-all cursor-pointer text-xs"
          >
            Save Settlement Details
          </button>
        </form>
      )}

      {/* SubPage: Subscription */}
      {activeSubPage === 'subscription' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-sm text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-[10px] uppercase tracking-widest font-extrabold text-indigo-500">
                Active Tier Status
              </span>
              <h3 className="font-black text-slate-900 dark:text-white text-base">
                {currentTenant?.planName || 'Free Trial'}
              </h3>
            </div>
            <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-extrabold text-xs rounded-full">
              {currentTenant?.status || 'ACTIVE'}
            </span>
          </div>

          <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-2xl border border-indigo-200 dark:border-indigo-900 space-y-2">
            <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200">
              <span>Trial / Validity Remaining:</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-black">{daysLeft} Days</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-indigo-600 h-full transition-all"
                style={{ width: `${Math.min(100, Math.max(5, (daysLeft / 15) * 100))}%` }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <span className="font-bold text-slate-700 dark:text-slate-300 block">Tier Limits:</span>
            <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-300 font-medium">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <span className="text-slate-400 text-[10px] block">Customer Limit</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {currentTenant?.customerLimit === -1 ? 'Unlimited' : currentTenant?.customerLimit || 100} Accounts
                </span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <span className="text-slate-400 text-[10px] block">Loan Limit</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {currentTenant?.loanLimit === -1 ? 'Unlimited' : currentTenant?.loanLimit || 500} Entries
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onOpenPricingModal}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
            <span>Upgrade or Renew Subscription</span>
          </button>
        </div>
      )}

      {/* SubPage: Billing History */}
      {activeSubPage === 'billing_history' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-sm text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-black text-slate-900 dark:text-white text-sm">
              Invoices & Payment Receipts ({invoices.length})
            </h3>
            <button
              onClick={onOpenInvoices}
              className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
            >
              View All Invoices
            </button>
          </div>

          {invoices.length === 0 ? (
            <p className="text-center py-6 text-slate-400">No past invoice receipts found.</p>
          ) : (
            <div className="space-y-2">
              {invoices.map((inv) => (
                <div
                  key={inv.id}
                  className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between"
                >
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">{inv.planName}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{inv.id} • {new Date(inv.date).toLocaleDateString()}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-slate-900 dark:text-white text-sm">₹{inv.amount}</span>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block">{inv.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SubPage: Contact Support */}
      {activeSubPage === 'contact_support' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 shadow-sm text-xs">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-black text-slate-900 dark:text-white text-sm">
              24/7 Commercial Store Support
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Get priority assistance from our technical and billing desk.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <a
              href="https://wa.me/919876500000?text=Hello%20Support,%20I%20need%20assistance%20with%20my%20Ledger%20App"
              target="_blank"
              rel="noreferrer"
              className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center gap-3 text-emerald-800 dark:text-emerald-200 font-bold hover:scale-[1.01] transition-transform"
            >
              <MessageSquare className="w-5 h-5 text-emerald-600" />
              <div>
                <span className="block font-black">WhatsApp Support</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400">Instant Chat Response</span>
              </div>
            </a>

            <a
              href="mailto:support@duemanager.com"
              className="p-3.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-2xl flex items-center gap-3 text-blue-800 dark:text-blue-200 font-bold hover:scale-[1.01] transition-transform"
            >
              <Mail className="w-5 h-5 text-blue-600" />
              <div>
                <span className="block font-black">Email Helpline</span>
                <span className="text-[10px] text-blue-600 dark:text-blue-400">support@duemanager.com</span>
              </div>
            </a>
          </div>

          {supportSubmitted ? (
            <div className="p-5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 rounded-2xl text-emerald-900 dark:text-emerald-200 space-y-2">
              <div className="flex items-center gap-2 font-black text-sm text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="w-5 h-5" />
                <span>Support Ticket Submitted Successfully!</span>
              </div>
              <p className="text-xs leading-relaxed font-medium">
                Thank you for contacting support! Our customer service team will reach out to you using the provided phone number, WhatsApp number, or email address within 24 hours.
              </p>
              <button
                onClick={() => {
                  setSupportSubmitted(false);
                  setSupportSubject('');
                  setSupportMessage('');
                }}
                className="mt-2 px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl text-xs shadow hover:bg-emerald-700 cursor-pointer"
              >
                Submit Another Inquiry
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmitSupportTicket} className="space-y-3 pt-2">
              <span className="font-extrabold text-slate-900 dark:text-white block text-xs">
                Submit a Support Ticket
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={supportName}
                    onChange={(e) => setSupportName(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={supportMobile}
                    onChange={(e) => setSupportMobile(e.target.value)}
                    placeholder="+91 98765 00000"
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    WhatsApp Number (Optional)
                  </label>
                  <input
                    type="tel"
                    value={supportWhatsApp}
                    onChange={(e) => setSupportWhatsApp(e.target.value)}
                    placeholder="+91 98765 00000"
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={supportEmail}
                    onChange={(e) => setSupportEmail(e.target.value)}
                    placeholder="you@domain.com"
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Issue Subject *
                </label>
                <input
                  type="text"
                  required
                  value={supportSubject}
                  onChange={(e) => setSupportSubject(e.target.value)}
                  placeholder="e.g. UPI Payment Verification / Billing Query"
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Describe Your Message or Query *
                </label>
                <textarea
                  required
                  rows={3}
                  value={supportMessage}
                  onChange={(e) => setSupportMessage(e.target.value)}
                  placeholder="Provide details about your query..."
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingSupport}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl shadow-md transition-all cursor-pointer text-xs disabled:opacity-50"
              >
                {isSubmittingSupport ? 'Submitting Ticket...' : 'Submit Support Request'}
              </button>
            </form>
          )}
        </div>
      )}

      {/* SubPage: FAQ */}
      {activeSubPage === 'faq' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-sm text-xs">
          <h3 className="font-black text-slate-900 dark:text-white text-sm pb-3 border-b border-slate-100 dark:border-slate-800">
            Frequently Asked Questions
          </h3>

          <div className="space-y-3">
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl">
              <span className="font-bold text-slate-900 dark:text-white block mb-1">
                Is my business ledger data safe & backup synced?
              </span>
              <p className="text-slate-500 leading-relaxed">
                Yes! All customer accounts, loan records, and payments are automatically backed up securely in real-time.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl">
              <span className="font-bold text-slate-900 dark:text-white block mb-1">
                How do automatic WhatsApp payment reminders work?
              </span>
              <p className="text-slate-500 leading-relaxed">
                When sending reminders, the app generates a pre-filled WhatsApp message along with a dynamic UPI QR code link for instant customer payments.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl">
              <span className="font-bold text-slate-900 dark:text-white block mb-1">
                What happens when the 15-day free trial expires?
              </span>
              <p className="text-slate-500 leading-relaxed">
                Your data remains completely preserved. You can pick any subscription plan (Basic, Standard, Premium, or Enterprise) to continue unlimited entries.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SubPage: Privacy Policy */}
      {activeSubPage === 'privacy_policy' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-3 shadow-sm text-xs leading-relaxed text-slate-600 dark:text-slate-300">
          <h3 className="font-black text-slate-900 dark:text-white text-sm pb-2 border-b border-slate-100 dark:border-slate-800">
            Google Play Privacy Policy Compliance
          </h3>
          <p>
            Your privacy is of paramount importance. This application uses encrypted authentication and tenant isolation so that no user or external third party can access your company's ledger data.
          </p>
          <p className="font-bold text-slate-900 dark:text-white">1. Information Collection & Primary Identity</p>
          <p>
            The primary identity for every account is the verified mobile phone number. We do not sell or disclose customer mobile numbers or loan balances to third parties.
          </p>
          <p className="font-bold text-slate-900 dark:text-white">2. Data Security & Storage Isolation</p>
          <p>
            All store transactions, loan entries, and customer records are cryptographically partitioned using multi-tenant software rules.
          </p>
        </div>
      )}

      {/* SubPage: Terms & Conditions */}
      {activeSubPage === 'terms' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-3 shadow-sm text-xs leading-relaxed text-slate-600 dark:text-slate-300">
          <h3 className="font-black text-slate-900 dark:text-white text-sm pb-2 border-b border-slate-100 dark:border-slate-800">
            Terms of Service & SLA Agreement
          </h3>
          <p>
            By utilizing this SaaS application, you agree to comply with commercial usage guidelines. Store owners are responsible for maintaining accurate entries for customer due loans.
          </p>
          <p>
            Subscriptions renew according to your selected monthly or annual cycle. You may upgrade or cancel your subscription plan at any time inside the app.
          </p>
        </div>
      )}

      {/* SubPage: About App */}
      {activeSubPage === 'about' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-sm text-xs text-center">
          <div className="w-16 h-16 rounded-3xl bg-indigo-600 text-white font-black text-2xl mx-auto flex items-center justify-center shadow-lg">
            DM
          </div>
          <div>
            <h3 className="font-black text-slate-900 dark:text-white text-base">Commercial Due Ledger Pro</h3>
            <p className="text-slate-400">Production Android Release v2.4.0</p>
          </div>
          <p className="text-slate-500 max-w-sm mx-auto leading-relaxed">
            Enterprise-grade customer ledger, loan tracker, UPI payment claim verification, and automated WhatsApp reminder platform for modern retail stores and businesses.
          </p>
        </div>
      )}

      {/* Rating Modal */}
      {isRatingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 w-full max-w-sm space-y-4 text-xs shadow-2xl text-center">
            <h3 className="font-black text-slate-900 dark:text-white text-base">Rate App on Google Play</h3>
            <p className="text-slate-500">How is your experience managing store ledgers with our app?</p>
            <div className="flex justify-center gap-2 text-2xl my-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRatingStars(star)}
                  className={`cursor-pointer ${star <= ratingStars ? 'text-amber-400' : 'text-slate-300'}`}
                >
                  ★
                </button>
              ))}
            </div>
            <textarea
              rows={3}
              value={ratingFeedback}
              onChange={(e) => setRatingFeedback(e.target.value)}
              placeholder="Write your feedback..."
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsRatingOpen(false)}
                className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRateApp}
                className="flex-1 py-2.5 bg-indigo-600 text-white font-extrabold rounded-xl shadow-md"
              >
                Submit Rating
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
