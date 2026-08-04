import React from 'react';
import { motion } from 'motion/react';
import {
  Users,
  TrendingUp,
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  QrCode,
  Send,
  Plus,
  AlertCircle,
  ChevronRight,
  Calendar,
  Sparkles,
  Wallet,
  BadgeIndianRupee,
  CheckCircle2,
  Building2
} from 'lucide-react';
import { AppSettings, CustomerSummary, Transaction } from '../types';
import { DashboardStats } from '../utils/calculator';

interface DashboardProps {
  stats: DashboardStats;
  settings: AppSettings;
  onSelectCustomer: (customerId: string) => void;
  onOpenAddCustomer: () => void;
  onOpenAddTransaction: () => void;
  onSendReminder: (customer: CustomerSummary) => void;
  onShowQr: (customer: CustomerSummary) => void;
  transactions: Transaction[];
}

export const Dashboard: React.FC<DashboardProps> = ({
  stats,
  settings,
  onSelectCustomer,
  onOpenAddCustomer,
  onOpenAddTransaction,
  onSendReminder,
  onShowQr,
  transactions,
}) => {
  const currencySymbol = settings?.currency || '₹';
  const collectionTargetProgress =
    stats.totalLoanGiven > 0
      ? Math.round((stats.totalMoneyReceived / stats.totalLoanGiven) * 100)
      : 100;

  // Recent 5 transactions
  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const gridCards = [
    {
      id: 'today-collection',
      title: "Today's Collection",
      value: `${currencySymbol}${stats.todaysCollection.toLocaleString('en-IN')}`,
      subtitle: "Daily cash & UPI received",
      icon: Clock,
      bgGradient: 'from-purple-600 via-indigo-600 to-indigo-700',
      textColor: 'text-white',
      badgeColor: 'bg-white/20 text-white',
      iconBg: 'bg-white/10 text-white',
    },
    {
      id: 'total-received',
      title: 'Total Received',
      value: `${currencySymbol}${stats.totalMoneyReceived.toLocaleString('en-IN')}`,
      subtitle: `${collectionTargetProgress}% recovery rate`,
      icon: ArrowDownLeft,
      bgGradient: 'from-emerald-500 to-teal-600',
      textColor: 'text-white',
      badgeColor: 'bg-white/20 text-white',
      iconBg: 'bg-white/10 text-white',
    },
    {
      id: 'active-customers',
      title: 'Active Customers',
      value: `${stats.totalCustomers}`,
      subtitle: `${stats.topDueCustomers.length} accounts with pending due`,
      icon: Users,
      bgGradient: 'from-blue-600 to-indigo-600',
      textColor: 'text-white',
      badgeColor: 'bg-white/20 text-white',
      iconBg: 'bg-white/10 text-white',
    },
    {
      id: 'pending-amount',
      title: 'Pending Amount',
      value: `${currencySymbol}${stats.totalPendingDue.toLocaleString('en-IN')}`,
      subtitle: 'Outstanding due balance',
      icon: AlertCircle,
      bgGradient: 'from-rose-500 via-pink-600 to-rose-600',
      textColor: 'text-white',
      badgeColor: 'bg-white/20 text-white',
      iconBg: 'bg-white/10 text-white',
    },
    {
      id: 'total-loans',
      title: 'Total Loans',
      value: `${currencySymbol}${stats.totalLoanGiven.toLocaleString('en-IN')}`,
      subtitle: 'Total credit disbursed',
      icon: ArrowUpRight,
      bgGradient: 'from-amber-500 to-orange-600',
      textColor: 'text-white',
      badgeColor: 'bg-white/20 text-white',
      iconBg: 'bg-white/10 text-white',
    },
    {
      id: 'monthly-collection',
      title: 'Monthly Collection',
      value: `${currencySymbol}${stats.monthlyCollection.toLocaleString('en-IN')}`,
      subtitle: 'Collected this calendar month',
      icon: Calendar,
      bgGradient: 'from-cyan-600 to-blue-700',
      textColor: 'text-white',
      badgeColor: 'bg-white/20 text-white',
      iconBg: 'bg-white/10 text-white',
    },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Redesigned Statistics Responsive Grid (2 or 3 Columns) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
        {gridCards.map((card, idx) => {
          const IconComponent = card.icon;
          return (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
              className={`bg-gradient-to-br ${card.bgGradient} p-6 rounded-3xl ${card.textColor} shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col justify-between h-44 relative overflow-hidden group border border-white/10`}
            >
              {/* Background decorative element */}
              <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />

              <div className="relative z-10 flex items-center justify-between">
                <span className="text-xs font-black tracking-wider uppercase opacity-90">
                  {card.title}
                </span>
                <div className={`w-10 h-10 rounded-2xl ${card.iconBg} flex items-center justify-center shadow-inner shrink-0`}>
                  <IconComponent className="w-5 h-5" />
                </div>
              </div>

              <div className="relative z-10 my-auto">
                <h3 className="text-2xl sm:text-3xl font-black tracking-tight drop-shadow-sm">
                  {card.value}
                </h3>
              </div>

              <div className="relative z-10 flex items-center justify-between pt-1 text-[11px] font-semibold opacity-90">
                <span className="truncate">{card.subtitle}</span>
                <Sparkles className="w-3.5 h-3.5 opacity-60 flex-shrink-0" />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Main Content Grid: Pending Ledgers + Action Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Top Pending Dues Ledger Container */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden">
          <div className="p-6 sm:p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
            <div>
              <h4 className="text-lg font-black text-slate-900 dark:text-white">
                Customer Pending Accounts
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Highest outstanding ledgers requiring collection
              </p>
            </div>
            <button
              onClick={onOpenAddCustomer}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-2xl font-bold shadow-lg shadow-indigo-600/20 text-xs hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>New Customer</span>
            </button>
          </div>

          <div className="p-6 sm:p-8 space-y-4 flex-1">
            {stats.topDueCustomers.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm font-medium">
                🎉 Excellent! All customer balances are completely clear.
              </div>
            ) : (
              stats.topDueCustomers.map((customer) => (
                <div
                  key={customer.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50/80 dark:bg-slate-800/50 hover:bg-slate-100/80 dark:hover:bg-slate-800 rounded-2xl border border-slate-200/60 dark:border-slate-800 transition-all gap-4"
                >
                  <div
                    onClick={() => onSelectCustomer(customer.id)}
                    className="flex items-center gap-4 cursor-pointer flex-1"
                  >
                    <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-extrabold text-base shadow-sm shrink-0">
                      {customer.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h5 className="text-base font-bold text-slate-900 dark:text-white truncate">
                          {customer.name}
                        </h5>
                        {customer.remainingDue > 5000 && (
                          <span className="bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-300 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border border-rose-200 dark:border-rose-900 shrink-0">
                            High Due
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                        +91 {customer.phone}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-0 border-slate-200/60 dark:border-slate-700/60 pt-3 sm:pt-0">
                    <div className="text-left sm:text-right">
                      <p className="text-lg font-black text-rose-600 dark:text-rose-400">
                        {currencySymbol}{customer.remainingDue.toLocaleString('en-IN')}
                      </p>
                      <p className="text-[11px] text-slate-400 font-medium">
                        {customer.paymentPercentage}% repaid
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onShowQr(customer)}
                        className="p-2.5 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all border border-slate-200 dark:border-slate-700 shadow-sm cursor-pointer"
                        title="Show UPI QR"
                      >
                        <QrCode className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      </button>

                      <button
                        onClick={() => onSendReminder(customer)}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Remind
                      </button>

                      <button
                        onClick={() => onSelectCustomer(customer.id)}
                        className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Action & Activity Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          {/* Quick WhatsApp Reminder CTA */}
          <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-3xl p-6 flex flex-col items-center justify-center transition-all shadow-lg text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
              <Send className="w-6 h-6 text-emerald-200" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-extrabold">Instant Payment Request</h4>
              <p className="text-xs text-emerald-100 max-w-xs leading-relaxed">
                Send WhatsApp reminders with auto payment link & dynamic UPI QR Code.
              </p>
            </div>
            <button
              onClick={() => {
                if (stats.topDueCustomers.length > 0) {
                  onSendReminder(stats.topDueCustomers[0]);
                }
              }}
              className="mt-2 bg-white text-emerald-900 hover:bg-emerald-50 font-black px-6 py-3 rounded-2xl text-xs transition-all shadow-md cursor-pointer hover:scale-105 active:scale-95"
            >
              Send Top Due Reminder
            </button>
          </div>

          {/* Recent Timeline Stream */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <h5 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              Recent Transactions
            </h5>

            <div className="space-y-3">
              {recentTransactions.map((txn) => {
                const isLoan = txn.type === 'LOAN_GIVEN';
                return (
                  <div
                    key={txn.id}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs ${
                          isLoan
                            ? 'bg-rose-100 text-rose-600 dark:bg-rose-950/80 dark:text-rose-300'
                            : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/80 dark:text-emerald-300'
                        }`}
                      >
                        {isLoan ? '↓' : '↑'}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white line-clamp-1">
                          {txn.description || (isLoan ? 'Loan Given' : 'Money Received')}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {new Date(txn.date).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                          })}{' '}
                          • {txn.paymentMode}
                        </p>
                      </div>
                    </div>

                    <p
                      className={`font-black text-xs ${
                        isLoan ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {isLoan ? '+' : '-'}{currencySymbol}
                      {txn.amount.toLocaleString('en-IN')}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
