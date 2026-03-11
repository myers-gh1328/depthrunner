# Feature Specification: Depth Runner Underwater Survival

**Feature Branch**: `[001-build-depth-runner]`  
**Created**: 2026-03-10  
**Status**: Draft  
**Input**: User description: "Build Depth Runner - a client-side endless runner game set underwater, with rise/dive controls, air management, distance progression, zone-specific hazards, and persistent best-distance tracking."

## User Scenarios & Testing *(mandatory)*

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.
  
  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently
-->

### User Story 1 - Survive the Core Dive Loop (Priority: P1)

As a player, I start a run and control a scuba diver that auto-swims forward while I manage vertical movement and dodge incoming hazards to survive as long as possible.

**Why this priority**: This is the core game value; without a playable survival loop, the feature does not deliver a viable game.

**Independent Test**: Can be fully tested by starting a run, controlling ascent/descent with keyboard or touch, encountering hazards, and confirming collision or zero-air ends the run.

**Acceptance Scenarios**:

1. **Given** a run is active, **When** the player provides no input, **Then** the diver remains neutrally controllable while the world scrolls continuously.
2. **Given** a run is active, **When** the player presses rise or dive controls, **Then** the diver moves vertically in the matching direction with capped velocity.
3. **Given** a run is active, **When** the diver contacts any obstacle or hazard hit area, **Then** the run ends immediately with a game-over state.
4. **Given** a run is active, **When** air reaches zero, **Then** the run ends immediately with a game-over state.

---

### User Story 2 - Manage Air and Depth Progression (Priority: P2)

As a player, I track distance and air in real time, collect air bubbles to extend the run, and adapt as deeper water increases difficulty and air pressure.

**Why this priority**: Air and depth mechanics create strategic tension and progression, turning basic obstacle avoidance into sustained survival gameplay.

**Independent Test**: Can be fully tested by running long enough to cross depth thresholds, observing faster air depletion at depth, collecting air pickups, and validating score increases by distance traveled.

**Acceptance Scenarios**:

1. **Given** a run is active, **When** time passes, **Then** the air gauge depletes continuously and depletes faster at greater depth bands.
2. **Given** the diver intersects an air-bubble collectible, **When** pickup occurs, **Then** air increases by a bounded amount and never exceeds maximum capacity.
3. **Given** the diver descends beyond zone thresholds, **When** transitioning between zones, **Then** visual atmosphere changes smoothly and obstacle pace increases gradually.
4. **Given** a run ends, **When** final distance is calculated, **Then** distance traveled in metres is shown as the run score.

---

### User Story 3 - Read Status and Replay for Improvement (Priority: P3)

As a player, I can clearly read HUD status and game states, see my personal best, and quickly restart to chase a longer run.

**Why this priority**: Clear status feedback and replay loop increase retention and make progress meaningful across sessions.

**Independent Test**: Can be fully tested by moving through start, playing, and game-over states; verifying HUD placement/readability; setting a best distance; reloading; and confirming best distance persists.

**Acceptance Scenarios**:

1. **Given** the game is idle, **When** the player opens it, **Then** a start screen with title, one-line instruction, and begin prompt is shown.
2. **Given** the player is in a run, **When** viewing the HUD, **Then** current distance, air gauge, and best distance are visible without obscuring critical play space.
3. **Given** air is critically low, **When** the threshold is crossed, **Then** the air indicator changes to a critical visual warning.
4. **Given** the run ends, **When** final results are displayed, **Then** distance reached and best distance are shown with restart prompt, and a clear celebration appears if a new best is achieved.
5. **Given** a best distance was achieved previously, **When** the player returns in a later session, **Then** the best distance value is retained and displayed.

---

### Edge Cases

- Player holds descend input continuously from run start: diver remains controllable within play bounds and cannot leave the visible play area.
- Diver collects multiple air bubbles in rapid succession: air increases per pickup but never exceeds maximum.
- Obstacle spawn overlap risk: generated hazards must maintain a fair, passable path expectation for human reaction time.
- Zone boundary crossing during active hazard patterns: transition effects stay smooth and do not hide or teleport existing hazards.
- Critical-air warning and game-over trigger timing: warning appears before depletion and game-over triggers exactly at zero.
- Personal best storage unavailable or blocked: game remains playable and simply does not persist best distance for that session.
- Two pressure-band cave walls spawn too close together: spawning rules must prevent back-to-back impossible cave passages.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The game MUST provide three states: start screen, active play, and game over.
- **FR-002**: The start screen MUST show the game title, a one-line control instruction, and a prompt to begin.
- **FR-003**: During active play, the diver MUST remain anchored in the left third of the visible screen while the environment scrolls toward them.
- **FR-004**: During active play, the diver MUST remain vertically controllable with neutral drift when no player input is provided.
- **FR-005**: The player MUST be able to apply both upward and downward movement on desktop keyboard; touch input MUST support hold-to-dive with shared core physics.
- **FR-006**: The diver MUST continuously emit visible air bubbles from the breathing area during active play.
- **FR-007**: The game MUST provide an air gauge that depletes over time and is always visible during active play.
- **FR-008**: Air depletion rate MUST increase with greater depth.
- **FR-009**: The game MUST spawn collectible air bubbles intermittently; collecting one MUST restore a partial amount of air without exceeding the maximum gauge.
- **FR-010**: If the air gauge reaches zero, the run MUST end immediately in game-over state.
- **FR-011**: Distance in metres MUST increase throughout the run and be displayed as the current score.
- **FR-012**: The game world MUST include three depth zones (Shallow 0-100m, Mid 100-300m, Deep 300m+) with distinct visual identity and smooth transitions between zones.
- **FR-013**: Obstacle scroll pace MUST increase gradually as depth increases.
- **FR-014**: The game MUST include zone-specific obstacle sets:
  - Shallow: coral formations, jellyfish with vertical drifting behavior, and wide fishing nets.
  - Mid: sharks with horizontal patrol behavior, anchor chains, and swaying kelp tangles.
  - Deep: anglerfish with lethal lure area, thermal vents with periodic upward bursts, and crushing-pressure bands with readable safe passage and anti-chain spawn spacing.
- **FR-015**: Contact between the diver and any lethal obstacle or hazard hit area MUST end the run immediately.
- **FR-016**: The HUD MUST show current distance (top left), best distance (top center), and air gauge (top right) during active play.
- **FR-017**: The air gauge MUST present a clear critical-low visual warning state.
- **FR-018**: HUD layout MUST remain readable and minimally intrusive to gameplay space on desktop and mobile viewports.
- **FR-019**: The game-over screen MUST show run distance, best distance, and a restart prompt.
- **FR-020**: When a run sets a new best distance, the game-over screen MUST clearly celebrate the new record.
- **FR-021**: Best distance MUST persist between sessions on the same device profile.
- **FR-022**: Visual style MUST keep diver and hazards clearly recognizable, include underwater atmosphere cues, and maintain distinct color palettes per depth zone.

### Constitution Alignment Requirements *(mandatory)*

- **CA-001 (Client-Only)**: Feature MUST run entirely in-browser with no backend/service dependency.
- **CA-002 (Single-File Goal)**: Feature design MUST remain compatible with `index.html`-first delivery.
- **CA-003 (Visual Clarity)**: All new obstacles, collectibles, hazards, and characters MUST be instantly recognizable.
- **CA-004 (Performance)**: Feature MUST preserve smooth 60fps gameplay under expected load.
- **CA-005 (Code Readability)**: Implementation approach MUST favor clear, teachable logic over clever patterns.
- **CA-006 (Progression Design)**: Difficulty changes MUST describe mechanics/composition growth, not speed-only scaling.
- **CA-007 (Audio Resilience)**: Gameplay MUST remain fully playable when audio cannot be played.
- **CA-008 (Input Parity)**: Feature MUST support desktop keyboard and mobile touch behavior without divergent game logic where possible.

### Key Entities *(include if feature involves data)*

- **Diver State**: Player avatar runtime state including vertical position band, rise/dive control state, passive drift behavior, and alive/dead status.
- **Air State**: Current and maximum air values, depletion modifiers by depth, and critical threshold status.
- **Run Progress**: Current distance traveled in metres for a run, zone classification, and final run distance on game over.
- **Depth Zone**: Named progression band (Shallow, Mid, Deep) with visual profile and obstacle roster.
- **Obstacle Instance**: Hazard object with type, zone association, movement behavior, lethal collision region, and lifecycle.
- **Air Bubble Collectible**: Pickup object with spawn cadence, drift behavior, and air refill value.
- **Best Distance Record**: Persisted local profile value for maximum distance achieved across sessions.
- **Game Session State**: Current screen state (start, playing, game over), restart eligibility, and new-record flag.

### Assumptions

- Single-player gameplay is the only supported mode for this feature.
- One primary action input is sufficient for control parity across keyboard and touch.
- Fairness target assumes average human reaction capability and no unavoidable obstacle combinations.
- Distance is the sole scoring dimension; no bonus multipliers or combo systems are included in this scope.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: At least 95% of first-time players can start a run from the start screen within 10 seconds of page load.
- **SC-002**: At least 90% of playtest participants can correctly identify distance, current air, and best distance from the HUD in under 3 seconds during active play.
- **SC-003**: In controlled playtests, 100% of collision events with lethal hazards and 100% of zero-air events trigger immediate game over with no continued movement.
- **SC-004**: At least 85% of players report that zone transitions are clear and smooth while still perceiving rising tension from shallow to deep.
- **SC-005**: At least 90% of players complete one full run and initiate a restart without external instructions after reaching game over.
- **SC-006**: Best distance persists correctly across browser restart in at least 99% of sessions where local persistence is available.

### Constitution Metrics *(mandatory)*

- **CM-001 (Frame Pacing)**: Active gameplay remains visually smooth for at least 95% of measured play time on target desktop and mobile devices.
- **CM-002 (Readability Accuracy)**: At least 90% of test players correctly identify each zone-specific obstacle type on first exposure.
- **CM-003 (Input Completeness)**: All primary gameplay actions (start, control vertical movement, restart) are executable via both keyboard and touch using the same core game rules.
- **CM-004 (Audio Independence)**: All defined acceptance scenarios pass with audio muted or unavailable.
