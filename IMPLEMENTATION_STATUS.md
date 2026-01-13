# PouchFree Implementation Status

> **Last Updated:** 2026-01-13 (Added auto interval calculation based on waking hours and daily target)
> **Overall Progress:** ~99% Complete

This document tracks implementation status against [SPEC.md](./SPEC.md). Update this file when making changes to the codebase.

---

## Quick Reference

| Category        | Status                        |
| --------------- | ----------------------------- |
| Onboarding      | 7/7 screens + import flow     |
| Main Navigation | 4/4 tabs                      |
| Database Schema | 8/8 tables                    |
| Core Features   | 20/21 complete                |
| Achievements    | 14 defined, 14 auto-unlocking |
| Auth/Sync       | Passkey + Mnemonic            |

---

## Feature Status by SPEC Section

### 1. Onboarding (Guided Setup)

| Screen           | Status   | File                                    |
| ---------------- | -------- | --------------------------------------- |
| Welcome          | Complete | `src/app/onboarding/page.tsx`           |
| Current Usage    | Complete | `src/app/onboarding/usage/page.tsx`     |
| Custom Strengths | Complete | `src/app/onboarding/strengths/page.tsx` |
| Schedule Setup   | Complete | `src/app/onboarding/schedule/page.tsx`  |
| Cost Tracking    | Complete | `src/app/onboarding/cost/page.tsx`      |
| Tapering Preview | Complete | `src/app/onboarding/preview/page.tsx`   |
| Ready to Start   | Complete | `src/app/onboarding/ready/page.tsx`     |

### 2. Tapering Strategy

| Feature                    | Status   | Notes                                         |
| -------------------------- | -------- | --------------------------------------------- |
| Default 5-phase schedule   | Complete | Auto-generated from baseline                  |
| Phase visualization        | Complete | Timeline view on Plan page                    |
| Manual phase extension     | Complete | +1, +2, +4 week options with toast            |
| Auto-detection of struggle | Complete | Banner suggests extending when 3+ over-limits |
| Custom plan editor         | Complete | Edit phases 1-4, reset to default             |

**Files:** `src/app/(main)/plan/page.tsx`, `src/lib/evolu/schema.tsx`, `src/hooks/use-struggle-detection.ts`, `src/components/settings/edit-plan-sheet.tsx`

### 3. Pouch Logging

| Feature             | Status   | Notes                   |
| ------------------- | -------- | ----------------------- |
| Quick log (one-tap) | Complete | Large button on home    |
| Toast confirmation  | Complete | Via sonner              |
| Timestamp logging   | Complete | Auto + backfill option  |
| Strength logging    | Complete | With override           |
| Trigger selection   | Complete | 6 options + none        |
| Over-limit prompt   | Complete | Compassionate messaging |
| Reflection capture  | Complete | Feeling + plan          |

**Files:** `src/components/logging/quick-log-sheet.tsx`, `src/components/logging/over-limit-reflection.tsx`

### 4. Timer System

| Feature                | Status   | Notes                                       |
| ---------------------- | -------- | ------------------------------------------- |
| Fixed interval timer   | Complete | Configurable                                |
| **Auto interval mode** | Complete | Calculates from waking hours & daily target |
| Sleep hours pause      | Complete | Based on wake/sleep times                   |
| Smart pause (6+ hours) | Partial  | Basic sleep detection                       |
| Counting down state    | Complete | MM:SS display                               |
| Zero/available state   | Complete | Pulse animation                             |
| Sleeping state         | Complete | Shows resume time                           |

**Auto Interval (2026-01-13):** Added "Auto" option in schedule settings that automatically calculates the optimal interval between pouches based on:
- Waking hours (derived from wake/sleep times)
- Current phase daily limit

Formula: `interval = waking_minutes / daily_limit`

When auto mode is enabled (interval = 0), the interval dynamically adjusts as the daily limit changes through tapering phases. Users can switch between Auto and fixed intervals in Settings > Schedule.

**Files:** `src/hooks/use-timer.ts`, `src/app/(main)/page.tsx`, `src/lib/utils.ts`

### 5. Statistics & Dashboard

| Feature           | Status   | Notes                                       |
| ----------------- | -------- | ------------------------------------------- |
| Money saved       | Complete | Calculated from settings                    |
| Streak tracking   | Complete | Current + longest                           |
| Reduction stat    | Complete | Weekly avg vs baseline (min 3 days data)    |
| Daily view        | Complete | Progress bar + triggers                     |
| Weekly view       | Complete | Bar chart                                   |
| Monthly view      | Complete | Heatmap grid                                |
| Trigger analysis  | Complete | Top triggers shown                          |
| Editable baseline | Complete | Edit in Settings for reduction calculations |

**Files:** `src/hooks/use-stats.ts`, `src/app/(main)/progress/page.tsx`, `src/components/settings/edit-baseline-sheet.tsx`

**Fix (2026-01-13):** Reduction stat now correctly shows `"--"` placeholder when insufficient data (<3 days logged). Previously showed 100% when no pouches were logged (treating 0 as perfect reduction). Now:

- Requires minimum 3 completed days with logged data
- Excludes today (incomplete day)
- Skips days with no logs from average
- Shows warning indicator when usage exceeds baseline
- Baseline is now editable in Settings (future calculations only)

### 6. Gamification

| Feature                 | Status              | Notes                                      |
| ----------------------- | ------------------- | ------------------------------------------ |
| Achievement definitions | Complete            | 14 achievements, 4 categories              |
| Achievement UI          | Complete            | Cards, gallery, toast                      |
| **Auto-unlock logic**   | Complete            | All 14 achievements auto-unlock on trigger |
| Export report (PDF)     | **Not Implemented** | No PDF generation                          |

**Achievements Defined:**

| ID                | Name            | Category    | Auto-Unlock |
| ----------------- | --------------- | ----------- | ----------- |
| `patient_one`     | Patient One     | Waiting     | Yes         |
| `master_of_delay` | Master of Delay | Waiting     | Yes         |
| `craving_crusher` | Craving Crusher | Waiting     | Yes         |
| `daily_tracker`   | Daily Tracker   | Consistency | Yes         |
| `honest_logger`   | Honest Logger   | Consistency | Yes         |
| `pattern_spotter` | Pattern Spotter | Consistency | Yes         |
| `phase_pioneer`   | Phase Pioneer   | Milestone   | Yes         |
| `strength_shift`  | Strength Shift  | Milestone   | Yes         |
| `halfway_hero`    | Halfway Hero    | Milestone   | Yes         |
| `zero_day`        | Zero Day        | Milestone   | Yes         |
| `freedom_week`    | Freedom Week    | Milestone   | Yes         |
| `mindful_moment`  | Mindful Moment  | Reflection  | Yes         |
| `growth_mindset`  | Growth Mindset  | Reflection  | Yes         |
| `self_compassion` | Self-Compassion | Reflection  | Yes         |

**Files:** `src/lib/achievements.ts`, `src/hooks/use-achievements.ts`, `src/hooks/use-achievement-auto-unlock.ts`, `src/components/achievements/`

### 7. Craving Support

| Feature                 | Status   | Notes                   |
| ----------------------- | -------- | ----------------------- |
| Wait 5 Minutes timer    | Complete | Circular progress       |
| Breathing exercise      | Complete | 4-7-8 guided (4 rounds) |
| Motivation display      | Complete | Why + savings + streak  |
| Distraction suggestions | Complete | 8 ideas                 |

**Files:** `src/components/craving-support/craving-support-modal.tsx`

### 8. Nicotine-Free Phase

| Feature               | Status   | Notes                                    |
| --------------------- | -------- | ---------------------------------------- |
| Track 0mg separately  | Complete | Progress card on Home, tracks streak     |
| Celebrate milestone   | Complete | `zero_day` achievement unlocks           |
| Final celebration     | Complete | `freedom_week` achievement + Trophy icon |
| Freedom Week progress | Complete | Progress bar toward 7 nicotine-free days |

**Files:** `src/hooks/use-nicotine-free-progress.ts`, `src/app/(main)/page.tsx`

**Bug Fix (2026-01-13):** Fixed streak calculation to only count days with actual 0mg logs as "nicotine-free". Previously, days with no logs were incorrectly counted as nicotine-free, causing new users to immediately receive the "Freedom Week" achievement.

### 9. Relapse Handling

| Feature              | Status   | Notes                             |
| -------------------- | -------- | --------------------------------- |
| Restart Plan         | Complete | Resets to Phase 1                 |
| Adjust Plan          | Complete | Phase extension with +1/+2/+4 wks |
| Encouraging messages | Complete | Throughout app                    |

**Files:** `src/app/(main)/plan/page.tsx`

### 10. Data Management

| Feature                   | Status   | Notes                                      |
| ------------------------- | -------- | ------------------------------------------ |
| Multi-device sync         | Complete | Evolu E2E                                  |
| Offline functionality     | Complete | Local-first                                |
| Data reset                | Complete | Archive + delete, triggers re-onboarding   |
| Archive before reset      | Complete | Saves journey snapshot to archives         |
| Backfill entries          | Complete | Date/time picker                           |
| View archives             | Complete | Archives viewer sheet in Settings          |
| **Backup & Sync UI**      | Complete | Replaced Owner ID with Backup & Sync row   |
| **Passkey registration**  | Complete | Silent username, auto-generated            |
| **Mnemonic copy**         | Complete | One-tap copy to clipboard                  |
| **Mnemonic import**       | Complete | Paste 12/24-word phrase to restore         |
| **Import from passkey**   | Removed  | Not supported cross-device (uses mnemonic) |
| **Sync status indicator** | Complete | Shows "Synced" badge when passkey exists   |
| **Onboarding import**     | Complete | "Import existing data" link on welcome     |

**Files:** `src/lib/evolu/schema.tsx`, `src/lib/evolu/hooks.ts`, `src/components/settings/delete-data-sheet.tsx`, `src/components/settings/archives-viewer-sheet.tsx`, `src/components/settings/backup-sync-sheet.tsx`, `src/components/onboarding/import-data-sheet.tsx`, `src/app/(main)/layout.tsx`

**Auth Implementation (2026-01-13):** Added Backup & Sync feature using Evolu's built-in auth system:

- Settings: "Backup & Sync" row in Data & Privacy section (replaces Owner ID)
- Passkey: Register with auto-generated username for quick device access
- Mnemonic: Copy 12/24-word recovery phrase to restore on any device
- Import: Single textarea for pasting mnemonic, validates on submit
- Onboarding: "Import existing data" text link opens import sheet
- Evolu attribution footer in both modals

**Import Sheet Simplification (2026-01-13):** Removed passkey option from import sheet:

- Evolu's passkey data is stored locally in IndexedDB (doesn't sync across devices)
- Only the passkey credential syncs via iCloud/Google, not the encrypted owner data
- Mnemonic (recovery phrase) is the only reliable cross-device import method
- Import sheet now directly shows mnemonic input without intermediate menu

**Custom Plan Editor (2026-01-13):** Added ability to customize tapering plan:

- Plan page: "Customize plan" button in Adjust Your Plan section
- Edit phases 1-4: Daily limit, strength (mg), and duration (weeks)
- Phase 5 (Freedom) is read-only and automatically starts after phase 4
- Week ranges automatically cascade when durations change
- Reset options: "Reset Values" to restore defaults in form, "Full Reset" to regenerate plan from baseline
- Total journey weeks calculated and displayed

---

## Database Schema Status

| Table            | Status   | Notes                                |
| ---------------- | -------- | ------------------------------------ |
| `userSettings`   | Complete | Singleton pattern                    |
| `customStrength` | Complete | Schema ready                         |
| `taperingPhase`  | Complete | All fields + extension support       |
| `pouchLog`       | Complete | All fields                           |
| `reflection`     | Complete | Links to log                         |
| `achievement`    | Complete | Auto-unlock via hook                 |
| `journeyArchive` | Complete | Full UI in Settings                  |
| `metricEvent`    | Complete | Tracks craving support & timer waits |

**Files:** `src/lib/evolu/schema.tsx`

---

## PWA Status

| Feature            | Status          | Notes                  |
| ------------------ | --------------- | ---------------------- |
| Web manifest       | Complete        | `public/manifest.json` |
| Service worker     | Complete        | Workbox                |
| App icons          | Complete        | All sizes              |
| iOS meta tags      | Complete        | `src/app/layout.tsx`   |
| Push notifications | Not Implemented | Future consideration   |

---

## Priority Implementation Queue

### High Priority (P0)

- [x] Achievement auto-unlock automation
- [x] Phase extension functionality

### Medium Priority (P1)

- [x] Auto-struggle detection (suggest extending)
- [x] 0mg nicotine-free phase tracking (separate UI)
- [x] Journey archive before reset
- [x] Archives viewer UI

### Low Priority (P2)

- [ ] Export report (PDF)
- [x] Custom plan editor

---

## Files Reference

### Core App Pages

- `src/app/(main)/page.tsx` - Home/Dashboard
- `src/app/(main)/progress/page.tsx` - Statistics
- `src/app/(main)/plan/page.tsx` - Tapering plan
- `src/app/(main)/settings/page.tsx` - Settings

### Key Components

- `src/components/logging/quick-log-sheet.tsx` - Pouch logging
- `src/components/logging/over-limit-reflection.tsx` - Reflection modal
- `src/components/craving-support/craving-support-modal.tsx` - Craving help
- `src/components/achievements/` - Achievement UI

### Data Layer

- `src/lib/evolu/schema.tsx` - Database schema
- `src/lib/evolu/hooks.ts` - Data access hooks
- `src/hooks/use-timer.ts` - Timer logic
- `src/hooks/use-stats.ts` - Statistics calculation
- `src/hooks/use-achievements.ts` - Achievement management
- `src/hooks/use-achievement-auto-unlock.ts` - Achievement auto-unlock logic
- `src/hooks/use-struggle-detection.ts` - Struggle detection for phase extension
- `src/hooks/use-nicotine-free-progress.ts` - Nicotine-free phase tracking

### Settings Components

- `src/components/settings/delete-data-sheet.tsx` - Delete/archive data UI
- `src/components/settings/archives-viewer-sheet.tsx` - View journey archives
- `src/components/settings/edit-baseline-sheet.tsx` - Edit baseline for reduction calculations
- `src/components/settings/edit-plan-sheet.tsx` - Custom plan editor for phases 1-4
- `src/components/settings/backup-sync-sheet.tsx` - Backup & Sync with passkey/mnemonic

### Onboarding Components

- `src/components/onboarding/import-data-sheet.tsx` - Import data from passkey/mnemonic

### Configuration

- `public/manifest.json` - PWA manifest
- `src/app/layout.tsx` - Root layout with meta tags
