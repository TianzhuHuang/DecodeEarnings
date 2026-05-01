import { CompanyId, CompanyModel } from "@/lib/types";
import Link from "next/link";

interface Props {
  companies: CompanyModel[];
  selectedId: CompanyId;
  onSelect: (id: CompanyId) => void;
}

export function CompanySwitcher({ companies, selectedId, onSelect }: Props) {
  return (
    <aside className="terminal-side w-full lg:w-52 lg:min-h-[calc(100vh-40px)] p-4 flex flex-col gap-4">
      <div className="border-b border-[#112337] pb-3">
        <p className="mono text-[11px] uppercase tracking-wider text-[var(--accent)] font-semibold">
          大宗商品终端
        </p>
        <p className="mono text-[10px] text-[var(--text-secondary)] mt-1">V2.4.0-STABLE</p>
      </div>
      <div className="space-y-1">
        {companies.map((company) => {
          const active = company.id === selectedId;
          return (
            <button
              key={company.id}
              onClick={() => onSelect(company.id)}
              className={`w-full text-left p-2.5 border transition text-sm ${
                active
                  ? "bg-[#071b2a] border-l-[var(--accent)] border-l-2 border-t-[#153148] border-r-[#153148] border-b-[#153148] text-[var(--accent)]"
                  : "bg-transparent border-transparent hover:bg-[#091522] text-[var(--text-secondary)]"
              }`}
            >
              <div className="font-medium">{company.name}</div>
            </button>
          );
        })}
      </div>
      <div className="border-t border-[#112337] pt-3">
        <Link
          href="/china-gold-international"
          className="block w-full text-left p-2.5 border border-[#1e415b] bg-[#0a1a2a] hover:border-[var(--accent)] text-sm text-[#c6d6e5]"
        >
          <div className="font-medium">中国黄金国际（子页面）</div>
        </Link>
      </div>
      <div className="mt-auto pt-3 border-t border-[#112337]">
        <button className="w-full bg-[#26c46a] text-[#031015] text-xs font-semibold py-2">
          导出数据
        </button>
      </div>
    </aside>
  );
}
