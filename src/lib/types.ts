export type CompanyId = "cnooc" | "zijin" | "moutai";
export type Scenario = "bear" | "base" | "bull";

export interface SimpleFormula {
  revenue: string;
  cost: string;
  netProfit: string;
  attributableProfit: string;
}

export interface ResultBreakdown {
  revenue: number;
  cost: number;
  netProfit: number;
  attributableProfit: number;
}

export interface VariableMeta {
  key: string;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  tooltip: string;
  fiveYearAvg: number;
  fiveYearRange: [number, number];
  isCore?: boolean;
}

export interface YearMetric {
  periodKey: string;
  periodLabel: string;
  year: number;
  actualProfit: number;
  modelProfit: number;
  inputs: Record<string, number>;
  factInputs?: Record<string, number>;
  calibratedInputs?: Record<string, number>;
  forecastEditable?: boolean;
}

export interface TableEditValueMap {
  [periodKey: string]: Record<string, number | undefined>;
}

export type FactInputs = Record<string, number>;

export type CalibratedParams = Record<string, number>;

export interface PeriodData {
  facts: FactInputs;
  calibrated: CalibratedParams;
  forecastEditable: boolean;
}

export interface CompanyModel {
  id: CompanyId;
  name: string;
  ticker: string;
  formulaLatex: string;
  simpleFormula?: SimpleFormula;
  coreVariableKeys?: string[];
  defaultBaseYear?: number;
  variables: VariableMeta[];
  scenarios: Record<Scenario, Record<string, number>>;
  history: YearMetric[];
}

export interface AttributionItem {
  id: string;
  title: string;
  impact: number;
  evidence: {
    fieldName: string;
    rawValue: string;
    formula: string;
    sourceUrl: string;
  };
}

export interface AttributionReport {
  companyId: CompanyId;
  year: number;
  source: string;
  summary: string;
  items: AttributionItem[];
}
