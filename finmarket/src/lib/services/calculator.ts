import Decimal from 'decimal.js';

export interface CalculationResult {
  monthlyPayment: Decimal;
  totalOverpayment: Decimal;
  totalPayment: Decimal;
  advanceAmount: Decimal;
  gaes: Decimal;
}

/**
 * Расчет параметров лизинга.
 * Используется формула аннуитетного платежа.
 *
 * @param amount Полная стоимость техники (в тенге)
 * @param advancePercent Процент первоначального взноса (от 0 до 100)
 * @param termMonths Срок лизинга (в месяцах)
 * @param annualRate Годовая ставка в процентах (от 0 до 100)
 */
export function calculateLease(
  amount: number | string | Decimal,
  advancePercent: number | string | Decimal,
  termMonths: number,
  annualRate: number | string | Decimal
): CalculationResult {
  const dAmount = new Decimal(amount);
  const dAdvancePercent = new Decimal(advancePercent);
  const dAnnualRate = new Decimal(annualRate);

  // Аванс в тенге
  const advanceAmount = dAmount.mul(dAdvancePercent).div(100);

  // Тело лизинга (сумма кредита)
  const principal = dAmount.sub(advanceAmount);

  // Месячная ставка (в долях)
  const monthlyRate = dAnnualRate.div(12).div(100);

  let monthlyPayment = new Decimal(0);

  if (monthlyRate.isZero()) {
    monthlyPayment = principal.div(termMonths);
  } else {
    // Формула: P * r * (1 + r)^n / ((1 + r)^n - 1)
    const factor = new Decimal(1).plus(monthlyRate).pow(termMonths);
    monthlyPayment = principal.mul(monthlyRate).mul(factor).div(factor.sub(1));
  }

  // Общая сумма выплат (без учета аванса)
  const totalPayment = monthlyPayment.mul(termMonths);

  // Переплата
  const totalOverpayment = totalPayment.sub(principal);

  // ГЭСВ (Эффективная ставка)
  // Упрощенный расчет: ((Переплата / Тело) / (Срок / 12)) * 100
  // В реальном финансовом приложении ГЭСВ рассчитывается сложнее (через IRR).
  let gaes = new Decimal(0);
  if (!principal.isZero() && termMonths > 0) {
     const years = new Decimal(termMonths).div(12);
     gaes = totalOverpayment.div(principal).div(years).mul(100);
  }

  return {
    monthlyPayment: monthlyPayment.toDecimalPlaces(2, Decimal.ROUND_HALF_UP),
    totalOverpayment: totalOverpayment.toDecimalPlaces(2, Decimal.ROUND_HALF_UP),
    totalPayment: totalPayment.toDecimalPlaces(2, Decimal.ROUND_HALF_UP),
    advanceAmount: advanceAmount.toDecimalPlaces(2, Decimal.ROUND_HALF_UP),
    gaes: gaes.toDecimalPlaces(2, Decimal.ROUND_HALF_UP),
  };
}
