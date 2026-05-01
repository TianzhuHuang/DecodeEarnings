import { CompanyId, ResultBreakdown } from "./types";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function calcZijinProfit(inputs: Record<string, number | undefined>) {
  const gold =
    ((inputs.goldOutputTon ?? 0) *
      1_000_000 *
      (inputs.goldPrice ?? 0) *
      (inputs.kg ?? 0)) /
    100_000_000;
  const copper =
    ((inputs.copperOutput10kTon ?? 0) *
      10_000 *
      (inputs.copperPrice ?? 0) *
      (inputs.kc ?? 0)) /
    100_000_000;
  const lithium =
    ((inputs.lithiumOutput10kTon ?? 0) *
      10_000 *
      (inputs.lithiumPrice ?? 0) *
      (inputs.kl ?? 0)) /
    100_000_000;
  return (
    gold +
    copper +
    lithium +
    (inputs.otherContribution ?? 0) +
    (inputs.preciousMetalsContribution ?? 0)
  );
}

function calcZijinBreakdown(inputs: Record<string, number | undefined>): ResultBreakdown {
  const goldRevenue =
    ((inputs.goldOutputTon ?? 0) * 1_000_000 * (inputs.goldPrice ?? 0)) / 100_000_000;
  const copperRevenue =
    ((inputs.copperOutput10kTon ?? 0) * 10_000 * (inputs.copperPrice ?? 0)) /
    100_000_000;
  const lithiumRevenue =
    ((inputs.lithiumOutput10kTon ?? 0) * 10_000 * (inputs.lithiumPrice ?? 0)) /
    100_000_000;
  const revenue = goldRevenue + copperRevenue + lithiumRevenue;
  const commodityAttributable =
    goldRevenue * (inputs.kg ?? 0) +
    copperRevenue * (inputs.kc ?? 0) +
    lithiumRevenue * (inputs.kl ?? 0);
  const cost = Math.max(0, revenue - commodityAttributable);
  const netProfit = revenue - cost;
  const attributableProfit =
    netProfit +
    (inputs.otherContribution ?? 0) +
    (inputs.preciousMetalsContribution ?? 0);
  return { revenue, cost, netProfit, attributableProfit };
}

export function calcCnoocProfit(inputs: Record<string, number | undefined>) {
  const coreProfit =
    ((inputs.productionMboe ?? 0) *
      ((inputs.brentPrice ?? 0) - (inputs.allInCostPerBoe ?? 0)) *
      (inputs.fxRate ?? 7)) /
    100;
  const preTaxProfit =
    ((inputs.revenue ?? 0) || coreProfit) -
    (inputs.operatingCost ?? 0) -
    (inputs.dda ?? 0) -
    (inputs.explorationExpense ?? 0) -
    (inputs.periodExpense ?? 0) +
    (inputs.fxInvestSubsidy ?? 0) -
    (inputs.impairment ?? 0);
  const afterTax = preTaxProfit * (1 - (inputs.effectiveTaxRate ?? 0) / 100);
  return afterTax - (inputs.minorityInterest ?? 0);
}

function calcCnoocBreakdown(inputs: Record<string, number | undefined>): ResultBreakdown {
  const revenue =
    ((inputs.productionMboe ?? 0) * (inputs.brentPrice ?? 0) * (inputs.fxRate ?? 7)) / 100;
  const cost =
    ((inputs.productionMboe ?? 0) *
      (inputs.allInCostPerBoe ?? 0) *
      (inputs.fxRate ?? 7)) /
    100;
  const netProfit = revenue - cost;
  const taxAdjusted = netProfit * (1 - (inputs.effectiveTaxRate ?? 26) / 100);
  const attributableProfit =
    taxAdjusted +
    (inputs.fxInvestSubsidy ?? 0) -
    (inputs.impairment ?? 0) -
    (inputs.minorityInterest ?? 0);
  return { revenue, cost, netProfit, attributableProfit };
}

export function calcMoutaiProfit(inputs: Record<string, number | undefined>) {
  const moutaiRevenue = (inputs.moutaiVolume ?? 0) * (inputs.moutaiPrice ?? 0);
  const seriesRevenue = (inputs.seriesVolume ?? 0) * (inputs.seriesPrice ?? 0);
  const totalRevenue = moutaiRevenue + seriesRevenue;
  const directSalesAdj =
    1 + (((inputs.directSalesRatio ?? 42) - 42) / 100) * 0.06;
  const grossProfit =
    (moutaiRevenue * ((inputs.moutaiGrossMargin ?? 0) / 100) +
      seriesRevenue * ((inputs.seriesGrossMargin ?? 0) / 100)) *
    directSalesAdj;
  const taxAndSurcharge = totalRevenue * ((inputs.taxAndSurchargeRate ?? 0) / 100);
  const periodExpense = totalRevenue * ((inputs.periodExpenseRate ?? 0) / 100);
  const otherIncome = (inputs.otherNetIncome ?? 0) * 100_000_000;
  const incomeTaxRate = (inputs.incomeTaxRate ?? 0) / 100;
  const minorityInterest = (inputs.minorityInterest ?? 0) * 100_000_000;

  return (
    (grossProfit - taxAndSurcharge - periodExpense + otherIncome) *
      (1 - incomeTaxRate) /
      100_000_000 -
    minorityInterest / 100_000_000
  );
}

function calcMoutaiBreakdown(inputs: Record<string, number | undefined>): ResultBreakdown {
  const revenue =
    ((inputs.moutaiVolume ?? 0) * (inputs.moutaiPrice ?? 0) +
      (inputs.seriesVolume ?? 0) * (inputs.seriesPrice ?? 0)) /
    100_000_000;
  const grossMargin =
    ((inputs.moutaiGrossMargin ?? 0) * 0.7 + (inputs.seriesGrossMargin ?? 0) * 0.3) / 100;
  const cost = revenue * (1 - grossMargin);
  const netProfit = revenue - cost;
  const attributableProfit =
    netProfit * (1 - (inputs.incomeTaxRate ?? 24) / 100) - (inputs.minorityInterest ?? 0);
  return { revenue, cost, netProfit, attributableProfit };
}

export function calculateBreakdownByCompany(
  companyId: CompanyId,
  inputs: Record<string, number | undefined>,
): ResultBreakdown {
  if (companyId === "zijin") return calcZijinBreakdown(inputs);
  if (companyId === "cnooc") return calcCnoocBreakdown(inputs);
  return calcMoutaiBreakdown(inputs);
}

export function calculateProfitByCompany(
  companyId: CompanyId,
  inputs: Record<string, number | undefined>,
) {
  return calculateBreakdownByCompany(companyId, inputs).attributableProfit;
}

export function solveZijinParamsForYear(
  year: number,
  facts: Record<string, number>,
  actualProfit: number,
) {
  const goldRevenue =
    ((facts.goldOutputTon ?? 0) * 1_000_000 * (facts.goldPrice ?? 0)) / 100_000_000;
  const copperRevenue =
    ((facts.copperOutput10kTon ?? 0) * 10_000 * (facts.copperPrice ?? 0)) / 100_000_000;
  const lithiumRevenue =
    ((facts.lithiumOutput10kTon ?? 0) * 10_000 * (facts.lithiumPrice ?? 0)) / 100_000_000;

  const baseKg = 0.16 + Math.max(0, year - 2019) * 0.007;
  const baseKc = 0.13 + Math.max(0, year - 2019) * 0.006;
  const baseKl = 0.09 + Math.max(0, year - 2019) * 0.004;
  const baselineCommodityAttributable =
    goldRevenue * baseKg + copperRevenue * baseKc + lithiumRevenue * baseKl;

  const assumedNonCommodity = Math.max(8, actualProfit * 0.24);
  const scale =
    baselineCommodityAttributable > 0
      ? (actualProfit - assumedNonCommodity) / baselineCommodityAttributable
      : 1;

  const kg = clamp(baseKg * scale, 0.1, 0.3);
  const kc = clamp(baseKc * scale, 0.08, 0.28);
  const kl = clamp(baseKl * scale, 0.06, 0.24);

  const calibratedCommodityAttributable =
    goldRevenue * kg + copperRevenue * kc + lithiumRevenue * kl;
  const residual = Math.max(0, actualProfit - calibratedCommodityAttributable);
  const otherContribution = Number((residual * 0.62).toFixed(1));
  const preciousMetalsContribution = Number((residual * 0.38).toFixed(1));

  return {
    kg: Number(kg.toFixed(3)),
    kc: Number(kc.toFixed(3)),
    kl: Number(kl.toFixed(3)),
    otherContribution,
    preciousMetalsContribution,
  };
}
