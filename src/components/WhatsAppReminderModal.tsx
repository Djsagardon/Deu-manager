import React, { useState, useEffect } from 'react';
import { X, Send, MessageSquare, Phone, Calendar, User, AlertCircle, RotateCcw, Building2 } from 'lucide-react';
import { AppSettings, CustomerSummary } from '../types';
import { formatWhatsAppReminderText, openWhatsAppDirectChat, formatPhoneNumberForWhatsApp } from '../utils/upi';

interface WhatsAppReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: CustomerSummary | null;
  settings?: AppSettings;
  onNotify?: (msg: string) => void;
}

export const WhatsAppReminderModal: React.FC<WhatsAppReminderModalProps> = ({
  isOpen,
  onClose,
  customer,
  settings,
  onNotify,
}) => {
  const currencySymbol = settings?.currency || '₹';
  const storeName = settings?.adminName || 'Due Manager';

  const [message, setMessage] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen && customer) {
      setErrorMsg('');
      setPhoneNumber(customer.phone || '');
      const custDueDate = customer.dueDate || '';
      setDueDate(custDueDate);

      const preparedMsg = formatWhatsAppReminderText(
        {
          name: customer.name,
          phone: customer.phone,
          dueDate: custDueDate,
        },
        customer.remainingDue,
        settings
      );
      setMessage(preparedMsg);
    }
  }, [isOpen, customer, settings]);

  if (!isOpen || !customer) return null;

  const formattedCleanPhone = formatPhoneNumberForWhatsApp(phoneNumber || customer.phone);
  const remainingDue = customer.remainingDue || 0;
  const isOverdue = remainingDue > 0;
  const paymentStatus = isOverdue ? 'Pending Due' : 'Settled';

  const handleResetMessage = () => {
    const defaultMsg = formatWhatsAppReminderText(
      {
        name: customer.name,
        phone: phoneNumber || customer.phone,
        dueDate: dueDate,
      },
      remainingDue,
      settings
    );
    setMessage(defaultMsg);
    setErrorMsg('');
  };

  const handleSendReminder = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!phoneNumber.trim()) {
      setErrorMsg('Please enter a valid mobile number.');
      return;
    }

    const clean = formatPhoneNumberForWhatsApp(phoneNumber);
    if (!clean || clean.length < 10) {
      setErrorMsg('Mobile number must contain at least 10 digits.');
      return;
    }

    if (!message.trim()) {
      setErrorMsg('Reminder message cannot be empty.');
      return;
    }

    const success = openWhatsAppDirectChat(clean, message, {
      onNotify: (msg) => {
        if (onNotify) onNotify(`Opening WhatsApp chat for ${customer.name}...`);
      },
      onError: (err) => {
        setErrorMsg(err);
      },
    });

    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl space-y-0">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-100 dark:border-emerald-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-500/20">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                Send WhatsApp Reminder
              </h3>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium">
                Direct WhatsApp Chat Integration
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSendReminder} className="p-6 space-y-4 text-xs max-h-[82vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-2xl text-rose-600 dark:text-rose-400 font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Customer Details Overview Card */}
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-700/60 pb-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Customer Name</div>
                  <div className="font-extrabold text-slate-900 dark:text-white text-sm">
                    {customer.name}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Payment Status</div>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold ${
                    isOverdue
                      ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                      : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                  }`}
                >
                  {paymentStatus}
                </span>
              </div>
            </div>

            {/* Grid of Mobile, Amount, Due Date */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-0.5">
              {/* Phone */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-indigo-500" />
                  Mobile Number
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                />
                <div className="text-[10px] text-slate-400 font-medium">
                  Target: <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">+{formattedCleanPhone}</span>
                </div>
              </div>

              {/* Pending Amount */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-rose-500" />
                  Due Amount
                </label>
                <div className="px-2.5 py-1.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl font-extrabold text-rose-600 dark:text-rose-400 text-sm">
                  {currencySymbol}{remainingDue.toLocaleString('en-IN')}
                </div>
              </div>

              {/* Due Date */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-amber-500" />
                  Due Date
                </label>
                <input
                  type="date"
                  value={dueDate ? dueDate.slice(0, 10) : ''}
                  onChange={(e) => {
                    setDueDate(e.target.value);
                  }}
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Prepared Message Editor */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 text-xs">
                <MessageSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Reminder Message (Editable)
              </label>
              <button
                type="button"
                onClick={handleResetMessage}
                className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-semibold"
              >
                <RotateCcw className="w-3 h-3" />
                Reset Template
              </button>
            </div>

            <textarea
              rows={6}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-mono text-slate-900 dark:text-slate-100 leading-relaxed focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-900 transition-all text-xs"
              placeholder="Write your custom reminder message..."
            />
            <p className="text-[10px] text-slate-400 italic">
              You can customize the exact wording above before sending to WhatsApp.
            </p>
          </div>

          {/* Direct WhatsApp Callout Info */}
          <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/50 rounded-2xl text-[11px] text-emerald-900 dark:text-emerald-200 space-y-1">
            <div className="font-extrabold flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300">
              ⚡ Direct Chat Delivery
            </div>
            <p>
              Clicking below opens WhatsApp directly in a chat window with <strong className="underline">{customer.name} (+{formattedCleanPhone})</strong>. No manual contact searching required.
            </p>
          </div>

          {/* Modal Actions */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-bold text-xs"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-extrabold rounded-2xl text-xs shadow-lg shadow-emerald-500/25 flex items-center gap-2 transition-all"
            >
              <Send className="w-4 h-4" />
              Send on WhatsApp
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
