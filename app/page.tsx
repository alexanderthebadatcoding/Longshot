"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

interface Bookmaker {
  key: string;
  title: string;
  markets: Market[];
}

interface Market {
  key: string;
  outcomes: Outcome[];
}

interface Outcome {
  name: string;
  price: number;
  point?: number;
}

interface Game {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: Bookmaker[];
}

export default function SportsPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSport, setSelectedSport] = useState<string>("upcoming");
  const [oddsRange, setOddsRange] = useState<[number, number]>([-1000, 1000]);

  useEffect(() => {
    async function fetchOdds() {
      setLoading(true);
      setError(null);

      try {
        const endpoint =
          selectedSport === "upcoming"
            ? "/api/odds"
            : `/api/odds?sport=${selectedSport}`;

        const response = await fetch(endpoint);

        if (!response.ok) {
          throw new Error("Failed to fetch odds data");
        }

        const data = await response.json();

        if (data.error) {
          throw new Error(data.error);
        }

        setGames(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchOdds();
  }, [selectedSport]);

  const filteredGames = useMemo(() => {
    return games
      .map((game) => {
        if (game.bookmakers.length === 0) {
          return null;
        }

        // Filter bookmakers and their markets based on odds range
        const filteredBookmakers = game.bookmakers
          .map((bookmaker) => {
            const filteredMarkets = bookmaker.markets
              .map((market) => {
                const filteredOutcomes = market.outcomes.filter(
                  (outcome) =>
                    outcome.price >= oddsRange[0] &&
                    outcome.price <= oddsRange[1]
                );
                return filteredOutcomes.length > 0
                  ? { ...market, outcomes: filteredOutcomes }
                  : null;
              })
              .filter((market) => market !== null) as Market[];

            return filteredMarkets.length > 0
              ? { ...bookmaker, markets: filteredMarkets }
              : null;
          })
          .filter((bookmaker) => bookmaker !== null) as Bookmaker[];

        if (filteredBookmakers.length === 0) {
          return null;
        }

        return { ...game, bookmakers: filteredBookmakers };
      })
      .filter((game) => game !== null) as Game[];
  }, [games, oddsRange]);

  const availableSports = useMemo(() => {
    // Hardcoded list of popular sports with their API keys
    const allSports = [
      { key: "americanfootball_nfl", title: "NFL" },
      { key: "americanfootball_ncaaf", title: "NCAAF" },
      { key: "basketball_nba", title: "NBA" },
      { key: "baseball_mlb", title: "MLB" },
      { key: "icehockey_nhl", title: "NHL" },
      { key: "soccer_epl", title: "EPL" },
      { key: "soccer_usa_mls", title: "MLS" },
      { key: "mma_mixed_martial_arts", title: "MMA" },
      { key: "boxing_boxing", title: "Boxing" },
    ];

    return allSports;
  }, []);

  const formatGameTime = (commenceTime: string) => {
    const gameDate = new Date(commenceTime);
    const now = new Date();

    if (gameDate < now) {
      return "Live";
    }

    const isToday =
      gameDate.getDate() === now.getDate() &&
      gameDate.getMonth() === now.getMonth() &&
      gameDate.getFullYear() === now.getFullYear();

    if (isToday) {
      return gameDate.toLocaleString(undefined, {
        hour: "numeric",
        minute: "2-digit",
        timeZoneName: "short",
      });
    }

    return gameDate.toLocaleString(undefined, {
      month: "numeric",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-900">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
          <p className="text-gray-500">Loading odds data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-900 p-4">
        <Card className="max-w-md w-full bg-zinc-950 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-red-500">Error</CardTitle>
            <CardDescription className="text-gray-500">
              Failed to load odds data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-400">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-4xl font-bold mb-2 text-white">Longshot</h1>
          <p className="text-gray-500 text-lg">See the odds. Play the edge!</p>
        </div>

        <Card className="mb-6 bg-zinc-950 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">
              Select a Sport and your preferred Odds.
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedSport("upcoming")}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedSport === "upcoming"
                      ? "bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500"
                      : "bg-zinc-900 text-gray-400 border-2 border-zinc-800 hover:border-zinc-700"
                  }`}
                >
                  Upcoming
                </button>
                {availableSports.map((sport) => {
                  const isSelected = selectedSport === sport.key;
                  return (
                    <button
                      key={sport.key}
                      onClick={() => setSelectedSport(sport.key)}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        isSelected
                          ? "bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500"
                          : "bg-zinc-900 text-gray-400 border-2 border-zinc-800 hover:border-zinc-700"
                      }`}
                    >
                      {sport.title}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-300">
                  Odds Range (Risk Level)
                </label>
                <span className="text-sm text-gray-500">
                  {oddsRange[0]} to +{oddsRange[1]}
                </span>
              </div>
              <Slider
                min={-1500}
                max={1500}
                step={50}
                value={oddsRange}
                onValueChange={(value) =>
                  setOddsRange(value as [number, number])
                }
                className="w-full [&_[role=slider]]:bg-emerald-500 [&_[role=slider]]:border-emerald-500 [&_.bg-primary]:bg-emerald-500"
              />
              <div className="flex justify-between text-xs text-gray-600">
                <span>Low Stake (-1500)</span>
                <span>Risky (+1500)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {filteredGames.length > 0 && (
          <p className="text-sm text-gray-500 mb-4">
            Showing {filteredGames.length} of {games.length} games
          </p>
        )}

        <div className="space-y-3">
          {filteredGames.flatMap((game) => {
            const bookmaker = game.bookmakers[0];
            if (!bookmaker) return [];

            const items: React.ReactElement[] = [];

            // Process each market type separately
            bookmaker.markets.forEach((market) => {
              let marketType = "";
              let badgeColor = "";
              let displayName = "";
              let displayOdds = "";
              let subtitle = "";

              if (market.key === "h2h") {
                marketType = "MONEYLINE";
                badgeColor = "border-blue-700 text-blue-400";
                const awayOutcome = market.outcomes.find(
                  (o) => o.name === game.away_team
                );
                if (awayOutcome) {
                  displayName = game.away_team;
                  displayOdds =
                    (awayOutcome.price > 0 ? "+" : "") + awayOutcome.price;
                  subtitle = `${game.away_team} @ ${game.home_team} `;
                }
              } else if (market.key === "spreads") {
                marketType = "SPREAD";
                badgeColor = "border-purple-700 text-purple-400";
                const awayOutcome = market.outcomes.find(
                  (o) => o.name === game.away_team
                );
                if (awayOutcome && awayOutcome.point !== undefined) {
                  const point =
                    awayOutcome.point > 0
                      ? "+" + awayOutcome.point
                      : awayOutcome.point;
                  displayName = `${game.away_team.split(" ").pop()} (${point})`;
                  displayOdds =
                    (awayOutcome.price > 0 ? "+" : "") + awayOutcome.price;
                  subtitle = `${game.away_team} @ ${game.home_team}`;
                }
              } else if (market.key === "totals") {
                marketType = "TOTALS";
                badgeColor = "border-orange-700 text-orange-400";
                const overOutcome = market.outcomes.find(
                  (o) => o.name === "Over"
                );
                if (overOutcome && overOutcome.point !== undefined) {
                  displayName = `Over ${overOutcome.point}`;
                  displayOdds =
                    (overOutcome.price > 0 ? "+" : "") + overOutcome.price;
                  subtitle = `${game.away_team} @ ${game.home_team}`;
                }
              }

              if (displayName && displayOdds) {
                items.push(
                  <div
                    key={`${game.id}-${market.key}`}
                    className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <Badge
                            variant="outline"
                            className={`${badgeColor} text-xs uppercase shrink-0`}
                          >
                            {marketType}
                          </Badge>
                          <Badge
                            variant="outline"
                            className="border-zinc-700 text-gray-500 text-xs shrink-0"
                          >
                            {game.sport_title}
                          </Badge>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-1 truncate">
                          {displayName}
                        </h3>
                        <p className="text-sm text-gray-500 mb-2">{subtitle}</p>
                        <p className="text-xs text-gray-600">
                          {formatGameTime(game.commence_time)}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-2xl font-bold text-white">
                          {displayOdds}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }
            });

            return items;
          })}
        </div>

        {filteredGames.length === 0 && games.length > 0 && (
          <Card className="bg-zinc-950 border-zinc-800">
            <CardContent className="py-12 text-center">
              <p className="text-gray-500">No games match your filters</p>
              <p className="text-sm text-gray-400 mt-2">
                Try adjusting your odds range.
              </p>
            </CardContent>
          </Card>
        )}

        {games.length === 0 && (
          <Card className="bg-zinc-950 border-zinc-800">
            <CardContent className="py-12 text-center">
              <p className="text-gray-500">No upcoming games available</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
