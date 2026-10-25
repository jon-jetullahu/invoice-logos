// Management-provided seed data and the derivations stated in 02_Management_Data/management_notes.md.
import type { ModelInputs } from './types';

export interface ManagementDerivations {
  leasing: number[];
  goods: number[];
  depositToPortfolio: number[];
  portfolioMinusDeposits: number[];
  depositsPerAccount: number[];
  portfolioPerAccount: number[];
  accountsPerSeat: number[];
  /** The difference is NOT a cash shortfall: it ignores capital, liquidity holdings, repayments and other funding. */
  portfolioMinusDepositsLabel: 'STRUCTURAL_GAP_NOT_A_CASH_SHORTFALL';
  /** payroll headcount cannot be derived from CBS user seats */
  payrollHeadcount: null;
}

export function deriveManagement(m: ModelInputs['management']): ManagementDerivations {
  const idx = [0, 1, 2];
  return {
    leasing: idx.map((i) => m.portfolio[i] * m.leasingShare[i]),
    goods: idx.map((i) => m.portfolio[i] * (1 - m.leasingShare[i])),
    depositToPortfolio: idx.map((i) => m.deposits[i] / m.portfolio[i]),
    portfolioMinusDeposits: idx.map((i) => m.portfolio[i] - m.deposits[i]),
    depositsPerAccount: idx.map((i) => m.deposits[i] / m.accounts[i]),
    portfolioPerAccount: idx.map((i) => m.portfolio[i] / m.accounts[i]),
    accountsPerSeat: idx.map((i) => m.accounts[i] / m.cbsSeats[i]),
    portfolioMinusDepositsLabel: 'STRUCTURAL_GAP_NOT_A_CASH_SHORTFALL',
    payrollHeadcount: null,
  };
}

/**
 * Year-end stock path: management Y1–Y3 year-end stocks, then compound growth per later year.
 * Returns the target stock at the END of each operating month (rel 0..horizon-1), linearly interpolated
 * between year-end points starting from `opening` at go-live. Targets are stocks, never originations.
 */
export function yearEndPath(y123: number[], growthAfter: number[], years: number, scale: number): number[] {
  const out: number[] = [];
  for (let y = 0; y < years; y++) {
    if (y < 3) out.push(y123[y] * scale);
    else out.push(out[y - 1] * (1 + (growthAfter[y - 3] ?? growthAfter[growthAfter.length - 1] ?? 0)));
  }
  return out;
}

export function monthlyTargets(yearEnds: number[], horizonMonths: number, opening: number): number[] {
  const t: number[] = [];
  for (let rel = 0; rel < horizonMonths; rel++) {
    const y = Math.floor(rel / 12);
    const start = y === 0 ? opening : yearEnds[y - 1];
    const end = yearEnds[y];
    t.push(start + ((end - start) * ((rel % 12) + 1)) / 12);
  }
  return t;
}
