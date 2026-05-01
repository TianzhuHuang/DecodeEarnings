import { NextRequest, NextResponse } from "next/server";
import {
  commodityCompanies,
  getCompanyDefaultInputs,
  getCompanyById,
} from "@/lib/model-data";
import { CompanyId } from "@/lib/types";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get("companyId") as CompanyId | null;

  if (companyId) {
    const company = getCompanyById(companyId);
    const base = getCompanyDefaultInputs(company);
    return NextResponse.json({
      companyId: company.id,
      companyName: company.name,
      ...base,
    });
  }

  const data = commodityCompanies.map((company) => ({
    companyId: company.id,
    companyName: company.name,
    ...getCompanyDefaultInputs(company),
  }));

  return NextResponse.json({ data });
}
