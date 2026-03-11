<!--
Sync Impact Report
Version change: unversioned template -> 1.0.0
Modified principles:
- Template Principle 1 -> I. Client-Only Single-File Delivery
- Template Principle 2 -> II. Immediate Visual Readability
- Template Principle 3 -> III. 60 FPS Performance First
- Template Principle 4 -> IV. Readability-First Learning Code
- Template Principle 5 -> V. Progressive Challenge Design
- (new) -> VI. Non-Blocking Audio
- (new) -> VII. Unified Desktop and Mobile Input
Added sections:
- Technical Standards
- Development Workflow & Quality Gates
Removed sections:
- None
Templates requiring updates:
- ✅ .specify/templates/plan-template.md
- ✅ .specify/templates/spec-template.md
- ✅ .specify/templates/tasks-template.md
- ⚠ pending: .specify/templates/commands/*.md (directory not present in repository)
Follow-up TODOs:
- None
-->

# Depth Runner Constitution

## Core Principles

### I. Client-Only Single-File Delivery
All runtime code MUST execute entirely in the browser with no backend services, no server
dependencies, and no build tooling. Production delivery MUST be possible as pure HTML, CSS,
and vanilla JavaScript, with `index.html` as the primary and preferred artifact.
Rationale: This preserves portability, keeps setup friction near zero, and supports the
project's learning-first goals.

### II. Immediate Visual Readability
Every obstacle, collectible, player character, and hazard MUST be recognizable at a glance
during gameplay. Abstract or ambiguous shapes that reduce instant comprehension MUST NOT be
used for core gameplay entities.
Rationale: Game decisions are made in milliseconds; visual ambiguity directly harms fairness
and player trust.

### III. 60 FPS Performance First
The game loop MUST target smooth 60fps on representative desktop and mobile browsers.
Features that cause sustained frame drops or input lag MUST be optimized or removed.
Heavy libraries and canvas/game frameworks MUST NOT be introduced.
Rationale: Runner gameplay depends on timing precision; unstable frame pacing degrades core
mechanics.

### IV. Readability-First Learning Code
Code MUST prioritize clarity over cleverness. Logic SHOULD be decomposed into small,
descriptive functions with straightforward control flow and explicit naming.
Rationale: Depth Runner is a learning project; maintainability and teachability outweigh
micro-optimizations unless performance is measurably impacted.

### V. Progressive Challenge Design
Difficulty MUST increase meaningfully over time through combined mechanic complexity,
encounter composition, and decision pressure, not only raw speed scaling.
Rationale: Good progression teaches and then tests player mastery; speed-only ramps produce
shallow gameplay.

### VI. Non-Blocking Audio
Audio is optional. Missing, delayed, or blocked audio MUST NOT prevent startup, input,
rendering, scoring, or completion of a run.
Rationale: Browser autoplay policies and device constraints are variable; gameplay reliability
must not depend on sound.

### VII. Unified Desktop and Mobile Input
The game MUST support keyboard (desktop) and touch (mobile) interaction with shared gameplay
logic. Separate code paths SHOULD be minimized and only introduced when platform constraints
require them.
Rationale: One gameplay model reduces divergence bugs and keeps balancing consistent across
devices.

## Technical Standards

- Allowed stack: HTML, CSS, and vanilla JavaScript running in-browser.
- Preferred packaging: a single `index.html` that can run by direct file open or static host.
- External dependencies MUST be justified with a measurable benefit and no violation of
	Principles I-III.
- Asset choices MUST preserve readability and performance on common mobile screen sizes.
- Core gameplay MUST remain functional when audio APIs are unavailable or denied.

## Development Workflow & Quality Gates

- Every feature plan MUST include a constitution compliance check before implementation starts
	and again before merge.
- Definition of done MUST include: desktop keyboard play test, mobile touch play test,
	visual readability review for all new entities, and frame-rate sanity check.
- Any exception to a core principle MUST be documented in the plan's complexity tracking table
	with a clear rationale and a simpler alternative that was rejected.
- Pull requests MUST describe gameplay impact and explicitly note whether progression,
	performance, and input parity were affected.

## Governance

This constitution is the highest-priority engineering policy for Depth Runner. In case of
conflict, this document overrides ad hoc practices and undocumented conventions.

Amendment procedure:
- Propose amendments in a pull request that includes a summary of changes, impacted templates,
	and migration actions for open work.
- At least one maintainer approval is required before merge.
- Amendments take effect only after related template and guidance updates are completed or
	explicitly tracked as follow-up work.

Versioning policy:
- MAJOR: incompatible governance changes or principle removals/redefinitions.
- MINOR: new principles/sections or materially expanded requirements.
- PATCH: clarifications, wording improvements, and non-semantic edits.

Compliance review expectations:
- Reviewers MUST verify constitution compliance in feature specs, plans, tasks, and pull
	requests.
- Non-compliant changes MUST not merge without a documented and approved exception.

**Version**: 1.0.0 | **Ratified**: 2026-03-10 | **Last Amended**: 2026-03-10
