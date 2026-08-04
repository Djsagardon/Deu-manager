import React, { useState } from 'react';
import { AlertTriangle, Trash2, X, Clock, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { Transaction, CustomerSummary } from '../types';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  txn: Transaction | null;
  customer?: CustomerSummary | null;
  currencySymbol: string;
  onClose: () => void;
  onConfirmDelete: (txnId: string) => Promise<void> | void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  txn,
  customer,
  currencySymbol,
  onClose,
  onConfirmDelete,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !txn) return null;

  const isLoan = txn.type === 'LOAN_GIVEN';

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await onConfirmDelete(txn.id);
    } catch (err) {
      console.error('Delete transaction error:', err);
    } finally {
      setIsDeleting(false);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center flex-shrink-0 border border-rose-200 dark:border-rose-900/50">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Delete Transaction Entry
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Permanent ledger modification
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Required Message */}
        <div className="bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 p-4 rounded-2xl">
          <p className="text-sm font-semibold text-rose-900 dark:text-rose-200 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
            Are you sure you want to delete this transaction? This action cannot be undone.
          </p>
        </div>

        {/* Transaction Summary Card */}
        <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Transaction Details</span>
            {customer && <span className="text-indigo-600 dark:text-indigo-400 font-bold">{customer.name}</span>}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`p-1.5 rounded-lg text-white font-bold text-xs ${
                  isLoan ? 'bg-red-600' : 'bg-emerald-600'
                }`}
              >
                {isLoan ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
              </span>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  {txn.description || (isLoan ? 'Loan Given' : 'Payment Received')}
                </div>
                <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                  <Clock className="w-3 h-3" />
                  {new Date(txn.date).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            </div>

            <div className="text-right">
              <div
                className={`text-base font-extrabold ${
                  isLoan ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {isLoan ? '+' : '-'}{currencySymbol}
                {txn.amount.toLocaleString('en-IN')}
              </div>
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                {txn.paymentMode}
              </div>
            </div>
          </div>
        </div>

        {/* Explanatory Footer Note */}
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          Deleting this entry will remove it permanently. The customer's remaining due balance and ledger history will recalculate automatically across all devices.
        </p>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                Delete Transaction
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
