export interface ZijinReportSource {
  year: number;
  reportUrl: string;
  extractedAt: string;
}

const annualReportPage = "https://www.zijinmining.com/investor/year-report.jsp";

const fallbackReportUrls: Record<number, string> = {
  2024:
    "https://www.zijinmining.com/upload/file/2025/04/25/3091791b98ac4361a5de4a3a393cec49.pdf",
  2023:
    "https://es.zijinmining.com/upload/file/2024/03/24/06690632bc7e4802a556630d7f8de918.pdf",
};

export async function fetchZijinAnnualReportSource(
  year: number,
): Promise<ZijinReportSource> {
  try {
    const response = await fetch(annualReportPage, {
      headers: {
        "User-Agent": "ParametricEarningsBot/1.0",
      },
      cache: "no-store",
    });
    const html = await response.text();
    const yearMatcher = new RegExp(
      `${year}[^\\n]{0,120}?https?:\\/\\/[^"\\s]+\\.pdf`,
      "i",
    );
    const match = html.match(yearMatcher);
    const foundUrl =
      match?.[0]?.match(/https?:\/\/[^"\s]+\.pdf/i)?.[0] ??
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
