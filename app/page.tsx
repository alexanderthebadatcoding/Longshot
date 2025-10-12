"use client"

import { useEffect, useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"

interface Bookmaker {
  key: string
  title: string
  markets: Market[]
}

interface Market {
  key: string
  outcomes: Outcome[]
}

interface Outcome {
  name: string
  price: number
  point?: number
}

interface Game {
  id: string
  sport_key: string
  sport_title: string
  commence_time: string
  home_team: string
  away_team: string
  bookmakers: Bookmaker[]
}

export default function SportsPage() {
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedSport, setSelectedSport] = useState<string>("all")
  const [oddsRange, setOddsRange] = useState<[number, number]>([-1000, 1000])

  useEffect(() => {
    async function fetchOdds() {
      try {
        const response = await fetch("/api/odds")

        if (!response.ok) {
          throw new Error("Failed to fetch odds data")
        }

        const data = await response.json()

        if (data.error) {
          throw new Error(data.error)
        }

        setGames(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchOdds()
  }, [])

  const availableSports = useMemo(() => {
    const sports = games.map((game) => ({
      key: game.sport_key,
      title: game.sport_title,
    }))
    const uniqueSports = Array.from(new Map(sports.map((s) => [s.key, s])).values())
    return uniqueSports.sort((a, b) => a.title.localeCompare(b.title))
  }, [games])

  const filteredGames = useMemo(() => {
    return games.filter((game) => {
      if (game.bookmakers.length === 0) {
        return false
      }

      if (selectedSport !== "all" && game.sport_key !== selectedSport) {
        return false
      }
      return true
    })
  }, [games, selectedSport])

  const hasOddsInRange = (game: Game) => {
    return game.bookmakers.some((bookmaker) =>
      bookmaker.markets.some((market) =>
        market.outcomes.some((outcome) => outcome.price >= oddsRange[0] && outcome.price <= oddsRange[1]),
      ),
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading odds data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
            <CardDescription>Failed to load odds data</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-balance">Longshot</h1>
          <p className="text-muted-foreground text-lg">Live odds for upcoming games across all sports</p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Customize your odds view</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Sport</label>
              <Select value={selectedSport} onValueChange={setSelectedSport}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a sport" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sports</SelectItem>
                  {availableSports.map((sport) => (
                    <SelectItem key={sport.key} value={sport.key}>
                      {sport.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Odds Range (Risk Level)</label>
                <span className="text-sm text-muted-foreground">
                  {oddsRange[0]} to +{oddsRange[1]}
                </span>
              </div>
              <Slider
                min={-1500}
                max={1500}
                step={50}
                value={oddsRange}
                onValueChange={(value) => setOddsRange(value as [number, number])}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Low Stake (-1500)</span>
                <span>Risky (+1500)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {filteredGames.length > 0 && (
          <p className="text-sm text-muted-foreground mb-4">
            Showing {filteredGames.length} of {games.length} games
          </p>
        )}

        <div className="grid grid-cols-1 gap-6">
          {filteredGames.map((game) => {
            const inRange = hasOddsInRange(game)
            return (
              <Card
                key={game.id}
                className={`hover:shadow-lg transition-shadow ${!inRange ? "opacity-40 pointer-events-none" : ""}`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <CardTitle className="text-2xl mb-1">
                        {game.away_team} @ {game.home_team}
                      </CardTitle>
                      <CardDescription>
                        {new Date(game.commence_time).toLocaleString(undefined, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </CardDescription>
                    </div>
                    <Badge variant="outline">{game.sport_title}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {game.bookmakers.length > 0 ? (
                    <div className="space-y-6">
                      {game.bookmakers.slice(0, 3).map((bookmaker) => (
                        <div key={bookmaker.key} className="space-y-3">
                          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                            {bookmaker.title}
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {bookmaker.markets.map((market) => (
                              <div key={market.key} className="space-y-2">
                                <p className="text-xs font-medium text-muted-foreground uppercase">
                                  {market.key === "h2h" ? "Moneyline" : market.key === "spreads" ? "Spread" : "Totals"}
                                </p>
                                <div className="space-y-1">
                                  {market.outcomes.map((outcome, idx) => (
                                    <div
                                      key={idx}
                                      className="flex justify-between items-center bg-muted/50 rounded px-3 py-2"
                                    >
                                      <span className="text-sm font-medium">
                                        {outcome.name}
                                        {outcome.point !== undefined && (
                                          <span className="text-muted-foreground ml-1">
                                            ({outcome.point > 0 ? "+" : ""}
                                            {outcome.point})
                                          </span>
                                        )}
                                      </span>
                                      <span className="text-sm font-bold">
                                        {outcome.price > 0 ? "+" : ""}
                                        {outcome.price}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                      {game.bookmakers.length > 3 && (
                        <p className="text-xs text-muted-foreground text-center pt-2">
                          +{game.bookmakers.length - 3} more bookmakers available
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No odds available</p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {filteredGames.length === 0 && games.length > 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No games match your filters</p>
              <p className="text-sm text-muted-foreground mt-2">Try adjusting your sport or odds range</p>
            </CardContent>
          </Card>
        )}

        {games.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No upcoming games available</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
