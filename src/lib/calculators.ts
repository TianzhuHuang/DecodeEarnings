import { CompanyId } from "./types";

export function calcZijinProfit(inputs: Record<string, number>) {
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
  return gold + copper + (inputs.otherContribution ?? 0);
}

export function calcCnoocProfit(inputs: Record<string, number>) {
  const preTaxProfit =
    (inputs.revenue ?? 0) -
    (inputs.operatingCost ?? 0) -
    (inputs.dda ?? 0) -
    (inputs.explorationExpense ?? 0) -
    (inputs.periodExpense ?? 0) +
    (inputs.fxInvestSubsidy ?? 0) -
    (inputs.impairment ?? 0);
  const afterTax = preTaxProfit * (1 - (inputs.effectiveTaxRate ?? 0) / 100);
  return afterTax - (inputs.minorityInterest ?? 0);
}

export function calcMoutaiProfit(inputs: Record<string, number>) {
  const moutaiRevenue = (inputs.moutaiVolume ?? 0) * (inputs.moutaiPrice ?? 0);
  const seriesRevenue = (inputs.seriesVolume ?? 0) * (inputs.seriesPrice ?? 0);
  const totalRevenue = moutaiRevenue + seriesRevenue;
  const grossProfit =
    moutaiRevenue * ((inputs.moutaiGrossMargin ?? 0) / 100) +
    seriesRevenue * ((inputs.seriesGrossMargin ?? 0) / 100);
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

export function calculateProfitByCompany(
  companyId: CompanyId,
  inputs: Record<string, number>,
) {
  if (companyId === "zijin") return calcZijinProfit(inputs);
  if (companyId === "cnooc") return calcCnoocProfit(inputs);
  return calcMoutaiProfit(inputs);
}
