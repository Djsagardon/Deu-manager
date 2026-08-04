import { Customer, CustomerSummary, Transaction } from '../types';

export function calculateCustomerSummary(
  customer: Customer,
  transactions: Transaction[]
): CustomerSummary {
  const customerTxns = transactions.filter((t) => t.customerId === customer.id);

  let totalLoanGiven = 0;
  let totalMoneyReceived = 0;
  let lastTransactionDate: string | undefined = undefined;

  // Sort by date ascending to process timeline
  const sortedTxns = [...customerTxns].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  sortedTxns.forEach((t) => {
    if (t.type === 'LOAN_GIVEN') {
      totalLoanGiven += t.amount;
    } else if (t.type === 'MONEY_RECEIVED') {
      totalMoneyReceived += t.amount;
    }
    lastTransactionDate = t.date;
  });

  const remainingDue = Math.max(0, totalLoanGiven - totalMoneyReceived);
  const paymentPercentage =
    totalLoanGiven > 0
      ? Math.min(100, Math.round((totalMoneyReceived / totalLoanGiven) * 100))
      : 100;

  return {
    ...customer,
    totalLoanGiven,
    totalMoneyReceived,
    remainingDue,
    lastTransactionDate,
    paymentPercentage,
  };
}

export function calculateAllCustomerSummaries(
  customers: Customer[],
  transactions: Transaction[]
): CustomerSummary[] {
  return customers
    .filter((c) => !c.isArchived)
    .map((c) => calculateCustomerSummary(c, transactions));
}

export interface DashboardStats {
  totalCustomers: number;
  totalLoanGiven: number;
  totalMoneyReceived: number;
  totalPendingDue: number;
  todaysCollection: number;
  monthlyCollection: number;
  topDueCustomers: CustomerSummary[];
}

export function calculateDashboardStats(
  customers: Customer[],
  transactions: Transaction[]
): DashboardStats {
  const summaries = calculateAllCustomerSummaries(customers, transactions);

  const totalCustomers = summaries.length;
  let totalLoanGiven = 0;
  let totalMoneyReceived = 0;
  let totalPendingDue = 0;

  summaries.forEach((s) => {
    totalLoanGiven += s.totalLoanGiven;
    totalMoneyReceived += s.totalMoneyReceived;
    totalPendingDue += s.remainingDue;
  });

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

  let todaysCollection = 0;
  let monthlyCollection = 0;

  transactions.forEach((t) => {
    if (t.type === 'MONEY_RECEIVED') {
      const tTime = new Date(t.date).getTime();
      if (tTime >= startOfToday) {
        todaysCollection += t.amount;
      }
      if (tTime >= startOfMonth) {
        monthlyCollection += t.amount;
      }
    }
  });

  // Top due customers sorted by remaining due descending
  const topDueCustomers = [...summaries]
    .filter((s) => s.remainingDue > 0)
    .sort((a, b) => b.remainingDue - a.remainingDue)
    .slice(0, 5);

  return {
    totalCustomers,
    totalLoanGiven,
    totalMoneyReceived,
    totalPendingDue,
    todaysCollection,
    monthlyCollection,
    topDueCustomers,
  };
}
