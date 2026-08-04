import React, { useState } from 'react';
import { X, ShieldCheck, CreditCard, QrCode, CheckCircle2, Lock, ArrowRight, Building2, Sparkles, FileText, AlertTriangle } from 'lucide-react';
import { SubscriptionPlan, TenantWorkspace, Invoice } from '../../types';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: SubscriptionPlan | null;
  billingCycle: 'monthly' | 'yearly';
  currentTenant: TenantWorkspace | null;
  onPaymentSuccess: (invoice: Invoice, updatedTenant: TenantWorkspace) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  plan,
  billingCycle,
  currentTenant,
  onPaymentSuccess,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'CARD' | 'UPI' | 'NETBANKING'>('CARD');
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('888');
  const [upiIdInput, setUpiIdInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [generatedInvoice, setGeneratedInvoice] = useState<Invoice | null>(null);

  if (!isOpen || !plan || !currentTenant) return null;

  const price = billingCycle === 'yearly' ? plan.priceYearly : plan.priceMonthly;

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      // Simulate Payment Gateway verification
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const now = new Date();
      const validUntil = new Date(now);
      if (billingCycle === 'yearly') {
        validUntil.setFullYear(now.getFullYear() + 1);
      } else {
        validUntil.setMonth(now.getMonth() + 1);
      }

      const invoice: Invoice = {
        id: `INV_${Date.now()}`,
        tenantId: currentTenant.id,
        companyName: currentTenant.companyName,
        amount: price,
        currency: currentTenant.currency || '₹',
        planId: plan.id,
        planName: plan.name,
        status: 'PAID',
        paymentMethod: paymentMethod === 'CARD' ? 'Credit/Debit Card' : paymentMethod === 'UPI' ? `UPI (${upiIdInput})` : 'NetBanking',
        date: now.toISOString(),
        transactionRef: `TXN_PG_${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
        periodStart: now.toISOString(),
        periodEnd: validUntil.toISOString(),
      };

      const updatedTenant: TenantWorkspace = {
        ...currentTenant,
        planId: plan.id,
        planName: plan.name,
        status: 'ACTIVE',
        customerLimit: plan.customerLimit,
        loanLimit: plan.loanLimit,
        validUntil: validUntil.toISOString(),
      };

      setGeneratedInvoice(invoice);
      setIsSuccess(true);
      onPaymentSuccess(invoice, updatedTenant);
    } catch (err) {
      console.error('Payment checkout error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white rounded-xl hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 text-indigo-400 font-extrabold text-[10px] uppercase tracking-widest mb-1">
            <Lock className="w-3.5 h-3.5 text-emerald-400" /> Secure SSL SaaS Payment Checkout
          </div>
          <h3 className="text-xl font-black">{plan.name} Plan Activation</h3>
          <p className="text-xs text-slate-400 mt-1">
            Workspace: <span className="text-white font-bold">{currentTenant.companyName}</span>
          </p>
        </div>

        {isSuccess && generatedInvoice ? (
          <div className="p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border-4 border-emerald-200 dark:border-emerald-900 animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h4 className="text-lg font-black text-slate-900 dark:text-white">Payment Verified & Plan Activated!</h4>
              <p className="text-xs text-slate-500 mt-1">
                Your company workspace has been upgraded to <span className="font-bold text-indigo-600">{plan.name}</span>.
              </p>
            </div>

            {/* Receipt Summary Card */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-left text-xs space-y-2">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                <span className="text-slate-500 font-semibold">Invoice Ref:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{generatedInvoice.id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-semibold">Plan Amount Paid:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{generatedInvoice.currency}{generatedInvoice.amount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-semibold">Payment Gateway Ref:</span>
                <span className="font-mono text-[10px] text-slate-600 dark:text-slate-300">{generatedInvoice.transactionRef}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-semibold">Subscription Active Until:</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                  {new Date(generatedInvoice.periodEnd!).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-lg transition-all"
            >
              Continue to Upgraded Workspace
            </button>
          </div>
        ) : (
          <form onSubmit={handlePay} className="p-6 space-y-4 text-xs">
            {/* Price Summary Banner */}
            <div className="bg-indigo-50 dark:bg-indigo-950/40 p-4 rounded-2xl border border-indigo-200 dark:border-indigo-900/60 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                  Total Due Now ({billingCycle})
                </span>
                <div className="text-2xl font-black text-indigo-950 dark:text-indigo-100">
                  {currentTenant.currency || '₹'}{price}
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Customer Limit</span>
                <div className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                  {plan.customerLimit === -1 ? 'Unlimited' : plan.customerLimit} accounts
                </div>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-2">
                Select Payment Method
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('CARD')}
                  className={`p-3 rounded-xl border font-bold transition-all flex flex-col items-center gap-1 ${
                    paymentMethod === 'CARD'
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <CreditCard className="w-5 h-5" />
                  <span>Card</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('UPI')}
                  className={`p-3 rounded-xl border font-bold transition-all flex flex-col items-center gap-1 ${
                    paymentMethod === 'UPI'
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <QrCode className="w-5 h-5" />
                  <span>UPI Instant</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('NETBANKING')}
                  className={`p-3 rounded-xl border font-bold transition-all flex flex-col items-center gap-1 ${
                    paymentMethod === 'NETBANKING'
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Building2 className="w-5 h-5" />
                  <span>NetBanking</span>
                </button>
              </div>
            </div>

            {paymentMethod === 'CARD' ? (
              <div className="space-y-3 pt-2">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Card Number
                  </label>
                  <input
                    type="text"
                    required
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono dark:text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Expiry Date
                    </label>
                    <input
                      type="text"
                      required
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      CVC / CVV
                    </label>
                    <input
                      type="password"
                      required
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono dark:text-white"
                    />
                  </div>
                </div>
              </div>
            ) : paymentMethod === 'UPI' ? (
              <div className="space-y-3 pt-2">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Virtual Payment Address (UPI VPA ID)
                  </label>
                  <input
                    type="text"
                    required
                    value={upiIdInput}
                    onChange={(e) => setUpiIdInput(e.target.value)}
                    placeholder="mybusiness@oksbi"
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-blue-600 dark:text-blue-400"
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  A payment collect request will be pushed to your GPay / PhonePe / Paytm mobile app.
                </p>
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Select Your Bank
                </label>
                <select className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold dark:text-white">
                  <option>State Bank of India (SBI)</option>
                  <option>HDFC Bank</option>
                  <option>ICICI Bank</option>
                  <option>Axis Bank</option>
                  <option>Kotak Mahindra Bank</option>
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 text-sm cursor-pointer disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verifying Payment Gateway...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5 text-emerald-300" />
                  <span>Pay {currentTenant.currency || '₹'}{price} & Activate Subscription</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
