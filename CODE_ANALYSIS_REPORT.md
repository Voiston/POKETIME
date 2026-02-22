# POKETIME - Code Analysis & Predicted QA Findings

**Analysis Date:** 2026-02-21  
**Analyzed Files:** saveSystem.js, formatters.js, index.html, game.js (partial)

---

## Executive Summary

Based on static code analysis, here are the **predicted issues** ranked by likelihood and severity:

| Severity | Issue | File | Likelihood |
|----------|-------|------|------------|
| 🔴 CRITICAL | No try-catch around JSON.parse in import | saveSystem.js:263 | HIGH |
| 🔶 MAJOR | formatNumber() fails on Infinity/NaN | formatters.js:10-21 | HIGH |
| 🔶 MAJOR | Missing Number.isFinite checks in save validation | saveSystem.js:224 | MEDIUM |
| ⚠️ MINOR | Offline gains unbounded (potential overflow) | saveSystem.js:492-514 | MEDIUM |
| ⚠️ MINOR | No upper limit suffix beyond Billions (B) | formatters.js:11-12 | LOW |

---

## Detailed Analysis

### 1. JSON.parse Safety (CRITICAL)

**File:** `saveSystem.js:263`

**Code:**
```javascript
gameData = JSON.parse(savedData);
```

**Issue:**  
While there IS a try-catch block wrapping this (lines 255-544), the error handling only logs to console and returns false. If this is called during initialization, the game may be left in an undefined state.

**Predicted Test Result:**  
✅ PASS on Test 2a (Invalid JSON) - Exception IS caught  
BUT: User may not see a clear error message (depends on toast availability)

**Recommendation:**
```javascript
try {
    gameData = JSON.parse(savedData);
} catch (parseError) {
    console.error('Sauvegarde corrompue (JSON invalide):', parseError);
    if (typeof toast !== 'undefined') {
        toast.error('Sauvegarde corrompue', 'Le fichier de sauvegarde est illisible.');
    } else {
        alert('Sauvegarde corrompue : impossible de charger.');
    }
    return false;
}
```

---

### 2. formatNumber() NaN/Infinity Handling (MAJOR)

**File:** `formatters.js:10-21`

**Code:**
```javascript
function formatNumber(num) {
    if (num >= 1000000000) {
        return (num / 1000000000).toFixed(2) + 'B';
    }
    if (num >= 1000000) {
        return (num / 1000000).toFixed(2) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(2) + 'K';
    }
    return Math.floor(num).toString();
}
```

**Issues:**
1. **No NaN check:** `formatNumber(NaN)` returns `"NaN"` string
2. **No Infinity check:** `formatNumber(Infinity)` returns `"Infinity"`
3. **No null/undefined check:** `formatNumber(null)` throws error
4. **Limited suffixes:** Only goes to Billions, no Trillions (T), Quadrillions (Q), etc.

**Predicted Test Result:**  
❌ FAIL on Test 2c (Absurd values) - Will display "NaN" or "Infinity" in UI  
❌ FAIL on Test 5 (Large numbers) - No T/Q suffixes for extreme values

**Recommendation:**
```javascript
function formatNumber(num) {
    // Safety checks
    if (num == null || isNaN(num)) return '0';
    if (!isFinite(num)) return '999.99Q+'; // Cap infinity display
    
    // Extended suffixes
    if (num >= 1e15) return (num / 1e15).toFixed(2) + 'Q'; // Quadrillion
    if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T'; // Trillion
    if (num >= 1e9)  return (num / 1e9).toFixed(2) + 'B';  // Billion
    if (num >= 1e6)  return (num / 1e6).toFixed(2) + 'M';  // Million
    if (num >= 1e3)  return (num / 1e3).toFixed(2) + 'K';  // Thousand
    
    return Math.floor(num).toString();
}
```

---

### 3. Save Validation - Incomplete Number Checks (MAJOR)

**File:** `saveSystem.js:224`

**Code:**
```javascript
if (typeof gameData.pokedollars !== 'number' || gameData.pokedollars < 0 || !Number.isFinite(gameData.pokedollars)) 
    return 'Données corrompues : Pokédollars invalides.';
```

**Good:** This line DOES check for:
- Type (must be number)
- Non-negative
- Finite (no Infinity)

**Issue:** This check is ONLY on `pokedollars`. Other numeric fields are not validated:
- `questTokens` - No validation
- `marquesDuTriomphe` - No validation
- `combatTickets` - No validation
- `playerMainStats.hp/attack/etc.` - No validation (line 226 only checks type: object)

**Predicted Test Result:**  
⚠️ PARTIAL PASS on Test 2c - Pokédollars will be caught, but other fields may pass through

**Recommendation:**
```javascript
// Helper function
function isValidNumber(val, min = 0, max = Number.MAX_SAFE_INTEGER) {
    return typeof val === 'number' && Number.isFinite(val) && val >= min && val <= max;
}

// In validateSaveData():
if (!isValidNumber(gameData.pokedollars)) return 'Pokédollars invalides.';
if (gameData.questTokens != null && !isValidNumber(gameData.questTokens)) return 'Jetons invalides.';
// ... repeat for all numeric fields
```

---

### 4. Offline Gains Calculation (MINOR)

**File:** `saveSystem.js:492-514`

**Code:**
```javascript
if (gameData.lastSaveTime) {
    const offlineTime = Date.now() - gameData.lastSaveTime;
    const offlineSeconds = Math.floor(offlineTime / 1000);
    
    if (offlineSeconds > 0) {
        // ...
        if (game.catchupMissedCombats) {
            setTimeout(() => game.catchupMissedCombats(offlineTime), 500);
        }
    }
}
```

**Issue:**  
No upper bound on `offlineTime`. If `lastSaveTime` is set to 0 or a very old date (e.g., Unix epoch), `offlineTime` could be:
- `Date.now() - 0` = ~1.7 billion milliseconds (54 years)
- This gets passed to `catchupMissedCombats()` which may not have bounds

**Predicted Test Result:**  
⚠️ POSSIBLE FAIL on Test 3 (365 days) - Depends on `catchupMissedCombats()` implementation  
If that function has no cap, it could:
- Loop billions of times (freeze)
- Generate Infinity resources
- Overflow number types

**Recommendation:**
```javascript
if (gameData.lastSaveTime) {
    const offlineTime = Date.now() - gameData.lastSaveTime;
    const MAX_OFFLINE = 7 * 24 * 60 * 60 * 1000; // Cap at 7 days
    const cappedOfflineTime = Math.min(offlineTime, MAX_OFFLINE);
    const offlineSeconds = Math.floor(cappedOfflineTime / 1000);
    
    if (offlineSeconds > 0) {
        // Show warning if actual offline > cap
        if (offlineTime > MAX_OFFLINE) {
            logMessage(`⚠️ Absence de ${Math.floor(offlineTime / 86400000)} jours détectée. Gains plafonnés à 7 jours max.`);
        }
        
        if (game.catchupMissedCombats) {
            setTimeout(() => game.catchupMissedCombats(cappedOfflineTime), 500);
        }
    }
}
```

---

### 5. Modal Duplication Risk (MINOR)

**File:** index.html (multiple modal divs)

**Observation:**  
Many modals lack `onclick="event.stopPropagation()"` on their content divs, which is correct. However, there's no global modal manager to ensure only one modal is active at a time.

**Predicted Test Result:**  
⚠️ POSSIBLE FAIL on Test 4 (Click stress) - Rapid clicking may stack modals if:
- Event handlers are re-attached multiple times
- Close handlers fail to execute
- Race conditions in show/hide logic

**Recommendation:**
```javascript
// Global modal manager (add to game.js)
window.activeModals = new Set();

function showModal(modalId) {
    // Close all other modals first
    activeModals.forEach(id => {
        if (id !== modalId) closeModal(id);
    });
    
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('show');
        modal.style.display = 'flex';
        activeModals.add(modalId);
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
        modal.style.display = 'none';
        activeModals.delete(modalId);
    }
}
```

---

### 6. Missing Image Assets (MINOR)

**File:** index.html (various `<img>` tags)

**Examples:**
- `img/pokedollars.png`
- `img/quest-token.png`
- `img/marque-triomphe.png`
- `img/essence-dust.png`
- `img/synergy-off.png`

**Predicted Test Result:**  
⚠️ LIKELY FAIL on Test 1 (Initial load) IF any images are missing  
Browser will show broken image icons (depends on actual file presence)

**Verification:**
Run this in console after page load:
```javascript
document.querySelectorAll('img').forEach(img => {
    if (!img.complete || img.naturalHeight === 0) {
        console.error('Missing:', img.src);
    }
});
```

**Recommendation:**
1. Audit `img/` directory for all required assets
2. Add fallback handling:
```javascript
document.querySelectorAll('img').forEach(img => {
    img.onerror = function() {
        this.style.display = 'none'; // Hide broken images
        console.warn('Missing image:', this.src);
    };
});
```

---

## Positive Findings (Good Code)

✅ **Save validation exists:** `validateSaveData()` function is comprehensive (lines 196-252)  
✅ **Team validation:** Checks for empty team, valid creatures (lines 200-205)  
✅ **Try-catch in load:** Load function is wrapped in try-catch (lines 255-544)  
✅ **Toast error messages:** User-facing error handling via toast system  
✅ **Backup mechanism:** Export/Import functions allow manual save management  
✅ **Stamina refresh:** On load, creatures are healed (line 499)  
✅ **Number formatting exists:** Basic formatNumber() implementation (though needs improvement)

---

## Test Priority Recommendations

**High Priority (Run First):**
1. ✅ Test 1 (Initial Load) - Catches missing assets, script errors
2. ✅ Test 2c (Absurd Values) - Likely to expose formatNumber() issues
3. ✅ Test 5 (UI Overflow) - Related to #2, tests display layer

**Medium Priority:**
4. ✅ Test 2a (Invalid JSON) - Should pass but verify error messaging
5. ✅ Test 3 (Offline Gains) - Depends on catchupMissedCombats() implementation

**Low Priority (Edge Cases):**
6. ✅ Test 2b (Partial Save) - Likely to pass due to validateSaveData()
7. ✅ Test 4 (Click Stress) - UI robustness, harder to repro

---

## Quick Fix Checklist

If you want to address issues BEFORE testing:

```javascript
// 1. Fix formatters.js (Top of file, replace formatNumber)
function formatNumber(num) {
    if (num == null || isNaN(num)) return '0';
    if (!isFinite(num)) return '999.99Q+';
    if (num >= 1e15) return (num / 1e15).toFixed(2) + 'Q';
    if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
    if (num >= 1e9)  return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6)  return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3)  return (num / 1e3).toFixed(2) + 'K';
    return Math.floor(num).toString();
}

// 2. Fix saveSystem.js (In validateSaveData, add after line 224)
const numericFields = [
    'questTokens', 'marquesDuTriomphe', 'combatTickets', 
    'talentRerolls', 'essenceDust', 'towerRecord'
];
for (const field of numericFields) {
    if (gameData[field] != null) {
        if (typeof gameData[field] !== 'number' || 
            !Number.isFinite(gameData[field]) || 
            gameData[field] < 0) {
            return `Données corrompues : ${field} invalide.`;
        }
    }
}

// 3. Fix offline time cap (In loadGameLogic, replace line 492)
if (gameData.lastSaveTime) {
    const offlineTime = Date.now() - gameData.lastSaveTime;
    const MAX_OFFLINE = 7 * 24 * 60 * 60 * 1000; // 7 days
    const cappedOfflineTime = Math.min(Math.max(0, offlineTime), MAX_OFFLINE);
    const offlineSeconds = Math.floor(cappedOfflineTime / 1000);
    // ... rest of code
}
```

---

## Conclusion

**Expected Test Results:**

| Test | Predicted Result | Confidence |
|------|-----------------|------------|
| Test 1 (Load) | ⚠️ PASS (with image warnings) | High |
| Test 2a (JSON) | ✅ PASS | High |
| Test 2b (Partial) | ✅ PASS | Medium |
| Test 2c (Absurd) | ❌ FAIL (NaN/Infinity display) | High |
| Test 3 (Offline) | ⚠️ UNCERTAIN (depends on catchupMissedCombats) | Medium |
| Test 4 (Clicks) | ✅ PASS | Medium |
| Test 5 (UI Overflow) | ❌ FAIL (no T/Q suffixes) | High |

**Most Likely Issues to Find:**
1. "NaN" or "Infinity" displayed in header after Test 2c
2. No Trillion/Quadrillion suffixes for very large numbers
3. Some missing image assets (broken icons)

**Overall Code Quality:** 🟢 GOOD  
The code has solid error handling foundations but needs number safety hardening.

---

**End of Analysis Report**
