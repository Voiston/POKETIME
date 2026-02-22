# POKETIME QA SMOKE TEST - Manual Execution Guide

## Overview
This document provides step-by-step instructions for executing the QA smoke test suite on the POKETIME web game.

**Test URL:** `file:///C:/Users/David/Desktop/POKETIME%20-%20Copie/index.html`

**Estimated Time:** 15-20 minutes

---

## Prerequisites
1. Close all other tabs/windows of the game
2. Clear browser cache if you've made code changes
3. Have DevTools Console open (F12)
4. Bookmark this page for reference

---

## Test Execution Steps

### Option A: Automated Test Suite (Recommended)

1. **Load the game** in your browser
2. **Open DevTools Console** (F12)
3. **Load test script:**
   ```javascript
   // Copy contents of qa-test-suite.js and paste into console
   // OR use this one-liner if serving via http:
   // fetch('qa-test-suite.js').then(r=>r.text()).then(eval)
   ```
4. **Run tests:**
   ```javascript
   runQATests()
   ```
5. **Review results** in console
6. **Generate HTML report:**
   ```javascript
   // Save results to localStorage for HTML report
   localStorage.setItem('qa_test_results', JSON.stringify(QA_TEST_RESULTS));
   // Then open qa-report.html in browser
   ```

### Option B: Manual Test Execution

---

## TEST 1: Initial Load Sanity ✓

**Objective:** Verify page loads without blocking errors

### Steps:
1. Open fresh browser tab
2. Navigate to: `file:///C:/Users/David/Desktop/POKETIME%20-%20Copie/index.html`
3. Open DevTools Console (F12)
4. Wait for page to fully load (5-10 seconds)

### Checkpoints:
- [ ] No red JavaScript errors in console
- [ ] All header stats display (HP, ATK, etc.)
- [ ] All resource chips show (Pokédollars, Jetons, Marques)
- [ ] Combat zone selector is visible
- [ ] Battle sprites load correctly
- [ ] Team/Storage sections render
- [ ] Menu button (☰ MENU) is clickable

### Expected Result:
✅ Page loads completely without blocking errors, all UI elements visible

### Common Issues:
- **Missing pokemonStats.js / gameManager.js:** Check script tags in index.html
- **CORS errors on fonts/images:** Expected for file:// protocol, not critical
- **"game is undefined" in console:** Script load order issue

---

## TEST 2: Save Import Robustness 🛡️

**Objective:** Test graceful handling of corrupted save data

### Test 2a: Invalid JSON

#### Steps:
1. Open DevTools Console (F12)
2. Execute:
   ```javascript
   localStorage.setItem('creatureGameSave', '{invalid json [}');
   location.reload();
   ```
3. After reload, check console for errors
4. Check if game shows error toast/message

#### Expected Result:
✅ Game detects corrupt JSON, shows user-friendly error, does NOT crash

#### Failure Symptoms:
- ❌ Blank white screen
- ❌ Infinite loading
- ❌ No error message to user

---

### Test 2b: Partial Save (Missing Major Fields)

#### Steps:
1. Open Console
2. Execute:
   ```javascript
   localStorage.setItem('creatureGameSave', JSON.stringify({
       pokedollars: 100
       // Missing playerTeam, stats, upgrades
   }));
   location.reload();
   ```
3. After reload, observe behavior

#### Expected Result:
✅ Game rejects partial save with error message: "Données corrompues : équipe manquante ou invalide"

#### Failure Symptoms:
- ❌ Game loads with empty team
- ❌ Stats show as 0 or NaN
- ❌ No validation error shown

---

### Test 2c: Absurd Numeric Values (Infinity, NaN)

#### Steps:
1. **First, export your save** (Menu → Exporter) as backup
2. Open Console
3. Execute:
   ```javascript
   const save = JSON.parse(localStorage.getItem('creatureGameSave'));
   save.pokedollars = 999999999999999999999;
   save.questTokens = Number.MAX_SAFE_INTEGER * 100;
   save.playerMainStats.hp = 999999999999999;
   save.playerMainStats.attack = 888888888888888;
   localStorage.setItem('creatureGameSave', JSON.stringify(save));
   location.reload();
   ```
4. After reload, check:
   - [ ] Header shows "NaN" or "Infinity"?
   - [ ] Numbers display formatted (e.g., "999.9T")?
   - [ ] UI remains functional?

#### Expected Result:
✅ Either:
- Numbers capped/validated on load (e.g., clamped to MAX_SAFE_INTEGER)
- OR displayed with scientific notation/abbreviation
- No "NaN" or "Infinity" visible in UI

#### Failure Symptoms:
- ❌ "NaN" displayed in header
- ❌ "Infinity" in stats
- ❌ UI breaks or becomes unresponsive

#### Cleanup:
```javascript
// Restore backup or hard reset
location.reload();
// Menu → Importer → select your backup file
```

---

## TEST 3: Offline Gains / Time Jump ⏰

**Objective:** Simulate long absence (365 days) and verify bounded offline gains

### Steps:

1. **Backup your save** (Menu → Exporter)
2. Open Console
3. Execute:
   ```javascript
   const save = JSON.parse(localStorage.getItem('creatureGameSave'));
   const oneYearAgo = Date.now() - (365 * 24 * 60 * 60 * 1000);
   save.lastSaveTime = oneYearAgo;
   localStorage.setItem('creatureGameSave', JSON.stringify(save));
   location.reload();
   ```
4. After reload, **wait for offline modal to appear** (should pop up automatically)

### Checkpoints:
- [ ] Offline modal appears ("💤 Rapport de Veille")
- [ ] Time display shows reasonable duration (not "NaN days")
- [ ] Combat count looks reasonable (< 1 million)
- [ ] Loot values are not "Infinity" or "NaN"
- [ ] Pokédollars gain is bounded (not astronomical)
- [ ] Click "Récupérer les gains" - game remains responsive

### Expected Result:
✅ Offline modal shows:
- Time absent: ~365 days
- Bounded combat count (e.g., capped at max offline period)
- Reasonable resource gains (no Infinity/NaN)
- Game remains stable after claiming rewards

### Failure Symptoms:
- ❌ "NaN hours" or "Infinity combats"
- ❌ Game freezes after clicking modal
- ❌ Stats show as NaN after claiming
- ❌ Modal never appears

### Cleanup:
```javascript
location.reload(); // Then import backup save
```

---

## TEST 4: Basic Click Stress 🖱️💥

**Objective:** Rapidly interact with UI to detect race conditions, modal duplication, freezes

### Steps:

1. Start fresh game session (reload page)
2. Open Console (to watch for errors)
3. **Manually** or **via script** rapidly click these buttons for 20-30 seconds:
   - "☰ MENU" button (top right)
   - "AUTO" button (bottom left in combat area)
   - "CAPT" button (capture mode)
   - "Fuir" button (forfeit)
   - Open/close any modal (Stats, Bonus, etc.)

   **Script version:**
   ```javascript
   const buttons = [
       document.querySelector('[onclick="game.openSaveManager()"]'),
       document.getElementById('autoSelectBtn'),
       document.getElementById('captureModeBtn'),
       document.getElementById('forfeitBtn')
   ].filter(b => b);

   let clicks = 0;
   const interval = setInterval(() => {
       buttons.forEach(b => b?.click());
       clicks++;
       if (clicks > 400) clearInterval(interval); // 20 seconds at 50ms intervals
   }, 50);
   ```

4. After clicking stops, check:
   - [ ] Console for new errors
   - [ ] Are multiple modals visible at once? (use DevTools Elements inspector)
   - [ ] Does game still respond to normal clicks?
   - [ ] Can you open/close menu normally?

### Expected Result:
✅ Game remains responsive, no duplicate modals, no console errors

### Failure Symptoms:
- ❌ Multiple overlapping modals visible
- ❌ "Cannot read property of undefined" errors in console
- ❌ UI freezes or stops responding
- ❌ Modal close buttons stop working

---

## TEST 5: Large Number UI Overflow 📊

**Objective:** Verify UI handles extreme currency/stat values without text overflow

### Steps:

1. **Backup save first**
2. Open Console
3. Execute:
   ```javascript
   const save = JSON.parse(localStorage.getItem('creatureGameSave'));
   save.pokedollars = 999999999999999;
   save.questTokens = 888888888888;
   save.marquesDuTriomphe = 777777777;
   if (save.playerMainStats) {
       save.playerMainStats.hp = 123456789012345;
       save.playerMainStats.attack = 987654321098;
   }
   localStorage.setItem('creatureGameSave', JSON.stringify(save));
   location.reload();
   ```
4. After reload, visually inspect **header resource chips**:
   - Pokédollars display
   - Jetons display
   - Marques display
   - HP/ATK stat chips

### Checkpoints:
- [ ] Numbers fit within their containers (no horizontal overflow)
- [ ] No "NaN" or "Infinity" displayed
- [ ] Text is truncated/formatted if too long (e.g., "999.9Q")
- [ ] Icons/images still visible (not pushed out by text)

### Tools:
- Use DevTools "Inspect Element" on resource chips
- Check computed width vs container width
- Screenshot for visual reference

### Expected Result:
✅ Large numbers formatted with abbreviations (K, M, B, T, Q) and fit cleanly in UI

### Failure Symptoms:
- ❌ Numbers overflow container boundaries
- ❌ Raw "999999999999999" displayed (no formatting)
- ❌ "NaN" or "Infinity" visible
- ❌ UI layout breaks (buttons pushed off screen)

### Cleanup:
Import backup save via Menu → Importer

---

## Additional Manual Checks (Quick)

### A. Menu Import Feature
1. Menu → Importer
2. Select a valid save file
3. Verify game reloads correctly

### B. Menu Export Feature
1. Menu → Exporter
2. Check download folder for `.json` file
3. Verify file is valid JSON (open in text editor)

### C. Capture Flow
1. Win a combat
2. Capture modal should appear
3. Click capture button
4. Verify no console errors

### D. Zone Switching
1. Change zone via dropdown
2. Verify zone info updates
3. Start combat in new zone
4. Check enemy matches zone

---

## Report Template

After completing tests, fill out:

```
=== POKETIME QA SMOKE TEST REPORT ===
Date: [YYYY-MM-DD]
Tester: [Your Name]
Browser: [Chrome/Firefox/Edge + Version]
Test URL: file:///C:/Users/David/Desktop/POKETIME%20-%20Copie/index.html

--- SUMMARY ---
✅ PASS: [X]
⚠️ MINOR: [X]
🔶 MAJOR: [X]
🔴 CRITICAL: [X]

--- FINDINGS ---

1. [Title]
   Severity: [CRITICAL/MAJOR/MINOR/PASS]
   Repro: [Steps]
   Observed: [What happened]
   Expected: [What should happen]
   Root Cause: [If identifiable]

2. ...

--- ENVIRONMENT CONSTRAINTS ---
- File:// protocol CORS warnings (expected)
- Manual reload required for save validation tests
- DevTools required for console monitoring

--- RESIDUAL RISKS (NOT TESTED) ---
- Manual file import with deliberately malformed files
- Network failures during sprite loading
- Browser-specific bugs (only tested in [Browser])
- Long session memory leaks
- Mobile device compatibility
```

---

## Quick Reference: Console Commands

```javascript
// Check game state
game.playerTeam
game.pokedollars
game.stats

// Inspect save
JSON.parse(localStorage.getItem('creatureGameSave'))

// Force save
game.saveGame()

// Clear save (DESTRUCTIVE)
localStorage.removeItem('creatureGameSave')
location.reload()

// Export results to HTML report
localStorage.setItem('qa_test_results', JSON.stringify(QA_TEST_RESULTS));
// Then open qa-report.html

// Check for duplicate modals
document.querySelectorAll('.stats-modal, .compact-popup').forEach((m, i) => {
    console.log(i, m.id, window.getComputedStyle(m).display);
});
```

---

## Success Criteria

**Minimum acceptable quality:**
- ✅ Zero CRITICAL findings
- ✅ No more than 2 MAJOR findings
- ✅ Game loads without blocking errors
- ✅ Save/load/export/import functional
- ✅ No crashes during normal interaction

**Excellent quality:**
- ✅ Zero CRITICAL or MAJOR findings
- ✅ All tests PASS
- ✅ Clean console (no errors)
- ✅ Graceful handling of all edge cases

---

## Troubleshooting

**"game is undefined"**
→ Scripts not loaded yet. Wait 5 seconds or run `typeof game` until it returns "object"

**"Cannot read property of null"**
→ Missing DOM element. Check if page fully loaded.

**Tests won't run**
→ Ensure you pasted entire qa-test-suite.js contents into console

**Modal won't close**
→ Click dark background area (outside modal content)

**Need to reset completely**
→ Menu → Réinitialiser le jeu (DESTRUCTIVE!)

---

## Contact / Support

If you find blocking issues:
1. Take screenshot of error
2. Copy console log output
3. Note exact repro steps
4. Export save file before reset

---

**End of Manual Test Guide**
