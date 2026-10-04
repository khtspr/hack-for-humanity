import { NextResponse } from "next/server";
import { getAmenities } from "../../../../lib/amenities";
import { getProperty } from "../../../../lib/data";

export async function GET(_request: Request, { params }: { params: Promise<{ propertyId: string }> }) {
  const { propertyId } = await params;
  if (!getProperty(propertyId)) return NextResponse.json({ error: "Unknown property" }, { status: 404 });
  return NextResponse.json(getAmenities(propertyId));
}
