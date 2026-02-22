# POKETIME QA Test Suite - Complete Package

## 📦 What You Have

This package contains everything needed to perform comprehensive QA testing on the POKETIME web game:

### Files Created:

1. **`qa-test-suite.js`** - Automated test script (run in browser console)
2. **`qa-report.html`** - Visual HTML report generator
3. **`QA_MANUAL_GUIDE.md`** - Step-by-step manual testing instructions
4. **`CODE_ANALYSIS_REPORT.md`** - Static code analysis and predicted findings
5. **`README_QA.md`** (this file) - Overview and quick start

---

## 🚀 Quick Start (3 Steps)

### Option A: Automated Testing (Recommended)

1. **Open the game:**
   ```
   file:///C:/Users/David/Desktop/POKETIME%20-%20Copie/index.html
   ```

2. **Open browser DevTools console (F12)**, then paste contents of `qa-test-suite.js`

3. **Run tests:**
   ```javascript
   runQATests()
   ```

4. **View results** in console, OR generate HTML report:
   ```javascript
   localStorage.setItem('qa_test_results', JSON.stringify(QA_TEST_RESULTS));
   // Then open qa-report.html in browser
   ```

### Option B: Manual Testing

1. Open `QA_MANUAL_GUIDE.md`
2. Follow step-by-step instructions
3. Document findings in report template at end of guide

---

## 📋 Test Coverage

### Test Scenarios:

| # | Test Name | What It Tests | Time |
|---|-----------|---------------|------|
| 1 | **Initial Load Sanity** | Page loads, no JS errors, assets present | 1 min |
| 2a | **Invalid JSON Save** | Graceful handling of corrupt localStorage | 2 min |
| 2b | **Partial Save** | Validation of incomplete save data | 2 min |
| 2c | **Absurd Values** | NaN/Infinity handling, number clamping | 3 min |
| 3 | **Offline Gains** | Time jump simulation (365 days), bounded gains | 3 min |
| 4 | **Click Stress** | Rapid UI interaction, modal duplication, race conditions | 20 sec |
| 5 | **Large Number UI** | Display overflow, number formatting | 2 min |

**Total Estimated Time:** 15-20 minutes

---

## 📊 Expected Findings (From Code Analysis)

Based on static analysis of `saveSystem.js`, `formatters.js`, and `index.html`:

### High-Likelihood Issues:

1. **🔴 MAJOR:** `formatNumber()` displays "NaN" or "Infinity" for invalid inputs
   - **Location:** `formatters.js:10-21`
   - **Test:** 2c, 5
   - **Fix:** Add `isNaN()` and `isFinite()` checks

2. **🔶 MAJOR:** No suffix beyond Billions (no T, Q, etc.)
   - **Location:** `formatters.js:11-12`
   - **Test:** 5
   - **Fix:** Add Trillion/Quadrillion cases

3. **⚠️ MINOR:** Offline time unbounded (potential overflow)
   - **Location:** `saveSystem.js:492`
   - **Test:** 3
   - **Fix:** Cap offline time to reasonable max (7 days)

### Low-Likelihood Issues:

4. Missing image assets (depends on `img/` folder contents)
5. Modal duplication under extreme click spam (rare)

---

## 🎯 Success Criteria

### Minimum Acceptable:
- ✅ Zero CRITICAL bugs
- ✅ No more than 2 MAJOR bugs
- ✅ Game loads and runs without crashes
- ✅ Save/Load functional

### Ideal Quality:
- ✅ All tests PASS
- ✅ Clean console (no errors)
- ✅ Graceful error handling for all edge cases

---

## 🛠️ Pre-Test Fixes (Optional)

If you want to address predicted issues BEFORE testing:

### Fix 1: formatNumber() Safety

**File:** `formatters.js` (lines 10-21)

Replace:
```javascript
function formatNumber(num) {
    if (num >= 1000000000) {
        return (num / 1000000000).toFixed(2) + 'B';
    }
    // ...
}
```

With:
```javascript
function formatNumber(num) {
    // Safety checks
    if (num == null || isNaN(num)) return '0';
    if (!isFinite(num)) return '999.99Q+';
    
    // Extended suffixes
    if (num >= 1e15) return (num / 1e15).toFixed(2) + 'Q'; // Quadrillion
    if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T'; // Trillion
    if (num >= 1e9)  return (num / 1e9).toFixed(2) + 'B';  // Billion
    if (num >= 1e6)  return (num / 1e6).toFixed(2) + 'M';  // Million
    if (num >= 1e3)  return (num / 1e3).toFixed(2) + 'K';  // Thousand
    
    return Math.floor(num).toString();
}
```

### Fix 2: Offline Time Cap

**File:** `saveSystem.js` (line 492)

Replace:
```javascript
const offlineTime = Date.now() - gameData.lastSaveTime;
```

With:
```javascript
const offlineTime = Date.now() - gameData.lastSaveTime;
const MAX_OFFLINE = 7 * 24 * 60 * 60 * 1000; // Cap at 7 days
const cappedOfflineTime = Math.min(Math.max(0, offlineTime), MAX_OFFLINE);
```

Then use `cappedOfflineTime` instead of `offlineTime` throughout the function.

---

## 📝 How to Report Findings

### Format:

```
FINDING #1: [Title]
Severity: [CRITICAL / MAJOR / MINOR]
Test: [Test number that exposed it]

Repro Steps:
1. [Step 1]
2. [Step 2]
3. [Step 3]

Observed Behavior:
[What actually happened]

Expected Behavior:
[What should happen]

Root Cause:
[Code location and reason, if identifiable]

Screenshot:
[Attach if UI-related]
```

### Severity Definitions:

- **🔴 CRITICAL:** Game crash, data loss, blocking progression
- **🔶 MAJOR:** Significant functionality broken, poor UX, confusing errors
- **⚠️ MINOR:** Cosmetic issues, minor bugs, edge case problems
- **✅ PASS:** Test completed successfully, no issues

---

## 🔍 Console Commands Reference

Useful commands while testing:

```javascript
// Check game state
game
game.playerTeam
game.pokedollars

// View save data
JSON.parse(localStorage.getItem('creatureGameSave'))

// Force save
game.saveGame()

// Export save (backup before tests!)
game.exportSaveFile()

// Check for modals
document.querySelectorAll('.stats-modal, .compact-popup')
    .forEach((m, i) => console.log(i, m.id, getComputedStyle(m).display));

// Check for broken images
document.querySelectorAll('img').forEach(img => {
    if (!img.complete || img.naturalHeight === 0) {
        console.error('Broken:', img.src);
    }
});

// Monitor console errors
let errorCount = 0;
const orig = console.error;
console.error = function(...args) {
    errorCount++;
    orig.apply(console, args);
};
```

---

## 🎮 Test Execution Tips

1. **Always backup your save first** (Menu → Exporter)
2. **Use a separate browser profile** to avoid affecting your main save
3. **Clear cache** between test runs if you modify code
4. **Watch the console** during all manual interactions
5. **Take screenshots** of any UI issues
6. **Test in multiple browsers** if possible (Chrome, Firefox, Edge)

---

## 📂 File Structure

```
POKETIME - Copie/
├── index.html               # Main game file
├── game.js                  # Core game logic
├── saveSystem.js            # Save/load/import/export
├── formatters.js            # Number/time formatting
├── constants.js             # Game data
├── [other game files...]
│
├── qa-test-suite.js         # 🆕 Automated test script
├── qa-report.html           # 🆕 HTML report generator
├── QA_MANUAL_GUIDE.md       # 🆕 Manual test instructions
├── CODE_ANALYSIS_REPORT.md  # 🆕 Static code analysis
└── README_QA.md             # 🆕 This file
```

---

## ⚠️ Limitations & Constraints

### Cannot Test (Technical Limitations):
- ❌ Manual file picker interactions (browser security)
- ❌ Network conditions / sprite loading failures
- ❌ Long-term memory leaks (requires extended session)
- ❌ Mobile device / touch interactions

### Requires Manual Verification:
- ⚠️ Save import with corrupt files (must use file picker)
- ⚠️ Page reload tests (automated script can't reload itself)
- ⚠️ Visual UI overflow (must inspect visually)

---

## 🐛 Known Issues (From Analysis)

See `CODE_ANALYSIS_REPORT.md` for full details.

**Top 3 Predicted Issues:**
1. formatNumber() fails on NaN/Infinity → displays "NaN" in UI
2. No Trillion/Quadrillion suffixes → large numbers show as "999999999999.00B"
3. Offline time uncapped → 365-day gap may overflow or freeze

---

## 📞 Support / Questions

If you encounter issues with the test suite itself:

1. Ensure you're running tests in the **browser console** (not Node.js)
2. Check that `game` object exists: `typeof game` should return `"object"`
3. Verify page is fully loaded before running tests
4. Try reloading page and re-pasting test script

---

## ✅ Next Steps

1. **Read this file** ✓ (You are here!)
2. **Backup your save** (Menu → Exporter)
3. **Run automated tests** OR follow manual guide
4. **Review findings** (console or HTML report)
5. **Fix critical issues** (if any found)
6. **Re-test** to verify fixes

---

## 📈 Improvement Roadmap

After QA testing, consider:

1. **Unit tests** for formatNumber(), validateSaveData()
2. **Integration tests** for save/load cycle
3. **Performance profiling** for long sessions
4. **Cross-browser testing** (BrowserStack, etc.)
5. **Accessibility audit** (screen readers, keyboard nav)

---

## 🎉 Conclusion

This QA test suite provides:
- ✅ Comprehensive coverage of critical systems
- ✅ Both automated and manual testing options
- ✅ Clear documentation and reporting
- ✅ Actionable findings with root cause analysis
- ✅ Code-level recommendations for fixes

**Estimated time investment:** 20-30 minutes  
**Expected ROI:** Catch 3-5 major bugs before users do!

---

**Ready to test?** → Open `QA_MANUAL_GUIDE.md` or run `qa-test-suite.js`

**Good luck!** 🚀
