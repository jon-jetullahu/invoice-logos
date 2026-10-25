import { blankInputs, managementBase, type ModelInputs } from '../engine';

export const PRESETS: Record<string, () => ModelInputs> = {
  'Management base (illustrative)': managementBase,
  'Management + €10m strategic raise': () => {
    const x = managementBase();
    x.name = 'Management + €10m strategic raise';
    x.capital.injections[1].enabled = true;
    return x;
  },
  'Management + wholesale funding line': () => {
    const x = managementBase();
    x.name = 'Management + wholesale funding line';
    x.wholesale.enabled = true;
    return x;
  },
  'Islamic window variant': () => {
    const x = managementBase();
    x.name = 'Islamic window variant';
    x.islamic.enabled = true;
    return x;
  },
  'Blank (seeds only, no capital)': blankInputs,
};

export const MODULES: { id: string; label: string; group: string }[] = [
  { id: 'dashboard', label: 'Executive dashboard', group: 'Overview' },
  { id: 'industry', label: 'Kosovo banking intelligence', group: 'Overview' },
  { id: 'historical', label: 'Historical bank comparisons', group: 'Overview' },
  { id: 'licensing', label: 'CBK licensing checklist', group: 'Regulatory' },
  { id: 'capital', label: 'Capital adequacy & regulation', group: 'Regulatory' },
  { id: 'staffing', label: 'Organisation & staffing', group: 'People' },
  { id: 'salary', label: 'Salary & payroll calculator', group: 'People' },
  { id: 'tech', label: 'Technology & vendor costs', group: 'Economics' },
  { id: 'projections', label: 'Financing & deposits', group: 'Economics' },
  { id: 'statements', label: 'Ten-year statements', group: 'Economics' },
  { id: 'liquidity', label: 'Liquidity & funding', group: 'Economics' },
  { id: 'scenarios', label: 'Scenarios & stress tests', group: 'Decision' },
  { id: 'shareholders', label: 'Shareholders & capital raising', group: 'Decision' },
  { id: 'readiness', label: 'Readiness & roadmap', group: 'Decision' },
  { id: 'sources', label: 'Source library & traceability', group: 'Evidence' },
  { id: 'exports', label: 'Reports & exports', group: 'Evidence' },
  { id: 'assumptions', label: 'All assumptions', group: 'Evidence' },
];

