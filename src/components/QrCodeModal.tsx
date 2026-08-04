import React, { useEffect, useState } from 'react';
import { X, Download, Copy, Check, Send } from 'lucide-react';
import { AppSettings, CustomerSummary } from '../types';
import { buildUpiPayUrl, generateUpiQrDataUrl, sendWhatsAppReminderWithQr } from '../utils/upi';

interface QrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: CustomerSummary | null;
  settings?: AppSettings;
}

export const QrCodeModal: React.FC<QrCodeModalProps> = ({
  isOpen,
  onClose,
  customer,
  settings,
}) => {
  const currencySymbol = settings?.currency || '₹';
  const upiId = settings?.upiId || 'merchant@upi';
  const adminName = settings?.adminName || 'Due Manager';
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    if (isOpen && customer) {
      const amount = customer.remainingDue > 0 ? customer.remainingDue : 100;
      generateUpiQrDataUrl(
        upiId,
        adminName,
        amount,
        `Pending Due - ${customer.name}`
      ).then((url) => setQrDataUrl(url));
    }
  }, [isOpen, customer, upiId, adminName]);

  if (!isOpen || !customer) return null;

  const upiPayUrl = buildUpiPayUrl(
    upiId,
    adminName,
    customer.remainingDue,
    `Pending Due - ${customer.name}`
  );

  const handleCopyLink = () => {
    navigator.clipboard.writeText(upiPayUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `UPI_QR_${customer.name}_${customer.remainingDue}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShareWhatsApp = async () => {
    setIsSharing(true);
    await sendWhatsAppReminderWithQr(customer, settings);
    setIsSharing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl text-center p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="font-bold text-slate-900 dark:text-white text-base">
            UPI Payment QR Code
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Customer & Amount details */}
        <div>
          <div className="text-xs text-slate-400 uppercase font-semibold">Payee Account</div>
          <div className="text-base font-extrabold text-slate-900 dark:text-white">
            {customer.name}
          </div>
          <div className="mt-2 text-2xl font-black text-rose-600 dark:text-rose-400">
            {currencySymbol}
            {customer.remainingDue.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            UPI ID: <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{upiId}</span>
          </div>
        </div>

        {/* Generated QR Image Box */}
        <div className="bg-white p-4 rounded-2xl border-2 border-slate-200 shadow-inner flex items-center justify-center min-h-[220px]">
          {qrDataUrl ? (
            <img src={qrDataUrl} alt="UPI Payment QR Code" className="w-52 h-52 object-contain" />
          ) : (
            <div className="text-xs text-slate-400 animate-pulse">Generating QR Code...</div>
          )}
        </div>

        {/* Instructions */}
        <p className="text-[11px] text-slate-400">
          Scan using PhonePe, Google Pay, Paytm, BHIM, or any UPI banking application.
        </p>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          <button
            onClick={handleShareWhatsApp}
            disabled={isSharing}
            className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-md transition-all"
          >
            <Send className="w-4 h-4" />
            {isSharing ? 'Preparing QR Image...' : 'Send WhatsApp Reminder with QR Image'}
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleDownloadQr}
              className="flex items-center justify-center gap-1.5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-sm transition-all"
            >
              <Download className="w-4 h-4" />
              Download PNG
            </button>

            <button
              onClick={handleCopyLink}
              className="flex items-center justify-center gap-1.5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-bold rounded-xl text-xs border border-slate-200 dark:border-slate-700 transition-all"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy UPI Link'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

