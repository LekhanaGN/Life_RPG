# TheOtherSide — Project Instructions

<!-- guardlink:begin -->
## GuardLink — Security Annotations (Required)

This project uses [GuardLink](https://guardlink.bugb.io) annotations in source code comments.
**Full reference: `docs/GUARDLINK_REFERENCE.md`**

### Core Requirement

**Every time you write or modify code that touches security-relevant behavior, you MUST add GuardLink annotations in the same change.** This includes: new endpoints, authentication/authorization logic, data validation, database queries, file I/O, external API calls, crypto operations, process spawning, user input handling, and configuration parsing. Do NOT annotate pure business logic, formatting utilities, UI components, or helper functions that never touch security boundaries.

### Key Rules

1. **Annotate new code.** When you add a function, endpoint, or module that handles user input, accesses data, crosses a trust boundary, or could fail in a security-relevant way — add `@exposes`, `@mitigates`, `@flows`, `@handles`, or at minimum `@comment` annotations. This is not optional.
2. **NEVER write `@accepts`.** That is a human-only governance decision. When you find a risk with no mitigation in code, write `@exposes` to document the risk + `@audit` to flag it for human review + `@comment` to suggest potential controls.
3. Do not delete or mangle existing annotations. Treat them as part of the code. Edit only when intentionally changing the threat model.
4. Definitions (`@asset`, `@threat`, `@control` with `(#id)`) live in `.guardlink/definitions.ts`. Reuse existing `#id`s — never redefine. If you need a new asset or threat, add the definition there first, then reference it in source files.
5. Source files use relationship verbs only: `@mitigates`, `@exposes`, `@flows`, `@handles`, `@boundary`, `@comment`, `@validates`, `@audit`, `@owns`, `@assumes`, `@transfers`.
6. Write coupled annotation blocks that tell a complete story: risk + control (or audit) + data flow + context note. Never write a lone `@exposes` without follow-up.
7. Avoid `@shield` unless a human explicitly asks to hide code from AI — it creates blind spots.

### Workflow (while coding)

- Before writing code: skim `.guardlink/definitions.ts` to understand existing assets, threats, and controls.
- While writing code: add annotations above or in the doc-block of security-relevant functions as you write them — not as a separate pass afterward.
- After changes: run `guardlink validate .` to catch syntax/dangling refs; run `guardlink status .` to check coverage; commit annotation updates with the code.
- After adding annotations: run `guardlink sync` to update all agent instruction files with the current threat model context. This ensures every agent sees the latest assets, threats, controls, and open exposures.

### Tools

- MCP tools (when available, e.g., Claude Code): `guardlink_lookup`, `guardlink_validate`, `guardlink_status`, `guardlink_parse`, `guardlink_suggest <file>`.
- CLI equivalents (always available): `guardlink validate .`, `guardlink status .`, `guardlink parse .`.

### Quick Syntax (common verbs)

```
@exposes App.API to #sqli [P0] cwe:CWE-89 -- "req.body.email concatenated into SQL"
@mitigates App.API against #sqli using #prepared-stmts -- "Parameterized queries via pg"
@audit App.API -- "Timing attack risk — needs human review to assess bcrypt constant-time comparison"
@flows User -> App.API via HTTPS -- "Login request path"
@boundary between #api and #db (#data-boundary) -- "App → DB trust change"
@handles pii on App.API -- "Processes email and session token"
@validates #prepared-stmts for App.API -- "sqlInjectionTest.ts ensures placeholders used"
@audit App.API -- "Token rotation logic needs crypto review"
@owns security-team for App.API -- "Team responsible for reviews"
@comment -- "Rate limit: 100 req/15min via express-rate-limit"
```

## Live Threat Model Context (auto-synced by `guardlink sync`)

### Current Definitions (REUSE these IDs — do NOT redefine)

**Assets:** #client (client), #server (server), #user-session (user_session), #mission-data (mission_data), #character-data (character_data), #streak-data (streak_data), #milestone-data (milestone_data), #comeback-challenge (comeback_challenge), #world-event-data (world_event_data), #lore-archive (lore_archive), #evidence-data (evidence_data), #focus-session-data (focus_session_data)
**Threats:** #unauthorized-access (Unauthorized Access) [high], #idor (Insecure Direct Object Reference) [high], #input-validation-failure (Input Validation Failure) [medium], #data-tampering (Data Tampering) [high], #streak-tampering (Streak Tampering) [medium], #duplicate-reward-exploit (Duplicate Reward Exploit) [high], #comeback-spoofing (Comeback Spoofing) [medium], #event-tampering (Event Tampering) [high], #event-replay-exploit (Event Replay Exploit) [high], #lore-tampering (Lore Tampering) [medium], #evidence-tampering (Evidence Tampering) [high], #focus-spoofing (Focus Spoofing) [high], #heartbeat-replay (Heartbeat Replay) [high]
**Controls:** #session-auth (Session Authentication), #user-scoping (User Scoping), #input-validation (Input Validation), #prepared-queries (Prepared Queries), #server-authoritative-time (Server Authoritative Time), #atomic-streak-transaction (Atomic Streak Transaction), #authoritative-event-engine (Authoritative Event Engine), #atomic-event-transaction (Atomic Event Transaction), #server-timed-heartbeat (Server Timed Heartbeat), #evidence-ownership-guard (Evidence Ownership Guard), #verification-bypass-blocker (Verification Bypass Blocker)

### Existing Data Flows (extend, don't duplicate)

- Client -> LandingPage via HTTPS
- Client -> validateCreateMission via Input
- Client -> validateUpdateMission via Input
- Client -> App.API.Leaderboard via HTTPS
- Survivor -> API.Missions.GET via HTTPS
- Survivor -> API.Missions.POST via HTTPS
- Survivor -> API.Missions.Single.GET via HTTPS
- Survivor -> API.Missions.Single.PATCH via HTTPS
- Survivor -> API.Missions.Single.DELETE via HTTPS

### Model Stats

146 annotations, 12 assets, 13 threats, 11 controls, 0 exposures, 58 mitigations, 9 flows

> **Note:** This section is auto-generated. Run `guardlink sync` to update after code changes.
> Any coding agent (Cursor, Claude, Copilot, Windsurf, etc.) should reference these IDs
> and continue annotating new code using the same threat model vocabulary.

<!-- guardlink:end -->










