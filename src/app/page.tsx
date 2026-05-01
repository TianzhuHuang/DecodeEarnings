"use client";

import { useMemo, useState } from "react";
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
import { CompanySwitcher } from "@/components/sidebar/company-switcher";
import { calculateProfitByCompany } from "@/lib/calculators";
import { commodityCompanies, getCompanyById } from "@/lib/model-data";
import { CompanyId, VariableMeta } from "@/lib/types";

export default function Home() {
  const [selectedCompanyId, setSelectedCompanyId] = useState<CompanyId>("zijin");
  const selectedCompany = getCompanyById(selectedCompanyId);
  const baseRecord =
    selectedCompany.history.find(
      (row) => row.year === (selectedCompany.defaultBaseYear ?? 2025),
    ) ??
    selectedCompany.history.filter((row) => row.actualProfit > 0).at(-1) ??
    selectedCompany.history[selectedCompany.history.length - 1];
  const [forecastInputs, setForecastInputs] = useState<Record<string, number>>(() =>
    buildInitialForecastInputs(selectedCompanyId),
  );

  const historicalRows = useMemo(
    () =>
      [...selectedCompany.history]
        .filter((row) => !row.forecastEditable && row.actualProfit > 0)
        .sort((a, b) => a.year - b.year),
    [selectedCompany.history],
  );
  const coreVariables = useMemo(
    () => resolveCoreVariables(selectedCompany.variables, selectedCompany.coreVariableKeys),
    [selectedCompany.coreVariableKeys, selectedCompany.variables],
  );
  const priceVariables = useMemo(
    () =>
      coreVariables.filter((variable) =>
        /(price|brent|油价|价格|金价|铜价|锂价)/i.test(
          `${variable.key}-${variable.label}-${variable.unit}`,
        ),
      ),
    [coreVariables],
  );
  const predictedProfit = useMemo(
    () => calculateProfitByCompany(selectedCompany.id, forecastInputs),
    [forecastInputs, selectedCompany.id],
  );
  const defaultPe =
    selectedCompany.id === "cnooc" ? 8.5 : selectedCompany.id === "zijin" ? 12 : 22;
  const currentValuation = predictedProfit * defaultPe;
  const baselineProfit = baseRecord.actualProfit > 0 ? baseRecord.actualProfit : 0;
  const profitChangePct =
    baselineProfit > 0 ? ((predictedProfit - baselineProfit) / baselineProfit) * 100 : 0;
  const trendData = historicalRows.map((row) => {
    const values: Record<string, number | string | null> = {
      period: row.periodLabel,
      netProfit: row.actualProfit,
    };
    for (const variable of priceVariables) {
      values[variable.key] = row.inputs[variable.key] ?? null;
    }
    return values;
  });

  const switchCompany = (companyId: CompanyId) => {
    setSelectedCompanyId(companyId);
    setForecastInputs(buildInitialForecastInputs(companyId));
  };

  return (
    <div className="min-h-screen">
      <header className="terminal-nav h-10 flex items-center justify-between px-3">
        <div className="flex items-center gap-5">
          <div className="mono text-[var(--accent)] text-sm font-semibold">Commodities Terminal</div>
          <nav className="mono text-[11px] text-[var(--text-secondary)] flex items-center gap-4">
            <span className="text-white border-b border-[var(--accent)] pb-0.5">净利润主看板</span>
            <span>历史数据</span>
            <span>价格走势</span>
          </nav>
        </div>
        <div className="mono text-[11px] text-[var(--text-secondary)]">
          目标：通过大宗价格判断当年净利润
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-[208px_minmax(0,1fr)] gap-0">
        <CompanySwitcher
          companies={commodityCompanies}
          selectedId={selectedCompanyId}
          onSelect={switchCompany}
        />
        <main className="p-4 md:p-5 space-y-4">
          <section className="card p-4">
            <div className="flex items-center justify-between">
              <h2 className="panel-title">当年净利润预测（基于当前大宗输入）</h2>
              <span className="mono text-xs text-[var(--text-secondary)]">
                基准对比：{baseRecord.periodLabel}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
              <StatCard
                label="预测归母净利润"
                value={`¥${predictedProfit.toFixed(1)} 亿`}
                accent="text-[var(--accent)]"
              />
              <StatCard
                label="较基准年净利润变化"
                value={`${profitChangePct >= 0 ? "+" : ""}${profitChangePct.toFixed(1)}%`}
                accent={profitChangePct >= 0 ? "text-[#a8f5b0]" : "text-[#ff9b9b]"}
              />
              <StatCard
                label={`当前估值（约，PE=${defaultPe.toFixed(1)}x）`}
                value={`¥${currentValuation.toFixed(0)} 亿`}
                accent="text-[#a8f5b0]"
              />
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {coreVariables.map((variable) => (
                <label
                  key={variable.key}
                  className="border border-[#1d3448] bg-[#0a1623] p-3 space-y-2"
                >
                  <div className="text-xs text-[#b9cad9]">{variable.label}</div>
                  <input
                    type="number"
                    min={variable.min}
                    max={variable.max}
                    step={variable.step}
                    value={forecastInputs[variable.key] ?? 0}
                    onChange={(event) =>
                      setForecastInputs((prev) => ({
                        ...prev,
                        [variable.key]: Number(event.target.value) || 0,
                      }))
                    }
                    className="w-full p-2 text-sm bg-[#0b1522] border border-[#2b4359] mono"
                  />
                  <div className="text-[11px] text-[var(--text-secondary)]">
                    区间 {variable.min} - {variable.max} {variable.unit}
                  </div>
                </label>
              ))}
            </div>
          </section>

          <section className="card p-4">
            <h2 className="panel-title">区域 1：历史年度关键数据</h2>
            <p className="text-xs text-[var(--text-secondary)] mt-2">
              重点展示核心驱动变量（产量、关键价格、成本）与年报净利润，支持用户快速做年度对比。
            </p>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-xs border border-[#244663] min-w-[980px]">
                <thead className="bg-[#161b20]">
                  <tr>
                    <th className="text-left p-2">期间</th>
                    {coreVariables.map((variable) => (
                      <th key={variable.key} className="text-left p-2 whitespace-nowrap">
                        {variable.label}
                        {variable.unit ? ` (${variable.unit})` : ""}
                      </th>
                    ))}
                    <th className="text-left p-2 whitespace-nowrap">年报净利润 (亿元)</th>
                  </tr>
                </thead>
                <tbody>
                  {historicalRows.map((row) => (
                    <tr
                      key={row.periodKey}
                      className="border-t border-[#1e3347] bg-[#08131f] hover:bg-[#0f2233]"
                    >
                      <td className="p-2 mono text-[var(--accent)]">{row.periodLabel}</td>
                      {coreVariables.map((variable) => (
                        <td key={`${row.periodKey}-${variable.key}`} className="p-2 mono">
                          {Number(row.inputs[variable.key] ?? 0).toLocaleString()}
                        </td>
                      ))}
                      <td className="p-2 mono text-[#a8f5b0]">{row.actualProfit.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="card p-4">
            <h2 className="panel-title">区域 2：当前大宗价格走势</h2>
            <p className="text-xs text-[var(--text-secondary)] mt-2">
              关注核心价格因子走势，并结合上方输入框调整当前假设，判断当年净利润方向。
            </p>
            <div className="mt-3 h-80 border border-[#17324a] bg-[#08131f] p-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid stroke="#17324a" strokeDasharray="3 3" />
                  <XAxis dataKey="period" tick={{ fill: "#6f8298", fontSize: 11 }} />
                  <YAxis tick={{ fill: "#6f8298", fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0a1421",
                      border: "1px solid #244663",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                  {priceVariables.map((variable, index) => (
                    <Line
                      key={variable.key}
                      type="monotone"
                      dataKey={variable.key}
                      name={variable.label}
                      stroke={linePalette[index % linePalette.length]}
                      strokeWidth={2}
                      dot={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

const linePalette = ["#59a7ff", "#a8f5b0", "#ffc857", "#d39dff", "#ff9f9f"];

function resolveCoreVariables(variables: VariableMeta[], coreVariableKeys?: string[]) {
  if (!coreVariableKeys?.length) {
    return variables.filter((variable) => variable.isCore).slice(0, 6);
  }
  const keySet = new Set(coreVariableKeys);
  return variables.filter((variable) => keySet.has(variable.key));
}

function buildInitialForecastInputs(companyId: CompanyId) {
  const company = getCompanyById(companyId);
  const forecastRecord = company.history.find((row) => row.forecastEditable);
  const baseRecord =
    company.history.find((row) => row.year === (company.defaultBaseYear ?? 2025)) ??
    company.history.filter((row) => row.actualProfit > 0).at(-1) ??
    company.history[company.history.length - 1];

  return {
    ...baseRecord.inputs,
    ...(forecastRecord?.inputs ?? {}),
    ...(forecastRecord?.calibratedInputs ?? {}),
  };
}

function StatCard({
  label,
  value,
  accent = "text-[#dbe8f5]",
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="border border-[#1d3448] p-2 bg-[#0a1623]">
      <div className="text-[11px] text-[var(--text-secondary)]">{label}</div>
      <div className={`mono text-sm mt-1 ${accent}`}>{value}</div>
    </div>
  );
}
