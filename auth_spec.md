# Authentication & Sync Implementation Spec

## Overview

Implement authentication actions (mnemonic copy/paste and passkey) using Evolu's built-in auth system. This enables users to back up their data and sync across devices.

**Reference Implementation:** [Evolu React Vite PWA Example](https://github.com/evoluhq/evolu/blob/main/examples/react-vite-pwa/src/components/EvoluMinimalExample.tsx)

---

## Core Behaviors

### Data Handling on Import

- **Replace local data:** When importing data via mnemonic or passkey, all local data is replaced with the imported/synced data
- No merge, no prompt - clean replacement

### Post-Import Flow

- If imported account has completed onboarding (`onboardingCompleted: true`), skip directly to home screen
- If imported account hasn't completed onboarding, start onboarding from step 1

### Error Handling

- **Silent fallback for invalid imports:** If mnemonic validation fails or passkey auth fails, don't show explicit error - flow naturally allows retry
- **Toast notifications for operational errors:** Passkey registration failure, clipboard failure, etc. show brief toast messages
- **No rate limiting:** Users can retry auth actions unlimited times - OS/Evolu handles any needed throttling

---

## Settings Page Changes

### Location

Replace the current **Owner ID** display in "Data & Privacy" section with the new auth entry point.

### Entry Point UI

- **Single tappable row** labeled "Backup & Sync"
- Cloud/sync icon on the left
- **Sync status indicator:**
  - If passkey is registered: Show small "Synced" badge/checkmark on the row
  - If no passkey: No indicator (implies local-only)

### Auth Modal (Sheet)

When "Backup & Sync" row is tapped, open a **bottom sheet** containing:

#### Header Description

Brief explanatory text at the top:

> "Keep your progress safe. Use a passkey for easy access on this device, or save your recovery phrase to restore on any device."

#### Sync Status (in modal)

- If synced: Show "Synced" indicator with checkmark
- If local-only: Show nothing or subtle "Local only" text

#### Actions (Separate Buttons)

**1. Add Passkey Button**

- Always visible and tappable (even if already registered - allows re-registration)
- Uses **silent/anonymous username** - auto-generate identifier, don't prompt user
- On success: Button shows checkmark state briefly, then modal auto-closes
- On failure: Toast notification with error message

**2. Copy Recovery Phrase Button**

- Copies the mnemonic to clipboard
- On success: Button temporarily shows checkmark/success state (no toast), modal auto-closes
- On failure: Toast notification "Failed to copy", mnemonic stays hidden

**3. Import Recovery Phrase Button**

- Opens nested sheet/view with:
  - **Single textarea** for pasting entire 12/24-word phrase
  - "Import" button
  - Validation on submit only (not real-time)
  - On valid mnemonic: Import data, reload app (no confirmation step)
  - On invalid: Show inline error message

#### Footer Link

Small text at bottom of modal:

> "Powered by [Evolu](https://evolu.dev) - your data stays yours"

---

## Onboarding Changes

### Welcome Screen (First Step)

Add import option below the primary CTA:

```
[Get Started Button - Primary CTA]

Import existing data  <- Text link, minimal styling
```

### Import Flow

When "Import existing data" is tapped, open a **bottom sheet** with:

#### Header Description

> "Import your data from another device."

#### Two Action Buttons

**1. Use Passkey**

- Triggers passkey authentication
- On success: Import data, skip to appropriate screen (home if onboarding complete, step 1 if not)
- On failure: Silent - modal stays open for retry

**2. Enter Recovery Phrase**

- Shows textarea input for mnemonic paste
- Single textarea, paste all words at once
- Validate on "Import" button tap only
- On success: Import data, skip to appropriate screen
- On failure: Silent fallback - if invalid, nothing happens, user can retry or close

#### Footer Link

Small text at bottom of modal:

> "Powered by [Evolu](https://evolu.dev) - your data stays yours"

---

## Technical Implementation

### Evolu Functions to Use

```typescript
// From evolu instance
import { useEvolu } from "@/lib/evolu/schema";

const evolu = useEvolu();

// Get app owner (includes mnemonic)
const appOwner = use(evolu.appOwner);

// Mnemonic operations
import * as Evolu from "@evolu/react";

// Validate mnemonic
const result = Evolu.Mnemonic.from(mnemonicString.trim());
if (result.ok) {
  await evolu.restoreAppOwner(result.value);
}

// Passkey operations (via localAuth)
import { localAuth } from "@evolu/react";

// Register passkey (use generated username)
const username = `pouchtracker-${Date.now()}`;
await localAuth.register(username, {
  service: "pouchtracker",
  mnemonic: appOwner.mnemonic, // Transfer current mnemonic
});

// Import with passkey
await localAuth.login(ownerId, { service: "pouchtracker" });

// After auth changes
evolu.reloadApp();
```

### Sync Status Detection

To determine if passkey is registered / device is "synced":

```typescript
// Check if there's an authenticated owner vs guest
const authResult = use(evolu.authResult);
const isSynced = Boolean(authResult?.owner);
```

### New Components to Create

1. **`src/components/settings/backup-sync-sheet.tsx`**
   - Main auth modal for settings
   - Contains passkey and mnemonic actions

2. **`src/components/onboarding/import-data-sheet.tsx`**
   - Import modal for onboarding welcome screen
   - Passkey and mnemonic import options

### Files to Modify

1. **`src/app/(main)/settings/settings-content.tsx`**
   - Remove Owner ID display
   - Add "Backup & Sync" row with sync indicator
   - Import and use BackupSyncSheet

2. **`src/app/onboarding/page.tsx`**
   - Add "Import existing data" text link
   - Import and use ImportDataSheet

3. **`src/lib/evolu/schema.tsx`**
   - Ensure appOwner and authResult are properly exposed
   - Add localAuth import if not present

---

## UI/UX Summary

| Element           | Style                            | Behavior                       |
| ----------------- | -------------------------------- | ------------------------------ |
| Settings entry    | Single row "Backup & Sync"       | Opens sheet                    |
| Sync indicator    | Small badge on row + in modal    | Shows if passkey registered    |
| Onboarding import | "Import existing data" text link | Opens sheet                    |
| Evolu attribution | Footer link in both modals       | Links to evolu.dev             |
| All modals        | Bottom sheets                    | Consistent with app            |
| Passkey register  | Silent username                  | Auto-generated                 |
| Mnemonic input    | Single textarea                  | Validate on submit             |
| Success feedback  | Button state change              | Checkmark, then auto-close     |
| Error feedback    | Toast notification               | Brief, auto-dismiss            |
| Data import       | Replace all                      | No merge, no confirm           |
| Post-import       | Smart redirect                   | Home if onboarded, else step 1 |
| Disconnect        | Not available                    | Once synced, always synced     |

---

## Edge Cases

1. **User has local data, imports different account**
   - Local data is replaced entirely

2. **Import fails mid-process**
   - Evolu handles rollback, app state unchanged

3. **Passkey not supported by browser**
   - Toast error, mnemonic remains available as fallback

4. **Clipboard API not available**
   - Toast error on copy attempt, mnemonic stays hidden

5. **User closes browser mid-onboarding**
   - Onboarding starts fresh from step 1 next time

---

## Testing Checklist

- [ ] Copy mnemonic shows success state, copies to clipboard
- [ ] Paste invalid mnemonic shows error, allows retry
- [ ] Paste valid mnemonic restores data and reloads
- [ ] Passkey registration works with auto-generated username
- [ ] Passkey re-registration works (updates existing)
- [ ] Passkey import restores correct data
- [ ] Sync indicator shows correctly based on auth state
- [ ] Settings row shows sync badge when appropriate
- [ ] Onboarding "Import existing data" link opens correct sheet
- [ ] Evolu footer links work in both modals
- [ ] Post-import redirects to correct screen based on onboarding status
- [ ] All modals are sheets (slide from bottom)
- [ ] Auto-close works after successful actions
- [ ] Toast errors display for failures
