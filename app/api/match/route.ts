import { NextResponse } from "next/server";
import { matchProperties } from "../../../lib/matching";
import type { Preferences } from "../../../lib/types";

// POST { preferences, propertyId? } → MatchResult[]  (runs on the server: geocoding + GTFS routing)
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { preferences?: Preferences; propertyId?: string } | null;
  const preferences = body?.preferences;
  if (!preferences || !Array.isArray(preferences.destinations) || !Array.isArray(preferences.transportModes)) {
    return NextResponse.json({ error: "Expected { preferences }" }, { status: 400 });
  }
  return NextResponse.json(await matchProperties(preferences, body?.propertyId));
}
