# Quickstart: Depth Runner Underwater Survival

## Purpose
Validate the feature behavior from spec using a local browser run with no backend and no build tool requirement.

## Prerequisites
- A modern browser (Chrome, Edge, Firefox, or Safari).
- Repository checked out on branch `001-build-depth-runner`.

## Run Locally
1. Open the game entry point (`index.html`) directly in a browser, or serve the repository root with any static file server.
2. Confirm start screen appears with title, one-line instruction, and prompt to begin.

## Core Validation Flow
1. Start a run.
2. Verify diver remains in left-third play position while world scrolls.
3. Release input and confirm neutral vertical behavior with no forced drift.
4. Desktop: hold `W`/`ArrowUp` to rise and `S`/`ArrowDown` to dive; Touch: press-hold to dive.
5. Observe continuous diver breathing bubbles from mask/regulator area.
6. Verify HUD placement:
   - Distance (top left)
   - Best distance (top center)
   - Air gauge (top right)
7. Continue run until air warning threshold and confirm critical visual state.
8. Collect air-bubble pickups and confirm bounded refill.
9. Enter each depth zone threshold and confirm smooth visual transition:
   - Shallow: bright tropical
   - Mid: dim/green murk
   - Deep: near-dark bioluminescent
10. Confirm obstacle family presence by zone and lethal collision behavior.
11. Trigger pressure-band cave hazards repeatedly and confirm cave spawn spacing prevents impossible back-to-back tunnels.
12. End run via obstacle collision and separately via zero-air depletion.
13. Confirm game-over UI shows reached distance, best distance, and restart prompt.
14. Set new best distance and verify clear celebration indicator.
15. Restart and confirm new run begins cleanly.

## Story Validation Checklists

### US1 Validation
- [x] Start screen appears with title, one-line instruction, and begin prompt.
- [x] Diver remains in left-third lane while world scrolls.
- [x] No input keeps diver neutrally controllable (no forced upward drift).
- [x] Keyboard rise/dive controls and touch hold-to-dive both work.
- [x] Breathing bubbles emit continuously during active play.
- [x] Collision with lethal hazards ends run immediately.
- [x] Air reaching zero ends run immediately.

### US2 Validation
- [x] Air depletes continuously during active run.
- [x] Air depletion scales up with depth.
- [x] Air bubble collectibles restore bounded air.
- [x] Zone transitions (0-100, 100-300, 300+) are smooth and visually distinct.
- [x] Mid-zone and deep-zone obstacle families appear as expected.
- [x] Pressure-band caves never chain too tightly to form impossible back-to-back passages.
- [x] Difficulty progression increases via composition and behavior, not speed alone.

### US3 Validation
- [x] HUD shows distance (top-left), best distance (top-center), and air (top-right).
- [x] Air gauge enters critical visual state at low-air threshold.
- [x] Game-over screen shows reached distance and best distance.
- [x] New personal best is clearly celebrated.
- [x] Restart prompt supports keyboard and touch.
- [x] Best distance persists between sessions when storage is available.
- [x] Storage failure path does not break gameplay.

## Persistence Validation
1. Reach any non-zero best distance.
2. Reload browser tab or reopen the page.
3. Confirm best distance remains visible and unchanged unless surpassed.
4. If storage is blocked/unavailable, confirm game still runs and fails gracefully without crash.

## Input Parity Validation
1. Desktop: complete start, movement, and restart using keyboard only.
2. Mobile/touch simulation: complete same flow using touch press/hold.
3. Confirm no gameplay logic differences in collision, air, and hazard systems between input modes.

### Input Parity Result
- [x] Desktop and touch both map to shared `isDivePressed` gameplay action state.
- [x] Start and restart actions are available on both input modes.

## Performance Sanity Check
1. Run a sustained session in each zone.
2. Use browser performance tooling to sample frame pacing.
3. Confirm no sustained stutter under normal spawn density.
4. If drops occur, reduce transient effect counts before reducing gameplay readability.

### Performance Result
- [x] Fixed-step simulation with clamped delta integrated into render loop.
- [x] Lightweight debug metrics toggle available for frame-rate sanity checks.
- [x] Transient visual counts are bounded to reduce frame-time spikes.

## Audio Fallback Validation
- [x] Gameplay start is not gated on audio APIs.
- [x] Movement, collision, scoring, and restart remain functional with audio unavailable.

## Final Acceptance Notes
- [x] Client-only implementation confirmed (no backend/service calls).
- [x] Keyboard and touch parity verified against shared control state.
- [x] Visual readability pass completed for diver, pickups, and all hazard families.
- [x] Quickstart flow executed end-to-end across start, play, and game-over loops.

## Out of Scope for This Feature
- Multiplayer
- Backend services
- Account systems or cloud saves
- Mandatory audio feedback
