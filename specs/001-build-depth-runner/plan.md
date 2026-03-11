# Implementation Plan: Depth Runner Underwater Survival

**Branch**: `[001-build-depth-runner]` | **Date**: 2026-03-10 | **Spec**: `specs/001-build-depth-runner/spec.md`
**Input**: Feature specification from `specs/001-build-depth-runner/spec.md`

## Summary

Implement a client-only underwater endless runner where a left-anchored diver auto-swims through scrolling hazards, uses explicit rise/dive controls, and survives by avoiding collisions and managing a depth-sensitive air tank. The implementation uses Canvas 2D primitives with clear silhouettes, smooth depth-zone transitions, gradual pacing increases, pressure-band fairness guards, and local best-distance persistence for replay motivation.

## Technical Context

**Language/Version**: HTML5 + CSS3 + JavaScript (ES2020+)  
**Primary Dependencies**: Browser Canvas 2D API, `requestAnimationFrame`, `localStorage` (no external libraries)  
**Storage**: Browser `localStorage` for best distance (`depthrunner.bestDistanceMeters`, with legacy fallback)  
**Testing**: Manual playtest checklist + browser devtools performance profiling + lightweight in-browser debug toggles  
**Target Platform**: Modern desktop and mobile browsers (Chrome, Edge, Safari, Firefox current stable)  
**Project Type**: Client-side browser game (single-page, no backend)  
**Performance Goals**: Smooth 60fps target during normal gameplay on representative desktop/mobile devices  
**Constraints**: No backend, no build tooling requirement, index.html-first deliverable, readable learner-friendly code, input parity across keyboard/touch  
**Scale/Scope**: Single-player endless runner with 3 depth zones, 9 primary obstacle families, air pickups, HUD, 3 game states, and optional split creature-gallery assets

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Pre-Design Gate Status: PASS

- `Client-only architecture`: PASS. Runtime is fully in-browser with no network/service dependency.
- `Single-file delivery`: PASS. Design keeps `index.html`-first compatibility; optional split into `game.js`/`styles.css` remains static-host friendly.
- `Visual readability`: PASS. Diver, hazards, pickups, and zone backdrops are defined with distinct silhouettes/colors and explicit recognition requirements.
- `Performance`: PASS. Object pooling/capped spawn density and frame-budget-aware effects are planned to maintain smooth pacing.
- `Code clarity`: PASS. Logic is organized by clear systems (input, physics, spawning, collision, HUD, state machine).
- `Progression quality`: PASS. Difficulty ramps through combined hazard composition, behavior variety, and air pressure, not speed alone.
- `Audio fallback`: PASS. No required audio dependency; gameplay loop is fully complete without sound.
- `Input parity`: PASS. Same movement action model for keyboard and touch with shared control state.

Post-Design Gate Status: PASS

- `Client-only architecture`: PASS after design artifact review.
- `Single-file delivery`: PASS after quickstart/decomposition review.
- `Visual readability`: PASS after entity/contract definitions.
- `Performance`: PASS after research decisions and test procedure.
- `Code clarity`: PASS after data model and system boundaries were documented.
- `Progression quality`: PASS after zone/hazard progression mapping.
- `Audio fallback`: PASS after explicit non-blocking requirement in contracts.
- `Input parity`: PASS after unified input contract.

## Project Structure

### Documentation (this feature)

```text
specs/001-build-depth-runner/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── gameplay-interface.md
└── tasks.md
```

### Source Code (repository root)

```text
index.html
styles.css
game.js
animals/
├── index.html
├── animals.css
├── animals.js
├── starfish.html
├── starfish.css
├── octopus.html
├── octopus.css
├── crab.html
├── crab.css
├── sea-horse.html
├── sea-horse.css
├── ball-fish.html
└── ball-fish.css
```

**Structure Decision**: Single-file-first browser game architecture. Initial implementation can live entirely in `index.html`; if split for readability, `styles.css` and `game.js` remain optional static companions with zero build step.

## Phase 0 Research Focus

- Validate rise/dive control tuning strategy for fair but tense vertical navigation.
- Validate explicit rise/dive control tuning for fair but tense vertical navigation.
- Define safe obstacle composition and spawn-spacing rules per depth zone.
- Define air-depletion scaling model that increases pressure without abrupt difficulty spikes.
- Confirm Canvas rendering and update-loop practices to preserve smooth frame pacing.

## Phase 1 Design Focus

- Define runtime entities and state transitions for diver, hazards, pickups, and sessions.
- Specify gameplay interface contracts for controls, HUD semantics, persistence key, and game-state transitions.
- Produce quickstart validation flow for desktop/mobile parity, persistence checks, and performance sanity checks.

## Complexity Tracking

No constitution violations identified; complexity tracking table not required.
