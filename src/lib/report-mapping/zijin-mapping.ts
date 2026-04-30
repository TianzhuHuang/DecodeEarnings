export interface ZijinMappedField {
  fieldName: string;
  rawValue: number;
  unit: string;
}

interface YearFinancialRaw {
  netProfitReported: number;
  fairValueAndHedge: number;
  impairmentLoss: number;
  incomeTaxExpense: number;
  minorityInterestImpact: number;
  nonGoldCopperContributionGap: number;
}

// 打样数据：字段口径按“年报利润表+附注”抽取后的结构化结果。
// 后续替换为 PDF/公告解析结果即可，无需改归因展示层。
const zijinYearFinancialRaw: Record<number, YearFinancialRaw> = {
  2021: {
    netProfitReported: 156.7,
    fairValueAndHedge: -8.6,
    impairmentLoss: -3.1,
    incomeTaxExpense: 12.4,
    minorityInterestImpact: 5.3,
    nonGoldCopperContributionGap: 4.0,
  },
  2022: {
    netProfitReported: 200.4,
    fairValueAndHedge: -6.9,
    impairmentLoss: -4.2,
    incomeTaxExpense: 15.6,
    minorityInterestImpact: 6.1,
    nonGoldCopperContributionGap: 3.8,
  },
  2023: {
    netProfitReported: 211.2,
    fairValueAndHedge: -7.4,
    impairmentLoss: -5.8,
    incomeTaxExpense: 16.8,
    minorityInterestImpact: 5.9,
    nonGoldCopperContributionGap: 2.7,
  },
};

export function getZijinMappedFields(year: number): ZijinMappedField[] {
  const raw =
    zijinYearFinancialRaw[year] ??
    zijinYearFinancialRaw[
      Math.max(...Object.keys(zijinYearFinancialRaw).map(Number))
    ];

  return [
    { fieldName: "归母净利润(年报)", rawValue: raw.netProfitReported, unit: "亿元" },
    {
      fieldName: "公允价值及套保损益",
      rawValue: raw.fairValueAndHedge,
      unit: "亿元",
    },
    { fieldName: "资产减值损失", rawValue: raw.impairmentLoss, unit: "亿元" },
    { fieldName: "所得税费用", rawValue: raw.incomeTaxExpense, unit: "亿元" },
    { fieldName: "少数股东损益影响", rawValue: raw.minorityInterestImpact, unit: "亿元" },
    {
      fieldName: "非金铜业务贡献偏差",
      rawValue: raw.nonGoldCopperContributionGap,
      unit: "亿元",
    },
  ];
}
