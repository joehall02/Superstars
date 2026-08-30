# Implementation Plan: Superstars

## Phase 1: Data Layer

### 1.1 Spreadsheet Conversion Setup

**Shared conversion logic (`lib/` folder):**
- [x] Create `lib/convertMasterScores.ts` with pure conversion function:
  - [x] `convertMasterScoresToJson(buffer: Buffer): SuperstarsData`
  - [x] No I/O operations - takes buffer, returns JSON
  - [x] Install SheetJS (`xlsx` package)
  - [x] Implement parsing logic using SheetJS
  - [x] Add error handling for missing/corrupt data (Return `ERRORS` object that client can interoperate and show errors screen)
  - [x] Write unit tests for conversion logic (valid input, edge cases, error scenarios)

**Development wrapper (`scripts/` folder):**
- [x] Create `scripts/convert-data.ts` for local development
- [x] Read spreadsheet from `data/` directory (local file)
- [x] Call `convertMasterScoresToJson()` with buffer
- [x] Write JSON to `public/data/master-scores.json` on disk (served by Vite dev server at `/data/...`; also copied into `dist/` by `vite build`)
- [x] Add `npm run convert-data` script to package.json
- [x] Used for local development and Docker builds

> Do this after section 2.4

**Production wrapper (`api/` folder):**
- [ ] Create `api/convert-data.ts` Vercel serverless function
- [ ] Install Google Cloud Storage client library (`@google-cloud/storage`)
- [ ] Fetch spreadsheet from GCS private bucket
- [ ] Call `convertMasterScoresToJson()` with buffer
- [ ] Return JSON directly via HTTP response (no file storage)
- [ ] Add caching headers (aggressive caching as data changes yearly)

### 1.2 Data Types & Models
- [x] Create TypeScript interfaces for:

  **Metadata:**
  - [x] `Metadata` - lastUpdated, sourceFile, availableYears, totalPlayers, totalGames

  **Entities:**
  - [x] `Player` - id, name
  - [x] `Game` - id, name
  - [x] `Entities` - players (Record<playerId, Player>), games (Record<gameId, Game>)

  **Overall Rankings:**
  - [x] `GameRanks` - Record<gameId, rank | null> (for overall allTime)
  - [x] `OverallAllTimeRanking` - rank, playerId, score, gameRanks
  - [x] `OverallYearRanking` - rank, playerId, totalGameRanks
  - [x] `YearChampion` - year, playerIds[], runnerUpIds[], thirdIds[]

  **Game Rankings (nested stats structure):**
  - [x] `GameAllTimeRanking` - rank, playerId, stats: Record<string, number | null>
  - [x] `GameYearRanking` - rank, playerId, stats: Record<string, number | null>
  - [x] `GameRankings` - allTime: GameAllTimeRanking[], byYear: Record<year, GameYearRanking[]>

  **Root Structure:**
  - [x] `Rankings` - overall (allTime, byYear, champions), byGame (Record<gameId, GameRankings>)
  - [x] `SuperstarsData` - metadata, entities, rankings

### 1.3 React Query & Data Service
- [x] Install TanStack React Query (`@tanstack/react-query`)
- [x] Set up QueryClient and QueryClientProvider in app root
- [x] Implement environment-based data fetching:
  - [x] Development/Docker: fetch from `/data/master-scores.json` (local file)
  - [x] Production: fetch from `/api/data` endpoint (Vercel serverless function)
  - [x] Use `VITE_DATA_SOURCE` environment variable to switch (`local` vs `api`)
  - [x] Add typed env access via `src/vite-env.d.ts` (augment `ImportMetaEnv` with `VITE_DATA_SOURCE: 'local' | 'api'`); only `VITE_`-prefixed vars reach the browser, everything else (`GCS_*`, `SITE_PASSWORD`) is server-only
  - [x] Use Vite's built-in `import.meta.env.DEV`/`.PROD`/`.MODE` for environment checks (no custom `VITE_ENVIRONMENT` var)
- [x] Add error handling for invalid data shapes (validate the fetched JSON response and confirm if errors are returned) — eventually used to route to the Error Page (see section 4.4)
- [x] Create MasterScoreService (functional: pure selector module + hooks module; see for the extraction/hook pattern, but implemented as free functions rather than a class):
  - [x] Pure extraction functions (`masterScoreSelectors.ts` — no React, trivially testable):
    - [x] `getAllTimeRankings(data)` - Rankings Page Section 1: all-time standings table
    - [x] `getYearChampions(data, year)` - Rankings Page Section 2: year champions table
    - [x] `getYearRankings(data, year)` - Rankings Page Section 2: per-year player rankings table
    - [x] `getAllGames(data)` - Games Page: list of all games for grid display
    - [x] `getGameById(data, id)` - Game Details Page: game name for header
    - [x] `getGameAllTimeRankings(data, gameId)` - Game Details Page Section 1: all-time leaderboard for game
    - [x] `getGameYearRankings(data, gameId, year)` - Game Details Page Section 2: per-year leaderboard for game
    - [x] `getPlayerById(data, id)` - ProfileCard: player name
    - [x] Write unit tests for all pure extraction methods
  - [x] Hooks (`useMasterScores.ts` — components call these directly):
    - [x] One base hook + shared query key `['masterScores']` (the whole dataset is fetched once and cached); derived hooks reuse it via `select` to return their slice, so no redundant refetches
    - [x] `useAllTimeRankings()` - `select` → all-time standings
    - [x] `useYearRankings(year)` - `select` → per-year player rankings
    - [x] `useYearChampions(year)` - `select` → year champions
    - [x] `useAllGames()` - `select` → all games
    - [x] `useGame(gameId)` - `select` → single game
    - [x] `useGameAllTimeRankings(gameId)` - `select` → game all-time leaderboard
    - [x] `useGameYearRankings(gameId, year)` - `select` → game per-year leaderboard
    - [x] `usePlayer(playerId)` - `select` → single player
- [x] React Query handles caching, loading states, and error states automatically
- [x] Components interact with MasterScoreService directly via hook methods

---

## Phase 2: Site Setup

### 2.1 Routing & Authentication
- [x] Install React Router
- [x] Set up route structure:
  - [x] `/rankings` - Rankings page
  - [x] `/games` - Games list page
  - [x] `/games/:gameId` - Game details page
  - [x] `/login` - Password entry page
  - [x] `/error` - Error page (data fetch/validation failures)
  - [x] `*` - 404/Not Found page (catch-all for invalid routes)

**Auth model:** a single shared site password gates the app. The real security boundary is the server-side API — the client gate is UX only. Three parts:

- [ ] **(a) Login endpoint (`api/login.ts`)** — server-side password validation:
  - [ ] `POST /api/login` accepts `{ password }`, compares against `SITE_PASSWORD` (server-only env, no `VITE_` prefix) using a constant-time comparison (`crypto.timingSafeEqual`)
  - [ ] On success, return an HMAC-signed token (`issued.signature`) signed with a separate server-only secret `AUTH_SECRET` (never sign with the password itself)
  - [ ] Embed the issued timestamp so tokens can be expired; reject on mismatch with 401
  - [ ] Add `AUTH_SECRET` and `SITE_PASSWORD` to server env (Vercel), not `VITE_`-prefixed
- [ ] **(b) Data-endpoint token verification** — the actual gate:
  - [ ] Shared `verifyToken()` helper: recompute the HMAC from `AUTH_SECRET`, reject invalid/forged/expired tokens
  - [ ] Require `Authorization: Bearer <token>` on protected endpoints (`/api/`); return 401 when verification fails
  - [ ] Client sends the stored token on protected data requests; a 401 clears the token and redirects to `/login`
- [ ] **(c) Client gate (`ProtectedRoute` + login UI)** — UX enforcement:
  - [ ] `ProtectedRoute` wrapper redirects unauthenticated users to `/login` (already stubbed via `useIsAuthenticated()`)
  - [ ] `useIsAuthenticated()` returns `true` in dev (`import.meta.env.DEV`, local JSON has no server gate), else requires a **live** token in localStorage — parse the `issued` timestamp from the `issued.signature` token and reject it if older than a shared `MAX_TOKEN_AGE_MS` constant (client reads the timestamp without needing `AUTH_SECRET`; only signature verification is server-side). This is UX only — an expired token routes to `/login` instead of rendering a broken, data-less page
  - [ ] Keep the 401 → clear token → redirect path (step b) as a backstop for cases the client timestamp check can't catch (clock skew, a rotated `AUTH_SECRET` invalidating tokens before their timestamp expires); clear the stale token outside render (401 handler or effect), not inside `useIsAuthenticated()`
  - [ ] Store only the server-issued token in localStorage (never the raw password)
  - [ ] Create password entry page UI (`/login`) that calls `/api/login` and persists the returned token

### 2.2 MUI Theming Engine
- [x] Install MUI packages (`@mui/material`, `@mui/icons-material`, `@emotion/react`, `@emotion/styled`)
- [x] Install tss-react
- [x] Create theme configuration:
  - [x] Define light theme color palette (70s British TV show inspired)
  - [x] Define dark theme color palette
  - [x] Set up base typography
  - [x] Configure component default styles
- [x] Create ThemeProvider wrapper
- [x] Implement dark mode toggle logic with localStorage persistence
- [x] Set up tss-react for custom styles

### 2.3 Config Setup
- [x] Create `public/configs/` directory with four config files (see `@docs/config-shape-examples/` for shapes; placed under `public/` so Vite serves them at `/configs/*.json` and bundles them into `dist/`):
  - [x] `images.json` - Game images and player icons (keyed by ID, paths relative to public GCS bucket)
  - [x] `localisation.json` - Game summaries and rules (keyed by game ID)
  - [x] `stats.json` - Stat label mappings with reusable stat groups (keyed by game ID)
    - [x] Create stat label mapping (e.g., `goalsFor` → "Goals For", `averagePoints` → "Avg Points")
  - [x] `layout.json` - Navigation links config (drives Navbar and Footer)
- [x] Local configs are git-tracked (committed, not gitignored) and serve as production fallback (a failed GCS fetch retries the bundled `/configs/*` copy)
- [ ] Set up environment variables for Google Cloud Buckets (see section 2.4)
  - [x] Add browser-exposed `VITE_GCS_PUBLIC_BASE_URL` to `src/vite-env.d.ts` (image URLs + prod config fetches are built client-side, so it **must** be `VITE_`-prefixed — deviates from 2.4's `GCS_PUBLIC_BASE_URL` naming; actual env values set in 2.4)
- [x] Implement environment-based config fetching using `import.meta.env.DEV` (`getConfigBaseUrl()` in `src/config.ts`):
  - [x] Development (`DEV`): fetch from local `/configs` folder
  - [x] Production (`PROD`): fetch from GCS public bucket (`${VITE_GCS_PUBLIC_BASE_URL}/configs`)
- [x] Create ConfigService (functional factory `createConfigService(config)` returning arrow getters, not a class — matches the functional `MasterScoreService`) with methods:
  - [x] `getGameImage(gameId)` - returns full URL for game image
  - [x] `getGameIcon(gameId)` - returns full URL for game icon
  - [x] `getPlayerIcon(playerId)` - returns full URL for player icon
  - [x] `getGameLocalisation(gameId)` - returns summary and rules for game
  - [x] `getStatLabels(gameId, type)` - returns stat labels from stat groups for dynamic table columns
  - [x] `getOverallStatLabels(type)` - stat labels for the non-game "overall" rankings (added; the single `getStatLabels(gameId, type)` can't express the overall case)
  - [x] `getNavLinks()` - returns navigation links config for Navbar and Footer
  - [x] Getters return `undefined`/empty for missing ids rather than throwing
  - [x] Validate the fetched shape (`assertAppConfig` in `configsGuard.ts`, mirroring `masterScoresGuard.ts`) and surface a `ConfigError` for the Error Page
  - [x] Unit tests for every getter (`configService.test.ts`)
- [x] Create ConfigContext provider (`src/context/configProvider.tsx`):
  - [x] Fetch all config files (from local or GCS based on environment) via React Query (`useConfigQuery`, key `['config']`)
  - [x] Instantiate ConfigService with loaded config data (`useMemo`)
  - [x] Add loading and error states (loading gate + inline error fallback; routing failures to `/error` is deferred to 4.4 since the provider sits above the router)
  - [x] Create `useConfig()` hook for component access
  - [x] Add thin per-slice hooks over `useConfig()` (`useNavLinks()`, `useGameImage(id)`, …) returning plain values, so a component depends only on its slice without touching the service surface

### 2.4 Google Cloud Bucket Setup
- [ ] Create **private** GCS bucket (spreadsheet only):
  - [ ] `/spreadsheet/` - Superstars data spreadsheet (.xlsx)
  - [ ] Configure IAM: only service account used by Vercel serverless functions can read
  - [ ] Set up service account with read-only access to this bucket
- [ ] Create serverless function to fetch spreadsheet from Google Cloud Bucket
- [ ] Set up environment variables for GCS bucket name and credentials
- [ ] Create **public** GCS bucket (images + configs):
  - [ ] `/configs/` - Config files (images.json, localisation.json, stats.json)
  - [ ] `/players/` - Player icon/avatar images
  - [ ] `/games/` - Game images
  - [ ] `/games/icons/` - Game icon images (for mobile scrollbar indicators)
  - [ ] Configure bucket for public read access (allUsers read permission)
  - [ ] Set up CORS configuration (allow frontend domain to fetch images and configs)
- [ ] Upload initial assets (spreadsheet to private, images and configs to public)
- [ ] Document bucket structure and naming conventions
- [ ] Set up environment variables:
  - [ ] `GCS_PRIVATE_BUCKET` - private bucket name
  - [ ] `GCS_PUBLIC_BUCKET` - public bucket name
  - [ ] `GCS_PUBLIC_BASE_URL` - public bucket base URL for image and config references
  - [ ] `GCS_SERVICE_ACCOUNT_KEY` - service account credentials (for private bucket access)

### 2.5 Assets, Fonts & Logo
- [ ] Set up custom font system for easy font swapping:
  - [ ] Create `/src/assets/fonts/` directory
  - [ ] Extract fonts from .zip files and add to fonts directory
  - [ ] Create `fonts.css` with `@font-face` declarations for each font
  - [ ] Register fonts in MUI theme typography (e.g., `fontFamily.display`, `fontFamily.heading`)
  - [ ] Use font variables in theme so swapping only requires changing one line
- [ ] Create Superstars logo as a React component (based on original British show logo):
  - [ ] Use display font from theme
  - [ ] Create logo variants (full text for desktop, icon-only for mobile)
- [ ] Upload game images to public GCS bucket
- [ ] Upload player icons to public GCS bucket

---

## Phase 3: Components

### 3.1 Navbar Component
- [ ] Create Navbar component structure
- [ ] Add Logo component (responsive: full text desktop, icon mobile)
- [ ] Add navigation links (config-driven via `useConfig().getNavLinks()`)
- [ ] Style links with italics and white separators
  - [ ] Set up typography (italics for nav links) in the MUI theme
- [ ] Add dark mode toggle button
- [ ] Implement responsive behavior (hide links on mobile)

### 3.2 Footer Component (Mobile Only)
- [ ] Create Footer component
- [ ] Add icon-based navigation links (config-driven via `useConfig().getNavLinks()`)
- [ ] Show page names under icons
- [ ] Implement mobile-only display logic

### 3.3 Table Component
- [ ] Create reusable Table component with dynamic column rendering
- [ ] Discover columns from data keys (excluding rank, playerId)
  - [ ] Create utility to extract stat field names from game ranking data (excluding rank, playerId)
- [ ] Use `useConfig().getStatLabels(gameId, type)` to look up column labels
- [ ] Support flexible data shapes (props for columns, rows)
- [ ] Add sorting functionality
- [ ] Add clickable row support (for player selection)
- [ ] Style with MUI Table components
- [ ] Add responsive design (mobile-friendly)
- [ ] Add loading skeleton state (table rows with skeleton placeholders)
- [ ] Create table variants:
  - [ ] Leaderboard table (rankings)
  - [ ] Year selector table (with year navigation)

### 3.4 Custom Scrollbar Component
- [ ] Create Scrollbar component
- [ ] Implement custom scrollbar styling
- [ ] Create `useScrollbar` hook for custom scrollbar logic
- [ ] Add Games page variant (circle indicators per game)
- [ ] Implement scroll position tracking
- [ ] Add smooth scrolling behavior

### 3.5 Profile Card Component
- [ ] Create ProfileCard component
- [ ] Display player information:
  - [ ] Player icon/avatar (use `useConfig().getPlayerIcon(playerId)`)
  - [ ] Player name (from MasterScoreService)
  - [ ] Player stats/rankings (from MasterScoreService)
- [ ] Add loading skeleton state (placeholder for avatar, name, and stats)
- [ ] Add responsive behavior:
  - [ ] Desktop: Side panel layout
  - [ ] Mobile: Overlay/popup modal
- [ ] Add close/dismiss functionality for mobile

### 3.6 Game Box Component
- [ ] Create GameBox component
- [ ] Add game image with grey overlay (use `useConfig().getGameImage(gameId)`)
- [ ] Display game name at top (from MasterScoreService)
- [ ] Implement hover effect (boxy 3D effect)
- [ ] Add click handler for navigation
- [ ] Create responsive grid layout (6 boxes)

### 3.7 Styling Architecture & Boxy 3D Effects
- [ ] Set up styling conventions:
  - [ ] Each component has a local `styles.ts` file for component-specific styles (using tss-react)
  - [ ] Create shared `src/appStyles.ts` alongside `App.tsx` for reusable styles (e.g. 3D effects)
- [ ] Create boxy 3D effect styles in `appStyles.ts`:
  - [ ] "Always shown" 3D effect
  - [ ] "Hover" 3D effect
- [ ] Make effects importable and reusable across components

### 3.8 Breadcrumbs Component
- [ ] Create reusable Breadcrumbs component
- [ ] Display navigation path (e.g., Games > Game Name)
- [ ] Include game icon alongside game name in breadcrumb (from `useConfig().getGameIcon(gameId)`)
- [ ] Make parent links clickable for navigation
- [ ] Style with MUI Breadcrumbs

### 3.9 Loading States
- [ ] Create reusable loading skeleton components using MUI Skeleton:
  - [ ] `TableSkeleton` - skeleton rows for leaderboard tables
  - [ ] `ProfileCardSkeleton` - skeleton for profile card (avatar, name, stats)
  - [ ] `GameBoxSkeleton` - skeleton for game boxes (image placeholder, text)
  - [ ] `PageSkeleton` - full page loading layout
- [ ] Use skeletons for initial page loads

---

## Phase 4: Pages

### Service Dependencies by Page

| Page | MasterScoreService Functions | ConfigService Functions |
|------|------------------------------|-------------------------|
| **Navbar & Footer** | — | `getNavLinks()` - navigation links |
| **Rankings Page** | `useAllTimeRankings()` - all-time standings table<br>`useYearRankings(year)` - per-year player rankings<br>`useYearChampions(year)` - year champions table<br>`usePlayer(playerId)` - profile card data | `getPlayerIcon(playerId)` - player avatars |
| **Games Page (Layer 1)** | `useAllGames()` - game names for grid | `getGameImage(gameId)` - game images<br>`getGameIcon(gameId)` - game icons for mobile scrollbar |
| **Game Details Page (Layer 2)** | `useGame(gameId)` - game name for header<br>`useGameAllTimeRankings(gameId)` - all-time leaderboard<br>`useGameYearRankings(gameId, year)` - per-year leaderboard | `getGameImage(gameId)` - game image<br>`getGameIcon(gameId)` - game icon for breadcrumbs<br>`getGameLocalisation(gameId)` - summary & rules<br>`getStatLabels(gameId, type)` - table column headers |
| **Error Page** | — (consumes the error result returned by the data fetch) | — |

### 4.1 Rankings Page
- [ ] Create Rankings page layout
- [ ] Implement Section 1: All-time standings
  - [ ] Add leaderboard table
  - [ ] Make player rows clickable
  - [ ] Integrate ProfileCard (side panel on desktop)
  - [ ] Add ProfileCard overlay for mobile
- [ ] Implement Section 2: Year-based rankings
  - [ ] Add overall year champion table
  - [ ] Add per-year player rankings table
  - [ ] Implement year navigation (arrows/buttons at bottom)
  - [ ] Add year state management
- [ ] Connect to MasterScoreService for data fetching
- [ ] Add loading skeletons for tables and profile card during initial load
- [ ] Add error handling

### 4.2 Games Page (Layer 1)
- [ ] Create Games page layout
- [ ] Display 6 GameBox components in grid
- [ ] Implement custom scrollbar with circle indicators
- [ ] Add scroll tracking for active game indicator
- [ ] Use MasterScoreService for game names and ConfigService for game images
- [ ] Add loading skeletons for game boxes during initial load
- [ ] Add responsive layout:
  - [ ] Desktop: grid layout with standard scrollbar
  - [ ] Mobile: vertical scroll with custom indicator circles
    - [ ] Fixed position indicator column on right side of screen
    - [ ] One circle per game, stacked vertically
    - [ ] Each circle contains the game's icon (from ConfigService)
    - [ ] Active circle (currently scrolled-to game) is highlighted with accent color
    - [ ] Inactive circles are semi-transparent/greyed out
    - [ ] Smooth transition between active/inactive states
    - [ ] Clicking a circle scrolls to that game box

### 4.3 Game Details Page (Layer 2)
- [ ] Create GameDetails page layout
- [ ] Add Breadcrumbs component at top (Games > Game Name with icon)
- [ ] Add game image with 3D effect (use `useConfig().getGameImage(gameId)`)
- [ ] Implement Section 1: All-time leaderboard for game (dynamic columns via ConfigService)
- [ ] Implement Section 2: Per-year leaderboard (dynamic columns via ConfigService)
  - [ ] Add year navigation arrows
  - [ ] Display year-specific rankings
- [ ] Add Summary & Rules section
  - [ ] Use `useConfig().getGameLocalisation(gameId)` to fetch summary and rules
  - [ ] Format and display content
- [ ] Connect to MasterScoreService with gameId parameter
- [ ] Add loading skeletons for tables and game image during initial load
- [ ] Add error handling
- [ ] Add back navigation to Games list

### 4.4 Error Page
- [ ] Create Error page layout (shown when the data fetch fails or the response is invalid)
- [ ] Display returned error details (from `ConversionErrors` or an invalid data shape)
- [ ] Add clear, user-friendly error message
- [ ] Add navigation back to rankings / retry
- [ ] Consistent styling with rest of app
- [ ] Route via `/error`

### 4.5 404 Page
- [ ] Clear "Page Not Found" message
- [ ] Navigation link back to home/rankings
- [ ] Consistent styling with rest of app

---

## Phase 5: Polish & Deployment

### 5.1 Responsive Design
- [ ] Test all pages on mobile viewports
- [ ] Test all pages on tablet viewports
- [ ] Test all pages on desktop viewports
- [ ] Fix any responsive layout issues
- [ ] Ensure touch interactions work on mobile

### 5.2 Error Handling & Edge Cases
- [ ] Add global error boundary
- [ ] Handle missing data gracefully
- [ ] Add fallback UI for errors
- [ ] Test with invalid/corrupt data
- [ ] Add user-friendly error messages

### 5.3 Vercel Deployment
- [ ] Create Vercel configuration
- [ ] Set up environment variables in Vercel (GCS bucket name, credentials, site password)
- [ ] Configure build settings
- [ ] Set up custom domain
- [ ] Test deployment pipeline
- [ ] Verify serverless function can access GCS bucket from Vercel

### 5.3.1 Git Branching Strategy (post-deploy)

Set up **after** the first successful Vercel deploy, so day-to-day pushes to GitHub can't break the live production site.

- [ ] Create a long-lived `develop` branch off `main`
- [ ] Treat `main` as the production branch (Vercel's Production deploys track `main` only)
- [ ] Do routine work on `develop` (or short-lived feature branches merged into `develop`), never directly on `main`
- [ ] Release to production by opening a PR from `develop` → `main` and merging once CI is green
- [ ] Protect `main` with a branch protection rule:
  - [ ] Require the CI workflow to pass before merging
  - [ ] Require a PR (disallow direct pushes to `main`)
- [ ] Confirm `ci.yml` already triggers on both `main` and `develop` (push + PR) so both branches stay verified

### 5.4 Testing & QA
- [ ] Test authentication flow
- [ ] Test all navigation paths
- [ ] Test dark/light mode toggle
- [ ] Test data display accuracy
- [ ] Test year navigation
- [ ] Test player selection
- [ ] Test game navigation
- [ ] Cross-browser testing

### 5.5 Docker & Local Production Testing
- [ ] Create Dockerfile for production-like local testing:
  - [ ] Multi-stage build: Node.js for building, Nginx for serving
  - [ ] Run `npm run convert-data` during build to generate JSON from spreadsheet
  - [ ] Build React app with `VITE_DATA_SOURCE=local` environment variable (`vite build` copies `public/data/master-scores.json` into `dist/data/`)
  - [ ] Copy built `dist/` assets to Nginx directory (the JSON is already inside `dist/data/`)
- [ ] Create Nginx configuration:
  - [ ] Serve static React build from `/` (this also serves `/data/master-scores.json` — no special location block needed)
  - [ ] Configure caching headers for static assets
- [ ] Create `.dockerignore` to exclude node_modules, .git, etc.
- [ ] Add Docker build and run scripts to package.json
- [ ] Document Docker usage in README

**Note**: Docker uses the same data fetching logic as local development (`VITE_DATA_SOURCE=local`), fetching from the pre-generated JSON file. Production uses `VITE_DATA_SOURCE=api` to fetch from Vercel serverless functions. No separate Express server needed.

### 5.6 Unit Testing with Vitest
- [x] Install Vitest (`vitest`)
- [x] Configure Vitest for TypeScript (`test` block in `vite.config.ts`)
- [x] Colocate test files alongside source files (e.g., `convertMasterScores.test.ts` next to `convertMasterScores.ts`)
- [x] Add test scripts to package.json (`npm test`, `npm run test:watch`, `npm run test:coverage`)
- [ ] Focus on business logic tests (not component tests):
  - [x] Spreadsheet conversion logic (`lib/convertMasterScores.ts`)
  - [ ] Data-response validation (shape guard + `ConversionErrors` handling)
  - [ ] MasterScoreService pure extraction methods

### 5.7 CI/CD Pipeline (GitHub Actions)

**Husky pre-push hooks:**
- [x] Install Husky (`husky`)
- [x] Initialise Husky (`npx husky init`)
- [x] Create `.husky/pre-push` hook to run on every `git push`:
  - [x] `npm run lint` — fail the push if linting errors are found
  - [x] `npm test` — fail the push if any unit tests fail
- [x] Add `prepare` script to `package.json` (`"prepare": "husky"`) so hooks are installed automatically after `npm install`

**GitHub Actions workflow:**
- [x] Create `.github/workflows/ci.yml` workflow file
- [x] Configure workflow to run on push and pull requests to main/develop branches
- [x] Add linting step using existing ESLint config (`npm run lint`)
- [x] Add TypeScript type checking step (`npm run typecheck` or `npx tsc --noEmit`)
- [x] Add unit test step (`npm test`)
- [x] Add build verification step (`npm run build`)
- [x] Configure Node.js version and dependency caching
- [x] Add dependency audit step (`npm audit --omit=dev`) — fails on any severity, production deps only
- [ ] Add status badges to README (build, tests, coverage)

---

## Gaps & Suggestions

### Suggestions
1. **Statistics Dashboard**: Add aggregate stats (most wins, highest scores, etc.)
2. **Print/Export**: Allow users to export rankings as PDF or image
3. **Share Links**: Enable sharing specific rankings or player profiles
4. **Progressive Web App**: Make it installable for better mobile experience

### Technical Considerations
- **Environment Variables**: Use Vercel's environment variable system for secrets
- **CORS**: Ensure serverless functions handle CORS properly
- **GCS CORS**: Configure public bucket CORS to allow frontend to fetch images directly
- **GCS Credentials**: Store service account key securely in Vercel env vars - only needed for private bucket
- **GCS Caching**: Set appropriate cache-control headers:
  - Private bucket (spreadsheet): long cache (changes yearly)
  - Public bucket (images + configs): medium cache with CDN-friendly headers
- **GCS Security**: Private bucket should have no public access; public bucket should be read-only for all users
- **Rate Limiting**: Consider adding rate limiting to serverless functions
- **Monitoring**: Add basic error monitoring (Sentry, LogRocket, etc.)
