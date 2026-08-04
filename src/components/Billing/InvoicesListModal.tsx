import React from 'react';
import { X, CreditCard, Download, FileText, CheckCircle2, Building2 } from 'lucide-react';
import { Invoice, TenantWorkspace } from '../../types';

interface InvoicesListModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoices: Invoice[];
  tenant: TenantWorkspace | null;
}

export const InvoicesListModal: React.FC<InvoicesListModalProps> = ({
  isOpen,
  onClose,
  invoices,
  tenant,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 relative flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 text-indigo-400 flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black">Billing & Invoices History</h3>
              <p className="text-xs text-slate-400">
                Workspace: <span className="text-white font-bold">{tenant?.companyName}</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-xl">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-3">
          {invoices.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <CreditCard className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
              <p className="text-slate-500 text-xs font-semibold">No paid SaaS invoices found for this workspace.</p>
            </div>
          ) : (
            invoices.map((inv) => (
              <div
                key={inv.id}
                className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-indigo-600 dark:text-indigo-400 text-sm">
                      {inv.id}
                    </span>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold rounded text-[10px]">
                      {inv.status}
                    </span>
                  </div>
                  <div className="text-slate-500 font-medium mt-1">
                    {inv.planName} Plan • {inv.paymentMethod}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Ref: {inv.transactionRef} • {new Date(inv.date).toLocaleDateString()}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-base font-black text-slate-900 dark:text-white">
                    {inv.currency}{inv.amount}
                  </div>
                  <button
                    onClick={() => alert(`Downloading official PDF Invoice receipt ${inv.id}...`)}
                    className="mt-1.5 px-3 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-200 font-bold text-[10px] hover:bg-slate-100 flex items-center gap-1 ml-auto"
                  >
                    <Download className="w-3 h-3" /> PDF Receipt
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 text-right">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
