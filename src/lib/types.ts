export type CompanyId = "cnooc" | "zijin" | "moutai";
export type Scenario = "bear" | "base" | "bull";

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
}

export interface YearMetric {
  periodKey: string;
  periodLabel: string;
  year: number;
  actualProfit: number;
  modelProfit: number;
  inputs: Record<string, number>;
}

export interface CompanyModel {
  id: CompanyId;
  name: string;
  ticker: string;
  formulaLatex: string;
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
