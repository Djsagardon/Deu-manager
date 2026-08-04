import { CustomerSummary, Transaction, AppSettings } from '../types';

export function exportCustomersToCsv(customers: CustomerSummary[], settings?: AppSettings) {
  const headers = ['Customer Name', 'Phone', 'Total Loan Given', 'Total Paid', 'Remaining Due', 'Payment %', 'Address'];
  const rows = customers.map((c) => [
    `"${c.name}"`,
    `"${c.phone}"`,
    c.totalLoanGiven,
    c.totalMoneyReceived,
    c.remainingDue,
    `${c.paymentPercentage}%`,
    `"${c.address || ''}"`,
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `Due_Manager_Customers_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function printCustomerStatement(
  customer: CustomerSummary,
  transactions: Transaction[],
  settings?: AppSettings
) {
  const currency = settings?.currency || '₹';
  const adminName = settings?.adminName || 'Due Manager';
  const adminPhone = settings?.adminPhone || 'N/A';
  const upiId = settings?.upiId || '';
  const appName = settings?.appName || 'Due Manager';

  const customerTxns = transactions
    .filter((t) => t.customerId === customer.id)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const rowsHtml = customerTxns
    .map((t, idx) => {
      const isLoan = t.type === 'LOAN_GIVEN';
      return `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 10px;">${idx + 1}</td>
        <td style="padding: 10px;">${new Date(t.date).toLocaleDateString('en-IN')}</td>
        <td style="padding: 10px;">${t.description || (isLoan ? 'Loan Given' : 'Money Received')}</td>
        <td style="padding: 10px;">${t.paymentMode}</td>
        <td style="padding: 10px; color: ${isLoan ? '#dc2626' : '#16a34a'}; font-weight: bold;">
          ${isLoan ? currency + t.amount.toLocaleString('en-IN') : '-'}
        </td>
        <td style="padding: 10px; color: #16a34a; font-weight: bold;">
          ${!isLoan ? currency + t.amount.toLocaleString('en-IN') : '-'}
        </td>
      </tr>
    `;
    })
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Customer Statement - ${customer.name}</title>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; padding: 30px; color: #1f2937; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #2563eb; padding-bottom: 15px; margin-bottom: 20px; }
          .title { font-size: 24px; font-weight: bold; color: #2563eb; }
          .sub { color: #6b7280; font-size: 14px; }
          .customer-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin-bottom: 20px; display: flex; justify-content: space-between; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th { background: #f3f4f6; text-align: left; padding: 10px; font-size: 13px; color: #4b5563; }
          .summary { display: flex; justify-content: flex-end; margin-top: 20px; gap: 20px; font-size: 15px; }
          .box { background: #eff6ff; padding: 12px 20px; border-radius: 8px; text-align: right; }
          .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px dashed #e5e7eb; padding-top: 15px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="title">${adminName}</div>
            <div class="sub">Phone: ${adminPhone} | UPI ID: ${upiId}</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 18px; font-weight: bold;">STATEMENT OF ACCOUNT</div>
            <div class="sub">Date: ${new Date().toLocaleDateString('en-IN')}</div>
          </div>
        </div>

        <div class="customer-card">
          <div>
            <div style="font-size: 16px; font-weight: bold;">Customer: ${customer.name}</div>
            <div style="color: #4b5563;">Phone: +91 ${customer.phone}</div>
            <div style="color: #6b7280; font-size: 13px;">${customer.address || ''}</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 13px; color: #6b7280;">Status</div>
            <div style="font-size: 16px; font-weight: bold; color: ${customer.remainingDue > 0 ? '#dc2626' : '#16a34a'};">
              ${customer.remainingDue > 0 ? 'Pending Due' : 'Fully Paid'}
            </div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Date</th>
              <th>Description</th>
              <th>Mode</th>
              <th>Loan Given (+)</th>
              <th>Payment Received (-)</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || '<tr><td colspan="6" style="text-align:center; padding: 20px; color:#9ca3af;">No transactions found</td></tr>'}
          </tbody>
        </table>

        <div class="summary">
          <div class="box">
            <div style="color: #6b7280; font-size: 12px;">Total Loan</div>
            <div style="font-weight: bold; font-size: 16px;">${currency}${customer.totalLoanGiven.toLocaleString('en-IN')}</div>
          </div>
          <div class="box">
            <div style="color: #6b7280; font-size: 12px;">Total Paid</div>
            <div style="font-weight: bold; font-size: 16px; color: #16a34a;">${currency}${customer.totalMoneyReceived.toLocaleString('en-IN')}</div>
          </div>
          <div class="box" style="background: #fef2f2; border: 1px solid #fecaca;">
            <div style="color: #991b1b; font-size: 12px;">Net Outstanding Due</div>
            <div style="font-weight: bold; font-size: 18px; color: #dc2626;">${currency}${customer.remainingDue.toLocaleString('en-IN')}</div>
          </div>
        </div>

        <div class="footer">
          Generated automatically by ${appName} App. Thank you for your payment!
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}
