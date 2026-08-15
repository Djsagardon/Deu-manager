import React, { useState } from 'react';
import { X, Save, Shield, QrCode, Phone, Database, Bell, Palette, Globe, Check } from 'lucide-react';
import { AppSettings, CurrencySymbol } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (newSettings: AppSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
}) => {
  const [formData, setFormData] = useState<AppSettings>(settings);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleChange = (key: keyof AppSettings, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl my-8 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Application Settings (26 Configurations)
            </h3>
            <p className="text-xs text-slate-500">
              Configure your UPI ID, Firebase Backend, Business Admin info, and WhatsApp Reminders.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 text-xs">
          {/* 1. UPI & Payment Settings */}
          <div className="space-y-3 bg-blue-50/50 dark:bg-blue-950/20 p-4 rounded-2xl border border-blue-200 dark:border-blue-900">
            <div className="flex items-center gap-2 font-bold text-blue-700 dark:text-blue-400 text-sm">
              <QrCode className="w-4 h-4" />
              1. UPI & Payment Settings
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  8. Merchant / Payee Name (pn) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.merchantName || formData.adminName || ''}
                  onChange={(e) => handleChange('merchantName', e.target.value)}
                  placeholder="e.g. Sagar Enterprise"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  9. Your UPI ID (VPA) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.upiId}
                  onChange={(e) => handleChange('upiId', e.target.value)}
                  placeholder="yourname@upi"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-white font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  10. Preferred UPI App
                </label>
                <select
                  value={formData.preferredUpiApp}
                  onChange={(e) => handleChange('preferredUpiApp', e.target.value as any)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                >
                  <option value="PhonePe">PhonePe</option>
                  <option value="Google Pay">Google Pay</option>
                  <option value="Paytm">Paytm</option>
                  <option value="BHIM">BHIM UPI</option>
                  <option value="Any">Any App</option>
                </select>
              </div>
            </div>
          </div>

          {/* 2. Admin & Store Information */}
          <div className="space-y-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200 text-sm">
              <BuildingIcon className="w-4 h-4 text-blue-600" />
              2. Store & Admin Identity
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  10. App Title Name
                </label>
                <input
                  type="text"
                  value={formData.appName}
                  onChange={(e) => handleChange('appName', e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  11. Android Package Name
                </label>
                <input
                  type="text"
                  value={formData.packageName}
                  onChange={(e) => handleChange('packageName', e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  21. Admin Name / Store Name
                </label>
                <input
                  type="text"
                  value={formData.adminName}
                  onChange={(e) => handleChange('adminName', e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  22. Admin Phone Number
                </label>
                <input
                  type="text"
                  value={formData.adminPhone}
                  onChange={(e) => handleChange('adminPhone', e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* 3. Regional & Localization */}
          <div className="space-y-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200 text-sm">
              <Globe className="w-4 h-4 text-emerald-600" />
              3. Localization & Currency
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  15. Currency Symbol
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) => handleChange('currency', e.target.value as CurrencySymbol)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white"
                >
                  <option value="₹">₹ (INR - Indian Rupee)</option>
                  <option value="$">$ (USD - US Dollar)</option>
                  <option value="€">€ (EUR - Euro)</option>
                  <option value="£">£ (GBP - British Pound)</option>
                  <option value="AED">AED (Dirham)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  16. Language
                </label>
                <select
                  value={formData.language}
                  onChange={(e) => handleChange('language', e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                >
                  <option value="English">English</option>
                  <option value="Hindi">Hindi (हिंदी)</option>
                  <option value="Hinglish">Hinglish</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  17. Time Zone
                </label>
                <input
                  type="text"
                  value={formData.timeZone}
                  onChange={(e) => handleChange('timeZone', e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  18. Country
                </label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => handleChange('country', e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* 4. WhatsApp Reminder Settings */}
          <div className="space-y-3 bg-emerald-50/50 dark:bg-emerald-950/20 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-900">
            <div className="flex items-center gap-2 font-bold text-emerald-700 dark:text-emerald-400 text-sm">
              <Phone className="w-4 h-4" />
              4. WhatsApp Reminder Configuration
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  19. WhatsApp App Type
                </label>
                <select
                  value={formData.whatsAppType}
                  onChange={(e) => handleChange('whatsAppType', e.target.value as any)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                >
                  <option value="Business">WhatsApp Business</option>
                  <option value="Personal">WhatsApp Personal</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  20. Default Reminder Message Template
                </label>
                <textarea
                  rows={4}
                  value={formData.defaultReminderMessage}
                  onChange={(e) => handleChange('defaultReminderMessage', e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono text-[11px]"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Placeholders: <span className="font-bold">{'{CustomerName}'}</span>,{' '}
                  <span className="font-bold">{'{StoreName}'}</span>,{' '}
                  <span className="font-bold">{'{Currency}'}</span>,{' '}
                  <span className="font-bold">{'{Amount}'}</span>,{' '}
                  <span className="font-bold">{'{PayLink}'}</span>
                </p>
              </div>
            </div>
          </div>

          {/* 5. Firebase Configuration */}
          <div className="space-y-3 bg-amber-50/50 dark:bg-amber-950/20 p-4 rounded-2xl border border-amber-200 dark:border-amber-900">
            <div className="flex items-center gap-2 font-bold text-amber-700 dark:text-amber-400 text-sm">
              <Database className="w-4 h-4" />
              5. Firebase Backend & Auth Settings
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  1. Firebase Project ID
                </label>
                <input
                  type="text"
                  value={formData.firebaseProjectId}
                  onChange={(e) => handleChange('firebaseProjectId', e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  5. Firebase Auth Method
                </label>
                <select
                  value={formData.firebaseAuthMethod}
                  onChange={(e) => handleChange('firebaseAuthMethod', e.target.value as any)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                >
                  <option value="phone">Phone Number OTP</option>
                  <option value="google">Google Sign-In</option>
                  <option value="email">Email & Password</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  6. Database Engine
                </label>
                <select
                  value={formData.databaseType}
                  onChange={(e) => handleChange('databaseType', e.target.value as any)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                >
                  <option value="firestore">Cloud Firestore</option>
                  <option value="realtime">Firebase Realtime DB</option>
                  <option value="local">Local Storage + Offline Sync</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  7. Storage Bucket
                </label>
                <input
                  type="text"
                  value={formData.storageBucket}
                  onChange={(e) => handleChange('storageBucket', e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono"
                />
              </div>
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 font-semibold text-xs"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-500/20 transition-all"
          >
            {savedSuccess ? <Check className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
            {savedSuccess ? 'Saved Successfully!' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
};

function BuildingIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
      <path d="M9 22v-4h6v4" />
      <path d="M8 6h.01" />
      <path d="M16 6h.01" />
      <path d="M12 6h.01" />
      <path d="M12 10h.01" />
      <path d="M12 14h.01" />
      <path d="M16 10h.01" />
      <path d="M16 14h.01" />
      <path d="M8 10h.01" />
      <path d="M8 14h.01" />
    </svg>
  );
}
