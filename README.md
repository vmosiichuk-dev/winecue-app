### Prerequisites
- [Node.js](https://nodejs.org/) 22 or newer
- [Bun](https://bun.sh/) runtime
- [pnpm](https://pnpm.io/) package manager
- [Convex](https://convex.dev/) account (free tier)

### Installation

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp apps/web/.env.example apps/web/.env
# Fill in GEMINI_API_KEY, PUBLIC_CONVEX_URL, and PUBLIC_CONVEX_SITE_URL

# Initialize Convex (generates _generated files)
cd apps/web
npx convex dev

# Start development server
pnpm run dev
```

### Project Structure

This is a pnpm monorepo:

- `apps/web` — SvelteKit application (frontend + API routes)
- `packages/shared-types` — Zod schemas shared between frontend and Convex backend
- `packages/ts-config` — Shared TypeScript configurations

### Build & Deploy

```bash
# Type-check the entire monorepo
pnpm run check

# Production build
pnpm run build

# The app is configured for Vercel deployment
# using @sveltejs/adapter-vercel
```
