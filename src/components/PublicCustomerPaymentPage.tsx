import React, { useState, useEffect } from 'react';
import {
  Building2,
  CheckCircle2,
  QrCode,
  Copy,
  Check,
  Send,
  ShieldCheck,
  AlertCircle,
  Phone,
  User,
  Calendar,
  ExternalLink,
  ArrowRight,
  Sparkles,
  Download,
  Zap,
  Clock
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { CustomerSummary, AppSettings, TenantWorkspace, PaymentClaim } from '../types';
import { generateUpiQrDataUrl, buildUpiPayUrl, formatPhoneNumberForWhatsApp, generateTransactionReference } from '../utils/upi';
import { saveClaimToFirestore } from '../utils/firebase';

interface PublicCustomerPaymentPageProps {
  phoneParam: string;
  customers: CustomerSummary[];
  settings: AppSettings;
  currentTenant: TenantWorkspace | null;
  onPaymentSubmitted?: (claim: PaymentClaim) => void;
}

export const PublicCustomerPaymentPage: React.FC<PublicCustomerPaymentPageProps> = ({
  phoneParam,
  customers,
  settings,
  currentTenant,
  onPaymentSubmitted,
}) => {
  const [customer, setCustomer] = useState<CustomerSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [copiedUpi, setCopiedUpi] = useState<boolean>(false);
  const [hasAttemptedUpiPay, setHasAttemptedUpiPay] = useState<boolean>(false);
  
  // Payment Proof Form
  const [utrNumber, setUtrNumber] = useState<string>('');
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [submittedUtr, setSubmittedUtr] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Parse URL search parameters for WhatsApp guest visitors
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const urlPhone = urlParams.get('phone') || urlParams.get('customerPhone') || phoneParam || '';
  const urlAmt = urlParams.get('amt') || urlParams.get('am') || urlParams.get('amount') || '';
  const urlName = urlParams.get('name') || urlParams.get('customerName') || '';
  const urlStore = urlParams.get('store') || urlParams.get('storeName') || urlParams.get('pn') || '';
  const urlUpi = urlParams.get('upi') || urlParams.get('pa') || '';
  const urlMc = urlParams.get('mc') || urlParams.get('mcc') || '';
  const urlNote = urlParams.get('note') || urlParams.get('tn') || '';

  const cleanPhone = formatPhoneNumberForWhatsApp(urlPhone || phoneParam);
  const currencySymbol = settings?.currency || currentTenant?.currency || '₹';
  const upiId = urlUpi || settings?.upiId || currentTenant?.upiId || '';

  // Determine Store Name cleanly without email addresses
  let storeName = urlStore || currentTenant?.companyName || settings?.appName || settings?.adminName || 'Mondal Traders';
  if (storeName.includes('@')) {
    storeName = storeName.split('@')[0];
  }
  if (!storeName || storeName.toLowerCase() === 'due manager') {
    storeName = 'Mondal Traders';
  }

  useEffect(() => {
    setLoading(true);
    let matched: CustomerSummary | null = null;
    if (customers && customers.length > 0) {
      matched = customers.find((c) => {
        const cClean = formatPhoneNumberForWhatsApp(c.phone);
        return cClean === cleanPhone || c.phone.replace(/\D/g, '') === cleanPhone.replace(/\D/g, '');
      }) || null;
    }

    if (matched) {
      setCustomer(matched);
      setCustomAmount(matched.remainingDue > 0 ? String(matched.remainingDue) : '0');
    } else {
      const fallbackAmt = urlAmt ? parseFloat(urlAmt) : 0;
      const fallbackName = urlName || 'Valued Customer';
      setCustomer({
        id: 'cust_whatsapp_guest',
        name: fallbackName,
        phone: cleanPhone || urlPhone || '0000000000',
        remainingDue: fallbackAmt,
        totalLoan: fallbackAmt,
        totalPaid: 0,
        loanCount: 1,
        lastTransactionDate: new Date().toISOString(),
      });
      if (fallbackAmt > 0) {
        setCustomAmount(String(fallbackAmt));
      }
    }
    setLoading(false);
  }, [customers, cleanPhone, urlAmt, urlName, urlPhone]);

  // Generate UPI QR Code Data URL
  useEffect(() => {
    if (customer && upiId && (customer.remainingDue > 0 || parseFloat(customAmount) > 0 || (urlAmt && parseFloat(urlAmt) > 0))) {
      const amountToPay = parseFloat(customAmount) || customer.remainingDue || (urlAmt ? parseFloat(urlAmt) : 0);
      const mc = urlMc || '5411';
      const customerDisplayName = customer?.name && customer.name !== 'Valued Customer' ? customer.name : (urlName || 'Customer');
      const paymentNote = urlNote || `${customerDisplayName} - Due Payment`;

      generateUpiQrDataUrl(
        upiId,
        storeName,
        amountToPay,
        paymentNote,
        mc
      ).then((url) => {
        setQrCodeDataUrl(url);
      });
    }
  }, [customer, upiId, storeName, customAmount, urlAmt, urlName, urlMc, urlNote]);

  const handleCopyUpi = () => {
    if (!upiId) return;
    navigator.clipboard.writeText(upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handlePayViaUpiApp = () => {
    if (!upiId || !upiId.trim()) {
      alert('Merchant UPI ID is not configured. Please contact the store.');
      return;
    }
    const amt = parseFloat(customAmount) || (customer?.remainingDue || (urlAmt ? parseFloat(urlAmt) : 0));
    if (isNaN(amt) || amt <= 0) {
      alert('Please enter a valid payment amount greater than ₹0.');
      return;
    }

    const mc = urlMc || '5411';
    const customerDisplayName = customer?.name && customer.name !== 'Valued Customer' ? customer.name : (urlName || 'Customer');
    const paymentNote = urlNote || `${customerDisplayName} - Due Payment`;

    const upiDeepLink = buildUpiPayUrl(
      upiId,
      storeName,
      amt,
      paymentNote,
      mc
    );
    
    setHasAttemptedUpiPay(true);

    try {
      const a = document.createElement('a');
      a.href = upiDeepLink;
      a.rel = 'noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (_e) {
      window.location.href = upiDeepLink;
    }
  };

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!utrNumber.trim()) {
      setErrorMsg('Please enter your 12-digit UPI Transaction ID / UTR number.');
      return;
    }

    if (utrNumber.trim().length < 6) {
      setErrorMsg('Transaction ID (UTR) must be at least 6 digits.');
      return;
    }

    const payAmt = parseFloat(customAmount) || customer?.remainingDue || 0;
    if (payAmt <= 0) {
      setErrorMsg('Please enter a valid payment amount greater than 0.');
      return;
    }

    setIsSubmitting(true);
    try {
      const claim: PaymentClaim = {
        id: `claim-cust-${Date.now()}`,
        tenantId: currentTenant?.id || settings?.tenantId || urlParams.get('tenant') || 'default_tenant',
        customerId: customer?.id || 'guest',
        customerName: customer?.name || 'Customer',
        customerPhone: cleanPhone || customer?.phone || phoneParam,
        amount: payAmt,
        utrNumber: utrNumber.trim(),
        date: new Date().toISOString(),
        status: 'PENDING',
      };

      await saveClaimToFirestore(claim, currentTenant?.id || urlParams.get('tenant') || 'default_tenant');
      if (onPaymentSubmitted) {
        onPaymentSubmitted(claim);
      }

      setSubmittedUtr(utrNumber.trim());
      setIsSubmitted(true);
      confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
    } catch (err: any) {
      console.error('Failed to submit payment confirmation:', err);
      setErrorMsg(err?.message || 'Failed to submit payment proof. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const pendingDue = customer ? customer.remainingDue : 0;
  const payAmt = parseFloat(customAmount) || pendingDue;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-3 sm:p-6 font-sans">
      <div className="w-full max-w-lg bg-slate-800/90 backdrop-blur-xl border border-slate-700/70 rounded-3xl shadow-2xl overflow-hidden my-4">
        
        {/* Header Branding */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 p-6 text-white text-center relative">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md mb-3 border border-white/20 shadow-inner">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tight">{storeName}</h1>
          <div className="flex items-center justify-center gap-1.5 mt-1 text-xs text-emerald-100 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-300 fill-emerald-500/20" />
            <span>Verified Business Payment Portal</span>
          </div>
        </div>

        {/* Content Body */}
        {isSubmitted ? (
          <div className="p-8 text-center space-y-6 animate-fade-in">
            <div className="w-20 h-20 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto text-3xl font-bold shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-12 h-12" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold text-white">Payment Proof Submitted!</h2>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Your payment confirmation has been securely sent to <strong className="text-slate-200">{storeName}</strong>.
              </p>
            </div>

            <div className="bg-slate-900/80 border border-slate-700/80 rounded-2xl p-4 text-left space-y-2 font-mono text-xs">
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Customer Name:</span>
                <span className="font-bold text-slate-200">{customer?.name || 'Customer'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Amount Submitted:</span>
                <span className="font-bold text-emerald-400">{currencySymbol}{payAmt.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Transaction ID (UTR):</span>
                <span className="font-bold text-blue-400">{submittedUtr}</span>
              </div>
              <div className="flex justify-between pt-1 text-[11px]">
                <span className="text-slate-400">Status:</span>
                <span className="text-amber-400 font-bold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 fill-current text-amber-400" />
                  Payment Verification Pending
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                setIsSubmitted(false);
                setUtrNumber('');
              }}
              className="w-full py-3.5 bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs rounded-2xl transition-all"
            >
              Submit Another Transaction Reference
            </button>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            
            {/* Customer & Due Summary Card */}
            <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Customer Name</div>
                    <div className="font-extrabold text-white text-sm">{customer ? customer.name : 'Valued Customer'}</div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Mobile Number</div>
                  <div className="font-mono text-xs text-slate-300 font-bold">+{cleanPhone || phoneParam}</div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pending Balance</div>
                  <div className="text-3xl font-black text-rose-400 tracking-tight mt-0.5">
                    {currencySymbol}{pendingDue.toLocaleString('en-IN')}
                  </div>
                </div>

                {customer?.dueDate && (
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center justify-end gap-1">
                      <Calendar className="w-3 h-3 text-amber-400" />
                      Due Date
                    </div>
                    <div className="text-xs font-bold text-amber-300 mt-1">
                      {new Date(customer.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Verification Pending Banner if Pay clicked */}
            {hasAttemptedUpiPay && (
              <div className="p-4 bg-amber-950/70 border border-amber-600/70 rounded-2xl space-y-2 text-xs animate-fade-in shadow-lg">
                <div className="flex items-center gap-2 text-amber-300 font-extrabold text-sm">
                  <Clock className="w-4 h-4 text-amber-400 animate-spin flex-shrink-0" />
                  <span>Payment Verification Pending</span>
                </div>
                <p className="text-amber-200/90 leading-relaxed">
                  UPI Payment for <strong className="text-white">{currencySymbol}{payAmt.toLocaleString('en-IN')}</strong> was launched. Once completed in your UPI app, please enter your 12-digit Transaction ID / UTR number below to confirm your payment with <strong className="text-white">{storeName}</strong>.
                </p>
              </div>
            )}

            {/* UPI Payment Methods */}
            {upiId ? (
              <div className="space-y-4">
                
                {/* Option 1: One-Tap Pay via UPI App */}
                <div className="p-4 bg-gradient-to-r from-emerald-950/40 to-teal-950/40 border border-emerald-500/30 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-emerald-300 flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-emerald-400 fill-current" />
                      Instant UPI App Payment
                    </span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                      GPay • PhonePe • Paytm
                    </span>
                  </div>

                  <button
                    onClick={handlePayViaUpiApp}
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <span>Pay {currencySymbol}{payAmt.toLocaleString('en-IN')} via UPI App</span>
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>

                {/* Option 2: QR Code & UPI Copy */}
                <div className="p-5 bg-slate-900/60 border border-slate-700/60 rounded-2xl text-center space-y-3">
                  <div className="text-xs font-extrabold text-slate-300 flex items-center justify-center gap-1.5">
                    <QrCode className="w-4 h-4 text-indigo-400" />
                    Scan Merchant Payment QR Code
                  </div>

                  {qrCodeDataUrl ? (
                    <div className="w-48 h-48 mx-auto bg-white p-2 rounded-2xl border-2 border-indigo-500/30 shadow-xl flex items-center justify-center">
                      <img src={qrCodeDataUrl} alt="UPI Payment QR Code" className="w-full h-full object-contain" />
                    </div>
                  ) : (
                    <div className="w-48 h-48 mx-auto bg-slate-800 rounded-2xl flex items-center justify-center text-slate-500 text-xs">
                      Generating QR Code...
                    </div>
                  )}

                  <div className="flex items-center justify-center gap-2 pt-1">
                    <span className="text-xs text-slate-400 font-mono">UPI ID: <strong className="text-slate-200">{upiId}</strong></span>
                    <button
                      onClick={handleCopyUpi}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-400 rounded-lg transition-all cursor-pointer"
                      title="Copy UPI ID"
                    >
                      {copiedUpi ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

              </div>
            ) : (
              <div className="p-4 bg-amber-950/30 border border-amber-800/50 rounded-2xl text-center text-xs text-amber-200 space-y-1">
                <p className="font-bold">UPI Payments Available on Request</p>
                <p className="text-[11px] text-amber-300/80">
                  Please contact {storeName} directly or pay via cash/bank transfer.
                </p>
              </div>
            )}

            {/* Payment Proof / UTR Submission Form */}
            <form onSubmit={handleSubmitProof} className="bg-slate-900/80 border border-slate-700/80 rounded-2xl p-5 space-y-4">
              <div>
                <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                  <Send className="w-4 h-4 text-emerald-400" />
                  Submit Payment Confirmation (UTR)
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Already paid via GPay, PhonePe, Paytm, or Bank? Enter your transaction reference number to instantly notify {storeName}.
                </p>
              </div>

              {errorMsg && (
                <div className="p-3 bg-rose-950/50 border border-rose-800/80 rounded-xl text-xs text-rose-300 flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Payment Amount ({currencySymbol}) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-extrabold text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    UPI Transaction ID / UTR Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 423891029812"
                    value={utrNumber}
                    onChange={(e) => setUtrNumber(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono text-sm tracking-wide focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {isSubmitting ? (
                  <span>Submitting Payment Proof...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm Payment & Send UTR</span>
                  </>
                )}
              </button>
            </form>

          </div>
        )}

        {/* Footer */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 text-center text-[11px] text-slate-500 font-medium">
          Powered by <strong className="text-slate-400">{storeName}</strong> • Secured Customer Portal
        </div>

      </div>
    </div>
  );
};

