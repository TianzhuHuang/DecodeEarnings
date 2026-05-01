"use client";

import { useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AttributionReport, CompanyModel, TableEditValueMap } from "@/lib/types";
import { zijinCanonicalYearData } from "@/lib/report-mapping/zijin-mapping";
import { calculateBreakdownByCompany } from "@/lib/calculators";

interface Props {
  company: CompanyModel;
  selectedPeriodKey: string;
  onSelectPeriod: (periodKey: string) => void;
  predictedProfit: number;
  periodInputsMap: TableEditValueMap;
  committedPeriodInputsMap: TableEditValueMap;
  editablePeriodKeys: string[];
  onChangeInput: (periodKey: string, variableKey: string, value: number) => void;
  onSubmitForecast: (periodKey: string) => void;
  hasPendingForecastChanges: boolean;
  onActivateVariable: (key: string | null) => void;
  priceUnitMode: "cny" | "usd";
}

export function ValidationPanel({
  company,
  selectedPeriodKey,
  onSelectPeriod,
  predictedProfit,
  periodInputsMap,
  committedPeriodInputsMap,
  editablePeriodKeys,
  onChangeInput,
  onSubmitForecast,
  hasPendingForecastChanges,
  onActivateVariable,
  priceUnitMode,
}: Props) {
  const [loadingAttribution, setLoadingAttribution] = useState(false);
  const [attribution, setAttribution] = useState<AttributionReport | null>(null);
  const [attributionError, setAttributionError] = useState<string | null>(null);
  const [analyzedPeriodKey, setAnalyzedPeriodKey] = useState<string | null>(null);
  const [showAllVariables, setShowAllVariables] = useState(false);
  const [focusedCell, setFocusedCell] = useState<{
    periodKey: string;
    variableKey: string;
  } | null>(null);

  const coreVariables = company.variables.filter((item) => item.isCore);
  const extraVariables = company.variables.filter((item) => !item.isCore);
  const variableRows = showAllVariables ? [...coreVariables, ...extraVariables] : coreVariables;
  const allPeriods = [
    ...company.history.filter((item) => editablePeriodKeys.includes(item.periodKey)),
    ...company.history
      .filter((item) => !editablePeriodKeys.includes(item.periodKey))
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.periodLabel.localeCompare(a.periodLabel);
      }),
  ];
  const historicalRecords = company.history.filter((item) => item.actualProfit > 0);
  const modelProfitByPeriodKey = Object.fromEntries(
    allPeriods.map((period) => {
      const inputs = committedPeriodInputsMap[period.periodKey] ?? period.inputs;
      const effectiveInputs = period.forecastEditable
        ? inputs
        : { ...inputs, ...(period.calibratedInputs ?? {}) };
      const attributable = calculateBreakdownByCompany(company.id, effectiveInputs).attributableProfit;
      return [period.periodKey, attributable];
    }),
  );
  const FX_RATE = 7.2;
  const GOLD_GRAMS_PER_OUNCE = 31.1035;
  const isConvertiblePriceKey = (key: string) =>
    company.id === "zijin" &&
    (key === "goldPrice" || key === "copperPrice" || key === "lithiumPrice");
  const getDisplayUnit = (key: string, fallback: string) => {
    if (priceUnitMode === "cny" || !isConvertiblePriceKey(key)) return fallback;
    if (key === "goldPrice") return "美元/盎司";
    return "美元/吨";
  };
  const toDisplayValue = (key: string, value: number) => {
    if (priceUnitMode === "cny" || !isConvertiblePriceKey(key)) return value;
    if (key === "goldPrice") return (value * GOLD_GRAMS_PER_OUNCE) / FX_RATE;
    return value / FX_RATE;
  };
  const toStoredValue = (key: string, value: number) => {
    if (priceUnitMode === "cny" || !isConvertiblePriceKey(key)) return value;
    if (key === "goldPrice") return (value * FX_RATE) / GOLD_GRAMS_PER_OUNCE;
    return value * FX_RATE;
  };
  const getOfficialGuidance = (periodKey: string, variableKey: string) => {
    if (periodKey !== "2026FY") return null;
    if (company.id === "zijin" && variableKey === "lithiumOutput10kTon") {
      return {
        text: "公司指引：2026年当量碳酸锂产量约12万吨",
        sourceLabel: "2026Q1公告",
        sourceUrl:
          "https://stockmc.xueqiu.com/202604/601899_20260422_9P6X.pdf",
      };
    }
    return null;
  };
  const errorRateByPeriodKey = Object.fromEntries(
    historicalRecords.map((record) => [
      record.periodKey,
      (((modelProfitByPeriodKey[record.periodKey] ?? record.modelProfit) -
        record.actualProfit) /
        record.actualProfit) *
        100,
    ]),
  );

  const selectedRecord =
    company.history.find((item) => item.periodKey === selectedPeriodKey) ??
    company.history[company.history.length - 1];
  const selectedModelProfit =
    modelProfitByPeriodKey[selectedRecord.periodKey] ?? predictedProfit;
  const selectedDiff = selectedModelProfit - selectedRecord.actualProfit;
  const selectedErrorRate =
    selectedRecord.actualProfit > 0
      ? (selectedDiff / selectedRecord.actualProfit) * 100
      : 0;
  const zijinSourceMeta =
    company.id === "zijin" ? zijinCanonicalYearData[selectedRecord.year] : null;
  const zijinQ1SourceUrl =
    company.id === "zijin" && selectedRecord.periodKey === "2026Q1"
      ? "https://stockmc.xueqiu.com/202604/601899_20260422_9P6X.pdf"
      : null;

  const visibleAttribution =
    attribution &&
    attribution.companyId === company.id &&
    attribution.year === selectedRecord.year
      ? attribution
      : null;
  const analysisStatus: "idle" | "loading" | "success" | "error" = loadingAttribution
    ? "loading"
    : attributionError
      ? "error"
      : visibleAttribution && analyzedPeriodKey === selectedPeriodKey
        ? "success"
        : "idle";

  const handleSelectPeriod = (periodKey: string) => {
    const isRealPeriod = company.history.some((item) => item.periodKey === periodKey);
    if (!isRealPeriod) return;
    onSelectPeriod(periodKey);
    if (analyzedPeriodKey !== periodKey) {
      setAttributionError(null);
    }
  };

  const runAttribution = async () => {
    if (selectedRecord.actualProfit <= 0) return;
    try {
      setLoadingAttribution(true);
      setAttributionError(null);
      setAnalyzedPeriodKey(selectedRecord.periodKey);
      const response = await fetch("/api/analysis/annual-report-attribution", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: company.id,
          year: selectedRecord.year,
          modelProfit: selectedModelProfit,
          actualProfit: selectedRecord.actualProfit,
        }),
      });
      if (!response.ok) {
        throw new Error("请求失败");
      }
      const report = (await response.json()) as AttributionReport;
      setAttribution(report);
    } catch {
      setAttributionError("归因分析失败，请稍后重试。");
    } finally {
      setLoadingAttribution(false);
    }
  };
  const chartData = [
    ...historicalRecords.map((item) => ({
      ...item,
      modelProfit: modelProfitByPeriodKey[item.periodKey] ?? item.modelProfit,
      forecastPoint: null as number | null,
    })),
    {
      periodKey: "my-forecast",
      periodLabel: "我的预测",
      year: selectedRecord.year + 1,
      actualProfit: null,
      modelProfit: predictedProfit,
      forecastPoint: predictedProfit,
    },
  ];

  return (
    <section className="card p-0 space-y-0 overflow-hidden">
      <div className="px-4 py-3 bg-[#111723] border-b border-[#183047] flex items-center justify-between">
        <h2 className="panel-title">
          历史模型验证（{company.history[0]?.periodLabel} -{" "}
          {company.history[company.history.length - 1]?.periodLabel}）
        </h2>
      </div>
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-3">
          <div className="xl:col-span-7 h-56 border border-[#17324a] bg-[#08131f] p-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                onClick={(event: unknown) => {
                  const chartEvent = event as {
                    activePayload?: Array<{ payload?: { periodKey?: string } }>;
                  };
                  const payload = chartEvent.activePayload?.[0]?.payload;
                  if (payload?.periodKey) handleSelectPeriod(payload.periodKey);
                }}
              >
                <CartesianGrid stroke="#17324a" strokeDasharray="3 3" />
                <XAxis
                  dataKey="periodLabel"
                  allowDuplicatedCategory={false}
                  tick={{ fill: "#6f8298", fontSize: 11 }}
                />
                <YAxis tick={{ fill: "#6f8298", fontSize: 11 }} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload || payload.length === 0) return null;
                    const row = payload[0]?.payload as
                      | { periodLabel?: string; actualProfit?: number; modelProfit?: number }
                      | undefined;
                    const periodLabel =
                      typeof label === "string"
                        ? label
                        : row?.periodLabel ?? "-";
                    const actual = row?.actualProfit;
                    const model = row?.modelProfit;
                    return (
                      <div className="border border-[#244663] bg-[#0a1421] px-2 py-1.5 text-[11px]">
                        <p className="mono text-[#cfe0ef]">{periodLabel}</p>
                        <p className="text-[#9fd4a8]">
                          实际净利润：{typeof actual === "number" ? `${actual.toFixed(1)} 亿` : "-"}
                        </p>
                        <p className="text-[#b8c4d2]">
                          公式净利润：{typeof model === "number" ? `${model.toFixed(1)} 亿` : "-"}
                        </p>
                      </div>
                    );
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
                <Line
                  type="monotone"
                  dataKey="actualProfit"
                  stroke="#02e600"
                  strokeWidth={2}
                  name="实际净利润"
                />
                <Line
                  type="monotone"
                  dataKey="modelProfit"
                  stroke="#a5b0bc"
                  strokeDasharray="5 3"
                  strokeWidth={2}
                  name="公式净利润"
                />
                <Line
                  type="monotone"
                  dataKey="forecastPoint"
                  stroke="#59a7ff"
                  strokeDasharray="2 4"
                  strokeWidth={0}
                  dot={{ r: 4, strokeWidth: 2 }}
                  name="我的预测点"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="xl:col-span-5 space-y-2 border border-[#17324a] bg-[#08131f] p-2.5">
            <p className="mono text-[11px] uppercase text-[var(--text-secondary)]">
              回测误差标记（已并入表头年份）
            </p>
            <div className="border border-[#1d3448] bg-[#0a1623] p-2 text-xs">
              <div className="text-[var(--text-secondary)]">
                当前期间：<span className="mono text-[#cfe0ef]">{selectedRecord.periodLabel}</span>
              </div>
              <div className="mt-1">
                误差率：
                <span
                  className={`mono ml-1 ${
                    selectedErrorRate >= 0 ? "text-[#a8f5b0]" : "text-[#ff9b9b]"
                  }`}
                >
                  {selectedErrorRate >= 0 ? "+" : ""}
                  {selectedErrorRate.toFixed(2)}%
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-1 text-[11px] text-[var(--text-secondary)]">
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 border border-green-800 bg-green-900/60 inline-block" />
                绿色：模型高于年报（高估，误差为正）
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 border border-red-800 bg-red-900/60 inline-block" />
                红色：模型低于年报（低估，误差为负）
              </span>
            </div>
          </div>
        </div>

        <div>
          <div className="overflow-x-auto">
            <div className="mb-2">
              <p className="mono text-[11px] uppercase text-[var(--text-secondary)]">
                年度参数总览（参数行 / 期间列）
              </p>
            </div>
            <div className="relative">
              <table className="w-full text-xs border border-[#244663] min-w-[1100px]">
                <thead className="bg-[#161b20]">
                  <tr>
                    <th className="text-left p-2 sticky left-0 bg-[#161b20] z-10">参数</th>
                    {allPeriods.map((period) => {
                        const errorRate = errorRateByPeriodKey[period.periodKey];
                        const opacity =
                          typeof errorRate === "number"
                            ? Math.min(0.45, Math.max(0.12, Math.abs(errorRate) / 14))
                            : 0;
                        const bgColor =
                          typeof errorRate === "number"
                            ? errorRate >= 0
                              ? `rgba(20, 100, 45, ${opacity})`
                              : `rgba(120, 28, 28, ${opacity})`
                            : undefined;
                        return (
                          <th
                            key={`period-h-${period.periodKey}`}
                            className={`text-left p-2 whitespace-nowrap cursor-pointer ${
                              selectedPeriodKey === period.periodKey ? "text-[var(--accent)]" : ""
                            }`}
                            style={{ backgroundColor: bgColor }}
                            title={
                              typeof errorRate === "number"
                                ? `${period.periodLabel} 误差率 ${errorRate.toFixed(2)}%`
                                : `${period.periodLabel}（预测/无年报）`
                            }
                            onClick={() => handleSelectPeriod(period.periodKey)}
                          >
                            {period.periodLabel}
                          </th>
                        );
                      })}
                  </tr>
                </thead>
                <tbody>
                  {variableRows.map((variable) => (
                    <tr
                      key={`var-row-${variable.key}`}
                      className={`border-t border-[#1e3347] ${
                        variable.isCore ? "bg-[#0d2132]" : "bg-[#09131d]"
                      }`}
                      onMouseEnter={() => onActivateVariable(variable.key)}
                      onMouseLeave={() => onActivateVariable(null)}
                    >
                      <td
                        className={`p-2 sticky left-0 z-10 whitespace-nowrap ${
                          variable.isCore ? "bg-[#0f2a3f]" : "bg-[#0b1521]"
                        }`}
                      >
                        <div className="group relative inline-flex items-center">
                          <span
                            className={variable.isCore ? "text-[#8fd6ff] font-semibold" : "text-[#d8e4f0]"}
                          >
                            {variable.label}
                          </span>
                          <span className="mono text-[10px] text-[var(--text-secondary)] ml-1">
                          {getDisplayUnit(variable.key, variable.unit)
                            ? `(${getDisplayUnit(variable.key, variable.unit)})`
                            : ""}
                          </span>
                          {variable.isCore ? (
                            <span className="ml-2 mono text-[10px] text-[#7fc7f2]">核心</span>
                          ) : (
                            <span className="ml-2 mono text-[10px] text-[#9fb0c0] border border-[#2c4358] w-4 h-4 inline-flex items-center justify-center">
                              ?
                            </span>
                          )}
                          {!variable.isCore ? (
                            <div className="hidden group-hover:block absolute left-0 top-full mt-1 z-20 w-72 border border-[#2a4c69] bg-[#08131f] p-2 text-[11px] text-[#c8d7e5] whitespace-normal shadow-lg">
                              {variable.tooltip}
                            </div>
                          ) : null}
                        </div>
                      </td>
                      {allPeriods.map((period) => {
                        const editable =
                          period.forecastEditable &&
                          editablePeriodKeys.includes(period.periodKey);
                        const historicalCalibratedValue = period.forecastEditable
                          ? undefined
                          : period.calibratedInputs?.[variable.key];
                        const value =
                          periodInputsMap[period.periodKey]?.[variable.key] ??
                          period.inputs[variable.key] ??
                          historicalCalibratedValue;
                        const numericValue = typeof value === "number" ? value : undefined;
                        const displayValue =
                          typeof numericValue === "number"
                            ? toDisplayValue(variable.key, Number(numericValue))
                            : undefined;
                        const displayMin = toDisplayValue(variable.key, variable.min);
                        const displayMax = toDisplayValue(variable.key, variable.max);
                        const displayStep =
                          priceUnitMode === "usd" && isConvertiblePriceKey(variable.key)
                            ? variable.key === "goldPrice"
                              ? 1
                              : 10
                            : variable.step;
                        const isFocused =
                          focusedCell?.periodKey === period.periodKey &&
                          focusedCell.variableKey === variable.key;
                        const officialGuidance = getOfficialGuidance(
                          period.periodKey,
                          variable.key,
                        );
                        return (
                          <td key={`${variable.key}-${period.periodKey}`} className="p-1.5">
                            {editable ? (
                              <div className="relative">
                                <input
                                  type="number"
                                  value={
                                    typeof displayValue === "number"
                                      ? Number(displayValue.toFixed(2))
                                      : ""
                                  }
                                  min={displayMin}
                                  max={displayMax}
                                  step={displayStep}
                                  onFocus={() =>
                                    setFocusedCell({
                                      periodKey: period.periodKey,
                                      variableKey: variable.key,
                                    })
                                  }
                                  onClick={(event) => event.currentTarget.select()}
                                  onBlur={() => setFocusedCell(null)}
                                  onChange={(event) => {
                                    const raw = event.target.value;
                                    if (raw === "") return;
                                    const nextValue = Number(raw);
                                    if (Number.isNaN(nextValue)) return;
                                    onChangeInput(
                                      period.periodKey,
                                      variable.key,
                                      Number(toStoredValue(variable.key, nextValue).toFixed(4)),
                                    );
                                  }}
                                  className="w-28 p-1 text-xs bg-[#111f2b] border border-[#2b4359] mono"
                                />
                                {isFocused ? (
                                  <div className="absolute left-0 top-full mt-1 w-56 border border-[#32567a] bg-[#081624] p-2 z-20 shadow-lg">
                                    {officialGuidance ? (
                                      <div className="mb-2 border border-[#2a4a66] bg-[#0a1a28] p-1.5">
                                        <p className="text-[10px] text-[#7fb9f0]">官方业绩指引</p>
                                        <p className="text-[10px] text-[#d9e4ef] mt-0.5">
                                          {officialGuidance.text}
                                        </p>
                                        <a
                                          href={officialGuidance.sourceUrl}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="text-[10px] mono text-[#87bdf0] underline mt-0.5 inline-block"
                                        >
                                          来源：{officialGuidance.sourceLabel}
                                        </a>
                                      </div>
                                    ) : null}
                                    <p className="text-[10px] text-[#9fb3c6] mb-1">机构一致预期</p>
                                    <div className="text-[10px] mono text-[#d9e4ef] space-y-0.5">
                                      <p>中信证券：{Number((numericValue ?? 0) * 0.98).toLocaleString()}</p>
                                      <p>中金公司：{Number((numericValue ?? 0) * 1.01).toLocaleString()}</p>
                                      <p>海通证券：{Number((numericValue ?? 0) * 1.03).toLocaleString()}</p>
                                    </div>
                                  </div>
                                ) : null}
                              </div>
                            ) : (
                              <span className="mono text-[#c9d7e5]">
                                {typeof displayValue === "number"
                                  ? Number(displayValue.toFixed(2)).toLocaleString()
                                  : "-"}
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-2">
              <button
                className="w-full text-sm border border-[#2b4359] bg-[#0b1522] px-3 py-2 text-[#c7d6e4] hover:border-[var(--accent)]"
                onClick={() => setShowAllVariables((prev) => !prev)}
              >
                {showAllVariables ? "收起更多参数" : "展开更多参数"}
              </button>
            </div>
            <p className="mt-2 text-[11px] text-[var(--text-secondary)]">
              注：仅 2026FY 支持编辑；历史期间与 2026Q1 为只读财报口径。
            </p>
            <div className="mt-2">
              <button
                className="w-full text-sm border border-[#2f5f86] bg-[#0d2235] px-3 py-2 text-[#d8ecff] hover:border-[var(--accent)] disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={
                  !selectedRecord.forecastEditable ||
                  !editablePeriodKeys.includes(selectedRecord.periodKey) ||
                  !hasPendingForecastChanges
                }
                onClick={() => onSubmitForecast(selectedRecord.periodKey)}
              >
                {hasPendingForecastChanges ? "开始预测计算" : "已是最新预测结果"}
              </button>
            </div>
          </div>
          <div className="mt-4 border border-[#244663] bg-[#08121d] p-3 space-y-2">
            <div className="flex items-center justify-between gap-3 border-b border-[#173047] pb-2">
              <div className="text-xs text-[#c4d0dd]">
                <span className="mono text-[var(--accent)]">{selectedRecord.periodLabel}</span>
                <span className="mx-2">|</span>
                模型净利润{" "}
                <span className="mono text-[#a8f5b0]">{selectedModelProfit.toFixed(1)}亿</span>
                <span className="mx-2">|</span>
                年报净利润 <span className="mono">{selectedRecord.actualProfit.toFixed(1)}亿</span>
                <span className="mx-2">|</span>
                差异{" "}
                <span
                  className={`mono ${
                    selectedDiff >= 0 ? "text-[#a8f5b0]" : "text-[#ff9b9b]"
                  }`}
                >
                  {selectedDiff >= 0 ? "+" : ""}
                  {selectedDiff.toFixed(1)}亿
                </span>
                <span className="mx-2">|</span>
                误差率{" "}
                <span
                  className={`mono ${
                    selectedErrorRate >= 0 ? "text-[#a8f5b0]" : "text-[#ff9b9b]"
                  }`}
                >
                  {selectedErrorRate >= 0 ? "+" : ""}
                  {selectedErrorRate.toFixed(2)}%
                </span>
                {zijinSourceMeta ? (
                  <>
                    <span className="mx-2">|</span>
                    <span>
                      数据源：
                      <a
                        href={zijinSourceMeta.primarySourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mono text-[#87bdf0] underline ml-1"
                      >
                        主源
                      </a>
                      /
                      <a
                        href={zijinSourceMeta.verificationSourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mono text-[#87bdf0] underline ml-1"
                      >
                        校验
                      </a>
                    </span>
                  </>
                ) : null}
                {zijinQ1SourceUrl ? (
                  <>
                    <span className="mx-2">|</span>
                    <span>
                      季报来源：
                      <a
                        href={zijinQ1SourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mono text-[#87bdf0] underline ml-1"
                      >
                        2026Q1 公告PDF
                      </a>
                    </span>
                  </>
                ) : null}
              </div>
              <button
                onClick={runAttribution}
                disabled={loadingAttribution}
                className={`validation-primary-cta ${
                  analysisStatus === "success" ? "validation-primary-cta-success" : ""
                }`}
              >
                {loadingAttribution
                  ? `分析中 ${selectedRecord.periodLabel}...`
                  : analysisStatus === "success"
                    ? `已分析 ${selectedRecord.periodLabel}，可重新分析`
                    : "深度误差归因（年报）"}
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-xs">
              <div className="border border-[#1d3448] bg-[#0a1623] p-2">
                <div className="text-[var(--text-secondary)]">模型净利润</div>
                <div className="mono mt-1 text-[#a8f5b0]">
                  {selectedModelProfit.toFixed(1)} 亿
                </div>
              </div>
              <div className="border border-[#1d3448] bg-[#0a1623] p-2">
                <div className="text-[var(--text-secondary)]">年报净利润</div>
                <div className="mono mt-1 text-[#d9e0ea]">
                  {selectedRecord.actualProfit.toFixed(1)} 亿
                </div>
              </div>
              <div className="border border-[#1d3448] bg-[#0a1623] p-2">
                <div className="text-[var(--text-secondary)]">绝对差异</div>
                <div
                  className={`mono mt-1 ${
                    selectedDiff >= 0 ? "text-[#a8f5b0]" : "text-[#ff9b9b]"
                  }`}
                >
                  {selectedDiff >= 0 ? "+" : ""}
                  {selectedDiff.toFixed(1)} 亿
                </div>
              </div>
              <div className="border border-[#1d3448] bg-[#0a1623] p-2">
                <div className="text-[var(--text-secondary)]">误差率</div>
                <div
                  className={`mono mt-1 ${
                    selectedErrorRate >= 0 ? "text-[#a8f5b0]" : "text-[#ff9b9b]"
                  }`}
                >
                  {selectedErrorRate >= 0 ? "+" : ""}
                  {selectedErrorRate.toFixed(2)}%
                </div>
              </div>
            </div>
            {attributionError ? (
              <div className="text-xs text-[#ff9b9b]">{attributionError}</div>
            ) : null}
            {analysisStatus === "idle" ? (
              <div className="border border-dashed border-[#2a4a66] bg-[#0a1623] p-3 text-xs text-[#8fa2b6]">
                当前期间尚未生成深度归因，请点击上方按钮开始分析。
              </div>
            ) : null}
            {analysisStatus === "loading" ? (
              <div className="border border-[#2a4a66] bg-[#0a1623] p-3 text-xs text-[#b6c5d4]">
                正在抓取年报来源并执行科目映射，请稍候...
              </div>
            ) : null}
            {visibleAttribution ? (
              <div className="mt-2 border border-[#1d3448] bg-[#0a1623] p-2.5 space-y-2">
                <p className="text-xs text-[#d5dfeb]">{visibleAttribution.summary}</p>
                <p className="text-[11px] text-[var(--text-secondary)]">{visibleAttribution.source}</p>
                <div className="space-y-1">
                  {visibleAttribution.items.map((item) => (
                    <div
                      key={item.id}
                      className="border border-[#173047] bg-[#08111c] p-2 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[#d9e2ed]">{item.title}</span>
                        <span
                          className={`mono ${
                            item.impact >= 0 ? "text-[#a8f5b0]" : "text-[#ff9b9b]"
                          }`}
                        >
                          {item.impact >= 0 ? "+" : ""}
                          {item.impact.toFixed(1)}亿
                        </span>
                      </div>
                      <div className="text-[11px] text-[#9fb0c0] mt-1 space-y-0.5">
                        <div>
                          字段名：<span className="mono">{item.evidence.fieldName}</span>
                        </div>
                        <div>
                          原始值：<span className="mono">{item.evidence.rawValue}</span>
                        </div>
                        <div>
                          计算式：<span className="mono">{item.evidence.formula}</span>
                        </div>
                        <div>
                          来源：
                          <a
                            href={item.evidence.sourceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="mono text-[#87bdf0] underline ml-1"
                          >
                            原始公告链接
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
