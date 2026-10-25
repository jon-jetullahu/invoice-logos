import { describe, expect, it } from 'vitest';
import { SQ } from '../src/app/sq';
import { translate, translateCode, yearLabel, field } from '../src/app/i18n';
import { eur, eurM, pct, setNumberLocale } from '../src/app/format';
import { allKeys } from './i18nKeys';

const placeholders = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort();

describe('Albanian translation coverage', () => {
  const keys = allKeys();
  it('every UI string, engine label and status code has an Albanian translation', () => {
    const missing = keys.filter((k) => !SQ[k]?.trim());
    expect(missing, `missing Albanian for:\n${missing.join('\n')}`).toEqual([]);
  });
  it('translations keep the same {placeholders} and **bold** / `code` markup', () => {
    const bad = Object.entries(SQ).filter(([k, v]) =>
      placeholders(k).join() !== placeholders(v).join() || k.split('**').length !== v.split('**').length || k.split('`').length !== v.split('`').length);
    expect(bad).toEqual([]);
  });
  it('covers a substantial vocabulary', () => expect(keys.length).toBeGreaterThan(900));
});

describe('i18n behaviour', () => {
  it('interpolates parameters and falls back to English', () => {
    expect(translate('sq', 'month {m}', { m: 7 })).toBe('muaji 7');
    expect(translate('en', 'month {m}', { m: 7 })).toBe('month 7');
    expect(translate('sq', 'A string nobody translated')).toBe('A string nobody translated');
  });
  it('translates codes and year labels', () => {
    expect(translateCode('sq', 'UNDETERMINED')).toBe('E PAPËRCAKTUAR');
    expect(translateCode('en', 'FUNDED_WITH_WHOLESALE')).toBe('FUNDED WITH WHOLESALE');
    expect(yearLabel('sq', 'Pre-op')).toBe('Para nisjes');
    expect(yearLabel('sq', 'Y10')).toBe('V10');
    expect(yearLabel('en', 'Y10')).toBe('Y10');
  });
  it('uses Albanian research columns when available', () => {
    const row = { role: 'Teller / cashier', role_sq: 'Arkëtar' };
    expect(field('sq', row, 'role')).toBe('Arkëtar');
    expect(field('en', row, 'role')).toBe('Teller / cashier');
  });
  it('formats numbers per locale', () => {
    setNumberLocale('sq');
    expect(eurM(9_910_162)).toBe('9,91 mln €');
    expect(pct(0.123)).toBe('12,3%');
    expect(eur(1234567)).toBe('1\u00a0234\u00a0567 €');
    expect(eur(-9910162)).toBe('-9\u00a0910\u00a0162 €');
    setNumberLocale('en');
    expect(eurM(9_910_162)).toBe('€9.91m');
    expect(eur(1234567)).toBe('€1,234,567');
  });
});
