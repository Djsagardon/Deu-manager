import QRCode from 'qrcode';
import { AppSettings, Customer } from '../types';

export function buildUpiPayUrl(
  upiId: string,
  adminName: string,
  amount: number,
  note: string
): string {
  const cleanUpi = upiId.trim();
  const encodedName = encodeURIComponent(adminName || 'Due Manager');
  const encodedNote = encodeURIComponent(note || 'Pending Due Payment');
  const formattedAmount = amount.toFixed(2);

  return `upi://pay?pa=${cleanUpi}&pn=${encodedName}&am=${formattedAmount}&cu=INR&tn=${encodedNote}`;
}

export async function generateUpiQrDataUrl(
  upiId: string,
  adminName: string,
  amount: number,
  note: string
): Promise<string> {
  const upiUrl = buildUpiPayUrl(upiId, adminName, amount, note);
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

export function formatWhatsAppReminderText(
  customer: Customer,
  remainingDue: number,
  settings?: AppSettings,
  paymentPortalUrl?: string
): string {
  const appUrl = paymentPortalUrl || window.location.origin;
  const payLink = `${appUrl}?mode=pay&customerPhone=${encodeURIComponent(customer.phone)}`;
  const storeName = settings?.adminName || 'Due Manager';
  const currency = settings?.currency || '₹';
  const upiId = settings?.upiId || 'merchant@upi';

  let template = settings?.defaultReminderMessage || `Hello {CustomerName},\n\nAccording to our records at {StoreName}, your pending amount is {Currency}{Amount}.\n\nPlease complete your payment using our QR code or payment confirmation link:\n{PayLink}\n\nThank you!\nRegards,\n{StoreName}`;

  template = template
    .replace(/{CustomerName}/g, customer.name)
    .replace(/{StoreName}/g, storeName)
    .replace(/{Currency}/g, currency)
    .replace(/{Amount}/g, remainingDue.toLocaleString('en-IN'))
    .replace(/{UpiId}/g, upiId)
    .replace(/{PayLink}/g, payLink);

  return template;
}

export function openWhatsAppReminder(
  phone: string,
  message: string,
  isBusiness: boolean = false
) {
  let cleanPhone = phone.replace(/[^0-9]/g, '');
  if (cleanPhone.length === 10) {
    cleanPhone = '91' + cleanPhone;
  }

  const encodedMsg = encodeURIComponent(message);
  const waUrl = `https://wa.me/${cleanPhone}?text=${encodedMsg}`;

  window.open(waUrl, '_blank');
}

export async function sendWhatsAppReminderWithQr(
  customer: { name: string; phone: string; remainingDue: number },
  settings: AppSettings,
  onNotify?: (msg: string) => void
) {
  const amount = customer.remainingDue;
  const storeName = settings.adminName || 'Sagar';
  const upiId = settings.upiId || '';
  const currency = settings.currency || '₹';

  // 1. Generate QR Data URL
  const qrDataUrl = await generateUpiQrDataUrl(
    upiId,
    storeName,
    amount,
    `Due Payment - ${customer.name}`
  );

  // 2. Generate PNG Image Blob & File
  const blob = await generateBrandedQrCanvasBlob(
    qrDataUrl,
    customer.name,
    amount,
    upiId,
    storeName,
    currency
  );

  const fileName = `Payment_QR_${customer.name.replace(/\s+/g, '_')}_${amount}.png`;
  const qrFile = new File([blob], fileName, { type: 'image/png' });

  // 3. Format exact user reminder message
  const message = `Hello ${customer.name},\n\nAccording to our records, your pending amount is ${currency}${amount.toLocaleString('en-IN')}.\n\nPlease scan the attached QR Code image to complete your payment.\n\nUPI ID:\n${upiId}\n\nThank you.\n\nRegards,\n${storeName}`;

  let cleanPhone = customer.phone.replace(/[^0-9]/g, '');
  if (cleanPhone.length === 10) {
    cleanPhone = '91' + cleanPhone;
  }

  // 4. Try Web Share API with File Attachment
  if (navigator.canShare && navigator.canShare({ files: [qrFile] })) {
    try {
      await navigator.share({
        title: `Payment QR Code - ${customer.name}`,
        text: message,
        files: [qrFile],
      });
      if (onNotify) onNotify('WhatsApp reminder & QR Code image shared successfully!');
      return;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return; // User closed share window
      }
      console.warn('Web Share API unsupported or failed, using download fallback:', err);
    }
  }

  // Fallback: Download QR PNG image and open WhatsApp with pre-filled message
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  try {
    if (navigator.clipboard && window.ClipboardItem) {
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ]);
    }
  } catch (clipErr) {
    console.log('Clipboard copy omitted:', clipErr);
  }

  const encodedMsg = encodeURIComponent(message);
  const waUrl = `https://wa.me/${cleanPhone}?text=${encodedMsg}`;
  window.open(waUrl, '_blank');

  if (onNotify) {
    onNotify(`QR Code image downloaded! WhatsApp opened for ${customer.name}. Attach the downloaded image to complete sharing.`);
  }
}

