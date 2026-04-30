import "katex/dist/katex.min.css";
import { InlineMath } from "react-katex";
import { CompanyModel } from "@/lib/types";

interface Props {
  company: CompanyModel;
  activeVariableKey?: string | null;
}

export function FormulaPanel({ company, activeVariableKey }: Props) {
  const symbolMap: Record<string, string> =
    company.id === "zijin"
      ? {
          goldOutputTon: "G",
          goldPrice: "P_g",
          kg: "K_g",
          copperOutput10kTon: "C",
          copperPrice: "P_c",
          kc: "K_c",
          otherContribution: "O",
        }
      : company.id === "cnooc"
        ? {
            revenue: "R",
            operatingCost: "C_o",
            dda: "D",
            explorationExpense: "E",
            periodExpense: "S",
            fxInvestSubsidy: "F",
            impairment: "I",
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
      "\\text{归母净利润} = \\frac{\\color{#7DFF8A}{G}\\times10^6\\times\\color{#66E0FF}{P_g}\\times\\color{#C7A7FF}{K_g}}{10^8}+\\frac{\\color{#FFD166}{C}\\times10^4\\times\\color{#FF8FAB}{P_c}\\times\\color{#9EF01A}{K_c}}{10^8}+\\color{#B8F2E6}{O}",
    cnooc:
      "\\text{归母净利润}=(\\color{#7DFF8A}{R}-\\color{#66E0FF}{C_o}-\\color{#C7A7FF}{D}-\\color{#FFD166}{E}-\\color{#FF8FAB}{S}\\pm\\color{#9EF01A}{F}-\\color{#B8F2E6}{I})\\times(1-\\color{#7DFF8A}{T})-\\color{#66E0FF}{N}",
    moutai:
      "\\text{归母净利润}=((\\color{#7DFF8A}{A_1}\\color{#66E0FF}{A_2}\\color{#C7A7FF}{B_1}+\\color{#FFD166}{A_3}\\color{#FF8FAB}{A_4}\\color{#9EF01A}{B_2})-(\\color{#7DFF8A}{A_1}\\color{#66E0FF}{A_2}+\\color{#FFD166}{A_3}\\color{#FF8FAB}{A_4})\\color{#B8F2E6}{B_3}-(\\color{#7DFF8A}{A_1}\\color{#66E0FF}{A_2}+\\color{#FFD166}{A_3}\\color{#FF8FAB}{A_4})\\color{#7DFF8A}{B_4}+\\color{#66E0FF}{C_1})(1-\\color{#C7A7FF}{C_2})-\\color{#FFD166}{C_3}",
  };

  const threeStepFormulaByCompany: Record<
    CompanyModel["id"],
    { revenue: string; cost: string; netProfit: string }
  > = {
    zijin: {
      revenue:
        "\\text{营业收入}=G\\times10^6\\times P_g + C\\times10^4\\times P_c + L\\times10^4\\times P_l + \\text{其他收入}",
      cost:
        "\\text{营业成本}=\\text{营业收入}-\\left(G\\times10^6\\times P_g\\times K_G+C\\times10^4\\times P_c\\times K_C+L\\times10^4\\times P_l\\times K_L+\\text{其他利润}\\right)",
      netProfit:
        "\\text{归母净利润}=\\frac{\\text{营业收入}-\\text{营业成本}}{10^8}",
    },
    cnooc: {
      revenue:
        "\\text{营业收入}=Q_{油}\\times P_{油}+Q_{气}\\times P_{气}",
      cost:
        "\\text{营业成本}=\\text{操作成本}+DD\\&A+\\text{勘探费}+\\text{税金附加}+\\text{期间费用}+\\text{资产减值}",
      netProfit:
        "\\text{归母净利润}=(\\text{营业收入}-\\text{营业成本}+\\text{汇兑/投资/补贴})\\times(1-\\text{实际税率})-\\text{少数股东损益}",
    },
    moutai: {
      revenue: "\\text{营业收入}=A_1A_2+A_3A_4",
      cost:
        "\\text{营业成本}=(A_1A_2+A_3A_4)\\times(1-B_1^*)+(A_1A_2+A_3A_4)\\times B_3+(A_1A_2+A_3A_4)\\times B_4",
      netProfit:
        "\\text{归母净利润}=((A_1A_2B_1+A_3A_4B_2)-(A_1A_2+A_3A_4)B_3-(A_1A_2+A_3A_4)B_4+C_1)\\times(1-C_2)-C_3",
    },
  };

  return (
    <section className="card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="panel-title">估值模型结构</h2>
        <span className="mono text-[11px] px-2 py-1 border border-[#1d7f39] bg-[#0f2415] text-[var(--accent)]">
          v1 Prototype
        </span>
      </div>
      <div className="text-lg md:text-xl overflow-x-auto py-2 text-[#d7e0ea]">
        <InlineMath math={coloredFormulaByCompany[company.id] ?? company.formulaLatex} />
      </div>
      <div className="border border-[#1a3248] bg-[#08121d] p-3 space-y-2">
        <p className="mono text-[11px] text-[var(--text-secondary)]">三段式结构（收入 / 成本 / 归母）</p>
        <div className="space-y-1.5 text-xs text-[#cdd9e5]">
          <div className="overflow-x-auto">
            <InlineMath math={threeStepFormulaByCompany[company.id].revenue} />
          </div>
          <div className="overflow-x-auto">
            <InlineMath math={threeStepFormulaByCompany[company.id].cost} />
          </div>
          <div className="overflow-x-auto">
            <InlineMath math={threeStepFormulaByCompany[company.id].netProfit} />
          </div>
        </div>
      </div>
      <div className="border border-[#1a3248] bg-[#091522] p-3">
        <p className="mono text-[11px] text-[var(--text-secondary)] mb-2">
          公式符号对应参数
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
          {company.variables.map((variable, index) => (
            <div
              key={`symbol-${variable.key}`}
              className={`group relative flex items-center gap-2 text-sm border px-2 py-1.5 ${
                activeVariableKey === variable.key
                  ? "border-[var(--accent)] bg-[#122131]"
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
          ))}
        </div>
      </div>
      {company.id === "zijin" ? (
        <div className="border border-[#1a3248] bg-[#08121d] p-3 space-y-2">
          <p className="mono text-[11px] text-[var(--text-secondary)]">紫金 K 系数说明</p>
          <p className="text-xs text-[#d7e0ea]">
            K 系数定义：<span className="mono">K = 毛利率 × (1 - 期间费用率) × 归母比例</span>，
            表示每 1 元产品收入最终转化为归母净利润的比例。<span className="mono">K_G</span>用于金业务，
            <span className="mono">K_C</span>用于铜业务。
          </p>
          <div className="mono text-[11px] text-[#9fb0c0] space-y-1">
            <p>金归母利润(亿) = 金产量(吨) × 1,000,000 × 金价(元/克) × K_G ÷ 100,000,000</p>
            <p>铜归母利润(亿) = 铜产量(万吨) × 10,000 × 铜价(元/吨) × K_C ÷ 100,000,000</p>
            <p>归母净利润(亿) = 金利润 + 铜利润 + 其他贡献</p>
          </div>
        </div>
      ) : null}
      {company.id === "cnooc" ? (
        <div className="border border-[#1a3248] bg-[#08121d] p-3 space-y-2">
          <p className="mono text-[11px] text-[var(--text-secondary)]">中国海油利润拆解说明</p>
          <div className="mono text-[11px] text-[#9fb0c0] space-y-1">
            <p>归母净利润 = (油气营业收入 - 操作成本 - DD&amp;A - 勘探费 - 期间费用 ± 汇兑/投资/补贴 - 资产减值) × (1 - 实际所得税率) - 少数股东损益</p>
            <p>R: 油气营业收入，C_o: 操作成本，D: DD&amp;A，E: 勘探费，S: 期间费用</p>
            <p>F: 汇兑/投资/补贴净额，I: 资产减值，T: 实际所得税率，N: 少数股东损益</p>
          </div>
        </div>
      ) : null}
    </section>
  );
}
