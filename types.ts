export enum LoanStatus {
  ACTIVE = 'ACTIVE',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE' // Calculated status, mostly for UI logic
}

export enum PenaltyType {
  FIXED = 'FIXED', // Existing: One-time Percentage
  FIXED_VALUE = 'FIXED_VALUE', // Existing: One-time Value
  DAILY_PERCENTAGE = 'DAILY_PERCENTAGE', // New: Daily Percentage
  DAILY_VALUE = 'DAILY_VALUE' // New: Daily Fixed Value
}

export enum InterestType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED_VALUE = 'FIXED_VALUE'
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  address?: string; 
  profession?: string; 
  cpf?: string;     // New Field
  photo?: string;   // New Field (Base64)
  collateral: string;
  createdAt: string;
}

export interface Loan {
  id: string;
  clientId: string;
  amount: number; 
  interestRate: number; 
  interestType: InterestType; 
  dueDate: string; // ISO Date string
  penaltyRate: number; 
  penaltyType: PenaltyType;
  status: LoanStatus;
  createdAt: string;
  paidAt?: string;
  
  // Installment fields
  installmentNumber?: number;
  installmentTotal?: number;
  groupId?: string; 
}

export interface CalculatedLoan extends Loan {
  initialInterest: number;
  baseTotal: number;
  daysOverdue: number;
  penaltyAmount: number;
  finalTotal: number;
  profit: number; 
  isOverdue: boolean;
  clientName?: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category?: string;
  date: string; // YYYY-MM-DD
  notes?: string;
  createdAt: string;
}