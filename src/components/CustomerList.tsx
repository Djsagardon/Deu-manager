import React, { useState } from 'react';
import {
  Search,
  UserPlus,
  Phone,
  PhoneCall,
  QrCode,
  Send,
  MoreVertical,
  Filter,
  ArrowUpDown,
  CheckCircle2,
  AlertCircle,
  Archive,
  Edit2,
  Trash2,
  Plus
} from 'lucide-react';
import { AppSettings, CustomerSummary } from '../types';

interface CustomerListProps {
  customers: CustomerSummary[];
  settings: AppSettings;
  onSelectCustomer: (customerId: string) => void;
  onOpenAddCustomer: () => void;
  onEditCustomer: (customer: CustomerSummary) => void;
  onDeleteCustomer: (customerId: string) => void;
  onSendReminder: (customer: CustomerSummary) => void;
  onShowQr: (customer: CustomerSummary) => void;
}

export const CustomerList: React.FC<CustomerListProps> = ({
  customers,
  settings,
  onSelectCustomer,
  onOpenAddCustomer,
  onEditCustomer,
  onDeleteCustomer,
  onSendReminder,
  onShowQr,
}) => {
  const currencySymbol = settings?.currency || '₹';
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'DUE_ONLY' | 'CLEARED_ONLY'>('ALL');
  const [sortBy, setSortBy] = useState<'DUE_DESC' | 'NAME' | 'RECENT'>('DUE_DESC');

  // Filter and sort customers
  const filteredCustomers = customers
    .filter((c) => {
      const q = searchQuery.toLowerCase();
      const matchesQuery =
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (c.alternatePhone && c.alternatePhone.includes(q)) ||
        (c.address && c.address.toLowerCase().includes(q)) ||
        (c.notes && c.notes.toLowerCase().includes(q));

      if (!matchesQuery) return false;

      if (filterType === 'DUE_ONLY') return c.remainingDue > 0;
      if (filterType === 'CLEARED_ONLY') return c.remainingDue === 0;

      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'DUE_DESC') return b.remainingDue - a.remainingDue;
      if (sortBy === 'NAME') return a.name.localeCompare(b.name);
      if (sortBy === 'RECENT')
        return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime();
      return 0;
    });

  return (
    <div className="space-y-6">
      {/* Search & Filter Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-[2rem] shadow-sm">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search name, primary/alt phone, location or notes..."
            className="w-full pl-11 pr-4 py-3 bg-slate-100/80 dark:bg-slate-800/80 border-none rounded-full text-xs font-medium focus:ring-2 focus:ring-indigo-500 transition-all text-slate-900 dark:text-white"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-full text-xs font-bold">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-4 py-2 rounded-full transition-all ${
                filterType === 'ALL'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              All ({customers.length})
            </button>
            <button
              onClick={() => setFilterType('DUE_ONLY')}
              className={`px-4 py-2 rounded-full transition-all ${
                filterType === 'DUE_ONLY'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Pending ({customers.filter((c) => c.remainingDue > 0).length})
            </button>
            <button
              onClick={() => setFilterType('CLEARED_ONLY')}
              className={`px-4 py-2 rounded-full transition-all ${
                filterType === 'CLEARED_ONLY'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Cleared
            </button>
          </div>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border-none rounded-full text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="DUE_DESC">Highest Due</option>
            <option value="NAME">Name A-Z</option>
            <option value="RECENT">Recently Added</option>
          </select>

          {/* Add Customer Button */}
          <button
            onClick={onOpenAddCustomer}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-full text-xs transition-all shadow-lg shadow-indigo-100 dark:shadow-none hover:scale-105 active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            + New Customer
          </button>
        </div>
      </div>

      {/* Customer Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCustomers.length === 0 ? (
          <div className="col-span-full text-center py-16 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem]">
            <UserPlus className="w-12 h-12 text-indigo-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              No Customers Found
            </h3>
            <p className="text-xs text-slate-500 mt-1 mb-6">
              Try adjusting your search criteria or add a new customer entry.
            </p>
            <button
              onClick={onOpenAddCustomer}
              className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-full text-xs shadow-lg shadow-indigo-100"
            >
              + Add Customer
            </button>
          </div>
        ) : (
          filteredCustomers.map((customer) => {
            const hasDue = customer.remainingDue > 0;
            return (
              <div
                key={customer.id}
                className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800 p-6 rounded-[2.5rem] shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Top Customer Info */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div
                      onClick={() => onSelectCustomer(customer.id)}
                      className="flex items-center gap-3.5 cursor-pointer flex-1"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/60 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center text-sm shadow-sm group-hover:scale-105 transition-transform overflow-hidden flex-shrink-0">
                        {customer.photoUrl ? (
                          <img src={customer.photoUrl} alt={customer.name} className="w-full h-full object-cover" />
                        ) : (
                          customer.name.slice(0, 2).toUpperCase()
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-base group-hover:text-indigo-600 transition-colors">
                          {customer.name}
                        </h4>
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                          <Phone className="w-3 h-3 text-indigo-400" />
                          +91 {customer.phone}
                        </div>
                        {customer.alternatePhone && (
                          <div className="text-[10px] text-slate-400">
                            Alt: +91 {customer.alternatePhone}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEditCustomer(customer)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Edit Details"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteCustomer(customer.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40"
                        title="Delete Customer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Financial Metrics Box */}
                  <div className="bg-slate-50/80 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2 mb-4">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Loans Given</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {currencySymbol}
                        {customer.totalLoanGiven.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Total Repaid</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {currencySymbol}
                        {customer.totalMoneyReceived.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Pending Due
                      </span>
                      <span
                        className={`text-lg font-extrabold ${
                          hasDue ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {currencySymbol}
                        {customer.remainingDue.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Row */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => onSelectCustomer(customer.id)}
                    className="flex-1 py-2.5 bg-slate-900 text-white dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-xs font-bold transition-all text-center"
                  >
                    View Ledger
                  </button>

                  <a
                    href={`tel:${customer.phone}`}
                    className="p-2.5 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 rounded-xl transition-all border border-emerald-100 dark:border-emerald-900/40"
                    title={`Call +91 ${customer.phone}`}
                  >
                    <PhoneCall className="w-4 h-4" />
                  </a>

                  <button
                    onClick={() => onShowQr(customer)}
                    className="p-2.5 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 rounded-xl transition-all border border-indigo-100 dark:border-indigo-900/40"
                    title="UPI QR Code"
                  >
                    <QrCode className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onSendReminder(customer)}
                    disabled={!hasDue}
                    className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      hasDue
                        ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                    }`}
                    title={hasDue ? 'Send WhatsApp Reminder' : 'No pending due'}
                  >
                    <Send className="w-3.5 h-3.5" />
                    Reminder
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
