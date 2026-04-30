import { NextRequest, NextResponse } from "next/server";
import { buildAnnualAttribution } from "@/lib/attribution";
import { CompanyId } from "@/lib/types";

interface Payload {
  companyId: CompanyId;
  year: number;
  modelProfit: number;
  actualProfit: number;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<Payload>;
    if (
      !body.companyId ||
      typeof body.year !== "number" ||
      typeof body.modelProfit !== "number" ||
      typeof body.actualProfit !== "number"
    ) {
      return NextResponse.json(
        { message: "Invalid payload." },
        { status: 400 },
      );
    }

    const report = await buildAnnualAttribution(body as Payload);
    return NextResponse.json(report);
  } catch {
    return NextResponse.json(
      { message: "Failed to build attribution report." },
      { status: 500 },
    );
  }
}
