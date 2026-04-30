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
import { AttributionReport, CompanyModel } from "@/lib/types";

interface Props {
  company: CompanyModel;
  selectedPeriodKey: string;
  onSelectPeriod: (periodKey: string) => void;
  predictedProfit: number;
}

export function ValidationPanel({
  company,
  selectedPeriodKey,
  onSelectPeriod,
  predictedProfit,
}: Props) {
  const [loadingAttribution, setLoadingAttribution] = useState(false);
  const [attribution, setAttribution] = useState<AttributionReport | null>(null);
  const [attributionError, setAttributionError] = useState<string | null>(null);
  const [analyzedPeriodKey, setAnalyzedPeriodKey] = useState<string | null>(null);

  const selectedRecord =
    company.history.find((item) => item.periodKey === selectedPeriodKey) ??
    company.history[company.history.length - 1];
  const selectedDiff = selectedRecord.modelProfit - selectedRecord.actualProfit;
  const selectedErrorRate = (selectedDiff / selectedRecord.actualProfit) * 100;

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
    onSelectPeriod(periodKey);
    if (analyzedPeriodKey !== periodKey) {
      setAttributionError(null);
    }
  };

  const runAttribution = async () => {
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
          modelProfit: selectedRecord.modelProfit,
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
    ...company.history,
    {
      periodKey: "my-forecast",
      periodLabel: "我的预测",
      year: selectedRecord.year + 1,
      actualProfit: null,
      modelProfit: predictedProfit,
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
      <div className="validation-status-bar">
        <div className="validation-status-metrics">
          <span className="validation-chip">期间 {selectedRecord.periodLabel}</span>
          <span>
            模型净利润 <b className="mono text-[#a8f5b0]">{selectedRecord.modelProfit.toFixed(1)}亿</b>
          </span>
          <span>
            年报净利润 <b className="mono">{selectedRecord.actualProfit.toFixed(1)}亿</b>
          </span>
          <span>
            差异{" "}
            <b className={`mono ${selectedDiff >= 0 ? "text-[#a8f5b0]" : "text-[#ff9b9b]"}`}>
              {selectedDiff >= 0 ? "+" : ""}
              {selectedDiff.toFixed(1)}亿
            </b>
          </span>
          <span>
            误差率{" "}
            <b
              className={`mono ${
                selectedErrorRate >= 0 ? "text-[#a8f5b0]" : "text-[#ff9b9b]"
              }`}
            >
              {selectedErrorRate >= 0 ? "+" : ""}
              {selectedErrorRate.toFixed(2)}%
            </b>
          </span>
        </div>
        <button
          onClick={runAttribution}
          disabled={loadingAttribution}
          className={`validation-primary-cta ${
            analysisStatus === "success" ? "validation-primary-cta-success" : ""
          }`}
        >
          {loadingAttribution
            ? `分析中 ${selectedRecord.year}...`
            : analysisStatus === "success"
              ? `已分析 ${selectedRecord.periodLabel}，可重新分析`
              : "深度误差归因（年报）"}
        </button>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-0">
        <div className="xl:col-span-4 border-r border-[#17324a] p-4 space-y-3">
          <div className="h-56 border border-[#17324a] bg-[#08131f] p-2">
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
                <XAxis dataKey="periodLabel" tick={{ fill: "#6f8298", fontSize: 11 }} />
                <YAxis tick={{ fill: "#6f8298", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0a1421",
                    border: "1px solid #244663",
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
                  dataKey="modelProfit"
                  data={chartData.slice(-2)}
                  stroke="#59a7ff"
                  strokeDasharray="2 4"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="我的预测点"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2">
            <p className="mono text-[11px] uppercase text-[var(--text-secondary)]">
              回测误差率 %
            </p>
            <div className="grid grid-cols-5 gap-0.5">
              {company.history.map((record) => {
                const errorRate =
                  ((record.modelProfit - record.actualProfit) /
                    record.actualProfit) *
                  100;
                const opacity = Math.min(0.85, Math.max(0.2, Math.abs(errorRate) / 10));
                const isPositive = errorRate >= 0;
                return (
                  <button
                    key={record.year}
                    title={`${record.periodLabel}: ${errorRate.toFixed(2)}%`}
                    onClick={() => handleSelectPeriod(record.periodKey)}
                    style={{
                      backgroundColor: isPositive
                        ? `rgba(20, 100, 45, ${opacity})`
                        : `rgba(120, 28, 28, ${opacity})`,
                    }}
                    className={`h-8 border text-[11px] mono text-[#cbd7e3] ${
                      isPositive ? "border-green-800" : "border-red-800"
                    } ${
                      selectedPeriodKey === record.periodKey
                        ? "ring-1 ring-[var(--accent)]"
                        : ""
                    }`}
                  >
                    {record.periodLabel}
                  </button>
                );
              })}
            </div>
            <div className="grid grid-cols-1 gap-1 text-[11px] text-[var(--text-secondary)]">
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 border border-green-800 bg-green-900/60 inline-block" />
                绿色：模型高于年报（高估）
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 border border-red-800 bg-red-900/60 inline-block" />
                红色：模型低于年报（低估）
              </span>
            </div>
          </div>
        </div>

        <div className="xl:col-span-8 p-4">
          <div className="overflow-x-auto">
            <p className="mono text-[11px] uppercase text-[var(--text-secondary)] mb-2">
              年度参数总览（全年份）
            </p>
            <div className="mb-2 border border-[#244663] bg-[#0b1a2a] p-2 text-xs text-[#c4d0dd]">
              <span className="mono text-[var(--accent)]">{selectedRecord.periodLabel}</span>
              <span className="mx-2">|</span>
              模型净利润{" "}
              <span className="mono text-[#a8f5b0]">
                {selectedRecord.modelProfit.toFixed(1)}亿
              </span>
              <span className="mx-2">|</span>
              年报净利润{" "}
              <span className="mono">{selectedRecord.actualProfit.toFixed(1)}亿</span>
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
            </div>
            <table className="w-full text-xs border border-[#244663] min-w-[980px]">
          <thead className="bg-[#161b20]">
            <tr>
              <th className="text-left p-2">期间</th>
              {company.variables.map((variable) => (
                <th key={`h-${variable.key}`} className="text-left p-2 whitespace-nowrap">
                  {variable.label}
                  {variable.unit ? `(${variable.unit})` : ""}
                </th>
              ))}
              <th className="text-left p-2 whitespace-nowrap">模型净利润(亿元)</th>
              <th className="text-left p-2 whitespace-nowrap">年报净利润(亿元)</th>
              <th className="text-left p-2 whitespace-nowrap">公式误差(%)</th>
            </tr>
          </thead>
          <tbody>
            {company.history.map((record, index) => {
              const isLastTwo = index >= company.history.length - 2;

              return (
                <tr
                  key={`row-${record.periodKey}`}
                  onClick={() => handleSelectPeriod(record.periodKey)}
                  className={`border-t border-[#1e3347] cursor-pointer ${
                    selectedPeriodKey === record.periodKey
                      ? "bg-[#123049]"
                      : isLastTwo
                        ? "bg-[#0f2233]"
                        : "bg-[#08131f]"
                  }`}
                >
                  <td className="p-2 mono text-[var(--accent)]">{record.periodLabel}</td>
                  {company.variables.map((variable) => (
                    <td key={`${record.periodKey}-${variable.key}`} className="p-2 mono whitespace-nowrap">
                      {Number(record.inputs[variable.key] ?? 0).toLocaleString()}
                    </td>
                  ))}
                  <td className="p-2 mono text-[#a8f5b0]">{record.modelProfit.toFixed(1)}</td>
                  <td className="p-2 mono text-[#d9e0ea]">{record.actualProfit.toFixed(1)}</td>
                  <td
                    className={`p-2 mono ${
                      ((record.modelProfit - record.actualProfit) / record.actualProfit) * 100 >=
                      0
                        ? "text-[#a8f5b0]"
                        : "text-[#ff9b9b]"
                    }`}
                  >
                    {(
                      ((record.modelProfit - record.actualProfit) / record.actualProfit) *
                      100
                    ).toFixed(2)}
                    %
                  </td>
                </tr>
              );
            })}
          </tbody>
            </table>
            <p className="mt-2 text-[11px] text-[var(--text-secondary)]">
              注：最后两年使用深色高亮，当前点选年份使用更亮底色。
            </p>
          </div>
          <div className="mt-4 border border-[#244663] bg-[#08121d] p-3 space-y-2">
            <div className="flex items-center justify-between gap-3 border-b border-[#173047] pb-2">
              <p className="mono text-[11px] text-[var(--text-secondary)]">
                误差说明（{selectedRecord.periodLabel}）
              </p>
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
                  {selectedRecord.modelProfit.toFixed(1)} 亿
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
