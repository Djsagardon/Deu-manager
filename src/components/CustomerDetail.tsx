import React, { useState } from 'react';
import {
  ArrowLeft,
  Phone,
  PhoneCall,
  Send,
  QrCode,
  Printer,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  Filter,
  FileText,
  Clock,
  Trash2,
  Edit2,
  Share2,
  MapPin,
  Info
} from 'lucide-react';
import { AppSettings, CustomerSummary, Transaction } from '../types';
import { printCustomerStatement } from '../utils/export';

interface CustomerDetailProps {
  customer: CustomerSummary;
  transactions: Transaction[];
  settings: AppSettings;
  onBack: () => void;
  onEditCustomer?: (customer: CustomerSummary) => void;
  onDeleteCustomer?: (customerId: string) => void;
  onAddTransactionForCustomer: (type: 'LOAN_GIVEN' | 'MONEY_RECEIVED') => void;
  onDeleteTransaction: (txnId: string) => void;
  onEditTransaction?: (txn: Transaction) => void;
  onSendReminder: (customer: CustomerSummary) => void;
  onShowQr: (customer: CustomerSummary) => void;
}

export const CustomerDetail: React.FC<CustomerDetailProps> = ({
  customer,
  transactions,
  settings,
  onBack,
  onEditCustomer,
  onDeleteCustomer,
  onAddTransactionForCustomer,
  onDeleteTransaction,
  onEditTransaction,
  onSendReminder,
  onShowQr,
}) => {
  const currencySymbol = settings?.currency || '₹';
  const [timeFilter, setTimeFilter] = useState<'ALL' | 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH'>('ALL');

  // Filter customer transactions
  const customerTxns = transactions
    .filter((t) => t.customerId === customer.id)
    .filter((t) => {
      if (timeFilter === 'ALL') return true;

      const tTime = new Date(t.date).getTime();
      const now = new Date();

      if (timeFilter === 'TODAY') {
        const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        return tTime >= startToday;
      }

      if (timeFilter === 'THIS_WEEK') {
        const startWeek = now.getTime() - 7 * 24 * 60 * 60 * 1000;
        return tTime >= startWeek;
      }

      if (timeFilter === 'THIS_MONTH') {
        const startMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        return tTime >= startMonth;
      }

      return true;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-medium text-sm transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Customers
        </button>

        <div className="flex flex-wrap items-center gap-2">
          {onEditCustomer && (
            <button
              onClick={() => onEditCustomer(customer)}
              className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-bold transition-all border border-indigo-200 dark:border-indigo-800"
            >
              <Edit2 className="w-3.5 h-3.5" />
              Edit Customer
            </button>
          )}

          {onDeleteCustomer && (
            <button
              onClick={() => onDeleteCustomer(customer.id)}
              className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-bold transition-all border border-rose-200 dark:border-rose-800"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Record
            </button>
          )}

          <button
            onClick={() => printCustomerStatement(customer, transactions, settings)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition-all border border-slate-200 dark:border-slate-700"
          >
            <Printer className="w-4 h-4 text-blue-600" />
            Print Statement
          </button>

          <button
            onClick={() => onShowQr(customer)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition-all border border-slate-200 dark:border-slate-700"
          >
            <QrCode className="w-4 h-4 text-blue-600" />
            Pay QR Code
          </button>

          <button
            onClick={() => onSendReminder(customer)}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all shadow-sm"
          >
            <Send className="w-3.5 h-3.5" />
            WhatsApp Reminder
          </button>
        </div>
      </div>

      {/* Customer Overview Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-6 md:p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start md:items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/60 text-indigo-600 dark:text-indigo-400 font-extrabold text-2xl flex items-center justify-center shadow-sm overflow-hidden flex-shrink-0">
              {customer.photoUrl ? (
                <img src={customer.photoUrl} alt={customer.name} className="w-full h-full object-cover" />
              ) : (
                customer.name.slice(0, 2).toUpperCase()
              )}
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {customer.name}
              </h2>

              {/* Call Buttons Section */}
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={`tel:${customer.phone}`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full font-bold text-xs shadow-sm transition-all"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  Call +91 {customer.phone}
                </a>

                {customer.alternatePhone && (
                  <a
                    href={`tel:${customer.alternatePhone}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-full font-bold text-xs transition-all"
                  >
                    <Phone className="w-3.5 h-3.5 text-indigo-500" />
                    Alt: +91 {customer.alternatePhone}
                  </a>
                )}
              </div>

              {/* Location & Metadata */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-1">
                {customer.address && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                    {customer.address}
                  </div>
                )}

                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Added: {new Date(customer.dateAdded).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>

                {customer.lastUpdated && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    Updated: {new Date(customer.lastUpdated).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Balance Cards */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-slate-50/80 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-right min-w-[120px]">
              <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Total Loan</div>
              <div className="text-lg font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                {currencySymbol}
                {customer.totalLoanGiven.toLocaleString('en-IN')}
              </div>
            </div>

            <div className="bg-slate-50/80 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-right min-w-[120px]">
              <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Total Paid</div>
              <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                {currencySymbol}
                {customer.totalMoneyReceived.toLocaleString('en-IN')}
              </div>
            </div>

            <div className="bg-rose-50 dark:bg-rose-950/40 p-4 rounded-2xl border border-rose-200 dark:border-rose-900 text-right min-w-[140px]">
              <div className="text-xs text-rose-600 dark:text-rose-400 font-black uppercase tracking-wider">
                Pending Due
              </div>
              <div className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 mt-0.5">
                {currencySymbol}
                {customer.remainingDue.toLocaleString('en-IN')}
              </div>
            </div>
          </div>
        </div>

        {/* Customer Notes */}
        {customer.notes && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 flex items-start gap-2">
            <Info className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-700 dark:text-slate-300">Notes:</span>{' '}
              {customer.notes}
            </div>
          </div>
        )}
      </div>

      {/* Action Bar for New Entry */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-medium w-full sm:w-auto">
          <button
            onClick={() => setTimeFilter('ALL')}
            className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg transition-all ${
              timeFilter === 'ALL'
                ? 'bg-white dark:bg-slate-900 font-bold text-blue-600 shadow-sm'
                : 'text-slate-500'
            }`}
          >
            All History
          </button>
          <button
            onClick={() => setTimeFilter('TODAY')}
            className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg transition-all ${
              timeFilter === 'TODAY'
                ? 'bg-white dark:bg-slate-900 font-bold text-blue-600 shadow-sm'
                : 'text-slate-500'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setTimeFilter('THIS_WEEK')}
            className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg transition-all ${
              timeFilter === 'THIS_WEEK'
                ? 'bg-white dark:bg-slate-900 font-bold text-blue-600 shadow-sm'
                : 'text-slate-500'
            }`}
          >
            This Week
          </button>
          <button
            onClick={() => setTimeFilter('THIS_MONTH')}
            className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg transition-all ${
              timeFilter === 'THIS_MONTH'
                ? 'bg-white dark:bg-slate-900 font-bold text-blue-600 shadow-sm'
                : 'text-slate-500'
            }`}
          >
            This Month
          </button>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => onAddTransactionForCustomer('LOAN_GIVEN')}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition-all shadow-sm"
          >
            <ArrowUpRight className="w-4 h-4" />
            + Loan Given (Gave)
          </button>

          <button
            onClick={() => onAddTransactionForCustomer('MONEY_RECEIVED')}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all shadow-sm"
          >
            <ArrowDownLeft className="w-4 h-4" />
            + Payment Received (Got)
          </button>
        </div>
      </div>

      {/* Payment Timeline Ledger */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-900 dark:text-white text-base">
          Ledger Transaction Timeline ({customerTxns.length})
        </h3>

        {customerTxns.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-sm">
            No transaction records found for this period filter.
          </div>
        ) : (
          <div className="space-y-3 relative before:absolute before:inset-0 before:left-5 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
            {customerTxns.map((txn) => {
              const isLoan = txn.type === 'LOAN_GIVEN';
              return (
                <div
                  key={txn.id}
                  className="relative flex items-start justify-between gap-4 p-4 pl-12 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 transition-all"
                >
                  {/* Timeline Badge */}
                  <div
                    className={`absolute left-2.5 top-5 w-5 h-5 rounded-full flex items-center justify-center font-bold text-xs ${
                      isLoan
                        ? 'bg-red-600 text-white ring-4 ring-red-100 dark:ring-red-950'
                        : 'bg-emerald-600 text-white ring-4 ring-emerald-100 dark:ring-emerald-950'
                    }`}
                  >
                    {isLoan ? '↓' : '↑'}
                  </div>

                  {/* Details */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white text-sm">
                        {txn.description || (isLoan ? 'Loan Stock Supply' : 'Payment Received')}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        {txn.paymentMode}
                      </span>
                    </div>

                    <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
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

                  {/* Amount & Actions */}
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div
                        className={`text-base font-extrabold ${
                          isLoan ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {isLoan ? '+' : '-'}{currencySymbol}
                        {txn.amount.toLocaleString('en-IN')}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {isLoan ? 'Debit (You Gave)' : 'Credit (You Got)'}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {onEditTransaction && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditTransaction(txn);
                          }}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg transition-colors cursor-pointer"
                          title="Edit Entry"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteTransaction(txn.id);
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-lg transition-colors cursor-pointer"
                        title="Delete Transaction Entry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
