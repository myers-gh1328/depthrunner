# Tasks: Depth Runner Underwater Survival

**Input**: Design documents from `/specs/001-build-depth-runner/`
**Prerequisites**: `plan.md` (required), `spec.md` (required), `research.md`, `data-model.md`, `contracts/gameplay-interface.md`, `quickstart.md`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish the browser-game skeleton and baseline UI/container structure.

- [x] T001 Create game entry structure in `index.html`, `styles.css`, and `game.js`
- [x] T002 Wire canvas and UI mount points in `index.html`
- [x] T003 [P] Add baseline responsive layout and HUD shell styles in `styles.css`
- [x] T004 [P] Add core runtime config/constants scaffold in `game.js`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Build shared systems required by all user stories.

**CRITICAL**: Complete this phase before user-story implementation.

- [x] T005 Implement fixed-step game loop with `requestAnimationFrame` and delta clamp in `game.js`
- [x] T006 Implement game session state machine (`start`, `playing`, `gameOver`) in `game.js`
- [x] T007 Implement unified input action state for keyboard and touch (`isRisePressed`/`isDivePressed`) in `game.js`
- [x] T008 Implement shared entity lifecycle utilities (spawn, update, remove, pooling hooks) in `game.js`
- [x] T009 Implement collision and bounds-clamp helpers for diver, hazards, and pickups in `game.js`
- [x] T010 Implement best-distance persistence wrapper with graceful storage fallback in `game.js`
- [x] T011 Implement client-only compliance guardrails (no network/backend/build assumptions) in `game.js`
- [x] T012 Implement lightweight performance instrumentation toggles for frame pacing checks in `game.js`

**Checkpoint**: Foundation ready for independent user story delivery.

---

## Phase 3: User Story 1 - Survive the Core Dive Loop (Priority: P1) 🎯 MVP

**Goal**: Deliver the playable survival loop with rise/dive controls, recognizable diver, hazards, and game-over transitions.

**Independent Test**: Start a run, verify neutral no-input behavior, use rise/dive controls, collide with hazards, and confirm immediate game over.

- [x] T013 [US1] Implement diver neutral-drift rise/dive physics with velocity caps in `game.js`
- [x] T014 [US1] Implement start/play/game-over input triggers from contract actions in `game.js`
- [x] T015 [US1] Implement readable diver rendering (humanoid body, tank, fins, mask) in `game.js`
- [x] T016 [US1] Implement continuous diver breathing bubble emission and upward particle motion in `game.js`
- [x] T017 [US1] Implement shallow-zone obstacle behaviors (coral, jellyfish drift, fishing nets) in `game.js`
- [x] T018 [US1] Implement lethal-contact handling for hazard collisions and air-zero transition in `game.js`
- [x] T019 [US1] Implement state-specific overlays and prompts for start and game-over screens in `index.html`
- [x] T020 [US1] Implement run reset flow that clears transient entities while retaining persisted best distance in `game.js`
- [x] T021 [US1] Add US1 validation steps to quickstart checklist in `specs/001-build-depth-runner/quickstart.md`

**Checkpoint**: User Story 1 is independently functional and demoable.

---

## Phase 4: User Story 2 - Manage Air and Depth Progression (Priority: P2)

**Goal**: Add air-economy tension, depth scoring/progression, smooth zone transitions, and advanced hazard composition.

**Independent Test**: Run long enough to cross zone thresholds, observe faster air drain at depth, collect air pickups, and verify distance score progression.

- [x] T022 [US2] Implement air-tank model with baseline drain, depth multiplier, and critical threshold in `game.js`
- [x] T023 [US2] Implement distance meter progression and depth-driven scroll-speed ramp in `game.js`
- [x] T024 [US2] Implement smooth zone transition blending for shallow, mid, and deep palettes/atmosphere in `game.js`
- [x] T025 [US2] Implement air-bubble collectible spawning, movement, and bounded refill logic in `game.js`
- [x] T026 [US2] Implement mid-zone hazards (shark patrol, anchor chains, swaying kelp tangles) in `game.js`
- [x] T027 [US2] Implement deep-zone hazards (anglerfish+lure, thermal vents, pressure bands with readable gap and anti-chain spacing) in `game.js`
- [x] T028 [US2] Implement progressive challenge composition rules beyond speed-only scaling in `game.js`
- [x] T029 [US2] Tune spawn spacing and depth-based multipliers for fairness at boundary transitions in `game.js`
- [x] T030 [US2] Add US2 depth/air/zone validation steps to quickstart checklist in `specs/001-build-depth-runner/quickstart.md`

**Checkpoint**: User Story 2 is independently functional and testable.

---

## Phase 5: User Story 3 - Read Status and Replay for Improvement (Priority: P3)

**Goal**: Complete HUD clarity, best-distance persistence UX, and replay feedback loop.

**Independent Test**: Verify HUD readability in active play, set a new best distance, reload, and confirm persistence with clear game-over messaging.

- [x] T031 [US3] Implement HUD layout and spacing for distance, best distance, and air gauge in `styles.css`
- [x] T032 [US3] Implement low-air critical warning visuals for the air gauge in `styles.css`
- [x] T033 [US3] Bind live HUD values (depth, air, best) to runtime state updates in `game.js`
- [x] T034 [US3] Implement new personal-best celebration messaging in game-over rendering in `game.js`
- [x] T035 [US3] Implement restart prompt behavior parity for keyboard and touch on game-over screen in `index.html`
- [x] T036 [US3] Add persistence fallback handling and non-blocking UX when storage is unavailable in `game.js`
- [x] T037 [US3] Add US3 HUD/best-distance persistence validation steps to quickstart checklist in `specs/001-build-depth-runner/quickstart.md`

**Checkpoint**: User Story 3 is independently functional and testable.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Harden quality across all stories and finalize constitution-derived requirements.

- [x] T038 [P] Run visual-clarity pass for all diver/obstacle silhouettes and zone contrast in `game.js`
- [x] T039 Optimize frame pacing via particle pooling and active-entity caps for 60fps target in `game.js`
- [x] T040 Refactor update/render pipelines for readability-first function boundaries and naming in `game.js`
- [x] T041 [P] Validate input parity regression (keyboard and touch shared logic) and document in `specs/001-build-depth-runner/quickstart.md`
- [x] T042 [P] Validate non-blocking audio behavior and document pass criteria in `specs/001-build-depth-runner/quickstart.md`
- [x] T043 [P] Run full quickstart verification and capture final acceptance notes in `specs/001-build-depth-runner/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- Setup (Phase 1) has no dependencies and starts immediately.
- Foundational (Phase 2) depends on Setup and blocks all user stories.
- User Story phases (Phase 3-5) depend on Foundational completion.
- Polish (Phase 6) depends on completion of selected user stories.

### User Story Dependency Graph

- US1 (P1) -> MVP baseline
- US2 (P2) depends on shared foundation, not on US1 internals
- US3 (P3) depends on shared foundation, can integrate with US1/US2 outputs but remains independently testable

Recommended completion order: `US1 -> US2 -> US3`

### Within-Story Order Constraints

- Core state/physics tasks before hazard/pickup tuning.
- Rendering and HUD binding before UX polish tasks.
- Quickstart validation update at end of each story phase.

## Parallel Execution Examples

### User Story 1 Parallel Example

- Execute T015 and T019 in parallel (`game.js` diver drawing vs `index.html` overlays).
- Execute T016 and T021 in parallel (`game.js` bubble effects vs quickstart doc update).

### User Story 2 Parallel Example

- Execute T026 and T027 in parallel (mid-zone and deep-zone hazard families in separate implementation blocks in `game.js`).
- Execute T024 and T030 in parallel (zone transition implementation and quickstart documentation updates).

### User Story 3 Parallel Example

- Execute T031 and T035 in parallel (`styles.css` HUD layout vs `index.html` restart prompt wiring).
- Execute T034 and T037 in parallel (game-over celebration logic and quickstart validation updates).

## Implementation Strategy

### MVP First (US1)

1. Complete Phase 1 (Setup).
2. Complete Phase 2 (Foundational).
3. Complete Phase 3 (US1) and validate independently.
4. Demo MVP before expanding scope.

### Incremental Delivery

1. Deliver US1 playable core loop.
2. Add US2 progression, air economy, and advanced hazards.
3. Add US3 HUD/replay/persistence experience.
4. Finish with cross-cutting polish and performance/readability checks.

### Team Parallel Strategy

1. Team aligns on Phase 1-2 together.
2. After foundation completion:
   - Developer A leads US1 gameplay loop tasks.
   - Developer B leads US2 progression/hazards tasks.
   - Developer C leads US3 HUD/persistence tasks.
3. Merge for Phase 6 polish and final quickstart validation.

## Notes

- Task format follows required checklist syntax with IDs and file paths.
- `[P]` marks tasks that can run in parallel with minimal blocking dependencies.
- User-story tasks always include `[US#]` labels for traceability.
- No backend/server tasks included; all work remains client-side.
