// Achievement definitions based on SPEC.md

export type AchievementId =
  // Waiting Achievements
  | "patient_one"
  | "master_of_delay"
  | "craving_crusher"
  // Consistency Achievements
  | "daily_tracker"
  | "honest_logger"
  | "pattern_spotter"
  // Milestone Achievements
  | "phase_pioneer"
  | "strength_shift"
  | "halfway_hero"
  | "zero_day"
  | "freedom_week"
  // Self-Reflection Achievements
  | "mindful_moment"
  | "growth_mindset"
  | "self_compassion";

export interface Achievement {
  id: AchievementId;
  name: string;
  description: string;
  emoji: string;
  category: "waiting" | "consistency" | "milestone" | "reflection";
}

export const achievements: Achievement[] = [
  // Waiting Achievements
  {
    id: "patient_one",
    name: "Patient One",
    description: "Waited 10 min past timer 5 times",
    emoji: "⏳",
    category: "waiting",
  },
  {
    id: "master_of_delay",
    name: "Master of Delay",
    description: "Average wait time increased by 20%",
    emoji: "🎯",
    category: "waiting",
  },
  {
    id: "craving_crusher",
    name: "Craving Crusher",
    description: "Used craving support 10 times",
    emoji: "💪",
    category: "waiting",
  },

  // Consistency Achievements
  {
    id: "daily_tracker",
    name: "Daily Tracker",
    description: "Logged every pouch for 7 days",
    emoji: "📊",
    category: "consistency",
  },
  {
    id: "honest_logger",
    name: "Honest Logger",
    description: "Logged an over-limit day with reflection",
    emoji: "💬",
    category: "consistency",
  },
  {
    id: "pattern_spotter",
    name: "Pattern Spotter",
    description: "Identified your top trigger",
    emoji: "🔍",
    category: "consistency",
  },

  // Milestone Achievements
  {
    id: "phase_pioneer",
    name: "Phase Pioneer",
    description: "Completed Phase 1",
    emoji: "🚀",
    category: "milestone",
  },
  {
    id: "strength_shift",
    name: "Strength Shift",
    description: "Successfully reduced nicotine strength",
    emoji: "⚡",
    category: "milestone",
  },
  {
    id: "halfway_hero",
    name: "Halfway Hero",
    description: "Reached Phase 3",
    emoji: "🏆",
    category: "milestone",
  },
  {
    id: "zero_day",
    name: "Zero Day",
    description: "First nicotine-free day",
    emoji: "🌟",
    category: "milestone",
  },
  {
    id: "freedom_week",
    name: "Freedom Week",
    description: "7 days nicotine-free",
    emoji: "🦅",
    category: "milestone",
  },

  // Self-Reflection Achievements
  {
    id: "mindful_moment",
    name: "Mindful Moment",
    description: "Completed 10 craving reflections",
    emoji: "🧘",
    category: "reflection",
  },
  {
    id: "growth_mindset",
    name: "Growth Mindset",
    description: "Restarted journey (every attempt counts!)",
    emoji: "🌱",
    category: "reflection",
  },
  {
    id: "self_compassion",
    name: "Self-Compassion",
    description: "Acknowledged a hard day kindly",
    emoji: "💝",
    category: "reflection",
  },
];

export function getAchievement(id: AchievementId): Achievement | undefined {
  return achievements.find((a) => a.id === id);
}

export function getAchievementsByCategory(
  category: Achievement["category"]
): Achievement[] {
  return achievements.filter((a) => a.category === category);
}
