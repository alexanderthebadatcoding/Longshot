import { NextRequest, NextResponse } from "next/server";

// Simple in-memory cache (reset when the server restarts)
const cache: Record<string, { data: any; timestamp: number }> = {};
const CACHE_TTL = 1000 * 60 * 2; // 2 minutes

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.ODDS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const sport = searchParams.get("sport") || "upcoming";

    const cacheKey = sport;
    const now = Date.now();

    // ✅ Return cached data if still valid
    if (cache[cacheKey] && now - cache[cacheKey].timestamp < CACHE_TTL) {
      console.log(`[Cache hit] Returning cached data for ${cacheKey}`);
      return NextResponse.json(cache[cacheKey].data);
    }

    const endpoint =
      sport === "upcoming"
        ? `https://api.the-odds-api.com/v4/sports/upcoming/odds/`
        : `https://api.the-odds-api.com/v4/sports/${sport}/odds/`;

    const url = `${endpoint}?regions=us&markets=h2h,spreads,totals&bookmakers=fanduel&oddsFormat=american&dateFormat=iso&apiKey=${apiKey}`;

    console.log(`[API Fetch] Fetching fresh data for ${cacheKey}`);

    const response = await fetch(url, { next: { revalidate: 60 } });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("[API Error]", response.status, errorBody);
      return NextResponse.json(
        { error: "Failed to fetch odds data" },
        { status: response.status }
      );
    }

    const data = await response.json();

    // ✅ Store data in cache
    cache[cacheKey] = { data, timestamp: now };

    return NextResponse.json(data);
  } catch (error) {
    console.error("[Error fetching odds]:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching odds" },
      { status: 500 }
    );
  }
}
