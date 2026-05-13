import { differenceInDays, parseISO } from 'date-fns';

export const PENALTY_RATE_PER_DAY = 1.00; // S/ 1.00 per day

export function calculatePenalty(dueDate, returnDate = new Date(), manualPenalty = 0, customRate = null) {
  if (!dueDate) return { daysLate: 0, amount: 0, status: 'good' };
  
  const due = typeof dueDate === 'string' ? parseISO(dueDate) : dueDate;
  const ret = typeof returnDate === 'string' ? parseISO(returnDate) : returnDate;
  
  // Evitar error de 1969
  if (due.getFullYear() < 2000) return { daysLate: 0, amount: 0, status: 'good' };
  
  const daysLate = differenceInDays(ret, due);
  
  const rate = customRate !== null ? Number(customRate) : PENALTY_RATE_PER_DAY;
  const baseAmount = daysLate <= 0 ? 0 : daysLate * rate;
  const finalAmount = baseAmount + (Number(manualPenalty) || 0);

  return {
    daysLate: Math.max(0, daysLate),
    amount: finalAmount,
    status: daysLate > 30 ? 'blocked' : (daysLate > 0 || manualPenalty > 0 ? 'warning' : 'good')
  };
}

export function getDaysRemaining(dueDate) {
  const due = typeof dueDate === 'string' ? parseISO(dueDate) : dueDate;
  const now = new Date();
  
  const days = differenceInDays(due, now);
  if (days < 0) return { days: Math.abs(days), status: 'overdue' };
  if (days <= 3) return { days, status: 'urgent' };
  if (days <= 7) return { days, status: 'warning' };
  return { days, status: 'safe' };
}
