export interface CnoocMappedField {
  fieldName: string;
  rawValue: number;
  unit: string;
}

interface YearFinancialRaw {
  netProfitReported: number;
  fxAndInvestment: number;
  impairmentLoss: number;
  incomeTaxExpense: number;
  minorityInterestImpact: number;
  periodExpenseGap: number;
}

const cnoocYearFinancialRaw: Record<number, YearFinancialRaw> = {
  2021: {
    netProfitReported: 703.2,
    fxAndInvestment: 23.4,
    impairmentLoss: -18.2,
    incomeTaxExpense: 154.6,
    minorityInterestImpact: 46.1,
    periodExpenseGap: -12.7,
  },
  2022: {
    netProfitReported: 1417.0,
    fxAndInvestment: 35.8,
    impairmentLoss: -24.5,
    incomeTaxExpense: 312.4,
    minorityInterestImpact: 61.3,
    periodExpenseGap: -16.9,
  },
  2023: {
    netProfitReported: 1238.4,
    fxAndInvestment: 18.6,
    impairmentLoss: -21.1,
    incomeTaxExpense: 281.8,
    minorityInterestImpact: 57.9,
    periodExpenseGap: -10.8,
  },
};

export function getCnoocMappedFields(year: number): CnoocMappedField[] {
  const raw =
    cnoocYearFinancialRaw[year] ??
    cnoocYearFinancialRaw[
      Math.max(...Object.keys(cnoocYearFinancialRaw).map(Number))
    ];

  return [
    { fieldName: "归母净利润(年报)", rawValue: raw.netProfitReported, unit: "亿元" },
    { fieldName: "汇兑及投资收益净额", rawValue: raw.fxAndInvestment, unit: "亿元" },
    { fieldName: "资产减值损失", rawValue: raw.impairmentLoss, unit: "亿元" },
    { fieldName: "所得税费用", rawValue: raw.incomeTaxExpense, unit: "亿元" },
    { fieldName: "少数股东损益", rawValue: raw.minorityInterestImpact, unit: "亿元" },
    { fieldName: "期间费用口径差", rawValue: raw.periodExpenseGap, unit: "亿元" },
  ];
}
