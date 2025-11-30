import { Loan, CalculatedLoan, LoanStatus, PenaltyType, Client, InterestType } from './types';
import { differenceInDays, parseISO, format, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const formatDate = (dateString: string) => {
  if (!dateString) return '-';
  
  // FIX: Manually split YYYY-MM-DD to avoid Timezone/Date object shifts
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  }

  try {
    return format(parseISO(dateString), 'dd/MM/yyyy', { locale: ptBR });
  } catch (e) {
    return dateString;
  }
};

export const calculateLoanDetails = (loan: Loan, clients: Client[]): CalculatedLoan => {
  const client = clients.find(c => c.id === loan.clientId);
  
  // 1. Base calculations (Principal + Interest)
  let initialInterest = 0;
  
  const interestType = loan.interestType || InterestType.PERCENTAGE;

  if (interestType === InterestType.FIXED_VALUE) {
    initialInterest = loan.interestRate;
  } else {
    // Percentage
    initialInterest = loan.amount * (loan.interestRate / 100);
  }

  const baseTotal = loan.amount + initialInterest;

  // 2. Overdue Status & Days Calculation
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const dueDateStr = loan.dueDate; 
  
  let isOverdue = false;
  let referenceDateStr = todayStr;

  if (loan.status === LoanStatus.PAID && loan.paidAt) {
    // If paid, compare Paid Date vs Due Date
    const paidDateStr = format(parseISO(loan.paidAt), 'yyyy-MM-dd');
    isOverdue = paidDateStr > dueDateStr;
    referenceDateStr = paidDateStr;
  } else {
    // If active, compare Today vs Due Date
    isOverdue = loan.status !== LoanStatus.PAID && todayStr > dueDateStr;
    referenceDateStr = todayStr;
  }
  
  // STRICT DATE DIFF CALCULATION
  // Parse YYYY-MM-DD explicitly to avoid timezone offsets causing "1 day" errors
  const parseLocalYMD = (ymd: string) => {
    const [y, m, d] = ymd.split('-').map(Number);
    return new Date(y, m - 1, d); // Month is 0-indexed in JS Date
  };

  const dueObj = parseLocalYMD(dueDateStr);
  const refObj = parseLocalYMD(referenceDateStr);
  
  // Calculate difference in full days
  const daysOverdue = isOverdue ? Math.max(0, differenceInDays(refObj, dueObj)) : 0;
  
  // 3. Penalty Calculation
  let penaltyAmount = 0;

  if (isOverdue && daysOverdue > 0) {
    switch (loan.penaltyType) {
      case PenaltyType.DAILY_PERCENTAGE:
        // Rule: Daily Percentage based on Current Debt (Base Total)
        // Formula: (BaseTotal * Rate%) * Days
        const dailyPenaltyAmt = baseTotal * (loan.penaltyRate / 100);
        penaltyAmount = dailyPenaltyAmt * daysOverdue;
        break;
        
      case PenaltyType.DAILY_VALUE:
        // Rule: Fixed Daily Value
        // Formula: FixedRate * Days
        penaltyAmount = Number(loan.penaltyRate) * daysOverdue;
        break;

      case PenaltyType.FIXED_VALUE:
        // One-time Fixed Value (Added once regardless of days)
        penaltyAmount = Number(loan.penaltyRate);
        break;

      case PenaltyType.FIXED:
      default:
        // One-time Percentage (Added once regardless of days)
        penaltyAmount = baseTotal * (loan.penaltyRate / 100);
        break;
    }
  }

  const finalTotal = baseTotal + penaltyAmount;
  const profit = finalTotal - loan.amount;

  return {
    ...loan,
    clientName: client?.name || 'Cliente Desconhecido',
    initialInterest,
    baseTotal,
    daysOverdue,
    penaltyAmount,
    finalTotal,
    profit,
    isOverdue
  };
};

export const generateId = () => {
  return Math.random().toString(36).substring(2, 9);
};