"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
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
import { getChinaGoldInternationalHistory } from "@/lib/report-mapping/china-gold-international-mapping";

const defaultPe = 13.5;
const defaultTaxRate = 25;
const defaultOtherContribution = 12.5;

function calcProfit(inputs: {
  goldOutputTon: number;
  copperOutput10kTon: number;
  goldPrice: number;
  copperPrice: number;
  integratedCostRate: number;
  taxRate: number;
  otherContribution: number;
}) {
  const goldRevenue = (inputs.goldOutputTon * 1_000_000 * inputs.goldPrice) / 100_000_000;
  const copperRevenue =
    (inputs.copperOutput10kTon * 10_000 * inputs.copperPrice) / 100_000_000;
  const revenue = goldRevenue + copperRevenue;
  const cost = revenue * (inputs.integratedCostRate / 100);
  const preTaxProfit = revenue - cost + inputs.otherContribution;
  return preTaxProfit * (1 - inputs.taxRate / 100);
}

export default function ChinaGoldInternationalPage() {
  const historyRows = useMemo(() => getChinaGoldInternationalHistory(), []);
  const baseRecord = historyRows[historyRows.length - 1];
  const [forecastInputs, setForecastInputs] = useState({
    goldOutputTon: baseRecord.goldOutputTon,
    copperOutput10kTon: baseRecord.copperOutput10kTon,
    goldPrice: baseRecord.goldPriceCnyPerGram,
    copperPrice: baseRecord.copperPriceCnyPerTon,
    integratedCostRate: baseRecord.integratedCostRate,
    taxRate: defaultTaxRate,
    otherContribution: defaultOtherContribution,
  });

  const predictedProfit = useMemo(() => calcProfit(forecastInputs), [forecastInputs]);
  const profitChangePct =
    baseRecord.netProfitReported !== 0
      ? ((predictedProfit - baseRecord.netProfitReported) / Math.abs(baseRecord.netProfitReported)) *
        100
      : 0;
  const currentValuation = predictedProfit * defaultPe;

  const trendData = historyRows.map((row) => ({
    period: row.periodLabel,
    goldPrice: row.goldPriceCnyPerGram,
    copperPrice: row.copperPriceCnyPerTon,
  }));

  return (
    <div className="min-h-screen">
      <header className="terminal-nav h-10 flex items-center justify-between px-3">
        <div className="flex items-center gap-5">
          <div className="mono text-[var(--accent)] text-sm font-semibold">
            中国黄金国际 - 子页面
          </div>
          <nav className="mono text-[11px] text-[var(--text-secondary)] flex items-center gap-4">
            <span className="text-white border-b border-[var(--accent)] pb-0.5">净利润主看板</span>
            <span>历史数据</span>
            <span>价格走势</span>
          </nav>
        </div>
        <Link
          href="/"
          className="mono text-[11px] text-[var(--text-secondary)] hover:text-[var(--accent)]"
        >
          返回主页面
        </Link>
      </header>

      <main className="p-4 md:p-5 space-y-4">
        <section className="card p-4">
          <div className="flex items-center justify-between">
            <h2 className="panel-title">当年净利润预测（基于当前大宗输入）</h2>
            <span className="mono text-xs text-[var(--text-secondary)]">
              基准对比：{baseRecord.periodLabel}
            </span>
          </div>
          <p className="text-[11px] text-[var(--text-secondary)] mt-2">
            数据口径：历史值来自中国黄金国际年度 MD&A/业绩公告（港股披露）；净利润按美元口径近似换算成人民币展示。
          </p>
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

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            <InputCard
              label="黄金产量"
              unit="吨"
              value={forecastInputs.goldOutputTon}
              min={20}
              max={120}
              step={0.1}
              onChange={(value) =>
                setForecastInputs((prev) => ({ ...prev, goldOutputTon: value }))
              }
            />
            <InputCard
              label="铜产量"
              unit="万吨"
              value={forecastInputs.copperOutput10kTon}
              min={0}
              max={20}
              step={0.1}
              onChange={(value) =>
                setForecastInputs((prev) => ({ ...prev, copperOutput10kTon: value }))
              }
            />
            <InputCard
              label="金价"
              unit="元/克"
              value={forecastInputs.goldPrice}
              min={250}
              max={1300}
              step={1}
              onChange={(value) =>
                setForecastInputs((prev) => ({ ...prev, goldPrice: value }))
              }
            />
            <InputCard
              label="铜价"
              unit="元/吨"
              value={forecastInputs.copperPrice}
              min={35000}
              max={150000}
              step={100}
              onChange={(value) =>
                setForecastInputs((prev) => ({ ...prev, copperPrice: value }))
              }
            />
            <InputCard
              label="综合成本率"
              unit="%"
              value={forecastInputs.integratedCostRate}
              min={35}
              max={80}
              step={0.1}
              onChange={(value) =>
                setForecastInputs((prev) => ({ ...prev, integratedCostRate: value }))
              }
            />
            <InputCard
              label="所得税率"
              unit="%"
              value={forecastInputs.taxRate}
              min={10}
              max={45}
              step={0.1}
              onChange={(value) =>
                setForecastInputs((prev) => ({ ...prev, taxRate: value }))
              }
            />
            <InputCard
              label="其他贡献"
              unit="亿元"
              value={forecastInputs.otherContribution}
              min={-20}
              max={80}
              step={0.1}
              onChange={(value) =>
                setForecastInputs((prev) => ({ ...prev, otherContribution: value }))
              }
            />
          </div>
        </section>

        <section className="card p-4">
          <h2 className="panel-title">区域 1：历史年度关键数据</h2>
          <p className="text-xs text-[var(--text-secondary)] mt-2">
            重点展示产量、金价/铜价、成本率与年报净利润，支持快速判断利润弹性。
          </p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-xs border border-[#244663] min-w-[980px]">
              <thead className="bg-[#161b20]">
                <tr>
                  <th className="text-left p-2">期间</th>
                  <th className="text-left p-2">黄金产量 (吨)</th>
                  <th className="text-left p-2">铜产量 (万吨)</th>
                  <th className="text-left p-2">金价 (元/克)</th>
                  <th className="text-left p-2">铜价 (元/吨)</th>
                  <th className="text-left p-2">综合成本率 (%)</th>
                  <th className="text-left p-2">年报净利润 (亿元)</th>
                </tr>
              </thead>
              <tbody>
                {historyRows.map((row) => (
                  <tr
                    key={row.periodKey}
                    className="border-t border-[#1e3347] bg-[#08131f] hover:bg-[#0f2233]"
                  >
                    <td className="p-2 mono text-[var(--accent)]">{row.periodLabel}</td>
                    <td className="p-2 mono">{row.goldOutputTon.toLocaleString()}</td>
                    <td className="p-2 mono">{row.copperOutput10kTon.toLocaleString()}</td>
                    <td className="p-2 mono">{row.goldPriceCnyPerGram.toLocaleString()}</td>
                    <td className="p-2 mono">{row.copperPriceCnyPerTon.toLocaleString()}</td>
                    <td className="p-2 mono">{row.integratedCostRate.toFixed(1)}</td>
                    <td className="p-2 mono text-[#a8f5b0]">{row.netProfitReported.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-2 text-[11px] text-[var(--text-secondary)] space-y-1">
            <p>
              主源：
              <a
                className="underline ml-1 text-[#87bdf0]"
                href={baseRecord.reportUrl}
                target="_blank"
                rel="noreferrer"
              >
                年度 MD&A / 业绩公告
              </a>
            </p>
            <p>{baseRecord.sourceNote}</p>
          </div>
        </section>

        <section className="card p-4">
          <h2 className="panel-title">区域 2：当前大宗价格走势</h2>
          <p className="text-xs text-[var(--text-secondary)] mt-2">
            核心关注金价和铜价。价格端变化是判断当年净利润与估值方向的第一信号。
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
                <Line
                  type="monotone"
                  dataKey="goldPrice"
                  stroke="#ffc857"
                  strokeWidth={2}
                  dot={false}
                  name="金价"
                />
                <Line
                  type="monotone"
                  dataKey="copperPrice"
                  stroke="#59a7ff"
                  strokeWidth={2}
                  dot={false}
                  name="铜价"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      </main>
    </div>
  );
}

function InputCard({
  label,
  unit,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  unit: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="border border-[#1d3448] bg-[#0a1623] p-3 space-y-2">
      <div className="text-xs text-[#b9cad9]">{label}</div>
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value) || 0)}
        className="w-full p-2 text-sm bg-[#0b1522] border border-[#2b4359] mono"
      />
      <div className="text-[11px] text-[var(--text-secondary)]">
        区间 {min} - {max} {unit}
      </div>
    </label>
  );
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
