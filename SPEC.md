# PouchTracker - Nicotine Tapering App

A compassionate, local-first Progressive Web App to help users quit nicotine pouches through a structured tapering strategy with full tracking, gamification, and craving support. Will be hosted on pouchfree.app domain.

## Tech Stack

- **Framework**: Next.js (latest stable) configured as SPA
- **Runtime**: Bun
- **Database**: Evolu (local-first, E2E encrypted sync)
- **UI**: shadcn/ui + Tailwind CSS
- **Target**: Mobile-first PWA (installable to home screen)
- **Hosting**: Vercel

---

## Core Features

### 1. Onboarding (Guided Setup - 5-7 screens)

1. **Welcome** - Brief intro, encouragement that every quit attempt matters
2. **Current Usage** - Daily pouch count + strength (with brand presets: Velo, Zyn, On!, etc.)
3. **Custom Strengths** - Allow adding custom mg values for other brands
4. **Schedule Setup** - Wake/sleep times for timer calculations
5. **Cost Tracking** - Price per can/pouch (regional estimates as default, manual override allowed)
6. **Tapering Preview** - Show generated plan based on input, allow customization
7. **Ready to Start** - Confirm start date, sync setup (optional)

### 2. Tapering Strategy

#### Default Schedule (based on 20x10mg daily baseline)

```
Phase 1: Frequency Reduction (Weeks 1-4)
├── Week 1-2: 18 pouches/day @ 10mg (10% reduction)
└── Week 3-4: 16 pouches/day @ 10mg

Phase 2: Strength Reduction (Weeks 5-8)
├── Week 5-6: 16 pouches/day @ 6mg
└── Week 7-8: 14 pouches/day @ 6mg

Phase 3: Further Tapering (Weeks 9-12)
├── Week 9-10: 12 pouches/day @ 4mg
└── Week 11-12: 10 pouches/day @ 4mg

Phase 4: Final Taper (Weeks 13-16)
├── Week 13-14: 6-8 pouches/day @ 4mg
└── Week 15-16: 3-5 pouches/day @ 4mg

Phase 5: Transition to Zero (Weeks 17-18)
├── 2-3 nicotine-free pouches/day
└── Complete quit
```

#### Phase Flexibility

- **Manual extension**: User can extend any phase when not ready
- **Auto-detection**: App detects struggle patterns (frequent limit exceeding) and suggests extending
- **Combination**: Both options available - user control with supportive suggestions

### 3. Pouch Logging

#### Quick Log Flow (One-tap primary)

- Large, prominent "Log Pouch" button
- Single tap logs with current phase defaults
- Toast confirmation with option to edit

#### Log Data Captured

- **Timestamp** (with backfill option for missed entries)
- **Strength** (auto-suggest current phase, allow override)
- **Trigger** (optional quick-tap: stress, habit, social, after meal, boredom, craving)

#### Exceeding Daily Limit

When user logs beyond their daily limit:

1. Gentle, non-judgmental prompt appears
2. Ask how they're feeling (quick emotion picker or free text)
3. Encourage self-compassion: "Every moment is a chance to start fresh"
4. Prompt reflection: "What could help next time?"
5. Log the reflection for pattern awareness

### 4. Timer System

#### Fixed Interval Timer

- User sets interval between pouches (e.g., 45 min, 1 hour)
- Timer pauses during sleep hours (configurable wake/sleep times)
- Smart pause: No logs for 6+ hours = assume sleeping

#### Timer States

- **Counting down**: Shows time until next pouch is "available"
- **Zero**: Subtle visual pulse indicating it's available (not pushy)
- **Available**: Soft glow/animation, not alarm-like

### 5. Statistics & Dashboard

#### Key Metrics

- **Money Saved**: Based on user-input prices or regional estimates
- **Streak Tracking**: Days staying within limits, longest streak
- **Daily/Weekly/Monthly views**
- **Progress through phases**

#### Visualizations

- Progress rings (Apple Health inspired)
- Trend charts for usage patterns
- Trigger pattern analysis (if triggers logged)

### 6. Gamification (Full - Behavioral Focus)

#### Achievement Categories

**Waiting Achievements**

- "Patient One": Waited 10 min past timer 5 times
- "Master of Delay": Average wait time increased by 20%
- "Craving Crusher": Used craving support 10 times

**Consistency Achievements**

- "Daily Tracker": Logged every pouch for 7 days
- "Honest Logger": Logged an over-limit day with reflection
- "Pattern Spotter": Identified your top trigger

**Milestone Achievements**

- "Phase Pioneer": Completed Phase 1
- "Strength Shift": Successfully reduced nicotine strength
- "Halfway Hero": Reached Phase 3
- "Zero Day": First nicotine-free day
- "Freedom Week": 7 days nicotine-free

**Self-Reflection Achievements**

- "Mindful Moment": Completed 10 craving reflections
- "Growth Mindset": Restarted journey (every attempt counts!)
- "Self-Compassion": Acknowledged a hard day kindly

#### Sharing

- **Export Report**: Generate summary PDF for doctor/accountability partner
- No social share buttons (personal journey)

### 7. Craving Support

When user needs help waiting:

1. **"Wait 5 Minutes" Timer**: Suggests waiting, with countdown
2. **Breathing Exercise**: Quick 2-minute guided breathing
3. **Motivation Display**:
   - Money saved so far
   - Days in current streak
   - Personal "why" (set during onboarding)
   - Progress visualization
4. **Distraction suggestions**: Quick activities to occupy hands/mind

### 8. Nicotine-Free Phase (Gradual Fade)

- Track 0mg pouches separately as "transition"
- Celebrate nicotine-free milestone prominently
- Continue tracking 0mg usage
- Final celebration when completely done

### 9. Relapse Handling

User chooses their path:

- **Restart Plan**: Begin fresh with new baseline assessment
- **Adjust Plan**: Modify tapering based on current reality
- Both options available with encouraging messaging: "Every quit attempt brings you closer"

### 10. Data Management

#### Multi-Device Sync

- Evolu E2E encrypted sync across devices
- Works offline first, syncs when connected

#### Offline Functionality (Critical)

- 100% functional offline
- All logging, timer, stats work without connection
- Sync happens automatically when online

#### Data Reset

- **Archive + Restart**: Old data preserved (viewable in history), new journey begins
- Encouraging message: "Every attempt teaches you something valuable"

#### Backfill

- Allow adding past entries with manual timestamps
- Mark estimated entries distinctly

---

## Design System

### Aesthetic

- **Style**: Calm/meditation app inspired (Headspace, Calm)
- **Feel**: Soft, spacious, breathing room - NOT clinical
- **Avoid**: AI slop, generic gradients, over-designed elements

### Color Palette (Soft Greens/Blues)

- **Primary**: Soft sage green (growth, nature, calm)
- **Secondary**: Muted sky blue (clarity, peace)
- **Accent**: Warm gold/amber (achievements, celebration)
- **Neutrals**: Warm grays, off-white backgrounds
- **Success**: Soft teal
- **Warning**: Gentle amber (not alarming)
- **Error**: Muted coral (not aggressive red)

### Theme

- Light mode (default)
- Dark mode
- System preference auto-switch

### Typography

- Clean, readable sans-serif
- Generous line height
- Calming, not clinical

### Interactions

- Smooth, gentle animations
- Satisfying micro-interactions on logging
- Breathing/pulsing elements for timers

---

## Data Schema (Evolu)

### User Settings

```
- wake_time: time
- sleep_time: time
- pouch_interval_minutes: number
- current_phase: number
- start_date: date
- quit_goal_date: date
- currency: string
- price_per_can: number
- pouches_per_can: number
- personal_why: text
```

### Custom Strengths

```
- id: uuid
- brand_name: string
- strength_mg: number
- is_preset: boolean
```

### Tapering Plan

```
- phase: number
- week_start: number
- week_end: number
- daily_limit: number
- strength_mg: number
- is_extended: boolean
- extended_until: date (nullable)
```

### Pouch Logs

```
- id: uuid
- timestamp: datetime
- strength_mg: number
- trigger: enum (stress, habit, social, after_meal, boredom, craving, other, none)
- is_backfill: boolean
- is_over_limit: boolean
```

### Over-Limit Reflections

```
- id: uuid
- log_id: uuid (foreign key)
- feeling: text
- next_time_plan: text
- timestamp: datetime
```

### Achievements

```
- id: uuid
- type: string
- unlocked_at: datetime
- seen: boolean
```

### Journey Archives

```
- id: uuid
- archived_at: datetime
- final_phase: number
- total_days: number
- data_snapshot: json
```

---

## Screen Structure

### Main Navigation (Bottom tabs)

1. **Home** - Timer, quick log, today's status
2. **Progress** - Stats, charts, achievements
3. **Plan** - Tapering schedule, phase details
4. **Settings** - All configuration

### Key Screens

- Onboarding flow (7 screens)
- Home dashboard with timer
- Quick log modal
- Over-limit reflection flow
- Craving support modal
- Achievement gallery
- Progress/stats detail views
- Plan editor
- Settings

---

## PWA Requirements

- Service worker for offline functionality
- Web app manifest for installation
- App icons (all required sizes)
- Splash screens
- iOS-specific meta tags for home screen
- Push notification capability (future consideration)

---

## Future Considerations (Not MVP)

- Push notifications for timer
- Widget support
- Apple Health / Google Fit integration
- Community features (anonymous)
- AI-powered insights
- Voice logging
