import React, { useState, useEffect } from 'react';
import { X, ArrowDownLeft, ArrowUpRight, Save } from 'lucide-react';
import { AppSettings, CustomerSummary, PaymentMode, Transaction, TransactionType } from '../types';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: CustomerSummary[];
  settings?: AppSettings;
  defaultCustomerId?: string;
  defaultType?: TransactionType;
  editingTransaction?: Transaction | null;
  onAddTransaction?: (txnData: {
    customerId: string;
    type: TransactionType;
    amount: number;
    description: string;
    paymentMode: PaymentMode;
    date: string;
    id?: string;
  }) => void;
  onSaveTransaction?: (txnData: {
    customerId: string;
    type: TransactionType;
    amount: number;
    description: string;
    paymentMode: PaymentMode;
    date: string;
    id?: string;
  }) => void;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
  customers = [],
  settings,
  defaultCustomerId,
  defaultType = 'LOAN_GIVEN',
  editingTransaction,
  onAddTransaction,
  onSaveTransaction,
}) => {
  const currencySymbol = settings?.currency || '₹';
  const handleSave = onAddTransaction || onSaveTransaction;
  const [customerId, setCustomerId] = useState('');
  const [type, setType] = useState<TransactionType>('LOAN_GIVEN');
  const [amount, setAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('UPI');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 16));

  useEffect(() => {
    if (isOpen) {
      if (editingTransaction) {
        setCustomerId(editingTransaction.customerId);
        setType(editingTransaction.type);
        setAmount(editingTransaction.amount.toString());
        setPaymentMode(editingTransaction.paymentMode);
        setDescription(editingTransaction.description || '');
        const d = new Date(editingTransaction.date);
        setDate(!isNaN(d.getTime()) ? d.toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16));
      } else {
        if (defaultCustomerId) setCustomerId(defaultCustomerId);
        else if (customers.length > 0) setCustomerId(customers[0].id);

        setType(defaultType);
        setAmount('');
        setDescription('');
        setDate(new Date().toISOString().slice(0, 16));
      }
    }
  }, [isOpen, defaultCustomerId, defaultType, customers, editingTransaction]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) {
      alert('Please select a customer');
      return;
    }
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Please enter a valid amount greater than 0');
      return;
    }

    if (handleSave) {
      handleSave({
        id: editingTransaction?.id,
        customerId,
        type,
        amount: parsedAmount,
        description: description.trim() || (type === 'LOAN_GIVEN' ? 'Loan Issued' : 'Payment Received'),
        paymentMode,
        date: new Date(date).toISOString(),
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <h3 className="font-bold text-slate-900 dark:text-white text-base">
            {editingTransaction ? 'Edit Ledger Transaction Entry' : 'Add Ledger Transaction Entry'}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Transaction Type Tabs */}
          <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => setType('LOAN_GIVEN')}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold transition-all ${
                type === 'LOAN_GIVEN'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              Loan Given (Gave)
            </button>
            <button
              type="button"
              onClick={() => setType('MONEY_RECEIVED')}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold transition-all ${
                type === 'MONEY_RECEIVED'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <ArrowDownLeft className="w-4 h-4" />
              Payment Got (Received)
            </button>
          </div>

          {/* Customer Selection */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Select Customer Account *
            </label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-semibold text-sm"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} (+91 {c.phone}) - Due: {currencySymbol}{c.remainingDue}
                </option>
              ))}
            </select>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Amount ({currencySymbol}) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-extrabold text-lg text-slate-400">
                {currencySymbol}
              </span>
              <input
                type="number"
                required
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-extrabold text-slate-900 dark:text-white text-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Payment Mode */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Payment Mode
              </label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-semibold"
              >
                <option value="UPI">UPI (QR/GPay/PhonePe)</option>
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                <option value="Cheque">Cheque</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Date Time */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Transaction Date & Time
              </label>
              <input
                type="datetime-local"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Description / Note
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Invoice #102 material supply"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-500 font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-6 py-2.5 font-extrabold text-white rounded-xl shadow-md transition-all ${
                type === 'LOAN_GIVEN' ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              Save Entry
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
