export interface ChinaGoldInternationalYearData {
  year: number;
  periodKey: string;
  periodLabel: string;
  // 统一到页面口径：亿元人民币
  netProfitReported: number;
  // 产量口径：矿山合计产量（吨/万吨）
  goldOutputTon: number;
  copperOutput10kTon: number;
  // 价格口径：以公开披露美元实现价换算到人民币口径用于模型输入
  goldPriceCnyPerGram: number;
  copperPriceCnyPerTon: number;
  // 营业口径综合成本率（由 revenue 与 income from operations 推导）
  integratedCostRate: number;
  reportUrl: string;
  sourceNote: string;
}

// 数据来源：
// - 2024: 2024 年度 MD&A（2025-03-27 发布）
// - 2023/2022: 2023 年度 MD&A（2024-03-28 发布）
// 说明：
// 1) 净利润原始口径为 US$ million，已按年均汇率近似换算为“亿元人民币”用于页面展示。
// 2) 黄金价格由 US$/oz 折算为 元/克；铜价格由 US$/lb 折算为 元/吨。
// 3) 成本率采用 (1 - income_from_operations / revenue) 的营业口径代理值。
export const chinaGoldInternationalYearData: Record<number, ChinaGoldInternationalYearData> = {
  2022: {
    year: 2022,
    periodKey: "2022",
    periodLabel: "2022",
    netProfitReported: 15.8,
    goldOutputTon: 7.43,
    copperOutput10kTon: 8.5,
    goldPriceCnyPerGram: 389,
    copperPriceCnyPerTon: 48900,
    integratedCostRate: 71.3,
    reportUrl:
      "https://www.chinagoldintl.com/_resources/financials/2024/E-China-Gold-HK-Report-Q4-23.pdf?v=050108",
    sourceNote:
      "2022 年数据由 2023 年度 MD&A 对比栏提取；汇率换算采用约 6.70。",
  },
  2023: {
    year: 2023,
    periodKey: "2023",
    periodLabel: "2023",
    netProfitReported: -1.6,
    goldOutputTon: 4.6,
    copperOutput10kTon: 2.01,
    goldPriceCnyPerGram: 445,
    copperPriceCnyPerTon: 49300,
    integratedCostRate: 93,
    reportUrl:
      "https://www.chinagoldintl.com/_resources/financials/2024/E-China-Gold-HK-Report-Q4-23.pdf?v=050108",
    sourceNote:
      "2023 年受甲玛矿复产影响，净利润为负；汇率换算采用约 7.05。",
  },
  2024: {
    year: 2024,
    periodKey: "2024",
    periodLabel: "2024",
    netProfitReported: 4.7,
    goldOutputTon: 5.06,
    copperOutput10kTon: 4.79,
    goldPriceCnyPerGram: 562,
    copperPriceCnyPerTon: 42550,
    integratedCostRate: 83.8,
    reportUrl:
      "https://www.chinagoldintl.com/_resources/financials/2025/E-China-Gold-HK-Report-Q4-24.pdf?v=082105",
    sourceNote:
      "2024 年为恢复生产后的首个完整年度；汇率换算采用约 7.12。",
  },
};

export function getChinaGoldInternationalHistory() {
  return Object.values(chinaGoldInternationalYearData).sort((a, b) => a.year - b.year);
}
