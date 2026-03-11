# Gameplay Interface Contract

## Scope
Defines external behavior contracts for player interaction and browser persistence in the Depth Runner client.

## 1. Input Contract

### Actions
- `BeginRun`: Triggered from start screen.
- `RiseHoldStart`: Upward movement action starts.
- `RiseHoldEnd`: Upward movement action ends.
- `DiveHoldStart`: Primary movement action starts.
- `DiveHoldEnd`: Primary movement action ends.
- `RestartRun`: Triggered from game-over screen.

### Device Mappings
- Desktop keyboard:
  - `W` or `ArrowUp` keydown -> `RiseHoldStart`
  - `W` or `ArrowUp` keyup -> `RiseHoldEnd`
  - `S` or `ArrowDown` keydown -> `DiveHoldStart`
  - `S` or `ArrowDown` keyup -> `DiveHoldEnd`
  - Any movement key or `Enter` on start/game-over prompt -> `BeginRun`/`RestartRun`
- Touch/mobile:
  - Touch press -> `DiveHoldStart`
  - Touch release/cancel -> `DiveHoldEnd`
  - Tap on start/game-over prompt -> `BeginRun`/`RestartRun`

### Behavioral Guarantees
- Input mapping normalizes to shared gameplay action state (`isRisePressed`/`isDivePressed`).
- Keyboard supports explicit rise and dive control with capped vertical speed.
- Touch and pointer use hold-to-dive behavior while sharing the same physics/collision systems.

## 2. Game State Contract

### States
- `start`
- `playing`
- `gameOver`

### Transition Rules
- `start -> playing`: On `BeginRun`.
- `playing -> gameOver`: On lethal collision or `air == 0`.
- `gameOver -> playing`: On `RestartRun`.

### Transition Guarantees
- Entering `gameOver` freezes active run progression and captures final distance.
- Entering `playing` resets transient runtime entities while retaining persisted best distance.

## 3. HUD Contract

### Required Visible Fields During `playing`
- `distanceMeters` (rendered from `depthMeters`) at top-left.
- `bestDistanceMeters` (rendered from persisted best) at top-center.
- `airGauge` at top-right.

### Semantics
- `distanceMeters` is the current run score in metres.
- `bestDistanceMeters` is persisted personal best for this browser profile.
- `airGauge` depletes over time; enters critical visual mode below defined threshold.

## 4. Obstacle and Pickup Contract

### Lethal Contact
- Any overlap between diver hit region and lethal hazard region MUST cause immediate game over.
- Anglerfish lure hit region is lethal, not cosmetic.

### Air Pickup
- Air bubble collectible overlap increases air by configured amount.
- Air after pickup MUST be clamped to max tank capacity.

### Zone Availability
- Shallow-only hazards: coral, jellyfish, fishing nets.
- Mid-only hazards: sharks, anchor chains, kelp tangles.
- Deep-only hazards: anglerfish + lure, thermal vents, pressure bands with readable safe gap and anti-chain spacing/cooldown fairness.

## 5. Persistence Contract (`localStorage`)

### Key
- `depthrunner.bestDistanceMeters`
- Legacy read fallback: `depthrunner.bestDepthMeters`

### Value
- Numeric scalar representing farthest distance reached.

### Rules
- Save on run end when current distance exceeds stored best.
- Load on startup before rendering HUD values.
- If unavailable/invalid, fallback to `0` without interrupting gameplay.

## 6. Non-Blocking Audio Contract
- Audio playback is optional and must not gate start, movement, collisions, scoring, or restart.
- Failure to create/play audio context must be ignored for core gameplay flow.
