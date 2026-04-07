# BYLD1 Frontend

This repository is a frontend-only Vite + React + TypeScript application.

## What It Contains

- Public landing page and login flow
- Protected dashboard routes for projects, tasks, budget, documents, chat, team, approvals, consultations, notifications, procurement, timeline, and settings
- Shared state through auth and data contexts
- UI built with Tailwind, Radix UI, and shadcn-style components

The main app entrypoints are:

- `src/main.tsx`
- `src/App.tsx`

## Environment

This project does **not** use Python, so there is no meaningful Python `venv` to create for the app itself.

The equivalent setup is:

- Node.js
- npm
- local `node_modules` installed from `package-lock.json`

Tested local tool versions found in this workspace:

- Node.js `v24.12.0`
- npm `11.6.2`

## Install

```bash
npm install
```

This also refreshes `package-lock.json` if it is out of sync with `package.json`.

For a clean lockfile-based install after the lockfile has been committed, you can also use:

```bash
npm ci
```

If install fails because of registry/network access, rerun it in an environment with internet access.

## Run The App

Start the dev server:

```bash
npm run dev
```

Vite will print the local URL, typically:

```text
http://localhost:5173
```

## Other Useful Commands

Build the app:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

Run tests:

```bash
npm test
```

Run linting:

```bash
npm run lint
```

## Requirements List

For this project, the dependency list lives in `package.json`.

### Runtime dependencies

- `react`
- `react-dom`
- `react-router-dom`
- `@tanstack/react-query`
- `@hookform/resolvers`
- `react-hook-form`
- `zod`
- `framer-motion`
- `date-fns`
- `react-markdown`
- `recharts`
- `lucide-react`
- `next-themes`
- `sonner`
- `vaul`
- `cmdk`
- `clsx`
- `class-variance-authority`
- `tailwind-merge`
- `tailwindcss-animate`
- `embla-carousel-react`
- `input-otp`
- `react-day-picker`
- `react-resizable-panels`
- all listed `@radix-ui/*` packages in `package.json`

### Development dependencies

- `vite`
- `typescript`
- `vitest`
- `@playwright/test`
- `eslint`
- `typescript-eslint`
- `@vitejs/plugin-react-swc`
- `tailwindcss`
- `postcss`
- `autoprefixer`

## Notes

- `README.md` was previously empty, so the source of truth for setup was `package.json`.
- `src/pages/Index.tsx` is still a placeholder file, but the actual application is routed through `src/App.tsx`.
