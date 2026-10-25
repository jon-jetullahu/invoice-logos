// Research datasets (generated from research/*.csv by scripts/build-data.mjs).
import institutions from '../data/generated/institutions.json';
import documents from '../data/generated/document_registry.json';
import coverage from '../data/generated/coverage_matrix.json';
import historical from '../data/generated/historical_financials.json';
import sector from '../data/generated/sector_indicators.json';
import legal from '../data/generated/cbk_legal_sources.json';
import requirements from '../data/generated/cbk_requirements.json';
import roles from '../data/generated/hr_roles.json';
import salaryEvidence from '../data/generated/kosovo_bank_salary_evidence.json';
import costs from '../data/generated/cost_database.json';
import memos from '../data/generated/memos.json';
import datasetIndex from '../data/generated/index.json';
import retrieval from '../data/generated/retrieval_log.json';
import quality from '../data/generated/quality_checks.json';
import assumptionRegister from '../data/generated/assumption_register.json';
import type { ModelInputs, ModelResult } from '../engine';

type Rows = Record<string, string>[];
export const DATA = {
  institutions: institutions as Rows, documents: documents as Rows, coverage: coverage as Rows, historical: historical as Rows,
  sector: sector as Rows, legal: legal as Rows, requirements: requirements as Rows, roles: roles as Rows,
  salaryEvidence: salaryEvidence as Rows, costs: costs as Rows, retrieval: retrieval as Rows, quality: quality as Rows,
  assumptionRegister: assumptionRegister as Rows,
  memos: memos as { file: string; title: string; markdown: string; lang: 'en' | 'sq' }[],
  datasetIndex: datasetIndex as { dataset: string; path: string; rows: number; bytes: number; sha256: string }[],
};

export interface ModProps {
  inputs: ModelInputs;
  result: ModelResult;
  set: (path: string, v: unknown) => void;
  setInputs: (x: ModelInputs) => void;
  readOnly: boolean;
}
