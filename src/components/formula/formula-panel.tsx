import "katex/dist/katex.min.css";
import { InlineMath } from "react-katex";
import { CompanyModel } from "@/lib/types";

interface Props {
  company: CompanyModel;
  activeVariableKey?: string | null;
  modifiedVariableKeys?: string[];
}

export function FormulaPanel({
  company,
  activeVariableKey,
  modifiedVariableKeys = [],
}: Props) {
  const symbolMap: Record<string, string> =
    company.id === "zijin"
      ? {
          goldOutputTon: "G",
          goldPrice: "P_g",
          copperOutput10kTon: "C",
          copperPrice: "P_c",
          lithiumOutput10kTon: "L",
          lithiumPrice: "P_l",
          otherContribution: "O",
        }
      : company.id === "cnooc"
        ? {
            productionMboe: "Q",
            brentPrice: "P",
            allInCostPerBoe: "C",
            fxRate: "FX",
            effectiveTaxRate: "T",
            minorityInterest: "N",
          }
        : {
            moutaiVolume: "A_1",
            moutaiPrice: "A_2",
            seriesVolume: "A_3",
            seriesPrice: "A_4",
            moutaiGrossMargin: "B_1",
            seriesGrossMargin: "B_2",
            taxAndSurchargeRate: "B_3",
            periodExpenseRate: "B_4",
            otherNetIncome: "C_1",
            incomeTaxRate: "C_2",
            minorityInterest: "C_3",
          };

  const symbolColors = [
    "text-[#7DFF8A]",
    "text-[#66E0FF]",
    "text-[#C7A7FF]",
    "text-[#FFD166]",
    "text-[#FF8FAB]",
    "text-[#9EF01A]",
    "text-[#B8F2E6]",
  ];

  const recentYears = [...company.history]
    .sort((a, b) => b.year - a.year)
    .slice(0, 5);

  const coloredFormulaByCompany: Record<CompanyModel["id"], string> = {
    zijin:
      "\\text{归母净利润} = \\text{净利润}+\\color{#B8F2E6}{O},\\ \\text{净利润}=(\\color{#7DFF8A}{G}\\times\\color{#66E0FF}{P_g}+\\color{#FFD166}{C}\\times\\color{#FF8FAB}{P_c}+\\color{#9EF01A}{L}\\times\\color{#B8F2E6}{P_l})\\times(1-\\text{综合成本系数})",
    cnooc:
      "\\text{归母净利润}=(\\color{#7DFF8A}{Q}\\times(\\color{#66E0FF}{P}-\\color{#C7A7FF}{C})\\times FX)\\times(1-T)-N",
    moutai:
      "\\text{归母净利润}=((\\color{#7DFF8A}{A_1}\\color{#66E0FF}{A_2}\\color{#C7A7FF}{B_1}+\\color{#FFD166}{A_3}\\color{#FF8FAB}{A_4}\\color{#9EF01A}{B_2})-(\\color{#7DFF8A}{A_1}\\color{#66E0FF}{A_2}+\\color{#FFD166}{A_3}\\color{#FF8FAB}{A_4})\\color{#B8F2E6}{B_3}-(\\color{#7DFF8A}{A_1}\\color{#66E0FF}{A_2}+\\color{#FFD166}{A_3}\\color{#FF8FAB}{A_4})\\color{#7DFF8A}{B_4}+\\color{#66E0FF}{C_1})(1-\\color{#C7A7FF}{C_2})-\\color{#FFD166}{C_3}",
  };
  const formulaCards = [
    { title: "收入", formula: company.simpleFormula?.revenue ?? "\\text{营业收入}=Q\\times P" },
    { title: "成本", formula: company.simpleFormula?.cost ?? "\\text{营业成本}=Q\\times C" },
    { title: "净利润", formula: company.simpleFormula?.netProfit ?? "\\text{净利润}=\\text{收入}-\\text{成本}" },
    {
      title: "归母净利润",
      formula:
        company.simpleFormula?.attributableProfit ??
        "\\text{归母净利润}=\\text{净利润}-\\text{少数股东损益}",
    },
  ];
  const coreVariables = company.variables.filter((variable) => variable.isCore);

  return (
    <section className="card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="panel-title">估值模型结构</h2>
        <span className="mono text-[11px] px-2 py-1 border border-[#1d7f39] bg-[#0f2415] text-[var(--accent)]">
          Commodity V2
        </span>
      </div>
      <div className="text-lg md:text-xl overflow-x-auto py-2 text-[#d7e0ea]">
        <InlineMath math={coloredFormulaByCompany[company.id] ?? company.formulaLatex} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2">
        {formulaCards.map((item) => (
          <div key={item.title} className="border border-[#1a3248] bg-[#08121d] p-3 space-y-2">
            <p className="mono text-[11px] text-[var(--text-secondary)]">{item.title}</p>
            <div className="text-xs text-[#cdd9e5] overflow-x-auto">
              <InlineMath math={item.formula} />
            </div>
          </div>
        ))}
      </div>
      <div className="border border-[#1a3248] bg-[#091522] p-3">
        <p className="mono text-[11px] text-[var(--text-secondary)] mb-2">核心参数映射</p>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
          {coreVariables.map((variable, index) => {
            const isFocused = activeVariableKey === variable.key;
            const isModified = modifiedVariableKeys.includes(variable.key);
            return (
              <div
                key={`symbol-${variable.key}`}
                className={`group relative flex items-center gap-2 text-sm border px-2 py-1.5 ${
                  isFocused
                    ? "border-[var(--accent)] bg-[#122131]"
                    : isModified
                      ? "border-[#2b8e4d] bg-[#0d1f17]"
                      : "border-[#173047] bg-[#0a1624]"
                }`}
              >
                <span
                  className={`mono min-w-10 text-center ${symbolColors[index % symbolColors.length]}`}
                >
                  {symbolMap[variable.key] ?? "-"}
                </span>
                <span className="text-[#d7e0ea]">{variable.label}</span>
                <span className="mono text-[10px] text-[var(--text-secondary)]">
                  {variable.unit ? `(${variable.unit})` : ""}
                </span>
                <span className="ml-auto mono text-[10px] text-[#8ea1b5] border border-[#244663] w-4 h-4 inline-flex items-center justify-center">
                  ?
                </span>
                <div className="hidden group-hover:block absolute z-20 top-full mt-1 left-0 w-[280px] border border-[#285274] bg-[#08121d] p-2.5 shadow-lg">
                  <p className="text-xs text-[#d7e0ea]">{variable.tooltip}</p>
                  <p className="mono text-[11px] text-[var(--text-secondary)] mt-2 mb-1">
                    最近5年参数值
                  </p>
                  <div className="space-y-1">
                    {recentYears.map((row) => (
                      <div
                        key={`${variable.key}-${row.periodKey}`}
                        className="flex justify-between text-[11px] mono text-[#9fb0c0]"
                      >
                        <span>{row.periodLabel}</span>
                        <span>
                          {Number(row.inputs[variable.key] ?? 0).toLocaleString()}
                          {variable.unit ? ` ${variable.unit}` : ""}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
