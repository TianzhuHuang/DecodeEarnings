import { VariableMeta, YearMetric } from "@/lib/types";

interface Props {
  variables: VariableMeta[];
  history: YearMetric[];
  selectedPeriodKey: string;
  onSelectPeriod: (periodKey: string) => void;
  inputs: Record<string, number>;
  onChangeInput: (key: string, value: number) => void;
  onActivateVariable: (key: string | null) => void;
  onReset: () => void;
}

export function PredictionPanel({
  variables,
  history,
  selectedPeriodKey,
  onSelectPeriod,
  inputs,
  onChangeInput,
  onActivateVariable,
  onReset,
}: Props) {
  return (
    <section className="card p-5">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="panel-title">可变参数</h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--text-secondary)]">期间</span>
            <select
              value={selectedPeriodKey}
              onChange={(event) => onSelectPeriod(event.target.value)}
              className="mono text-xs border border-[#2b4359] bg-[#0b1522] px-2 py-1"
            >
              {[...history]
                .sort((a, b) => b.year - a.year)
                .map((row) => (
                  <option key={`year-option-${row.periodKey}`} value={row.periodKey}>
                    {row.periodLabel}
                  </option>
                ))}
            </select>
          </div>
        </div>
        {variables.map((variable) => (
          <div
            key={variable.key}
            className="space-y-2"
            onMouseEnter={() => onActivateVariable(variable.key)}
            onMouseLeave={() => onActivateVariable(null)}
          >
            <div className="flex items-center justify-between text-sm">
              <span>{variable.label}</span>
              <span className="mono">
                {Number(inputs[variable.key] ?? 0).toLocaleString()} {variable.unit}
              </span>
            </div>
            <div className="flex gap-3 items-center">
              <input
                type="range"
                min={variable.min}
                max={variable.max}
                step={variable.step}
                value={inputs[variable.key] ?? variable.min}
                onChange={(event) =>
                  onChangeInput(variable.key, Number(event.target.value))
                }
                className="w-full"
              />
              <input
                type="number"
                value={inputs[variable.key] ?? variable.min}
                min={variable.min}
                max={variable.max}
                step={variable.step}
                onChange={(event) =>
                  onChangeInput(variable.key, Number(event.target.value))
                }
                className="w-28 p-1.5 text-sm bg-[#161a1f] border border-[#3a424a] mono"
              />
            </div>
            <div className="mono text-[10px] text-[var(--text-secondary)] flex justify-between">
              <span>历史低位 {Number(variable.fiveYearRange[0]).toLocaleString()}</span>
              <span>历史高位 {Number(variable.fiveYearRange[1]).toLocaleString()}</span>
            </div>
          </div>
        ))}
        <div>
          <button
            onClick={onReset}
            className="mt-2 px-4 py-2 text-sm border border-[#2b4359] bg-[#0b1522] hover:border-[var(--accent)]"
          >
            重置为中性参数
          </button>
        </div>
      </div>
    </section>
  );
}
