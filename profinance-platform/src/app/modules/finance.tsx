import { useState } from 'react';
import {
  billingStartRel, cbsAmounts, costValue, illustrativeTotal, reconcileFiveYearQuote, reconcilePackageTotals, VISA_ESTIMATES_USD, visaLines,
  type Case, type CostRow, type YearRow,
} from '../../engine';
import { Card, ChartCard, DataTable, Explain, Kpi, NumberField, Seg, SourceBadge, Toggle, VerdictChip } from '../components';
import { DATA, type ModProps } from '../data';
import { eur, eurM, num, pct, usd } from '../format';
import { field, Rich, useI18n, yearLabel } from '../i18n';
import { useMessages } from '../messages';

export const VISA_LINE_LABELS: Record<string, string> = {
  issuing_licence: 'Visa issuing {m} licence', issuer_processor: 'Issuer processor set-up & certification', card_management: 'Card management / issuing platform',
  card_production: 'Card production set-up & initial plastic', acquiring_licence: 'Visa acquiring {m} licence', gateway: 'E-commerce payment gateway',
  configuration: 'Configuration fee (may not apply)', bin: 'BIN fee × {n}', project: 'Visa project fees ({n} months)', quarterly_fixed: 'Quarterly fixed fee (first 12 months)',
};

export function TechCosts({ inputs, result, set, readOnly }: ModProps) {
  const { t, lang } = useI18n();
  const cbs = cbsAmounts(inputs.cbs);
  const rec = reconcileFiveYearQuote();
  const visaRec = reconcilePackageTotals();
  const lines = visaLines(inputs.visa);
  const y = result.years;
  const catKeys = [...new Set(y.flatMap((x) => Object.keys(x.opexByCategory)))];
  const waterfall = y.map((x) => ({ year: yearLabel(lang, x.label), ...Object.fromEntries(catKeys.map((k) => [k, x.opexByCategory[k] ?? 0])) }));
  const top4 = catKeys.sort((a, b) => (y[3]?.opexByCategory[b] ?? 0) - (y[3]?.opexByCategory[a] ?? 0)).slice(0, 4);
  const mem = t(inputs.visa.membership === 'principal' ? 'principal' : 'affiliate');
  return (
    <>
      <div className="grid-2">
        <Card title={t('Core banking: Facilization offer (23-Oct-2026)')} sub={t("Non-binding budgetary offer, valid to 30-Nov-2026, EUR, excluding VAT. The bank's VAT exemption makes input VAT a cost.")}>
          <div className="row" style={{ marginBottom: 8 }}>{t('Range point')} <Seg<Case> value={inputs.cbs.case} onChange={(v) => set('cbs.case', v)} options={[{ v: 'low', label: t('Low') }, { v: 'base', label: t('Mid') }, { v: 'high', label: t('High') }]} /></div>
          <div className="kpis">
            <Kpi label={t('Implementation')} value={eur(cbs.implementation)} note={t('€450k–€520k quoted')} />
            <Kpi label={t('Annual subscription')} value={eur(cbs.annualSubscription)} note={t('€1.0m–€1.1m (5-yr average)')} />
            <Kpi label={t('Billing starts')} value={t('month {m}', { m: billingStartRel(inputs.cbs) })} note={t('relative to go-live')} />
          </div>
          <div className="field"><label>{t('Billing trigger')}</label>
            <select disabled={readOnly} value={inputs.cbs.billingTrigger} onChange={(e) => set('cbs.billingTrigger', e.target.value)}>
              <option value="go_live">{t('Go-live')}</option><option value="contract_signing">{t('Contract signing')}</option><option value="custom">{t('Custom month')}</option></select></div>
          {inputs.cbs.billingTrigger === 'contract_signing' && <NumberField label={t('Contract signing (month rel. go-live)')} value={inputs.cbs.contractSigningRelMonth} onChange={(v) => set('cbs.contractSigningRelMonth', v ?? 0)} />}
          {inputs.cbs.billingTrigger === 'custom' && <NumberField label={t('Billing start (month rel. go-live)')} value={inputs.cbs.customBillingStartRelMonth} onChange={(v) => set('cbs.customBillingStartRelMonth', v ?? 0)} />}
          <div className="field"><label>{t('Billing frequency')}</label>
            <select disabled={readOnly} value={inputs.cbs.billingFrequency} onChange={(e) => set('cbs.billingFrequency', e.target.value)}>
              <option value="monthly">{t('Monthly')}</option><option value="quarterly">{t('Quarterly')}</option><option value="annual_advance">{t('Annual in advance')}</option></select></div>
          <NumberField label={t('Annual escalation')} unit="pct" value={inputs.cbs.annualEscalation} onChange={(v) => set('cbs.annualEscalation', v ?? 0)} />
          <NumberField label={t('Implementation capitalised')} unit="pct" value={inputs.cbs.capitalisedImplementationPct} onChange={(v) => set('cbs.capitalisedImplementationPct', v ?? 0)} meta={t('Cloud/SaaS configuration costs are usually expensed (IFRIC agenda decision, 2021). Auditor confirmation required.')} />
          <Toggle label={t('Renew after 5-year term (same terms)')} checked={inputs.cbs.renewAfterTerm} onChange={(v) => set('cbs.renewAfterTerm', v)} />
          <NumberField label={t('Irrecoverable VAT')} unit="pct" value={inputs.costs.irrecoverableVatRate} onChange={(v) => set('costs.irrecoverableVatRate', v ?? 0)} />
          <h4>{t('Quote reconciliation')}</h4>
          <table><tbody>
            <tr><td>{t('Computed 5-year low (450k + 5 × 1.0m)')}</td><td className="num">{eur(rec.computedLow)}</td><td className="num">{t('quoted {v}', { v: eur(rec.quotedLow) })}</td></tr>
            <tr><td>{t('Computed 5-year high (520k + 5 × 1.1m)')}</td><td className="num">{eur(rec.computedHigh)}</td><td className="num">{t('quoted {v}', { v: eur(rec.quotedHigh) })}</td></tr>
          </tbody></table>
          <p className="small">{t('The quoted totals differ from the sum of the quoted components (low by {dl}, high by {dh}). Flagged, not altered. The quoted 5-year total is a reference only and is never added to implementation or subscription costs.', { dl: eur(rec.differenceLow), dh: eur(rec.differenceHigh) })}</p>
          <p className="small muted">{t('Excluded by vendor: card processing & scheme fees; SWIFT, CBK and registry fees; office network and end-user IT; domains, certificates and app stores. These items are costed separately in the cost database.')}</p>
        </Card>
        <Card title={t('Cards: Visa programme (USD, informal estimate)')} sub={t('Source: private message from the Visa country contact. Not an offer or tariff. Variable fees, the acquiring platform, POS and fraud tooling are UNPRICED.')}>
          <Toggle label={t('Card programme enabled')} checked={inputs.visa.enabled} onChange={(v) => set('visa.enabled', v)} />
          <Toggle label={t('Issuing')} checked={inputs.visa.issuing} onChange={(v) => set('visa.issuing', v)} />
          <Toggle label={t('Acquiring')} checked={inputs.visa.acquiring} onChange={(v) => set('visa.acquiring', v)} />
          <div className="row">{t('Membership')} <Seg value={inputs.visa.membership} onChange={(v) => set('visa.membership', v)} options={[{ v: 'affiliate', label: t('Affiliate') }, { v: 'principal', label: t('Principal') }]} />
            {t('Range')} <Seg value={inputs.visa.rangePoint} onChange={(v) => set('visa.rangePoint', v)} options={[{ v: 'low', label: t('Low') }, { v: 'mid', label: t('Mid') }, { v: 'high', label: t('High') }]} /></div>
          <NumberField label={t('Project duration')} unit="months" value={inputs.visa.projectMonths} onChange={(v) => set('visa.projectMonths', v ?? 0)} />
          <NumberField label={t('Project start (month rel. go-live)')} value={inputs.visa.startRelMonth} onChange={(v) => set('visa.startRelMonth', v ?? 0)} />
          <Toggle label={t('Card management included in CBS/processor (avoid double count)')} checked={inputs.visa.cardManagementIncludedElsewhere} onChange={(v) => set('visa.cardManagementIncludedElsewhere', v)} />
          <NumberField label={t('Variable fee per active card / month')} unit="USD" value={inputs.visa.variableFeePerCardMonthlyUsd} onChange={(v) => set('visa.variableFeePerCardMonthlyUsd', v)} meta={t('Leave blank = unpriced (flagged)')} />
          <NumberField label={t('EUR per USD')} value={inputs.fx.eurPerUsd} onChange={(v) => set('fx.eurPerUsd', v)} meta={inputs.fx.eurPerUsd === null ? t('No rate: USD costs EXCLUDED from EUR statements') : t('Demo rate (approximate 2025–26 level); replace with a dated ECB reference rate.')} />
          <table style={{ marginTop: 8 }}><thead><tr><th>{t('First-year component')}</th><th className="num">USD</th></tr></thead>
            <tbody>{lines.map((l) => <tr key={l.id}><td>{t(VISA_LINE_LABELS[l.id] ?? l.label, { m: mem, n: l.id === 'bin' ? inputs.visa.bins : inputs.visa.projectMonths })}</td><td className="num">{usd(l.usd)}</td></tr>)}
              <tr className="total"><td>{t('Illustrative first-year total (excl. unpriced)')}</td><td className="num">{usd(illustrativeTotal(inputs.visa))}</td></tr></tbody></table>
          <p className="small muted">{t('Unpriced:')} {VISA_ESTIMATES_USD.unpriced.map((u) => t(u)).join(', ')}.</p>
          <h4>{t('Package scenario reconciliation')}</h4>
          <DataTable rows={visaRec as unknown as Record<string, unknown>[]} cols={[{ key: 'scenario', label: t('Scenario'), render: (r) => t(String(r.scenario)) },
            { key: 'computed', label: t('Computed'), render: (r) => (r.computed as number[]).map(usd).join(' – ') },
            { key: 'packageFigure', label: t('Package'), render: (r) => (r.packageFigure as readonly number[]).map(usd).join(' – ') },
            { key: 'matches', label: '', render: (r) => <VerdictChip v={r.matches ? 'PASS' : 'UNDETERMINED'} label={r.matches ? t('reconciles') : t('discrepancy')} /> },
            { key: 'note', label: t('Note'), render: (r) => (r.matches ? t('Reconciles.') : t('Package states {p} but its own components sum to {c}. Flagged, not altered.', { p: usd((r.packageFigure as number[])[1]), c: usd((r.computed as number[])[1]) })) }]} />
        </Card>
      </div>
      <ChartCard title={t('Operating cost by category')} sub={t('Annual EUR, incl. people, technology, premises, regulatory and professional services. Top four categories shown; the table has all.')} data={waterfall} xKey="year"
        series={top4.map((k) => ({ key: k, label: t(k), kind: 'bar' as const, stack: 'opex' }))} />
      <Card title={t('Cost database (one-off & recurring)')} sub={t('Base values are used unless a case or override is set. Rows tagged CBS or VISA are handled by their own modules and are never double-counted.')}>
        <div className="row" style={{ marginBottom: 8 }}>{t('Cost case')} <Seg<Case> value={inputs.costs.case} onChange={(v) => set('costs.case', v)} options={[{ v: 'low', label: t('Low') }, { v: 'base', label: t('Base') }, { v: 'high', label: t('High') }]} />
          <NumberField label={t('HQ m²')} value={inputs.costs.hqM2} onChange={(v) => set('costs.hqM2', v ?? 0)} /></div>
        <DataTable rows={DATA.costs} max={600} cols={[
          { key: 'category', label: t('Category'), render: (r) => t(r.category) }, { key: 'item', label: t('Item'), render: (r) => field(lang, r, 'item') }, { key: 'currency', label: t('Cur.') },
          { key: 'low', label: t('Low'), num: true }, { key: 'base', label: t('Base'), num: true }, { key: 'high', label: t('High'), num: true }, { key: 'basis', label: t('Basis'), render: (r) => t(r.basis) },
          { key: 'used', label: t('Used'), num: true, render: (r) => (r.engine_module === 'generic' ? (
            <input type="number" disabled={readOnly} style={{ width: 100 }} value={costValue(r as unknown as CostRow, inputs.costs.case, inputs.costs.overrides)}
              onChange={(e) => set('costs.overrides', { ...inputs.costs.overrides, [r.cost_id]: Number(e.target.value) })} />) : t(r.engine_module)) },
          { key: 'on', label: t('On'), render: (r) => (r.engine_module === 'generic' ? (
            <input type="checkbox" disabled={readOnly || r.islamic_only === 'Y'} checked={!inputs.costs.disabled.includes(r.cost_id) && (r.islamic_only !== 'Y' || inputs.islamic.enabled)}
              onChange={(e) => set('costs.disabled', e.target.checked ? inputs.costs.disabled.filter((x) => x !== r.cost_id) : [...inputs.costs.disabled, r.cost_id])} />) : '') },
          { key: 'accounting', label: t('Accounting'), render: (r) => t(r.accounting) }, { key: 'source_type', label: t('Source'), render: (r) => <SourceBadge s={r.source_type} /> }, { key: 'notes', label: t('Notes (source language)') }]} />
      </Card>
    </>
  );
}

export function Projections({ inputs, result, set }: ModProps) {
  const { t, lang } = useI18n();
  const yrs = result.years.filter((y) => y.year > 0);
  const data = yrs.map((y) => ({ year: yearLabel(lang, y.label), goods: y.goodsGross, leasing: y.leasingGross, deposits: y.deposits, orig: y.originationsGoods + y.originationsLeasing, repay: y.repayments, wo: y.writeOffs }));
  const pctList = (a: number[]) => a.map((x) => +(x * 100).toFixed(2)).join(',');
  return (
    <>
      <div className="banner"><Rich text={t('Management Y1 to Y3 figures are treated as **year-end stocks**. Originations are derived from amortisation, so they are always larger than the change in stock. Y4 to Y10 follow editable growth rates.')} /></div>
      <div className="grid-2">
        <ChartCard title={t('Financing portfolio by product')} sub={<>{t('Gross, year end')} <Explain id="grossLoans" /></>} data={data} xKey="year"
          series={[{ key: 'goods', label: t('Goods financing'), kind: 'bar', stack: 'p' }, { key: 'leasing', label: t('Leasing'), kind: 'bar', stack: 'p' }]} />
        <ChartCard title={t('Originations vs repayments')} data={data} xKey="year" series={[{ key: 'orig', label: t('New originations'), kind: 'bar' }, { key: 'repay', label: t('Scheduled repayments'), kind: 'bar' }, { key: 'wo', label: t('Write-offs') }]} />
        <ChartCard title={t('Deposits vs financing')} data={yrs.map((y) => ({ year: yearLabel(lang, y.label), loans: y.grossLoans, deposits: y.deposits }))} xKey="year"
          series={[{ key: 'loans', label: t('Gross financing') }, { key: 'deposits', label: t('Deposits') }]} />
        <Card title={t('Projection drivers')}>
          {[0, 1, 2].map((i) => (
            <NumberField key={i} label={t('Portfolio Y{n} (mgmt)', { n: i + 1 })} unit="EUR" value={inputs.management.portfolio[i]} onChange={(v) => set(`management.portfolio.${i}`, v ?? 0)} />
          ))}
          {[0, 1, 2].map((i) => (
            <NumberField key={i} label={t('Deposits Y{n} (mgmt)', { n: i + 1 })} unit="EUR" value={inputs.management.deposits[i]} onChange={(v) => set(`management.deposits.${i}`, v ?? 0)} />
          ))}
          <div className="field"><label>{t('Portfolio growth Y4–Y10 (%, comma separated)')}</label>
            <input value={pctList(inputs.growth.portfolioGrowthAfterY3)} onChange={(e) => set('growth.portfolioGrowthAfterY3', e.target.value.split(',').map((x) => Number(x) / 100))} /></div>
          <div className="field"><label>{t('Deposit growth Y4–Y10 (%)')}</label>
            <input value={pctList(inputs.growth.depositGrowthAfterY3)} onChange={(e) => set('growth.depositGrowthAfterY3', e.target.value.split(',').map((x) => Number(x) / 100))} /></div>
        </Card>
      </div>
      <div className="grid-2">
        {(['goods', 'leasing'] as const).map((p) => (
          <Card key={p} title={p === 'goods' ? t('Goods financing (Murabaha-type)') : t('Leasing (Ijarah-type)')} sub={t('Product-specific parameters; Islamic contracts are not treated as identical to conventional loans')}>
            <NumberField label={t('Yield / profit rate')} unit="pct" value={inputs.products[p].yield} onChange={(v) => set(`products.${p}.yield`, v ?? 0)} />
            <NumberField label={t('Tenor (months)')} value={inputs.products[p].tenorMonths} onChange={(v) => set(`products.${p}.tenorMonths`, Math.max(1, v ?? 1))} />
            <NumberField label={t('Origination fee')} unit="pct" value={inputs.products[p].originationFeePct} onChange={(v) => set(`products.${p}.originationFeePct`, v ?? 0)} />
            <NumberField label={t('Stage 2 share')} unit="pct" value={inputs.products[p].stage2Share} onChange={(v) => set(`products.${p}.stage2Share`, v ?? 0)} />
            <NumberField label={t('Steady-state NPL (stage 3)')} unit="pct" value={inputs.products[p].stage3ShareSteady} onChange={(v) => set(`products.${p}.stage3ShareSteady`, v ?? 0)} />
            <NumberField label={t('Stage 3 coverage')} unit="pct" value={inputs.products[p].coverageStage3} onChange={(v) => set(`products.${p}.coverageStage3`, v ?? 0)}
              meta={t('Stage 1 {c1}, stage 2 {c2}', { c1: pct(inputs.products[p].coverageStage1), c2: pct(inputs.products[p].coverageStage2) })} />
            <NumberField label={t('Write-off rate of NPL stock p.a.')} unit="pct" value={inputs.products[p].writeOffRateAnnual} onChange={(v) => set(`products.${p}.writeOffRateAnnual`, v ?? 0)} />
          </Card>
        ))}
      </div>
      <div className="grid-2">
        <Card title={t('Deposits')}>
          {(['current', 'savings', 'term'] as const).map((k) => (
            <NumberField key={k} label={t(k === 'current' ? 'Current accounts: share' : k === 'savings' ? 'Savings: share' : 'Term deposits: share')} unit="pct" value={inputs.deposits.mix[k]} onChange={(v) => set(`deposits.mix.${k}`, v ?? 0)}
              meta={<span>{t('rate')}: <input type="number" step="0.1" style={{ width: 80 }} value={+(inputs.deposits.rates[k] * 100).toFixed(4)} onChange={(e) => set(`deposits.rates.${k}`, Number(e.target.value) / 100)} /> % · {t('sector effective deposit rate 3.1% (CBK, Sep-2025)')}</span>} />
          ))}
          {Math.abs(inputs.deposits.mix.current + inputs.deposits.mix.savings + inputs.deposits.mix.term - 1) > 1e-6 && <p className="neg small">{t('The deposit mix must sum to 100%.')}</p>}
        </Card>
        <Card title={t('Islamic window (unconfirmed framework)')}>
          <Toggle label={t('Islamic mode: profit-sharing investment accounts; Sharia governance costs')} checked={inputs.islamic.enabled} onChange={(v) => set('islamic.enabled', v)} />
          <NumberField label={t('Profit-sharing ratio to account holders')} unit="pct" value={inputs.islamic.profitSharingRatio} onChange={(v) => set('islamic.profitSharingRatio', v ?? 0)} />
          <p className="small muted">{t('Under profit-sharing, the return equals PSR × (financing yield − loss rate). Current accounts are modelled as Qard at the current-account rate. See the research memo in the Source library.')}</p>
        </Card>
      </div>
    </>
  );
}

type Line = { label: string; key?: keyof YearRow; f?: (y: YearRow) => number; section?: boolean; total?: boolean; neg?: boolean; trace?: string };
const PL: Line[] = [
  { label: 'Financing income', key: 'interestIncomeLoans', trace: 'interestIncomeLoans' }, { label: 'Liquidity income', key: 'interestIncomeLiquidity', trace: 'interestIncomeLiquidity' },
  { label: 'Deposit / profit-sharing expense', key: 'interestExpenseDeposits', neg: true, trace: 'interestExpenseDeposits' }, { label: 'Other funding expense', key: 'interestExpenseOther', neg: true },
  { label: 'Net financing income', key: 'nii', total: true }, { label: 'Fee & commission income', key: 'feeIncome', trace: 'feeIncome' },
  { label: 'Operating income', key: 'operatingIncome', total: true },
  { label: 'People', f: (y) => -(y.opexByCategory['People'] ?? 0) }, { label: 'Technology (incl. CBS)', f: (y) => -(y.opexByCategory['Technology'] ?? 0) },
  { label: 'Payments & cards', f: (y) => -(y.opexByCategory['Payments & cards'] ?? 0) }, { label: 'Premises', f: (y) => -(y.opexByCategory['Premises'] ?? 0) },
  { label: 'Professional services', f: (y) => -(y.opexByCategory['Professional services'] ?? 0) }, { label: 'Regulatory', f: (y) => -(y.opexByCategory['Regulatory'] ?? 0) },
  { label: 'Marketing, insurance, G&A, contingency', f: (y) => -['Marketing', 'Insurance', 'General & admin', 'Contingency'].reduce((a, k) => a + (y.opexByCategory[k] ?? 0), 0) },
  { label: 'Total operating expenses', key: 'opex', neg: true, total: true, trace: 'opex' }, { label: 'Depreciation & amortisation', key: 'depreciation', neg: true, trace: 'depreciation' },
  { label: 'Impairment (ECL)', key: 'provisionExpense', neg: true, trace: 'provisionExpense' }, { label: 'Profit before tax', key: 'pbt', total: true },
  { label: 'Corporate income tax', key: 'taxExpense', neg: true, trace: 'taxExpense' }, { label: 'Net income', key: 'netIncome', total: true },
];
const BS: Line[] = [
  { label: 'Assets', section: true }, { label: 'Cash, CBK balances & T-bills', key: 'cashTotal', trace: 'cashTotal' }, { label: '  of which required reserve', key: 'requiredReserve' },
  { label: '  of which T-bills', key: 'tbills' }, { label: 'Gross financing', key: 'grossLoans', trace: 'grossLoans' }, { label: 'Loss allowance', key: 'allowance', neg: true, trace: 'allowance' },
  { label: 'Net financing', key: 'netLoans' }, { label: 'Fixed assets', key: 'fixedAssetsNet' }, { label: 'Intangibles', key: 'intangiblesNet' }, { label: 'Prepayments', key: 'prepaid' },
  { label: 'Total assets', key: 'totalAssets', total: true }, { label: 'Liabilities', section: true }, { label: 'Customer deposits', key: 'deposits' },
  { label: 'Wholesale funding', key: 'borrowings' }, { label: 'Legacy borrowings (transfer)', key: 'legacyBorrowings' }, { label: 'Subordinated debt', key: 'subordinatedDebt' },
  { label: 'Deferred fee income', key: 'deferredFees' }, { label: 'Tax payable', key: 'taxPayable' }, { label: 'Total liabilities', key: 'totalLiabilities', total: true },
  { label: 'Equity', section: true }, { label: 'Share capital', key: 'shareCapital' }, { label: 'Retained earnings', key: 'retainedEarnings' },
  { label: 'Total equity', key: 'equity', total: true, trace: 'equity' }, { label: 'Check: assets − liabilities − equity', key: 'balanceDifference' },
];
const CF: Line[] = [
  { label: 'Operating (incl. financing & deposits)', key: 'cfOperating' }, { label: 'Investing (capex, capitalised IT)', key: 'cfInvesting' },
  { label: 'Financing (capital, sub-debt, wholesale)', key: 'cfFinancing' }, { label: 'Net change in cash', f: (y) => y.cfOperating + y.cfInvesting + y.cfFinancing, total: true },
  { label: 'Closing cash', key: 'cashTotal', total: true },
];
const KPI: Line[] = [
  { label: 'NIM', f: (y) => y.nim ?? NaN }, { label: 'Cost-to-income', f: (y) => y.costToIncome ?? NaN }, { label: 'ROA', f: (y) => y.roa ?? NaN }, { label: 'ROE', f: (y) => y.roe ?? NaN },
  { label: 'Loan-to-deposit', f: (y) => y.loanToDeposit ?? NaN }, { label: 'CAR (year end)', f: (y) => y.car ?? NaN, trace: 'car' }, { label: 'Liquidity ratio (year end)', f: (y) => y.liquidityRatio ?? NaN, trace: 'liquidityRatio' },
];
export const STATEMENT_LINES = [...PL, ...BS, ...CF, ...KPI].map((l) => l.label.trim());

function Statement({ title, lines, years, ratio }: { title: string; lines: Line[]; years: YearRow[]; ratio?: boolean }) {
  const { t, lang } = useI18n();
  return (
    <Card title={title}>
      <div className="table-wrap">
        <table>
          <thead><tr><th>EUR</th>{years.map((y) => <th key={y.year} className="num">{yearLabel(lang, y.label)}</th>)}</tr></thead>
          <tbody>{lines.map((l) => (
            <tr key={l.label} className={l.section ? 'section' : l.total ? 'total' : ''}>
              <td>{l.label.startsWith('  ') ? '  ' : ''}{t(l.label.trim())} {l.trace && <Explain id={l.trace} />}</td>
              {!l.section && years.map((y) => {
                const raw = l.f ? l.f(y) : (y[l.key!] as number);
                const signed = l.neg ? -raw : raw;
                const v = Math.abs(signed) < 0.5 && !ratio ? 0 : signed;
                return <td key={y.year} className={`num ${v < -0.5 ? 'neg' : ''}`}>{ratio ? pct(v) : num(v)}</td>;
              })}
              {l.section && <td colSpan={years.length} />}
            </tr>
          ))}</tbody>
        </table>
      </div>
    </Card>
  );
}

export function Statements({ result }: ModProps) {
  const { t, lang } = useI18n();
  const [view, setView] = useState<'annual' | 'monthly'>('annual');
  const [year, setYear] = useState(1);
  const monthlyAsYears = result.months.filter((m) => m.opYear === year).map((m) => ({ ...m, year: m.rel, label: m.rel < 0 ? `M${m.rel}` : `M${(m.rel % 12) + 1}`,
    roa: null, roe: null, nim: null, costToIncome: null, loanToDeposit: null, costPerAccount: null, techSpendPerAccount: null, months: 1 })) as unknown as YearRow[];
  const years = view === 'annual' ? result.years : monthlyAsYears;
  return (
    <>
      <div className="row">
        <Seg value={view} onChange={setView} options={[{ v: 'annual', label: t('Annual (10 years + pre-op)') }, { v: 'monthly', label: t('Monthly') }]} />
        {view === 'monthly' && <select value={year} onChange={(e) => setYear(Number(e.target.value))}>{result.years.map((y) => <option key={y.year} value={y.year}>{yearLabel(lang, y.label)}</option>)}</select>}
        <span className="small muted">{t('Illustrative: built on editable assumptions, with no audited opening balance sheet. Pre-op is the licensing and implementation period.')}</span>
      </div>
      <Statement title={t('Income statement')} lines={PL} years={years} />
      <Statement title={t('Balance sheet (period end)')} lines={BS} years={years} />
      <Statement title={t('Cash flow')} lines={CF} years={years} />
      {view === 'annual' && <Statement title={t('Key ratios')} lines={KPI} years={years.filter((y) => y.year > 0)} ratio />}
    </>
  );
}

export function Liquidity({ inputs, result: r, set }: ModProps) {
  const { t } = useI18n();
  const msg = useMessages();
  const data = r.months.filter((m) => m.rel % 3 === 2 || m.rel === -1).map((m) => ({ month: m.rel < 0 ? t('Go-live') : t('Y{y} M{m}', { y: m.opYear, m: (m.rel % 12) + 1 }), cash: m.cashTotal, reserve: m.requiredReserve, wholesale: m.borrowings, ratio: m.liquidityRatio }));
  const maxB = Math.max(...r.months.map((m) => m.borrowings));
  return (
    <>
      <div className="grid">
        <Card title={t('Funding status')}><VerdictChip v={r.statuses.funding.status} /><p className="small">{msg.status(r.statuses.funding)}</p></Card>
        <Card title={t('Liquidity status')}><VerdictChip v={r.statuses.liquidity.status} /><p className="small">{msg.status(r.statuses.liquidity)}</p></Card>
        <Kpi label={t('Peak cash requirement')} value={eurM(r.capitalAnalysis.cashShortfall)} tone={r.capitalAnalysis.cashShortfall > 0 ? 'neg' : undefined} note={t('lowest cash in month {m}', { m: r.capitalAnalysis.minCashRelMonth })} />
        <Kpi label={t('Peak wholesale funding')} value={eurM(maxB)} note={inputs.wholesale.enabled ? t('assumed facility') : t('facility disabled')} />
      </div>
      <ChartCard title={t('Cash vs required reserve')} sub={t('A negative cash line means the plan is unfunded. No hidden plug is used.')} data={data} xKey="month" series={[{ key: 'cash', label: t('Cash & liquid assets') }, { key: 'reserve', label: t('Required reserve') }, { key: 'wholesale', label: t('Wholesale funding') }]} />
      <ChartCard title={t('Liquidity ratio')} sub={t('Liquid assets ÷ deposits. The dashed line is the reported 25% minimum, unverified.')} data={data.filter((d) => d.ratio !== null)} xKey="month" format={(v) => pct(v)} series={[{ key: 'ratio', label: t('Liquidity ratio') }]}
        refLines={[{ y: inputs.regulatory.rules.find((x) => x.id === 'R-LIQ')?.value ?? 0.25, label: t('min (unverified)') }]} />
      <div className="grid-2">
        <Card title={t('Funding options')}>
          <Toggle label={t('Enable wholesale / IFI credit line')} checked={inputs.wholesale.enabled} onChange={(v) => set('wholesale.enabled', v)} meta={t('Drawn automatically to keep liquidity at the minimum ratio plus a buffer. It is an assumption, not a commitment.')} />
          <NumberField label={t('Wholesale rate')} unit="pct" value={inputs.wholesale.rate} onChange={(v) => set('wholesale.rate', v ?? 0)} />
          <NumberField label={t('Facility limit')} unit="EUR" value={inputs.wholesale.maxAmount} onChange={(v) => set('wholesale.maxAmount', v ?? 0)} />
          <NumberField label={t('Buffer above minimum ratio')} unit="pct" value={inputs.wholesale.targetLiquidRatioBuffer} onChange={(v) => set('wholesale.targetLiquidRatioBuffer', v ?? 0)} />
        </Card>
        <Card title={t('Liquidity parameters')}>
          <NumberField label={t('Reserve requirement')} unit="pct" value={inputs.liquidity.reserveRequirement} onChange={(v) => set('liquidity.reserveRequirement', v ?? 0)} meta={t('10% per 2012 CBK regulation – verify')} />
          <Toggle label={t('Reserve counts as liquid asset')} checked={inputs.liquidity.reserveCountsAsLiquid} onChange={(v) => set('liquidity.reserveCountsAsLiquid', v)} />
          <NumberField label={t('Share of excess liquidity in T-bills')} unit="pct" value={inputs.liquidity.tbillShareOfExcess} onChange={(v) => set('liquidity.tbillShareOfExcess', v ?? 0)} />
          <NumberField label={t('T-bill yield')} unit="pct" value={inputs.liquidity.tbillYield} onChange={(v) => set('liquidity.tbillYield', v ?? 0)} />
          <NumberField label={t('Minimum operating cash')} unit="EUR" value={inputs.liquidity.minOperatingCash} onChange={(v) => set('liquidity.minOperatingCash', v ?? 0)} />
        </Card>
      </div>
    </>
  );
}
