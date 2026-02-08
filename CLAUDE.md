# CLAUDE.md - BroccoliApps Monorepo

## Project Overview

npm workspaces monorepo containing shared framework packages and multiple applications (web + mobile). All packages use ESM (`"type": "module"`), TypeScript strict mode, and target ES2023.

## Architecture

```
framework/          Shared internal SDK packages consumed by all apps
├── shared/         Foundation - runs everywhere (crypto, validation, dates)
├── backend/        Lambda/server code (Hono routes, DynamoDB, auth, JWT)
├── frontend/       Client-side API contracts and helpers
├── browser/        Preact UI components (Card, Checkbox, drag-and-drop, icons)
├── mobile/         React Native components and hooks (useTheme, keychain, auth)
├── infra/          AWS CDK constructs (AppBuilder, SSL, stacks)
└── dev-tools/      Build scripts and dev server utilities (esbuild, Hono dev)

tasquito/           Task management app
├── shared/         API contracts, client, hooks (useProject, useProjects)
├── web/            Preact + Hono + Vite web app with Lambda backend
└── mobile/         React Native app

networthmonitor/    Financial tracking app
├── shared/         API contracts, client, hooks
├── web/            Preact web app with Chart.js
└── mobile/         React Native app

broccoliapps.com/   Company website (Hono + Preact, SES email)
androidapptesters.com/  Static site (HTML/CSS/JS)
```

## Dependency Hierarchy

Build and import order flows top-to-bottom:

```
@broccoliapps/shared
        ↓
@broccoliapps/backend, frontend, browser, mobile, infra, dev-tools
        ↓
app-shared packages (tasquito-shared, nwm-shared)
        ↓
app packages (tasquito-web, tasquito-mobile, nwm-web, etc.)
```

Build `shared` first, then other framework packages in parallel, then app-shared, then apps.

## Key Commands

```bash
npm run ci                  # Full CI: lint → build:framework → build:apps → test
npm run build:framework     # Build all framework packages in dependency order
npm run build:apps          # Build all app packages
npm run lint                # Check with Biome
npm run lint:fix            # Auto-fix linting issues
npm run test                # Run tests across all workspaces

# Dev servers
npm run dotcom              # broccoliapps.com dev server
npm run nwm:web             # networthmonitor web dev server
npm run tasquito:web        # tasquito web dev server

# Deployments (uses AWS_PROFILE=appi)
npm run deploy:dotcom
npm run deploy:nwm:web
npm run deploy:tasquito:web
```

## Code Conventions (Biome)

- **Indent:** 2 spaces
- **Quotes:** Double quotes
- **Semicolons:** Always
- **Trailing commas:** Always
- **Line width:** 160
- **Arrow parens:** Always
- **Block statements:** Required (no braceless if/for/while)
- **Arrow functions:** Prefer arrow functions where possible (`const foo = () => {}` over `function foo() {}`)
- **Type definitions:** Use `type` over `interface` (`type Foo = { ... }` over `interface Foo { ... }`)
- **Unused imports/variables:** Error

## TypeScript

- **Strict mode** enabled with `noUncheckedIndexedAccess` and `noImplicitOverride`
- **Target:** ES2023, **Module:** ESNext, **Resolution:** Bundler
- **JSX:** `react-jsx` with `jsxImportSource: "preact"` for web apps
- All framework packages emit declarations and source maps

## Tech Stack

| Layer | Technology |
|---|---|
| Server/API | Hono |
| Web frontend | Preact + Vite |
| Mobile | React Native + React Navigation |
| Validation | Valibot |
| Database | DynamoDB |
| Infrastructure | AWS CDK |
| Build | esbuild, tsx |
| Testing | Vitest (framework/web), Jest (mobile) |
| Styling | Tailwind CSS |
| Linting | Biome |
| Auth | JWT (jose), Apple Sign-In |
| Icons | lucide-preact (web), lucide-react-native (mobile) |
| Deployment | CloudFront + Lambda + S3 |

## Patterns

**Contract-based API system:** API endpoints are defined as contracts in `app-shared/src/api/`. Each contract has a `.dto.ts` file with Valibot schemas and a corresponding `.ts` file with endpoint definitions. Types are derived via `v.InferOutput<>`.

**App-shared packages:** Each app has a `shared/` package that exports API contracts, a typed client, and React hooks. These are consumed by both web and mobile.

**DynamoDB repository pattern:** Database access in `web/src/db/` follows a repository pattern with schema definitions and query helpers built on `@broccoliapps/backend`.

**SPA + SSR hybrid:** Web apps have `src/ui/app/` for SPA pages and `src/ui/server/` for server-rendered pages. The SPA uses a router factory from `@broccoliapps/browser`.

**Backend structure:** `src/api/` for Lambda handlers, `src/domains/` for business logic, `src/jobs/` for scheduled EventBridge tasks, `src/events/` for async SQS handlers.

## File Naming

- **Components:** PascalCase (`TaskCard.tsx`, `ProjectForm.tsx`)
- **Utilities:** camelCase (`formatDate.ts`)
- **Hooks:** `use*.ts` (`useProject.ts`, `useProjects.ts`)
- **Valibot schemas:** `*.dto.ts` (`projects.dto.ts`, `auth.dto.ts`)
- **API contracts:** Separate `*.ts` (endpoints) and `*.dto.ts` (schemas) in `api/`

## Rules

- **NEVER run install/deploy commands** for mobile apps (e.g. `android:install:release`, `react-native run-android`, `react-native run-ios`). These overwrite the version currently on the device. Only the user installs apps on devices.
- **NEVER run deploy commands** for web apps (e.g. `deploy:nwm`, `deploy:tasquito`). These overwrite the version currently in production. Only the user deploys web app/backend to AWS.
- **NEVER execute AWS CLI write commands** You may run aws cli read commands using `--profile appi --region us-west-2` when you need to check AWS resources.

## Environment

- **Node.js:** >=22
- **Package manager:** npm (workspaces)
- **AWS profile:** `appi` for AWS Commands
