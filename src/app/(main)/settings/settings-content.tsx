"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Clock,
  DollarSign,
  Moon,
  Cloud,
  Download,
  Trash2,
  ChevronRight,
  Heart,
  Pencil,
  Archive,
  Coffee,
  Mail,
} from "lucide-react";
import {
  useUserSettings,
  usePouchFreeMutation,
  useJourneyArchives,
  useAllPouchLogs,
  useAllReflections,
  useAchievements,
  useMetricEvents,
  useTaperingPhases,
} from "@/lib/evolu/hooks";
import { AUTO_INTERVAL_VALUE, calculateAutoInterval } from "@/lib/utils";
import {
  EditScheduleSheet,
  EditCostSheet,
  EditWhySheet,
  EditBaselineSheet,
  ThemeToggleSheet,
  DeleteDataSheet,
  ArchivesViewerSheet,
  BackupSyncSheet,
} from "@/components/settings";
import { useTheme } from "next-themes";

interface SettingItemProps {
  icon: React.ReactNode;
  label: string;
  description?: string;
  value?: string;
  onClick?: () => void;
  destructive?: boolean;
}

function SettingItem({
  icon,
  label,
  description,
  value,
  onClick,
  destructive,
}: SettingItemProps) {
  return (
    <button
      onClick={onClick}
      className="hover:bg-muted/50 -mx-2 flex w-full items-center gap-3 rounded-lg px-2 py-3 text-left transition-colors"
    >
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
          destructive ? "bg-destructive/10" : "bg-muted"
        }`}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p
          className={`text-sm font-medium ${destructive ? "text-destructive" : ""}`}
        >
          {label}
        </p>
        {description && (
          <p className="text-muted-foreground text-xs">{description}</p>
        )}
      </div>
      {value && <span className="text-muted-foreground text-sm">{value}</span>}
      <ChevronRight className="text-muted-foreground h-4 w-4 shrink-0" />
    </button>
  );
}

function formatTime(time: string | null): string {
  if (!time) return "—";
  const [hours, minutes] = time.split(":").map(Number);
  const ampm = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, "0")} ${ampm}`;
}

function getCurrencySymbol(code: string | null): string {
  const symbols: Record<string, string> = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    CZK: "Kč",
    SEK: "kr",
  };
  return symbols[code ?? "USD"] ?? "$";
}

export default function SettingsContent() {
  const settings = useUserSettings();
  const phases = useTaperingPhases();
  const archives = useJourneyArchives();
  const allLogs = useAllPouchLogs();
  const allReflections = useAllReflections();
  const achievements = useAchievements();
  const metricEvents = useMetricEvents();

  // Get current phase info for daily limit
  const currentPhase = phases.find(
    (p) => p.phaseNumber === settings?.currentPhase
  );
  const dailyLimit =
    currentPhase?.dailyLimit ?? settings?.baselineDailyPouches ?? 10;
  const {
    updateSettings,
    createJourneyArchive,
    softDeleteLog,
    softDeleteReflection,
    softDeleteAchievement,
    softDeleteMetricEvent,
  } = usePouchFreeMutation();

  const [scheduleSheetOpen, setScheduleSheetOpen] = useState(false);
  const [costSheetOpen, setCostSheetOpen] = useState(false);
  const [whySheetOpen, setWhySheetOpen] = useState(false);
  const [baselineSheetOpen, setBaselineSheetOpen] = useState(false);
  const [themeSheetOpen, setThemeSheetOpen] = useState(false);
  const [deleteSheetOpen, setDeleteSheetOpen] = useState(false);
  const [archivesSheetOpen, setArchivesSheetOpen] = useState(false);
  const [backupSheetOpen, setBackupSheetOpen] = useState(false);
  const { theme } = useTheme();

  // Capture current time once on mount to avoid impure Date.now() in render
  const [now] = useState(() => Date.now());

  // Calculate journey stats for the delete confirmation
  const journeyStats = useMemo(
    () => ({
      totalDays: settings?.startDate
        ? Math.floor(
            (now - new Date(settings.startDate).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : 0,
      totalLogs: allLogs.length,
      currentPhase: settings?.currentPhase ?? 1,
    }),
    [settings, allLogs.length, now]
  );

  // Archive and clear data
  const handleArchiveAndDelete = () => {
    // Create archive snapshot
    const snapshot = JSON.stringify({
      logs: allLogs.slice(0, 100).map((l) => ({
        timestamp: l.timestamp,
        strengthMg: l.strengthMg,
        trigger: l.trigger,
      })),
      reflectionsCount: allReflections.length,
      achievementsUnlocked: achievements.length,
      startDate: settings?.startDate,
      baselineDaily: settings?.baselineDailyPouches,
    });

    // Create the archive
    createJourneyArchive({
      finalPhase: settings?.currentPhase ?? 1,
      totalDays: journeyStats.totalDays,
      dataSnapshot: snapshot.slice(0, 990), // Ensure under 1000 char limit
    });

    // Soft delete all data
    clearAllData();
  };

  // Delete without archiving
  const handleDeleteOnly = () => {
    clearAllData();
  };

  // Clear all user data (soft delete)
  const clearAllData = () => {
    // Delete all logs
    for (const log of allLogs) {
      softDeleteLog(log.id);
    }

    // Delete all reflections
    for (const reflection of allReflections) {
      softDeleteReflection(reflection.id);
    }

    // Delete all achievements
    for (const achievement of achievements) {
      softDeleteAchievement(achievement.id);
    }

    // Delete all metric events
    for (const event of metricEvents) {
      softDeleteMetricEvent(event.id);
    }

    // Reset settings and trigger re-onboarding
    if (settings?.id) {
      updateSettings(settings.id, {
        currentPhase: 1,
        onboardingCompleted: false,
      });
    }
  };

  const getThemeLabel = (t: string | undefined) => {
    switch (t) {
      case "light":
        return "Light";
      case "dark":
        return "Dark";
      default:
        return "System";
    }
  };

  const priceDisplay = settings?.pricePerCan
    ? `${getCurrencySymbol(settings.currency)}${(settings.pricePerCan / 100).toFixed(2)}`
    : "—";

  // Calculate interval display with auto mode support
  const intervalDisplay = useMemo(() => {
    const interval = settings?.pouchIntervalMinutes;
    if (interval === undefined || interval === null) return "—";

    if (interval === AUTO_INTERVAL_VALUE) {
      // Auto mode - show calculated value
      const autoInterval = calculateAutoInterval(
        settings?.wakeTime ?? "07:00",
        settings?.sleepTime ?? "23:00",
        dailyLimit
      );
      const hours = autoInterval / 60;
      if (hours >= 1) {
        return `Auto (${Math.round(hours * 10) / 10}h)`;
      }
      return `Auto (${autoInterval}m)`;
    }

    if (interval >= 60) {
      return `${Math.round((interval / 60) * 10) / 10} hours`;
    }
    return `${interval} min`;
  }, [
    settings?.pouchIntervalMinutes,
    settings?.wakeTime,
    settings?.sleepTime,
    dailyLimit,
  ]);

  const handleScheduleSave = (
    wakeTime: string,
    sleepTime: string,
    interval: number
  ) => {
    if (settings?.id) {
      updateSettings(settings.id, {
        wakeTime,
        sleepTime,
        pouchIntervalMinutes: interval,
      });
    }
  };

  const handleCostSave = (
    currency: string,
    pricePerCan: number | null,
    pouchesPerCan: number
  ) => {
    if (settings?.id) {
      updateSettings(settings.id, {
        currency,
        pricePerCan,
        pouchesPerCan,
      });
    }
  };

  const handleWhySave = (personalWhy: string) => {
    if (settings?.id) {
      updateSettings(settings.id, {
        personalWhy: personalWhy || null,
      });
    }
  };

  const handleBaselineSave = (dailyPouches: number, strengthMg: number) => {
    if (settings?.id) {
      updateSettings(settings.id, {
        baselineDailyPouches: dailyPouches,
        baselineStrengthMg: strengthMg,
      });
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-2xl font-semibold">Settings</h1>

      {/* Personal Why */}
      <Card
        className={`${settings?.personalWhy ? "bg-primary/5 border-primary/20" : ""} hover:bg-muted/50 cursor-pointer transition-colors`}
        onClick={() => setWhySheetOpen(true)}
      >
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start gap-3">
            <Heart className="text-primary mt-0.5 h-5 w-5 shrink-0" />
            <div className="flex-1">
              <p className="text-primary text-sm font-medium">Your Why</p>
              {settings?.personalWhy ? (
                <p className="text-muted-foreground mt-1 text-sm">
                  {settings.personalWhy}
                </p>
              ) : (
                <p className="text-muted-foreground mt-1 text-sm italic">
                  Tap to add your personal motivation
                </p>
              )}
            </div>
            <Pencil className="text-muted-foreground h-4 w-4 shrink-0" />
          </div>
        </CardContent>
      </Card>

      {/* Schedule Settings */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">Schedule</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2"
            onClick={() => setScheduleSheetOpen(true)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-1">
          <SettingItem
            icon={<Clock className="h-4 w-4" />}
            label="Wake Time"
            value={formatTime(settings?.wakeTime ?? null)}
            onClick={() => setScheduleSheetOpen(true)}
          />
          <SettingItem
            icon={<Moon className="h-4 w-4" />}
            label="Sleep Time"
            value={formatTime(settings?.sleepTime ?? null)}
            onClick={() => setScheduleSheetOpen(true)}
          />
          <SettingItem
            icon={<Clock className="h-4 w-4" />}
            label="Interval Between Pouches"
            value={intervalDisplay}
            onClick={() => setScheduleSheetOpen(true)}
          />
        </CardContent>
      </Card>

      {/* Baseline Usage */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-base">Baseline Usage</CardTitle>
            <CardDescription>Your starting point</CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2"
            onClick={() => setBaselineSheetOpen(true)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-1">
          <SettingItem
            icon={<span className="text-sm">📦</span>}
            label="Daily Pouches"
            value={settings?.baselineDailyPouches?.toString() ?? "—"}
            onClick={() => setBaselineSheetOpen(true)}
          />
          <SettingItem
            icon={<span className="text-sm">⚡</span>}
            label="Strength"
            value={
              settings?.baselineStrengthMg
                ? `${settings.baselineStrengthMg}mg`
                : "—"
            }
            onClick={() => setBaselineSheetOpen(true)}
          />
        </CardContent>
      </Card>

      {/* Cost Tracking */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">Cost Tracking</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2"
            onClick={() => setCostSheetOpen(true)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-1">
          <SettingItem
            icon={<DollarSign className="h-4 w-4" />}
            label="Currency"
            value={settings?.currency ?? "USD"}
            onClick={() => setCostSheetOpen(true)}
          />
          <SettingItem
            icon={<DollarSign className="h-4 w-4" />}
            label="Price per Can"
            value={priceDisplay}
            onClick={() => setCostSheetOpen(true)}
          />
          <SettingItem
            icon={<DollarSign className="h-4 w-4" />}
            label="Pouches per Can"
            value={settings?.pouchesPerCan?.toString() ?? "20"}
            onClick={() => setCostSheetOpen(true)}
          />
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Appearance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <SettingItem
            icon={<Moon className="h-4 w-4" />}
            label="Theme"
            value={getThemeLabel(theme)}
            onClick={() => setThemeSheetOpen(true)}
          />
        </CardContent>
      </Card>

      {/* Data & Privacy */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Data & Privacy</CardTitle>
          <CardDescription>
            Your data is stored locally and end-to-end encrypted
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          <SettingItem
            icon={<Cloud className="h-4 w-4" />}
            label="Backup & Sync"
            description="Keep your progress safe across devices"
            onClick={() => setBackupSheetOpen(true)}
          />
          <SettingItem
            icon={<Archive className="h-4 w-4" />}
            label="Journey Archives"
            description={`${archives.length} archived ${archives.length === 1 ? "journey" : "journeys"}`}
            onClick={() => setArchivesSheetOpen(true)}
          />
          <SettingItem
            icon={<Download className="h-4 w-4" />}
            label="Export Data"
            description="Download all your data as JSON"
          />
          <SettingItem
            icon={<Trash2 className="text-destructive h-4 w-4" />}
            label="Delete All Data"
            description="Archive or erase all local data"
            destructive
            onClick={() => setDeleteSheetOpen(true)}
          />
        </CardContent>
      </Card>

      {/* Free Forever Promise */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
              <Heart className="text-primary h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold">Free Forever</p>
              <p className="text-muted-foreground text-sm">
                No ads, no subscriptions, no hidden costs. Ever.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* About & Support */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">About</CardTitle>
          <CardDescription>Version 1.0.0</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-muted-foreground text-sm">
              I built this app for myself first — to help track and reduce my
              nicotine pouch usage. After seeing how much it helped, I decided
              to share it with others who might be on the same journey.
            </p>
            <p className="text-muted-foreground text-sm">
              This is a passion project and it will always be{" "}
              <span className="font-medium">completely free</span>. I don&apos;t
              want to make money from it — I just want to help others who are
              going through the same thing.
            </p>
            <p className="text-muted-foreground text-sm">
              If you find it helpful and want to support the development costs
              (AI tools and hosting), you can buy me a coffee. But it&apos;s
              totally optional!
            </p>
          </div>

          <Button
            variant="outline"
            className="h-10 w-full"
            onClick={() =>
              window.open("https://buymeacoffee.com/davenov", "_blank")
            }
          >
            <Coffee className="mr-2 h-4 w-4" />
            Buy me a coffee
          </Button>

          <div className="border-t pt-3">
            <p className="text-muted-foreground mb-2 text-sm">
              Have feedback or suggestions? I&apos;d love to hear from you!
            </p>
            <Button
              variant="ghost"
              className="h-9 w-full"
              onClick={() => (window.location.href = "mailto:mail@davenov.com")}
            >
              <Mail className="mr-2 h-4 w-4" />
              mail@davenov.com
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Journey Info */}
      {settings?.startDate && (
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-muted-foreground text-xs">
              Journey started on{" "}
              <span className="font-medium">
                {new Date(settings.startDate).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </p>
          </CardContent>
        </Card>
      )}

      {/* Footer */}
      <p className="text-muted-foreground pb-4 text-center text-xs">
        made with &lt;3 by{" "}
        <a
          href="https://davenov.com"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline"
        >
          Dave
        </a>
      </p>

      {/* Edit Sheets */}
      <EditScheduleSheet
        open={scheduleSheetOpen}
        onOpenChange={setScheduleSheetOpen}
        currentWakeTime={settings?.wakeTime ?? "07:00"}
        currentSleepTime={settings?.sleepTime ?? "23:00"}
        currentInterval={settings?.pouchIntervalMinutes ?? 120}
        dailyLimit={dailyLimit}
        onSave={handleScheduleSave}
      />

      <EditCostSheet
        open={costSheetOpen}
        onOpenChange={setCostSheetOpen}
        currentCurrency={settings?.currency ?? "USD"}
        currentPricePerCan={settings?.pricePerCan ?? null}
        currentPouchesPerCan={settings?.pouchesPerCan ?? 20}
        onSave={handleCostSave}
      />

      <EditWhySheet
        open={whySheetOpen}
        onOpenChange={setWhySheetOpen}
        currentWhy={settings?.personalWhy ?? null}
        onSave={handleWhySave}
      />

      <EditBaselineSheet
        open={baselineSheetOpen}
        onOpenChange={setBaselineSheetOpen}
        currentDailyPouches={settings?.baselineDailyPouches ?? 10}
        currentStrengthMg={settings?.baselineStrengthMg ?? 8}
        onSave={handleBaselineSave}
      />

      <ThemeToggleSheet
        open={themeSheetOpen}
        onOpenChange={setThemeSheetOpen}
      />

      <DeleteDataSheet
        open={deleteSheetOpen}
        onOpenChange={setDeleteSheetOpen}
        journeyStats={journeyStats}
        onArchiveAndDelete={handleArchiveAndDelete}
        onDeleteOnly={handleDeleteOnly}
      />

      <ArchivesViewerSheet
        open={archivesSheetOpen}
        onOpenChange={setArchivesSheetOpen}
        archives={archives}
      />

      <BackupSyncSheet
        open={backupSheetOpen}
        onOpenChange={setBackupSheetOpen}
      />
    </div>
  );
}
