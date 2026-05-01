export interface ZijinReportSource {
  year: number;
  reportUrl: string;
  primarySourceUrl: string;
  verificationSourceUrl: string;
  sourceNote: string;
  extractedAt: string;
}

const cninfoBase = "https://www.cninfo.com.cn";
const sseBase = "https://www.sse.com.cn";
const eastmoneyApiBase = "https://datacenter.eastmoney.com/api/";

const allowedSourceHosts = [cninfoBase, sseBase, eastmoneyApiBase];

function sanitizeAllowedUrl(url: string) {
  if (allowedSourceHosts.some((host) => url.startsWith(host))) return url;
  return cninfoBase;
}

const fallbackReportUrls: Record<number, string> = {
  2024: `${cninfoBase}/`,
  2025: `${cninfoBase}/`,
  2026: `${cninfoBase}/`,
};

export async function fetchZijinAnnualReportSource(
  year: number,
): Promise<ZijinReportSource> {
  const reportUrl = sanitizeAllowedUrl(fallbackReportUrls[year] ?? cninfoBase);
  return {
    year,
    reportUrl,
    primarySourceUrl: cninfoBase,
    verificationSourceUrl: sseBase,
    sourceNote:
      "仅允许官方源：巨潮资讯（主）+ 上交所（校验）；东方财富仅可作结构化提速，不得覆盖主源值。",
    extractedAt: new Date().toISOString(),
  };
}
