/** Standard amortisation: M = P·r(1+r)^n / ((1+r)^n − 1), r = monthly rate, n = months. */
export function mortgage(principal: number, annualRatePct: number, years: number) {
  const n = Math.round(years * 12);
  const r = annualRatePct / 100 / 12;
  if (principal <= 0 || n <= 0) return { monthly: 0, total: 0, interest: 0 };
  const monthly = r === 0 ? principal / n : (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  const total = monthly * n;
  return { monthly, total, interest: total - principal };
}

export function roi(opts: { price: number; annualRent: number; annualCosts?: number; appreciationPct?: number; years?: number }) {
  const { price, annualRent, annualCosts = 0, appreciationPct = 0, years = 5 } = opts;
  const netIncome = annualRent - annualCosts;
  const grossYield = price > 0 ? (annualRent / price) * 100 : 0;
  const netYield = price > 0 ? (netIncome / price) * 100 : 0;
  const futureValue = price * Math.pow(1 + appreciationPct / 100, years);
  const totalReturn = netIncome * years + (futureValue - price);
  return { grossYield, netYield, netIncome, futureValue, totalReturn, roiPct: price > 0 ? (totalReturn / price) * 100 : 0 };
}
