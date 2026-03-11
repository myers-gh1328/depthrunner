# Data Model: Depth Runner Underwater Survival

## Overview
This model describes runtime domain entities and persisted state for a client-side endless runner. It is implementation-agnostic and focuses on data shape, constraints, and state transitions.

## Entities

### 1. GameSession
- Purpose: Represents current high-level game lifecycle.
- Fields:
  - `state`: `start | playing | gameOver`
  - `startedAtMs`: number or null
  - `endedAtMs`: number or null
  - `isNewBest`: boolean
- Validation rules:
  - `startedAtMs` is non-null only after entering `playing`.
  - `endedAtMs` is non-null only after entering `gameOver`.
  - `isNewBest` may be true only in `gameOver`.
- State transitions:
  - `start -> playing` on begin input.
  - `playing -> gameOver` on lethal collision or air depletion.
  - `gameOver -> playing` on restart input.

### 2. DiverState
- Purpose: Tracks player avatar motion and survivability status.
- Fields:
  - `y`: current vertical position in world/screen space
  - `vy`: current vertical velocity
  - `driftRate`: passive drift contribution (currently neutral)
  - `riseForce`: upward contribution when rise action active
  - `diveForce`: downward contribution when action active
  - `isRisePressed`: boolean normalized input
  - `isDivePressed`: boolean normalized input
  - `isAlive`: boolean
- Validation rules:
  - `y` is clamped to playable bounds.
  - `vy` is constrained to max ascent/descent limits.
  - `isAlive` false implies game state transitions to `gameOver`.

### 3. AirState
- Purpose: Models oxygen/tank pressure system.
- Fields:
  - `current`: current air amount
  - `max`: maximum air amount
  - `baseDrainPerSecond`: baseline depletion
  - `depthMultiplier`: dynamic multiplier by depth/progression
  - `criticalThreshold`: low-air warning threshold
- Validation rules:
  - `0 <= current <= max`
  - `criticalThreshold` is >0 and <`max`
  - depletion applies only during `playing`
- State transitions:
  - Decreases continuously in `playing`.
  - Increases on air-bubble pickup, capped at `max`.
  - Triggers run end when reaching 0.

### 4. DepthProgress
- Purpose: Tracks descent and progression pacing.
- Fields:
  - `depthMeters`: current internal progression metric
  - `distanceMeters`: current displayed score
  - `bestDistanceMeters`: personal best
  - `zone`: `shallow | mid | deep`
  - `scrollSpeed`: world movement speed
- Validation rules:
  - `depthMeters >= 0`
  - `distanceMeters >= 0`
  - `bestDistanceMeters >= 0`
  - `zone` is derived from depth thresholds
- State transitions:
  - `zone` changes at threshold windows (smooth transition, not abrupt).

### 5. DepthZoneDefinition
- Purpose: Defines zone-specific visuals and obstacle catalogs.
- Fields:
  - `name`: `shallow | mid | deep`
  - `startDepth`: inclusive lower bound
  - `endDepth`: exclusive upper bound or null for open-ended
  - `palette`: semantic color references for background/foreground
  - `obstacleTypes`: allowed obstacle IDs
  - `atmosphereFeatures`: particle/ambient descriptors
- Validation rules:
  - Depth ranges are contiguous and non-overlapping.
  - All obstacle IDs resolve to valid obstacle definitions.

### 6. ObstacleInstance
- Purpose: Represents a lethal obstacle or hazard actor.
- Fields:
  - `id`: unique runtime identifier
  - `type`: obstacle type key (e.g., coral, jellyfish, shark)
  - `zoneOrigin`: originating zone key
  - `x`, `y`, `width`, `height`: spatial bounds
  - `behaviorState`: type-specific movement/timing data
  - `isLethal`: boolean
  - `isActive`: boolean
- Validation rules:
  - Active obstacles must have valid bounds and type.
  - Lethal collision region must be defined for all lethal types.
- Lifecycle transitions:
  - `spawned -> active -> offscreen/expired -> removed`

### 7. AirBubbleCollectible
- Purpose: Represents floating air refill pickups.
- Fields:
  - `id`: unique runtime identifier
  - `x`, `y`, `radius`: spatial representation
  - `driftRate`: upward/side wobble behavior controls
  - `airRestoreAmount`: refill value
  - `isActive`: boolean
- Validation rules:
  - `airRestoreAmount > 0`
  - pickup cannot restore beyond air max cap
- Lifecycle transitions:
  - `spawned -> active -> collected/expired -> removed`

### 8. HazardEvent
- Purpose: Records significant gameplay events for HUD/state handling.
- Fields:
  - `eventType`: `collision | airPickup | airCritical | zoneChange | gameOver`
  - `timestampMs`: event time
  - `sourceId`: related obstacle/pickup/entity ID (optional)
  - `payload`: event-specific scalar/object metadata
- Validation rules:
  - `eventType` must be from allowed set.
  - `timestampMs` must be monotonic within a session.

### 9. BestDistanceRecord (Persisted)
- Purpose: Minimal persistent profile data.
- Fields:
  - `bestDistanceMeters`: number
  - `updatedAtMs`: timestamp
- Validation rules:
  - Must parse safely from local storage.
  - Invalid/missing storage falls back to default record (`bestDistanceMeters = 0`).

## Relationships
- `GameSession` owns one active `DiverState`, `AirState`, and `DepthProgress` while in `playing`.
- `DepthProgress.zone` references one `DepthZoneDefinition` at any depth.
- `DepthZoneDefinition` constrains `ObstacleInstance.type` availability.
- `DiverState` collision with `ObstacleInstance` or hazard region triggers `HazardEvent(gameOver)`.
- `DiverState` intersection with `AirBubbleCollectible` triggers `HazardEvent(airPickup)` and updates `AirState`.
- `DepthProgress.bestDistanceMeters` syncs to/from `BestDistanceRecord` at run end/start.
