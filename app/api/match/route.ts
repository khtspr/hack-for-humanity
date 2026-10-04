import { NextResponse } from "next/server";
import { matchProperties } from "../../../lib/matching";
import { parsePreferences } from "../../../lib/validate";

const MAX_BODY_CHARS = 16_000; // a full set of preferences is ~1 KB

// POST { preferences, propertyId? } → MatchResult[]  (runs on the server: geocoding + GTFS routing)
export async function POST(request: Request) {
  // JSON only. Other sites can't send application/json cross-origin without a CORS preflight (which we never approve),
  // so they can't make their visitors' browsers spend this route's geocoding/routing budget.
  const contentType = request.headers.get("content-type")?.split(";")[0].trim().toLowerCase();
  if (contentType !== "application/json") return NextResponse.json({ error: "Expected application/json" }, { status: 415 });
  const text = await request.text();
  if (text.length > MAX_BODY_CHARS) return NextResponse.json({ error: "Request too large" }, { status: 413 });
  let body: { preferences?: unknown; propertyId?: unknown } | null = null;
  try { body = JSON.parse(text); } catch {}
  const preferences = parsePreferences(body?.preferences);
  if (typeof preferences === "string") return NextResponse.json({ error: preferences }, { status: 400 });
  const propertyId = typeof body?.propertyId === "string" ? body.propertyId : undefined;
  return NextResponse.json(await matchProperties(preferences, propertyId));
}
