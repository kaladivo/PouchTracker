"use client";

import { Suspense } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Trophy,
  Flame,
  TrendingDown,
  Award,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import { useStats } from "@/hooks/use-stats";
import { useAchievementsManager } from "@/hooks/use-achievements";
import { AchievementCard } from "@/components/achievements";

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

function ProgressContentInner() {
  const stats = useStats();
  const { allAchievements, totalUnlocked, totalAchievements } =
    useAchievementsManager();

  // Get day of week for proper labeling (last 7 days ending today)
  const getDayLabel = (index: number) => {
    const today = new Date().getDay();
    // Convert Sunday=0 to Monday=0 format, then shift by index
    const mondayBased = today === 0 ? 6 : today - 1;
    const dayIndex = (mondayBased - (6 - index) + 7) % 7;
    return DAY_LABELS[dayIndex];
  };

  // Calculate max for chart scaling
  const maxDailyCount = Math.max(
    ...stats.weeklyData.map((d) => d.count),
    stats.todayLimit,
    1
  );

  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-2xl font-semibold">Your Progress</h1>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <Flame className="text-secondary mx-auto mb-1 h-6 w-6" />
            <p className="text-2xl font-semibold">{stats.currentStreak}</p>
            <p className="text-muted-foreground text-xs">Day Streak</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            {stats.reductionExceedsBaseline ? (
              <AlertTriangle className="mx-auto mb-1 h-6 w-6 text-orange-500" />
            ) : (
              <TrendingDown className="text-primary mx-auto mb-1 h-6 w-6" />
            )}
            <p
              className={`text-2xl font-semibold ${stats.reductionExceedsBaseline ? "text-orange-500" : ""}`}
            >
              {stats.reductionPercent !== null
                ? `${stats.reductionPercent}%`
                : "—"}
            </p>
            <p className="text-muted-foreground text-xs">
              {stats.reductionPercent === null
                ? `Need ${3 - stats.daysWithData} more days`
                : stats.reductionExceedsBaseline
                  ? "Over baseline"
                  : "Reduction"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats Row */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <Calendar className="text-muted-foreground mx-auto mb-1 h-6 w-6" />
            <p className="text-2xl font-semibold">{stats.daysSinceStart}</p>
            <p className="text-muted-foreground text-xs">Days on Journey</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <Award className="text-warning mx-auto mb-1 h-6 w-6" />
            <p className="text-2xl font-semibold">{stats.totalPouchesLogged}</p>
            <p className="text-muted-foreground text-xs">Total Logged</p>
          </CardContent>
        </Card>
      </div>

      {/* Time Range Tabs */}
      <Tabs defaultValue="week" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="day">Day</TabsTrigger>
          <TabsTrigger value="week">Week</TabsTrigger>
          <TabsTrigger value="month">Month</TabsTrigger>
        </TabsList>

        <TabsContent value="day" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Today</CardTitle>
              <CardDescription>
                {stats.todayCount} of {stats.todayLimit} pouches used
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Progress
                value={Math.min(
                  (stats.todayCount / stats.todayLimit) * 100,
                  100
                )}
                className={`h-3 ${
                  stats.todayCount > stats.todayLimit
                    ? "[&>div]:bg-destructive"
                    : ""
                }`}
              />
              <p className="text-muted-foreground mt-2 text-center text-xs">
                {stats.todayCount <= stats.todayLimit
                  ? `${stats.todayLimit - stats.todayCount} remaining`
                  : `${stats.todayCount - stats.todayLimit} over limit`}
              </p>
            </CardContent>
          </Card>

          {/* Trigger breakdown for today */}
          {Object.keys(stats.triggerCounts).length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Common Triggers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(stats.triggerCounts)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 4)
                    .map(([trigger, count]) => (
                      <div
                        key={trigger}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm capitalize">
                          {trigger.replace("_", " ")}
                        </span>
                        <span className="text-muted-foreground text-sm">
                          {count}
                        </span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="week" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">This Week</CardTitle>
              <CardDescription>
                Average: {stats.weeklyAverage} pouches/day
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex h-24 justify-between gap-1">
                {stats.weeklyData.map((day, i) => (
                  <div
                    key={day.date}
                    className="flex flex-1 flex-col items-center"
                  >
                    <div className="flex w-full flex-1 items-end">
                      <div
                        className={`w-full rounded-t transition-all ${
                          day.count > stats.todayLimit
                            ? "bg-destructive/80"
                            : "bg-primary/80"
                        }`}
                        style={{
                          height: `${Math.max((day.count / maxDailyCount) * 100, day.count > 0 ? 10 : 0)}%`,
                        }}
                      />
                    </div>
                    <span className="text-muted-foreground mt-1 text-xs">
                      {getDayLabel(i)}
                    </span>
                  </div>
                ))}
              </div>
              {/* Limit line indicator */}
              <div className="mt-3 flex items-center justify-center gap-2">
                <div className="bg-primary/80 h-3 w-3 rounded" />
                <span className="text-muted-foreground text-xs">
                  Under limit
                </span>
                <div className="bg-destructive/80 ml-2 h-3 w-3 rounded" />
                <span className="text-muted-foreground text-xs">
                  Over limit
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Weekly Summary</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-primary text-2xl font-semibold">
                  {stats.weeklyTotal}
                </p>
                <p className="text-muted-foreground text-xs">Total pouches</p>
              </div>
              <div className="text-center">
                <p className="text-primary text-2xl font-semibold">
                  {
                    stats.weeklyData.filter((d) => d.underLimit && d.count > 0)
                      .length
                  }
                </p>
                <p className="text-muted-foreground text-xs">
                  Days under limit
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="month" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">This Month</CardTitle>
              <CardDescription>
                Average: {stats.monthlyAverage} pouches/day
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Simple monthly grid view */}
              <div className="grid grid-cols-7 gap-1">
                {stats.monthlyData.slice(-28).map((day) => (
                  <div
                    key={day.date}
                    className={`aspect-square rounded-sm ${
                      day.count === 0
                        ? "bg-muted"
                        : day.underLimit
                          ? "bg-primary/60"
                          : "bg-destructive/60"
                    }`}
                    title={`${day.date}: ${day.count} pouches`}
                  />
                ))}
              </div>
              <div className="mt-3 flex items-center justify-center gap-2">
                <div className="bg-muted h-3 w-3 rounded-sm" />
                <span className="text-muted-foreground text-xs">No data</span>
                <div className="bg-primary/60 ml-2 h-3 w-3 rounded-sm" />
                <span className="text-muted-foreground text-xs">Good</span>
                <div className="bg-destructive/60 ml-2 h-3 w-3 rounded-sm" />
                <span className="text-muted-foreground text-xs">Over</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Monthly Summary</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-primary text-2xl font-semibold">
                  {stats.monthlyTotal}
                </p>
                <p className="text-muted-foreground text-xs">Total pouches</p>
              </div>
              <div className="text-center">
                <p className="text-primary text-2xl font-semibold">
                  {
                    stats.monthlyData.filter((d) => d.underLimit && d.count > 0)
                      .length
                  }
                </p>
                <p className="text-muted-foreground text-xs">
                  Days under limit
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Achievements */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Trophy className="text-warning h-5 w-5" />
              Achievements
            </CardTitle>
            <span className="text-muted-foreground text-sm">
              {totalUnlocked} / {totalAchievements}
            </span>
          </div>
          <CardDescription>
            Earn badges as you progress on your journey
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Milestone Achievements */}
          <div>
            <h4 className="text-muted-foreground mb-2 text-sm font-medium">
              Milestones
            </h4>
            <div className="grid grid-cols-1 gap-2">
              {allAchievements
                .filter((a) => a.category === "milestone")
                .map((achievement) => (
                  <AchievementCard
                    key={achievement.id}
                    achievement={achievement}
                    isUnlocked={achievement.isUnlocked}
                    unlockedAt={achievement.unlockedAt}
                    size="sm"
                  />
                ))}
            </div>
          </div>

          {/* Consistency Achievements */}
          <div>
            <h4 className="text-muted-foreground mb-2 text-sm font-medium">
              Consistency
            </h4>
            <div className="grid grid-cols-1 gap-2">
              {allAchievements
                .filter((a) => a.category === "consistency")
                .map((achievement) => (
                  <AchievementCard
                    key={achievement.id}
                    achievement={achievement}
                    isUnlocked={achievement.isUnlocked}
                    unlockedAt={achievement.unlockedAt}
                    size="sm"
                  />
                ))}
            </div>
          </div>

          {/* Waiting Achievements */}
          <div>
            <h4 className="text-muted-foreground mb-2 text-sm font-medium">
              Waiting Power
            </h4>
            <div className="grid grid-cols-1 gap-2">
              {allAchievements
                .filter((a) => a.category === "waiting")
                .map((achievement) => (
                  <AchievementCard
                    key={achievement.id}
                    achievement={achievement}
                    isUnlocked={achievement.isUnlocked}
                    unlockedAt={achievement.unlockedAt}
                    size="sm"
                  />
                ))}
            </div>
          </div>

          {/* Reflection Achievements */}
          <div>
            <h4 className="text-muted-foreground mb-2 text-sm font-medium">
              Self-Reflection
            </h4>
            <div className="grid grid-cols-1 gap-2">
              {allAchievements
                .filter((a) => a.category === "reflection")
                .map((achievement) => (
                  <AchievementCard
                    key={achievement.id}
                    achievement={achievement}
                    isUnlocked={achievement.isUnlocked}
                    unlockedAt={achievement.unlockedAt}
                    size="sm"
                  />
                ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ProgressLoading() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-2xl font-semibold">Your Progress</h1>
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <div className="bg-muted mx-auto mb-1 h-6 w-6 animate-pulse rounded" />
            <div className="bg-muted mx-auto h-8 w-8 animate-pulse rounded" />
            <p className="text-muted-foreground text-xs">Day Streak</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <div className="bg-muted mx-auto mb-1 h-6 w-6 animate-pulse rounded" />
            <div className="bg-muted mx-auto h-8 w-8 animate-pulse rounded" />
            <p className="text-muted-foreground text-xs">Reduction</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function ProgressContent() {
  return (
    <Suspense fallback={<ProgressLoading />}>
      <ProgressContentInner />
    </Suspense>
  );
}
