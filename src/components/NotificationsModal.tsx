import React from 'react';
import { X, Bell, Megaphone, AlertCircle, Sparkles, Clock, Check } from 'lucide-react';
import { Announcement, TenantWorkspace } from '../types';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  announcements: Announcement[];
  tenant: TenantWorkspace | null;
  dueCustomersCount: number;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  announcements,
  tenant,
  dueCustomersCount,
}) => {
  if (!isOpen) return null;

  const isTrial = tenant?.status === 'TRIAL';
  const validUntil = tenant?.validUntil ? new Date(tenant.validUntil) : null;
  const daysLeft = validUntil ? Math.max(0, Math.ceil((validUntil.getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/30 border border-indigo-500/40 text-indigo-400 flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black">Workspace Notifications</h3>
              <p className="text-[11px] text-slate-400">Due alerts, announcements & subscription notices</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List of Alerts & Notifications */}
        <div className="p-5 space-y-3 overflow-y-auto text-xs">
          {/* Subscription Notice */}
          {tenant && (
            <div
              className={`p-4 rounded-2xl border ${
                isTrial
                  ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200'
                  : 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-900 text-indigo-900 dark:text-indigo-200'
              }`}
            >
              <div className="flex items-center gap-2 font-black text-sm mb-1">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Subscription Status: {tenant.planName}</span>
              </div>
              <p className="text-[11px] font-medium leading-relaxed">
                Your workspace is currently active on the <span className="font-bold">{tenant.planName}</span> plan. {daysLeft <= 5 ? `Renewal due in ${daysLeft} days.` : `Valid until ${validUntil?.toLocaleDateString()}`}
              </p>
            </div>
          )}

          {/* Due Customers Alert */}
          {dueCustomersCount > 0 && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-200">
              <div className="flex items-center gap-2 font-black text-sm mb-1">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span>Pending Loan Dues Action</span>
              </div>
              <p className="text-[11px] font-medium">
                You have <span className="font-bold text-rose-700 dark:text-rose-300">{dueCustomersCount} customers</span> with pending due balances. Send automated WhatsApp reminders directly from the Ledger view.
              </p>
            </div>
          )}

          {/* System Broadcast Announcements */}
          <div className="pt-2">
            <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
              System Broadcasts from Super Admin
            </span>
            <div className="space-y-2 mt-2">
              {announcements.length === 0 ? (
                <p className="text-slate-400 text-center py-4 italic">No active system announcements.</p>
              ) : (
                announcements.map((ann) => (
                  <div
                    key={ann.id}
                    className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800"
                  >
                    <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-xs mb-1">
                      <Megaphone className="w-3.5 h-3.5 text-amber-500" />
                      <span>{ann.title}</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                      {ann.content}
                    </p>
                    <div className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(ann.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 text-right">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold rounded-xl text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
