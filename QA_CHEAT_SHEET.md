# QA TEST CHEAT SHEET - Quick Reference

**🎮 Game URL:** `file:///C:/Users/David/Desktop/POKETIME%20-%20Copie/index.html`

---

## 🚀 Quick Start (Copy-Paste)

### 1. Load Test Script
```javascript
// Paste entire qa-test-suite.js contents, then:
runQATests()
```

### 2. Generate HTML Report
```javascript
localStorage.setItem('qa_test_results', JSON.stringify(QA_TEST_RESULTS));
// Open qa-report.html
```

---

## 🔧 Essential Console Commands

### Inspect Game State
```javascript
game                          // Game object
game.playerTeam               // Team creatures
game.pokedollars              // Currency
game.storage                  // Storage creatures
```

### Save Management
```javascript
// View save
JSON.parse(localStorage.getItem('creatureGameSave'))

// Backup (copy output)
localStorage.getItem('creatureGameSave')

// Restore (paste saved JSON)
localStorage.setItem('creatureGameSave', 'PASTE_JSON_HERE')

// Delete save
localStorage.removeItem('creatureGameSave')
location.reload()
```

### Quick Tests
```javascript
// Test invalid JSON (DESTRUCTIVE!)
localStorage.setItem('creatureGameSave', '{invalid}');
location.reload();

// Test 365-day offline
const save = JSON.parse(localStorage.getItem('creatureGameSave'));
save.lastSaveTime = Date.now() - (365 * 24 * 60 * 60 * 1000);
localStorage.setItem('creatureGameSave', JSON.stringify(save));
location.reload();

// Test extreme values
const save = JSON.parse(localStorage.getItem('creatureGameSave'));
save.pokedollars = 999999999999999;
localStorage.setItem('creatureGameSave', JSON.stringify(save));
location.reload();
```

### Check for Issues
```javascript
// Find broken images
document.querySelectorAll('img').forEach(img => {
    if (!img.complete || img.naturalHeight === 0) 
        console.error('Broken:', img.src);
});

// Find visible modals
document.querySelectorAll('.stats-modal, .compact-popup')
    .forEach(m => console.log(m.id, getComputedStyle(m).display));

// Monitor errors
let errors = 0;
const orig = console.error;
console.error = (...args) => { errors++; orig(...args); };
```

---

## 📋 Test Checklist

### Test 1: Initial Load ✓
- [ ] No red console errors
- [ ] All stats visible (HP, ATK, etc.)
- [ ] Images load correctly
- [ ] Menu button works

### Test 2a: Invalid JSON ✓
```javascript
localStorage.setItem('creatureGameSave', '{bad json}');
location.reload();
```
- [ ] Error message shown
- [ ] Game doesn't crash

### Test 2b: Partial Save ✓
```javascript
localStorage.setItem('creatureGameSave', '{"pokedollars":100}');
location.reload();
```
- [ ] Validation error shown
- [ ] Save rejected

### Test 2c: Absurd Values ✓
```javascript
const save = JSON.parse(localStorage.getItem('creatureGameSave'));
save.pokedollars = 999999999999999999;
save.playerMainStats.hp = Infinity;
localStorage.setItem('creatureGameSave', JSON.stringify(save));
location.reload();
```
- [ ] No "NaN" in UI
- [ ] No "Infinity" in UI
- [ ] Numbers formatted

### Test 3: Offline Gains ✓
```javascript
const save = JSON.parse(localStorage.getItem('creatureGameSave'));
save.lastSaveTime = Date.now() - (365*24*60*60*1000);
localStorage.setItem('creatureGameSave', JSON.stringify(save));
location.reload();
```
- [ ] Offline modal appears
- [ ] Time looks reasonable
- [ ] No NaN/Infinity
- [ ] Game responsive after

### Test 4: Click Stress ✓
```javascript
const btns = [
    document.querySelector('[onclick="game.openSaveManager()"]'),
    document.getElementById('autoSelectBtn'),
    document.getElementById('captureModeBtn')
].filter(b => b);
let i = 0;
const int = setInterval(() => {
    btns.forEach(b => b?.click());
    if (++i > 400) clearInterval(int);
}, 50);
```
- [ ] No console errors
- [ ] No duplicate modals
- [ ] Game still responsive

### Test 5: Large Numbers ✓
```javascript
const save = JSON.parse(localStorage.getItem('creatureGameSave'));
save.pokedollars = 999999999999999;
save.questTokens = 888888888888;
localStorage.setItem('creatureGameSave', JSON.stringify(save));
location.reload();
```
- [ ] Numbers fit in UI
- [ ] Formatted with K/M/B/T/Q
- [ ] No overflow

---

## 🔥 Emergency Commands

### Restore Game (if broken)
```javascript
// Import backup save via Menu → Importer
// OR hard reset:
localStorage.removeItem('creatureGameSave');
location.reload();
```

### Force Refresh UI
```javascript
game.updateDisplay();
game.updateHeaderDisplay();
game.updateTeamDisplay();
```

### Check Game Health
```javascript
console.log('Team:', game.playerTeam.length);
console.log('Money:', game.pokedollars);
console.log('Active:', game.activeCreatureIndex);
console.log('Modals:', document.querySelectorAll('[class*="modal"]').length);
```

---

## 🐛 Common Issues & Fixes

### "game is undefined"
→ Wait 5 seconds, scripts still loading

### "Cannot read property of null"
→ Element missing, check HTML structure

### Tests won't run
→ Paste entire qa-test-suite.js first

### Modal stuck open
→ Click background or `game.closeAllModals()` (if exists)

### Need to reset
→ Menu → Réinitialiser (DESTRUCTIVE) or clear localStorage

---

## 📊 Finding Template

```
FINDING: [Brief title]
Severity: [CRITICAL/MAJOR/MINOR]
Test: [1/2a/2b/2c/3/4/5]

Repro:
1. [Step]
2. [Step]
3. [Step]

Observed: [What happened]
Expected: [What should happen]
Root Cause: [Code issue if known]
```

---

## 🎯 Quick Severity Guide

🔴 **CRITICAL** - Crash, data loss, blocking  
🔶 **MAJOR** - Broken feature, bad UX  
⚠️ **MINOR** - Cosmetic, edge case  
✅ **PASS** - Works correctly

---

## 📝 Report Structure

```
=== QA SMOKE TEST RESULTS ===

SUMMARY:
- Critical: X
- Major: X
- Minor: X
- Pass: X

FINDINGS:
1. [Finding 1]
2. [Finding 2]
...

ENVIRONMENT:
- Browser: [Name + Version]
- Date: [YYYY-MM-DD]
- Constraints: [List any]

RESIDUAL RISKS:
- [What wasn't tested]
```

---

## 🛡️ Pre-Test Safety

**ALWAYS DO FIRST:**
```javascript
// Backup save
game.exportSaveFile(); // Downloads JSON
```

**OR in console:**
```javascript
// Copy to clipboard
copy(localStorage.getItem('creatureGameSave'));
// Save to text file
```

---

## ⚡ Speed Run (5 min version)

```javascript
// 1. Load game, open console (F12)
// 2. Paste qa-test-suite.js
// 3. Run:
runQATests()
// 4. Check results:
console.table(QA_TEST_RESULTS.map(r => ({
    Severity: r.severity,
    Title: r.title
})));
// Done!
```

---

## 🎓 Learning Points

**Key Files:**
- `saveSystem.js` - Save/load logic
- `formatters.js` - Number formatting
- `game.js` - Core game logic
- `index.html` - UI structure

**Key Functions:**
- `validateSaveData()` - Save validation
- `formatNumber()` - Number display
- `loadGameLogic()` - Load handler
- `catchupMissedCombats()` - Offline gains

---

## 📞 Help

**Test Suite Issues:**
- Ensure game fully loaded (5-10 sec)
- Check `typeof game === "object"`
- Refresh and retry

**Game Issues:**
- See CODE_ANALYSIS_REPORT.md
- Check console for errors
- Export save before major changes

---

**End of Cheat Sheet**

💡 **Tip:** Print or keep this open in a separate window while testing!
