"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { FormulaPanel } from "@/components/formula/formula-panel";
import { PredictionPanel } from "@/components/prediction/prediction-panel";
import { CompanySwitcher } from "@/components/sidebar/company-switcher";
import { calculateProfitByCompany } from "@/lib/calculators";
import { companies, getCompanyById } from "@/lib/model-data";
import { CompanyId } from "@/lib/types";

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
  const [inputs, setInputs] = useState<Record<string, number>>(
    selectedCompany.scenarios.base,
  );
  const [selectedPeriodKey, setSelectedPeriodKey] = useState<string>(
    selectedCompany.history[selectedCompany.history.length - 1].periodKey,
  );

  const latestActual = selectedCompany.history[selectedCompany.history.length - 1].actualProfit;
  const predictedProfit = useMemo(
    () => calculateProfitByCompany(selectedCompany.id, inputs),
    [selectedCompany.id, inputs],
  );
  const yoyChange = useMemo(
    () => ((predictedProfit - latestActual) / latestActual) * 100,
    [predictedProfit, latestActual],
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
  const [animatedProfit, setAnimatedProfit] = useState(predictedProfit);
  const previousProfitRef = useRef(predictedProfit);

  useEffect(() => {
    const from = previousProfitRef.current;
    const to = predictedProfit;
    const duration = 260;
    const start = performance.now();
    const id = requestAnimationFrame(function tick(now) {
      const progress = Math.min(1, (now - start) / duration);
      const value = from + (to - from) * progress;
      setAnimatedProfit(value);
      if (progress < 1) requestAnimationFrame(tick);
    });
    previousProfitRef.current = to;
    return () => cancelAnimationFrame(id);
  }, [predictedProfit]);

  const switchCompany = (id: CompanyId) => {
    const next = getCompanyById(id);
    setSelectedCompanyId(id);
    setInputs(next.scenarios.base);
    setSelectedPeriodKey(next.history[next.history.length - 1].periodKey);
  };

  const applyYearInputs = (periodKey: string) => {
    setSelectedPeriodKey(periodKey);
    const record = selectedCompany.history.find((item) => item.periodKey === periodKey);
    if (record) {
      setInputs(record.inputs);
    }
  };

  return (
    <div className="min-h-screen">
      <header className="terminal-nav h-10 flex items-center justify-between px-3">
        <div className="flex items-center gap-5">
          <div className="mono text-[var(--accent)] text-sm font-semibold">终端壹号</div>
          <nav className="mono text-[11px] text-[var(--text-secondary)] flex items-center gap-4">
            <span>投资组合</span>
            <span className="text-white border-b border-[var(--accent)] pb-0.5">市场</span>
            <span>资讯</span>
            <span>预测</span>
          </nav>
        </div>
        <div className="mono text-[11px] text-[var(--text-secondary)]">输入股票代码...</div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-[208px_minmax(0,1fr)_320px] gap-0">
        <CompanySwitcher
          companies={companies}
          selectedId={selectedCompanyId}
          onSelect={switchCompany}
        />
        <main className="p-4 md:p-5 space-y-4">
          <FormulaPanel company={selectedCompany} activeVariableKey={activeVariableKey} />
          <ValidationPanel
            company={selectedCompany}
            selectedPeriodKey={selectedPeriodKey}
            onSelectPeriod={setSelectedPeriodKey}
            predictedProfit={predictedProfit}
          />
          <PredictionPanel
            variables={selectedCompany.variables}
            history={selectedCompany.history}
            selectedPeriodKey={selectedPeriodKey}
            onSelectPeriod={applyYearInputs}
            inputs={inputs}
            onChangeInput={(key, value) =>
              setInputs((prev) => ({ ...prev, [key]: Number.isNaN(value) ? 0 : value }))
            }
            onActivateVariable={setActiveVariableKey}
            onReset={() => setInputs(selectedCompany.scenarios.base)}
          />
        </main>
        <aside className="hidden xl:block p-4 md:p-5 pl-0">
          <div className="sticky top-14 space-y-4">
            <section className="card p-5 border-[#1f3f59]">
              <p className="mono text-xs uppercase tracking-[0.3em] text-[var(--text-secondary)]">
                Real-Time Forecast
              </p>
              <p className="mono text-4xl mt-4 text-[var(--accent)] transition-all">
                ¥{Math.round(animatedProfit * 100000000).toLocaleString()}
              </p>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">归母净利润 (人民币)</p>
              <div className="grid grid-cols-3 gap-2 mt-5">
                <StatCard label="预测每股收益" value={`¥${(predictedProfit / 260).toFixed(2)}`} />
                <StatCard label="同比变化" value={`${yoyChange > 0 ? "+" : ""}${yoyChange.toFixed(1)}%`} />
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
