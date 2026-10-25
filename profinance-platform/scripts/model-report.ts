// CLI: run the Management base (illustrative) scenario set and print an annual summary + validation.
import { applyCase, managementBase, runModel, STRESS_LIBRARY, withStress } from '../src/engine';

const m = (v: number) => (v / 1e6).toFixed(2).padStart(8);
const p = (v: number | null) => (v === null ? '   n/a' : `${(v * 100).toFixed(1)}%`.padStart(6));

for (const c of ['low', 'base', 'high'] as const) {
  const r = runModel(applyCase(managementBase(), c));
  console.log(`\n=== ${r.inputsName} ===`);
  console.log('Year     Loans  Deposits    Cash  Equity   NII    Fees    Opex   Prov     NI    CAR    LiqR   FTE');
  for (const y of r.years) {
    console.log(`${y.label.padEnd(6)} ${m(y.grossLoans)} ${m(y.deposits)} ${m(y.cashTotal)} ${m(y.equity)} ${m(y.nii)} ${m(y.feeIncome)} ${m(y.opex)} ${m(y.provisionExpense)} ${m(y.netIncome)} ${p(y.car)} ${p(y.liquidityRatio)} ${y.fte.toFixed(0).padStart(5)}`);
  }
  console.log('Statuses:', Object.entries(r.statuses).map(([k, v]) => `${k}=${v.status}`).join(' | '));
  console.log('Capital:', JSON.stringify(r.capitalAnalysis));
  console.log('Checks:', r.checks.map((x) => `${x.id}:${x.passed ? 'ok' : 'FAIL'}`).join(' '));
  console.log('Regulatory:', r.regulatory.map((t) => `${t.ruleId}=${t.verdict}/${t.indicative}`).join(' '));
}
const base = applyCase(managementBase(), 'base');
console.log('\n=== Stress tests on base ===');
for (const s of STRESS_LIBRARY) {
  const r = runModel(withStress(base, s.shock));
  const minCar = Math.min(...r.months.filter((x) => x.car !== null).map((x) => x.car as number));
  console.log(`${s.label.padEnd(36)} minCAR ${p(minCar)}  minCash ${m(r.capitalAnalysis.minCash)}  Y5 NI ${m(r.years[5].netIncome)}  extra equity ${m(r.capitalAnalysis.additionalEquityIndicated)}`);
}
