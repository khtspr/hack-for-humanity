import { NextResponse } from "next/server";
import { getAmenities } from "../../../../lib/amenities";
import { getProperty } from "../../../../lib/data";

export async function GET(_request: Request, { params }: { params: { propertyId: string } }) {
  if (!getProperty(params.propertyId)) return NextResponse.json({ error: "Unknown property" }, { status: 404 });
  return NextResponse.json(getAmenities(params.propertyId));
}
