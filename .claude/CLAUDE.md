# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run start:dev       # Start with hot-reload (watch mode)
npm run build           # Build for production

# Testing
npm run test            # Run all unit tests
npm run test:watch      # Run tests in watch mode
npm run test:cov        # Run tests with coverage
npm run test:e2e        # Run e2e tests

# Run a single test file
npx jest src/path/to/file.spec.ts
npx jest --testPathPattern="battles"   # Match by pattern
```

## Architecture Overview

This is a **NestJS** backend for a game called "Levelyn" — a gamified life task system where users complete to-do tasks to progress through a tile-based world, triggering battles and rewards.

### Module Structure

- **`auth`** — JWT-based auth with Kakao OAuth2, access/refresh token management, Redis-backed token blacklist
- **`users`** — User entity and upsert logic (created or updated on sign-in via OAuth2)
- **`states`** — Player stats: level, exp, attack, will (MySQL via TypeORM)
- **`wallets`** — In-game currency (coins)
- **`tiles`** — Game board tiles; cleared when a to-do is completed, probabilistically triggering battles
- **`to-do`** — Task management; completing a task emits `ToDoFulfilledEvent`
- **`battles`** — Turn-based combat; battle data stored in Redis (not MySQL)
- **`inventory`** — User-owned items and skills (MySQL via TypeORM)
- **`rewards`** — Grants EXP, coins, and items after successful battles
- **`notifications`** — SSE push to clients via Redis-backed queue (`user:{userId}` keys)
- **`my-pages`** — User profile and character info
- **`game`** — Static game data: monsters, items, skills, regions, random-box logic, config schemas

### Event Flow (CQRS with Sagas)

The game loop is driven by NestJS CQRS events and sagas:

1. User completes a to-do → `ToDoFulfilledEvent`
2. **`TilesSaga`** listens → calls `TilesService.clearTile()` → emits either `RewardUserCommand` (no battle) or `CreateBattleCommand`
3. **`BattlesSaga`** handles `BattleEndedEvent` → emits `RewardUserCommand` (win) or `SetPenaltyCommand` (loss)
4. Commands are handled by dedicated `*Handler` classes registered in each module

### Config System

Game constants live in **`game.system.yaml`** and are injected using a custom `YamlConfigModule`:

- Annotate a config class with `@ConfigSchema("YAML_ROOT_KEY")`
- Annotate fields with `@ConfigField({ path: "NESTED.PATH" })`
- Register in any module: `YamlConfigModule.forFeature([BattleConfig, RegionConfig])`
- Inject the class directly: `@Inject(BattleConfig) private readonly _config: BattleConfig`

### Database / Storage

- **MySQL** (TypeORM) — entities extending `ModelBase` (has `createdAt`/`updatedAt`)
- **Redis** (ioredis) — battles (hash `battles:{id}`), notifications (list `user:{userId}`), JWT blacklist
- **DynamoDB** — AWS SDK is a dependency, but actual DynamoDB usage may be limited; Redis is primary in-memory store

### Authentication

- Kakao OAuth2 → JWT access + refresh tokens
- `JwtAuthGuard` for HTTP routes; `SseJwtAuthGuard` reads token from query string (SSE can't set headers)
- `@User()` param decorator extracts `user` from request; `@User("id")` extracts just the user ID

### SSE (Server-Sent Events)

Notifications are pushed via SSE at `/api/notifications`. The `SseInterceptor` wraps responses in `{ data }`. The `NotificationsService` uses a Redis list as a blocking queue, polling with async generators.

### Functional Patterns

The codebase uses **`@fxts/core`** for functional utilities (`pipe`, `map`, `filter`, etc.) and **`neverthrow`** for Result types in some services.

## Planning Rule
After make plan, save plan as ${plan-name}.md under .claude/plans