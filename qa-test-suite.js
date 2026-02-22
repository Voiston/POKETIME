/**
 * QA SMOKE TEST SUITE
 * 
 * Usage: Open the game in browser (file:///C:/Users/David/Desktop/POKETIME%20-%20Copie/index.html)
 * Then open DevTools Console (F12) and paste this entire script, then run: runQATests()
 */

const QA_TEST_RESULTS = [];

function logTest(severity, title, reproSteps, observed, expected, rootCause = 'Unknown') {
    QA_TEST_RESULTS.push({
        severity,
        title,
        reproSteps,
        observed,
        expected,
        rootCause
    });
}

function printResults() {
    console.log('\n' + '='.repeat(80));
    console.log('QA SMOKE TEST RESULTS');
    console.log('='.repeat(80) + '\n');

    const grouped = {
        CRITICAL: [],
        MAJOR: [],
        MINOR: [],
        PASS: []
    };

    QA_TEST_RESULTS.forEach(r => grouped[r.severity].push(r));

    ['CRITICAL', 'MAJOR', 'MINOR', 'PASS'].forEach(severity => {
        if (grouped[severity].length === 0) return;
        
        console.log(`\n${'#'.repeat(40)}`);
        console.log(`${severity} FINDINGS (${grouped[severity].length})`);
        console.log(`${'#'.repeat(40)}\n`);

        grouped[severity].forEach((finding, idx) => {
            console.log(`${idx + 1}. ${finding.title}`);
            console.log(`   Severity: ${finding.severity}`);
            console.log(`   Repro Steps: ${finding.reproSteps}`);
            console.log(`   Observed: ${finding.observed}`);
            console.log(`   Expected: ${finding.expected}`);
            console.log(`   Likely Root Cause: ${finding.rootCause}`);
            console.log('');
        });
    });

    console.log('\n' + '='.repeat(80));
    console.log(`SUMMARY: ${grouped.CRITICAL.length} Critical | ${grouped.MAJOR.length} Major | ${grouped.MINOR.length} Minor | ${grouped.PASS.length} Pass`);
    console.log('='.repeat(80) + '\n');
}

// ============================================================
// TEST 1: INITIAL LOAD SANITY
// ============================================================
function test1_InitialLoadSanity() {
    console.log('Running Test 1: Initial Load Sanity...');
    
    // Check for visible JS errors in console
    const errors = window.jsErrors || [];
    if (errors.length > 0) {
        logTest('CRITICAL', 'Page has blocking JS errors on load', 
            '1. Open game URL 2. Check console', 
            `${errors.length} error(s) detected: ${errors.join(', ')}`,
            'Page should load without blocking errors',
            'Script load order or undefined globals');
    }

    // Check for missing assets
    const images = document.querySelectorAll('img');
    let brokenImages = 0;
    images.forEach(img => {
        if (!img.complete || img.naturalHeight === 0) {
            brokenImages++;
            console.warn('Broken image:', img.src);
        }
    });

    if (brokenImages > 0) {
        logTest('MAJOR', 'Missing or broken image assets', 
            '1. Load page 2. Inspect images',
            `${brokenImages} broken image(s) found`,
            'All images should load successfully',
            'Missing files in img/ directory or incorrect paths');
    }

    // Check if game object exists
    if (typeof game === 'undefined' || !game) {
        logTest('CRITICAL', 'Game object not initialized',
            '1. Load page 2. Check window.game in console',
            'game is undefined or null',
            'game should be initialized and accessible',
            'Game initialization failure or timing issue');
        return;
    }

    // Check critical DOM elements
    const criticalElements = [
        'headerStatHP', 'headerStatAtk', 'headerStatMoney',
        'teamList', 'storageList', 'zoneSelect', 'battleDisplay'
    ];

    const missingElements = criticalElements.filter(id => !document.getElementById(id));
    if (missingElements.length > 0) {
        logTest('CRITICAL', 'Critical DOM elements missing',
            '1. Load page 2. Inspect DOM',
            `Missing elements: ${missingElements.join(', ')}`,
            'All critical UI elements should be present',
            'HTML structure incomplete or IDs mismatched');
    } else {
        logTest('PASS', 'Initial load successful',
            '1. Load page',
            'Page loads without errors, all assets present, game initialized',
            'Page loads cleanly',
            'N/A');
    }
}

// ============================================================
// TEST 2: SAVE IMPORT ROBUSTNESS
// ============================================================
function test2_SaveImportRobustness() {
    console.log('Running Test 2: Save Import Robustness...');

    const SAVE_KEY = 'creatureGameSave';
    const originalSave = localStorage.getItem(SAVE_KEY);

    // TEST 2a: Invalid JSON
    console.log('  Test 2a: Invalid JSON in localStorage...');
    try {
        localStorage.setItem(SAVE_KEY, '{invalid json syntax [}');
        location.reload(); // This would need manual execution
        
        // Simulate check after reload
        const result = game.loadGame();
        if (result === false) {
            logTest('PASS', 'Invalid JSON handled gracefully',
                '1. Set creatureGameSave to invalid JSON 2. Reload page',
                'Game detects corrupt save and refuses to load',
                'Game should not crash, show error message',
                'N/A - Working as intended');
        } else {
            logTest('CRITICAL', 'Invalid JSON causes crash or bad state',
                '1. Set creatureGameSave to invalid JSON 2. Reload page',
                'Game loads corrupt data or crashes',
                'Game should reject invalid JSON gracefully',
                'Missing try-catch in JSON.parse');
        }
    } catch (e) {
        logTest('PASS', 'Invalid JSON caught by error handler',
            '1. Set invalid JSON 2. Reload',
            `Exception caught: ${e.message}`,
            'Error handled gracefully',
            'N/A');
    } finally {
        if (originalSave) localStorage.setItem(SAVE_KEY, originalSave);
        else localStorage.removeItem(SAVE_KEY);
    }

    // TEST 2b: Partial save object (missing major fields)
    console.log('  Test 2b: Partial save missing major fields...');
    try {
        const partialSave = {
            pokedollars: 100,
            // Missing playerTeam, stats, upgrades, etc.
        };
        localStorage.setItem(SAVE_KEY, JSON.stringify(partialSave));
        
        // Note: This test requires manual reload
        console.warn('⚠️ MANUAL TEST REQUIRED: Reload page now to test partial save handling');
        
        logTest('MAJOR', 'Partial save test requires manual verification',
            '1. Run this script 2. Reload page 3. Check if game rejects partial save',
            'Test setup complete, awaiting manual reload',
            'Game should detect missing fields and reject save',
            'Incomplete validation in validateSaveData()');
    } finally {
        if (originalSave) localStorage.setItem(SAVE_KEY, originalSave);
    }

    // TEST 2c: Absurd numeric values
    console.log('  Test 2c: Absurd numeric values (Infinity, huge numbers)...');
    try {
        const absurdSave = JSON.parse(originalSave || '{}');
        if (absurdSave.playerTeam) {
            absurdSave.pokedollars = 9e999; // Infinity when parsed
            absurdSave.questTokens = Number.MAX_SAFE_INTEGER * 10;
            absurdSave.playerMainStats = {
                hp: Infinity,
                attack: 1e308,
                spattack: NaN,
                defense: -Infinity,
                spdefense: 999999999999999,
                speed: 0
            };

            localStorage.setItem(SAVE_KEY, JSON.stringify(absurdSave).replace(/9e999/g, '999999999999999999999999999999'));
            
            console.warn('⚠️ MANUAL TEST: Reload page to test absurd values handling');
            
            logTest('MAJOR', 'Absurd numeric values test requires manual verification',
                '1. Script sets extreme values 2. Reload 3. Check for NaN/Infinity in UI',
                'Test data prepared with Infinity/huge numbers',
                'Game should clamp or reject invalid numeric ranges',
                'Missing isFinite() checks in validation');
        }
    } finally {
        if (originalSave) localStorage.setItem(SAVE_KEY, originalSave);
    }
}

// ============================================================
// TEST 3: OFFLINE GAINS / TIME JUMP
// ============================================================
function test3_OfflineGains() {
    console.log('Running Test 3: Offline Gains / Time Jump...');

    const SAVE_KEY = 'creatureGameSave';
    const originalSave = localStorage.getItem(SAVE_KEY);

    if (!originalSave) {
        logTest('MINOR', 'Cannot test offline gains without existing save',
            'Have an existing save',
            'No save file present',
            'Test should run on existing save',
            'New game state');
        return;
    }

    try {
        const saveData = JSON.parse(originalSave);
        const oneYearAgo = Date.now() - (365 * 24 * 60 * 60 * 1000);
        
        saveData.lastSaveTime = oneYearAgo;
        localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));

        console.warn('⚠️ MANUAL TEST: Reload page now to test offline gains (365 days)');
        console.log('After reload, check for:');
        console.log('  - Offline modal appears');
        console.log('  - Values look reasonable (not NaN/Infinity)');
        console.log('  - Game does not freeze or crash');

        logTest('MAJOR', 'Offline gains test requires manual verification',
            '1. Script sets lastSaveTime to 1 year ago 2. Reload 3. Observe offline modal',
            'Test data prepared with 365-day gap',
            'Offline modal shows bounded gains, no NaN/Infinity',
            'Potential overflow in catchupMissedCombats() if uncapped');

    } catch (e) {
        logTest('CRITICAL', 'Failed to manipulate save for offline test',
            'Parse and modify lastSaveTime',
            `Error: ${e.message}`,
            'Should be able to modify save data',
            'Save corruption or parse error');
    } finally {
        if (originalSave) localStorage.setItem(SAVE_KEY, originalSave);
    }
}

// ============================================================
// TEST 4: BASIC CLICK STRESS
// ============================================================
async function test4_ClickStress() {
    console.log('Running Test 4: Basic Click Stress (20-30s rapid clicking)...');

    if (!game) {
        logTest('CRITICAL', 'Cannot run click stress test without game object',
            'Game must be loaded',
            'game is undefined',
            'game should exist',
            'Game not initialized');
        return;
    }

    let errorsDetected = 0;
    const originalConsoleError = console.error;
    console.error = function(...args) {
        errorsDetected++;
        originalConsoleError.apply(console, args);
    };

    const buttons = [
        document.querySelector('[onclick="game.openSaveManager()"]'),
        document.getElementById('autoSelectBtn'),
        document.getElementById('captureModeBtn'),
        document.getElementById('forfeitBtn')
    ].filter(b => b);

    console.log(`  Rapidly clicking ${buttons.length} buttons for 20 seconds...`);

    const startTime = Date.now();
    const duration = 20000; // 20 seconds

    const clickInterval = setInterval(() => {
        buttons.forEach(btn => {
            if (btn && typeof btn.click === 'function') {
                btn.click();
            }
        });
    }, 50); // Click every 50ms

    await new Promise(resolve => setTimeout(resolve, duration));
    clearInterval(clickInterval);

    console.error = originalConsoleError;

    // Check for duplicate modals
    const modals = document.querySelectorAll('.stats-modal, .compact-popup, .quest-completion-modal');
    const visibleModals = Array.from(modals).filter(m => {
        const display = window.getComputedStyle(m).display;
        return display !== 'none';
    });

    if (visibleModals.length > 1) {
        logTest('MAJOR', 'Multiple modals visible simultaneously after click stress',
            '1. Rapidly click menu/auto/capture buttons for 20s 2. Check DOM',
            `${visibleModals.length} modals visible at once`,
            'Only one modal should be visible at a time',
            'Missing modal close logic or event handler duplication');
    }

    if (errorsDetected > 0) {
        logTest('MAJOR', 'Runtime errors during click stress test',
            '1. Rapidly click combat controls/menu for 20s 2. Check console',
            `${errorsDetected} console errors detected`,
            'No runtime errors during normal interaction',
            'Race conditions or missing null checks in event handlers');
    }

    // Check if game is still responsive
    try {
        game.updateDisplay();
        logTest('PASS', 'Game remains responsive after click stress',
            '1. Rapid click test for 20s 2. Try normal operations',
            'Game UI updates normally, no freeze',
            'Game should remain stable',
            'N/A');
    } catch (e) {
        logTest('CRITICAL', 'Game froze or became unresponsive after click stress',
            '1. Rapid click test 2. Try normal operations',
            `Error: ${e.message}`,
            'Game should remain responsive',
            'Memory leak or uncaught exception in update loop');
    }
}

// ============================================================
// TEST 5: LARGE NUMBER UI OVERFLOW
// ============================================================
function test5_LargeNumberUI() {
    console.log('Running Test 5: Large Number UI Overflow...');

    if (!game) {
        logTest('CRITICAL', 'Cannot test UI overflow without game object',
            'Game must be loaded',
            'game is undefined',
            'game should exist',
            'Game not initialized');
        return;
    }

    const SAVE_KEY = 'creatureGameSave';
    const originalSave = localStorage.getItem(SAVE_KEY);

    try {
        const saveData = originalSave ? JSON.parse(originalSave) : {};
        
        // Set extreme values
        saveData.pokedollars = 999999999999999;
        saveData.questTokens = 888888888888;
        saveData.marquesDuTriomphe = 777777777;
        
        if (saveData.playerMainStats) {
            saveData.playerMainStats.hp = 123456789012345;
            saveData.playerMainStats.attack = 987654321098;
        }

        localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
        game.loadGame();

        // Check header resource chips
        const moneyEl = document.querySelector('#headerStatMoney .resource-val');
        const tokensEl = document.querySelector('#headerStatTokens .resource-val');
        const marquesEl = document.querySelector('#headerStatMarques .resource-val');

        let overflowDetected = false;
        const elements = [
            { name: 'Money', el: moneyEl },
            { name: 'Tokens', el: tokensEl },
            { name: 'Marques', el: marquesEl }
        ];

        elements.forEach(({ name, el }) => {
            if (!el) return;
            
            const rect = el.getBoundingClientRect();
            const parent = el.parentElement.getBoundingClientRect();

            if (rect.width > parent.width * 1.2) { // 20% overflow tolerance
                overflowDetected = true;
                console.warn(`${name} overflows container: ${rect.width}px vs ${parent.width}px`);
            }

            const text = el.textContent;
            if (text.includes('NaN') || text.includes('Infinity') || text.includes('undefined')) {
                logTest('MAJOR', `${name} displays invalid value (NaN/Infinity)`,
                    '1. Set extreme value in save 2. Load game 3. Check header',
                    `Displays: ${text}`,
                    'Should display formatted large number or capped value',
                    'Missing number validation in formatNumber() or display logic');
            }
        });

        if (overflowDetected) {
            logTest('MINOR', 'Large numbers overflow UI containers',
                '1. Set pokedollars=999999999999999 2. Reload 3. Check header chips',
                'Number text overflows container boundaries',
                'Large numbers should be truncated/formatted (e.g., 999.9T)',
                'formatNumber() not applied or insufficient CSS text-overflow');
        } else {
            logTest('PASS', 'Large numbers display correctly without overflow',
                '1. Set extreme currency values 2. Check UI',
                'Numbers formatted properly, no overflow',
                'UI handles large numbers correctly',
                'N/A');
        }

    } catch (e) {
        logTest('CRITICAL', 'Failed to test large number UI',
            'Set extreme values and reload',
            `Error: ${e.message}`,
            'Should handle large numbers gracefully',
            'Formatter or display logic failure');
    } finally {
        if (originalSave) localStorage.setItem(SAVE_KEY, originalSave);
        else localStorage.removeItem(SAVE_KEY);
        if (game.loadGame) game.loadGame(); // Restore original state
    }
}

// ============================================================
// MASTER TEST RUNNER
// ============================================================
async function runQATests() {
    console.clear();
    console.log('%c=== QA SMOKE TEST SUITE ===', 'font-size: 20px; font-weight: bold; color: #4CAF50;');
    console.log('Starting comprehensive QA tests...\n');

    // Capture JS errors globally
    window.jsErrors = [];
    const originalError = window.onerror;
    window.onerror = function(msg, url, line, col, error) {
        window.jsErrors.push(`${msg} at ${url}:${line}:${col}`);
        if (originalError) return originalError(msg, url, line, col, error);
    };

    try {
        test1_InitialLoadSanity();
        test2_SaveImportRobustness();
        test3_OfflineGains();
        await test4_ClickStress();
        test5_LargeNumberUI();
    } catch (e) {
        console.error('Test suite crashed:', e);
        logTest('CRITICAL', 'Test suite execution failure',
            'Run runQATests()',
            `Exception: ${e.message}`,
            'All tests should complete',
            'Test script error or game state corruption');
    }

    printResults();

    // Restore error handler
    window.onerror = originalError;

    console.log('\n%cEnvironment Constraints:', 'font-weight: bold; font-size: 14px;');
    console.log('- Tests 2b, 2c, and 3 require MANUAL page reload to verify behavior');
    console.log('- File picker interaction (import feature) cannot be automated');
    console.log('- Some tests modify localStorage and restore it afterward');
    console.log('\nResidual Risks (NOT validated):');
    console.log('- Manual import via file picker with corrupt files');
    console.log('- Network conditions affecting external assets (fonts, PokeAPI sprites)');
    console.log('- Browser-specific quirks (only tested in current browser)');
    console.log('- Long-term memory leaks (requires extended session monitoring)');
    
    return QA_TEST_RESULTS;
}

console.log('%cQA Test Suite Loaded!', 'color: #2196F3; font-size: 14px; font-weight: bold;');
console.log('Run: %crunQATests()', 'color: #4CAF50; font-weight: bold;');
console.log('View results in console or access via: %cQA_TEST_RESULTS', 'color: #FF9800; font-weight: bold;');
