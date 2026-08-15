import QRCode from 'qrcode';
import { AppSettings, Customer } from '../types';

export function generateUniqueTransactionId(amount: number | string = 0, prefix: string = 'DUE'): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;
  
  const numAmt = Math.round(parseFloat(String(amount)) || 0);
  
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let randomSuffix = '';
  for (let i = 0; i < 8; i++) {
    randomSuffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return `${prefix}-${dateStr}-${numAmt}-${randomSuffix}`;
}

export function generateTransactionReference(prefix: string = 'DM'): string {
  return generateUniqueTransactionId(0, prefix);
}

export function buildUpiPayUrl(
  upiId: string,
  adminName: string,
  amount: number | string,
  note: string = 'Due Payment',
  merchantCategoryCode: string = '5411',
  transactionRef?: string,
  currentUrl?: string
): string {
  const cleanUpi = upiId ? upiId.trim().replace(/\s+/g, '') : '';
  const cleanName = (adminName || 'Due Manager').trim();
  const mc = (merchantCategoryCode || '5411').trim();
  const numericAmount = parseFloat(String(amount));
  const formattedAmount = (!isNaN(numericAmount) && numericAmount > 0) ? numericAmount.toFixed(2) : '0.00';
  const tr = (transactionRef || generateUniqueTransactionId(formattedAmount, 'DUE')).trim();
  const cleanNote = (note || 'Due Payment').trim();
  const cleanUrl = (currentUrl || (typeof window !== 'undefined' ? window.location.href : '')).trim();

  const encodedPa = encodeURIComponent(cleanUpi);
  const encodedPn = encodeURIComponent(cleanName);
  const encodedMc = encodeURIComponent(mc);
  const encodedTr = encodeURIComponent(tr);
  const encodedTn = encodeURIComponent(cleanNote);
  const encodedAm = formattedAmount;
  const encodedCu = 'INR';
  const encodedUrl = cleanUrl ? encodeURIComponent(cleanUrl) : '';

  let upiUri = `upi://pay?pa=${encodedPa}&pn=${encodedPn}&mc=${encodedMc}&tr=${encodedTr}&tn=${encodedTn}&am=${encodedAm}&cu=${encodedCu}`;
  if (encodedUrl) {
    upiUri += `&url=${encodedUrl}`;
  }

  return upiUri;
}

export async function generateUpiQrDataUrl(
  upiId: string,
  adminName: string,
  amount: number | string,
  note: string = 'Due Payment',
  merchantCategoryCode: string = '5411',
  transactionRef?: string,
  currentUrl?: string
): Promise<string> {
  const upiUrl = buildUpiPayUrl(upiId, adminName, amount, note, merchantCategoryCode, transactionRef, currentUrl);
  try {
    const dataUrl = await QRCode.toDataURL(upiUrl, {
      width: 320,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });
    return dataUrl;
  } catch (err) {
    console.error('Failed to generate QR Code', err);
    return '';
  }
}

export function generateBrandedQrCanvasBlob(
  qrDataUrl: string,
  customerName: string,
  amount: number,
  upiId: string,
  storeName: string,
  currency: string
): Promise<Blob> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 760;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      fetch(qrDataUrl).then((res) => res.blob()).then(resolve);
      return;
    }

    // Draw Background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, 600, 760);

    // Draw Top Header
    ctx.fillStyle = '#4F46E5'; // Indigo 600
    ctx.fillRect(0, 0, 600, 100);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText((storeName || 'DUE MANAGER').toUpperCase(), 300, 42);

    ctx.font = '13px sans-serif';
    ctx.fillStyle = '#E0E7FF';
    ctx.fillText('OFFICIAL UPI PAYMENT QR CODE', 300, 70);

    // Customer & Amount Card
    ctx.fillStyle = '#F8FAFC';
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(40, 120, 520, 100, 16);
    } else {
      ctx.rect(40, 120, 520, 100);
    }
    ctx.fill();

    ctx.fillStyle = '#64748B';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Customer:', 60, 150);

    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText(customerName, 60, 180);

    ctx.fillStyle = '#64748B';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('Pending Amount:', 540, 150);

    ctx.fillStyle = '#E11D48'; // Rose 600
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText(`${currency}${amount.toLocaleString('en-IN')}`, 540, 185);

    // Load QR Image onto Canvas
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // White container for QR Code
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 2;
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(120, 240, 360, 360, 20);
      } else {
        ctx.rect(120, 240, 360, 360);
      }
      ctx.fill();
      ctx.stroke();

      // Draw QR image
      ctx.drawImage(img, 140, 260, 320, 320);

      // Footer UPI Info
      ctx.fillStyle = '#1E293B';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`UPI ID: ${upiId}`, 300, 640);

      ctx.fillStyle = '#64748B';
      ctx.font = '13px sans-serif';
      ctx.fillText('Scan & Pay using GPay, PhonePe, Paytm, or any BHIM UPI App', 300, 675);

      ctx.fillStyle = '#94A3B8';
      ctx.font = '12px sans-serif';
      ctx.fillText('Generated automatically via Due Manager', 300, 715);

      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else fetch(qrDataUrl).then((res) => res.blob()).then(resolve);
      }, 'image/png');
    };

    img.onerror = () => {
      fetch(qrDataUrl).then((res) => res.blob()).then(resolve);
    };

    img.src = qrDataUrl;
  });
}

export function formatPhoneNumberForWhatsApp(phone: string, defaultCountryCode: string = '91'): string {
  if (!phone) return '';
  // Strip all non-digit characters
  let clean = phone.replace(/[^0-9]/g, '');

  // Remove leading zeroes if 11 or more digits (e.g. 09876543210 -> 9876543210)
  while (clean.length > 10 && clean.startsWith('0')) {
    clean = clean.substring(1);
  }

  // Prepend default country code if 10 digits
  if (clean.length === 10) {
    const code = defaultCountryCode.replace(/[^0-9]/g, '') || '91';
    clean = code + clean;
  }
  return clean;
}

export function formatWhatsAppReminderText(
  customer: { name: string; phone: string; dueDate?: string },
  remainingDue: number,
  settings?: AppSettings,
  paymentPortalUrl?: string,
  companyNameOverride?: string
): string {
  const cleanPhone = formatPhoneNumberForWhatsApp(customer.phone);
  const baseUrl = paymentPortalUrl || (typeof window !== 'undefined' ? (window.location.origin + window.location.pathname) : '');

  // Clean Store / Company Name - Remove any email domains or usernames
  let storeName = companyNameOverride || settings?.appName || settings?.adminName || 'Mondal Traders';
  if (storeName.includes('@')) {
    storeName = storeName.split('@')[0];
  }
  if (!storeName || storeName.toLowerCase() === 'due manager' || (/^[a-z0-9._]+$/i.test(storeName) && storeName.includes('16461'))) {
    storeName = companyNameOverride || 'Mondal Traders';
  }

  const currency = settings?.currency || '₹';
  const upiId = settings?.upiId || '';
  const tenantId = settings?.tenantId || '';

  const payLinkParams = new URLSearchParams();
  payLinkParams.set('mode', 'pay');
  payLinkParams.set('phone', cleanPhone || customer.phone);
  if (remainingDue > 0) payLinkParams.set('amt', remainingDue.toString());
  if (customer.name) payLinkParams.set('name', customer.name);
  if (storeName) payLinkParams.set('store', storeName);
  if (upiId) payLinkParams.set('upi', upiId);
  if (tenantId) payLinkParams.set('tenant', tenantId);

  const payLink = `${baseUrl}?${payLinkParams.toString()}`;

  const paymentStatus = remainingDue > 0 ? 'Pending' : 'Settled';
  const dueDateFormatted = customer.dueDate
    ? new Date(customer.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'As soon as possible';

  let template = settings?.defaultReminderMessage;
  if (!template || !template.includes('{PayLink}')) {
    template = `Hello {CustomerName},\n\nYour pending due amount with {StoreName} is {Currency}{Amount}.\nPayment Status: {PaymentStatus}\nDue Date: {DueDate}\n\nPay online via UPI or view details:\n{PayLink}\n\nThank you.\nRegards,\n{StoreName}`;
  }

  let message = template
    .replace(/{CustomerName}/g, customer.name)
    .replace(/{StoreName}/g, storeName)
    .replace(/{Currency}/g, currency)
    .replace(/{Amount}/g, remainingDue.toLocaleString('en-IN'))
    .replace(/{PaymentStatus}/g, paymentStatus)
    .replace(/{DueDate}/g, dueDateFormatted)
    .replace(/{UpiId}/g, upiId)
    .replace(/{PayLink}/g, payLink);

  // Sanitize footer to remove any remaining email username
  if (message.includes('Regards,')) {
    const parts = message.split('Regards,');
    let footerText = parts[1].trim();
    if (footerText.includes('@') || footerText.includes('mondalsagar16461')) {
      footerText = storeName;
    }
    message = parts[0] + 'Regards,\n' + (footerText || storeName);
  }

  return message;
}

export function openWhatsAppDirectChat(
  phone: string,
  message: string,
  options?: {
    onNotify?: (msg: string) => void;
    onError?: (err: string) => void;
  }
): boolean {
  const cleanPhone = formatPhoneNumberForWhatsApp(phone);

  if (!cleanPhone || cleanPhone.length < 10) {
    const errorMsg = 'Invalid mobile number. Please ensure the customer has a valid 10-digit mobile number.';
    if (options?.onError) options.onError(errorMsg);
    return false;
  }

  const encodedMsg = encodeURIComponent(message);
  // Universal WhatsApp Click-to-Chat URL targeting the exact customer phone
  const waUrl = `https://wa.me/${cleanPhone}?text=${encodedMsg}`;

  try {
    const win = window.open(waUrl, '_blank');
    if (!win) {
      window.location.href = waUrl;
    }
    if (options?.onNotify) {
      options.onNotify(`Opening WhatsApp chat directly for contact...`);
    }
    return true;
  } catch (err) {
    console.error('Failed to open WhatsApp:', err);
    if (options?.onError) {
      options.onError('Could not open WhatsApp. Please make sure WhatsApp is installed on your device.');
    }
    return false;
  }
}

export function openWhatsAppReminder(
  phone: string,
  message: string,
  _isBusiness: boolean = false
) {
  return openWhatsAppDirectChat(phone, message);
}

export async function sendWhatsAppReminderWithQr(
  customer: { name: string; phone: string; remainingDue: number; dueDate?: string },
  settings: AppSettings,
  onNotify?: (msg: string) => void
) {
  const amount = customer.remainingDue;
  const storeName = settings.adminName || 'Due Manager';
  const upiId = settings.upiId || '';
  const currency = settings.currency || '₹';

  const cleanPhone = formatPhoneNumberForWhatsApp(customer.phone);
  if (!cleanPhone || cleanPhone.length < 10) {
    if (onNotify) onNotify('❌ Invalid customer mobile number. Minimum 10 digits required.');
    return;
  }

  // 1. Generate QR Data URL if UPI ID exists
  let blob: Blob | null = null;
  let qrFile: File | null = null;
  const fileName = `Payment_QR_${customer.name.replace(/\s+/g, '_')}_${amount}.png`;

  if (upiId) {
    try {
      const qrDataUrl = await generateUpiQrDataUrl(
        upiId,
        storeName,
        amount,
        `Due Payment - ${customer.name}`
      );

      blob = await generateBrandedQrCanvasBlob(
        qrDataUrl,
        customer.name,
        amount,
        upiId,
        storeName,
        currency
      );

      qrFile = new File([blob], fileName, { type: 'image/png' });
    } catch (err) {
      console.warn('Failed to generate QR blob for sharing:', err);
    }
  }

  // 2. Format exact reminder message
  const message = formatWhatsAppReminderText(customer, amount, settings);

  // 3. Try Native Web Share API (Android Share Intent with File)
  if (qrFile && typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [qrFile] })) {
    try {
      await navigator.share({
        title: `Payment QR Code - ${customer.name}`,
        text: message,
        files: [qrFile],
      });
      if (onNotify) onNotify(`✅ Shared Payment QR Image & Reminder via Share Intent!`);
      return;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        if (onNotify) onNotify('Share cancelled by user.');
        return;
      }
      console.warn('Native file share failed or unsupported, falling back to direct WhatsApp launch:', err);
    }
  }

  // 4. Fallback: If blob exists, download QR image & copy to clipboard, then launch direct WhatsApp chat
  if (blob) {
    try {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      console.warn('Could not auto-download QR image:', e);
    }

    try {
      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ]);
      }
    } catch (clipErr) {
      console.log('Clipboard copy omitted:', clipErr);
    }
  }

  // 5. Open Direct WhatsApp Chat for targeted customer number
  openWhatsAppDirectChat(cleanPhone, message, {
    onNotify: (msg) => {
      if (onNotify) {
        onNotify(blob ? `QR image downloaded! Opening WhatsApp for ${customer.name}...` : msg);
      }
    },
    onError: (err) => {
      if (onNotify) onNotify(`❌ ${err}`);
    },
  });
}

