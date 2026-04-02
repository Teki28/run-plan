# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server (http://localhost:5173)
npm run build     # Type-check and build for production
npm run lint      # Run ESLint
npm run preview   # Preview production build locally
```

## Architecture

Single-page React app scaffolded with Vite. Entry point is `src/main.tsx` → `src/App.tsx`.

**Stack:**
- React 19 + TypeScript
- Tailwind CSS v4 via `@tailwindcss/vite` plugin (no `tailwind.config` file needed)
- Vite 8 with `@vitejs/plugin-react`

**Tailwind setup:** Tailwind is imported at the top of `src/index.css` with `@import "tailwindcss"` and registered as a Vite plugin in `vite.config.ts`. Use utility classes directly in JSX.
