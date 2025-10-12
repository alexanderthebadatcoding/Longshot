import { NextResponse } from "next/server"

export async function GET() {
  try {
    const apiKey = process.env.ODDS_API_KEY

    if (!apiKey) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 })
    }

    const url = `https://api.the-odds-api.com/v4/sports/upcoming/odds/?regions=us&markets=h2h,spreads,totals&bookmakers=fanduel&oddsFormat=american&dateFormat=iso&apiKey=${apiKey}`

    console.log("[v0] Fetching URL:", url)

    const response = await fetch(url, {
      next: { revalidate: 60 }, // Cache for 60 seconds
    })

    if (!response.ok) {
      const errorBody = await response.text()
      console.error("[v0] API Error:", response.status, errorBody)
      return NextResponse.json({ error: "Failed to fetch odds data" }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Error fetching odds:", error)
    return NextResponse.json({ error: "An error occurred while fetching odds" }, { status: 500 })
  }
}
