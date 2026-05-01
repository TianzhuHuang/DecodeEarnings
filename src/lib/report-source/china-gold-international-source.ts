export interface ChinaGoldInternationalReportSource {
  year: number;
  reportUrl: string;
  extractedAt: string;
}

const fallbackReportUrls: Record<number, string> = {
  2024:
    "https://www.chinagoldintl.com/_resources/financials/2025/E-China-Gold-HK-Report-Q4-24.pdf?v=082105",
  2023:
    "https://www.chinagoldintl.com/_resources/financials/2024/E-China-Gold-HK-Report-Q4-23.pdf?v=050108",
  2022:
    "https://www.chinagoldintl.com/_resources/financials/2024/E-China-Gold-HK-Report-Q4-23.pdf?v=050108",
};

const annualIndexPage = "http://www.chinagoldintl.com/investors/financials/2024/";

export async function fetchChinaGoldInternationalReportSource(
  year: number,
): Promise<ChinaGoldInternationalReportSource> {
  return {
    year,
    reportUrl: fallbackReportUrls[year] ?? annualIndexPage,
    extractedAt: new Date().toISOString(),
  };
}
