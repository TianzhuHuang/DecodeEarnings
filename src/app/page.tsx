"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { FormulaPanel } from "@/components/formula/formula-panel";
import { CompanySwitcher } from "@/components/sidebar/company-switcher";
import { calculateBreakdownByCompany } from "@/lib/calculators";
import {
  commodityCompanies,
  editablePeriodKeys,
  getCompanyById,
  getCompanyDefaultInputs,
} from "@/lib/model-data";
import { CompanyId, TableEditValueMap } from "@/lib/types";
type PriceUnitMode = "cny" | "usd";

const ValidationPanel = dynamic(
  () =>
    import("@/components/validation/validation-panel").then(
      (mod) => mod.ValidationPanel,
    ),
  {
    ssr: false,
    loading: () => (
      <section className="card p-5 h-80 grid place-items-center text-sm text-[var(--text-secondary)]">
        图表加载中...
      </section>
    ),
  },
);

export default function Home() {
  const [selectedCompanyId, setSelectedCompanyId] = useState<CompanyId>("zijin");
  const selectedCompany = getCompanyById(selectedCompanyId);
  const buildPeriodInputMap = (companyId: CompanyId): TableEditValueMap => {
    const company = getCompanyById(companyId);
    return company.history.reduce<TableEditValueMap>((acc, item) => {
      acc[item.periodKey] = { ...item.inputs };
      return acc;
    }, {});
  };
  const baseDefaults = useMemo(
    () => getCompanyDefaultInputs(selectedCompany),
    [selectedCompany],
  );
  const [periodInputsMap, setPeriodInputsMap] = useState<TableEditValueMap>(
    buildPeriodInputMap(selectedCompanyId),
  );
  const [draftPeriodInputsMap, setDraftPeriodInputsMap] = useState<TableEditValueMap>(
    buildPeriodInputMap(selectedCompanyId),
  );
  const [priceUnitMode, setPriceUnitMode] = useState<PriceUnitMode>("cny");
  const [selectedPeriodKey, setSelectedPeriodKey] = useState<string>("2026FY");
  const selectedPeriodRecord =
    selectedCompany.history.find((item) => item.periodKey === selectedPeriodKey) ??
    selectedCompany.history[selectedCompany.history.length - 1];
  const inputs = periodInputsMap[selectedPeriodKey] ?? baseDefaults.inputs;
  const effectiveInputs = useMemo(
    () =>
      selectedPeriodRecord.forecastEditable
        ? inputs
        : { ...inputs, ...(selectedPeriodRecord.calibratedInputs ?? {}) },
    [inputs, selectedPeriodRecord.calibratedInputs, selectedPeriodRecord.forecastEditable],
  );

  const predictedBreakdown = useMemo(
    () => calculateBreakdownByCompany(selectedCompany.id, effectiveInputs),
    [effectiveInputs, selectedCompany.id],
  );
  const predictedProfit = predictedBreakdown.attributableProfit;
  const comparableActual =
    selectedCompany.history.find((row) => row.year === baseDefaults.baseYear)?.actualProfit ??
    selectedCompany.history[selectedCompany.history.length - 1].actualProfit;
  const yoyChange = useMemo(
    () => ((predictedProfit - comparableActual) / comparableActual) * 100,
    [predictedProfit, comparableActual],
  );
  const confidence = useMemo(() => {
    const averageError =
      selectedCompany.history.reduce((sum, item) => {
        const error = Math.abs(item.modelProfit - item.actualProfit) / item.actualProfit;
        return sum + error;
      }, 0) / selectedCompany.history.length;
    return Math.max(55, (1 - averageError) * 100);
  }, [selectedCompany.history]);
  const [activeVariableKey, setActiveVariableKey] = useState<string | null>(null);
  const [animatedBreakdown, setAnimatedBreakdown] = useState(predictedBreakdown);
  const previousBreakdownRef = useRef(predictedBreakdown);
  const [isRecomputing, setIsRecomputing] = useState(false);

  useEffect(() => {
    const from = previousBreakdownRef.current;
    const to = predictedBreakdown;
    setIsRecomputing(true);
    const duration = 260;
    const start = performance.now();
    const id = requestAnimationFrame(function tick(now) {
      const progress = Math.min(1, (now - start) / duration);
      setAnimatedBreakdown({
        revenue: from.revenue + (to.revenue - from.revenue) * progress,
        cost: from.cost + (to.cost - from.cost) * progress,
        netProfit: from.netProfit + (to.netProfit - from.netProfit) * progress,
        attributableProfit:
          from.attributableProfit +
          (to.attributableProfit - from.attributableProfit) * progress,
      });
      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        setIsRecomputing(false);
      }
    });
    previousBreakdownRef.current = to;
    return () => {
      cancelAnimationFrame(id);
      setIsRecomputing(false);
    };
  }, [predictedBreakdown]);

  const switchCompany = (id: CompanyId) => {
    const next = getCompanyById(id);
    const nextMap = buildPeriodInputMap(id);
    setSelectedCompanyId(id);
    setPeriodInputsMap(nextMap);
    setDraftPeriodInputsMap(nextMap);
    setSelectedPeriodKey(
      next.history.some((item) => item.periodKey === "2026FY")
        ? "2026FY"
        : (next.defaultBaseYear ?? 2025).toString(),
    );
  };
  const handleSubmitForecast = (periodKey: string) => {
    setPeriodInputsMap((prev) => ({
      ...prev,
      [periodKey]: { ...(draftPeriodInputsMap[periodKey] ?? {}) },
    }));
  };
  const hasDraftChanges = (periodKey: string) => {
    const draft = draftPeriodInputsMap[periodKey] ?? {};
    const committed = periodInputsMap[periodKey] ?? {};
    return selectedCompany.variables.some(
      (variable) => Number(draft[variable.key] ?? NaN) !== Number(committed[variable.key] ?? NaN),
    );
  };

  return (
    <div className="min-h-screen">
      <header className="terminal-nav h-10 flex items-center justify-between px-3">
        <div className="flex items-center gap-5">
          <div className="mono text-[var(--accent)] text-sm font-semibold">Commodities Terminal</div>
          <nav className="mono text-[11px] text-[var(--text-secondary)] flex items-center gap-4">
            <span>大宗商品</span>
            <span className="text-white border-b border-[var(--accent)] pb-0.5">利润预测</span>
            <span>回测验证</span>
            <span>情景推演</span>
          </nav>
        </div>
        <div className="mono text-[11px] text-[var(--text-secondary)]">输入股票代码...</div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-[208px_minmax(0,1fr)_320px] gap-0">
        <CompanySwitcher
          companies={commodityCompanies}
          selectedId={selectedCompanyId}
          onSelect={switchCompany}
        />
        <main className="p-4 md:p-5 space-y-4">
          <div className="flex justify-end">
            <button
              className="text-[11px] border border-[#2b4359] bg-[#0b1522] px-2 py-1 text-[#c7d6e4] hover:border-[var(--accent)]"
              onClick={() =>
                setPriceUnitMode((prev) => (prev === "cny" ? "usd" : "cny"))
              }
            >
              ↔ 金属价格单位：{priceUnitMode === "cny" ? "人民币" : "美元"}
            </button>
          </div>
          <FormulaPanel
            company={selectedCompany}
            activeVariableKey={activeVariableKey}
            modifiedVariableKeys={selectedCompany.variables
              .filter((variable) => variable.isCore)
              .filter(
                (variable) =>
                  Number(inputs[variable.key] ?? 0) !==
                  Number(baseDefaults.inputs[variable.key] ?? 0),
              )
              .map((variable) => variable.key)}
          />
          <ValidationPanel
            company={selectedCompany}
            selectedPeriodKey={selectedPeriodKey}
            onSelectPeriod={setSelectedPeriodKey}
            predictedProfit={predictedProfit}
            periodInputsMap={draftPeriodInputsMap}
            committedPeriodInputsMap={periodInputsMap}
            editablePeriodKeys={editablePeriodKeys}
            onChangeInput={(periodKey, variableKey, value) =>
              setDraftPeriodInputsMap((prev) => ({
                ...prev,
                [periodKey]: {
                  ...(prev[periodKey] ?? {}),
                  [variableKey]: Number.isNaN(value) ? 0 : value,
                },
              }))
            }
            onSubmitForecast={handleSubmitForecast}
            hasPendingForecastChanges={hasDraftChanges(selectedPeriodKey)}
            onActivateVariable={setActiveVariableKey}
            priceUnitMode={priceUnitMode}
          />
        </main>
        <aside className="hidden xl:block p-4 md:p-5 pl-0">
          <div className="sticky top-14 space-y-4">
            <section className="card p-5 border-[#1f3f59] bg-[#081723]">
              <p className="mono text-xs uppercase tracking-[0.3em] text-[var(--text-secondary)]">
                {selectedPeriodRecord.forecastEditable
                  ? "Real-Time Forecast"
                  : "Historical Recompute"}
              </p>
              <div className="mt-2">
                <button
                  className="text-[11px] border border-[#2b4359] bg-[#0b1522] px-2 py-1 text-[#c7d6e4] hover:border-[var(--accent)]"
                  onClick={() =>
                    setPriceUnitMode((prev) => (prev === "cny" ? "usd" : "cny"))
                  }
                >
                  ↔ 单位切换：{priceUnitMode === "cny" ? "人民币" : "美元"}
                </button>
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-2">
                当前期间：<span className="mono text-[#d5e5f3]">{selectedPeriodKey}</span>
              </p>
              <div className="mt-3 border border-[#254761] bg-[#0a1b2a] p-3">
                <div className="text-[12px] text-[#95b4cb]">归母净利润</div>
                <div
                  className={`mono text-[36px] leading-tight text-[var(--accent)] mt-1 transition-all duration-200 ${
                    isRecomputing ? "scale-[1.03] brightness-125" : "scale-100"
                  }`}
                >
                  ¥{animatedBreakdown.attributableProfit.toFixed(1)} 亿
                </div>
              </div>
              <div className="grid grid-cols-1 gap-2 mt-4">
                <StatCard
                  label="预测营收"
                  value={`¥${animatedBreakdown.revenue.toFixed(1)} 亿`}
                />
                <StatCard
                  label="预测成本"
                  value={`¥${animatedBreakdown.cost.toFixed(1)} 亿`}
                />
                <StatCard
                  label="预测净利润"
                  value={`¥${animatedBreakdown.netProfit.toFixed(1)} 亿`}
                />
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4">
                <StatCard label="同比(基准2025)" value={`${yoyChange > 0 ? "+" : ""}${yoyChange.toFixed(1)}%`} />
                <StatCard label="简化置信度" value={`${confidence.toFixed(1)}%`} />
              </div>
            </section>
            <section className="card p-4">
              <p className="panel-title">估值倍数预测</p>
              <p className="text-xs text-[var(--text-secondary)] mt-2">占位：下一步接入 PE/PB 情景预测。</p>
            </section>
            <section className="card p-4">
              <p className="panel-title">社区预测分布</p>
              <p className="text-xs text-[var(--text-secondary)] mt-2">占位：下一步接入用户预测分布曲线。</p>
            </section>
          </div>
        </aside>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-[#1d3448] p-2 bg-[#0a1623]">
      <div className="text-[11px] text-[var(--text-secondary)]">{label}</div>
      <div className="mono text-sm mt-1 text-[#dbe8f5]">{value}</div>
    </div>
  );
}
