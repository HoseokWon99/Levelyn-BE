# Repository Guidelines

## Project Structure & Module Organization
`src/` contains the NestJS application. Features are organized by module (`auth/`, `battles/`, `inventory/`, `notifications/`, `to-do/`, `users/`, etc.) and usually group controllers, services, DTOs, handlers, events, and TypeORM models together. Shared infrastructure lives under `src/common/` and `src/config/` for cross-cutting utilities, Redis, TypeORM, OAuth2, random factories, and YAML-backed config.

Tests live beside source files as `*.spec.ts`; end-to-end coverage lives in `test/` with `app.e2e-spec.ts` and `jest-e2e.json`. Runtime artifacts and local helpers include `Dockerfile`, `docker-compose.monitor.yml`, `game.system.yaml`, `connect-db.sh`, and `sse-test.sh`.

## Build, Test, and Development Commands
- `npm run start:dev`: run the API with watch mode.
- `npm run build`: compile NestJS output into `dist/`.
- `npm run start:prod`: run the compiled server from `dist/main`.
- `npm test`: run unit tests under `src/`.
- `npm run test:cov`: run unit tests with coverage output in `coverage/`.
- `npm run test:e2e`: run end-to-end tests from `test/`.

The app reads `.env` at startup and exposes Swagger at `/api-docs` when running locally.

## Coding Style & Naming Conventions
Use TypeScript and preserve the existing module-first NestJS structure. Prefer PascalCase for classes, DTOs, commands, events, and modules; use kebab-case for directories such as `src/to-do/`; keep file names descriptive (`create.battle.handler.ts`, `user.skills.service.spec.ts`).

There is no committed ESLint or Prettier config, so match the surrounding file’s formatting and import style. Keep DTO validation in DTO classes, persistence in `*.model.ts`, and transport schemas in `dto/api/` or `api/`.

## Testing Guidelines
Write Jest unit tests as `*.spec.ts` next to the implementation. Use `test/` only for application-level e2e coverage with Supertest. Add or update tests for service logic, command handlers, and battle/inventory state transitions when behavior changes.

## Commit & Pull Request Guidelines
Recent history favors short, imperative commit messages such as `add sse test script` or `cqrs publishing monitoring`. Keep commits focused and scoped to one change. For pull requests, include a concise description, impacted modules, test commands run, and any environment or API changes. Attach request/response examples for controller or SSE behavior changes.

## Configuration & Security Tips
Do not commit real secrets in `.env`. Database connection settings come from environment variables, and TypeORM loads entities from `**/*.model{.ts,.js}`. If you change monitored services or queues, update the related Docker or shell helper scripts in the repo root.
