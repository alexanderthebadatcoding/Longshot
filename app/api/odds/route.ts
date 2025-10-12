import { NextResponse } from "next/server"

export async function GET() {
  try {
    const apiKey = process.env.ODDS_API_KEY

    if (!apiKey) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 })
    }

    const response = await fetch(
      `https://api.the-odds-api.com/v4/sports/upcoming/odds/?regions=us&markets=h2h,spreads,totals&bookmakers=fanduel&oddsFormat=american&apiKey=${apiKey}`,
      {
        next: { revalidate: 60 }, // Cache for 60 seconds
      },
    )

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch odds data" }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching odds:", error)
    return NextResponse.json({ error: "An error occurred while fetching odds" }, { status: 500 })
  }
}
