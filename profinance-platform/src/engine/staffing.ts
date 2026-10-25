// Staffing: FTE by role/scenario/year, branch-driven roles, Kosovo payroll burden and hiring costs.
import type { Case, ModelInputs, StaffingScenario } from './types';

export interface RoleDef {
  role_id: string;
  role: string;
  department: string;
  function_class: string;
  requirement_status: string;
  independence: string;
  outsourceable: string;
  driver: string;
  hire_month_rel_golive: string;
  [k: string]: string;
}

export function roleFte(r: RoleDef, scenario: StaffingScenario, year: number): number {
  const y = Math.min(3, Math.max(1, year));
  return Number(r[`${scenario}_y${y}`] || 0);
}

export function roleSalary(r: RoleDef, c: Case): number {
  return Number(r[`gross_monthly_${c}_eur`] || 0);
}

export function branchesForYear(inputs: ModelInputs, year: number): number {
  const arr = inputs.staffing.branches[inputs.staffing.scenario];
  if (year <= 0) return arr[0];
  return arr[Math.min(year, arr.length) - 1];
}

/** Kosovo statutory employer cost on gross salary: mandatory pension 5% employer share (PwC tax summaries). */
export function employerCost(gross: number, pensionRate: number): number {
  return gross * (1 + pensionRate);
}

export interface StaffMonth {
  fte: number;
  salaryCost: number;
  boardFees: number;
  bonus: number;
  newHires: number;
  newHireAnnualGross: number;
  byDepartment: Record<string, number>;
}

/** FTE for a role in a given month relative to go-live. Pre-op: Y1 headcount from hire month. */
export function fteAt(inputs: ModelInputs, r: RoleDef, rel: number): number {
  const sc = inputs.staffing.scenario;
  const perBranch = r.driver === 'per_branch';
  const hire = Number(r.hire_month_rel_golive || 0);
  if (rel < hire) return 0;
  const opYear = rel < 0 ? 1 : Math.floor(rel / 12) + 1;
  let fte = roleFte(r, sc, opYear);
  if (perBranch) {
    // branches for Y1 open just before go-live; pre-op hires only for Y1 branches
    fte *= branchesForYear(inputs, opYear);
  } else if (opYear > 3) {
    fte *= Math.pow(1 + inputs.staffing.fteGrowthAfterY3, opYear - 3);
  }
  return fte;
}

export function staffMonth(inputs: ModelInputs, roles: RoleDef[], rel: number): StaffMonth {
  const s = inputs.staffing;
  const yearIdx = rel < 0 ? 0 : Math.floor(rel / 12);
  const infl = Math.pow(1 + s.wageInflation, yearIdx);
  const out: StaffMonth = { fte: 0, salaryCost: 0, boardFees: 0, bonus: 0, newHires: 0, newHireAnnualGross: 0, byDepartment: {} };
  for (const r of roles) {
    const fte = fteAt(inputs, r, rel);
    const prev = fteAt(inputs, r, rel - 1);
    const gross = roleSalary(r, s.salaryCase) * infl;
    const isBoard = r.function_class === 'board';
    const cost = isBoard ? fte * gross : fte * employerCost(gross, s.employerPensionRate);
    const bonus = s.includeBonus && !isBoard ? fte * gross * Number(r.bonus_pct_base || 0) : 0;
    if (isBoard) out.boardFees += cost;
    else {
      out.salaryCost += cost;
      out.fte += fte;
    }
    out.bonus += bonus;
    out.byDepartment[r.department] = (out.byDepartment[r.department] ?? 0) + cost + bonus;
    if (!isBoard && fte > prev) {
      out.newHires += fte - prev;
      out.newHireAnnualGross += (fte - prev) * gross * 12;
    }
  }
  return out;
}

/** Year-end headcount table for the HR module. */
export function headcountTable(inputs: ModelInputs, roles: RoleDef[], years = 3) {
  return roles.map((r) => ({
    role_id: r.role_id,
    role: r.role,
    department: r.department,
    function_class: r.function_class,
    requirement_status: r.requirement_status,
    fte: Array.from({ length: years }, (_, y) => fteAt(inputs, r, y * 12 + 11)),
    grossMonthly: roleSalary(r, inputs.staffing.salaryCase),
    annualEmployerCostY1:
      fteAt(inputs, r, 11) *
      (r.function_class === 'board'
        ? roleSalary(r, inputs.staffing.salaryCase) * 12
        : employerCost(roleSalary(r, inputs.staffing.salaryCase), inputs.staffing.employerPensionRate) * 12 *
          (1 + (inputs.staffing.includeBonus ? Number(r.bonus_pct_base || 0) : 0))),
  }));
}

/** Kosovo personal income tax (annual brackets per Law 08/L-142, PwC): 0% ≤3,000; 8% ≤5,400; 10% above. */
export function kosovoNetMonthly(grossMonthly: number, employeePension = 0.05) {
  const pension = grossMonthly * employeePension;
  const taxableAnnual = (grossMonthly - pension) * 12;
  const tax = Math.max(0, Math.min(taxableAnnual, 5400) - 3000) * 0.08 + Math.max(0, taxableAnnual - 5400) * 0.1;
  const taxMonthly = tax / 12;
  return { gross: grossMonthly, employeePension: pension, incomeTax: taxMonthly, net: grossMonthly - pension - taxMonthly };
}
