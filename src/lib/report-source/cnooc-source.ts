export interface CnoocReportSource {
  year: number;
  reportUrl: string;
  extractedAt: string;
}

const annualReportPage = "https://www.cnoocltd.com/col/col6391/index.html";

const fallbackReportUrls: Record<number, string> = {
  2023: "https://www.cnoocltd.com/art/2024/3/21/art_6391_1731452.html",
  2022: "https://www.cnoocltd.com/art/2023/3/30/art_6391_1679622.html",
};

export async function fetchCnoocAnnualReportSource(
  year: number,
): Promise<CnoocReportSource> {
  try {
    const response = await fetch(annualReportPage, {
      headers: { "User-Agent": "ParametricEarningsBot/1.0" },
      cache: "no-store",
    });
    const html = await response.text();
    const yearMatcher = new RegExp(
      `${year}[^\\n]{0,160}?https?:\\/\\/[^"\\s]+`,
      "i",
    );
    const match = html.match(yearMatcher);
    const foundUrl =
      match?.[0]?.match(/https?:\/\/[^"\s]+/i)?.[0] ??
      fallbackReportUrls[year] ??
      annualReportPage;

    return {
      year,
      reportUrl: foundUrl,
      extractedAt: new Date().toISOString(),
    };
  } catch {
    return {
      year,
      reportUrl: fallbackReportUrls[year] ?? annualReportPage,
      extractedAt: new Date().toISOString(),
    };
  }
}
