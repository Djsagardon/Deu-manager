import React from 'react';
import {
  FileSpreadsheet,
  Download,
  Printer,
  BarChart2,
  Calendar,
  Users,
  TrendingUp,
  FileText
} from 'lucide-react';
import { AppSettings, CustomerSummary, Transaction } from '../types';
import { exportCustomersToCsv } from '../utils/export';

interface ReportsProps {
  customers: CustomerSummary[];
  transactions: Transaction[];
  settings: AppSettings;
}

export const Reports: React.FC<ReportsProps> = ({ customers, transactions, settings }) => {
  const currencySymbol = settings?.currency || '₹';
  const totalLoans = customers.reduce((acc, c) => acc + c.totalLoanGiven, 0);
  const totalPaid = customers.reduce((acc, c) => acc + c.totalMoneyReceived, 0);
  const totalPending = customers.reduce((acc, c) => acc + c.remainingDue, 0);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Financial Statement & Export Reports
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Export customer ledger statements to Excel/CSV or generate printable reports for tax and store accounting.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportCustomersToCsv(customers, settings)}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all shadow-sm"
          >
            <Download className="w-4 h-4" />
            Export Customer CSV (Excel)
          </button>
        </div>
      </div>

      {/* Overview Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
          <div className="text-xs font-semibold text-slate-400">Total Booked Loans</div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            {currencySymbol}
            {totalLoans.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-slate-500 mt-1">Across {customers.length} customer accounts</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
          <div className="text-xs font-semibold text-slate-400">Total Cleared Collections</div>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
            {currencySymbol}
            {totalPaid.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-emerald-600 font-medium mt-1">
            {totalLoans > 0 ? Math.round((totalPaid / totalLoans) * 100) : 100}% Cleared
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
          <div className="text-xs font-semibold text-slate-400">Total Outstanding Pending Due</div>
          <div className="text-2xl font-extrabold text-red-600 dark:text-red-400 mt-1">
            {currencySymbol}
            {totalPending.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-red-500 font-medium mt-1">Action needed for recovery</div>
        </div>
      </div>

      {/* Customer Master Ledger Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 dark:text-white text-base">
            Master Customer Ledger Statement
          </h3>
          <span className="text-xs text-slate-400">{customers.length} Accounts Recorded</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 uppercase text-[10px] font-bold">
              <tr>
                <th className="p-3">Customer Name</th>
                <th className="p-3">Phone</th>
                <th className="p-3">Total Loan Given</th>
                <th className="p-3">Total Paid</th>
                <th className="p-3">Remaining Due</th>
                <th className="p-3">Progress</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="p-3 font-bold text-slate-900 dark:text-white">{c.name}</td>
                  <td className="p-3">+91 {c.phone}</td>
                  <td className="p-3 font-bold text-slate-800 dark:text-slate-200">
                    {currencySymbol}
                    {c.totalLoanGiven.toLocaleString('en-IN')}
                  </td>
                  <td className="p-3 font-bold text-emerald-600 dark:text-emerald-400">
                    {currencySymbol}
                    {c.totalMoneyReceived.toLocaleString('en-IN')}
                  </td>
                  <td className="p-3 font-extrabold text-red-600 dark:text-red-400">
                    {currencySymbol}
                    {c.remainingDue.toLocaleString('en-IN')}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full"
                          style={{ width: `${c.paymentPercentage}%` }}
                        ></div>
                      </div>
                      <span className="font-semibold text-[10px]">{c.paymentPercentage}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
