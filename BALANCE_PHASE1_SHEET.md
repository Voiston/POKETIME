# Balance Phase 1 Sheet

Use this sheet to tune the economy with real playtest data.
Fill "Current" after a 30-60 min run, then compare with "Target".

## Auto Mode (now available)

You can export an auto-generated report directly from the browser console:

- `game.buildBalanceReport(30)` -> returns JSON object for last 30 minutes
- `game.exportBalanceReport(30, 'json')` -> downloads JSON report
- `game.exportBalanceReport(30, 'md')` -> downloads Markdown report (sheet-friendly)
- `game.resetBalanceTelemetrySession('playtest')` -> resets counters before a new run

## 1) Core Loop KPIs

| KPI | Current | Target | Notes |
| --- | --- | --- | --- |
| Combats per minute (CPM) |  | 18-35 | Depends on team power and zone |
| Win rate |  | >95% farm zone | If lower, progression feels stuck |
| Boss frequency |  | ~1% | From zone spawn logic |
| Epic frequency |  | ~2.5% | From zone spawn logic |
| Avg quest completion time EASY |  | 3-8 min | Fast dopamine loop |
| Avg quest completion time MEDIUM |  | 10-20 min | Mid loop |
| Avg quest completion time HARD |  | 20-45 min | Session objective |
| Avg quest completion time EXTREME |  | 45-120 min | Long objective |

## 2) Currency Flow

### Pokedollars

Base zone combat reward (before modifiers):
- normal: avg `zone * 25`
- epic: avg `zone * 50`
- boss: avg `zone * 125`

Expected average reward per encounter:
- `zone * 26.625` (with 1% boss and 2.5% epic rates)

Expected money/min (before account multipliers):
- `CPM * zone * 26.625`

| Zone | CPM | Current money/min | Target money/min | Notes |
| --- | --- | --- | --- | --- |
| 1 |  |  | 400-1200 | Early game comfort |
| 5 |  |  | 2000-7000 | Mid onboarding |
| 10 |  |  | 7000-25000 | Mid game |
| 20 |  |  | 40000+ | Late game |

### Quest Tokens

| Source | Current per hour | Target per hour | Notes |
| --- | --- | --- | --- |
| Quests |  | 20-80 | Must feel worth claiming |
| Expeditions |  | 10-60 | Side loop support |
| Achievements |  | Burst only | Milestone spikes, not baseline income |

## 3) Expedition Loop

Durations are now normalized to milliseconds at runtime.

| KPI | Current | Target | Notes |
| --- | --- | --- | --- |
| Available missions that player can launch |  | >=60% | Avoid dead board effect |
| Success rate of launched missions |  | 70-110% | Below 60% feels punishing |
| Token value per hour by expedition tier |  | Increasing by tier | No tier should feel pointless |

## 4) Offline vs Online Fairness

| KPI | Current | Target | Notes |
| --- | --- | --- | --- |
| Offline money vs online money ratio |  | 85-100% | Same formulas now, should be close |
| Offline loot/drop ratio |  | 85-100% | Drop penalty removed in simulation |
| Player perceived "good return" after AFK |  | Yes | Subjective but critical |

## 5) Shop Pressure Checks

| Check | Current | Target | Notes |
| --- | --- | --- | --- |
| Time to first useful upgrade |  | <5 min | Early hook |
| Time to first real build choice |  | 10-20 min | Agency moment |
| Time to afford token shop baseline item |  | 15-30 min | Should not be too rare |
| Expedition reward feels > mission cost (time/stamina) |  | Yes | Core retention factor |

## 6) 30-Min Playtest Checklist

Run one clean save for 30 min and capture:
- zone reached
- CPM average
- money/min at minute 10, 20, 30
- quests generated, accepted, completed, abandoned
- tokens earned and spent
- expeditions launched and claimed
- frustration points (exact minute and reason)

If you want, next step is Phase 2:
- convert this sheet into exact numeric tuning values in `constants.js`
- patch quest rewards and shop costs to hit these targets.
