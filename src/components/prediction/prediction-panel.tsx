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
  const coreVariables = variables.filter((v) => v.isCore);
  const anchor2024 = history.find((row) => row.periodKey === "2024");
  const anchor2025 = history.find((row) => row.periodKey === "2025");

  const calcAnchorLeft = (value: number, variable: VariableMeta) => {
    if (variable.max === variable.min) return 0;
    return Math.min(
      100,
      Math.max(0, ((value - variable.min) / (variable.max - variable.min)) * 100),
    );
  };

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
        <div className="border border-[#1d3448] bg-[#0a1623] p-2 text-[11px] text-[var(--text-secondary)]">
          当前为核心参数模式（产量/价格/核心成本），非核心参数锁定为 2025 年报基准值。
        </div>
        {coreVariables.map((variable) => (
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
              <div className="w-full space-y-1">
                <div className="relative">
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
                  {anchor2024 ? (
                    <span
                      className="absolute -top-1 w-[1px] h-3 bg-[#4e89b8]"
                      style={{
                        left: `${calcAnchorLeft(
                          Number(anchor2024.inputs[variable.key] ?? variable.min),
                          variable,
                        )}%`,
                      }}
                    />
                  ) : null}
                  {anchor2025 ? (
                    <span
                      className="absolute -top-1 w-[1px] h-3 bg-[var(--accent)]"
                      style={{
                        left: `${calcAnchorLeft(
                          Number(anchor2025.inputs[variable.key] ?? variable.min),
                          variable,
                        )}%`,
                      }}
                    />
                  ) : null}
                </div>
                <div className="mono text-[10px] text-[var(--text-secondary)] flex justify-between">
                  <span>
                    2024: {Number(anchor2024?.inputs[variable.key] ?? 0).toLocaleString()}{" "}
                    {variable.unit}
                  </span>
                  <span>
                    2025: {Number(anchor2025?.inputs[variable.key] ?? 0).toLocaleString()}{" "}
                    {variable.unit}
                  </span>
                </div>
              </div>
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
              <span>
                历史低位 {Number(variable.fiveYearRange[0]).toLocaleString()} {variable.unit}
              </span>
              <span>
                历史高位 {Number(variable.fiveYearRange[1]).toLocaleString()} {variable.unit}
              </span>
            </div>
          </div>
        ))}
        <div>
          <button
            onClick={onReset}
            className="mt-2 px-4 py-2 text-sm border border-[#2b4359] bg-[#0b1522] hover:border-[var(--accent)]"
          >
            回填 2025 年报基准
          </button>
        </div>
      </div>
    </section>
  );
}
