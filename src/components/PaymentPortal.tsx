import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  QrCode,
  Send,
  Building,
  CreditCard,
  Sparkles,
  FileText,
  User,
  Phone,
  ArrowRight,
  Zap,
  RefreshCw,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { AppSettings, Customer, PaymentClaim } from '../types';

interface PaymentPortalProps {
  claims: PaymentClaim[];
  customers: Customer[];
  settings: AppSettings;
  onSubmitClaim: (claimData: Omit<PaymentClaim, 'id' | 'status' | 'date'>) => void;
  onApproveClaim: (claimId: string) => void;
  onRejectClaim: (claimId: string, reason: string) => void;
  onRequestCorrection: (claimId: string) => void;
  onAutoVerifyPayment?: (paymentData: {
    customerId: string;
    customerName: string;
    customerPhone: string;
    amount: number;
    utrNumber: string;
  }) => void;
}

export const PaymentPortal: React.FC<PaymentPortalProps> = ({
  claims,
  customers,
  settings,
  onSubmitClaim,
  onApproveClaim,
  onRejectClaim,
  onRequestCorrection,
  onAutoVerifyPayment,
}) => {
  const currencySymbol = settings?.currency || '₹';
  const [activeTab, setActiveTab] = useState<'CLAIMS_LIST' | 'SUBMIT_FORM' | 'AUTO_SIMULATOR'>('CLAIMS_LIST');

  // Customer Form state
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [utrNumber, setUtrNumber] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [autoVerifyInstant, setAutoVerifyInstant] = useState(true);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  // Simulator State
  const [simCustomerId, setSimCustomerId] = useState(customers[0]?.id || '');
  const [simAmount, setSimAmount] = useState('1000');
  const [simUtr, setSimUtr] = useState(`6209${Math.floor(10000000 + Math.random() * 90000000)}`);
  const [simulatingStep, setSimulatingStep] = useState<number>(0);

  // Handle Customer Selection in form
  const handleSelectCustomer = (id: string) => {
    setSelectedCustomerId(id);
    const found = customers.find((c) => c.id === id);
    if (found) {
      setCustName(found.name);
      setCustPhone(found.phone);
    }
  };

  const handleSubmitClaimForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName || !custPhone || !payAmount || !utrNumber) {
      alert('Please fill in all required fields (Name, Phone, Amount, UTR Number)');
      return;
    }

    const parsedAmount = parseFloat(payAmount);

    if (autoVerifyInstant && onAutoVerifyPayment) {
      onAutoVerifyPayment({
        customerId: selectedCustomerId || 'guest',
        customerName: custName,
        customerPhone: custPhone,
        amount: parsedAmount,
        utrNumber: utrNumber.trim(),
      });
    } else {
      onSubmitClaim({
        customerId: selectedCustomerId || 'guest',
        customerName: custName,
        customerPhone: custPhone,
        amount: parsedAmount,
        utrNumber: utrNumber.trim(),
        screenshotUrl: screenshotUrl || undefined,
      });
    }

    setSubmittedSuccess(true);
    confetti({ particleCount: 60, spread: 70 });
  };

  const handleRunAutoSimulator = async () => {
    const targetCust = customers.find((c) => c.id === simCustomerId);
    if (!targetCust) {
      alert('Please select a valid customer for payment auto-verification.');
      return;
    }

    const parsedAmt = parseFloat(simAmount);
    if (isNaN(parsedAmt) || parsedAmt <= 0) {
      alert('Please enter a valid amount.');
      return;
    }

    setSimulatingStep(1); // Webhook payload received
    await new Promise((r) => setTimeout(r, 600));

    setSimulatingStep(2); // VPA and UTR matching
    await new Promise((r) => setTimeout(r, 600));

    setSimulatingStep(3); // Match confirmed
    await new Promise((r) => setTimeout(r, 500));

    if (onAutoVerifyPayment) {
      onAutoVerifyPayment({
        customerId: targetCust.id,
        customerName: targetCust.name,
        customerPhone: targetCust.phone,
        amount: parsedAmt,
        utrNumber: simUtr,
      });
    }

    confetti({ particleCount: 90, spread: 80 });
    setSimulatingStep(4); // Finished

    setTimeout(() => {
      setSimUtr(`6209${Math.floor(10000000 + Math.random() * 90000000)}`);
      setSimulatingStep(0);
    }, 2500);
  };

  const handleApprove = (claimId: string) => {
    onApproveClaim(claimId);
    confetti({ particleCount: 80, spread: 70 });
  };

  const pendingClaims = claims.filter((c) => c.status === 'PENDING');
  const pastClaims = claims.filter((c) => c.status !== 'PENDING');

  return (
    <div className="space-y-6">
      {/* View Switcher */}
      <div className="flex flex-col sm:flex-row items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-2xl shadow-sm gap-2">
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold w-full sm:w-auto">
          <button
            onClick={() => {
              setActiveTab('CLAIMS_LIST');
              setSubmittedSuccess(false);
            }}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg transition-all ${
              activeTab === 'CLAIMS_LIST'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Admin Verification ({pendingClaims.length})
          </button>
          <button
            onClick={() => setActiveTab('SUBMIT_FORM')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg transition-all ${
              activeTab === 'SUBMIT_FORM'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            "I Have Paid" Portal
          </button>
          <button
            onClick={() => setActiveTab('AUTO_SIMULATOR')}
            className={`flex-1 sm:flex-none px-3.5 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'AUTO_SIMULATOR'
                ? 'bg-gradient-to-r from-amber-500 to-emerald-600 text-white font-bold shadow-md'
                : 'text-amber-600 dark:text-amber-400 font-bold'
            }`}
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            Auto-Verify Simulator
          </button>
        </div>

        <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 pr-3 font-semibold">
          <Sparkles className="w-4 h-4 text-emerald-500" />
          UPI Auto Detection Active
        </div>
      </div>

      {/* Auto Verification Gateway Simulator */}
      {activeTab === 'AUTO_SIMULATOR' && (
        <div className="max-w-xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
              <Zap className="w-6 h-6 fill-current" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Payment Gateway Auto-Detection Engine
              </h3>
              <p className="text-xs text-slate-500">
                Simulate instant bank UPI QR scan & automated payment verification without manual admin refresh.
              </p>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Target Customer Account
              </label>
              <select
                value={simCustomerId}
                onChange={(e) => setSimCustomerId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-semibold"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} (+91 {c.phone})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Payment Amount ({currencySymbol})
                </label>
                <input
                  type="number"
                  value={simAmount}
                  onChange={(e) => setSimAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Bank UTR / Transaction ID
                </label>
                <input
                  type="text"
                  value={simUtr}
                  onChange={(e) => setSimUtr(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono"
                />
              </div>
            </div>

            {/* Simulation Steps Visualizer */}
            {simulatingStep > 0 && (
              <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-500" />
                  Processing Bank Webhook...
                </div>
                <div className="space-y-1 text-[11px] text-slate-500">
                  <div className={simulatingStep >= 1 ? 'text-emerald-600 font-semibold' : ''}>
                    ✓ Step 1: Receiving NPCI / Bank UPI callback payload
                  </div>
                  <div className={simulatingStep >= 2 ? 'text-emerald-600 font-semibold' : ''}>
                    ✓ Step 2: Matching VPA reference & UTR #{simUtr}
                  </div>
                  <div className={simulatingStep >= 3 ? 'text-emerald-600 font-semibold' : ''}>
                    ✓ Step 3: Verified! Updating customer ledger balance
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={handleRunAutoSimulator}
              disabled={simulatingStep > 0}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold rounded-2xl shadow-lg shadow-emerald-500/20 text-xs flex items-center justify-center gap-2 transition-all"
            >
              <Zap className="w-4 h-4 fill-current" />
              {simulatingStep > 0 ? 'Auto Verifying Payment...' : 'Simulate Instant UPI QR Scan & Payment'}
            </button>
          </div>
        </div>
      )}

      {/* Customer "I Have Paid" Portal */}
      {activeTab === 'SUBMIT_FORM' && (
        <div className="max-w-xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl">
          {submittedSuccess ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
                ✓
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Payment Proof Submitted!
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Thank you! Your UTR/Transaction Reference #{utrNumber} has been received. {settings.adminName} will verify and update your remaining due shortly.
              </p>
              <button
                onClick={() => {
                  setSubmittedSuccess(false);
                  setPayAmount('');
                  setUtrNumber('');
                }}
                className="px-5 py-2.5 bg-blue-600 text-white font-bold text-xs rounded-xl"
              >
                Submit Another Payment
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmitClaimForm} className="space-y-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Payment Confirmation ("I Have Paid")
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Enter your payment transaction reference (UTR) to confirm your payment with {settings.adminName}.
                </p>
              </div>

              {/* Customer Selector dropdown or input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Select Customer Account
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => handleSelectCustomer(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Choose Name from Customer List --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} (+91 {c.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Your Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={custName}
                    onChange={(e) => setCustName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={custPhone}
                    onChange={(e) => setCustPhone(e.target.value)}
                    placeholder="9876543210"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Amount Paid ({currencySymbol}) *
                  </label>
                  <input
                    type="number"
                    required
                    step="any"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    placeholder="2500"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs dark:text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    UTR / Ref No (12-digit) *
                  </label>
                  <input
                    type="text"
                    required
                    value={utrNumber}
                    onChange={(e) => setUtrNumber(e.target.value)}
                    placeholder="e.g. 620984112390"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs dark:text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Optional Screenshot URL
                </label>
                <input
                  type="url"
                  value={screenshotUrl}
                  onChange={(e) => setScreenshotUrl(e.target.value)}
                  placeholder="https://i.imgur.com/... or Google Drive link"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs dark:text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-sm transition-all shadow-md shadow-emerald-500/20"
              >
                Submit Payment Confirmation
              </button>
            </form>
          )}
        </div>
      )}

      {/* Admin Claims Verification List */}
      {activeTab === 'CLAIMS_LIST' && (
        <div className="space-y-6">
          {/* Pending Section */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Pending Payment Claims ({pendingClaims.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Verify customer UTR reference numbers before approving into customer balance.
                </p>
              </div>
            </div>

            {pendingClaims.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                No pending customer claims right now.
              </div>
            ) : (
              <div className="space-y-3">
                {pendingClaims.map((claim) => (
                  <div
                    key={claim.id}
                    className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-2xl"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white text-sm">
                          {claim.customerName}
                        </span>
                        <span className="text-xs text-slate-500">+91 {claim.customerPhone}</span>
                      </div>
                      <div className="text-xs font-mono text-slate-600 dark:text-slate-300 mt-1">
                        UTR No: <span className="font-bold text-blue-600">{claim.utrNumber}</span> • Submitted:{' '}
                        {new Date(claim.date).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-4">
                      <div className="text-right">
                        <div className="text-xs text-slate-400">Claimed Amount</div>
                        <div className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
                          {currencySymbol}
                          {claim.amount.toLocaleString('en-IN')}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleApprove(claim.id)}
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm"
                        >
                          ✓ Approve
                        </button>
                        <button
                          onClick={() => {
                            const reason = prompt('Enter rejection reason:') || 'Invalid UTR';
                            onRejectClaim(claim.id, reason);
                          }}
                          className="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-bold text-xs rounded-xl"
                        >
                          ✕ Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Past Claims History */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Claim Verification History ({pastClaims.length})
            </h3>

            {pastClaims.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs">
                No past claim approvals or rejections yet.
              </div>
            ) : (
              <div className="space-y-2">
                {pastClaims.map((claim) => (
                  <div
                    key={claim.id}
                    className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {claim.customerName}
                      </span>{' '}
                      • UTR: {claim.utrNumber}
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {currencySymbol}
                        {claim.amount.toLocaleString('en-IN')}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                          claim.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                        }`}
                      >
                        {claim.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
