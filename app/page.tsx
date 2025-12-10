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
import { Slider } from "@/components/ui/slider";

interface Team {
  id: string;
  name: string;
  abbreviation: string;
  displayName: string;
  logo: string;
}

interface Competitor {
  id: string;
  team: Team;
  score: string;
  homeAway: string;
}

interface OddsProvider {
  id: string;
  name: string;
  priority: number;
}

interface SoccerTeamOdds {
  moneyLine?: number;
  spreadOdds?: number;
  team: Team;
}

interface SoccerDrawOdds {
  moneyLine?: number;
}

interface MoneylineOdds {
  home?: { close: { odds: string } };
  away?: { close: { odds: string } };
  draw?: { close: { odds: string } };
}

interface SpreadOdds {
  home?: { close: { line: string; odds: string } };
  away?: { close: { line: string; odds: string } };
}

interface TotalOdds {
  over?: { close: { line: string; odds: string } };
  under?: { close: { line: string; odds: string } };
}

interface Odds {
  provider: OddsProvider;
  details: string;
  spread?: number;
  overUnder?: number;
  moneyline?: MoneylineOdds;
  pointSpread?: SpreadOdds;
  total?: TotalOdds;
  homeTeamOdds?: SoccerTeamOdds;
  awayTeamOdds?: SoccerTeamOdds;
  drawOdds?: SoccerDrawOdds;
}

interface Competition {
  id: string;
  date: string;
  competitors: Competitor[];
  odds?: Odds[];
  status: {
    type: {
      id: string;
      state: string;
      description: string;
    };
  };
}

interface Event {
  id: string;
  name: string;
  shortName: string;
  date: string;
  competitions: Competition[];
}

interface ESPNResponse {
  events: Event[];
}

export default function SportsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSport, setSelectedSport] = useState<{
    sport: string;
    league: string;
  }>({ sport: "football", league: "nfl" });
  const [oddsRange, setOddsRange] = useState<[number, number]>([-1000, 1000]);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const parseOddsValue = (odds: string | number): number => {
    if (typeof odds === "number") return odds;
    if (odds === "OFF" || odds === "EVEN") return 0;
    return parseInt(odds.replace(/[+,]/g, ""));
  };

  const isSoccerLeague = (sport: string, league: string): boolean => {
    return sport === "soccer";
  };

  useEffect(() => {
    async function fetchOdds() {
      setLoading(true);
      setError(null);

      try {
        const endpoint = `/api/odds?sport=${selectedSport.sport}&league=${selectedSport.league}`;
        const response = await fetch(endpoint);

        if (!response.ok) {
          throw new Error("Failed to fetch odds data");
        }

        const data: ESPNResponse = await response.json();

        console.log("API Response:", data);
        console.log("Events count:", data.events?.length || 0);

        if (!data.events) {
          console.log("No events property in response");
          throw new Error("No events data returned");
        }

        data.events.forEach((event, index) => {
          console.log(`Event ${index}:`, event.name);
          console.log(`  Competitions:`, event.competitions?.length || 0);
          if (event.competitions?.[0]) {
            console.log(`  Has odds:`, !!event.competitions[0].odds);
            console.log(`  Odds data:`, event.competitions[0].odds);
          }
        });

        setEvents(data.events);
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchOdds();
  }, [selectedSport]);

  const filteredEvents = useMemo(() => {
    console.log("Filtering events, total:", events.length);
    console.log("Current odds range:", oddsRange);

    const isSoccer = isSoccerLeague(selectedSport.sport, selectedSport.league);

    const filtered = events.filter((event) => {
      const competition = event.competitions[0];

      if (!competition?.odds || competition.odds.length === 0) {
        console.log(`Event ${event.name}: No odds data`);
        return false;
      }

      let odds = competition.odds[0];
      if (isSoccer) {
        const espnBetOdds = competition.odds.find(
          (o) => o.provider.id === "58"
        );
        if (espnBetOdds) {
          odds = espnBetOdds;
        }
      }

      console.log(`Event ${event.name} odds:`, odds);

      let hasMatchingOdds = false;

      if (isSoccer && odds.homeTeamOdds && odds.awayTeamOdds) {
        hasMatchingOdds = Boolean(
          (odds.awayTeamOdds.moneyLine &&
            parseOddsValue(odds.awayTeamOdds.moneyLine) >= oddsRange[0] &&
            parseOddsValue(odds.awayTeamOdds.moneyLine) <= oddsRange[1]) ||
            (odds.homeTeamOdds.moneyLine &&
              parseOddsValue(odds.homeTeamOdds.moneyLine) >= oddsRange[0] &&
              parseOddsValue(odds.homeTeamOdds.moneyLine) <= oddsRange[1]) ||
            (odds.drawOdds?.moneyLine &&
              parseOddsValue(odds.drawOdds.moneyLine) >= oddsRange[0] &&
              parseOddsValue(odds.drawOdds.moneyLine) <= oddsRange[1])
        );
      } else {
        hasMatchingOdds = Boolean(
          (odds.moneyline?.home?.close?.odds &&
            parseOddsValue(odds.moneyline.home.close.odds) >= oddsRange[0] &&
            parseOddsValue(odds.moneyline.home.close.odds) <= oddsRange[1]) ||
            (odds.moneyline?.away?.close?.odds &&
              parseOddsValue(odds.moneyline.away.close.odds) >= oddsRange[0] &&
              parseOddsValue(odds.moneyline.away.close.odds) <= oddsRange[1]) ||
            (odds.pointSpread?.home?.close?.odds &&
              parseOddsValue(odds.pointSpread.home.close.odds) >=
                oddsRange[0] &&
              parseOddsValue(odds.pointSpread.home.close.odds) <=
                oddsRange[1]) ||
            (odds.pointSpread?.away?.close?.odds &&
              parseOddsValue(odds.pointSpread.away.close.odds) >=
                oddsRange[0] &&
              parseOddsValue(odds.pointSpread.away.close.odds) <=
                oddsRange[1]) ||
            (odds.total?.over?.close?.odds &&
              parseOddsValue(odds.total.over.close.odds) >= oddsRange[0] &&
              parseOddsValue(odds.total.over.close.odds) <= oddsRange[1]) ||
            (odds.total?.under?.close?.odds &&
              parseOddsValue(odds.total.under.close.odds) >= oddsRange[0] &&
              parseOddsValue(odds.total.under.close.odds) <= oddsRange[1])
        );
      }

      console.log(`Event ${event.name}: hasMatchingOdds = ${hasMatchingOdds}`);
      return hasMatchingOdds;
    });

    console.log("Filtered events count:", filtered.length);
    return filtered;
  }, [events, oddsRange, selectedSport]);

  const availableSports = [
    { sport: "football", league: "nfl", title: "NFL" },
    { sport: "football", league: "college-football", title: "NCAAF" },
    { sport: "basketball", league: "nba", title: "NBA" },
    // { sport: "baseball", league: "mlb", title: "MLB" },
    { sport: "hockey", league: "nhl", title: "NHL" },
    { sport: "soccer", league: "uefa.champions", title: "UEFA" },
    { sport: "soccer", league: "eng.1", title: "EPL" },
    // { sport: "soccer", league: "usa.1", title: "MLS" },
    { sport: "soccer", league: "ger.1", title: "Bundesliga" },
  ];

  const formatGameTime = (dateString: string) => {
    const gameDate = new Date(dateString);
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
                {availableSports.map((sportOption) => {
                  const isSelected =
                    selectedSport.sport === sportOption.sport &&
                    selectedSport.league === sportOption.league;
                  return (
                    <button
                      key={`${sportOption.sport}-${sportOption.league}`}
                      onClick={() =>
                        setSelectedSport({
                          sport: sportOption.sport,
                          league: sportOption.league,
                        })
                      }
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        isSelected
                          ? "bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500"
                          : "bg-zinc-900 text-gray-400 border-2 border-zinc-800 hover:border-zinc-700"
                      }`}
                    >
                      {sportOption.title}
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
                  {oddsRange[0] > 0 ? "+" : ""}
                  {oddsRange[0]} to {oddsRange[1] > 0 ? "+" : ""}
                  {oddsRange[1]}
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

        {filteredEvents.length > 0 && (
          <p className="text-sm text-gray-500 mb-4">
            Showing {filteredEvents.length} of {events.length} games
          </p>
        )}

        <div className="space-y-3">
          {filteredEvents.flatMap((event) => {
            const competition = event.competitions[0];
            if (!competition?.odds || competition.odds.length === 0) return [];

            const isSoccer = isSoccerLeague(
              selectedSport.sport,
              selectedSport.league
            );
            let odds = competition.odds[0];
            if (isSoccer) {
              const espnBetOdds = competition.odds.find(
                (o) => o.provider.id === "58"
              );
              if (espnBetOdds) {
                odds = espnBetOdds;
              }
            }

            const items: React.ReactElement[] = [];

            // Soccer format - show moneyline and over/under
            if (isSoccer && odds.awayTeamOdds && odds.homeTeamOdds) {
              const awayML = odds.awayTeamOdds.moneyLine
                ? parseOddsValue(odds.awayTeamOdds.moneyLine)
                : null;
              const homeML = odds.homeTeamOdds.moneyLine
                ? parseOddsValue(odds.homeTeamOdds.moneyLine)
                : null;
              const drawML = odds.drawOdds?.moneyLine
                ? parseOddsValue(odds.drawOdds.moneyLine)
                : null;
              const overOdds = odds.total?.over?.close?.odds
                ? parseOddsValue(odds.total.over.close.odds)
                : null;
              const underOdds = odds.total?.under?.close?.odds
                ? parseOddsValue(odds.total.under.close.odds)
                : null;

              const showCard =
                (awayML && awayML >= oddsRange[0] && awayML <= oddsRange[1]) ||
                (homeML && homeML >= oddsRange[0] && homeML <= oddsRange[1]) ||
                (drawML && drawML >= oddsRange[0] && drawML <= oddsRange[1]) ||
                (overOdds &&
                  overOdds >= oddsRange[0] &&
                  overOdds <= oddsRange[1]) ||
                (underOdds &&
                  underOdds >= oddsRange[0] &&
                  underOdds <= oddsRange[1]);

              if (showCard) {
                items.push(
                  <div
                    key={`${event.id}-soccer-odds`}
                    className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition-colors"
                  >
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge
                          variant="outline"
                          className="border-zinc-700 text-gray-500 text-xs shrink-0"
                        >
                          {odds.provider.name}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500 mb-1">{event.name}</p>
                      <p className="text-xs text-gray-600">
                        {formatGameTime(event.date)}
                      </p>
                    </div>

                    {/* Moneyline */}
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-gray-400 mb-2 uppercase">
                        Moneyline
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        <div
                          className={`rounded p-3 text-center ${
                            awayML !== null &&
                            awayML >= oddsRange[0] &&
                            awayML <= oddsRange[1]
                              ? "bg-zinc-900"
                              : "bg-zinc-800 opacity-50"
                          }`}
                        >
                          <p className="text-xs text-gray-400 mb-1">
                            {odds.awayTeamOdds.team.abbreviation}
                          </p>
                          <p
                            className={`text-lg font-bold ${
                              awayML !== null &&
                              awayML >= oddsRange[0] &&
                              awayML <= oddsRange[1]
                                ? "text-white"
                                : "text-gray-500"
                            }`}
                          >
                            {awayML !== null
                              ? `${awayML > 0 ? "+" : ""}${awayML}`
                              : "—"}
                          </p>
                        </div>

                        <div
                          className={`rounded p-3 text-center ${
                            drawML !== null &&
                            drawML >= oddsRange[0] &&
                            drawML <= oddsRange[1]
                              ? "bg-zinc-900"
                              : "bg-zinc-800 opacity-50"
                          }`}
                        >
                          <p className="text-xs text-gray-400 mb-1">Draw</p>
                          <p
                            className={`text-lg font-bold ${
                              drawML !== null &&
                              drawML >= oddsRange[0] &&
                              drawML <= oddsRange[1]
                                ? "text-white"
                                : "text-gray-500"
                            }`}
                          >
                            {drawML !== null
                              ? `${drawML > 0 ? "+" : ""}${drawML}`
                              : "—"}
                          </p>
                        </div>

                        <div
                          className={`rounded p-3 text-center ${
                            homeML !== null &&
                            homeML >= oddsRange[0] &&
                            homeML <= oddsRange[1]
                              ? "bg-zinc-900"
                              : "bg-zinc-800 opacity-50"
                          }`}
                        >
                          <p className="text-xs text-gray-400 mb-1">
                            {odds.homeTeamOdds.team.abbreviation}
                          </p>
                          <p
                            className={`text-lg font-bold ${
                              homeML !== null &&
                              homeML >= oddsRange[0] &&
                              homeML <= oddsRange[1]
                                ? "text-white"
                                : "text-gray-500"
                            }`}
                          >
                            {homeML !== null
                              ? `${homeML > 0 ? "+" : ""}${homeML}`
                              : "—"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Over/Under */}
                    {(overOdds !== null || underOdds !== null) && (
                      <div>
                        <p className="text-xs font-semibold text-gray-400 mb-2 uppercase">
                          Over/Under{" "}
                          {odds.total?.over?.close?.line?.replace("o", "")}
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          <div
                            className={`rounded p-3 text-center ${
                              overOdds !== null &&
                              overOdds >= oddsRange[0] &&
                              overOdds <= oddsRange[1]
                                ? "bg-zinc-900"
                                : "bg-zinc-800 opacity-50"
                            }`}
                          >
                            <p className="text-xs text-gray-400 mb-1">Over</p>
                            <p
                              className={`text-lg font-bold ${
                                overOdds !== null &&
                                overOdds >= oddsRange[0] &&
                                overOdds <= oddsRange[1]
                                  ? "text-white"
                                  : "text-gray-500"
                              }`}
                            >
                              {overOdds !== null
                                ? `${overOdds > 0 ? "+" : ""}${overOdds}`
                                : "—"}
                            </p>
                          </div>

                          <div
                            className={`rounded p-3 text-center ${
                              underOdds !== null &&
                              underOdds >= oddsRange[0] &&
                              underOdds <= oddsRange[1]
                                ? "bg-zinc-900"
                                : "bg-zinc-800 opacity-50"
                            }`}
                          >
                            <p className="text-xs text-gray-400 mb-1">Under</p>
                            <p
                              className={`text-lg font-bold ${
                                underOdds !== null &&
                                underOdds >= oddsRange[0] &&
                                underOdds <= oddsRange[1]
                                  ? "text-white"
                                  : "text-gray-500"
                              }`}
                            >
                              {underOdds !== null
                                ? `${underOdds > 0 ? "+" : ""}${underOdds}`
                                : "—"}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              }

              return items;
            }

            // Standard American sports format
            const awayTeam = competition.competitors.find(
              (c) => c.homeAway === "away"
            );
            const homeTeam = competition.competitors.find(
              (c) => c.homeAway === "home"
            );

            if (!awayTeam || !homeTeam) return [];

            // Moneyline
            if (
              odds.moneyline?.away?.close?.odds &&
              odds.moneyline.away.close.odds !== "OFF"
            ) {
              const oddsValue = parseOddsValue(odds.moneyline.away.close.odds);
              if (oddsValue >= oddsRange[0] && oddsValue <= oddsRange[1]) {
                items.push(
                  <div
                    key={`${event.id}-moneyline-away`}
                    className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge
                            variant="outline"
                            className="border-blue-700 text-blue-400 text-xs uppercase shrink-0"
                          >
                            MONEYLINE
                          </Badge>
                          <Badge
                            variant="outline"
                            className="border-zinc-700 text-gray-500 text-xs shrink-0"
                          >
                            {odds.provider.name}
                          </Badge>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2 truncate">
                          {isMobile
                            ? awayTeam.team.abbreviation
                            : awayTeam.team.name}
                        </h3>
                        <p className="text-sm text-gray-500 mb-2">
                          {event.name}
                        </p>
                        <p className="text-xs text-gray-600">
                          {formatGameTime(event.date)}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-3xl font-bold text-white">
                          {odds.moneyline.away.close.odds}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }
            }

            if (
              odds.moneyline?.home?.close?.odds &&
              odds.moneyline.home.close.odds !== "OFF"
            ) {
              const oddsValue = parseOddsValue(odds.moneyline.home.close.odds);
              if (oddsValue >= oddsRange[0] && oddsValue <= oddsRange[1]) {
                items.push(
                  <div
                    key={`${event.id}-moneyline-home`}
                    className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge
                            variant="outline"
                            className="border-blue-700 text-blue-400 text-xs uppercase shrink-0"
                          >
                            MONEYLINE
                          </Badge>
                          <Badge
                            variant="outline"
                            className="border-zinc-700 text-gray-500 text-xs shrink-0"
                          >
                            {odds.provider.name}
                          </Badge>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2 truncate">
                          {isMobile
                            ? homeTeam.team.abbreviation
                            : homeTeam.team.name}
                        </h3>
                        <p className="text-sm text-gray-500 mb-2">
                          {event.name}
                        </p>
                        <p className="text-xs text-gray-600">
                          {formatGameTime(event.date)}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-3xl font-bold text-white">
                          {odds.moneyline.home.close.odds}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }
            }

            // Spread
            if (
              odds.pointSpread?.away?.close?.line &&
              odds.pointSpread.away.close.odds !== "OFF"
            ) {
              const oddsValue = parseOddsValue(
                odds.pointSpread.away.close.odds
              );
              if (oddsValue >= oddsRange[0] && oddsValue <= oddsRange[1]) {
                items.push(
                  <div
                    key={`${event.id}-spread-away`}
                    className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge
                            variant="outline"
                            className="border-purple-700 text-purple-400 text-xs uppercase shrink-0"
                          >
                            SPREAD
                          </Badge>
                          <Badge
                            variant="outline"
                            className="border-zinc-700 text-gray-500 text-xs shrink-0"
                          >
                            {odds.provider.name}
                          </Badge>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2 truncate">
                          {isMobile
                            ? awayTeam.team.abbreviation
                            : awayTeam.team.name}{" "}
                          {odds.pointSpread.away.close.line}
                        </h3>
                        <p className="text-sm text-gray-500 mb-2">
                          {event.name}
                        </p>
                        <p className="text-xs text-gray-600">
                          {formatGameTime(event.date)}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-3xl font-bold text-white">
                          {odds.pointSpread.away.close.odds}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }
            }

            if (
              odds.pointSpread?.home?.close?.line &&
              odds.pointSpread.home.close.odds !== "OFF"
            ) {
              const oddsValue = parseOddsValue(
                odds.pointSpread.home.close.odds
              );
              if (oddsValue >= oddsRange[0] && oddsValue <= oddsRange[1]) {
                items.push(
                  <div
                    key={`${event.id}-spread-home`}
                    className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge
                            variant="outline"
                            className="border-purple-700 text-purple-400 text-xs uppercase shrink-0"
                          >
                            SPREAD
                          </Badge>
                          <Badge
                            variant="outline"
                            className="border-zinc-700 text-gray-500 text-xs shrink-0"
                          >
                            {odds.provider.name}
                          </Badge>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2 truncate">
                          {isMobile
                            ? homeTeam.team.abbreviation
                            : homeTeam.team.name}{" "}
                          {odds.pointSpread.home.close.line}
                        </h3>
                        <p className="text-sm text-gray-500 mb-2">
                          {event.name}
                        </p>
                        <p className="text-xs text-gray-600">
                          {formatGameTime(event.date)}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-3xl font-bold text-white">
                          {odds.pointSpread.home.close.odds}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }
            }

            // Totals (Over)
            if (
              odds.total?.over?.close?.line &&
              odds.total.over.close.odds !== "OFF"
            ) {
              const oddsValue = parseOddsValue(odds.total.over.close.odds);
              if (oddsValue >= oddsRange[0] && oddsValue <= oddsRange[1]) {
                items.push(
                  <div
                    key={`${event.id}-total-over`}
                    className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge
                            variant="outline"
                            className="border-orange-700 text-orange-400 text-xs uppercase shrink-0"
                          >
                            TOTALS
                          </Badge>
                          <Badge
                            variant="outline"
                            className="border-zinc-700 text-gray-500 text-xs shrink-0"
                          >
                            {odds.provider.name}
                          </Badge>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2 truncate">
                          Over {odds.total.over.close.line.replace("o", "")}
                        </h3>
                        <p className="text-sm text-gray-500 mb-2">
                          {event.name}
                        </p>
                        <p className="text-xs text-gray-600">
                          {formatGameTime(event.date)}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-3xl font-bold text-white">
                          {odds.total.over.close.odds}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }
            }

            // Totals (Under)
            if (
              odds.total?.under?.close?.line &&
              odds.total.under.close.odds !== "OFF"
            ) {
              const oddsValue = parseOddsValue(odds.total.under.close.odds);
              if (oddsValue >= oddsRange[0] && oddsValue <= oddsRange[1]) {
                items.push(
                  <div
                    key={`${event.id}-total-under`}
                    className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge
                            variant="outline"
                            className="border-orange-700 text-orange-400 text-xs uppercase shrink-0"
                          >
                            TOTALS
                          </Badge>
                          <Badge
                            variant="outline"
                            className="border-zinc-700 text-gray-500 text-xs shrink-0"
                          >
                            {odds.provider.name}
                          </Badge>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2 truncate">
                          Under {odds.total.under.close.line.replace("u", "")}
                        </h3>
                        <p className="text-sm text-gray-500 mb-2">
                          {event.name}
                        </p>
                        <p className="text-xs text-gray-600">
                          {formatGameTime(event.date)}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-3xl font-bold text-white">
                          {odds.total.under.close.odds}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }
            }

            return items;
          })}
        </div>

        {filteredEvents.length === 0 && events.length > 0 && (
          <Card className="bg-zinc-950 border-zinc-800">
            <CardContent className="py-12 text-center">
              <p className="text-gray-500">No games match your filters</p>
              <p className="text-sm text-gray-400 mt-2">
                Try adjusting your odds range.
              </p>
            </CardContent>
          </Card>
        )}

        {events.length === 0 && (
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
