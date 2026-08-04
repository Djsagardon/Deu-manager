import React, { useState } from 'react';
import {
  ArrowLeft,
  Check,
  Zap,
  Sparkles,
  Shield,
  Star,
  CreditCard,
  Building2,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  Lock,
  FileText,
  HelpCircle,
  MessageSquare,
  Mail,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Store,
  ExternalLink,
  Info
} from 'lucide-react';
import { SubscriptionPlan, TenantWorkspace, Invoice, AppSettings } from '../../types';
import { saveTenantWorkspaceToFirestore, saveInvoiceToFirestore } from '../../utils/firebase';

interface FullScreenSubscriptionProps {
  currentTenant: TenantWorkspace | null;
  plans: SubscriptionPlan[];
  settings: AppSettings;
  invoices: Invoice[];
  onBack: () => void;
  onSubscriptionActivated: (updatedTenant: TenantWorkspace, newInvoice: Invoice) => void;
  showToast: (msg: string) => void;
}

type Step = 'PLANS' | 'ORDER_SUMMARY' | 'PAYMENT' | 'SUCCESS';

export const FullScreenSubscription: React.FC<FullScreenSubscriptionProps> = ({
  currentTenant,
  plans,
  settings,
  invoices,
  onBack,
  onSubscriptionActivated,
  showToast,
}) => {
  const [step, setStep] = useState<Step>('PLANS');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(
    plans.find((p) => p.isPopular) || plans[1] || plans[0]
  );

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'RAZORPAY' | 'CARD' | 'NETBANKING'>('UPI');
  const [utrNumber, setUtrNumber] = useState('');
  const [cardNumber, setCardNumber] = useState('4532 •••• •••• 8892');
  const [cardExpiry, setCardExpiry] = useState('08/29');
  const [cardCvc, setCardCvc] = useState('321');
  const [selectedBank, setSelectedBank] = useState('State Bank of India (SBI)');
  const [termsAccepted, setTermsAccepted] = useState(true);

  // Razorpay API Credentials state
  const [razorpayKeyId, setRazorpayKeyId] = useState('');
  const [showRazorpayKeyInput, setShowRazorpayKeyInput] = useState(false);

  // State for activation processing & success output
  const [isProcessing, setIsProcessing] = useState(false);
  const [activatedInvoice, setActivatedInvoice] = useState<Invoice | null>(null);
  const [activatedTenant, setActivatedTenant] = useState<TenantWorkspace | null>(null);

  // Accordion FAQ states
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  // Calculate Days Remaining
  const validUntil = currentTenant?.validUntil ? new Date(currentTenant.validUntil) : new Date();
  const daysLeft = Math.max(0, Math.ceil((validUntil.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

  // Pricing calculations
  const basePrice = selectedPlan
    ? billingCycle === 'yearly'
      ? selectedPlan.priceYearly
      : selectedPlan.priceMonthly
    : 0;
  const gstTax = Math.round(basePrice * 0.18);
  const totalPrice = basePrice + gstTax;

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setStep('ORDER_SUMMARY');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleProceedToPayment = () => {
    if (!termsAccepted) {
      showToast('⚠️ Please accept the Terms of Service to proceed.');
      return;
    }
    setStep('PAYMENT');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleVerifyAndActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan || !currentTenant) return;

    if (paymentMethod === 'UPI' && utrNumber.trim().length < 8) {
      showToast('⚠️ Please enter a valid 12-digit UPI UTR / Transaction Reference number.');
      return;
    }

    setIsProcessing(true);

    try {
      // Simulate Payment Verification
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const now = new Date();
      const newExpiryDate = new Date(now);
      if (billingCycle === 'yearly') {
        newExpiryDate.setFullYear(now.getFullYear() + 1);
      } else {
        newExpiryDate.setMonth(now.getMonth() + 1);
      }

      const invoiceId = `INV_${Date.now()}`;
      const txnRef =
        paymentMethod === 'UPI'
          ? `UTR_${utrNumber.trim() || Math.random().toString(36).substring(2, 10).toUpperCase()}`
          : `TXN_PG_${Math.random().toString(36).substring(2, 12).toUpperCase()}`;

      const newInvoice: Invoice = {
        id: invoiceId,
        tenantId: currentTenant.id,
        companyName: currentTenant.companyName,
        amount: totalPrice,
        currency: currentTenant.currency || '₹',
        planId: selectedPlan.id,
        planName: selectedPlan.name,
        status: 'PAID',
        paymentMethod:
          paymentMethod === 'UPI'
            ? `UPI Instant (UTR: ${utrNumber})`
            : paymentMethod === 'RAZORPAY'
            ? 'Razorpay Gateway'
            : paymentMethod === 'CARD'
            ? 'Credit/Debit Card'
            : `NetBanking (${selectedBank})`,
        date: now.toISOString(),
        transactionRef: txnRef,
        periodStart: now.toISOString(),
        periodEnd: newExpiryDate.toISOString(),
      };

      const updatedTenant: TenantWorkspace = {
        ...currentTenant,
        planId: selectedPlan.id,
        planName: selectedPlan.name,
        status: 'ACTIVE',
        customerLimit: selectedPlan.customerLimit,
        loanLimit: selectedPlan.loanLimit,
        validUntil: newExpiryDate.toISOString(),
      };

      // Real Firestore Persistence Sync
      try {
        await saveTenantWorkspaceToFirestore(updatedTenant);
        await saveInvoiceToFirestore(newInvoice);
      } catch (fsErr) {
        console.warn('Firestore subscription sync note:', fsErr);
      }

      setActivatedInvoice(newInvoice);
      setActivatedTenant(updatedTenant);
      onSubscriptionActivated(updatedTenant, newInvoice);
      setStep('SUCCESS');
      showToast(`✅ Subscription Activated! Upgraded to ${selectedPlan.name}.`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error('Subscription activation failed:', err);
      showToast('❌ Payment verification failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrintInvoice = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-24 transition-colors">
      {/* Top App Bar (Material Design 3 Android App Bar) */}
      <div className="sticky top-0 z-40 bg-slate-900 text-white shadow-xl border-b border-slate-800 px-4 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (step === 'SUCCESS') {
                onBack();
              } else if (step === 'PAYMENT') {
                setStep('ORDER_SUMMARY');
              } else if (step === 'ORDER_SUMMARY') {
                setStep('PLANS');
              } else {
                onBack();
              }
            }}
            className="p-2 text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base font-black tracking-tight text-white flex items-center gap-2">
              <span>Subscription & SaaS Plans</span>
              <span className="px-2 py-0.5 bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 text-[10px] font-extrabold uppercase rounded-md">
                Commercial
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 font-medium">
              Store: <span className="text-white font-bold">{currentTenant?.companyName || 'My Business'}</span>
            </p>
          </div>
        </div>

        {/* Step Indicator Pill */}
        <div className="px-3 py-1 bg-slate-800 border border-slate-700 rounded-full text-[11px] font-extrabold text-indigo-300">
          Step {step === 'PLANS' ? '1/3 Select' : step === 'ORDER_SUMMARY' ? '2/3 Review' : step === 'PAYMENT' ? '3/3 Pay' : 'Done'}
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
        {/* ================= STEP 1: PLANS SELECTION & COMPARISON ================= */}
        {step === 'PLANS' && (
          <>
            {/* Current Active Plan Header Status Banner */}
            <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 shadow-xl border border-indigo-800/80 relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 bg-indigo-950/90 text-indigo-300 border border-indigo-700 text-[10px] font-black uppercase tracking-widest rounded-md">
                      Current Subscription
                    </span>
                    <span className="px-2.5 py-0.5 bg-emerald-500 text-slate-950 font-black text-[10px] uppercase rounded-md">
                      {currentTenant?.status || 'ACTIVE'}
                    </span>
                  </div>
                  <h2 className="text-2xl font-black text-white mt-1">
                    {currentTenant?.planName || '15-Day Free Trial'}
                  </h2>
                  <p className="text-xs text-indigo-200/90 font-medium flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-300" />
                    <span>Valid Until: {validUntil.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </p>
                </div>

                <div className="bg-slate-900/80 p-4 rounded-2xl border border-indigo-800/80 min-w-[200px] space-y-2">
                  <div className="flex justify-between text-xs font-bold text-slate-300">
                    <span>Remaining Trial:</span>
                    <span className="text-amber-400 font-black">{daysLeft} Days</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-amber-400 to-emerald-400 h-full transition-all"
                      style={{ width: `${Math.min(100, Math.max(5, (daysLeft / 15) * 100))}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 text-center">
                    Upgrade to prevent service interruption
                  </p>
                </div>
              </div>
            </div>

            {/* Billing Cycle Toggle */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">Choose Billing Cycle</h3>
                <p className="text-xs text-slate-500">Select annual billing to get an instant 20% discount on all plans.</p>
              </div>

              <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-4 py-2 rounded-xl font-extrabold text-xs transition-all cursor-pointer ${
                    billingCycle === 'monthly'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Monthly Billing
                </button>
                <button
                  onClick={() => setBillingCycle('yearly')}
                  className={`px-4 py-2 rounded-xl font-extrabold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                    billingCycle === 'yearly'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Yearly Billing
                  <span className="px-2 py-0.5 bg-emerald-500 text-slate-950 font-black text-[9px] rounded-full uppercase">
                    Save 20%
                  </span>
                </button>
              </div>
            </div>

            {/* Plan Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {plans.map((plan) => {
                const isCurrent = currentTenant?.planId === plan.id;
                const displayPrice = billingCycle === 'yearly' ? Math.round(plan.priceYearly / 12) : plan.priceMonthly;

                return (
                  <div
                    key={plan.id}
                    className={`relative bg-white dark:bg-slate-900 border rounded-3xl p-5 flex flex-col justify-between shadow-sm hover:shadow-2xl transition-all ${
                      plan.isPopular
                        ? 'border-indigo-500 dark:border-indigo-500 ring-2 ring-indigo-500/30'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    {plan.isPopular && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-full shadow-md flex items-center gap-1">
                        <Star className="w-3 h-3 fill-amber-300 text-amber-300" /> Most Popular Choice
                      </div>
                    )}

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-base font-black text-slate-900 dark:text-white">{plan.name}</h3>
                        {isCurrent && (
                          <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold rounded-md">
                            Active
                          </span>
                        )}
                      </div>

                      <div className="mb-4">
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-black text-slate-900 dark:text-white">₹{displayPrice}</span>
                          <span className="text-xs font-bold text-slate-400">/ month</span>
                        </div>
                        {billingCycle === 'yearly' && plan.priceYearly > 0 && (
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block mt-0.5">
                            Billed annually (₹{plan.priceYearly}/yr)
                          </span>
                        )}
                      </div>

                      <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3 mb-4 text-xs font-bold text-slate-700 dark:text-slate-300">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-indigo-500" />
                          <span>{plan.customerLimit === -1 ? 'Unlimited' : plan.customerLimit} Customer Accounts</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-indigo-500" />
                          <span>{plan.loanLimit === -1 ? 'Unlimited' : plan.loanLimit} Transaction Entries</span>
                        </div>
                      </div>

                      <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3 text-xs">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                          Included Features:
                        </span>
                        {plan.features.map((feature, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-slate-600 dark:text-slate-300 font-medium text-[11px]">
                            <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => handleSelectPlan(plan)}
                      disabled={isCurrent}
                      className={`w-full mt-6 py-3 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        isCurrent
                          ? 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed'
                          : plan.isPopular
                          ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/30'
                          : 'bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white'
                      }`}
                    >
                      {isCurrent ? (
                        'Current Active Plan'
                      ) : (
                        <>
                          <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                          <span>Select Plan & Upgrade</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Feature Plan Comparison Matrix Table */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-sm">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-600" />
                <span>Commercial Feature Comparison Matrix</span>
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-3">Commercial Feature</th>
                      <th className="py-3 px-3 text-center">Basic Store</th>
                      <th className="py-3 px-3 text-center bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold">Standard</th>
                      <th className="py-3 px-3 text-center">Premium</th>
                      <th className="py-3 px-3 text-center">Enterprise</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    <tr>
                      <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">Customer Account Limit</td>
                      <td className="py-3 px-3 text-center">100</td>
                      <td className="py-3 px-3 text-center bg-indigo-50/30 dark:bg-indigo-950/20 font-bold text-indigo-600 dark:text-indigo-400">500</td>
                      <td className="py-3 px-3 text-center">2,000</td>
                      <td className="py-3 px-3 text-center font-bold">Unlimited</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">Transaction Entries</td>
                      <td className="py-3 px-3 text-center">500</td>
                      <td className="py-3 px-3 text-center bg-indigo-50/30 dark:bg-indigo-950/20 font-bold text-indigo-600 dark:text-indigo-400">Unlimited</td>
                      <td className="py-3 px-3 text-center font-bold">Unlimited</td>
                      <td className="py-3 px-3 text-center font-bold">Unlimited</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">WhatsApp Automated Reminders</td>
                      <td className="py-3 px-3 text-center text-slate-400">Manual</td>
                      <td className="py-3 px-3 text-center bg-indigo-50/30 dark:bg-indigo-950/20 text-emerald-600 font-bold">✔ Automated</td>
                      <td className="py-3 px-3 text-center text-emerald-600 font-bold">✔ Automated</td>
                      <td className="py-3 px-3 text-center text-emerald-600 font-bold">✔ Priority Batch</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">Dynamic UPI QR Codes</td>
                      <td className="py-3 px-3 text-center text-emerald-600 font-bold">✔ Standard</td>
                      <td className="py-3 px-3 text-center bg-indigo-50/30 dark:bg-indigo-950/20 text-emerald-600 font-bold">✔ Instant VPA</td>
                      <td className="py-3 px-3 text-center text-emerald-600 font-bold">✔ Instant VPA</td>
                      <td className="py-3 px-3 text-center text-emerald-600 font-bold">✔ Custom Merchant</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">Excel & PDF Reports Export</td>
                      <td className="py-3 px-3 text-center text-emerald-600 font-bold">✔ Standard</td>
                      <td className="py-3 px-3 text-center bg-indigo-50/30 dark:bg-indigo-950/20 text-emerald-600 font-bold">✔ Advanced</td>
                      <td className="py-3 px-3 text-center text-emerald-600 font-bold">✔ Custom Reports</td>
                      <td className="py-3 px-3 text-center text-emerald-600 font-bold">✔ Automated Email</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">Multi-Staff Logins</td>
                      <td className="py-3 px-3 text-center text-slate-400">—</td>
                      <td className="py-3 px-3 text-center bg-indigo-50/30 dark:bg-indigo-950/20 text-slate-400">—</td>
                      <td className="py-3 px-3 text-center text-emerald-600 font-bold">✔ Up to 5 Staff</td>
                      <td className="py-3 px-3 text-center text-emerald-600 font-bold">✔ Unlimited Staff</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">24/7 Priority Support</td>
                      <td className="py-3 px-3 text-center text-slate-400">Email</td>
                      <td className="py-3 px-3 text-center bg-indigo-50/30 dark:bg-indigo-950/20 text-emerald-600 font-bold">✔ WhatsApp Support</td>
                      <td className="py-3 px-3 text-center text-emerald-600 font-bold">✔ Phone & WhatsApp</td>
                      <td className="py-3 px-3 text-center text-emerald-600 font-bold">✔ Dedicated Manager</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Accordion FAQ Section */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-sm">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-indigo-600" />
                <span>Frequently Asked Questions</span>
              </h3>

              <div className="space-y-3">
                {[
                  {
                    q: 'Can I upgrade or switch my plan at any time?',
                    a: 'Yes, you can upgrade your plan at any point. Your remaining trial or active balance will be automatically credited towards the new plan.',
                  },
                  {
                    q: 'How does payment verification work?',
                    a: 'Payments are instantly processed via secure UPI VPA, Razorpay Gateway, or NetBanking. Once verified, your subscription activates automatically without restarting.',
                  },
                  {
                    q: 'Can I download GST invoice receipts for tax filings?',
                    a: 'Yes! Official tax invoice receipts with itemized GST breakdowns are generated immediately and stored in your Billing History tab for print or PDF download.',
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden text-xs"
                  >
                    <button
                      onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                      className="w-full p-4 text-left font-bold text-slate-900 dark:text-white flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 transition-colors"
                    >
                      <span>{item.q}</span>
                      {expandedFaq === idx ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    {expandedFaq === idx && (
                      <div className="p-4 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800">
                        {item.a}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ================= STEP 2: ORDER SUMMARY & REVIEW ================= */}
        {step === 'ORDER_SUMMARY' && selectedPlan && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xl space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-[10px] uppercase font-black tracking-widest text-indigo-500">
                    Step 2 • Order Summary
                  </span>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">Review Plan Details</h2>
                </div>
                <button
                  onClick={() => setStep('PLANS')}
                  className="px-3 py-1.5 text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
                >
                  Change Plan
                </button>
              </div>

              {/* Selected Plan Details Card */}
              <div className="p-5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white font-black flex items-center justify-center shadow-lg">
                    <Zap className="w-7 h-7 text-amber-300 fill-amber-300" />
                  </div>
                  <div>
                    <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[10px] font-extrabold rounded">
                      {billingCycle === 'yearly' ? 'Yearly Billing' : 'Monthly Billing'}
                    </span>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                      {selectedPlan.name}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {selectedPlan.customerLimit === -1 ? 'Unlimited' : selectedPlan.customerLimit} Customers • {selectedPlan.loanLimit === -1 ? 'Unlimited' : selectedPlan.loanLimit} Loans
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-2xl font-black text-slate-900 dark:text-white">₹{basePrice}</span>
                  <span className="text-xs text-slate-400 block">/ {billingCycle === 'yearly' ? 'year' : 'month'}</span>
                </div>
              </div>

              {/* Financial Breakdown Table */}
              <div className="space-y-3 text-xs">
                <h4 className="font-extrabold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                  Payment Breakdown
                </h4>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2.5">
                  <div className="flex justify-between text-slate-600 dark:text-slate-300 font-medium">
                    <span>Base Subscription Fee:</span>
                    <span className="font-bold text-slate-900 dark:text-white">₹{basePrice}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-300 font-medium">
                    <span>GST (18% Statutory Tax):</span>
                    <span className="font-bold text-slate-900 dark:text-white">₹{gstTax}</span>
                  </div>
                  {billingCycle === 'yearly' && (
                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                      <span>Annual Discount Saved (20%):</span>
                      <span>-₹{Math.round(selectedPlan.priceMonthly * 12 * 0.2)}</span>
                    </div>
                  )}
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-between items-baseline">
                    <span className="font-black text-slate-900 dark:text-white text-sm">Net Payable Total:</span>
                    <span className="font-black text-indigo-600 dark:text-indigo-400 text-2xl">₹{totalPrice}</span>
                  </div>
                </div>
              </div>

              {/* Renewal Terms */}
              <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-2xl text-xs text-amber-900 dark:text-amber-200 space-y-2">
                <div className="flex items-center gap-2 font-bold">
                  <Info className="w-4 h-4 text-amber-600" />
                  <span>Subscription Renewal Period</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Your new subscription will take effect immediately upon payment. Active validity will expire on{' '}
                  <span className="font-bold">
                    {new Date(
                      Date.now() + (billingCycle === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000
                    ).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>.
                </p>
              </div>

              {/* Terms Acceptance */}
              <label className="flex items-start gap-3 cursor-pointer text-xs text-slate-600 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                />
                <span>
                  I agree to the <span className="font-bold text-slate-900 dark:text-white">Commercial SaaS Terms of Service</span> and authorize instant verification.
                </span>
              </label>

              <button
                onClick={handleProceedToPayment}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-xl transition-all cursor-pointer text-sm flex items-center justify-center gap-2"
              >
                <span>Proceed to Secure Payment (₹{totalPrice})</span>
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 3: PAYMENT & VERIFICATION ================= */}
        {step === 'PAYMENT' && selectedPlan && (
          <form onSubmit={handleVerifyAndActivate} className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xl space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-[10px] uppercase font-black tracking-widest text-indigo-500">
                    Step 3 • Gateway & Verification
                  </span>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">Select Payment Gateway</h2>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Total Due</span>
                  <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">₹{totalPrice}</span>
                </div>
              </div>

              {/* Payment Method Selector Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('UPI')}
                  className={`p-4 rounded-2xl border font-bold transition-all flex flex-col items-center justify-center gap-2 cursor-pointer ${
                    paymentMethod === 'UPI'
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-600/30'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                  }`}
                >
                  <QrCode className="w-6 h-6" />
                  <span className="text-xs font-black">UPI Instant</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('RAZORPAY')}
                  className={`p-4 rounded-2xl border font-bold transition-all flex flex-col items-center justify-center gap-2 cursor-pointer ${
                    paymentMethod === 'RAZORPAY'
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-600/30'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                  }`}
                >
                  <Sparkles className="w-6 h-6 text-amber-500" />
                  <span className="text-xs font-black">Razorpay SDK</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('CARD')}
                  className={`p-4 rounded-2xl border font-bold transition-all flex flex-col items-center justify-center gap-2 cursor-pointer ${
                    paymentMethod === 'CARD'
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-600/30'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                  }`}
                >
                  <CreditCard className="w-6 h-6" />
                  <span className="text-xs font-black">Credit/Debit</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('NETBANKING')}
                  className={`p-4 rounded-2xl border font-bold transition-all flex flex-col items-center justify-center gap-2 cursor-pointer ${
                    paymentMethod === 'NETBANKING'
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-600/30'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                  }`}
                >
                  <Building2 className="w-6 h-6" />
                  <span className="text-xs font-black">NetBanking</span>
                </button>
              </div>

              {/* UPI Form */}
              {paymentMethod === 'UPI' && (
                <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4 text-xs">
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="w-32 h-32 p-2 bg-white rounded-2xl border border-slate-200 shadow-md flex items-center justify-center">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=${encodeURIComponent(
                          settings.upiId || ''
                        )}%26pn=${encodeURIComponent(
                          currentTenant?.companyName || 'Store'
                        )}%26am=${totalPrice}%26cu=INR`}
                        alt="UPI Payment QR Code"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="flex-1 space-y-1 text-center sm:text-left">
                      <span className="text-[10px] font-extrabold uppercase text-slate-400">Store UPI VPA ID</span>
                      <div className="font-mono text-base font-bold text-indigo-600 dark:text-indigo-400">
                        {settings.upiId || 'Not Configured'}
                      </div>
                      <p className="text-slate-500 leading-relaxed text-[11px]">
                        Scan with GPay, PhonePe, Paytm or BHIM app. After completing payment, enter your 12-digit UTR Transaction ID below.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      12-Digit UPI UTR / Ref Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={utrNumber}
                      onChange={(e) => setUtrNumber(e.target.value.replace(/\D/g, ''))}
                      placeholder="e.g. 421098765432"
                      maxLength={12}
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-base font-bold dark:text-white"
                    />
                  </div>
                </div>
              )}

              {/* Razorpay Form */}
              {paymentMethod === 'RAZORPAY' && (
                <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white">Razorpay Standard Merchant Gateway</span>
                    <button
                      type="button"
                      onClick={() => setShowRazorpayKeyInput(!showRazorpayKeyInput)}
                      className="text-indigo-600 font-bold hover:underline cursor-pointer"
                    >
                      {showRazorpayKeyInput ? 'Hide Keys' : '+ Configure API Key'}
                    </button>
                  </div>

                  {showRazorpayKeyInput && (
                    <div className="space-y-2 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                      <label className="block font-bold text-slate-700 dark:text-slate-300">
                        Razorpay Merchant Key ID (Optional for Live Production)
                      </label>
                      <input
                        type="text"
                        value={razorpayKeyId}
                        onChange={(e) => setRazorpayKeyId(e.target.value)}
                        placeholder="rzp_live_xxxxxxxxxxxx"
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono"
                      />
                    </div>
                  )}

                  <p className="text-slate-500 leading-relaxed text-[11px]">
                    Clicking activate will execute secure payment verification and update your tenant workspace instantly.
                  </p>
                </div>
              )}

              {/* Card Form */}
              {paymentMethod === 'CARD' && (
                <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Card Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold dark:text-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Expiry Date *
                      </label>
                      <input
                        type="text"
                        required
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        CVC / CVV *
                      </label>
                      <input
                        type="password"
                        required
                        value={cardCvc}
                        onChange={(e) => setCardCvc(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* NetBanking Form */}
              {paymentMethod === 'NETBANKING' && (
                <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3 text-xs">
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Select Indian Commercial Bank
                  </label>
                  <select
                    value={selectedBank}
                    onChange={(e) => setSelectedBank(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold dark:text-white"
                  >
                    <option>State Bank of India (SBI)</option>
                    <option>HDFC Bank</option>
                    <option>ICICI Bank</option>
                    <option>Axis Bank</option>
                    <option>Kotak Mahindra Bank</option>
                    <option>Punjab National Bank (PNB)</option>
                  </select>
                </div>
              )}

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-xl transition-all cursor-pointer text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Verifying & Syncing Workspace...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5 text-emerald-300" />
                    <span>Verify Payment & Activate Subscription (₹{totalPrice})</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* ================= STEP 4: SUCCESS PAGE ================= */}
        {step === 'SUCCESS' && activatedInvoice && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-2xl text-center space-y-6">
            <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto border-4 border-emerald-200 dark:border-emerald-900 animate-bounce">
              <CheckCircle2 className="w-12 h-12" />
            </div>

            <div>
              <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-black uppercase rounded-full">
                Verification Complete
              </span>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-2">
                ✅ Subscription Activated Successfully!
              </h2>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Your company workspace <span className="font-bold text-slate-900 dark:text-white">{currentTenant?.companyName}</span> has been upgraded to <span className="font-bold text-indigo-600 dark:text-indigo-400">{activatedInvoice.planName}</span>.
              </p>
            </div>

            {/* Official Tax Invoice Receipt Card */}
            <div className="p-5 bg-slate-50 dark:bg-slate-800/60 rounded-3xl border border-slate-200 dark:border-slate-700 text-left text-xs space-y-3 max-w-md mx-auto">
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-2.5">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Invoice Number</span>
                <span className="font-mono font-black text-slate-900 dark:text-white">{activatedInvoice.id}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Amount Paid</span>
                <span className="font-black text-emerald-600 dark:text-emerald-400 text-base">₹{activatedInvoice.amount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Payment Ref</span>
                <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300">{activatedInvoice.transactionRef}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Active Expiry Date</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                  {new Date(activatedInvoice.periodEnd!).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <button
                onClick={handlePrintInvoice}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-2xl transition-colors flex items-center justify-center gap-2 cursor-pointer text-xs"
              >
                <Download className="w-4 h-4" />
                <span>Download Invoice PDF</span>
              </button>

              <button
                onClick={onBack}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer text-xs"
              >
                <span>Go to Upgraded Dashboard</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
