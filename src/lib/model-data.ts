import { CompanyId, CompanyModel } from "./types";
import { zijinCanonicalYearData } from "./report-mapping/zijin-mapping";
import { solveZijinParamsForYear } from "./calculators";

const years = [2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023];
const zijinHistoryYears = [...years, 2024, 2025];

export const companies: CompanyModel[] = [
  {
    id: "zijin",
    name: "紫金矿业",
    ticker: "601899.SH",
    formulaLatex:
      "\\text{归母净利润} = \\frac{G\\times10^6\\times P_g\\times K_g}{10^8}+\\frac{C\\times10^4\\times P_c\\times K_c}{10^8}+O",
    simpleFormula: {
      revenue:
        "\\text{营业收入}=\\frac{G\\times10^6\\times P_g + C\\times10^4\\times P_c + L\\times10^4\\times P_l}{10^8}",
      cost:
        "\\text{营业成本}=\\text{营业收入}\\times\\text{综合成本系数}",
      netProfit:
        "\\text{净利润}=\\text{营业收入}-\\text{营业成本}",
      attributableProfit:
        "\\text{归母净利润}=\\text{净利润}+\\text{其他贡献}+\\text{贵金属副产贡献}",
    },
    coreVariableKeys: [
      "goldOutputTon",
      "goldPrice",
      "copperOutput10kTon",
      "copperPrice",
      "lithiumOutput10kTon",
      "lithiumPrice",
    ],
    defaultBaseYear: 2025,
    variables: [
      { key: "goldOutputTon", label: "金产量", unit: "吨", min: 30, max: 120, step: 0.1, tooltip: "矿产金年度产量", fiveYearAvg: 66.1, fiveYearRange: [48, 89.9], isCore: true },
      { key: "goldPrice", label: "金价", unit: "元/克", min: 220, max: 1300, step: 1, tooltip: "黄金年均实现价格（元/克）", fiveYearAvg: 510, fiveYearRange: [373, 778], isCore: true },
      { key: "copperOutput10kTon", label: "铜产量", unit: "万吨", min: 35, max: 140, step: 1, tooltip: "矿产铜年度产量", fiveYearAvg: 93.2, fiveYearRange: [58, 109], isCore: true },
      { key: "copperPrice", label: "铜价", unit: "元/吨", min: 38000, max: 140000, step: 100, tooltip: "铜实现价（元/吨），约等于 LME 铜价 × 88%（铜精矿折扣）", fiveYearAvg: 68400, fiveYearRange: [62000, 81500], isCore: true },
      { key: "lithiumOutput10kTon", label: "碳酸锂产量", unit: "万吨", min: 0, max: 15, step: 0.1, tooltip: "碳酸锂年度产量（万吨）", fiveYearAvg: 0.86, fiveYearRange: [0, 4.0], isCore: true },
      { key: "lithiumPrice", label: "碳酸锂价格", unit: "元/吨", min: 0, max: 600000, step: 1000, tooltip: "碳酸锂年均价格（元/吨）", fiveYearAvg: 113200, fiveYearRange: [0, 260000], isCore: true },
      { key: "kg", label: "K_G", unit: "", min: 0.08, max: 0.3, step: 0.005, tooltip: "金业务有效利润系数。定义：K = 毛利率 × (1 - 期间费用率) × 归母比例，表示每1元金业务收入最终转化为多少归母净利润。", fiveYearAvg: 0.182, fiveYearRange: [0.15, 0.22], isCore: false },
      { key: "kc", label: "K_C", unit: "", min: 0.07, max: 0.24, step: 0.005, tooltip: "铜业务有效利润系数。定义：K = 毛利率 × (1 - 期间费用率) × 归母比例，表示每1元铜业务收入最终转化为多少归母净利润。", fiveYearAvg: 0.142, fiveYearRange: [0.11, 0.18], isCore: false },
      { key: "kl", label: "K_L", unit: "", min: 0.05, max: 0.3, step: 0.005, tooltip: "锂业务有效利润系数", fiveYearAvg: 0.11, fiveYearRange: [0.08, 0.17], isCore: false },
      { key: "otherContribution", label: "其他贡献", unit: "亿元", min: 10, max: 140, step: 1, tooltip: "锌银钼铁等非金铜贡献", fiveYearAvg: 32, fiveYearRange: [18, 80], isCore: false },
      { key: "preciousMetalsContribution", label: "贵金属副产贡献", unit: "亿元", min: 0, max: 140, step: 1, tooltip: "银、铂族金属及副产综合贡献（用于修正模型低估）", fiveYearAvg: 12, fiveYearRange: [4, 90], isCore: false },
    ],
    scenarios: {
      bear: { goldOutputTon: 68, goldPrice: 430, kg: 0.165, copperOutput10kTon: 92, copperPrice: 65000, kc: 0.13, otherContribution: 28, preciousMetalsContribution: 8 },
      base: { goldOutputTon: 74, goldPrice: 485, kg: 0.182, copperOutput10kTon: 108, copperPrice: 72400, kc: 0.145, otherContribution: 35, preciousMetalsContribution: 12 },
      bull: { goldOutputTon: 79, goldPrice: 530, kg: 0.2, copperOutput10kTon: 118, copperPrice: 81000, kc: 0.162, otherContribution: 48, preciousMetalsContribution: 18 },
    },
    history: zijinHistoryYears.map((year) => {
      const row = zijinCanonicalYearData[year];
      const facts: Record<string, number> = {
        goldOutputTon: row.goldOutputTon,
        goldPrice: row.goldPrice,
        copperOutput10kTon: row.copperOutput10kTon,
        copperPrice: row.copperPrice,
        lithiumOutput10kTon: row.lithiumOutput10kTon,
        lithiumPrice: row.lithiumPrice,
      };
      const calibrated = solveZijinParamsForYear(year, facts, row.netProfitReported);
      return {
        periodKey: `${year}`,
        periodLabel: `${year}`,
        year,
        actualProfit: row.netProfitReported,
        modelProfit: row.netProfitReported,
        // 历史期输入固定为事实层，不混入可调参数。
        inputs: facts,
        factInputs: facts,
        calibratedInputs: calibrated,
        forecastEditable: false,
      };
    }).concat([
      {
        periodKey: "2026Q1",
        periodLabel: "2026Q1",
        year: 2026,
        actualProfit: zijinCanonicalYearData[2026].netProfitReported,
        modelProfit: zijinCanonicalYearData[2026].netProfitReported,
        inputs: {
          goldOutputTon: zijinCanonicalYearData[2026].goldOutputTon,
          goldPrice: zijinCanonicalYearData[2026].goldPrice,
          copperOutput10kTon: zijinCanonicalYearData[2026].copperOutput10kTon,
          copperPrice: zijinCanonicalYearData[2026].copperPrice,
          lithiumOutput10kTon: zijinCanonicalYearData[2026].lithiumOutput10kTon,
          lithiumPrice: zijinCanonicalYearData[2026].lithiumPrice,
        },
        factInputs: {
          goldOutputTon: zijinCanonicalYearData[2026].goldOutputTon,
          goldPrice: zijinCanonicalYearData[2026].goldPrice,
          copperOutput10kTon: zijinCanonicalYearData[2026].copperOutput10kTon,
          copperPrice: zijinCanonicalYearData[2026].copperPrice,
          lithiumOutput10kTon: zijinCanonicalYearData[2026].lithiumOutput10kTon,
          lithiumPrice: zijinCanonicalYearData[2026].lithiumPrice,
        },
        calibratedInputs: solveZijinParamsForYear(
          2026,
          {
            goldOutputTon: zijinCanonicalYearData[2026].goldOutputTon,
            goldPrice: zijinCanonicalYearData[2026].goldPrice,
            copperOutput10kTon: zijinCanonicalYearData[2026].copperOutput10kTon,
            copperPrice: zijinCanonicalYearData[2026].copperPrice,
            lithiumOutput10kTon: zijinCanonicalYearData[2026].lithiumOutput10kTon,
            lithiumPrice: zijinCanonicalYearData[2026].lithiumPrice,
          },
          zijinCanonicalYearData[2026].netProfitReported,
        ),
        forecastEditable: false,
      },
      {
        periodKey: "2026FY",
        periodLabel: "2026FY",
        year: 2026,
        actualProfit: 0,
        modelProfit: 0,
        // 未来预测层默认空参数，用户输入后再试算。
        inputs: {} as Record<string, number>,
        factInputs: {} as Record<string, number>,
        calibratedInputs: {
          kg: 0.23,
          kc: 0.2,
          kl: 0.14,
          otherContribution: 30,
          preciousMetalsContribution: 18,
        },
        forecastEditable: true,
      },
    ]),
  },
  {
    id: "cnooc",
    name: "中国海洋石油",
    ticker: "600938.SH",
    formulaLatex:
      "\\text{归母净利润}=\\left(R-C_o-D-E-S\\pm F-I\\right)\\times(1-T)-N",
    simpleFormula: {
      revenue:
        "\\text{营业收入}=\\frac{\\text{产量}\\times\\text{油价}\\times\\text{汇率}}{100}",
      cost:
        "\\text{营业成本}=\\frac{\\text{产量}\\times\\text{桶油成本}\\times\\text{汇率}}{100}",
      netProfit:
        "\\text{净利润}=\\text{营业收入}-\\text{营业成本}",
      attributableProfit:
        "\\text{归母净利润}=\\text{净利润}\\times(1-\\text{有效税率})-\\text{少数股东损益}",
    },
    coreVariableKeys: ["productionMboe", "brentPrice", "allInCostPerBoe"],
    defaultBaseYear: 2025,
    variables: [
      { key: "productionMboe", label: "产量", unit: "百万桶油当量", min: 520, max: 820, step: 1, tooltip: "油气净产量（百万桶油当量）", fiveYearAvg: 644, fiveYearRange: [570, 800], isCore: true },
      { key: "brentPrice", label: "年均布油", unit: "美元/桶", min: 45, max: 120, step: 0.5, tooltip: "布伦特原油年均价格", fiveYearAvg: 76, fiveYearRange: [57, 98], isCore: true },
      { key: "allInCostPerBoe", label: "桶油成本", unit: "美元/桶", min: 18, max: 45, step: 0.1, tooltip: "桶油全成本（含DD&A）", fiveYearAvg: 28, fiveYearRange: [24, 32], isCore: true },
      { key: "fxRate", label: "汇率", unit: "", min: 6.0, max: 8.2, step: 0.01, tooltip: "美元兑人民币汇率（专业参数，默认2025基准）", fiveYearAvg: 7.0, fiveYearRange: [6.4, 7.6], isCore: false },
      { key: "effectiveTaxRate", label: "所得税税率", unit: "%", min: 10, max: 45, step: 0.1, tooltip: "实际所得税税率（专业参数，默认2025基准）", fiveYearAvg: 26.5, fiveYearRange: [20.2, 33.1], isCore: false },
      { key: "revenue", label: "油气营业收入", unit: "亿元", min: 1800, max: 5200, step: 10, tooltip: "主营油气销售形成的营业收入（亿元）", fiveYearAvg: 3280, fiveYearRange: [1980, 4620], isCore: false },
      { key: "operatingCost", label: "操作成本", unit: "亿元", min: 600, max: 2200, step: 10, tooltip: "采掘、生产及作业直接成本（亿元）", fiveYearAvg: 1270, fiveYearRange: [790, 1830], isCore: false },
      { key: "dda", label: "DD&A", unit: "亿元", min: 180, max: 850, step: 5, tooltip: "折旧、折耗及摊销（亿元）", fiveYearAvg: 450, fiveYearRange: [260, 690] },
      { key: "explorationExpense", label: "勘探费", unit: "亿元", min: 40, max: 320, step: 2, tooltip: "勘探相关费用支出（亿元）", fiveYearAvg: 146, fiveYearRange: [72, 238] },
      { key: "periodExpense", label: "期间费用", unit: "亿元", min: 120, max: 620, step: 5, tooltip: "销售/管理/财务费用合计（亿元）", fiveYearAvg: 312, fiveYearRange: [188, 498] },
      { key: "fxInvestSubsidy", label: "汇兑/投资/补贴", unit: "亿元", min: -220, max: 220, step: 2, tooltip: "汇兑损益、投资收益与政府补贴等净额（亿元）", fiveYearAvg: 24, fiveYearRange: [-85, 132] },
      { key: "impairment", label: "资产减值", unit: "亿元", min: 0, max: 260, step: 2, tooltip: "资产减值及信用减值损失（亿元）", fiveYearAvg: 51, fiveYearRange: [8, 132] },
      { key: "minorityInterest", label: "少数股东损益", unit: "亿元", min: 0, max: 240, step: 2, tooltip: "归属于少数股东的损益（亿元）", fiveYearAvg: 82, fiveYearRange: [28, 166] },
    ],
    scenarios: {
      bear: { revenue: 2980, operatingCost: 1430, dda: 510, explorationExpense: 168, periodExpense: 360, fxInvestSubsidy: -40, impairment: 96, effectiveTaxRate: 28.8, minorityInterest: 96 },
      base: { revenue: 3520, operatingCost: 1310, dda: 468, explorationExpense: 148, periodExpense: 328, fxInvestSubsidy: 18, impairment: 62, effectiveTaxRate: 26.4, minorityInterest: 84 },
      bull: { revenue: 4260, operatingCost: 1250, dda: 430, explorationExpense: 130, periodExpense: 300, fxInvestSubsidy: 68, impairment: 40, effectiveTaxRate: 24.8, minorityInterest: 70 },
    },
    history: years.map((year, i) => ({
      periodKey: `${year}`,
      periodLabel: `${year}`,
      year,
      actualProfit: [602, 202, 6, 247, 526, 610, 249, 703, 1417, 1238][i],
      modelProfit: [571, 218, 22, 260, 501, 589, 231, 674, 1368, 1180][i],
      inputs: {
        revenue: 1900 + i * 280,
        productionMboe: 560 + i * 14,
        brentPrice: Number((52 + i * 3.8).toFixed(1)),
        allInCostPerBoe: Number((31 - i * 0.28).toFixed(2)),
        fxRate: Number((6.2 + i * 0.1).toFixed(2)),
        operatingCost: 760 + i * 95,
        dda: 220 + i * 42,
        explorationExpense: 70 + i * 13,
        periodExpense: 180 + i * 24,
        fxInvestSubsidy: -55 + i * 14,
        impairment: 120 - i * 8,
        effectiveTaxRate: Number((32 - i * 0.8).toFixed(1)),
        minorityInterest: 30 + i * 12,
      },
    })).concat([
      {
        periodKey: "2024",
        periodLabel: "2024",
        year: 2024,
        actualProfit: 1285.0,
        modelProfit: 1246.0,
        inputs: {
          revenue: 3660,
          productionMboe: 742,
          brentPrice: 79.4,
          allInCostPerBoe: 27.8,
          fxRate: 7.08,
          operatingCost: 1295,
          dda: 472,
          explorationExpense: 146,
          periodExpense: 322,
          fxInvestSubsidy: 24,
          impairment: 58,
          effectiveTaxRate: 26.2,
          minorityInterest: 86,
        },
      },
      {
        periodKey: "2025",
        periodLabel: "2025",
        year: 2025,
        actualProfit: 1336.0,
        modelProfit: 1298.0,
        inputs: {
          revenue: 3820,
          productionMboe: 776,
          brentPrice: 77.0,
          allInCostPerBoe: 28.0,
          fxRate: 6.95,
          operatingCost: 1320,
          dda: 479,
          explorationExpense: 150,
          periodExpense: 330,
          fxInvestSubsidy: 30,
          impairment: 60,
          effectiveTaxRate: 26.0,
          minorityInterest: 88,
        },
      },
      {
        periodKey: "2026Q1",
        periodLabel: "2026Q1",
        year: 2026,
        actualProfit: 365.0,
        modelProfit: 352.0,
        inputs: {
          revenue: 1010,
          productionMboe: 193.64,
          brentPrice: 77.0,
          allInCostPerBoe: 28.0,
          fxRate: 6.95,
          operatingCost: 338,
          dda: 122,
          explorationExpense: 38,
          periodExpense: 86,
          fxInvestSubsidy: 9,
          impairment: 18,
          effectiveTaxRate: 25.8,
          minorityInterest: 24,
        },
      },
      {
        periodKey: "2026FY",
        periodLabel: "2026FY",
        year: 2026,
        actualProfit: 0,
        modelProfit: 0,
        inputs: {
          revenue: 4020,
          productionMboe: 790,
          brentPrice: 77.5,
          allInCostPerBoe: 28.6,
          fxRate: 6.95,
          operatingCost: 1340,
          dda: 486,
          explorationExpense: 152,
          periodExpense: 338,
          fxInvestSubsidy: 36,
          impairment: 72,
          effectiveTaxRate: 25.9,
          minorityInterest: 92,
        },
      },
    ]),
  },
  {
    id: "moutai",
    name: "贵州茅台",
    ticker: "600519.SH",
    formulaLatex:
      "\\text{归母净利润}=\\left((A_1A_2B_1+A_3A_4B_2)-(A_1A_2+A_3A_4)B_3-(A_1A_2+A_3A_4)B_4+C_1\\right)(1-C_2)-C_3",
    defaultBaseYear: 2025,
    variables: [
      { key: "moutaiVolume", label: "茅台酒销量", unit: "吨", min: 26000, max: 50000, step: 100, tooltip: "高端茅台出货量", fiveYearAvg: 37000, fiveYearRange: [32000, 46800], isCore: true },
      { key: "seriesVolume", label: "系列酒销量", unit: "吨", min: 18000, max: 52000, step: 100, tooltip: "系列酒出货量", fiveYearAvg: 31600, fiveYearRange: [23000, 42000], isCore: true },
      { key: "moutaiPrice", label: "茅台酒出厂价", unit: "元/吨", min: 2000000, max: 3800000, step: 10000, tooltip: "茅台酒平均出厂价", fiveYearAvg: 2750000, fiveYearRange: [2400000, 3200000], isCore: true },
      { key: "seriesPrice", label: "系列酒出厂价", unit: "元/吨", min: 220000, max: 520000, step: 1000, tooltip: "系列酒平均出厂价", fiveYearAvg: 345000, fiveYearRange: [280000, 420000], isCore: true },
      { key: "directSalesRatio", label: "直销占比", unit: "%", min: 20, max: 80, step: 0.1, tooltip: "直销渠道收入占比（核心参数）", fiveYearAvg: 42, fiveYearRange: [28, 54.75], isCore: true },
      { key: "moutaiGrossMargin", label: "茅台酒毛利率", unit: "%", min: 88, max: 97, step: 0.1, tooltip: "茅台酒业务毛利率（B1）", fiveYearAvg: 94.1, fiveYearRange: [92.8, 95.3] },
      { key: "seriesGrossMargin", label: "系列酒毛利率", unit: "%", min: 60, max: 90, step: 0.1, tooltip: "系列酒业务毛利率（B2）", fiveYearAvg: 77.2, fiveYearRange: [70.4, 82.1] },
      { key: "taxAndSurchargeRate", label: "税金率", unit: "%", min: 8, max: 28, step: 0.1, tooltip: "税金及附加占收入比例（B3）", fiveYearAvg: 17.1, fiveYearRange: [14.5, 20.3] },
      { key: "periodExpenseRate", label: "期间费用率", unit: "%", min: 3, max: 16, step: 0.1, tooltip: "销售/管理/财务费用率（B4）", fiveYearAvg: 8.4, fiveYearRange: [6.2, 10.5] },
      { key: "otherNetIncome", label: "其他净收益", unit: "亿元", min: 0, max: 180, step: 1, tooltip: "其他净收益（C1）", fiveYearAvg: 42, fiveYearRange: [18, 88] },
      { key: "incomeTaxRate", label: "所得税率", unit: "%", min: 10, max: 35, step: 0.1, tooltip: "所得税率（C2）", fiveYearAvg: 24.5, fiveYearRange: [22.8, 26.1] },
      { key: "minorityInterest", label: "少数股东损益", unit: "亿元", min: 0, max: 80, step: 0.5, tooltip: "少数股东损益（C3）", fiveYearAvg: 8.2, fiveYearRange: [3.2, 15.6] },
    ],
    scenarios: {
      bear: { moutaiVolume: 36000, seriesVolume: 31000, moutaiPrice: 2650000, seriesPrice: 325000, moutaiGrossMargin: 93.2, seriesGrossMargin: 73.5, taxAndSurchargeRate: 18.8, periodExpenseRate: 9.6, otherNetIncome: 36, incomeTaxRate: 25.7, minorityInterest: 10.5 },
      base: { moutaiVolume: 40500, seriesVolume: 36500, moutaiPrice: 2920000, seriesPrice: 356000, moutaiGrossMargin: 94.2, seriesGrossMargin: 77.8, taxAndSurchargeRate: 17.3, periodExpenseRate: 8.5, otherNetIncome: 52, incomeTaxRate: 24.6, minorityInterest: 8.1 },
      bull: { moutaiVolume: 43000, seriesVolume: 41000, moutaiPrice: 3150000, seriesPrice: 395000, moutaiGrossMargin: 94.8, seriesGrossMargin: 80.2, taxAndSurchargeRate: 16.8, periodExpenseRate: 7.8, otherNetIncome: 66, incomeTaxRate: 23.9, minorityInterest: 6.8 },
    },
    history: years.map((year, i) => ({
      periodKey: `${year}`,
      periodLabel: `${year}`,
      year,
      actualProfit: [153, 167, 179, 270, 352, 412, 467, 524, 627, 747][i],
      modelProfit: [149, 162, 184, 262, 341, 407, 452, 513, 612, 731][i],
      inputs: {
        moutaiVolume: 29000 + i * 1400,
        seriesVolume: 19000 + i * 1700,
        moutaiPrice: 2200000 + i * 78000,
        seriesPrice: 240000 + i * 11000,
        directSalesRatio: 28 + i * 2.2,
        moutaiGrossMargin: 92.1 + i * 0.2,
        seriesGrossMargin: 70 + i * 0.8,
        taxAndSurchargeRate: 20.6 - i * 0.3,
        periodExpenseRate: 10.6 - i * 0.22,
        otherNetIncome: 12 + i * 4,
        incomeTaxRate: 26.8 - i * 0.23,
        minorityInterest: 4 + i * 0.6,
      },
    })).concat([
      {
        periodKey: "2024",
        periodLabel: "2024",
        year: 2024,
        actualProfit: 812.0,
        modelProfit: 798.0,
        inputs: {
          moutaiVolume: 41800,
          seriesVolume: 39200,
          moutaiPrice: 3010000,
          seriesPrice: 372000,
          directSalesRatio: 52.4,
          moutaiGrossMargin: 94.5,
          seriesGrossMargin: 79.1,
          taxAndSurchargeRate: 17.2,
          periodExpenseRate: 8.3,
          otherNetIncome: 58,
          incomeTaxRate: 24.2,
          minorityInterest: 8.6,
        },
      },
      {
        periodKey: "2025",
        periodLabel: "2025",
        year: 2025,
        actualProfit: 878.0,
        modelProfit: 861.0,
        inputs: {
          moutaiVolume: 42800,
          seriesVolume: 40800,
          moutaiPrice: 3090000,
          seriesPrice: 386000,
          directSalesRatio: 54.75,
          moutaiGrossMargin: 94.7,
          seriesGrossMargin: 80.0,
          taxAndSurchargeRate: 17.0,
          periodExpenseRate: 8.1,
          otherNetIncome: 64,
          incomeTaxRate: 24.0,
          minorityInterest: 8.2,
        },
      },
      {
        periodKey: "2026Q1",
        periodLabel: "2026Q1",
        year: 2026,
        actualProfit: 244.0,
        modelProfit: 236.0,
        inputs: {
          moutaiVolume: 10900,
          seriesVolume: 10300,
          moutaiPrice: 3120000,
          seriesPrice: 391000,
          directSalesRatio: 55.2,
          moutaiGrossMargin: 94.8,
          seriesGrossMargin: 80.4,
          taxAndSurchargeRate: 16.9,
          periodExpenseRate: 8.0,
          otherNetIncome: 16,
          incomeTaxRate: 23.9,
          minorityInterest: 2.3,
        },
      },
    ]),
  },
];

export const getCompanyById = (companyId: CompanyId) =>
  companies.find((company) => company.id === companyId) ?? companies[0];

export const commodityCompanyIds: CompanyId[] = ["zijin", "cnooc"];

export const commodityCompanies = companies.filter((company) =>
  commodityCompanyIds.includes(company.id),
);

export const editablePeriodKeys = ["2026FY"];

export function getCompanyDefaultInputs(
  company: CompanyModel,
  baseYear = company.defaultBaseYear ?? 2025,
) {
  const baseRecord =
    company.history.find((record) => record.year === baseYear) ??
    company.history[company.history.length - 1];
  return {
    periodKey: baseRecord.periodKey,
    periodLabel: baseRecord.periodLabel,
    baseYear: baseRecord.year,
    inputs: baseRecord.inputs,
  };
}
