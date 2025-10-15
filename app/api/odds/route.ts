import { NextRequest, NextResponse } from "next/server";

// Simple in-memory cache (reset when the server restarts)
const cache: Record<string, { data: any; timestamp: number }> = {};
const CACHE_TTL = 1000 * 60 * 3; // 3 minutes (scores don't update as frequently)

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Required: sport and league
    const sport = searchParams.get("sport") || "football"; // football, baseball, basketball, hockey, soccer
    const league = searchParams.get("league") || "college-football"; // nfl, college-football, mlb, nba, nhl, etc.

    // Optional: Allow filtering by week, season type, or year
    const year = searchParams.get("year") || "";
    const week = searchParams.get("week") || "";
    const seasonType = searchParams.get("seasonType") || ""; // 2 = regular season, 3 = postseason
    const groups = searchParams.get("groups") || ""; // 80 = FBS, 81 = FCS (CFB only)
    const dates = searchParams.get("dates") || ""; // YYYYMMDD format for specific date
    const limit = searchParams.get("limit") || ""; // Limit number of results

    // Build cache key from params
    const cacheKey = `${sport}-${league}-${year}-${week}-${seasonType}-${groups}-${dates}-${limit}`;
    const now = Date.now();

    // ✅ Return cached data if still valid
    if (cache[cacheKey] && now - cache[cacheKey].timestamp < CACHE_TTL) {
      console.log(`[Cache hit] Returning cached data for ${cacheKey}`);
      return NextResponse.json(cache[cacheKey].data);
    }

    // Build ESPN API URL dynamically based on sport and league
    let url = `https://site.api.espn.com/apis/site/v2/sports/${sport}/${league}/scoreboard`;
    const params = new URLSearchParams();
    console.log(`[API Fetch] Fetching fresh data from ESPN: ${url}`);

    const response = await fetch(url, {
      next: { revalidate: 60 },
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("[ESPN API Error]", response.status, errorBody);
      return NextResponse.json(
        { error: "Failed to fetch ESPN scoreboard data" },
        { status: response.status }
      );
    }

    const data = await response.json();

    // ✅ Store data in cache
    cache[cacheKey] = { data, timestamp: now };

    return NextResponse.json(data);
  } catch (error) {
    console.error("[Error fetching ESPN scoreboard]:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching scoreboard data" },
      { status: 500 }
    );
  }
}
