import React, { useState } from 'react';
import {
  Bell,
  CheckCircle2,
  Trash2,
  Check,
  X,
  Clock,
  AlertCircle,
  BadgeIndianRupee,
  ShieldCheck,
  Send,
  Zap,
  Sparkles
} from 'lucide-react';
import { NotificationItem } from '../types';

interface NotificationsCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDeleteNotification: (id: string) => void;
  onClearAll: () => void;
  onTestTriggerPush?: () => void;
}

export const NotificationsCenterModal: React.FC<NotificationsCenterModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
  onClearAll,
  onTestTriggerPush,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'UNREAD'>('ALL');

  if (!isOpen) return null;

  const filteredNotifications = notifications.filter((item) => {
    if (filter === 'UNREAD') return !item.isRead;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const getCategoryIcon = (category: NotificationItem['category']) => {
    switch (category) {
      case 'PAYMENT_RECEIVED':
        return <BadgeIndianRupee className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'LOAN_DUE':
        return <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />;
      case 'SUBSCRIPTION_EXPIRY':
      case 'SUBSCRIPTION_ACTIVATED':
        return <Zap className="w-4 h-4 text-amber-500" />;
      case 'SETTLEMENT':
        return <ShieldCheck className="w-4 h-4 text-blue-500" />;
      case 'SYSTEM':
      default:
        return <Sparkles className="w-4 h-4 text-indigo-500" />;
    }
  };

  const getCategoryBg = (category: NotificationItem['category']) => {
    switch (category) {
      case 'PAYMENT_RECEIVED':
        return 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-100 dark:border-emerald-900/60';
      case 'LOAN_DUE':
        return 'bg-rose-50 dark:bg-rose-950/60 border-rose-100 dark:border-rose-900/60';
      case 'SUBSCRIPTION_EXPIRY':
      case 'SUBSCRIPTION_ACTIVATED':
        return 'bg-amber-50 dark:bg-amber-950/60 border-amber-100 dark:border-amber-900/60';
      case 'SETTLEMENT':
        return 'bg-blue-50 dark:bg-blue-950/60 border-blue-100 dark:border-blue-900/60';
      case 'SYSTEM':
      default:
        return 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-100 dark:border-indigo-900/60';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden relative">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center relative">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Notification Center
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {unreadCount > 0 ? `${unreadCount} unread alert${unreadCount > 1 ? 's' : ''}` : 'All alerts up to date'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Controls & Actions */}
        <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl text-xs font-bold">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                filter === 'ALL'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('UNREAD')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                filter === 'UNREAD'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs">
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllAsRead}
                className="flex items-center gap-1 px-2.5 py-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 rounded-xl font-bold transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                Mark All Read
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={onClearAll}
                className="flex items-center gap-1 px-2.5 py-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-xl font-bold transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear
              </button>
            )}
          </div>
        </div>

        {/* List of Notifications */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm space-y-2">
              <Bell className="w-8 h-8 mx-auto opacity-30 text-indigo-500" />
              <p className="font-semibold">No notifications found.</p>
              <p className="text-xs text-slate-500">You're all caught up!</p>
            </div>
          ) : (
            filteredNotifications.map((n) => (
              <div
                key={n.id}
                className={`p-4 rounded-2xl border transition-all flex items-start gap-3.5 relative ${
                  !n.isRead
                    ? 'bg-slate-50/90 dark:bg-slate-800/80 border-indigo-200 dark:border-indigo-800 shadow-sm'
                    : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 opacity-80'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border ${getCategoryBg(
                    n.category
                  )}`}
                >
                  {getCategoryIcon(n.category)}
                </div>

                <div className="flex-1 min-w-0 pr-12">
                  <div className="flex items-center gap-2">
                    <h5
                      className={`text-sm font-bold line-clamp-1 ${
                        !n.isRead ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {n.title}
                    </h5>
                    {!n.isRead && (
                      <span className="w-2 h-2 rounded-full bg-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    {n.message}
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3" />
                    {new Date(n.date).toLocaleString('en-IN', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </p>
                </div>

                <div className="absolute right-3 top-3 flex items-center gap-1">
                  {!n.isRead && (
                    <button
                      onClick={() => onMarkAsRead(n.id)}
                      className="p-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-lg transition-colors"
                      title="Mark as Read"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => onDeleteNotification(n.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors"
                    title="Delete Notification"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer / Push Test */}
        {onTestTriggerPush && (
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">Push Notifications Enabled</span>
            <button
              onClick={onTestTriggerPush}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              Test Push Alert
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
