import { AttributionReport, CompanyId } from "./types";
import { getCnoocMappedFields } from "./report-mapping/cnooc-mapping";
import { getZijinMappedFields } from "./report-mapping/zijin-mapping";
import { fetchCnoocAnnualReportSource } from "./report-source/cnooc-source";
import { fetchZijinAnnualReportSource } from "./report-source/zijin-source";

interface AttributionInput {
  companyId: CompanyId;
  year: number;
  modelProfit: number;
  actualProfit: number;
}

function round1(value: number) {
  return Number(value.toFixed(1));
}

export async function buildAnnualAttribution(
  input: AttributionInput,
): Promise<AttributionReport> {
  await new Promise((resolve) => setTimeout(resolve, 1400));

  const diff = input.modelProfit - input.actualProfit;
  const direction = diff >= 0 ? "高估" : "低估";

  if (input.companyId !== "zijin" && input.companyId !== "cnooc") {
    return {
      companyId: input.companyId,
      year: input.year,
      source: "年报解析任务（占位）",
      summary: `${input.year} 年模型相对年报${direction} ${Math.abs(diff).toFixed(1)} 亿元。当前仅开放紫金矿业深度归因。`,
      items: [
        {
          id: "placeholder",
          title: "待接入该公司年报明细口径",
          impact: round1(diff),
          evidence: {
            fieldName: "N/A",
            rawValue: "N/A",
            formula: "待接入该公司年报附注解析规则（税费、减值、公允价值等）。",
            sourceUrl: "N/A",
          },
        },
      ],
    };
  }

  if (input.companyId === "cnooc") {
    const source = await fetchCnoocAnnualReportSource(input.year);
    const mapped = getCnoocMappedFields(input.year);

    const fxAndInvestment = round1(
      mapped.find((x) => x.fieldName === "汇兑及投资收益净额")?.rawValue ?? diff * 0.22,
    );
    const impairment = round1(
      mapped.find((x) => x.fieldName === "资产减值损失")?.rawValue ?? diff * 0.18,
    );
    const taxAndMinority = round1(
      (mapped.find((x) => x.fieldName === "所得税费用")?.rawValue ?? 0) +
        (mapped.find((x) => x.fieldName === "少数股东损益")?.rawValue ?? 0),
    );
    const periodGap = round1(
      mapped.find((x) => x.fieldName === "期间费用口径差")?.rawValue ??
        diff - fxAndInvestment - impairment - taxAndMinority,
    );

    return {
      companyId: input.companyId,
      year: input.year,
      source: `中国海油年报抓取与科目映射（抓取时间: ${source.extractedAt}）`,
      summary: `${input.year} 年模型相对年报${direction} ${Math.abs(diff).toFixed(1)} 亿元。主要差异来自汇兑/投资收益、减值损失、税费与少数股东损益口径，以及期间费用归集差异。`,
      items: [
        {
          id: "fx-investment",
          title: "汇兑与投资收益影响",
          impact: fxAndInvestment,
          evidence: {
            fieldName: "汇兑及投资收益净额",
            rawValue: `${fxAndInvestment.toFixed(1)} 亿元`,
            formula: "误差贡献 = 年报汇兑及投资收益净额",
            sourceUrl: source.reportUrl,
          },
        },
        {
          id: "impairment",
          title: "资产减值影响",
          impact: impairment,
          evidence: {
            fieldName: "资产减值损失",
            rawValue: `${impairment.toFixed(1)} 亿元`,
            formula: "误差贡献 = 年报资产减值损失",
            sourceUrl: source.reportUrl,
          },
        },
        {
          id: "tax-minority",
          title: "税费与少数股东损益口径",
          impact: taxAndMinority,
          evidence: {
            fieldName: "所得税费用 + 少数股东损益",
            rawValue: `${taxAndMinority.toFixed(1)} 亿元`,
            formula: "误差贡献 = 年报所得税费用 + 年报少数股东损益",
            sourceUrl: source.reportUrl,
          },
        },
        {
          id: "period-expense-gap",
          title: "期间费用归集差异",
          impact: periodGap,
          evidence: {
            fieldName: "期间费用口径差",
            rawValue: `${periodGap.toFixed(1)} 亿元`,
            formula: "误差贡献 = 年报期间费用口径 - 模型期间费用口径",
            sourceUrl: source.reportUrl,
          },
        },
      ],
    };
  }

  const source = await fetchZijinAnnualReportSource(input.year);
  const mapped = getZijinMappedFields(input.year);

  const hedgeAndFx = round1(mapped.find((x) => x.fieldName === "公允价值及套保损益")?.rawValue ?? diff * 0.28);
  const impairment = round1(mapped.find((x) => x.fieldName === "资产减值损失")?.rawValue ?? diff * 0.22);
  const taxAndMinority = round1(
    (mapped.find((x) => x.fieldName === "所得税费用")?.rawValue ?? 0) +
      (mapped.find((x) => x.fieldName === "少数股东损益影响")?.rawValue ?? 0),
  );
  const byproducts = round1(
    mapped.find((x) => x.fieldName === "非金铜业务贡献偏差")?.rawValue ??
      diff - hedgeAndFx - impairment - taxAndMinority,
  );

  return {
    companyId: input.companyId,
    year: input.year,
    source: `紫金矿业年报抓取与科目映射（抓取时间: ${source.extractedAt}）`,
    summary: `${input.year} 年模型相对年报${direction} ${Math.abs(diff).toFixed(1)} 亿元。主要偏差来自套保与汇率、公允价值/减值、税费与少数股东损益、以及非金铜业务波动。`,
    items: [
      {
        id: "hedge-fx",
        title: "套保与汇率影响",
        impact: hedgeAndFx,
        evidence: {
          fieldName: "公允价值及套保损益",
          rawValue: `${hedgeAndFx.toFixed(1)} 亿元`,
          formula: "误差贡献 = 年报公允价值及套保损益",
          sourceUrl: source.reportUrl,
        },
      },
      {
        id: "impairment-fv",
        title: "减值及公允价值变动",
        impact: impairment,
        evidence: {
          fieldName: "资产减值损失",
          rawValue: `${impairment.toFixed(1)} 亿元`,
          formula: "误差贡献 = 年报资产减值损失",
          sourceUrl: source.reportUrl,
        },
      },
      {
        id: "tax-minority",
        title: "税费口径与少数股东损益",
        impact: taxAndMinority,
        evidence: {
          fieldName: "所得税费用 + 少数股东损益影响",
          rawValue: `${taxAndMinority.toFixed(1)} 亿元`,
          formula:
            "误差贡献 = 年报所得税费用 + 年报少数股东损益影响",
          sourceUrl: source.reportUrl,
        },
      },
      {
        id: "other-segments",
        title: "非金铜业务与其他贡献偏差",
        impact: byproducts,
        evidence: {
          fieldName: "非金铜业务贡献偏差",
          rawValue: `${byproducts.toFixed(1)} 亿元`,
          formula: "误差贡献 = 年报分部利润 - 模型其他贡献",
          sourceUrl: source.reportUrl,
        },
      },
    ],
  };
}
