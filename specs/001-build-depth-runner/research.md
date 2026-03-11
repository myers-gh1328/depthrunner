# Phase 0 Research: Depth Runner Underwater Survival

## Decision 1: Game Loop and Time-Step Strategy
- Decision: Use a fixed-step simulation (e.g., 60Hz logical updates) inside a `requestAnimationFrame` render loop with delta clamping.
- Rationale: Fixed-step logic makes buoyancy, movement, spawn cadence, and collision behavior deterministic and easier to tune/reason about; clamping prevents giant update jumps after tab throttling.
- Alternatives considered: Pure variable delta updates (simpler code but less stable feel), uncapped delta (can cause unfair collisions and large state jumps).

## Decision 2: Diver Vertical Control Model
- Decision: Model vertical movement with neutral drift and explicit player-controlled rise/dive forces, with capped vertical velocity.
- Rationale: This gives predictable control and supports both keyboard directional inputs and touch hold-to-dive without forced drift.
- Alternatives considered: Direct position lerp to target depth (feels artificial), constant downward gravity with jump taps (inverts intended underwater behavior).

## Decision 3: Air Economy and Depth Scaling
- Decision: Use a baseline air depletion rate multiplied by depth-zone factor and a mild continuous depth multiplier; air pickups restore a fixed fractional tank amount with max cap.
- Rationale: Produces increasing pressure as depth rises while avoiding sudden step-function difficulty spikes.
- Alternatives considered: Zone-only hard jumps (too abrupt), fully linear unlimited scaling (can become unwinnable too quickly late-game).

## Decision 4: Obstacle Composition and Fairness Rules
- Decision: Use weighted zone-specific obstacle pools with spacing guards, coral-lane fairness, and pressure-band anti-chain cooldown/spacing rules.
- Rationale: Prevents impossible patterns and aligns progression with mechanics/composition growth rather than speed-only ramping.
- Alternatives considered: Pure random spawning (high risk of impossible overlaps), scripted endless sequence (predictable and lower replay variety).

## Decision 5: Hazard Behaviors by Zone
- Decision: Implement distinct behavior archetypes per zone (drift, patrol, pulse, periodic burst, timed band gap) with behavior parameters tuned by depth.
- Rationale: Behavioral variety creates skill depth and tension escalation while preserving readability through consistent per-type behavior signatures.
- Alternatives considered: Static obstacles only (insufficient progression depth), all moving hazards from start (steep onboarding difficulty).

## Decision 6: Zone Visual Transition Approach
- Decision: Crossfade layered background palettes/particles over a transition depth window around each boundary.
- Rationale: Smooth blends satisfy the requirement for non-abrupt transitions and maintain player orientation.
- Alternatives considered: Instant palette swap at exact threshold (abrupt), long cinematic transitions with gameplay slowdown (breaks pace).

## Decision 7: Rendering and Performance Guardrails
- Decision: Draw all entities with Canvas 2D primitives, avoid per-frame allocations where practical, pool transient particles/bubbles, and cap active entities.
- Rationale: Supports 60fps target on broad hardware while retaining clean recognizable art.
- Alternatives considered: SVG/DOM entity rendering (higher layout overhead), external framework adoption (conflicts with client-only/minimal-dependency goals).

## Decision 8: Persistence Contract
- Decision: Persist only best distance in `localStorage` using `depthrunner.bestDistanceMeters` with legacy read fallback to `depthrunner.bestDepthMeters`.
- Rationale: Meets persistence requirement with minimal complexity and zero backend dependency.
- Alternatives considered: IndexedDB (unnecessary complexity for a single scalar), no persistence (fails requirement).

## Decision 9: Input Parity Model
- Decision: Keyboard uses `W/ArrowUp` rise and `S/ArrowDown` dive, while touch/pointer use hold-to-dive; all inputs feed the same movement/collision systems.
- Rationale: Preserves accessible touch control while supporting precise bidirectional keyboard movement.
- Alternatives considered: Separate movement logic per platform (higher bug risk), tap-only controls on mobile (reduced precision).

## Decision 10: Audio Resilience
- Decision: Treat audio as optional enhancement with no game-state dependencies on playback or audio context availability.
- Rationale: Ensures full playability under autoplay restrictions or muted environments.
- Alternatives considered: Blocking start until audio init (violates constitution), removing audio hooks entirely (limits extensibility).
