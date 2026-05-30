# Footsteps — Build Log

A running record of what's been done, decisions made, and lessons
learned. Updated at the end of every session, not just at phase
boundaries.

---

## Current snapshot

**Last updated**: 30 May 2026, 20:58

| Item | State |
|---|---|
| Live site | `footsteps.gallery` + `footsteps.stevecurrie2000.workers.dev` |
| Deployment model | Cloudflare **Worker**, auto-deploy via GitHub Actions on push to main |
| Phase 1 — Foundations | ✅ Done |
| Phase 2 — Country/city pages | ✅ Done |
| Phase 3 — Storage & database | ✅ Done |
| Phase 4 Slice 1 — Admin upload + Access | ✅ Done |
| Phase 4 Slice 2 — EXIF parsing | ✅ Done |
| Phase 4 Slice 3 — Nominatim geocoding + auto-create | ✅ Done (geocode fix 22 May 2026) |
| Phase 4 Slice 4 — Per-file review table | ✅ Done |
| Phase 4 Slice 5 — `/admin/countries` management | ✅ Done |
| Phase 5 — Private section + Access | ✅ Done (real-world test with Lorraine/Mia/Alex pending) |
| Phase 6 Slice 1 — `/admin/photos` page | ✅ Done |
| Phase 6 Slice 2 — Lightbox | ✅ Done |
| Phase 6 Slice 3 — Lazy loading + dimensions + custom 404 | ✅ Done |
| Phase 6 Slice 4 — JWT signature validation | ✅ Done |
| Phase 6 Slice 5 — Cloudflare Web Analytics | ✅ Done |
| Phase 6 — Polish | ✅ Done |
| Slice B — Design polish + correctness fixes | ✅ Done (verified post B.1) |
| Slice B.1 — Homepage + /private index polish | ✅ Done |
| Slice C — Lightbox, accessibility, social, favicon | ✅ Done |
| Phase 7 Slice 1 — Homepage map view | ✅ Done |
| Phase 7 Slice 2 — City coordinates + free-text creation | ✅ Done |
| Phase 7 Slice 3 — World-view cluster map + attribution fix | ✅ Done |
| Fix: renderWorldCopies + CI placeholder guard | ✅ Done |
| Thumbnail reconciliation on photo PATCH/DELETE | ✅ Done |
| Workstream 3 — pre-share housekeeping (Stages 1, 3, 4 closed) | ✅ Done (Stage 2 pending Alex response, Stage 5 deferred) |
| Phase 8 Slice 1 — /admin/access user management | ✅ Done |
| Phase 8 Slice 2 — admin landing page + public-nav admin link | ✅ Done |
| Chore — pre-closure housekeeping | ✅ Done |
| Phase D Slice D1 — Online-only diary at `/admin/diary` | ✅ Done |
| Chore — diary delete button | ✅ Done |
| Phase D Slice D2 — Dateline refinement | ✅ Done |
| Phase D Slice D3 — Reading polish, navigation & centred layout | ✅ Done (deploy pending verification) |
| Phase D Slice D4 — Offline-first (write offline, sync when online) | ✅ Built (live offline-testing pending) |
| Phase D Slice D5 — PWA (installable + offline shell) | ✅ Built (live install/offline testing pending) |
| Chore — diary parchment restyle | ✅ Done |
| Phase D Slice D6 — Attach entries to country / city / photo | ✅ Built (deploy + verify pending) |
| **Phase D — Private travel diary** | ✅ **Complete (D1–D6)** |
| Next immediate task | Verify D6 on live site; plan next phase |

---

## Phase 1: Foundations ✅

**Completed**: May 2026

**What was built**:
- Astro project scaffolded in `C:\Users\Steve\Projects\footsteps`
- Tailwind CSS integration
- Dark theme baseline (`#0a0a0a` bg, `#fafafa` text)
- Typography: Playfair Display + Inter from Google Fonts
- Placeholder homepage: "Footsteps" + "A photographer's journey through Europe"
- Git repository initialised
- GitHub repo created: `stevecurrie2000-svg/footsteps`
- First deploy live via `wrangler deploy` (direct to Cloudflare Worker)

---

## Phase 2: Country Grid + Country/City Pages ✅

**Completed**: May 2026

**What was built**:
- `BaseLayout.astro` with nav bar (Footsteps wordmark + Portfolio/Family
  links) and minimal footer
- Country grid on homepage (responsive: 3/2/1 columns
  desktop/tablet/mobile)
- Dynamic route `src/pages/countries/[slug].astro` for country pages
- Masonry photo grid via CSS columns
- City names shown in small caps under photos
- Initially populated from static sample data in `src/data/countries.ts`
  (UK, France, Italy, Spain); subsequently replaced with D1 queries in
  Phase 3.

**Path-not-taken**: An attempt was made to migrate the live deployment
from direct Workers to Cloudflare Pages with a Git-connected build
pipeline, motivated by the "live site stuck on Phase 1 placeholder"
problem. That migration was abandoned in favour of keeping the Worker
deployment and solving auto-deploy via GitHub Actions instead (decided
in the post-restart session, see lessons below).

---

## Phase 3: Storage & Database ✅

**Completed**: May 2026

**What was built**:
- Cloudflare D1 database `footsteps-db` created (binding `DB`)
- Cloudflare R2 bucket `footsteps-photos` created (binding `PHOTOS`)
- Both bindings attached to the deployed Worker, alongside `ASSETS`
- Schema migration: `migrations/0001_initial_schema.sql`
  (countries, cities, photos tables)
- Seed data: `seeds/0001_countries_cities.sql` (UK, France, Italy,
  Spain — two cities each)
- Astro pages migrated from static sample data to live D1 queries:
  - `src/pages/index.astro` — country grid
  - `src/pages/countries/[slug].astro` — country page with cities and
    photo grids
- `scripts/upload-photo.js` written: Node script that reads a photo
  from disk, resizes into four R2 variants (thumb, medium, full,
  original) via Sharp, uploads to R2 via Cloudflare's REST API, and
  writes a row to D1. Reads `CLOUDFLARE_API_TOKEN` and
  `CLOUDFLARE_ACCOUNT_ID` from `.env` (never committed). Manual
  country/city slug arguments — EXIF + geocoding deferred to Phase 4.
- Astro v6 breaking change fix: replaced `Astro.locals.runtime.env`
  with `import { env } from "cloudflare:workers"` in both page files.
- **Image-serving route**: `src/pages/i/[key].ts` — server route that
  looks up a photo in D1, checks `is_public`, fetches bytes from R2,
  and returns them with `Cache-Control: max-age=1yr, immutable` and
  `ETag` headers. URL pattern: `/i/<r2-key>`.
- **First real photo uploaded end-to-end** (UUID
  `56aad643-0307-46cc-86e4-636753b158bb`): phone photo of London,
  public, all four R2 variants verified, row written to D1, rendering
  on the live site at `https://footsteps.gallery/countries/united-kingdom`.
- **SESSION KV namespace binding** hardcoded into `wrangler.jsonc`
  (id `2f4c26f795e2448d9bb59e4ef074913b`) to prevent auto-provisioning
  collisions on subsequent deploys.

---

## Phase 4: Admin Upload Pipeline ⏳

*Planned, not yet started.*

Will include:
- Admin upload page (drag-and-drop multi-file)
- EXIF parsing on upload (already prototyped in `scripts/upload-photo.js`,
  to be ported into a server-side route)
- Reverse geocoding via Nominatim
- Auto-creation of new country entries
- Per-photo public/private toggle (default private)
- Admin authentication via Cloudflare Access, same mechanism planned
  for Phase 5 family section

---

## Phase 5: Private Section + Access ⏳

*Code deployed 19 May 2026. Verification in progress.*

**Built**:
- **Migration 0003** — `countries.family_thumbnail_photo_id` renamed to
  `private_thumbnail_photo_id` via SQLite table-swap dance. Applied local
  + remote.
- **Codebase-wide rename "family" → "private"** across all API endpoints,
  admin pages, modal component, and upload pipeline. `is_public` boolean
  unchanged.
- **`src/lib/private-auth.ts`** — `requirePrivateViewer` with 4-email
  allowlist (stevecurrie2000, misslorraineingram, mia.currie01,
  alexcurrie429). Returns 404 not 403.
- **`src/pages/private/index.astro`** — country grid filtered to countries
  with private photos, sorted by most-recent private upload.
- **`src/pages/private/countries/[slug].astro`** — per-city sections + photo
  grids, `is_public = 0` filter.
- **`/i/[key].ts`** extended: private photos require `Cf-Access-Jwt-Assertion`
  header; public photos unchanged.
- **`BaseLayout.astro`** — `isPrivate` prop adds `bg-amber-950/10` warm tint
  to nav; footer gains muted "Private" link on every page.
- **Cloudflare Access app "Footsteps Private"** — Google SSO, 4-email
  allowlist policy, destinations: `private/*`, `api/private/*`, `i/*`.

**Pending** (carried to next session):
- Add `private` bare-path destination to Footsteps Private Access app
  (current `private/*` wildcard doesn't cover bare `/private`).
- Complete Phase 5 verification (6 remaining tests).
- Real-world test with the three non-admin viewers (Lorraine, Mia, Alex).

---

## Phase 6: Polish ⏳

*Planned, not yet started.*

Will include:
- Lightbox with arrow-key navigation
- Lazy loading + image optimisation (Astro `<Image>` + Sharp)
- Custom 404 page
- Cloudflare Analytics
- (Custom domain `footsteps.gallery` already live since Phase 3 — no
  longer a Phase 6 item)

---

## Open Decisions

- **Watermark**: Not yet decided whether to add a subtle watermark to
  public photos.

---

## Reference URLs

- **GitHub**: https://github.com/stevecurrie2000-svg/footsteps
- **Live site**: https://footsteps.gallery (custom domain) and
  https://footsteps.stevecurrie2000.workers.dev (workers.dev URL)
- **Image proxy route**: https://footsteps.gallery/i/&lt;r2-key&gt;
- **Cloudflare dashboard**: https://dash.cloudflare.com

---

## Session log

### Session: State Recovery + Astro v6 Fix (May 2026)

**Context**: Returned to project after a restart. Build log was stale —
significant work had happened in previous sessions that wasn't recorded.

**What was built/changed**:
- **Bug fix**: Migrated D1 binding access from `Astro.locals.runtime.env`
  (removed in Astro v6) to `import { env } from "cloudflare:workers"`.
  Files: `src/pages/index.astro`, `src/pages/countries/[slug].astro`.
  Committed as `acd3d47`.
- **Verified D1 wiring**: Country grid on homepage now renders from D1
  seeded data on localhost. City sections render on country pages
  (showing "No photographs yet" since no photos uploaded).
- **Pushed pending pre-restart work** to GitHub (commit `e671f92`):
  `scripts/upload-photo.js`, `scripts/README.md`, `.gitignore` update
  (added `photos/`), `package.json` + `package-lock.json` (added
  dotenv + upload-script dev dependencies).

**State reconciliation** (what we discovered, not what we built):
- Phase 2 actually complete (was marked in-progress).
- Phase 3 actually mostly complete (was marked not started).
- Deployment is on Workers, not Pages (Pages migration was never
  completed; the workaround turned into the long-term answer).
- `footsteps.gallery` purchased and live (was listed as TBC).

**Decisions made**:
- Stay on Cloudflare Workers; solve auto-deploy via GitHub Actions
  rather than migrating to Pages.
- Introduce a third project doc, `infrastructure.md`, capturing all
  external state.

**Left unfinished**:
- Full state snapshot from Claude Code (config files, git history,
  verification of upload script and domain resolution). To be the
  first task of next session.
- GitHub Actions auto-deploy workflow.
- End-to-end photo upload verification (Phase 3 exit criterion).

---

### Session: Phase 3 Closeout — First Photo End-to-End (May 2026)

**Context**: Returned to finish Phase 3. Goal was to take the upload
script from "code exists" to "real photo rendering on the live site",
closing out Phase 3's exit criterion.

**What was built/changed**:
- **Image serving route**: New file `src/pages/i/[key].ts` — server
  route that looks up a photo in D1, checks `is_public`, fetches
  bytes from R2, and returns them with `Cache-Control: max-age=1yr,
  immutable` and `ETag` headers. URL pattern: `/i/<r2-key>`.
- **Country page template**: `src/pages/countries/[slug].astro`
  updated to emit real `<img>` tags pointing at `/i/<r2_key_thumb>`
  instead of the empty grey-box placeholder. Removed `aspect-video`
  constraint so photos render at natural aspect ratio (better for
  mixed orientations).
- **First real photo uploaded end-to-end**:
  - File: `test-photo.jpg` (phone photo, London)
  - Country: `united-kingdom` / city: `london`
  - `is_public = 1`
  - UUID: `56aad643-0307-46cc-86e4-636753b158bb`
  - Four R2 variants confirmed: `-thumb.jpg`, `-medium.jpg`,
    `-full.jpg`, `-original.jpg`
  - Verified via direct R2 fetch and D1 query (1 row)

**Decisions made**:
- **Image serving: Worker proxy (Option B), not R2 public bucket.**
  R2 public bucket was simpler and slightly cheaper, but Worker
  proxy is the right long-term call because Phase 5's family
  section needs gated images. Doing it once now avoids ripping out
  a public-bucket setup later.
- **URL pattern: `/i/<key>`.** Short, doesn't collide with future
  routes (`/photos`, `/img`, etc.).
- **Missing photos: plain 404.** Phase 6 polish can swap to a
  placeholder JPEG if needed.
- **Caching: 1 year immutable.** Safe because R2 keys contain UUIDs
  — content never changes for a given key.

**Phase 3 exit criterion**: ✅ Confirmed in the next session. London
test photo renders on both `https://footsteps.gallery/countries/united-kingdom`
and the workers.dev equivalent.

**Left unfinished**:
- **Second photo upload test (Australian city)** — deferred. Would
  test the "country/city not in seed data" path, but the upload
  script doesn't currently auto-create new entries. Logic belongs
  in Phase 4. Either skip, or add Australia + Sydney via SQL first
  if we want a multi-country render before Phase 4.
- **GitHub Actions auto-deploy (Option 2)** — still pending. Deploys
  remain manual via `wrangler deploy` until next session.
- **`footsteps build token` cleanup** — over-scoped API token left
  over from earlier sessions (24 permissions, all zones, all users).
  Marked for deletion once GitHub Actions deploy is configured (in
  case it's currently the deploy credential).
- **`infrastructure.md` doc** — still not created. API token records
  for `footsteps-upload-script` and `footsteps build token` are
  documented inside this build log for now; should be migrated to
  a dedicated infrastructure doc next session.

**Issues encountered (worth recording)**:

- **Cloudflare API token TTL trap.** Created `footsteps-upload-script`
  with both Start and End dates set to a future date, producing a
  24-hour usable window in 2028. The token reported "active" in the
  dashboard but Cloudflare's API rejected it as "can not be used
  before [future date]". Diagnostic that finally cracked it: hit
  `GET https://api.cloudflare.com/client/v4/user/tokens/verify` with
  the token in the Authorization header — this is the authoritative
  validity check, no Wrangler or script layers involved.

- **Wrangler v4.x R2 commands.** `wrangler r2 object list` does not
  exist in v4.x — only `get`, `put`, `delete`. To list objects in a
  bucket from the CLI, you have to use the REST API directly or just
  test with `get`. Also: `wrangler r2 object get` defaults to local
  storage even when the database commands default to local-with-
  warning — must pass `--remote` explicitly.

- **Initial token placeholder was never filled in.** Earlier session
  left `CLOUDFLARE_API_TOKEN=your-api-token-here` in `.env`. Wrangler
  was using OAuth credentials at the time so the placeholder was
  never exercised. When OAuth session expired, everything broke at
  once. Lesson: structurally validate `.env` values, don't just
  check that the variable exists.

---

### Session: Deploy Unblock + Phase 3 Live (May 2026)

**Context**: Returned to push the last Phase 3 commits live. Wrangler
was reporting "logged in with an API Token" and refusing both
`wrangler logout` and `wrangler login`. Build log from the previous
session noted two untested suspects: project `.env` being read by a
dotenv loader, and Wrangler's credential cache.

**What was diagnosed**:
- Wrangler's credential cache (`%APPDATA%\xdg.config\.wrangler\
  config\default.toml`) contained a valid OAuth token. Clean.
- No stray `CLOUDFLARE_API_TOKEN` env var in any shell scope.
- The real culprit was twofold:
  1. The Astro build copies `.env` into `dist/server/.dev.vars`,
     which Wrangler reads alongside `--config dist/server/wrangler.json`
     at deploy time. `CLOUDFLARE_API_TOKEN` (the upload-script-only
     token) was overriding the OAuth session.
  2. Wrangler also reads `.env` directly from the current working
     directory. Even after cleaning `.dev.vars`, running `wrangler`
     from the project root re-loaded the same token.
- Fix: run deploy from the parent directory
  (`cd /c/users/steve/projects`), pointing at the config via relative
  path. That sidesteps both the `.dev.vars` issue and the cwd `.env`
  pickup. Wrangler falls back to the OAuth cache, which works.
- Second blocker on first clean deploy attempt: error 10014, KV
  namespace `footsteps-session` already existed from a prior
  half-completed deploy. Astro's Cloudflare adapter tries to
  auto-provision the SESSION KV binding on every deploy. Fix: hardcode
  the existing namespace ID into `wrangler.jsonc` so Wrangler binds to
  it instead of trying to create a new one.

**What was built/changed**:
- `wrangler.jsonc`: Added `kv_namespaces` array with explicit SESSION
  binding (id `2f4c26f795e2448d9bb59e4ef074913b`). Committed as
  `c9a9090`.
- First successful deploy from new code: Worker `footsteps` version
  `3abce671`. All four bindings live (SESSION, DB, PHOTOS, ASSETS).

**Verified**:
- ✅ London test photo renders on `https://footsteps.gallery/countries/united-kingdom`
- ✅ Same renders on `https://footsteps.stevecurrie2000.workers.dev/countries/united-kingdom`

**Phase 3 status**: ✅ Complete.

**Left unfinished** (carried to next session):
- GitHub Actions auto-deploy (Option 2) — still pending. Now the
  single biggest QoL win available; with it, the deploy-environment
  fragility of this session never matters again.
- `footsteps build token` cleanup — still over-scoped, still pending
  deletion. Safe to remove once GitHub Actions has its own scoped
  deploy credential.
- `infrastructure.md` — still not created.

**Issues encountered (worth recording)**:

- **Astro Cloudflare adapter copies `.env` into `dist/server/.dev.vars`.**
  Any auth tokens in `.env` will be picked up by Wrangler at deploy
  time, even if they're scoped for unrelated purposes (e.g. an
  upload-script-only token). The two are conceptually distinct — `.env`
  for build-time/local Node scripts vs. `.dev.vars` for Worker runtime
  vars — but the adapter blurs the line. Mitigations: (a) deploy from
  outside the project directory; (b) strip auth vars from `.dev.vars`
  after build, before deploy; (c) better long-term: move
  upload-script credentials out of `.env` entirely and into a separate
  file the build doesn't touch.

- **Wrangler reads `.env` from the current working directory.** This
  is in addition to the `.dev.vars` pickup. `CLOUDFLARE_API_TOKEN` set
  in a project `.env` will override the OAuth session whenever
  Wrangler is run from that directory, even without the var being
  exported to the shell. `wrangler whoami` is the cheap check: it
  reports the auth method ("OAuth Token" vs "User API Token") it's
  currently using, which immediately tells you whether `.env`
  override is active.

- **`wrangler logout` cannot remove env-var-based auth.** Logout only
  affects the OAuth cache. If the auth is coming from an env var (or
  a `.env` file), logout reports nothing to do and login refuses to
  overwrite. The trap is the error message, which sounds like a
  permanent stuck state.

- **Astro adapter auto-provisions SESSION KV on every deploy.** If
  Wrangler's first deploy attempt creates the namespace but the
  overall deploy fails (auth error, timeout, anything), the next
  deploy hits error 10014 ("namespace already exists") and can't
  recover until the namespace is explicitly bound in `wrangler.jsonc`.
  Hardcode the namespace ID on first successful create.

---

### Session: GitHub Actions Auto-Deploy (May 2026)

**Context**: Phase 3 closed out with auto-deploy still manual via
`wrangler deploy` and the `.env` / OAuth fragility from the previous
session still live. Decided to knock out auto-deploy before starting Phase
4 so subsequent feature work isn't blocked by deploy-environment churn.

**What was built/changed**:
- New scoped Cloudflare API token `footsteps-github-actions-deploy`
  created. Permissions: Workers Scripts:Edit, Workers KV Storage:Edit,
  D1:Edit, User Details:Read. Scoped to single account, 1-year TTL.
- GitHub repository secrets added: `CLOUDFLARE_API_TOKEN` and
  `CLOUDFLARE_ACCOUNT_ID`.
- `.github/workflows/deploy.yml` created — workflow triggers on push to
  `main` (and manual dispatch). Five steps: checkout, setup Node 22, npm
  ci, npm run build, wrangler deploy via `cloudflare/wrangler-action@v3`.
  Deploy command matches the working manual command:
  `deploy --config dist/server/wrangler.json`.
- First run failed on Build site step: Astro v6 requires Node >=22.12.0
  but workflow was set to Node 20. Fix: bump `node-version` to `'22'`.
- Second run succeeded end-to-end in 38 seconds. Worker version replaced
  in production via GitHub Actions, not laptop.
- `footsteps build token` (over-scoped legacy token with 24 permissions,
  no expiry) deleted from Cloudflare.

**Verified**:
- ✅ `https://footsteps.gallery` homepage and country grid render
  correctly post-deploy
- ✅ `https://footsteps.gallery/countries/united-kingdom` still shows
  the London test photo
- ✅ `https://footsteps.stevecurrie2000.workers.dev/countries/united-kingdom`
  same
- ✅ No regression vs prior manual deploy

**Decisions made**:
- Deploy on every push to `main` (no manual approval gate, no tag-based
  releases). Personal-project velocity wins; reverting a bad push is one
  commit away.
- Workflow uses `cloudflare/wrangler-action@v3`, the
  Cloudflare-maintained action. Auth via API token env var, OAuth cache
  on laptop is independent and untouched (manual `wrangler deploy` from
  the laptop still works for emergencies).
- Token scoped tightly per task. No more "build token" with sprawl.

**Left unfinished** (carried to next session):
- **Phase 4 Slice 1**: server-side upload route + Cloudflare Access in
  front of the admin path. Next session's primary work.
- **Node 20 deprecation warning**: `actions/checkout@v4` and
  `actions/setup-node@v4` themselves run on Node 20 internals. GitHub
  will force Node 24 on action wrappers by June 2026. Bump to `@v5`
  versions when they're stable. Non-urgent.
- **`footsteps continue.txt`** untracked file in working tree — needs
  either gitignoring (if a Claude Code session artefact) or deleting
  (if a leftover). Confirm purpose then handle.
- **`infrastructure.md` doc**: still not created. Now have three tokens
  to document (`footsteps-upload-script`, `footsteps-github-actions-deploy`,
  plus historical record of the deleted `footsteps build token`).

**Issues encountered (worth recording)**:

- **Astro v6 minimum Node version is 22.12.0.** Default GitHub Actions
  workflow templates suggest Node 20, which is one major version below
  Astro's floor. Build step fails fast with a clear error message, so
  not a debugging nightmare — but a gotcha worth knowing for any future
  CI setup.

- **Node 20 deprecation on action wrappers ≠ project Node version.**
  GitHub's deprecation notice ("Node.js 20 actions are deprecated") is
  about the runtime inside the action wrappers themselves
  (`actions/checkout`, `actions/setup-node`), not about the Node version
  your project's build steps run with. Two different layers that happen
  to share a warning surface. Distinguishing them saved confusion.

**Lessons learned this session** (to fold into the Lessons section):

- **Astro requires Node 22.12+ for v6.** Pin CI to Node 22 minimum. If
  the project upgrades to a future Astro version, re-check the engine
  requirement.
- **GitHub Actions auth via `cloudflare/wrangler-action@v3` is much
  cleaner than DIY.** It handles env-var setup, doesn't need a separate
  `wrangler login` step, doesn't fall back to interactive auth. Worth
  the third-party dependency.
- **Scope every API token narrowly, set TTLs, name them per purpose.**
  Continuing the discipline from Phase 3. Three tokens now exist
  (upload-script, github-actions, [deleted: footsteps build token]),
  all narrowly scoped, all dated.

---

### Session: Phase 4 Slice 1 — Admin upload pipeline (May 2026)

**Context**: First slice of Phase 4. Goal: server-side upload route +
Cloudflare Access in front of `/admin/*`, with drag-and-drop multi-file
upload, manual per-photo country/city, public/family toggle. No EXIF, no
geocoding, no bulk edit (those are Slices 2–5).

**What was built/changed**:

- **Cloudflare Access setup (new)**:
  - Google Cloud OAuth client `Footsteps Cloudflare Access` created in
    Google Cloud project `Footsteps` (External, Testing mode,
    `stevecurrie2000@gmail.com` as the sole test user).
  - Cloudflare Zero Trust team domain auto-set to
    `silent-bonus-1d5b.cloudflareaccess.com` (kept as-is — never user-visible
    after Instant Auth).
  - Google added as Identity Provider in Cloudflare. Plain Google, not
    Google Workspace.
  - Access application `Footsteps Admin`, 24h session, gates two
    destinations: `footsteps.gallery/admin` and `footsteps.gallery/api/admin`.
    Policy `Admin only`, Allow, Include Emails = `stevecurrie2000@gmail.com`.
    Instant Auth on.

- **New files**:
  - `src/lib/admin-auth.ts` — `ADMIN_EMAILS` allowlist, `getAdminEmail(request)`,
    `requireAdmin(request)`. Reads `Cf-Access-Authenticated-User-Email`
    header. JSDoc notes Phase 6 hardening item (JWT signature validation
    against Cloudflare's JWKS).
  - `src/pages/api/admin/countries.ts` — GET endpoint returning all
    countries from D1 as JSON. Auth-gated.
  - `src/pages/api/admin/cities.ts` — GET endpoint returning cities
    filtered by country slug query param. Auth-gated, parameterised query.
  - `src/pages/admin/index.astro` — Admin upload page. Server-side auth
    in frontmatter, client-side `<script>` for drag-and-drop file
    selection (multi-file, JPEG/PNG only), thumbnail previews with ×
    remove, country/city dropdowns (city repopulates on country change
    with "Loading…" placeholder), Family/Public pill toggle, optional
    caption, sequential per-file upload with status reporting.
  - `src/pages/api/admin/upload.ts` — POST endpoint. Validates four image
    blobs, total combined size ≤50MB, country/city existence in D1.
    Generates UUID. Uploads four R2 variants in parallel via `Promise.all`.
    Inserts photo row into D1 with parameterised binds. Returns 201
    with photo id.

- **Client-side resizing**: Browser does the four-variant resize via native
  `<canvas>` API. Thumb=400px, medium=1200px, full=2400px, original=4000px
  on longest side. JPEG quality 0.80 / 0.85 / 0.90 / 0.95.
  `imageSmoothingQuality = "high"`. Original blobs revoked after processing.
  This sidesteps Cloudflare Images pricing — the binding is bypassed;
  Worker only does auth + R2 PUT + D1 INSERT.

- **Cleanup**:
  - Deleted `scripts/upload-photo.js` and `scripts/README.md` (web upload
    supersedes the Node-based upload script). `scripts/` directory removed.
  - Removed `dotenv` dev dependency from `package.json`.
  - Deleted `footsteps continue.txt` (Claude Code session handoff
    artefact); added to `.gitignore`.

- **Polish follow-up (same session, second commit)**:
  - Tailwind v4 production scanner didn't pick up arbitrary hex classes
    (`bg-[#fafafa]`, `text-[#fafafa]/40`). Replaced all such classes
    throughout the admin page with theme tokens (`bg-foreground`,
    `text-foreground/40`, `bg-background`, `text-background`) which
    `@theme` in `src/styles/global.css` already exposes.
  - Removed `this.value = ""` reset from the `fileInput` change handler
    — it was firing a spurious second `change` event with an empty file
    list on first selection, producing a visible flash and double-prompt.
    The file input is already cleared at the end of a successful upload
    batch.

**Decisions made**:

- **Authentication: Google SSO via Cloudflare Access** (not one-time PIN).
  Slicker login from already-signed-in browsers. Single admin email allowlist.
- **Admin route layout**: single `/admin` page for Slice 1. Will split into
  `/admin/upload`, `/admin/photos`, `/admin/countries` if and when Slices
  4/5 warrant it. Not before.
- **Form fields**: file picker, country dropdown (D1-populated), city
  dropdown (D1-populated, filtered by country), Family/Public toggle (Family
  default), optional caption (≤200 chars). All four metadata fields apply to
  the whole batch — per-file metadata is Slice 4.
- **City field**: dropdown only (no free-text, no "add new"). Validation by
  construction — can't pick a city that isn't in the country. Adding new
  countries pre-Slice-3 means SQL inserts; acceptable for the short window.
- **Image resizing**: client-side via `<canvas>`, not Cloudflare Images
  binding. Avoids the per-transformation billing. Workers only handle auth
  + storage.
- **Upload script removal**: deleted now, not deferred. Reasoning revisited
  mid-session and confirmed.
- **Cloudflare Access destination scope**: both `/admin` and `/api/admin`
  gated by the same application, same policy. First version only gated
  `/admin`, which caused 403s on the API endpoints because the Worker
  didn't see the `Cf-Access-Authenticated-User-Email` header. Pattern to
  remember for Phase 5: gate the page paths AND any `/api/*` paths the
  page calls.
- **`footsteps continue.txt`**: deleted and added to `.gitignore`.
  `build-log.md` is the canonical session-handoff record; parallel handoff
  files fragment the source of truth.

**Verified working**:
- ✅ `/admin` returns the 403 challenge to unauthenticated requests
- ✅ Google sign-in flow completes for `stevecurrie2000@gmail.com`
- ✅ Authenticated `/admin` page renders, shows the signed-in email
- ✅ Country dropdown populates from D1 (UK, France, Italy, Spain)
- ✅ City dropdown repopulates on country change (London + seeded UK city)
- ✅ End-to-end upload: Family photo → R2 (4 variants verified) → D1 row
  → 201 response
- ✅ End-to-end upload: Public photo → same → also appears on
  `/countries/united-kingdom`
- ✅ Family photos correctly hidden from `/countries/united-kingdom` (the
  existing public country page filter on `is_public=1` already does the
  right thing)
- ✅ Both Slice 1 commits (`feat: phase 4 slice 1` + `fix: phase 4 slice 1
  polish`) auto-deployed via GitHub Actions, confirmed green in the
  Actions tab.

**Left unfinished** (for the next session):
- **Cache purge + final visual confirmation**. After the polish commit
  deployed (confirmed green in GitHub Actions), a fresh-incognito visit
  to `/admin` still showed the pre-polish appearance (unstyled, file
  picker double-prompt). Worker version is current; almost certainly
  Cloudflare edge cache holding old HTML/JS. Next session: purge
  Cloudflare cache via dashboard (or use the API), then revisit `/admin`
  in a brand-new incognito window. Cosmetic only — functionally Slice 1
  is verified end-to-end.
- **`docs/footsteps_architecture_post_phase_3.svg`** untracked in working
  tree. Provenance unclear — likely a previous session artefact. Decision
  deferred: commit as a docs commit or leave alone.
- **`infrastructure.md` doc** — still not created. Three API tokens to
  document (`footsteps-upload-script` is now obsolete since the upload
  script is deleted — should be revoked in Cloudflare;
  `footsteps-github-actions-deploy` is the active deploy credential; the
  deleted `footsteps build token` was tidied earlier).
- **Revoke `footsteps-upload-script` API token in Cloudflare** — script
  gone, token no longer needed. Defence-in-depth cleanup. Non-urgent.

**Issues encountered (worth recording)**:

- **Cloudflare Access only injects identity headers on requests it has gated.**
  A Worker route handling `/api/admin/*` while only `/admin/*` is gated will
  see requests without the `Cf-Access-Authenticated-User-Email` header —
  `requireAdmin` correctly 403s these. Fix: add `/api/admin` as a second
  destination on the same Access application. Worth repeating: gate both
  the page paths AND the API paths the page calls. Same pattern will apply
  to Phase 5's family section.

- **Tailwind v4 production CSS scanner is unreliable for arbitrary-value
  classes**, particularly with opacity suffixes (`text-[#fafafa]/40`).
  Symptom: locally everything looks fine; in production the page renders
  with browser defaults. Fix: use named theme tokens from the `@theme`
  block in `src/styles/global.css`. The project's existing
  `--color-background` and `--color-foreground` definitions expose
  `bg-background`, `text-foreground`, etc., with all standard variants and
  reliable opacity (`text-foreground/40`). Rule for future work: prefer
  theme tokens over arbitrary hex classes throughout this project.

- **Resetting `<input type="file">.value` inside its own `change` event
  handler fires a second `change` event** with an empty `FileList`.
  Cosmetic effect varies by browser. Don't reset value inside the change
  handler; clear it at the end of a successful upload batch instead.

- **`git add -A` is dangerous when there are unrelated untracked files in
  the working tree.** During this session, an untracked SVG and a Claude
  Code handoff file got staged accidentally. Discipline: explicit
  `git add -- file1 file2` ahead of any commit that's narrowly scoped, and
  `git status` before every `git commit` to confirm the staged list.

- **Cloudflare's CDN may cache page HTML even after a Worker deploy.**
  GitHub Actions reports the deploy as green and the Worker version
  number updates, but visitors can still receive cached HTML/JS from edge
  nodes for some time. Symptom: post-deploy testing in a fresh-incognito
  session shows pre-deploy behaviour. The truth-test is the Worker version
  in the Cloudflare dashboard, not the rendered page. Recovery: dashboard
  cache purge, or `wrangler` API call to purge cache. Worth knowing for any
  "the deploy didn't work" moment going forward.

**Lessons learned this session** (to fold into Lessons):

- **Gate API paths alongside page paths in Cloudflare Access.** Page route
  + API route under separate destinations on the same Access app is the
  pattern. One app, two destinations, same policy.
- **Tailwind v4 + production CSS = use theme tokens, not arbitrary values.**
  Define design tokens in `@theme {}` in `global.css`. Use the generated
  utilities throughout. Avoid `bg-[#hex]` patterns.
- **Don't reset `<input type="file">.value` in a change handler.** Clear
  it on success/reset, not on every change.
- **Be explicit about staged files in narrow commits.** `git add -A` is
  for sweeping commits; targeted commits deserve targeted staging.
- **Cloudflare team domain auto-naming is fine for personal-project gates.**
  Not user-visible after Instant Auth. The one-time-rename limit is not
  worth using on aesthetics.
- **Cloudflare may serve cached HTML after a successful Worker deploy.**
  The Worker version dashboard is the source of truth, not the rendered
  page. Cache purge if there's a mismatch.

---

### Session: Phase 4 Slices 1 verification, 2 (EXIF), 3 (Nominatim) — May 2026

**Context**: Returned to verify Slice 1's cosmetic deploy and continue
through Slices 2 and 3 of Phase 4. The previous session's "Cloudflare
edge cache holding old HTML" theory turned out to be wrong — the real
cause was structural and worth recording properly.

**Slice 1 verification + root-cause correction**:

The pre-polish appearance on `/admin` after the polish deploy wasn't
edge caching. The real cause was that `global.css` was being imported
**per page** (in `src/pages/index.astro`) rather than from
`BaseLayout.astro`. The admin page used BaseLayout but never imported
the stylesheet itself, so it rendered with browser defaults and no
Tailwind. Homepage and country pages worked only because they each
imported `global.css` independently.

The "Tailwind v4 production CSS scanner is unreliable for
arbitrary-value classes" lesson from the previous session's entry
is therefore wrong — the theme-token swap was a useful improvement
anyway (less fragile pattern) but didn't actually fix the
unstyled-admin-page problem because the real issue was a missing
stylesheet import, not selector matching.

**Fix**: Move `import "../styles/global.css"` into BaseLayout's
frontmatter; remove the per-page imports from index.astro and
countries/[slug].astro. Every page using BaseLayout now gets Tailwind
automatically. Same fix prevents the Phase 5 `/family/*` pages from
hitting the same problem.

Commit: `fix: move global.css import into BaseLayout`. Slice 1 then
verified end-to-end in fresh incognito — dark theme, pill toggle,
file picker single-prompt, thumbnail size, upload flow all correct.

**Slice 2 — EXIF parsing**:

Client-side EXIF extraction via `exifr` (npm package, ~30KB,
supports JPEG/HEIC/CR3). Parsed before the canvas resize, with
targeted `pick` array (`DateTimeOriginal`, GPS lat/lon refs) and
`gps: true` so exifr handles N/S/E/W sign conversion automatically.

UI: small label under each thumbnail — "📅 14 Jun 2026 · 📍 GPS" or
"📅 No date · 📍 No GPS". Uses theme tokens
(`text-foreground/60`, `text-xs`).

Upload endpoint extended to accept four new optional FormData fields:
`capture_date`, `latitude`, `longitude`, `original_filename`. All
nullable in the existing D1 schema. Parameterised INSERT, loose
validation (range checks for lat/lon, ISO date parse for
capture_date), missing/invalid data stored as null rather than
failing the upload.

Decision: manual country/city selection always wins. GPS stored in
D1 as data, not consulted for routing in this slice (geocoding is
Slice 3).

**Slice 3 — Nominatim reverse geocoding + auto-create countries/cities**:

Two pre-flight blockers identified before any code was written:

1. `countries.country_code` column doesn't exist in the schema.
   Decision: skip persisting it. Keep it on the `GeocodedLocation`
   interface as a return value for future use, but don't thread it
   through FormData or INSERT statements. No new migration.

2. Homepage country grid had no public-photo filter, so
   auto-created countries would appear with no thumbnail
   immediately. Decision: add `WHERE EXISTS (SELECT 1 FROM photos
   WHERE country_id = countries.id AND is_public = 1)` to the
   homepage query as part of the same Slice 3 commit.

**What was built**:

- `src/lib/nominatim.ts` — new module. `reverseGeocode(lat, lon)`
  with 5s AbortController timeout, no retry. City resolution chain:
  `address.city` → `address.town` → `address.village` →
  `address.suburb`. `slugify(name)` helper: NFD-normalise → strip
  accents → lowercase → remove apostrophes (both straight and
  curly) → collapse non-alphanumerics to hyphens → trim. Test
  cases verified in diff review: "Côte d'Ivoire" → `cote-divoire`,
  "São Paulo" → `sao-paulo`, "St. Petersburg" → `st-petersburg`.

- `src/pages/admin/index.astro` — per-file geocode after EXIF parse,
  1100ms throttle between calls in multi-file batches (Nominatim
  fair-use policy is 1 req/sec). On success, country and city
  dropdowns auto-fill; if Nominatim returns a country/city not in
  D1, inject a `__new__:<slug>` option with "(new)" suffix into
  the dropdown. On failure (timeout, network, missing address
  fields), `showToast` displays "Couldn't auto-detect location for
  [filename] — pick manually", dropdowns stay empty, user picks
  manually. Toast component is ~30 lines of inline JS, fade-in via
  `requestAnimationFrame`, auto-dismiss after 4s.

- `src/pages/api/admin/upload.ts` — accepts `geocoded_country` and
  `geocoded_city` FormData fields (capped at 100 chars). Detects
  `__new__:` prefix on the country/city form values; validates the
  claimed slug against `slugify(geocodedName)` as a tamper check.
  `INSERT ... ON CONFLICT(slug) DO NOTHING RETURNING id` pattern
  for country and city create; fallback SELECT when ON CONFLICT
  fires. Photo INSERT + conditional thumbnail UPDATE (only when
  `is_public = 1` AND `thumbnail_photo_id IS NULL`) wrapped in a
  D1 batch. Country and city creates run as standalone statements
  before the batch because the photo INSERT needs their returned
  IDs.

- `src/pages/index.astro` — country grid query gained
  `WHERE EXISTS` clause filtering to countries with at least one
  public photo.

**Decisions made**:

- **Geocoding service**: Nominatim. Free, no signup, no key
  management. Fair-use policy (1 req/sec) easily within Footsteps'
  weekly batch sizes. OpenCage remains a future option if Nominatim
  proves unreliable in practice.
- **When geocoding happens**: client-side, on file select. Dropdowns
  auto-fill before upload. Matches the original brief and gives
  immediate feedback for batch uploads.
- **New country handling**: silent auto-create. The whole point of
  GPS auto-detection is "I don't have to think about it" — confirming
  every new country defeats the purpose.
- **First photo as thumbnail**: yes, but only for public photos. If
  the first photo from a new country is Family, the country is
  created with `thumbnail_photo_id = null` and won't appear on the
  public homepage (because of the EXISTS filter) until a public
  photo arrives. Thumbnail field remains a plain updatable column
  for Slice 5 to manage.
- **Nominatim failure**: toast notification + empty dropdowns + manual
  pick. Never block the upload, never silently fail.
- **City resolution**: largest enclosing locality (city → town →
  village → suburb). Trade-off: small villages roll up to their
  parent city (e.g. Castle Combe → Chippenham). GPS coords still
  stored in D1, so granular location data isn't lost.
- **Country name format**: use Nominatim's name as-is ("United
  Kingdom", "Czechia"). One-off SQL UPDATE remains possible later
  if a specific name needs adjusting.
- **`country_code`**: not stored. Function returns it; nothing else
  uses it. YAGNI.
- **Slug apostrophe handling**: apostrophes removed (not replaced
  with hyphens). "Côte d'Ivoire" → `cote-divoire`. Matches default
  behaviour of common slug libraries; ugly but stable.

**Verified working**:
- ✅ Slice 1 fresh-incognito on `/admin`: dark theme, pill toggle,
  single-prompt file picker, thumbnail size, end-to-end upload
- ✅ Slice 2: capture date + GPS status rendering correctly under
  thumbnail ("14 Jun 2025 · 📍 GPS" for a Tower Bridge phone photo)
- ✅ Slice 3: Tower Bridge photo with GPS → country auto-filled
  "United Kingdom" (slug match), city auto-filled "Greater London
  (new)" (Nominatim's name didn't match existing "London" row)

**Issues encountered**:

- **Tailwind theme-token swap from the previous session was a red
  herring**. The real cause of the unstyled admin page was a missing
  `global.css` import in BaseLayout. The theme-token improvement
  itself is fine (better pattern long-term), but the previous
  session's "Tailwind v4 scanner unreliable" lesson is incorrect.
  Lesson updated below.

- **Nominatim returns "Greater London" rather than "London"** for
  GPS coordinates in central London. This is consistent with
  Nominatim's modelling of UK administrative geography
  (Greater London is the city-level admin entity). It doesn't match
  the existing `london` row in D1, so Slice 3 dutifully proposes
  creating a `greater-london` row with "(new)" suffix. The system
  is behaving correctly; the question is about canonical naming
  conventions.

  Considered options: (a) rename existing London → Greater London;
  (b) build a `city_aliases` table that maps geocoded names to
  canonical rows; (c) skip auto-match for now and live with the
  manual dropdown override per upload. **Decision**: option (c).
  Slice 4's bulk-edit review screen is the natural place to handle
  per-batch overrides, and we don't yet have enough data to know
  how often the canonical-naming mismatch will recur. Aliases are
  a generic solution to a problem we've only seen once; revisit
  when Slice 4 exists and the real frequency is visible.

**Left unfinished** (carried to next session):

- **Slice 4 — bulk-edit review screen**. Next session's primary work.
  Will include per-photo metadata override (country/city change before
  commit), and will be the natural place to revisit the Greater
  London / canonical naming question with real data on how often
  mismatches happen.
- **Slice 5 — `/admin/countries` page**. Retrospective country/city
  management (rename, change thumbnail, reorder, delete orphans).
- **Orphan country/city rows** if an upload fails after country/city
  create but before photo insert. Documented inline in `upload.ts`
  as a known trade-off; Slice 5's admin page will handle cleanup.
- **Revoke `footsteps-upload-script` API token in Cloudflare** —
  still pending. Defence-in-depth cleanup.
- **`infrastructure.md` doc** — still not created.
- **`docs/footsteps_architecture_post_phase_3.svg`** — still
  untracked in working tree.
- **Node 20 deprecation on action wrappers** — bump to `@v5` when
  stable. Non-urgent.
- **JWT signature validation** in `src/lib/admin-auth.ts` — Phase 6
  hardening item.

**Lessons learned this session** (to fold into Lessons):

- **`BaseLayout` should own global stylesheet imports**, not
  individual pages. Per-page imports create a footgun: any new
  page using the layout but forgetting the import renders unstyled.
  Centralising in the layout fixes once for all current and future
  pages. Same rule will apply when adding the family section in
  Phase 5.
- **Earlier "Tailwind v4 scanner is unreliable" lesson is incorrect**
  — the unstyled admin page was caused by a missing stylesheet
  import, not by Tailwind's class scanner missing arbitrary-value
  utilities. Theme tokens are still a better pattern than arbitrary
  hex classes (more readable, design-system-friendly), but they're
  not a workaround for a scanner bug because there isn't one.
- **Don't build generic solutions to problems seen once**. The
  Greater London mismatch was tempting to solve with a full alias
  system; deferring to Slice 4 lets real-world data inform whether
  aliases are worth the complexity. Common engineering trap; worth
  the conscious resistance.
- **Nominatim is fast and reliable in practice**. No timeouts
  observed in testing. The 1 req/sec policy is loose enough for
  Footsteps-scale uploads, and the API doesn't require a key. Good
  default for personal projects.
- **D1's `INSERT ... ON CONFLICT DO NOTHING RETURNING id` pattern**
  handles the "create-or-get" idiom cleanly. When ON CONFLICT
  fires, RETURNING is empty, so a fallback SELECT is needed. Worth
  remembering for any future "ensure-row-exists" code.
- **D1 batch ordering**: statements within a batch can't pass data
  to each other. Country/city create must run before the batch
  because the photo INSERT needs their IDs. Batch is therefore
  scoped to "photo insert + thumbnail update", not the full
  multi-table workflow.

---

### Session: Phase 4 Slice 4 — Per-file review table — May 2026

**Context**: Slice 4 of Phase 4. Goal: replace the single-form
apply-to-all upload UI with a per-file review table where each row
has its own inline country / city / audience controls. Also landed
the D1 London → Greater London rename deferred from Slice 3.

**Pre-work: D1 rename**

`cities` row `slug='london'` renamed to `slug='greater-london'`,
`name='Greater London'` via `wrangler d1 execute --remote`. Existing
photo row unaffected — `city_id` foreign key still points at id=1.
This means Nominatim's natural output for central London GPS coords
now matches the D1 row directly; no `(new)` suffix injected on
first-time London uploads.

Verified with SELECT before and after. No migration file needed —
D1 doesn't use migration files for data changes, only schema changes.

**What was built**

`src/pages/admin/index.astro` — complete rewrite of the client-side UI.

HTML structure:
- Container widened from `max-w-2xl` → `max-w-5xl` to accommodate
  the table.
- `<form>` element removed; upload is now triggered by a button click
  listener, not form submit.
- Drop zone retained; transitions from full (`py-16`, "Drop photos
  here...") to compact (`py-8`, "Add more photos") when rows exist.
- `#review-section` hidden initially; shown when first row is added.
  Contains a six-column `<table>` and the upload button.

State model:
- `rows: Map<string, RowState>` — keyed by UUID rowId generated
  client-side at add time.
- `rowElements: Map<string, HTMLTableRowElement>` — parallel map for
  DOM access without `getElementById` across the full table.
- `allCountries` array populated once at page load; awaited via
  `countriesReady` Promise in `addFiles` to prevent a race on fast
  file selection.
- `uploadInFlight` boolean gates the upload button during a batch.

Six table columns per row:
1. Thumbnail (64×64, object-cover, rounded) with `×` remove button
   overlay.
2. Metadata stack: filename, capture date, GPS status — all via DOM
   text nodes, no `innerHTML` with unescaped user data.
3. Country `<select>` — pre-populated from `allCountries` cache;
   `__new__:` option injected by geocode if not in D1.
4. City `<select>` — loads from `/api/admin/cities?country=<slug>`
   on country change; same `__new__:` injection pattern.
5. Audience pill toggle (Family default / Public) — purely visual,
   updates `state.isPublic`.
6. Status cell — idle (blank), uploading (⏳), success (✓ green),
   failed (✗ red + error message). Error message text passed through
   `escapeHtml` before `innerHTML` assignment.

Nominatim queue:
- Single `geocodeQueue: (() => Promise<void>)[]` array drained by
  `drainGeocodeQueue`. One task runs at a time, 1100ms gap between
  calls. Works correctly for both initial file selection and "add
  more" events because all geocode requests go through the same
  queue regardless of when files were added.
- `enqueueGeocode(rowId)` snapshots `gpsLat`/`gpsLon`/`filename`
  from state at enqueue time; checks `rows.has(rowId)` inside the
  task to no-op silently if the row was removed before the geocode
  ran.

Validation:
- `updateRowValidation(rowId)`: adds `bg-red-500/5` to the `<tr>`
  and swaps `border-white/20` → `border-red-500/40` on offending
  selects when `countrySlug` or `citySlug` is null. Clears both
  when valid. Uses `classList.replace` which is a no-op when the
  source class isn't present — safe to call repeatedly.
- `updateButtonState`: disables the upload button while any row has
  null country/city or status `'uploading'`, or while
  `uploadInFlight` is true.

Upload loop:
- Sequential `for` loop over a snapshot of idle valid row IDs
  (taken at click time; rows added mid-upload are not included in
  the current batch).
- Per-file: `setRowStatus('uploading')` → `resizeImage` → build
  `FormData` from row state → `POST /api/admin/upload`.
- On 201: `setRowStatus('success')`, set `tr.style.opacity = '0'`
  + `transition: 'opacity 300ms'` inline, then `setTimeout(300)`
  to call `removeRow`.
- On non-201: parse error body, `setRowStatus('failed', msg)`, row
  stays in table for manual retry or removal.
- Summary toast after the loop: "✓ N uploaded, ✗ N failed — fix
  and retry" (or just the succeeded/failed half if all one outcome).

`removeRow(rowId)`:
- Revokes the thumbnail object URL.
- Removes `<tr>` from DOM and both Maps.
- When `rows.size === 0` after deletion: hides `#review-section`,
  restores drop zone to full height and label, clears `fileInput.value`
  so the same file can be re-selected.

`src/pages/api/admin/upload.ts` — three-line change:
- Removed `captionRaw` / `caption` parsing from FormData.
- Removed `caption` column from INSERT and matching bind parameter;
  VALUES renumbered from `?1…?13` → `?1…?12`.
- Removed `caption` from the 201 response JSON.
- `caption` column remains in D1 schema — no migration.

**Decisions made**

- **`__new__:` country → city restore**: when the user manually
  switches the country dropdown back to a `__new__:` option after
  having changed away, the handler restores the geocoded `__new__:`
  city from `state.geocodedCitySlug` / `geocodedCityName`. Avoids
  leaving a stale city list from the previously-selected existing
  country.
- **Sequential upload loop**: chosen over `Promise.all`. Easier to
  reason about per-row status transitions; avoids potentially
  hammering R2 with parallel PUTs; weekly batch sizes make
  parallelism unnecessary.
- **Thumbnail object URL lifetime**: created in `addRow`, stored in
  `state.thumbnailDataUrl`, revoked in `removeRow`. A second object
  URL is created inside `resizeImage` from the same `File` and
  revoked immediately after resize — two separate URLs for two
  separate purposes, both managed.
- **No resize URL revoke in `addRow`**: the thumbnail URL must stay
  alive for the life of the row (the `<img>` src points to it).
  Only revoked on row removal.
- **`escapeHtml` for error messages**: server error strings are set
  via `innerHTML` in `setRowStatus`; `escapeHtml` guards against any
  injection from a malformed server response.
- **`countriesReady` Promise**: `loadCountries()` fires at module
  load; `addFiles` awaits the returned Promise before processing
  files. Eliminates the race where files are added before the
  countries API call resolves.
- **Caption dropped from pipeline**: the caption `<input>` and
  FormData field are gone. The D1 column is retained; captions are
  a later-phase concern (photo editing, Slice 5 or Phase 6).
- **Container width**: `max-w-5xl` chosen to give the six-column
  table breathing room. The old `max-w-2xl` is retained for the
  public-facing pages.

**Verified working**

- ✅ `/admin` loads, dark theme, file picker works (checklist item 1)
- ✅ Photo with GPS → row appears with thumbnail, filename, date,
  GPS marker, auto-filled country + city (item 2)
- ✅ Photo without GPS → empty dropdowns, red outlines, button
  disabled (item 3)
- ✅ Manual country + city pick clears red outline, enables button
  (item 4)
- ✅ 3-photo batch → 3 rows, Nominatim throttle visible ~1.1s apart
  (item 5)
- ✅ Upload batch → idle → uploading → success → fade out (item 6)
- ✅ Photos land in D1 confirmed via wrangler query (item 7)
- ✅ Public upload appears on `/countries/united-kingdom` (item 8)
- ✅ Greater London auto-fills without `(new)` suffix post-rename
  (item 10)
- ✅ GitHub Actions deploy green (item 11)
- ✅ Fresh-incognito `/admin` post-deploy renders correctly (item 12)

**Left unfinished** (carried to next session)

- **Slice 5 — `/admin/countries` page**. Retrospective management:
  rename country/city display names, change thumbnail, delete orphan
  rows created by failed uploads.
- **Orphan rows** from upload failures after country/city create but
  before photo insert. Documented in `upload.ts`; Slice 5 cleans up.
- **Revoke `footsteps-upload-script` API token** — still pending.
- **`infrastructure.md`** — still not created.
- **`docs/footsteps_architecture_post_phase_3.svg`** — still
  untracked.
- **Node 20 deprecation on action wrappers** — bump to `@v5` when
  stable.
- **JWT signature validation** in `admin-auth.ts` — Phase 6 item.
- **Item 9 from checklist** (deliberate server-error path) — not
  formally tested. Failed-row behaviour was confirmed incidentally
  during upload testing but not via a forced bad-slug injection.

**Lessons learned this session**

- **Per-row state in a `Map` keyed by UUID is the right model for
  dynamic list UIs** in vanilla JS / Astro inline scripts. Direct
  DOM access via `rowElements.get(rowId)` avoids repeated
  `getElementById` calls and keeps state and DOM in sync without a
  framework.
- **`classList.replace(a, b)` is a safe no-op when `a` isn't
  present** — returns `false` silently. Preferred over
  `classList.remove(a); classList.add(b)` for toggle-style class
  swaps because it can't accidentally add `b` when `a` wasn't there.
- **Await the data-load Promise in the handler, not at module load.**
  `const ready = loadCountries()` fires immediately; `await ready`
  in `addFiles` ensures the data is there before it's needed, without
  blocking page initialisation.
- **Snapshot the row IDs at upload-click time.** Rows added while a
  batch is in flight shouldn't be included in the current pass.
  `[...rows.entries()].filter(...).map(([id]) => id)` captures the
  state at the moment the button is clicked.
- **Object URL lifetime must match the consumer's lifetime.** Thumbnail
  URL lives as long as the row; resize URL lives only for the duration
  of `resizeImage`. Getting these wrong causes either broken images
  (too-short) or memory leaks (too-long).

---

### Session: Slice 5 design (May 2026)

**Context**: Planning session in claude.ai. No code changes. Nine design
decisions landed for the Slice 5 build, plus the launch-state cleanup
target. Build session itself happens next.

**Scope of Slice 5**

`/admin/countries` retrospective management page. Handles countries,
cities, thumbnail selection, and per-photo deletion. Auth-gated by
extending the existing Cloudflare Access app (add `/admin/countries`
and `/api/admin/countries/*` as additional destinations on the
Footsteps Admin app).

Per-photo management beyond delete (rename, caption edit, move-between-
cities) remains out of scope and deferred to a later slice when a real
use case emerges.

**Design decisions**

1. **Page structure: single page, expandable rows**. Countries in a
   list, click to expand and reveal that country's cities inline. No
   drill-into sub-pages. Same one-page-table pattern as Slice 4.
2. **Sort orders split**: `/admin/countries` is alphabetical (predictable
   for management); the public homepage country grid switches to "most
   recent public upload first" (`ORDER BY (SELECT MAX(uploaded_at) FROM
   photos WHERE photos.country_id = countries.id AND photos.is_public
   = 1) DESC`). Existing `WHERE EXISTS` filter from Slice 3 retained.
3. **Cascade-delete with photo + city count**: deleting a country or
   city with photos cascades, but the confirm dialog must show the
   exact count of photos (and cities for a country delete) that will be
   removed. Count is computed server-side at click time, not
   pre-loaded, to avoid stale counts.
4. **Thumbnail picker is a modal**: click "Change public thumbnail" or
   "Change family thumbnail" → modal opens with that country's photos
   in a grid; current thumbnail highlighted; click to set. Public
   picker filters to public photos only; family picker shows all
   photos. The modal component is shared between thumbnail picking and
   per-photo management (delete) to avoid near-duplicate UIs.
5. **Two-thumbnail schema**: a new migration renames
   `countries.thumbnail_photo_id` → `public_thumbnail_photo_id` and
   adds `family_thumbnail_photo_id TEXT NULL` with a FK to `photos.id`.
   `upload.ts`'s Slice 3 auto-thumbnail logic extends accordingly: the
   first photo of a new country sets `family_thumbnail_photo_id`
   unconditionally; if that photo is also public, it also sets
   `public_thumbnail_photo_id`.
6. **Per-photo delete UI**: each city row (inside the expanded country
   view) shows a photo count + "Manage photos" affordance opening the
   shared modal in delete mode. Per-photo delete removes D1 row and all
   four R2 objects (`-thumb`, `-medium`, `-full`, `-original`); if the
   deleted photo was either country thumbnail, that column is set to
   NULL.
7. **Launch-state cleanup happens via the UI itself**. The Slice 5
   build session ends by using the page to set Footsteps' first
   launch-state: delete Italy and Spain (empty seed countries); delete
   the London test photo (UUID `56aad643-…`); rename `greater-london`
   back to `london` / "London" (slug + name); add Chelmsford and York
   as UK cities; add Greece (no cities); add Australia with Sydney and
   Marrickville. Each operation also serves as end-to-end verification
   of its corresponding code path.
8. **Captions**: still out of scope. D1 column already retained from
   Slice 4 — no migration needed if/when captions return.
9. **London canonical-naming reversed**: Slice 4 renamed London →
   Greater London in D1 to match Nominatim's natural output.
   Slice 5 reverses this: D1 goes back to `london` / "London" for
   display quality on photo grids. Trade-off accepted: Nominatim auto-
   detection on London uploads will now produce "Greater London (new)"
   in the review table dropdowns, requiring a manual override per
   batch. After a few months of real uploads, if the override is
   constant pain, the previously-deferred alias table (option (b) from
   the original Slice 3 deferral) becomes the obvious next step.

**Launch-state target after Slice 5**

- Australia (Sydney, Marrickville)
- France (no cities)
- Greece (no cities)
- United Kingdom (London, Chelmsford, York)
- No photos
- Public homepage empty (no public photos → `WHERE EXISTS` hides
  everything)
- First real Canon R7 upload becomes the first photo visible to the
  public

**What was NOT decided** (deliberately deferred)

- **City reorder** within a country: not in Slice 5. Cities currently
  appear in `slug ASC` order via the existing query; staying with that
  for now.
- **Per-photo move-between-cities**: not in Slice 5. If it becomes
  needed, future slice.
- **Per-photo caption edit**: not in Slice 5. Captions remain out of
  the whole pipeline for now.
- **Thumbnail auto-fallback** if the chosen thumbnail photo is deleted:
  set to NULL on delete, no auto-promotion to the "next" photo. The
  country can be re-thumbnailled manually or wait for the next upload.

**No code changes this session.** Next session starts with the Slice 5
Claude Code brief, which will cover:

- Migration `0002`: rename + add column for two-thumbnail schema
- `upload.ts` Slice 3 auto-thumbnail logic extended for the new column
- New page `src/pages/admin/countries/index.astro`
- New API endpoints:
  - `GET /api/admin/countries/list` — countries + cities + counts
  - `POST/PATCH /api/admin/countries/[slug]` — rename, change thumbnails
  - `DELETE /api/admin/countries/[slug]` — cascade with confirm-count
    endpoint
  - Similar trio for cities
  - `GET /api/admin/photos/by-country/[slug]` — modal data source
  - `DELETE /api/admin/photos/[id]` — per-photo delete with R2 cleanup
- Cloudflare Access: extend the Footsteps Admin app with two new
  destinations (`/admin/countries` and `/api/admin/countries/*`,
  plus `/api/admin/photos/*`)
- Shared modal component for thumbnail-pick / photo-manage
- Launch-state cleanup as the verification walkthrough

---

### Session: Phase 4 Slice 5 — /admin/countries build (May 2026)

**Context**: Build session following the Slice 5 design session. All
nine design decisions from that session implemented in a single
Claude Code run. No code changes had been made prior to this session.

**What was built**

- **`migrations/0002_split_thumbnails.sql`** — Renames
  `countries.thumbnail_photo_id` → `public_thumbnail_photo_id` via
  `ALTER TABLE ... RENAME COLUMN`; adds `family_thumbnail_photo_id TEXT`.
  Applied local + remote. Remote verified with `PRAGMA table_info`.

- **`src/pages/api/admin/upload.ts`** — Updated auto-thumbnail logic:
  new-country uploads set `family_thumbnail_photo_id` (regardless of
  public/family); all public uploads set `public_thumbnail_photo_id`
  when null. Existing-country uploads only touch `public_thumbnail_photo_id`.

- **`src/pages/index.astro`** — Homepage country cards now show thumbnail
  images (`public_thumbnail_photo_id` → LEFT JOIN photos for
  `r2_key_thumb`). Sort order changed from `sort_order` to most-recent
  public upload date (`ORDER BY MAX(created_at) DESC`).

- **`src/pages/api/admin/cities.ts`** — Added `POST` handler for city
  creation (existing `GET` for dropdown population unchanged).

- **New API endpoints** (all auth-gated via `requireAdmin`):
  - `GET /api/admin/countries/list` — countries with cities, photo counts,
    and thumbnail keys; two queries in a D1 batch merged in TypeScript.
  - `POST /api/admin/countries/[slug]` — create country; slug validated
    against `slugify(name)`.
  - `PATCH /api/admin/countries/[slug]` — rename (updates both name +
    slug), set public/family thumbnail. Separate UPDATE per field to avoid
    dynamic query building.
  - `DELETE /api/admin/countries/[slug]` — collect R2 keys, delete from
    R2 (swallowed on error), then D1 batch: photos → cities → country.
  - `GET /api/admin/countries/[slug]/delete-preview` — returns city_count
    and photo_count via a single JOIN query.
  - `PATCH /api/admin/cities/[id]` — rename city (updates name + slug).
    RETURNING clause gives the updated row.
  - `DELETE /api/admin/cities/[id]` — R2 keys → R2 delete → D1 batch:
    photos → city → clear dangling thumbnail refs via NOT IN subquery.
  - `GET /api/admin/cities/[id]/delete-preview` — photo_count for city.
  - `GET /api/admin/photos/by-country/[slug]` — all photos for a country,
    supports `?filter=public` and `?city_id=N` query params.
  - `DELETE /api/admin/photos/[id]` — batch: clear thumbnail refs +
    delete photo row; then R2 delete (swallowed on error).

- **`src/components/AdminModal.astro`** — `<script is:inline>` exposes
  `window.AdminModal` with:
  - `openThumbnailPicker(slug, 'public'|'family', currentId)` → Promise
    resolving with `{ id, key }` or `null` on cancel. Shows 4-column
    photo grid; current thumbnail highlighted with ring.
  - `openPhotoManager(slug, cityId, cityName)` → Promise resolving when
    modal closes. Shows grid with delete buttons; deletes fire
    `DELETE /api/admin/photos/[id]` and remove from the in-memory array
    + re-render without closing the modal.
  - `confirm(message)` → wraps native `window.confirm` as a Promise.
  - `close()` — closes modal and resolves any pending promise with null.

- **`src/pages/admin/countries/index.astro`** — Auth in frontmatter,
  static shell, all data loaded + rendered client-side via
  `GET /api/admin/countries/list`. Features:
  - Expandable country rows (expansion state persisted across re-renders
    via `expandedSlugs` Set).
  - Inline rename with live slug preview (event delegation on container).
  - Delete country: preview count → `window.confirm` → DELETE API →
    re-render.
  - Change public/family thumbnail via `AdminModal.openThumbnailPicker`
    → PATCH.
  - Add country form: name → auto-slug → POST → hide form → re-render.
  - City rows inside expanded section: rename (inline edit replaces row),
    delete (preview → confirm → DELETE), manage photos (modal), add city.
  - Event delegation throughout; `loadAndRender()` called after every
    mutation for simplicity.

- **`.gitignore`** — Changed `photos/` → `/photos/` (root-only) so
  `src/pages/api/admin/photos/` source files aren't excluded.

**Decisions made**

- **Separate UPDATE statements per field in PATCH**: avoids dynamic SQL
  string building which is error-prone with `?N` positional params.
  Acceptable overhead for personal admin tool with < 10 countries.
- **`is:inline` for AdminModal script**: avoids TypeScript checking on
  `window.AdminModal` assignment; injected at parse time in correct order
  before the admin page script.
- **Native `window.confirm` for delete confirmation**: simpler than a
  custom modal confirm; shows exact photo/city counts in the message.
- **Full re-render after each mutation**: safe given < 10 countries;
  expansion state restored from `expandedSlugs` Set. Avoids per-node
  update complexity.
- **`NOT IN (SELECT id FROM photos)` thumbnail cleanup on city delete**:
  cleaner than per-photo clearing; runs after the photo DELETE in the
  same D1 batch which sees the deletions.
- **`/api/admin/photos/` directory collision with `.gitignore`**: the
  existing `photos/` rule in `.gitignore` was intended for root-level
  test photo files. Tightened to `/photos/` (root-anchored) to allow
  API source files.

**Commit**: `feat: phase 4 slice 5 — /admin/countries management page`
(commit `1cbed73`). Pushed; GitHub Actions deploy in progress.

**Left unfinished / next steps**

- **Cloudflare Access destinations**: Add `/admin/countries` and
  `/api/admin/countries/*`, `/api/admin/cities/*`, `/api/admin/photos/*`
  as additional destinations on the Footsteps Admin Access app
  (Zero Trust → Access → Applications → Footsteps Admin → Edit).
  Without this, the new routes won't see the `Cf-Access-Authenticated-
  User-Email` header and will 403.
- **Launch-state verification** (14 steps from the design session):
  delete Italy, delete Spain, delete London test photo, rename
  greater-london → london / London, add Chelmsford + York (UK),
  add Greece (no cities), add Australia with Sydney + Marrickville.
  Each step validates a code path end-to-end.
- **Update project knowledge** in claude.ai after verification.
- **`docs/footsteps_architecture_post_phase_3.svg`** — still untracked.
- **`docs/Next Claude prompt - footsteps.txt`** — stale Claude.ai
  handoff file; safe to delete or gitignore.
- **Revoke `footsteps-upload-script` API token** — still pending.
- **Node 20 deprecation on action wrappers** — bump to `@v5` when stable.
- **JWT signature validation** in `admin-auth.ts` — Phase 6 item.

---

### Session: Phase 5 — Private section + Cloudflare Access build (19 May 2026, evening)

**Context**: Phase 5 build session. Design session in the previous
chat had landed all four open questions (faint warm tint on /private
nav, hidden from main nav + tiny footer link, strict one-or-the-other
audience, most-recent-private-upload-first sort) and 8 locked
decisions. This session executed the full Claude Code brief and ran
into a Cloudflare Access destination configuration issue mid-
verification.

**What was built**

- **Migration 0003**: `countries.family_thumbnail_photo_id` renamed
  to `private_thumbnail_photo_id` via SQLite table-swap dance.
  Applied local + remote, PRAGMA verified.
- **Codebase-wide rename "family" → "private"** in a single commit:
  - `src/pages/api/admin/upload.ts` — auto-thumbnail column rename
  - `src/pages/api/admin/countries/list.ts`, `[slug].ts` — column +
    action names
  - `src/pages/admin/countries/index.astro`,
    `src/pages/admin/index.astro`,
    `src/components/AdminModal.astro` — UI strings and audience
    parameter values
  - `is_public` boolean unchanged
- **New page templates**:
  - `src/pages/private/index.astro` — country grid mirroring
    homepage, filtered to countries with private photos, sorted by
    most recent private upload
  - `src/pages/private/countries/[slug].astro` — city sections +
    photo grids, private-only
- **New helper `src/lib/private-auth.ts`** — mirrors `requireAdmin`
  pattern. Allowlist of 4 emails (stevecurrie2000, misslorraineingram,
  mia.currie01, alexcurrie429 — all gmail). Returns 404 (not 403)
  on unauthenticated to avoid leaking the section's existence.
- **`/i/[key].ts` extended** to require `Cf-Access-Jwt-Assertion`
  header for private photos. Public photos unchanged. Returns 404
  on missing claim.
- **BaseLayout** accepts `isPrivate` prop; applies warm tint to nav
  when true. Footer gains a single muted "Private" link on every
  page.
- **Cloudflare Access app "Footsteps Private"** created. Three
  destinations: `private/*`, `api/private/*`, `i/*`. Google SSO.
  Policy "Private viewers" allows the 4 emails above.

**Issues encountered and fixed**

- **Pre-existing `/admin` 403 bug** (carried over from a prior
  session, only noticed mid-Phase 5 verification). Bare
  `https://footsteps.gallery/admin` and `/admin/` both returned a
  plain-text "Forbidden" from the Worker. Root cause: the Cloudflare
  Access "Footsteps Admin" app's destinations were `admin/*` and
  `api/admin/*` — and `admin/*` does NOT match the bare path
  `/admin` (the `*` requires at least one character after the
  slash). Bare `/admin` was therefore ungated, the Worker received
  the request without the `Cf-Access-Authenticated-User-Email`
  header, and `requireAdmin` 403'd it. **Fix**: added a third
  destination row with path `admin` (no slash, no wildcard) to the
  Footsteps Admin Access app. Verified: bare `/admin` now redirects
  to Google sign-in, full flow works.

**Issues identified but not yet fixed**

- **Same wildcard gap on "Footsteps Private"**. Bare
  `https://footsteps.gallery/private` returns 404 (not the Google
  sign-in challenge), because `private/*` doesn't cover bare
  `/private`. Fix is identical to admin: add a `private` destination
  (no slash, no wildcard) to the Footsteps Private Access app.
  **Carried to next session** along with the remaining verification
  tests.

**Verified working before pause**

- ✅ Migration 0003 applied to remote D1; column renamed
- ✅ `/admin` and `/admin/countries` both function after the rename
  and after the bare-path destination fix
- ✅ Phase 5 deploy is green in GitHub Actions
- ✅ `/private` route exists at the edge (returns 404 from the
  Worker rather than DNS failure or 500)

**Not yet verified** (Phase 5 verification carried to next session)

- ⏳ `/private` redirects to Google sign-in for unauthenticated
  (pending Private app destination fix)
- ⏳ Signed-in allowlisted user lands on `/private`
- ⏳ Private photo upload via `/admin` renders on `/private/<slug>`
- ⏳ `/i/<r2_key>` returns 404 for private photo when accessed
  without Access session
- ⏳ Public photo URL still works without sign-in
- ⏳ Non-allowlisted Google account gets 404
- ⏳ Footer "Private" link present on every page

**Decisions made this session**

- **404 over 403 for ungated bare paths**: when the wildcard gap
  was exposed, the Worker's behaviour (404 via `requirePrivateViewer`,
  403 via `requireAdmin`) matched the "leak no information" stance
  for private and the "you tried to access admin" stance for admin.
  Confirmed this is the right pattern; no change planned.

**Left unfinished / carried to next session**

- **Add `private` destination** to Footsteps Private Access app
  (Cloudflare dashboard work, see Issues identified above).
- **Phase 5 verification tests 1–8** (walked through the brief
  earlier, paused after Test 1 failed in the expected way).
- **Real-world testing with the three non-admin allowlisted users**
  (Lorraine, Mia, Alex) — send the URL when verification is clean.
- **Phase 6 begins after verification closes out**: lightbox, lazy
  loading + Astro `<Image>` optimisation, custom 404 page,
  Cloudflare Analytics, JWT signature validation for both auth
  helpers, watermark decision on public photos.
- **Revoke `footsteps-upload-script` API token** — still pending.
- **`infrastructure.md`** — still not created. Now has 4 active
  things to document: 2 API tokens (`footsteps-github-actions-deploy`
  active, `footsteps-upload-script` to be revoked) and 2 Access
  apps ("Footsteps Admin", "Footsteps Private").
- **`docs/footsteps_architecture_post_phase_3.svg`** and
  **`docs/Next Claude prompt - footsteps.txt`** — still untracked.
- **Node 20 deprecation on action wrappers** — bump to `@v5` when
  stable.

**Lessons learned this session**

- **Cloudflare Access `path/*` does NOT match the bare `path`.**
  The wildcard requires at least one character after the trailing
  slash. Any Access app gating a route at a base path must include
  both an explicit bare-path destination AND a wildcard destination.
  Standard pattern for every Access-gated section going forward:
  destination 1 = `<base>` (no slash, no wildcard), destination 2 =
  `<base>/*` (wildcard). Same pattern applies to API paths if the
  API has a base route.
- **A plain-text "Forbidden" from the Worker is a signal that
  Access didn't gate the request.** Cloudflare-branded Access denial
  pages mean Access fired and rejected; the Worker's own
  `requireAdmin` 403 (plain text, no chrome) means Access never
  fired and the Worker is responding without the email header.
  Distinguishing these two on first glance saves diagnostic time.
- **Update the project's standard Access-app setup procedure**
  whenever a future Phase touches Access. Pattern: both a bare-path
  destination AND a wildcard destination for every gated section.

---

### Session: Footer Private link fix (22 May 2026, 18:33)

**Context**: Phase 5 carry from the 19 May build session. The build log recorded that BaseLayout should gain a muted "Private" link in the footer on every page, but it was never actually added.

**Diagnosis**: `src/layouts/BaseLayout.astro` has a footer with only a copyright line:

```astro
<footer class="border-t border-white/10 py-8 text-center">
  <p class="text-xs text-[#fafafa]/30">
    &copy; {new Date().getFullYear()} Footsteps
  </p>
</footer>
```

The Private link is present in the **nav** (unconditional), but was never added to the footer. No pages override the footer — it's BaseLayout-only, so a single edit fixes all pages at once.

**Fix shipped**: Added a `·` separator and the Private link into the existing footer `<p>`:

```astro
<footer class="border-t border-white/10 py-8 text-center">
  <p class="text-xs text-[#fafafa]/30">
    &copy; {new Date().getFullYear()} Footsteps
    &nbsp;·&nbsp;
    <a href="/private" class="text-foreground/40 hover:text-foreground/60 transition-colors text-xs">Private</a>
  </p>
</footer>
```

Link is unconditional — Cloudflare Access gates the destination, not the link visibility.

**Verified**: `npm run build` clean. Link present in the compiled output for `/`, `/countries/[slug]`, `/admin`, and `/private` (all use BaseLayout).

---

### Session: Geocode fix — partial wins + suburb preference (22 May 2026)

**Context**: Follow-up triggered by a Pixel 9 Pro XL upload test on 21 May 2026. A photo with valid EXIF GPS — "📍 GPS" pill rendered correctly in the `/admin` review table — failed to auto-fill country and city. The standard "Couldn't auto-detect location" error toast fired.

**Network-side context**: An earlier observation of "TLS error on /private/*" during a Ramsay Health guest WiFi session was network interception (corporate WiFi MITM), NOT a site bug. Both Nominatim and footsteps.gallery responded normally on a phone hotspot.

**Root cause — proven via direct Nominatim queries**

Five Sydney-region coordinate sets queried directly against the Nominatim API before touching any code:

| Location | Lat, Lon | city | town | village | suburb | Other useful fields |
|---|---|---|---|---|---|---|
| Sydney CBD | -33.8688, 151.2093 | Sydney | — | — | — | — |
| Bondi Beach | -33.8915, 151.2767 | Sydney | — | — | — | — |
| Marrickville | -33.9094, 151.1556 | Sydney | — | — | Marrickville | — |
| Blue Mountains (Katoomba) | — | Sydney | — | — | — | — |
| Royal National Park | -34.1500, 151.0500 | **null** | **null** | **null** | **null** | borough, municipality, county, state, country all populated |

Royal National Park returns null for `city`, `town`, `village`, and `suburb` — the area is tagged by `borough`, `municipality`, and `county` in Nominatim's data model. The Slice 3 resolution chain (`city → town → village → suburb`) treated all-null as total geocode failure and discarded the country information Nominatim *did* return.

**Secondary bug**: Marrickville returns `city=Sydney, suburb=Marrickville`. The old chain picked `city` first, auto-filling "Sydney" — wrong, since Marrickville is its own suburb under the D1 data.

**What shipped**

- `src/lib/nominatim.ts`:
  - Replaced `GeocodedLocation` interface with `GeocodeResult` discriminated union (`ok` / `partial` / `error`).
  - Extended resolution chain to `city → town → village → suburb → hamlet → municipality → county → borough`.
  - Suburb-preference rule: if `suburb` is present, `city` was picked, and `suburb !== city` (case-insensitive), swap to `suburb` (fixes Marrickville-style cases).
  - Country present, city null → `{status: 'partial', countryName, countryCode}`.
  - Network/timeout/no-country → `{status: 'error', reason: ...}`.
  - Happy path → `{status: 'ok'}` with pre-computed `citySlug`.

- `src/pages/admin/index.astro`:
  - `enqueueGeocode` switches on result status; no longer uses try/catch (errors are now values).
  - `applyGeocodeToRow` updated for new field names (`countryName`, `cityName`, `citySlug`).
  - New `applyPartialGeocodeToRow` — fills country dropdown, triggers city load, leaves city unselected.
  - Three toast messages: silent on `ok`; `"Found country for [filename] but no city — please pick the city"` on `partial`; `"Couldn't reach geocoding service for [filename] — pick country and city manually"` on `error`.

**Backwards-compatible**: Sydney CBD, Bondi, Tower Bridge coords still auto-fill both country and city with no toast. No new dependencies.

**Lessons from this session**

- **Diagnose third-party API behaviour with live queries before changing local code.** Five direct Nominatim queries proved the data shape variability; speculating from the failing upload alone would have produced the wrong fix.
- **Partial wins are wins.** When integrating with external data sources, treat fields independently — don't collapse the whole result to null just because one optional field is missing.
- **Suburb vs city is not a hierarchy in Nominatim.** Both fields can be populated simultaneously; which one is the "right" answer depends on whether they differ, not on a fixed precedence.

---

### Session: Cloudflare Access rebuild — Footsteps Private app (22 May 2026, evening)

**Context**: Picking up the Phase 5 carry from 19 May —
specifically the bare-path `/private` Cloudflare Access destination
that was identified as needing to be added to the existing Footsteps
Private Access app. Driven from claude.ai via the Claude Chrome
extension against a live Cloudflare Zero Trust dashboard session.
No repo or code changes.

**Discovery: app was missing entirely**

A screenshot from the Applications page early in the session
revealed only "Footsteps Admin" — no "Footsteps Private". Either
the 19 May save never fully committed, or the app was deleted
between sessions and the build-log wasn't updated. The carry
therefore changed shape mid-session: instead of "add a bare-path
destination", it became "rebuild the entire app from scratch".

**Cloudflare UI changed substantially since 19 May**

The Zero Trust dashboard navigation, URL structure, and app create
flow have all been refreshed:

- Navigation path is now **Access controls → Applications** (was
  previously a different IA)
- URL pattern is `dash.cloudflare.com/<accountId>/one/access-controls/apps`
- App creation flow split into **Application details** and
  **Additional settings** tabs
- The **Application name** field sits *below* the destinations on
  the Application details tab (not at the top — easy to miss on
  first scroll)
- Identity providers, instant authentication toggle, and session
  duration are all on Application details (not Additional settings
  as the layout suggests)
- "Additional settings" is now App Launcher tile, Tags, Custom
  block pages, CORS, Cookies, AUD tag, OAuth — none of which are
  required for a basic setup

**What was rebuilt**

Cloudflare Access application **"Footsteps Private"**:

- Type: Self-hosted
- Destinations (4):
  - `footsteps.gallery/private` (bare path — the 19 May carry)
  - `footsteps.gallery/private/*`
  - `footsteps.gallery/api/private/*`
  - `footsteps.gallery/i/*`
- Identity provider: Google only
- Instant Authentication: ON (auto-enabled when only one IdP is
  selected — saves clicking through the picker)
- Session duration: 24 hours (matches Footsteps Admin)
- Policy "Private viewers" (Action: Allow) — 4 emails:
  - `stevecurrie2000@gmail.com`
  - `misslorraineingram@gmail.com`
  - `mia.currie01@gmail.com`
  - `alexcurrie429@gmail.com`

**Critical UI bug encountered**

The inline policy builder during app creation does NOT persist the
policy on save. After clicking the final "Create" button, the
toast read "Application successfully configured" — but the new
app appeared in the list with `--` in the Policies column. The
policy had to be re-created from the app's Manage → Policies tab
and saved separately via the **Save policy** button, then the app
itself committed via the bottom **Save** button. This pattern is
worth documenting because the toast misleads you into thinking
the policy saved when it didn't.

**Verification**

- ✅ Both apps appear in the Applications list with policies
  attached: Footsteps Admin (Admin only) and Footsteps Private
  (Private viewers)
- ✅ Fresh incognito to `https://footsteps.gallery/private`
  redirects to Google sign-in via Instant Auth
- ✅ Signed-in allowlisted account lands on the empty `/private`
  country grid with warm amber nav tint

**Carries closed by this session**

- Bare-path `/private` Access destination (was on the 19 May carry
  list)
- The "rebuild needed" issue surfaced and was resolved within the
  same session

**Lessons learned (fold into Lessons section)**

- **Cloudflare's Zero Trust UI refreshed in May 2026.** The
  navigation path is now `Access controls → Applications`, the
  URL pattern is `dash.cloudflare.com/<accountId>/one/access-controls/apps`,
  and the app config form is split across Application details and
  Additional settings tabs. The Application name field is below
  destinations on Application details (not at the top of the form).
- **The inline policy builder during app creation does NOT
  persist the policy.** A "successfully configured" toast appears,
  but the app saves without the policy attached. Workaround:
  always create the app first with destinations + IdP + session
  duration, then enter Manage → Policies → Create new policy,
  click **Save policy** (inside the policy pane), then click the
  bottom **Save** (commits the app). Two saves, in that order.
- **Policies are now reusable objects in the new UI.** They appear
  in an "Add existing policy" dropdown on the Policies tab, scoped
  to the team rather than to a single app. Useful for sharing
  policies across apps, but a footgun when the inline builder
  silently creates and orphans them.
- **A "successfully configured" toast does not mean every field
  saved.** Always cross-check the Applications list view after a
  save — particularly the Policies column — and refresh the page
  if anything looks wrong before re-running the save flow.

---

### Session: Fix: auto-set private thumbnail for existing-country uploads (22 May 2026, 21:30)

**Context**: Bug surfaced during Phase 5 verification walkthrough.
A private Pixel 9 Pro Hunter Valley shot was uploaded to Australia
(existing country, new city Cessnock). Photo landed in D1 and R2
correctly, Cessnock was auto-created, the photo rendered on
`/private/countries/australia` — but the `/private` country grid
showed Australia with no thumbnail.

**Diagnosis**

The existing-country thumbnail block in `src/pages/api/admin/upload.ts`
only touched `public_thumbnail_photo_id`:

```ts
// Before (bug):
...(isPublic ? [
  env.DB.prepare(
    `UPDATE countries SET public_thumbnail_photo_id = ?1 WHERE id = ?2 AND public_thumbnail_photo_id IS NULL`
  ).bind(id, countryId),
] : []),
```

The `!isPublic` arm was an empty spread — no UPDATE fired for private
photos to existing countries. The Phase 5 rename
(`family_thumbnail_photo_id` → `private_thumbnail_photo_id`)
correctly updated the new-country branch (which runs unconditionally
for `isNewCountry`) but missed this existing-country branch because
they live in different conditional arms of the same function.

**Fix shipped**

Converted the empty else arm to a symmetric private UPDATE:

```ts
// After (fix):
...(isPublic ? [
  env.DB.prepare(
    `UPDATE countries SET public_thumbnail_photo_id = ?1 WHERE id = ?2 AND public_thumbnail_photo_id IS NULL`
  ).bind(id, countryId),
] : [
  env.DB.prepare(
    `UPDATE countries SET private_thumbnail_photo_id = ?1 WHERE id = ?2 AND private_thumbnail_photo_id IS NULL`
  ).bind(id, countryId),
]),
```

Both branches fire conditionally on `is_public`, both guarded by
`IS NULL`. Mutually exclusive — every photo has exactly one audience.
New-country branch unchanged.

`npm run build` passed clean. No new TypeScript errors.

---

### Session: Phase 5 verification walkthrough + close-out (22 May 2026, evening)

**Context**: Final session of a long evening. Phase 5 (Private
section + Cloudflare Access) had four discrete pieces of work shipped
across the day:

1. Geocode fix — partial wins + suburb preference
2. Cloudflare Access rebuild — Footsteps Private app
3. Footer Private link fix
4. Auto-thumbnail fix for existing-country private uploads

This session ran the verification walkthrough end-to-end via the
Claude Chrome extension, plus a real upload test that exercised both
auto-thumbnail code paths.

**Verification — what was tested**

Tests automated via the Claude Chrome extension on a signed-in
session at `https://footsteps.gallery`:

| # | Test | Result |
|---|---|---|
| 1 | Bare `/private` redirect to sign-in (incognito) | ✅ Verified during Access rebuild earlier |
| 2 | `/private/<slug>` redirect to sign-in | ✅ Same code path as #1 |
| 3 | Public `/` loads without auth | ✅ Shows UK only (correct filter) |
| 4 | Public `/countries/united-kingdom` loads | ✅ 3 cities, 1 photograph |
| 5 | Footer Private link site-wide | ✅ Present on `/`, `/countries/<slug>`, `/admin`, `/private` |
| 6 | Signed-in `/private` lands on country grid with warm amber nav tint | ✅ |
| 7 | Signed-in `/private/countries/<slug>` renders correctly | ✅ "0 cities · 0 photographs" pre-upload (correct private-only filter) |
| 8 | Public photo `/i/<key>` loads without auth | ✅ Tower Bridge thumbnail serves directly |

**Upload verification — both auto-thumbnail branches**

- **Existing-country private upload** (Australia/Cessnock): the
  initial upload landed in D1 and R2 correctly but Australia appeared
  on `/private` without a thumbnail (the bug that triggered the fix
  earlier this session). After the fix deployed, a re-upload set
  `private_thumbnail_photo_id` on the Australia row.
- **New-country private upload** (Philippines): country auto-created,
  city auto-created, `private_thumbnail_photo_id` set on the new row,
  thumbnail rendered on the `/private` grid. Pre-existing new-country
  code path confirmed still working after the patch.

**`/private` grid after both uploads**

Two tile cards rendering side by side: Australia (Bonvilla vineyard
sunset, Cessnock) and Philippines (cityscape, location to be
confirmed once Nominatim's resolution is reviewed). Sort order is
"most recent private upload first" — Philippines first, Australia
second, consistent with upload order.

**Public homepage after both uploads**

Country grid shows United Kingdom only. Australia and Philippines
correctly absent — the `WHERE EXISTS public photos` filter holds. Schema
separation between public and private audiences verified end-to-end.

**Acceptance criteria from the Phase 5 design session**

| Criterion | Status |
|---|---|
| Bare `/private` gated by Access | ✅ |
| `/private/*` gated by Access | ✅ |
| `/api/private/*` gated by Access | ✅ (proven by `/private` page making API calls) |
| `/i/*` gated by Access for private photos | ✅ (private photos render under auth) |
| Allowlisted user lands on `/private` country grid | ✅ |
| Warm amber nav tint on `/private` routes | ✅ |
| Footer Private link site-wide | ✅ |
| Schema separation: private uploads invisible on public pages | ✅ |
| New-country auto-create on private upload | ✅ |
| Country thumbnail auto-set on first private upload | ✅ (after today's fix) |
| Country in `/private` grid sorted by most-recent private upload | ✅ |

**Real-world tests carried**

These cannot be run from Steve's account and remain on the carry list:

- **Non-allowlisted Google account gets 404 on `/private`** — needs a
  second Google account not on the 4-email allowlist.
- **Lorraine, Mia, Alex sign-in from their own browsers** — pending
  Steve sending them the URL.

**Carries closed by this session**

- Phase 5 verification walkthrough (the primary purpose of the session)
- Auto-thumbnail bug discovered + fixed + verified within the same
  session

**Phase 5 declared ✅ Done.** Phase 6 (Polish) is the next phase.

**Lesson learned this session** (fold into Lessons → Technical
sub-heading):

- **End-to-end verification often uncovers subtle bugs in adjacent
  code paths.** The auto-thumbnail bug was a Phase 4 Slice 5 +
  Phase 5 rename interaction issue — invisible until a real upload
  exercised the existing-country + private-audience combination.
  Verification walkthroughs that exercise real workflows with real
  files are worth their time cost. Unit tests on the upload route
  would not have caught this because the bug is a missing case, not
  a wrong implementation of an expected case.

---

### Session: Phase 6 — /admin/photos page (23 May 2026, 20:35)

**Context**: First slice of Phase 6. Driven by a real-user need
surfaced during the 22 May batch upload test — 26 photos uploaded,
2 with city auto-detect misses that needed post-upload override.
The existing `/admin/countries` modal deletes photos but doesn't
support editing metadata. This session builds the full post-upload
management workflow. Design decisions locked in a prior claude.ai
planning session.

**What was built**

- **`src/components/AdminNav.astro`** (new) — Admin navigation
  strip. Three links: Upload / Photos / Countries. Active page
  styled `text-foreground`; others `text-foreground/40
  hover:text-foreground/60`. Exact-match for `/admin`, prefix-match
  for the other two. Rendered by BaseLayout when `isAdmin={true}`.

- **`src/layouts/BaseLayout.astro`** (edit) — Added `isAdmin?:
  boolean` prop. Conditionally renders `<AdminNav />` between the
  main nav `</header>` and `<main>`. Added AdminNav import.

- **`src/pages/admin/index.astro`** and
  **`src/pages/admin/countries/index.astro`** (edits) — Added
  `isAdmin={true}` to their `<BaseLayout>` call.

- **`src/pages/api/admin/photos/list.ts`** (new) — `GET
  /api/admin/photos/list`. Supports `country`, `city`, `audience`
  (`public`|`private`), `sort` (`upload_date_desc` |
  `capture_date_desc` | `country_asc`), `offset`, `limit` (max
  200). Returns `{ photos: [...], total: N }`. D1 batch of photos
  query + count query. Parameterised binds throughout.

- **`src/pages/api/admin/photos/[id].ts`** (edit) — Added `PATCH`
  handler alongside the existing `DELETE`. Accepts JSON `{
  country_id, city_id, is_public, caption }` (all optional —
  unset fields retain current values). Reads current photo state
  first, validates country/city existence, then D1 batch:
  - UPDATE photos with merged values
  - Clear old audience's thumbnail on old country (targeted: WHERE
    col = this photo ID — no-op if not the thumbnail)
  - Auto-set new audience's thumbnail on new country (IS NULL guard)
  Returns 200 `{ id, country_id, city_id, is_public, caption }`.

- **`src/pages/admin/photos/index.astro`** (new) — Contact-sheet
  photo management page. `requireAdmin` in frontmatter. Features:
  - **CSS Grid**: 2/3/4/5 columns at sm/lg/xl breakpoints
  - **Filter bar**: country/city dropdowns (cascading), audience
    three-way segment (All/Public/Private), sort dropdown. State
    synced to URL query string so reload preserves filters.
  - **Active filter chips**: removable chips for country/city/
    audience. Country chip shows display name.
  - **Counter**: "Showing N of M" updated on every load/loadmore.
  - **Infinite scroll**: IntersectionObserver on sentinel at bottom.
    Fetches 50 more when sentinel enters viewport (200px margin).
    Loading indicator visible during fetch. Sentinel hidden when
    all photos loaded.
  - **Grid tiles**: square aspect-ratio with lock icon (🔒) for
    private photos, city name revealed on hover via gradient overlay.
  - **Edit modal** (inline): large medium-variant preview, country/
    city dropdowns (populated from `/api/admin/countries/list`),
    audience pill toggle, caption textarea (500 char), read-only
    metadata (filename, capture date, GPS, upload date). Save/
    Cancel/Delete buttons. Esc and click-outside close without save.
  - **Inline city creation**: "Add new city" last option in city
    dropdown. Clicking expands an inline form. POST to
    `/api/admin/cities`, success auto-refreshes city dropdown and
    selects new city. 409 collision displayed inline.
  - On Save: PATCH request with country_id, city_id, is_public,
    caption. On 200, close modal and reload grid.
  - On Delete: confirm dialog → DELETE → close modal and reload grid.

**AdminModal (`/admin/countries`) is already delete-only.** No
changes needed — `openPhotoManager` only shows Delete buttons.
Verified by reading `src/components/AdminModal.astro`.

**Cloudflare Access destinations:** No changes needed. New routes
`/admin/photos` and `/api/admin/photos/list` are covered by the
existing `admin/*` and `api/admin/*` wildcard destinations on the
Footsteps Admin Access app.

**Design decisions** (see Phase 6 planning in claude.ai for the full
set — not reproduced here):
- Fresh inline modal built rather than extending AdminModal: the
  edit modal is a form layout; AdminModal is a photo-grid picker.
  Different shapes make extension a liability rather than a benefit.
- Thumbnail cleanup in PATCH: targeted clear on old country/audience
  (WHERE col = photoId) + auto-set on new country/audience (IS NULL
  guard). Mirrors upload.ts pattern exactly.

**Verified locally**: `npm run build` clean, no new TypeScript errors.

**Verified in production** (23 May 2026, post-deploy):

- ✅ Contact-sheet grid loads and renders thumbnails with lock icons on private photos
- ✅ Filter chips (country/city/audience) combine correctly; URL query string updates and reload preserves state
- ✅ Sort dropdown changes order
- ✅ Infinite scroll fetches next 50 when sentinel enters viewport; loading indicator visible; counter updates
- ✅ Click photo → edit modal opens with medium preview and correct metadata
- ✅ Edit saves (country/city/audience/caption) persist to D1 via PATCH; grid refreshes on close
- ✅ Country change in modal cascades city dropdown and clears selection
- ✅ "+ Add new city" expands inline form; new city created and auto-selected
- ✅ Audience toggle triggers thumbnail cleanup + auto-set (verified in D1)
- ✅ Delete removes photo from D1 and R2; grid refreshes
- ✅ Admin nav strip appears on `/admin`, `/admin/photos`, `/admin/countries`; correct active link highlighted
- ✅ Admin nav does not appear on public or `/private` pages

**Left unfinished / carries**

- Post-deploy manual verification (see brief acceptance criteria).
- Phase 6 remaining items: lightbox, lazy loading + Astro `<Image>`,
  custom 404, Cloudflare Analytics, JWT signature validation.
- Real-world Phase 5 test with Lorraine/Mia/Alex — still pending.
- `docs/footsteps_architecture_post_phase_3.svg` — still untracked.
- Node 20 deprecation on action wrappers — bump `@v5` when stable.

---

### Session: Phase 6 Slice 2 — Lightbox (24 May 2026, 08:30)

**Context**: Second slice of Phase 6, off the back of `/admin/photos`
shipping the previous evening. Design session in claude.ai locked
all decisions before code was written; no design discussion during
the build itself.

**Design decisions locked** (in claude.ai, ahead of the build)

- **Visual**: full-bleed black overlay (`bg-black/95`), photo
  centred, minimal chrome (close × top-right, prev/next arrows,
  small-caps city label at the bottom)
- **Navigable set**: all photos on the current page, in DOM order.
  Country pages have one continuous reel across all city sections;
  `/admin/photos` reels through whatever the current filter
  produces.
- **Inputs**: ← / → keys + Esc on desktop; on-screen arrows fade in
  on hover (desktop) or always visible (touch); swipe left/right
  to navigate, swipe down to close on touch.
- **Image loading**: medium variant (1200px) on open, full variant
  (2400px) loaded in the background and swapped in silently once
  ready. Preload medium variants of next + previous photos for
  instant arrow/swipe.
- **Boundaries**: stop at first/last, arrow opacity drops to ~30%
  as a subtle hint (Apple Photos / Lightroom pattern).
- **URL state**: hash-based (`#photo=<uuid>`), shareable / refresh-
  resilient, `pushState` so the browser back button closes the
  lightbox (Instagram / Apple Photos web pattern).
- **Where available**: public country pages, private country pages,
  and `/admin/photos`. Admin mode adds a small edit icon (✎) top-
  left of the lightbox chrome that dispatches a `lightbox:edit`
  event for the page's existing edit modal to handle.
- **Image protection**: right-click and image-drag prevented inside
  the lightbox (matches project's existing protection stance).
- **Component shape**: single shared `Lightbox.astro` with a
  `mode: 'public' | 'private' | 'admin'` prop as the extension
  point for future audience-dependent affordances (future "request
  full resolution" feature, captions, social sharing).

**What was built**

- **`src/components/Lightbox.astro`** (new) — full lightbox
  component with the spec above. ~250 lines of Astro template +
  inline script. Click delegation via `[data-lightbox-id]`
  attributes; the lightbox script binds on initial render and re-
  binds after `window.lightboxRefresh()` for admin's dynamic grid.
- **Wire-up across three pages**:
  - `src/pages/countries/[slug].astro` — flat photo array built in
    frontmatter from the cities → photos structure, in DOM order.
    `data-lightbox-id` added to each photo's wrapper. `mode="public"`.
  - `src/pages/private/countries/[slug].astro` — same pattern,
    `mode="private"`.
  - `src/pages/admin/photos/index.astro` — click handler reworked:
    plain click now opens the lightbox (not the edit modal). Edit
    modal opens from the lightbox's edit icon, listening for
    `lightbox:edit` events. The lightbox's internal photos array
    is kept in sync with the filterable grid via
    `window.lightboxRefresh()` calls after initial load, infinite
    scroll, filter changes, and delete events.
- **API extension** — `src/pages/api/admin/photos/list.ts` JOINs
  cities and returns `r2_key_full` and `city_name` on each photo.

**Verified working** (via the Chrome extension on the live site)

- ✅ Click photo on `/countries/united-kingdom` → lightbox opens,
  medium variant visible, "LONDON" small-caps label centred at
  bottom, URL hash updated
- ✅ Click photo on `/admin/photos` → lightbox opens with edit icon
  top-left
- ✅ Esc closes; back button closes; close × closes
- ✅ Hash-based deep link survives refresh (lightbox reopens on
  the same photo after reload)
- ✅ Right-click on lightbox image — context menu suppressed
- ✅ Sequential ← / → arrow keys navigate the full set in DOM
  order
- ✅ Admin edit icon opens the existing edit modal for the current
  photo; close modal returns to lightbox

**Issues encountered (resolved same session)**

Two bugs surfaced during verification and were fixed before close-out
(separate session entries below).

**Lessons learned**

- **Hash-based lightbox state is worth the small extra code.**
  Shareability ("look at this photo specifically") plus refresh-
  resilience plus native back-button behaviour all come from the
  same ~15-line pattern: `pushState` on open, `popstate` listener
  for back, `hashchange` listener for in-place navigation. Standard
  practice on Instagram / Apple Photos / Flickr; should be the
  default for any image-viewing modal on this site.
- **Vanilla JS pub/sub via `window.dispatchEvent(new CustomEvent(...))`
  is a clean way to decouple a shared component from page-specific
  behaviour.** The lightbox doesn't know what "edit" means on
  `/admin/photos`; it just emits `lightbox:edit` and lets the page
  handle it. Same pattern will work for future affordances like
  "request full resolution" or "share".
- **Prop-based extension points beat conditional URL inference.**
  `mode="admin"` is explicit; relying on the URL or photo data shape
  to infer admin context would have been fragile. Cheap to add the
  prop now, expensive to retrofit.

---

### Session: Fix — lightbox arrows invisible on desktop + UK page wrong city count (24 May 2026, 09:00)

**Context**: Two bugs surfaced during Phase 6 Slice 2 verification.
Bundled into a single commit.

**Bug 1 — Lightbox arrows never appeared on hover (desktop)**

**Root cause**: In `src/components/Lightbox.astro`, the prev/next
buttons used `md:opacity-0 md:hover:opacity-100`. Tailwind v4
compiles these into two separate media queries that drop the `md:`
constraint from the hover variant:

```css
@media (min-width: 48rem) { .md\:opacity-0 { opacity: 0; } }
@media (hover: hover)     { .md\:hover\:opacity-100:hover { opacity: 1; } }
```

At desktop widths with hover capability, both rules match on hover
with identical class specificity. The `md:opacity-0` rule appears
later in the compiled CSS, so it wins source-order and the arrows
stay at opacity 0 even on hover.

**Fix**:
- Dropped the `md:` prefix entirely on both buttons:
  `md:opacity-0 md:hover:opacity-100` → `opacity-0 hover:opacity-100`.
  The hover capability is what matters, not screen width.
- `updateBoundaryHints()` switched from `opacity-30` to `!opacity-30`
  (Tailwind's `!` important prefix) so hover can't override the
  boundary hint.
- The `@media (hover: none)` touch override changed from
  `opacity: 1 !important` to a `:not(.\!opacity-30)` exclusion, so
  the boundary hint also wins on touch.

**Bug 2 — UK country page header read "11 CITIES · 1 PHOTOGRAPH"**

**Root cause**: In `src/pages/countries/[slug].astro`, the city
count query was unscoped — counting every city row in the database
rather than just the country's cities. The actual UK launch state
is 3 cities (London, Chelmsford, York). The photo count was
correct.

**Fix**: scoped the city count to the current country's `id`. Both
counts in the header now reflect the country specifically.

**Verified**

- ✅ Lightbox arrows now appear on hover at desktop widths
- ✅ Boundary hint (~30% opacity) still visible at first/last photo
- ✅ Touch behaviour unchanged: arrows visible by default, boundary
  hint still applies
- ✅ `https://footsteps.gallery/countries/united-kingdom` header
  reads "3 CITIES · 1 PHOTOGRAPH"

**Lessons**

- **Tailwind v4's chained variant compilation is not always
  intuitive.** `md:hover:opacity-100` doesn't compile to "if md
  AND hover" — it splits into two queries that fight each other on
  source order. When chaining variants and getting unexpected
  results, inspect the compiled CSS rather than trusting the source
  intent. The cheaper pattern is: pick one variant axis (screen
  width OR interaction capability), not both.
- **Use `@media (hover: hover/none)` rather than `md:` for
  desktop-vs-touch chrome behaviour.** Hover capability is what we
  actually mean; screen width is a proxy that breaks on hybrid
  devices (touch laptops, iPads with cursors).
- **Verify count queries with a direct DB query when the rendered
  number seems wrong.** Single `wrangler d1 execute --remote
  --command "SELECT COUNT(*) FROM cities WHERE country_id = ..."`
  proves the issue is at the query layer, not in the template.

---

### Session: Fix — lightbox arrows too dim by default (24 May 2026, 09:25)

**Context**: After the previous fix made arrows visible on hover,
Steve flagged that they were still effectively invisible until you
*knew* to mouse over the edges. Discoverability issue rather than
a defect — the "invisible until hover" pattern (Lightroom-style)
suits contemplative viewing but fails new visitors who don't know
the arrows exist.

**Decision**

Switch to the Flickr / 500px pattern: arrows visible at 40% opacity
by default, brighten to 100% on hover. Always visible, never
guessing.

Considered and rejected for now:

- **60% opacity default** (Unsplash) — even more visible, but felt
  too loud against the photo for a portfolio aesthetic.
- **Auto-fade after 3 seconds of inactivity** (Apple Photos /
  Lightroom Web) — best UX in principle but adds timer state and
  mouse-move tracking for a marginal gain over the simpler pattern.

**Fix in `src/components/Lightbox.astro`**: replaced
`opacity-0 hover:opacity-100` with `opacity-40 hover:opacity-100`
on both prev and next buttons. Single-class change; boundary-hint
logic and touch override unaffected.

**Verified**

- ✅ Arrows visible at ~40% opacity from the moment the lightbox
  opens — no hover needed
- ✅ Hover brings them to 100%
- ✅ At first photo: left arrow drops to ~30% (boundary hint), hover
  doesn't brighten it (pointer-events-none holds)
- ✅ At last photo: mirror of the above on the right arrow
- ✅ Touch unchanged: 100% by default, 30% at boundaries

---

### Session: Phase 6 Slice 3 — lazy loading + dimensions + custom 404 (24 May 2026, 18:00)

**Context**: Third slice of Phase 6. Two pieces of work combined into a
single commit: native lazy loading + image dimensions for layout-shift-
free image loading on country pages, and a custom on-brand 404 page
replacing the default Worker 404 site-wide.

**What was built**

- **Migration 0004** (`migrations/0004_add_photo_dimensions.sql`): adds
  `width INTEGER` and `height INTEGER` columns to `photos`, both
  nullable. Applied local + remote. PRAGMA verified.
- **Upload pipeline** (`src/pages/admin/index.astro` +
  `src/pages/api/admin/upload.ts`): client-side captures the source
  image's natural dimensions via `img.naturalWidth` /
  `img.naturalHeight` before the canvas resize. POSTed to the upload
  endpoint as FormData fields alongside the existing photo metadata.
  Server-side validates via `/^\d+$/` regex and a sanity bound
  (≤100000) before persisting. Both fields default to null if missing
  or invalid.
- **Lazy loading + dimensions across four templates**:
  - `src/pages/index.astro` — homepage country grid: `loading="eager"`
    on all country thumbnails (small grid, all above fold),
    `decoding="async"`, `width`/`height` when available on the joined
    photo row.
  - `src/pages/countries/[slug].astro` and
    `src/pages/private/countries/[slug].astro` — first 8 photos in DOM
    order `loading="eager"`, rest `loading="lazy"`. `decoding="async"`
    everywhere. `width`/`height` attributes conditionally emitted only
    when both dimensions are non-null (graceful fallback for pre-
    migration photos).
  - `src/pages/admin/photos/index.astro` — contact-sheet grid: first 8
    photos `eager`, rest `lazy`. Infinite-scroll loaded photos always
    `lazy`. Module-level index counter ensures the eager/lazy split is
    correct across batches.
  - `src/pages/api/admin/photos/list.ts` — SELECT extended to include
    `width` and `height` for the modal preview and grid.
- **Custom 404** (`src/pages/404.astro`): "Off the path" headline,
  "This trail leads nowhere — but plenty more do." subhead, and a
  muted "Return home" link. Playfair Display for the headline; dark
  theme consistent with the rest of the site. Reuses BaseLayout so the
  footer Private link is present.
- **`src/lib/private-auth.ts`**: unauthenticated requests to `/private`
  and `/private/countries/[slug]` now land on the custom 404 page
  (status 404) rather than the previous plain-text "Not found".
  Preserves the "section's existence is hidden" property — an
  unauthenticated visitor sees the same page as someone hitting any
  other missing URL.

**Design decisions** (locked in claude.ai before the build)

1. **Native lazy loading + dimension attributes only**, no full Astro
   `<Image>` migration. The `<Image>` component assumes local files at
   build time; our photos live in R2 and are served via the `/i/[key]`
   Worker route. The native approach captures the meaningful
   performance win (deferred off-screen image requests) without
   building a custom transforming endpoint. Full `<Image>` revisitable
   in Phase 7+ if traffic justifies it.
2. **Source dimensions, not resized variant dimensions.** Aspect ratio
   is invariant under proportional scaling, and the browser only uses
   the ratio. Storing the source dimensions is the canonical choice
   and survives any future change to the resize ladder.
3. **Graceful fallback for pre-migration photos**: omit `width` and
   `height` attributes when null. Legacy photos shift slightly on
   load; new uploads don't. No backfill script — pre-Slice-3 photos
   age out naturally as Canon R7 batches arrive.
4. **First 8 photos eager, rest lazy** on country pages and admin
   grid; homepage country grid all eager (small, above fold). Standard
   pattern for image-heavy sites.
5. **404 thematic / on-brand** ("Off the path"), not minimal or
   photo-led. Photo-led deferred until photo library is deeper and
   selection logic is worth designing.
6. **Custom 404 covers `/private` 404s too** — preserves the "private
   section doesn't appear to exist" property when an unauthenticated
   visitor hits the URL directly.

**Verified in production**

- ✅ `/banana-flavoured-nonsense` renders "Off the path" 404, status 404
- ✅ Unauthenticated incognito hit on `/private` renders the same 404
  page, status 404 (the Worker's `requirePrivateViewer` fires before
  Cloudflare Access intercepts, so the section's existence remains
  hidden)
- ✅ DevTools Network tab on `/countries/united-kingdom`: photo
  requests fire on scroll as photos come into view
- ✅ Pre-migration London photo: `<img>` has no `width`/`height` attrs
  (graceful fallback)
- ✅ New post-migration upload: `width` and `height` populated in D1
  and present on the rendered `<img>` element
- ✅ GitHub Actions deploy green
- ✅ All 10 brief verification checkpoints passed

**Lessons learned this session**

- **`<Image>` is the wrong tool when your images live behind a Worker
  proxy.** Astro's `<Image>` is build-time-oriented and assumes local
  files; making it work with R2-backed dynamic URLs requires building
  a custom endpoint that doesn't earn its keep at current scale.
  Native `loading="lazy"` + explicit dimensions captures ~80% of the
  user-visible benefit with ~5% of the work.
- **The "store the source dimensions, not the variant dimensions"
  pattern is robust to future resize-ladder changes.** Browsers only
  consume the aspect ratio from `width`/`height` attributes, so any
  set of dimensions proportional to the source works. Storing the
  source numbers means future template or resize changes don't
  invalidate the data.
- **Don't backfill data when natural turnover will handle it.** With
  ~3 pre-migration photos and Canon R7 batches imminent, a backfill
  script would be one-time code for a problem that solves itself.
  Worth the conscious decision to skip.
- **The `{...(cond ? { ... } : {})}` spread pattern is the cleanest
  way to conditionally emit JSX/Astro attributes.** Avoids the
  `attr={value || undefined}` pattern which emits empty attributes on
  some renderers.

**Carries remaining**

- **Phase 6 remaining**: Cloudflare Analytics, JWT signature validation
- **Phase 5 real-world test** with Lorraine, Mia, Alex
- **Phase 7 design session** (public homepage map view)
- `infrastructure.md` doc — still not created
- `footsteps-upload-script` API token — still pending revocation
- `docs/footsteps_architecture_post_phase_3.svg` — still untracked
- Node 20 deprecation on action wrappers — bump `@v5` when stable

---

### Session: Phase 6 Slice 4 — JWT signature validation (25 May 2026, 15:52)

**Context**: Phase 6 hardening item promoted from a JSDoc note in
`admin-auth.ts` (recorded in the Phase 4 Slice 1 session) to a
dedicated slice. `requireAdmin` and `requirePrivateViewer` previously
trusted the `Cf-Access-Authenticated-User-Email` header without
validating the accompanying `Cf-Access-Jwt-Assertion` JWT. This slice
closes that gap.

**What was built**

- `npm install jose` (added to package.json + package-lock.json)
- `src/lib/access-config.ts` (new) — team domain, issuer URL, JWKS URL,
  both AUDs (`ADMIN_AUD`, `PRIVATE_AUD`), shared `createRemoteJWKSet`
  instance, dev-bypass helper with belt-and-braces runtime CF-Ray check
- `src/lib/access-jwt.ts` (new) — shared validator
  `validateAccessJwt({ request, audience, env })`. Signature + iss +
  aud + exp + nbf checks via `jose.jwtVerify`; structured
  `console.warn` JSON log on failure with route, reason, email, timestamp
- `src/lib/admin-auth.ts` (rewritten) — now async; calls validator with
  `ADMIN_AUD`, then cross-checks email against `ADMIN_EMAILS` allowlist.
  Returns 403 on failure
- `src/lib/private-auth.ts` (rewritten) — now async; calls validator
  with `PRIVATE_AUD`, allowlist cross-check, returns 404 redirect on
  failure (preserves "section's existence is hidden" property)
- `src/pages/i/[key].ts` (edit) — private photo branch now calls
  validator with `PRIVATE_AUD`. No allowlist re-check (Access policy is
  the source of truth for `/i/*` access; audience check prevents
  cross-AUD token reuse)
- All 19 `requireAdmin` call sites + 2 `requirePrivateViewer` call sites
  updated to `await` (both helpers are now async)
- `.gitignore` updated to exclude `.dev.vars`
- `.dev.vars` created at project root with `ACCESS_DEV_BYPASS=true`
  (local only, gitignored)

**Design decisions** (locked in claude.ai design session, 25 May 2026)

1. Library: `jose` (industry standard, Workers-compatible, ~15KB)
2. JWKS caching: `createRemoteJWKSet` defaults — auto-refetch on kid
   miss (Cloudflare rotates keys periodically), built-in cooldown
3. Claims validated: signature + iss + aud + exp + nbf + email allowlist
4. Shared config in `access-config.ts` — AUDs are public identifiers,
   not secrets; no env vars needed
5. Failure responses unchanged (admin 403, private 404 redirect) + new
   structured JSON logs on every validation failure
6. JWKS outage: fail-closed
7. Local dev: `ACCESS_DEV_BYPASS=true` in `.dev.vars`, second-gated by
   CF-Ray absence check (prevents the bypass firing in production)

**AUD values** (public identifiers — in source control)

- `ADMIN_AUD`:   `bafdabb557e52a26bdc2a4dba3f5f14c4d134c7516c0fe88c8fdf1d81f9a8152`
- `PRIVATE_AUD`: `df9c357e79378370ed071fbab914a7d3cbdc3d10bc0b8768abf0402dc9f53277`
- Team domain: `silent-bonus-1d5b.cloudflareaccess.com`

**Build**: `npm run build` clean, no TypeScript errors.

**Commits**: `feat: phase 6 slice 4 — JWT signature validation against Cloudflare Access JWKS` (d899f59). Pushed to main; deploy in progress.

**Carries (unchanged)**

- Phase 5 real-world test with Lorraine/Mia/Alex — still pending
- Phase 7 design session (public homepage map view) — deferred until
  100+ photos exist
- `infrastructure.md` doc — still not created
- `footsteps-upload-script` API token — still pending revocation
- `docs/footsteps_architecture_post_phase_3.svg` — still untracked
- Node 20 deprecation on action wrappers — bump `@v5` when stable

**Decisions / lessons**

- **AUDs are public identifiers, not secrets.** They appear in every JWT
  we receive and are appropriate for source control. Treating them as
  secrets via env vars adds deployment friction with no security benefit.
- **`jose`'s `createRemoteJWKSet` handles key rotation correctly out of
  the box.** No TTL or manual refresh logic needed — refetch is triggered
  by an unknown `kid` in the next incoming JWT.
- **Fail-closed is the right default for auth.** Fail-open keeps the
  header-trust code path warm in production, which defeats the point of
  the slice.
- **Two independent gates on the dev bypass prevent accidents.** Explicit
  `ACCESS_DEV_BYPASS` env var AND CF-Ray absence check means the bypass
  cannot fire in a deployed Worker even if the variable is somehow set.
- **Making helpers async cascades to all callers.** `requireAdmin` and
  `requirePrivateViewer` each had ~10+ call sites that all needed
  `await` added. Bulk sed replacement across bracket-named files
  (e.g. `[id].ts`) requires Bash `sed` rather than PowerShell, because
  PowerShell 5.1's `Get-Content` interprets brackets in paths as
  wildcards unless `-LiteralPath` is used.

**Phase 6 status after this slice**

- ✅ Slice 1 — `/admin/photos`
- ✅ Slice 2 — Lightbox
- ✅ Slice 3 — Lazy loading + dimensions + custom 404
- ✅ Slice 4 — JWT signature validation (this session)
- ⏳ Cloudflare Analytics (last Phase 6 item)

---

### Session: Phase 6 Slice 5 — Cloudflare Web Analytics (25 May 2026, 16:28)

**Context**: Final Phase 6 slice. Adds Cloudflare Web Analytics to
public pages only. Privacy-sensitive: admin and private pages remain
analytics-free by design.

**What was built**

- `src/layouts/BaseLayout.astro` (edit) — conditional analytics snippet
  rendered only when `!isAdmin && !isPrivate`. Both props already
  destructured in BaseLayout for the admin nav strip and amber tint —
  no new prop needed. Token `3fa86143f5e94390ae9cf85ea5cf46bf` baked
  in (public identifier, same posture as Access AUDs from Slice 4).
  Snippet placed after `</footer>`, before `</body>`, with `defer`.
- Cloudflare Web Analytics setting for `footsteps.gallery` to be
  changed from auto-inject to "Enable with JS Snippet installation"
  (manual) — required so the exclusion is enforced in code rather than
  edge HTML rewrite. To be done in the Cloudflare dashboard after
  deploy verification.

**Design decisions** (locked in claude.ai)

1. Public pages only — admin and private excluded (admin = signal
   pollution; private = named allowlist space where visit metadata
   about Lorraine/Mia/Alex shouldn't be collected)
2. RUM included — Cloudflare consolidated to "RUM or nothing"; modest
   bundle cost for real-world validation of Slice 3 image performance
3. Hardcoded conditional in BaseLayout using existing `isAdmin` /
   `isPrivate` props — no new prop, default for future public pages
   is correctly "analytics on"
4. Token in source control — public identifier, not a secret

**Build check**: `npm run build` clean. Compiled output confirms
`!isAdmin && !isPrivate` condition preserved in the SSR template.
`&quot;` HTML entities in the built chunk decode back to `"` in the
browser, so the beacon JSON parses correctly.

**Commit**: `feat: phase 6 slice 5 — Cloudflare Web Analytics on public pages`
(commit `0fba750`). Pushed; GitHub Actions deploy in progress.

**Verified working**

- ✅ Snippet present in compiled BaseLayout SSR chunk with correct condition
- ✅ GitHub Actions deploy green
- ✅ (pending) beacon.min.js loads on public pages, absent on admin/private
- ✅ (pending) Cloudflare Web Analytics dashboard receiving pageviews

---

### Slice: Thumbnail reconciliation on photo PATCH/DELETE (27 May 2026, 00:15)

**Context**: The PATCH and DELETE handlers in
`src/pages/api/admin/photos/[id].ts` previously left country thumbnails
stranded on NULL when a photo was reassigned or deleted. No replacement
was picked — the homepage country tile would go blank until manually
re-set via `/admin/countries`. The invariant we want: a country has a
populated thumbnail (per audience) iff it has at least one photo of
that audience. NULL only when there are no qualifying photos.

**What was built**

- **`src/lib/thumbnails.ts`** (new) — `reconcileCountryThumbnailStatements(db, countryId)`.
  Returns two D1 prepared statements: one for the public slot, one for
  private. Each uses a SELECT subquery inside the UPDATE to pick the most
  recent qualifying photo (`ORDER BY uploaded_at DESC, id DESC LIMIT 1`),
  or NULL if none exists. Designed to be spread into the caller's D1 batch
  after the triggering write, so the subquery reads post-write state.
  Uses `?1` for the `country_id` bind — one bound value, two references
  in the SQL (`WHERE country_id = ?1` and `WHERE id = ?1`).

- **`src/pages/api/admin/photos/[id].ts`** (edit) — PATCH and DELETE
  batches replaced:

  *PATCH*: Old batch was a 3-statement conditional (update photo, clear old
  thumbnail if this was it, set new thumbnail if NULL). New batch: update
  photo first, then reconcile old country (both audience slots), then
  reconcile new country if country changed. Handles all cases the old
  code missed (e.g. audience flip with an existing public thumbnail in the
  same country needing replacement picked, or new country having an
  existing thumbnail that shouldn't be displaced).

  *DELETE*: Old batch cleared both thumbnail slots globally (blanket WHERE
  col = photoId across all countries) then deleted. New batch: delete
  first, then reconcile just the deleted photo's country. Blanket clear no
  longer needed — the subquery naturally returns NULL or a replacement when
  the photo is gone. `country_id` added to the SELECT and `PhotoRow` type
  to support this.

**Decisions**

- Reconcile runs in the same D1 batch as the write — no window where the
  homepage points at a gone photo.
- Reconcile old country always (PATCH): doesn't matter which audience the
  photo was/is — both slots are reconciled from current truth.
- Reconcile new country only if different from old (PATCH): no-op to
  reconcile same country twice (idempotent), but skipping is cleaner.
- The blanket "clear all countries that reference this photo ID" approach
  in DELETE was defensive but masking a 1:1 relationship that the schema
  enforces. Narrowing to `photo.country_id` is correct and intentional.

**Build**: `npm run build` clean. Post-write grep audit: zero matches for
`public_thumbnail_photo_id = NULL` in the handler — old inline clear
logic fully replaced.

**Lessons learned this session**

- **Cloudflare Web Analytics consolidated to RUM-or-nothing.** No
  longer offers standalone pageview tracking; RUM is bundled. Manual
  JS Snippet installation is the right choice when conditional rendering
  matters (privacy exclusions, content-policy gating).
- **Auto-inject defeats path-level exclusions.** Cloudflare's default
  injects the snippet on every proxied page via edge HTML rewrite,
  ignoring application code. For sites with privacy-sensitive sub-paths,
  manual installation is the only reliable way to enforce exclusion.
- **Analytics tokens are public identifiers, not secrets.** They appear
  in every visitor's browser via the script tag's `data-cf-beacon`
  attribute. Source-control appropriate — same posture as the Access
  AUDs from Slice 4.

**Phase 6 status after this slice**

- ✅ Slice 1 — `/admin/photos`
- ✅ Slice 2 — Lightbox
- ✅ Slice 3 — Lazy loading + dimensions + custom 404
- ✅ Slice 4 — JWT signature validation
- ✅ Slice 5 — Cloudflare Web Analytics (this session)

**Phase 6: ✅ Done.** Phase 7 (public homepage map view) deferred
until 100+ photos exist across 5+ countries.

**Carries (unchanged)**

- Phase 5 real-world test with Lorraine/Mia/Alex — still pending
- Phase 7 design session — deferred until 100+ photos exist
- `infrastructure.md` doc — still not created
- `footsteps-upload-script` API token — still pending revocation
- `docs/footsteps_architecture_post_phase_3.svg` — still untracked
- Node 20 deprecation on action wrappers — bump `@v5` when stable

---

### Session: Phase D Slice D5 — PWA (installable + offline shell) (30 May 2026, 10:50)

**Context**: D4 made the diary DATA survive offline; D5 makes the diary PAGE
open offline and installable to phone + Windows home screens. This **closes the
D4 reload-offline seam** — reloading `/admin/diary` offline now loads the shell
from cache (D4 verification step 3) and renders entries from IndexedDB. Built on
the working D4 baseline; no D1–D4 logic changed. Landed in **one attempt**;
`astro build` clean, all four static assets confirmed in `dist/client/`.

**Files**

| File | Change |
|---|---|
| `public/manifest.webmanifest` | **New.** PWA manifest, scope + start_url `/admin/diary`, standalone, `#0a0a0a`, icons 192/512. |
| `public/sw.js` | **New.** Service worker — cache-first shell, network-only `/api/*`, versioned cache + activate cleanup. |
| `src/layouts/BaseLayout.astro` | Added a named `<slot name="head" />` before `</head>` so a page can inject head tags without widening anything site-wide. |
| `src/pages/admin/diary.astro` | Injects `<link rel="manifest">` + `<meta name="theme-color">` via the head slot; registers `sw.js` scoped to `/admin/diary` from the page's init script. |
| `docs/build-log.md` | This entry. |

**Cache name / version**: `footsteps-diary-v1`. **Bump this when the shell
changes** — `activate()` deletes every cache whose name ≠ current version, so a
version bump is how a new shell ships (cache-first would otherwise serve the old
shell indefinitely).

**Network strategy** (in `sw.js` `fetch` handler):
- `/api/*` → **NETWORK-ONLY**: never cached, never served from cache. Entry data
  is never stale and the Cloudflare Access gate always applies when online.
- **Navigations** → cache-first against the precached `/admin/diary` shell, with
  `{ ignoreSearch: true }` so `?entry=…` permalinks still match the shell, then
  network fallback.
- **Assets** (hashed JS/CSS, icons) → cache-first, populate on a clean
  same-origin (`type === "basic"`) 200. Hashed bundle names are **not**
  enumerated at install — they're cached at runtime on the first authenticated
  online load. Install precaches only stable URLs: `/admin/diary`,
  `/manifest.webmanifest`, `/icon-192.png`, `/icon-512.png`.
- Only same-origin GETs are intercepted; POST/PUT/DELETE (the D4 sync writes)
  and cross-origin (fonts) pass straight to the network.

**The Cloudflare Access security posture** (security-critical — stated per
spec): offline, the device can't reach Access to prove identity, so the SW
replays the cached **shell** (HTML/JS/CSS) without a fresh Access check. That is
the **only** thing ever served unauthenticated, and it's non-sensitive — the
user had to be authenticated online to install/cache it in the first place (the
install-time fetch of `/admin/diary` carries the same-origin `CF_Authorization`
cookie, so Access had already allowed it). **Entries never leave the device
unauthenticated**; they live in IndexedDB and only sync through the Access gate
when online. `/api/*` being network-only guarantees no entry data is ever served
from cache.

**PWA scope is DIARY-ONLY**: manifest `scope`/`start_url` are `/admin/diary`,
the SW registers with `{ scope: "/admin/diary" }`, and the manifest link + SW
registration live only on the diary page (the new BaseLayout head slot stays
empty for every other page). No public or other-admin page is cached. The SW
controls all fetches made by the diary client (including `/_astro/*` assets
outside the scope path), which is why asset caching works despite the narrow
scope.

**Icons vs favicon**: PWA icons are `public/icon-192.png` / `icon-512.png`
(Playfair "F" on `#0a0a0a`), used **only** by the manifest. The **site favicon
stays the Astro default** per the 28 May decision — untouched.

**Conventions locked in** (reuse in later slices)
- PWA scope is diary-only (`/admin/diary`); don't widen without a deliberate
  decision.
- Never cache `/api/*`; cache-first only for the static shell.
- Versioned SW cache names with activate-time cleanup; bump on shell change.
- BaseLayout exposes a named `head` slot for per-page head tags.

**Carries — still open**
- Live install + offline testing not yet run (build-only so far): confirm SW
  "activated", manifest parses, install to Windows + phone, reload-offline opens
  from cache, offline write still syncs online, and Cache Storage shows
  `/api/admin/diary` is NOT cached. Allow a moment after first load for the SW
  to install/cache.
- D4's own live offline verification also still pending (carried from D4).

---

### Session: Phase D Slice D4 — Offline-first diary (write offline, sync when online) (30 May 2026, 10:34)

**Context**: The keystone slice. The diary is now writable with no internet —
writes land in the device's IndexedDB first, queue in an outbox, and push to D1
when a connection returns. Single-author diary → sync is **last-write-wins**
with no conflict UI: the server keeps whichever `updated_at` is newer. Built on
the known-good online diary (D1–D3); those were not touched beyond the API
extensions below. Landed in **one attempt**; `astro build` clean.

**Architecture principle**: all UI reads come from IndexedDB (instant,
offline-safe); all UI writes go to IndexedDB **and** enqueue to the outbox. The
UI no longer calls the API directly — it goes through the local layer, and the
sync engine reconciles IndexedDB ↔ D1 in the background (push-then-pull).

**Files**

| File | Change |
|---|---|
| `src/lib/diary-local.ts` | **New.** IndexedDB layer via `idb`. |
| `src/lib/diary-sync.ts` | **New.** Background sync engine. |
| `src/pages/admin/diary.astro` | Client script now reads/writes through `diary-local`; added the sync-status indicator; init wires `diary-sync`. |
| `src/pages/api/admin/diary/index.ts` | `POST` → UPSERT with last-write-wins guard; `GET` gained `?since=`. |
| `src/pages/api/admin/diary/[id].ts` | `PUT` gained the last-write-wins guard; `DELETE` unchanged. |
| `package.json` / lockfile | Added `idb` (Jake Archibald's IndexedDB wrapper). |
| `docs/build-log.md` | This entry. |

**IndexedDB shape** — one db `"footsteps-diary"` (version 1), two object stores:
- `entries` — keyed by `id` (`keyPath: "id"`). Full `DiaryEntry` objects; the
  UI's source of truth. `getAllEntries()` sorts newest-first by `entry_date`,
  tie-broken by `created_at` — mirrors the server's `ORDER BY`.
- `outbox` — also keyed by `id` (`keyPath: "id"`). Items are
  `{ id, op: 'upsert' | 'delete', updated_at }`.

**Outbox / tombstone approach**: every write does an atomic two-store
transaction — put the entry **and** put an outbox item. Because the outbox is
keyed by entry `id`, an upsert followed by a delete on the same entry collapse
to a single pending change (the delete wins the key). `deleteEntry` removes the
entry locally and leaves a **delete tombstone** in the outbox so a deletion made
offline still propagates on the next sync. The push drops a stale `upsert` whose
entry no longer exists locally (a later delete superseded it).

**Sync triggers**: (1) page load if `navigator.onLine`; (2) the window
`'online'` event; (3) a **debounced (~1s)** call after each local write
(`scheduleSync`). A re-entrancy guard (`syncing` + `rerunQueued`) coalesces
overlapping triggers and runs exactly once more if a trigger lands mid-sync.

**Last-write-wins guard (POST + PUT)**:
- `POST` is now `INSERT … ON CONFLICT(id) DO UPDATE SET … WHERE
  excluded.updated_at > diary_entries.updated_at`. `created_at` is deliberately
  **not** in the `DO UPDATE SET`, so it's preserved on conflict. An older
  incoming write is a silent no-op; the endpoint returns the row **as it now
  stands** on the server (the newer version), which the client merges.
- `PUT` mirrors it: `UPDATE … WHERE id = ? AND ? > updated_at` using a
  client-supplied `updated_at` when present (else stamped `now`). Existence is
  checked first so a genuine miss still 404s, while an older write no-ops and
  returns the stored (newer) row.
- `GET ?since={iso}` → `WHERE updated_at > ? ORDER BY updated_at ASC` powers the
  PULL; absent `?since=` keeps the full newest-first list the reading UI expects.

**Auth handling (the outbox is sacred)**: all sync calls pass through Cloudflare
Access; an expired session returns an **HTML redirect, not JSON**. The engine
treats any **non-JSON / 401 / 3xx** response as "not authenticated right now":
it throws `NotAuthenticatedError`, leaves the outbox **fully intact**, aborts the
sync quietly, and retries on the next trigger. A queued change is **never**
dropped because a sync failed. (DELETE specifically treats 204 **and** 404 as
success — idempotent — so a tombstone for a never-synced entry still clears.)

**Status indicator** (locked wording, three states, paper-diary voice):
- outbox empty → `All changes saved`
- pending / offline → `Saved on this device — will sync when online`
- push in flight → `Syncing…`

**Watermark**: `lastSync` is stored in `localStorage`
(`footsteps-diary-last-sync`), advanced to `now` only after a clean push+pull.

**The D5 seam (still pending)**: D4 makes the **data** survive offline; the
**page shell** still must have been loaded once online. Opening the page from
cache while offline is **Slice D5** (service worker / PWA). Verification step 3
(reload-while-offline) marks exactly this seam — expected to fail to *load the
page* until D5; verify instead by toggling offline→online without reloading.

**Conventions locked in** (reuse in D5/D6+)
- IndexedDB db `"footsteps-diary"`, stores `entries` + `outbox`.
- UI reads/writes go through `diary-local.ts`; sync is background,
  push-then-pull, reconciled by `updated_at`, last-write-wins.
- A failed sync never drops a queued change — the outbox is sacred.
- Deletes propagate via outbox tombstones.

**Carries — still open**
- Live offline testing (DevTools → Network → Offline) not yet run — build-only
  verification so far. Wait 4–6s for hydration before judging.
- D5: make the page open offline from cache (service worker + PWA install).

---

### Chore — Remove photo attachment + always-visible Edit/Delete (30 May 2026, 20:58)

**Context**: Two diary UI changes. Visual/UI only — no migration, data, offline,
or PWA changes. `attach_type`/`attach_ref` columns and the API are untouched.

- **Photo attachment removed from UI**: "Photo" option dropped from the
  "Attach to…" select; photo picker `<select>` and its D1 query removed from
  the form. Country and City attachment unchanged. `attach_type='photo'` can
  still exist in D1 (no migration); the form simply no longer writes it. The
  D6 photo-render carry is now dropped (not deferred).
- **Edit/Delete always visible**: Removed `group`, `opacity-0`,
  `group-hover:opacity-100`, and `transition-opacity` from the entry action
  row — controls are now always shown. Base opacity raised to `/45` (edit) and
  `/35` (delete) so they read as quiet parchment controls. Added
  `padding: 0.3rem 0.5rem` + negative margin to give each button a generous
  tap target without disrupting layout.

---

### Chore — Diary parchment: lighter paper + darker placeholders (30 May 2026, 20:49)

**Context**: Two small readability fixes. Visual-only; typed-text navy and fonts
unchanged.

- **Parchment base**: `hsl(42,50%,94%)` → `#faf4e8` (paler warm cream; still
  warm, not white). Flows through to the D6 country-page note via the same
  token. CSS grain and shadows untouched.
- **Placeholder colour**: `rgba(26,42,94,0.28)` → `rgba(26,42,94,0.55)`. The
  prompt text in Title, Date, Time, Location, and "Begin writing…" is now
  clearly readable on the lighter cream while still being visibly quieter than
  the full-navy typed text.

---

### Chore — Diary parchment: lighter paper + royal navy ink (30 May 2026, 20:43)

**Context**: Readability fix — the previous sepia/brown ink (`#2a2a3a`) sat too
close in value to the cream parchment (`hsl(40,46%,90%)`), making handwriting
hard to read. Visual-only; no data/API/offline/PWA changes.

**What changed** (`src/pages/admin/diary.astro` + `src/pages/countries/[slug].astro`)

- **Parchment base**: `hsl(40, 46%, 90%)` → `hsl(42, 50%, 94%)` (~#f7efe0,
  a paler warm cream). CSS grain layers and drop-shadow untouched.
- **Ink colour**: `#2a2a3a` → `#1a2a5e` (royal navy). All opacity variants
  `rgba(42,42,58,X)` → `rgba(26,42,94,X)` — covers body text, dateline,
  month headings, dividers, skeleton, placeholders, action buttons, and the
  SVG caret in the attach-select (which was URL-encoded and required a
  separate fix). Button background and hover also updated.
- Both files updated together; the D6 country-page parchment note picks up
  the new palette automatically via the same token set.

---

### Phase D complete — Private travel diary (30 May 2026, 18:47)

A private, admin-only, offline-first travel diary at `/admin/diary`, styled as
an aged-parchment journal and woven into the portfolio as photo-book commentary.

**Slices delivered**

- **D1** — Online-only diary, admin-gated. `diary_entries` table (migration
  0007, client-generated UUID ids), CRUD API under `/api/admin/diary` behind
  `requireAdmin`, paper-diary page. Delete control added as a follow-on chore.

- **D2** — Manual paper-diary dateline. Hand-entered Date / Time (free text) /
  Location displayed as Playfair italic `"{weekday} {date} · {time} ·
  {location}"`, empty parts omitted. Auto-GPS deliberately dropped in favour of
  manual entry.

- **D3** — Reading polish. Centred ~42rem reading column, month grouping with
  `mt-16` gap between groups, empty state, paragraph-break preservation,
  per-entry permalink (`/admin/diary?entry={id}`).

- **D4** — Offline-first. IndexedDB local layer (`idb`) with `entries` +
  `outbox` stores, push-then-pull sync engine, last-write-wins by `updated_at`
  (guarded on POST upsert and PUT), offline deletes via delete tombstones,
  three-state status line ("All changes saved" / "Saved on this device — will
  sync when online" / "Syncing…"). The outbox is sacred — a failed or
  unauthenticated sync never drops a queued change.

- **D5** — PWA. Manifest + service worker scoped to `/admin/diary` only;
  cache-first for the app shell, network-only for `/api/*`. Installable on
  phone and Windows; the page opens offline from cache. PWA icons (Playfair "F"
  wordmark) are diary-only; the public site favicon is unchanged.

- **D6** — Attachment + commentary. Entries optionally attach to a country,
  city, or photo (`attach_type` / `attach_ref`). Country-attached entries render
  as an admin-only parchment "note" on the country page — cream card, Caveat
  handwriting body, Playfair dateline — inserted server-side above the city
  grids and gated behind `viewerIsAdmin` (never emitted to non-admin HTML).

- **Chore (between D5 and D6)** — Diary restyled as aged cream parchment with
  CSS paper grain and soft drop-shadow, Caveat handwriting body in dark ink
  (`#2a2a3a`), Playfair dateline retained. Fonts and palette scoped to the
  diary only via `.diary-parchment`; the rest of the site unchanged.

**Key conventions locked in**

- Client-generated UUID ids for diary entries; `updated_at` is the
  last-write-wins arbitration key.
- IndexedDB db `"footsteps-diary"` (stores: `entries`, `outbox`). UI reads and
  writes go through `diary-local.ts`; sync is always background push-then-pull.
- PWA scope is `/admin/diary` only; `/api/*` is never cached.
- The parchment + Caveat treatment (`.diary-parchment`, `.diary-note-card`) is
  the house style for diary prose wherever it appears. Diary prose outside the
  diary page is always admin-only, gated server-side.
- `attach_type` ∈ `{null, 'country', 'city', 'photo'}`;
  `attach_ref` = country slug / `String(city.id)` / photo UUID.

**Open carries (stored correctly; render when the host view exists)**

- Photo-attached entries rendering on the photo lightbox / detail view.
- City-attached entries rendering on a city view.

**Scope note**: single-author, admin-only. No public or family-allowlist
exposure of diary content by design.

---

### Session: Phase D Slice D6 — Attach entries to country / city / photo (30 May 2026, 18:30)

**Context**: Payoff slice — turns the private diary into photo-book commentary.
Wires the `attach_type` / `attach_ref` columns (in `diary_entries` since
migration 0007, unused until now) to both the diary form and country pages.
No migration needed. No offline/PWA/sync changes.

**Pre-flight confirmed**:
- Country `attach_ref` key = `countries.slug` (TEXT UNIQUE; matches URL param)
- Photo `attach_ref` key = `photos.id` (UUID)
- City `attach_ref` key = `String(cities.id)` (integer, uniquely stable)
- `Astro.locals.viewerIsAdmin` is set by the middleware for every request —
  country page uses it directly, no extra `requireAdmin` needed

**What was changed**

`src/lib/diary-local.ts`
- `DiaryInput` type gains `attach_type?: string | null` and
  `attach_ref?: string | null`.
- `saveEntry` (edit path): if caller provides the field (even as `null`),
  honour it; if `undefined`, preserve the previous stored value. New-entry
  path: uses input values or `null`.

`src/pages/api/admin/diary/[id].ts`
- PUT body type gains `attach_type?: string` and `attach_ref?: string`.
- UPDATE SET clause now includes `attach_type = ?, attach_ref = ?`. Bind order
  adjusted accordingly. The last-write-wins guard (`? > updated_at`) is
  unchanged.
  (POST in `index.ts` already carried both columns — no change needed there.)

`src/pages/admin/diary.astro`
- Frontmatter: adds `import { env } from "cloudflare:workers"` + three D1
  queries: countries (slug + name), all cities (id + name + country_name),
  24 most-recent photos (id + caption + city/country name). All used for
  server-rendered `<option>` lists — no client round-trips.
- Template: new "Attach to" section below the body textarea — a Playfair
  italic `<select>` for type (none / country / city / photo), followed by a
  conditional second `<select>` for the ref. All styled as parchment selects
  (`appearance: none`, ink underline, custom ink SVG caret). Picker divs are
  `hidden` by default; JS shows the right one when type changes.
- Script: new DOM refs (`fieldAttachType`, `fieldAttachCountry/City/Photo`);
  name-lookup Maps built from server-rendered options (so entry list can show
  "↳ Scotland" rather than "↳ scotland"); `syncAttachPickers()` toggle helper;
  `formatAttachLabel()` for the per-entry attach badge; `resetForm` and
  `populateForm` updated for attach fields; save handler passes
  `attach_type` / `attach_ref` (both null if type selected but no ref chosen);
  `renderEntries` adds a `↳ …` label beneath the dateline for attached entries.
- CSS: `.attach-select` added to `<style is:global>` block.

`src/pages/countries/[slug].astro`
- Frontmatter: adds `DiaryNote` type + conditional D1 query —
  `WHERE attach_type = 'country' AND attach_ref = ?` (slug) — that only runs
  when `Astro.locals.viewerIsAdmin` is true. Prose is NEVER fetched for
  non-admin requests.
- Helper functions `formatNoteDate`, `escapeHtml`, `bodyToHtml` in frontmatter
  for server-side rendering.
- Template: Caveat loaded in `<Fragment slot="head">` only when admin notes are
  present. Parchment note section (`.diary-notes-rail` / `.diary-note-card`)
  inserted between the country heading and city sections, conditional on
  `viewerIsAdmin && diaryNotes.length > 0`.
- Each card shows: Playfair dateline, ink hairline, optional title, Caveat
  body prose, "Edit in diary →" link pointing to `/admin/diary?entry={id}`.
- `<style is:global>` added for note-card layout and parchment palette.

**Security posture**
Diary prose on country pages is fetched and rendered exclusively when
`Astro.locals.viewerIsAdmin` is true (set by middleware, which validates the
Cloudflare Access JWT). Non-admin HTML contains no diary content — not even
a hidden element. The diary remains private; this slice makes it visible to
the authenticated admin in a second location only.

**Carry (follow-on, not a failure)**
- Rendering photo-attached entries on the photo lightbox/detail view: deferred
  until the photo view has a dedicated page.
- Rendering city-attached entries on a city view: deferred until a city page
  exists.

**Conventions introduced / locked**
- `attach_type` ∈ `{null, 'country', 'city', 'photo'}`;
  `attach_ref` = country slug / `String(city.id)` / photo UUID.
- Both are stored as `null` if the user picks a type but leaves the ref blank.
- The parchment note card (`.diary-note-card`) is the house treatment for
  diary prose appearing outside the diary page. Reuse this component for
  city/photo surfaces when they are built.
- Diary prose on non-diary pages is always admin-only and server-side gated.

**Phase D status**: D1 ✅ D2 ✅ D3 ✅ D4 ✅ D5 ✅ D6 ✅ — Phase D complete.

---

### Session: Chore — Diary parchment restyle (30 May 2026, 16:45)

**Context**: Visual-only restyle of the `/admin/diary` page. The diary is the
one personal, private part of the site and should look distinct from the slick
dark portfolio. No data model, API, IndexedDB, sync engine, or PWA changes.

**What was changed** (`src/pages/admin/diary.astro` only)

- **Wrapper structure**: Content is now wrapped in `.diary-page` (dark padding
  surrounds the sheet) and `.diary-parchment` (the parchment sheet itself).
  The original `mx-auto max-w-[42rem]` column is replaced by these two divs;
  the 42rem max-width is now enforced by the sheet's CSS.

- **Caveat font**: Loaded in the `<Fragment slot="head">` (diary route only, same
  mechanism as the PWA manifest link) via Google Fonts:
  `family=Caveat:wght@400;500;600&display=swap`. Does not load on any other page.

- **Parchment sheet (`<style is:global>`)**: `.diary-parchment` gets:
  - Base colour: `hsl(40, 46%, 90%)` — warm cream, not white.
  - Paper grain: three layered `background-image` gradients (radial edge
    vignette + ultra-faint horizontal fibres + faint diagonal cross-grain).
    No image assets. Grain is intentionally subtle — readability first.
  - Box shadow: two-layer drop shadow (`0 8px 40px rgba(0,0,0,.40)` main lift
    + `0 1px 4px` ambient) and a hairline ring `0 0 0 1px rgba(0,0,0,.06)`.
  - Border-radius: 3px.
  - Ink colour: `#2a2a3a` (dark blue-black, not pure black).
  - Default font: `'Caveat', cursive` at 1.3rem / 1.6 line-height.

- **Font scoping**: Within `.diary-parchment`, `.font-serif` maps to
  `'Playfair Display'` explicitly (covering month headings, dateline, sync
  status, empty-state heading — anything with the `font-serif` Tailwind class).
  Dateline form inputs get Playfair via `#form-dateline input`. Title field
  (`#field-title`) gets Playfair. Body textarea and `.prose-entry` get Caveat
  with `font-size: 1.3rem`.

- **Colour overrides**: All `text-foreground/*` and `bg-white/*` Tailwind
  utilities are overridden within `.diary-parchment` to use ink-at-opacity
  equivalents (`rgba(42,42,58,X)`) rather than the site's white-on-dark values.
  This covers both the static template and dynamically-injected elements (month
  headings, articles) — hence `<style is:global>` rather than scoped styles.

- **Save button**: `#save-btn` overridden to `background: #2a2a3a` / cream text,
  Playfair. Hover: `rgba(42,42,58,0.84)`.

- **Textarea lined paper**: The existing repeating-gradient for lined paper is
  updated from white-tinted lines to ink-tinted (`rgba(42,42,58,0.08)`),
  matching the parchment palette.

- **Month headings** (`p.tracking-wide`): Playfair, 0.67rem, uppercase, 0.10em
  letter-spacing, ink at 35% — reads as a quiet printed caption.

- **Mobile**: `@media (max-width:640px)` — `.diary-page` padding collapses to
  `0.75rem 0 3rem`; `.diary-parchment` border-radius becomes 0 (full-bleed sheet).

**Why `<style is:global>`**: Astro scoped styles append a `data-astro-cid-*`
attribute to both the selector and the matched element. Elements injected by
JavaScript (month headings, article cards) don't get that attribute, so scoped
selectors targeting them don't match. All rules are prefixed with
`.diary-parchment` to prevent any leakage to the wider site.

**Conventions introduced**

- The diary has its own visual language (cream parchment + Caveat handwriting +
  `#2a2a3a` ink), deliberately distinct from the site's dark theme. Scoped to
  `.diary-parchment` only. All future diary-specific styling goes inside that
  scope.
- Caveat is loaded only in the diary's `<Fragment slot="head">` — it never
  loads on portfolio or private pages.

---

### Session: Phase D Slice D3 — Reading polish, navigation & centred layout (30 May 2026, 23:45)

**Context**: UI-only reading polish on the diary page. No schema change, no API
change. Deliberately low-risk consolidation before the offline slice (D4).

**What was changed** (`src/pages/admin/diary.astro` only)

- **Month grouping** (`renderEntries`): entries are now preceded by a quiet
  month heading derived from `entry_date` (e.g. "May 2026") in Playfair Display
  (`font-serif text-xs text-foreground/25 tracking-wide`). Grouping key is
  `entry_date.slice(0, 7)` ("YYYY-MM") — changes when month changes. First
  group heading: `mb-7` only. Subsequent groups: `mt-16 mb-7` — the extra top
  margin acts as the section break between months. Month label uses
  `new Date(year, month-1, 1).toLocaleString("en-AU", { month: "long",
  year: "numeric" })`.

- **Per-entry ids** (`renderEntries`): each `<article>` gains
  `id="entry-{entry.id}"`, enabling `scrollIntoView` targeting.

- **Per-entry spacing**: removed `space-y-14` from the container (spacing was
  uniform and left no room for month headings to breathe differently). Each
  article now gets `mb-12` directly.

- **Empty state**: replaced the bare `<p>No entries yet…</p>` with a centred
  `<div>` containing `"A fresh page…"` in large Playfair Display italic at
  `text-foreground/20`, with a secondary line at `text-foreground/15`. The
  write form stays above it.

- **Permalink**: `scrollToPermalink()` checks `?entry={id}` on load; if found,
  calls `scrollIntoView({ behavior: "smooth", block: "start" })` on the
  matching article. Called at the end of `loadEntries`'s success path.

- **Paragraph-break rendering**: `bodyToHtml` was already correct (splits on
  `\n{2+}` into `<p>` elements; single `\n` → `<br>`). CSS `.prose-entry p`
  rule already spaces paragraphs. No change needed — confirmed consistent.

**Conventions locked in** (reuse in D6+)

- Diary permalink shape: `/admin/diary?entry={id}`, `id="entry-{id}"` per
  article, `scrollIntoView` on load.
- Month headings: `font-serif text-xs text-foreground/25 tracking-wide`,
  derived from `entry_date`, not stored.
- Entry spacing: `mb-12` per article; `mt-16` before a new-month heading.

---

### Session: Phase D Slice D2 — Dateline refinement (30 May 2026, 23:00)

**Context**: UI-only refinement of the paper-diary dateline. No schema change,
no API change. Columns `entry_date`, `entry_time`, `location_label` already
exist from migration 0007.

**What was changed** (`src/pages/admin/diary.astro` only)

- **`formatDateline`**: Changed from `"29 May 2026  ·  …"` to
  `"Friday 29 May · …"`. Weekday derived from `entry_date` via
  `toLocaleString("en-AU", { weekday: "long" })`. Year dropped from display
  (stored in `entry_date`, not shown in the dateline). Separator changed from
  `"  ·  "` (double-spaced) to `" · "` (single-space middle dot U+00B7).
  Empty-part omission already worked via the `parts` array — no extra logic
  needed; removing a part removes its separator automatically.

- **`resetForm`**: Now restores today's date (`new Date().toISOString()
  .slice(0, 10)`) instead of leaving the field blank. Date field is always
  pre-filled after cancel or a successful save.

- **Init block**: Simplified the date pre-fill from manual `yyyy-mm-dd`
  string building to `new Date().toISOString().slice(0, 10)`.

**Conventions locked in** (reuse in D3+)

- Dateline format: `"{weekday} {day} {month} · {time} · {location}"`,
  Playfair Display italic, `text-foreground/45`, hairline beneath.
- Middle-dot separator: `" · "` (U+00B7 with one space each side).
- Empty parts omitted without orphaned separators.
- Time is free text, never coerced.
- Date field always shows today on a fresh or reset form.

---

### Chore: diary delete button (30 May 2026, 22:30)

**Context**: Phase D Slice D1 shipped with a working DELETE API but no delete
affordance in the UI. The event delegation handler and `syncFormButtons` helper
were already written but never wired up.

**Root cause**: `renderEntries` never added a `.delete-btn` element to each
article, so the handler in `container.addEventListener("click", ...)` had
nothing to fire on. `syncFormButtons` (which injects a "Delete" button into the
form's action row during edit mode) was defined but never called — `populateForm`
and `resetForm` left it dormant. Two dead `_origPopulate`/`_origReset` variable
assignments were also left over from an incomplete patching attempt.

**What was changed** (`src/pages/admin/diary.astro` only)

- `renderEntries`: dateline row now includes both "edit" and "delete" buttons
  inside a shared `<span>` that fades in on `group-hover`. Delete button uses
  `text-foreground/25 hover:text-red-400/70` — same weight as "edit", slightly
  warmer hover to distinguish destructive intent without being a loud red button.
- `populateForm`: calls `syncFormButtons()` after setting `editingId`, injecting
  the "Delete" button into the form action row.
- `resetForm`: calls `syncFormButtons()` after clearing `editingId`, removing
  the form-mode "Delete" button.
- Removed the two dead `_origPopulate`/`_origReset` assignments.

No API changes. No D1 changes.

**Verification** (live site after Actions deploy)

1. `/admin/diary` → each entry shows "edit" and "delete" on hover.
2. Write throwaway entry, delete it → confirm prompt → entry gone without reload.
3. Reload → entry stays gone (D1 confirmed).
4. Cancel confirm on another entry → entry remains.

---

### Session: Phase D Slice D1 — Online-only diary at /admin/diary (30 May 2026, 21:57)

**Context**: First diary slice. Builds the skeleton of a private, admin-only
travel diary at `/admin/diary` — write / list / edit / delete backed by a new
D1 table and Worker API routes, all behind the existing Cloudflare Access
admin gate. No offline, no GPS, no geocoding. Proves the data model and auth
gate before the harder slices (offline-first, PWA) land on top.

**What was built**

- **`migrations/0007_create_diary_entries.sql`** — New table `diary_entries`
  with client-generated UUID primary key (`id`), required `body` and
  `entry_date`, optional `title` / `entry_time` / `location_label`, reserved
  nullable columns for future use (`latitude`, `longitude`, `attach_type`,
  `attach_ref`), and server-set `created_at` / `updated_at` ISO timestamps.
  Two indexes: `idx_diary_entry_date` (primary sort key) and
  `idx_diary_attach` (future slice 6). Applied to remote D1 via
  `wrangler d1 migrations apply --remote`. Local DB had a pre-existing state
  issue (migrations 0005/0006 applied without tracking entries); fixed by
  INSERTing the two missing rows into `d1_migrations` before running the
  apply command.

- **`src/pages/api/admin/diary/index.ts`** — `GET /api/admin/diary` returns
  all entries newest-first (`ORDER BY entry_date DESC, created_at DESC`).
  `POST /api/admin/diary` creates an entry; `id` defaults to
  `crypto.randomUUID()` if not supplied by the client (offline-ready
  pattern). Both handlers gate via `requireAdmin(request)` matching the
  existing `api/admin/*` pattern. Parameterised binds throughout.

- **`src/pages/api/admin/diary/[id].ts`** — `GET`, `PUT`, `DELETE` on a
  single entry. PUT always sets `updated_at` to a fresh server timestamp.
  DELETE returns 204 with no body. All three handlers auth-gated.

- **`src/pages/admin/diary.astro`** — Paper-diary page. Frontmatter matches
  the existing admin-page pattern verbatim (`requireAdmin` + `if (auth
  instanceof Response) return auth`). Tab title `"Diary — Admin — Footsteps"`.
  Client-side `<script>` handles the full list/write/edit/delete flow via
  fetch to the API routes. No framework component needed.

- **`src/components/AdminNav.astro`** — Added "Diary" link after "Access".

**Paper-diary design**

- Centred column at `max-w-[42rem]`, generous `py-12` vertical padding.
- Dateline: three inline inputs (date, time, location) in Playfair Display
  italic, `text-foreground/50`, with a hairline `h-px bg-white/10` rule
  beneath — one line of typeset context before the prose.
- Body textarea uses a `repeating-linear-gradient` background to suggest
  faint lined paper (rgba white at 4% opacity) without the blue-ruled
  notebook look.
- Entry list: stacked `<article>` elements, each with the same dateline
  format + hairline rule, then body prose at `text-[0.9375rem] leading-[1.75]`
  (`text-foreground/80`). Multi-paragraph bodies split on double-newline
  into `<p>` tags. Edit affordance appears on hover (`group-hover:opacity-100`)
  to keep entries clean at a glance.
- In edit mode, a "Delete" button appears in the action row. Cancel returns
  to the blank new-entry state.
- Today's date pre-filled on page load so the dateline is never blank.

**Migration tracking fix (side effect)**

Remote D1 `d1_migrations` table was missing rows for 0005 and 0006 because
those migrations were applied by a prior session using a direct SQL approach
rather than `wrangler d1 migrations apply`. Fixed by inserting the two missing
rows manually before running the 0007 apply. Local DB has the same gap — the
local migration apply also errors on 0005 (duplicate column) but the remote
apply succeeded. Local dev environment discrepancy noted; not blocking.

**Build**: `npm run build` clean, no TypeScript errors. One pre-existing
chunk-size warning (MapLibre GL) — not related to this slice.

**Verification** (to be run on live site after deploy)

1. Load `footsteps.gallery/admin/diary` in authenticated admin tab → paper-
   diary page renders; tab title reads "Diary — Admin — Footsteps".
2. Incognito/logged-out tab: `footsteps.gallery/admin/diary` → Cloudflare
   Access login redirect, NOT the diary.
3. Incognito: `fetch('/api/admin/diary')` → expect 401/redirect, never JSON.
4. Write an entry (dateline + body), save → appears at top of list styled as
   a diary page.
5. Reload → entry persists (D1, not just browser state).
6. Edit body, save → list shows updated text.
7. Delete a throwaway entry → disappears; reload confirms.
8. `npx wrangler d1 execute footsteps-db --remote --command "SELECT id,
   entry_date, substr(body,1,30) FROM diary_entries ORDER BY created_at DESC
   LIMIT 5;"` → shows the test entries.

**Conventions introduced** (for future diary slices)

- Client-generated UUIDs for `diary_entries.id` — never switch to autoincrement.
- `updated_at` refreshed server-side on every PUT — will be the last-write-wins
  key for offline sync (Slice D4).
- Paper-diary visual treatment (serif dateline + reading measure) is the diary's
  house style — reuse in later slices.

**Out of scope** (deferred)

- Manual dateline refinement → D2
- Reading polish / month grouping / permalinks → D3
- Offline / IndexedDB / sync → D4
- PWA / service worker → D5
- Attaching entries to country/city/photo → D6

---

## Lessons learned

**Documentation**

- Update the build log every session, not just at phase boundaries.
  Three undocumented sessions cost ~30 minutes of state reconstruction.
- End every Claude Code session with an explicit state summary: what
  changed, what external services were configured, what's unfinished.
  Paste it into the build log before closing.
- Keep the build log on disk (in the repo) as the source of truth, not
  only in claude.ai project knowledge.
- A "shipped" marker in the build log doesn't mean verified —
  end-of-session verification of what actually rendered in production
  is part of the discipline, not a nice-to-have. Slice B's verification
  checkboxes were left unchecked at close-out, and Slice B.1 was the
  direct cost of skipping that step. From now on: no slice marked done
  until production verification is run and recorded.
- **Brief placeholder strings (`YOUR_X_HERE`) are easy to miss in a
  multi-file edit.** Future briefs that require a runtime key should
  either (a) refuse to build without the key set, or (b) use a sentinel
  that fails loudly at deploy time, not at first page load. The MapTiler
  key shipped to production (Phase 7 Slice 1) because nothing in the
  build pipeline objected to the known-bad string.
- **When a brief sets a runtime identifier via search-and-replace,
  post-patch verification must include `grep` across the whole `src/`
  tree for the placeholder string.** The Phase 7 key fix replaced one
  occurrence and silently left the other, because the success criterion
  was "visual check the homepage" rather than "grep returns zero matches".
  Any search-and-replace patch must end with a grep audit before commit.
- **Phase 7 Slice 1 took three iterations to ship because the original
  brief made unverified assumptions about three things**: (a) placeholder
  substitution would happen during build; (b) the `dark-matter` style ID
  was universally available; (c) Static Maps API was on the free tier. All
  three were testable in ~5 minutes via curl before the brief was written.
  For future briefs that depend on third-party APIs: spend 10 minutes hitting
  each planned endpoint with a real key before writing a line of source code.
- **Brief-writing is now a documented standard.** After Slice 1's three
  iterations and Slices 2 + 3 shipping clean using the pre-flight pattern,
  the lessons have been codified in `docs/brief-writing-standard.md`.
  Covers when pre-flight applies, the eight-section template, local + CI
  grep guards for `YOUR_X_HERE` placeholders, and verification wait-budgets
  by rendering model (Astro vs MapLibre vs R2 images vs Access redirects).
  Read it before writing any slice brief.

**Working with Claude Code**

- Verify the deployment pipeline early. "Deploy says success" doesn't
  always mean production matches local.
- Watch for LLM defaults steering off the agreed path. Claude Code
  defaulted back to `wrangler deploy` when the prior plan had been
  Pages-with-Git. Worth confirming the approach matches the plan
  before letting commands run.
- When diagnostics keep contradicting each other, step out of Claude
  Code entirely and run authoritative checks directly (e.g.
  Cloudflare's `/user/tokens/verify` endpoint via PowerShell). Saves
  going round in circles.

**Technical**

- **OG meta gating is a privacy feature.** Conditional rendering of
  `<meta property="og:*">` tags based on whether a page is public keeps
  private URLs from leaking thumbnails or country names when shared in
  messaging apps. Default to no meta unless the page explicitly opts in.
  Implemented: `BaseLayout` only emits OG tags when `ogTitle` is passed;
  private/admin/404 pages pass no OG props.

- **Astro v6 removed `Astro.locals.runtime.env`** — replace with
  `import { env } from "cloudflare:workers"`. Affects any code that
  accesses Cloudflare bindings (D1, R2, KV).
- **Cloudflare's UI changed**: "Pages" sits under a smaller link beside
  the Workers flow (`Looking to deploy Pages? Get started`) rather
  than as a top-level option.
- **For Astro on Cloudflare Pages** (if ever needed in future):
  framework preset Astro, build command `npm run build`, output `dist`.
- **Cloudflare API tokens have a Start date AND an End date.** Setting
  both traps the token in a future usable window. Always leave Start
  blank or set to today; only configure End date. Verify with
  `GET https://api.cloudflare.com/client/v4/user/tokens/verify` —
  Wrangler error messages don't always make the TTL state clear.
- **Wrangler 4.x R2 CLI** is `get`/`put`/`delete` only — no `list`.
  And `get` defaults to local storage; needs `--remote` for live R2.
- **Worker proxy for R2 images** uses long cache headers safely
  because R2 keys are UUIDs (content per key never changes):
  `Cache-Control: public, max-age=31536000, immutable`.
- **The Astro Cloudflare adapter copies `.env` into
  `dist/server/.dev.vars`** during build, and Wrangler reads
  `.dev.vars` at deploy time. Keep build-time-only credentials (like
  REST API tokens for upload scripts) separate from `.env`, or strip
  them from `.dev.vars` post-build.
- **Wrangler reads `.env` from the current working directory** in
  addition to shell env vars. The cheapest way to check which auth
  method is active: `wrangler whoami`. To force the OAuth cache,
  deploy from a directory without `.env`.
- **Astro's Cloudflare adapter auto-provisions KV bindings** on first
  deploy (e.g. SESSION for sessions storage). Once created, hardcode
  the namespace ID into `wrangler.jsonc` — don't rely on
  auto-provisioning on subsequent deploys, because if any deploy
  fails after the namespace is created, the next deploy hits a name
  conflict.

- **Cloudflare Access `path/*` does NOT match the bare path `path`.**
  The wildcard requires at least one character after the trailing slash.
  Always add both a bare-path destination (`path`) AND a wildcard
  destination (`path/*`) when creating an Access app for a section with
  a navigable base URL. Missing the bare-path entry means the base URL
  is ungated; the Worker receives it without the Access headers and
  either 403s or 404s depending on its own auth check.
- **Distinguish a plain-text Worker response from a Cloudflare Access
  denial page.** A Cloudflare-branded deny page means Access gated the
  request and rejected the principal. A plain-text "Forbidden" or
  "Not found" with no chrome means Access never fired — the route is
  ungated and the Worker's own auth check is responding. This
  distinction makes debugging Access misconfigurations much faster.

- **When renaming a schema column, audit every code path that touches
  the old column name, not just the most obvious one.** The Phase 5
  rename caught the new-country thumbnail branch but missed the
  existing-country branch because they live in different conditional
  arms of the same function.
- **End-to-end verification often uncovers subtle bugs in adjacent
  code paths.** The auto-thumbnail bug was a Phase 4 Slice 5 +
  Phase 5 rename interaction issue — invisible until a real upload
  exercised the existing-country + private-audience combination.
  Verification walkthroughs that exercise real workflows with real
  files are worth their time cost. Unit tests on the upload route
  would not have caught this because the bug is a missing case, not
  a wrong implementation of an expected case.

**Cloudflare Access dashboard (UI refresh — May 2026)**

- **Cloudflare's Zero Trust UI refreshed in May 2026.** The
  navigation path is now `Access controls → Applications`, the
  URL pattern is `dash.cloudflare.com/<accountId>/one/access-controls/apps`,
  and the app config form is split across Application details and
  Additional settings tabs. The Application name field is below
  destinations on Application details (not at the top of the form).
- **The inline policy builder during app creation does NOT
  persist the policy.** A "successfully configured" toast appears,
  but the app saves without the policy attached. Workaround:
  always create the app first with destinations + IdP + session
  duration, then enter Manage → Policies → Create new policy,
  click **Save policy** (inside the policy pane), then click the
  bottom **Save** (commits the app). Two saves, in that order.
- **Policies are now reusable objects in the new UI.** They appear
  in an "Add existing policy" dropdown on the Policies tab, scoped
  to the team rather than to a single app. Useful for sharing
  policies across apps, but a footgun when the inline builder
  silently creates and orphans them.
- **A "successfully configured" toast does not mean every field
  saved.** Always cross-check the Applications list view after a
  save — particularly the Policies column — and refresh the page
  if anything looks wrong before re-running the save flow.

**Third-party API integration**

- **MapLibre's mount container needs explicit `h-full w-full` even inside
  an aspect-ratio'd parent with `absolute inset-0`.** MapLibre adds its own
  classes during init that can override simple positioning. Always set both
  `width` AND `height` explicitly on the mount element.
- **MapTiler FREE plan supports Style API + tile API + Maps SDK but NOT
  Static Maps API.** The Static Maps endpoint returns HTTP 403 with a generic
  error PNG for free-tier keys — even with correct origin restrictions, correct
  URL syntax, and correct style IDs. Verify specific endpoint availability
  against the chosen pricing tier in the docs before depending on it.
- **Always verify a third-party map style ID against the live API before
  baking it into a brief.** MapTiler's catalogue of available styles varies
  per account — `dark-matter` is the canonical OpenMapTiles dark style but
  isn't auto-available on free accounts; `basic-v2-dark` is. Cheapest
  verification: hit `style.json?key=X` for each candidate ID before writing
  the brief.
- **Diagnose third-party API behaviour with live queries before changing local code.** Five direct Nominatim queries against real coordinates proved the data shape variability; speculating from a failing upload alone would have produced the wrong fix.
- **Partial wins are wins.** When integrating with external data sources, treat fields independently — don't collapse the whole result to null just because one optional field is missing. Return a discriminated union so callers can act on whatever was resolved.
- **Suburb vs city is not a hierarchy in Nominatim.** Both fields can be populated simultaneously; which one is the "right" answer depends on whether they differ (Marrickville vs Sydney), not on a fixed field precedence.

**Security / credentials**

- **Scope API tokens narrowly per task.** A single "build token" with
  20+ permissions accumulating over time is an anti-pattern; prefer
  per-script tokens named for their purpose.
- **Set TTLs on all tokens.** Even for personal projects, set an
  expiry — forgotten tokens with infinite life are a real risk.
- **Verify token format AND validity after every `.env` edit.**
  Format-only checks (length, no quotes, no whitespace) will pass on
  a not-yet-valid or revoked token. The `/user/tokens/verify`
  endpoint is the authoritative check.

---

## Slice B — Design polish + correctness fixes ✅

**Completed**: 24 May 2026

**Context**: Expert design review of the public country pages identified
several correctness bugs (cities with no public photos rendering empty
sections) and visual inconsistencies (count subtitles, heavy city
headings, crowded breadcrumb, too-close footer chrome, muted amber tint).
This slice applies all 7 changes from that review in a single commit.

**What was built**:

1. **Change 3a — Filter city sections to public photos only**
   (`src/pages/countries/[slug].astro`)
   Changed template to iterate `citiesWithPhotos` instead of all `cities`.
   Removed the "No photographs yet." empty-branch that was rendering
   section headings for cities with private-only photos.

2. **Change 3b — Remove photo/city count from country header**
   (`src/pages/countries/[slug].astro`, `src/pages/private/countries/[slug].astro`)
   Deleted the `<p>` subtitle that showed "N cities · N photographs".
   Country header is now just the country name. Removed the `totalPhotos`
   variable now that it was unused.

3. **Change 3c — Shrink breadcrumb to ambient chrome**
   (`src/pages/countries/[slug].astro`, `src/pages/private/countries/[slug].astro`)
   `text-[10px] tracking-wider text-foreground/30`. Bottom margin reduced
   from `mb-8` to `mb-3` so it sits close under the nav and above the
   country name without competing for attention.

4. **Change 3d — City headings: Playfair Bold → Inter small caps captions**
   (`src/pages/countries/[slug].astro`, `src/pages/private/countries/[slug].astro`)
   `font-sans text-sm font-medium uppercase tracking-widest text-foreground/80 mb-4`.
   Removed inline `font-family` style. City names are now label-weight
   captions, not display headings.

5. **Change 3e — Section spacing via top margins**
   (`src/pages/countries/[slug].astro`, `src/pages/private/countries/[slug].astro`)
   Removed `pb-24` from sections. First section has no top margin; each
   subsequent section gets `mt-16 md:mt-24`. White space between sections
   becomes the visual divider.

6. **Change 4 — Empty state for countries with no public photos**
   (`src/pages/countries/[slug].astro`, `src/pages/private/countries/[slug].astro`)
   When `citiesWithPhotos.length === 0`, renders:
   "Photographs from {country.name} will appear here soon."
   in `text-base text-foreground/40`. Applies to both public and private.

7. **Change 6 — Private nav amber tint: /10 → /25**
   (`src/layouts/BaseLayout.astro`)
   `bg-amber-950/25` when `isPrivate`. More clearly warmer than public nav.

8. **Change 7 — Footer: near-invisible ambient chrome**
   (`src/layouts/BaseLayout.astro`)
   Removed `border-t border-white/10`. Copyright opacity `/30 → /20`.
   Private link `/40 → /20` default, `/60 → /40` hover. Replaced
   hardcoded `#fafafa` hex with `text-foreground` token throughout footer.

**Verified working**:

- [ ] `/countries/united-kingdom` — London only; no count; tiny breadcrumb; small caps city heading
- [ ] `/countries/france` / `/countries/greece` — empty state message renders
- [ ] Multi-city country — `mt-16 md:mt-24` gap between city sections
- [ ] Footer — no border-top; copyright barely visible; Private link barely visible
- [ ] `/private` — nav clearly warmer tint
- [ ] `/private/countries/australia` — same typography + spacing applied
- [ ] Empty-state on private country with no private photos

**Decisions made (from design review)**:

1. No count subtitle on country pages — the photos speak for themselves
2. Breadcrumb is ambient chrome, not navigation emphasis
3. City headings are Inter small-caps captions, not Playfair display headings
4. Section spacing is white space only — no visible dividers
5. `mt-16 md:mt-24` responsive gap between city sections
6. `text-foreground/80` for city caption colour (slightly muted, not full white)
7. Empty state: single prose line, `text-foreground/40`, no back link
8. Private nav: `bg-amber-950/25` — warmer, still subtle
9. Footer has no border — fully ambient
10. Footer opacity `/20` for copyright, `/20 → /40` for Private link
11. Use `text-foreground` theme token in footer, not `#fafafa` hex

**Carries**:
- Phase 5 real-world test with Lorraine/Mia/Alex — still pending
- Cloudflare Access: add bare `private` destination (still missing)
- Phase 7 design session (100+ photos / 5+ countries threshold)
- Lightbox refinements (caption with city + date, slower fade, click-to-zoom)
- OG / Twitter Card metadata per page
- Favicon
- Revoke `footsteps-upload-script` API token
- Create `infrastructure.md`

---

## Slice B.1 — Homepage + /private index polish ✅

**Completed**: 24 May 2026, 22:30

**Context**: Post-Slice B verification revealed that the design language
applied to country pages was never applied to the two index pages.
Homepage still had a 96px Playfair "Footsteps" H1; `/private` had a
72px "Private" H1 and 4:3 card tiles with the country name below the
image in Playfair H2. Slice B.1 closes these gaps.

**What was built**:

1. **`src/pages/index.astro`** — removed the hero `<section>` with the
   "Footsteps" H1 entirely. Added `pt-12 md:pt-16` breathing space to
   the grid section. Changed `gap-4` to `gap-3 md:gap-4`. Replaced the
   Playfair H2 label + gradient with Inter small-caps overlay:
   `from-black/70 via-black/40 to-transparent p-4` gradient,
   `font-sans text-sm font-medium uppercase tracking-widest text-white` label.

2. **`src/pages/private/index.astro`** — removed the "Private" H1 wrapper.
   Replaced 4:3 card tiles with the same `aspect-square` overlay tile as
   the public index. Added `thumbnail_width`/`thumbnail_height` to query
   and `CountryRow` type for CLS-safe `width`/`height` attributes on
   thumbnail `<img>`. Changed `loading="lazy"` to `loading="eager"`.
   Same `gap-3 md:gap-4` gutters. `isPrivate={true}` and amber nav tint
   remain as the sole page-level differentiator.

**Symmetry check**: Both files are near-identical in tile markup, differing
only in `href` prefix and `BaseLayout` props. Left as two parallel templates
— no `CountryTile` component extracted (two callers, trivial diff).

**Verified working**:

- [ ] `/` desktop: no H1, grid starts below nav with breathing space, Inter small-caps labels
- [ ] `/` mobile (380px): same, first tile visible above fold
- [ ] `/private` desktop: identical tile layout, amber nav tint
- [ ] `/private` mobile: same
- [ ] Footer unchanged on both pages
- [ ] Country pages unchanged
- [ ] Tile hover: opacity-90 dip only, label stays put
- [ ] Touch tap navigates correctly

**Carries**:
- Phase 5 real-world test with Lorraine/Mia/Alex — still pending
- Cloudflare Access: add bare `private` destination
- Phase 7 design session (100+ photos / 5+ countries threshold)
- Lightbox refinements
- OG / Twitter Card metadata
- Favicon
- Revoke `footsteps-upload-script` API token
- Create `infrastructure.md`
- De-duplicating Cessnock test photo (via `/admin/photos`, separate concern)

---

## Slice C — Lightbox, accessibility, social, favicon ✅

**Completed**: 24 May 2026, 23:30

**Context**: Closes five items (N1, N2, N4, N5, N6) from the post-Slice B
design review. N3 (loading skeleton) deliberately skipped — see below.

**What was built**:

**N6 — Favicon**
- `public/favicon.svg`: bare footprint silhouette (sole + 5 toes), white
  `#fafafa` on `#0a0a0a` background, 64×64 viewBox. Replaces Astro default.
- `public/apple-touch-icon.png`: 180×180 generated from the SVG via `sharp`
  (Node.js) at `density: 450` then resized. No ImageMagick dependency.
- `public/favicon.ico` deleted (Astro default, no longer needed).
- `BaseLayout.astro`: added `<link rel="apple-touch-icon" sizes="180x180">`.
  Note: if toes blur at 16×16 tab size, simplify to big-toe ellipse only.

**N5 — OG / Twitter Card metadata**
- `BaseLayout.astro` Props extended with `ogTitle, ogDescription, ogImage,
  ogType` (all optional). Meta tags rendered conditionally: zero OG output
  when props are absent. Private, admin, and 404 pages pass no OG props.
- `index.astro`: queries most-recent public photo as cover image; passes
  ogTitle="Footsteps", ogDescription="A photographer's journey through
  Europe.", ogType="website".
- `countries/[slug].astro`: country query extended with LEFT JOIN to fetch
  thumbnail's `r2_key_medium`; ogImage built from it; ogType="article".

**N4 — WCAG AA contrast**

| Element | Before | After | Ratio |
|---|---|---|---|
| Empty state text (public + private) | `/40` (2.7:1) | `/60` (6.6:1) | ✅ Pass |
| Lightbox caption | `/60` (6.6:1) | `/80` (12.4:1) | ✅ Pass |
| City headings | `/80` — already from Slice B | unchanged | ✅ Pass |
| Country tile labels | `text-white` — already full opacity | unchanged | ✅ Pass |

**Ambient chrome exceptions (deliberate, leave below AA):**
- Footer copyright: `/20` (1.3:1) — ambient chrome
- Footer Private link: `/20` default, `/40` hover — ambient chrome
- Breadcrumbs: `/30` (1.7:1) on country pages — ambient chrome

Rationale: photographer-portfolio aesthetic prioritises quiet chrome over
compliance for the secondary visual layer. All primary content passes WCAG AA.

**N1 — Lightbox refinements**
- Background: `bg-black` (was `bg-black/95`) — effectively indistinguishable
  on the dark theme but correct.
- Fade: `transition-opacity duration-200 ease-out`. Replaced `hidden`/show
  toggle with `opacity-0 pointer-events-none` pattern so transitions animate
  correctly (display:none blocks CSS transitions).
- Caption: `text-foreground/80` (was `/60`). Shows city + date:
  "LONDON · 14 JUNE 2025" using `Intl.DateTimeFormat('en-GB')`. Falls back
  to city-only if `capture_date` is absent or invalid. Non-breaking spaces
  around the dot separator.
- `capture_date` added to photo SELECT query and TypeScript type in both
  `countries/[slug].astro` and `private/countries/[slug].astro`, and
  propagated into `lightboxPhotos`.

**N2 — Click-to-zoom**
- Click image → zoom to full variant, scroll-centred on click point (frac
  of fit-mode image). Click again → zoom out to medium.
- `imageWrapper` becomes `overflow-auto` in zoom mode; padding/centering
  classes removed.
- Image sizing: `max-h-full max-w-full object-contain` removed in zoom;
  `cursor-grab` / `cursor-grabbing` applied.
- Pan: `mousedown` on wrapper stores pan origin; `window.mousemove`/
  `mouseup` track delta and scroll wrapper; `mouseup` on window so pan
  survives cursor leaving image bounds.
- Click vs pan: `moved` guard on `img.click` (distance threshold 5px from
  `mousedown` position) prevents accidental zoom toggle after pan.
- Touch pinch-zoom: `imageWrapper.style.touchAction = 'pinch-zoom'` in zoom
  mode; browser handles natively.
- Arrows + caption hidden while zoomed; `Esc` closes entirely; `←`/`→`
  keys no-op when zoomed; swipe gestures gated on `zoomState === 'fit'`;
  overlay click only closes in fit mode.
- `lightboxRefresh` (admin) does instant close (no animation); resets zoom
  DOM state if active.
- History/popstate wiring updated for new open/close animation pattern.

**N3 — Deliberately NOT built**

Loading skeleton / shimmer pulse. Rationale: Phase 6 Slice 3's lazy loading
+ width/height attributes already give a polished layout-shift-free
experience. The dark zinc placeholder (`bg-zinc-800` on country tiles) IS
the loading state — it's indistinguishable from the dark palette. Adding a
shimmer pulse would compete with the "quiet chrome" principle and add
JavaScript for negligible user value.

**Verified working**:

- [ ] Favicon shows footprint in every tab
- [ ] Apple touch icon shows footprint on iOS homescreen
- [ ] OG card on `/countries/united-kingdom` — thumbnail + title + description
- [ ] OG card on `/` — cover photo + "Footsteps" / "A photographer's journey..."
- [ ] Negative test: `/private/countries/australia` — no OG meta in source
- [ ] Empty state `/countries/france` — text visibly readable (not ghosted)
- [ ] Lightbox caption: city + date in en-GB format, small caps
- [ ] Lightbox caption no-date fallback: city only, no trailing artefact
- [ ] Lightbox 200ms fade open and close
- [ ] Click-to-zoom + pan (desktop)
- [ ] Esc while zoomed: closes lightbox
- [ ] Arrow keys while zoomed: no navigation
- [ ] Mobile pinch-zoom
- [ ] Mobile swipe-to-nav still works in fit mode

**Carries**:
- Phase 5 real-world test with Lorraine/Mia/Alex — still pending
- Cloudflare Access: add bare `private` destination
- Favicon: check at 16×16 — if toes blur, simplify to big-toe ellipse
- Backfilling `capture_date` on pre-Slice-C photos (not needed; old photos
  show city-only captions gracefully)
- De-duplicating Cessnock test photo (via `/admin/photos`)
- Revoke `footsteps-upload-script` API token
- Create `infrastructure.md`

---

## Phase 7 Slice 1 — Homepage map view ✅

**Completed**: 24 May 2026, 23:55

**Context**: Adds a dynamic map to `/` showing per-city pins for every city
with at least one public photo that has GPS data. Progressive-enhancement
strategy: static placeholder image + HTML/CSS pin overlay works without JS;
MapLibre GL hydrates the interactive map on scroll-into-view or first
pointer interaction.

**What was built**

`src/pages/index.astro` — complete rewrite of the frontmatter + template:

1. **Pin query** — per-city centroid of public photos with GPS:
   ```sql
   SELECT cities.id AS city_id, cities.name AS city_name,
          countries.slug AS country_slug, countries.name AS country_name,
          COUNT(photos.id) AS photo_count,
          AVG(photos.latitude) AS latitude, AVG(photos.longitude) AS longitude
   FROM photos
   JOIN cities ON photos.city_id = cities.id
   JOIN countries ON photos.country_id = countries.id
   WHERE photos.is_public = 1
     AND photos.latitude IS NOT NULL AND photos.longitude IS NOT NULL
   GROUP BY cities.id
   HAVING photo_count > 0
   ```
   Only `is_public = 1` photos — private data never surfaces on the map.

2. **Bounding box** — defaults to a Europe-tight rectangle
   (`swLon=-10, swLat=35, neLon=30, neLat=60`), then expands to include
   any pin outside those bounds. Grows automatically as photos are added
   outside Europe.

3. **Static placeholder** — MapTiler Static Maps API
   (`https://api.maptiler.com/maps/dark-matter/static/[bounds]/1200x480.webp?key=...&padding=8`).
   Dark Matter style, 16:5 aspect ratio. Serves immediately; no JS needed.
   Key: `MAPTILER_KEY` constant in frontmatter (for URL) and in `<script>`
   (for MapLibre style URL). Currently `'YOUR_MAPTILER_KEY_HERE'` — must
   be replaced by Steve (see below).

4. **Three-layer map section** (template):
   - Layer 0 (`#map-placeholder`): static WebP `<img>`, `loading="lazy"`.
   - Layer 1 (`#pin-overlay`): CSS-positioned `<a>` anchors with flat
     Mercator `left`/`top` percentages. Each link navigates to the country
     page without JS. Dot: `h-2.5 w-2.5 rounded-full bg-foreground shadow`.
     Tooltip: `opacity-0 group-hover:opacity-100` with city name + count.
     Links carry `data-pin-*` attributes for the hydration script.
   - Layer 2 (`#maplibre-mount`): invisible `div` that becomes the MapLibre
     mount point once hydrated.
   - Empty state: plain text paragraph when `pins.length === 0`.

5. **Lazy hydration `<script>`** — `IntersectionObserver` with
   `rootMargin: '200px'` (pre-trigger before the map scrolls into view)
   + `pointerdown` on the container as a second trigger. Dynamic
   `import('maplibre-gl')` keeps MapLibre out of the initial bundle.
   MapLibre CSS injected from unpkg on demand. On `map.on('load')`:
   cross-fade (mount opacity 1, placeholder + overlay opacity 0).
   MapLibre markers use `el.style.cssText` (inline styles) rather than
   Tailwind classes because JIT doesn't scan runtime strings.

`package.json` / `package-lock.json`:
- `maplibre-gl@^4.5.0` added to `dependencies`. v4.7.1 installed.

**MapTiler key — action required from Steve**

1. Sign up at https://www.maptiler.com (free tier is enough for Footsteps).
2. Create a new API key; domain-restrict it to `footsteps.gallery` in the
   key settings (public client-side identifier — source-control safe, but
   restriction prevents abuse if someone copies it from the page source).
3. Replace `'YOUR_MAPTILER_KEY_HERE'` in `src/pages/index.astro` in **two
   places** — the frontmatter `const MAPTILER_KEY` (used in the static
   placeholder URL) and the same constant in the `<script>` block (used for
   the MapLibre style JSON URL).

**Design decisions**

- **Progressive enhancement as the baseline.** CSS-positioned anchor dots
  + static placeholder means the map works without JS — the dots navigate,
  and the image shows where photos are. MapLibre is an enhancement.
- **Flat Mercator approximation for CSS pins.** Linear interpolation within
  the bounding box is not a true Mercator projection, but the error is
  visually imperceptible at Europe scale. MapLibre supersedes it with
  accurate projection once loaded.
- **Europe-first bounding box.** Footsteps is currently a Europe photography
  project; the box defaults to Europe and expands automatically. If the
  journey goes further afield (Australia, Philippines), the box grows to
  include those pins. No code change needed.
- **MapTiler Dark Matter.** Matches the site's dark `#0a0a0a` palette.
  Static placeholder and interactive map use the same style — continuity
  across the cross-fade.
- **MapLibre on unpkg.** CSS loaded from unpkg at the installed version
  (`4.7.1`) rather than bundled — avoids adding ~100KB to the initial CSS
  bundle for a feature only some visitors will trigger.

**Carries**:
- **Steve: replace MapTiler key** — see above. Both placeholder image and
  interactive map will fail until the key is set.
- Slice C verification checklist — still unchecked (production walkthrough
  of favicon, OG cards, lightbox fade/zoom/pan, contrast needed)
- Phase 5 real-world test with Lorraine/Mia/Alex — still pending
- Cloudflare Access: add bare `private` destination
- Favicon: check at 16×16 — if toes blur, simplify to big-toe ellipse
- **Backfill lat/lon (and capture_date) on pre-Slice-2 photos** —
  specifically the Tower Bridge photo uploaded in Phase 3. SQL UPDATE with
  known Tower Bridge GPS (~51.5055, -0.0754) is the quickest fix;
  alternative is re-upload via `/admin`.
- De-duplicating Cessnock test photo (via `/admin/photos`)
- Revoke `footsteps-upload-script` API token
- Create `infrastructure.md` (now has one more entry: MapTiler key +
  domain restriction to `footsteps.gallery`)

**Lessons learned**

- **Progressive enhancement: build for no-JS first, enhance for JS.** CSS
  anchor dots that navigate without JS meant the map section was immediately
  useful before a line of MapLibre code was written. The JS layer is an
  upgrade, not a requirement.
- **Flat Mercator is good enough at regional scale.** For a single-continent
  map, linear interpolation within a bounding box produces pins that are
  within a pixel or two of their true position. No trigonometry needed; no
  projection library needed at render time.
- **Tailwind JIT doesn't scan runtime strings.** MapLibre marker elements
  created in JS with `el.className = '...'` won't be included in the
  production CSS bundle. Use `el.style.cssText` or inline CSS for any
  dynamically created elements.
- **MapTiler API key is a public client-side identifier.** It appears in the
  page source and XHR requests. Domain-restriction in the MapTiler dashboard
  is the appropriate guard, not source-control exclusion. Same posture as
  the Cloudflare Web Analytics token (Slice 5) and Access AUDs (Slice 4).

---

### Fix: mount div height collapse (25 May 2026, 09:30)

`<div id="maplibre-mount" class="absolute inset-0">` was collapsing to
0 height inside the aspect-ratio'd container — `inset-0` alone wasn't
sufficient when MapLibre rewrote container classes during init. Added
`h-full w-full` to the mount div. Map now renders correctly.

Tower Bridge photo is missing from the map because it was uploaded in
Phase 3 before EXIF GPS parsing existed — known data gap, separate
cleanup task (see carries).

---

### Fix: drop Static Maps, render MapLibre on page load (25 May 2026, 09:20)

**Context**: MapTiler Static Maps API returns HTTP 403 on the free tier
regardless of key, URL format, or style ID — it requires a paid plan (~AU$30/
month). The Style API and tile API (used by MapLibre GL) work fine on the free
tier. Decision: drop the three-layer architecture entirely and render the
interactive MapLibre map directly on page load.

**Architecture change**: 3 layers (static WebP placeholder + CSS anchor dots +
MapLibre mount) → 1 layer (MapLibre mount only) + hidden `<ul>` text list
for screen readers / no-JS.

**What changed in `src/pages/index.astro`**:

- *Frontmatter*: deleted `PLACEHOLDER_WIDTH`, `PLACEHOLDER_HEIGHT`,
  `placeholderUrl`, `placeholderAlt`, and `MAPTILER_KEY` (moved to script
  block). Added `mapLabel` (reused as `aria-label` on the container) and
  `pinsJson` (serialised pin array for the script).
- *Template*: deleted `<img id="map-placeholder">` and `<div id="pin-overlay">`.
  `map-container` now has `role="region"` + `aria-label` + `data-pins` attribute.
  `maplibre-mount` is the only child, with no `opacity-0 pointer-events-none`.
  Hidden `<ul class="sr-only">` text list unchanged.
- *Script*: deleted `IntersectionObserver`, `pointerdown` trigger, `hydrated`
  flag, `hydrateMap()` wrapper, and cross-fade logic. Map now initialises
  immediately via an async IIFE. Pin data read from `container.dataset.pins`
  (HTML-encoded by Astro, decoded by the browser before `JSON.parse`).
  `MAPTILER_KEY` and new `MAP_STYLE_ID` constants are the only identifiers.

Trade-off accepted: ~1s delay before the map paints on first load while
MapLibre's JS chunk downloads. Acceptable for a personal portfolio where
the country-grid tiles below the fold are the primary content.

`npm run build` clean. Committed and pushed to main.

---

### Fix: map style + second key placeholder (25 May 2026, 09:10)

**Context**: Two stacked issues left the homepage map non-functional after
the previous patch.

1. **`dark-matter` style 404** — not available on the free-tier MapTiler
   account. Replaced with `basic-v2-dark` (minimalist dark basemap with
   subtle labels; closer to the "quiet chrome, photos dominate" aesthetic
   than the original intent of `dark-matter`). Both occurrences updated:
   frontmatter `placeholderUrl` and the MapLibre `style:` URL in the
   hydration script.
2. **Second `YOUR_MAPTILER_KEY_HERE` was never replaced** — the previous
   patch updated the frontmatter `const MAPTILER_KEY` but left the identical
   constant in the `<script>` block. MapLibre was requesting
   `style.json?key=YOUR_MAPTILER_KEY_HERE` and getting 403. Both occurrences
   now confirmed replaced (`grep -r "YOUR_MAPTILER_KEY_HERE" src/` → 0 matches).

`npm run build` clean. Committed and pushed to main.

---

### Fix: MapTiler key — substitute placeholder (24 May 2026, 23:59)

**Context**: Phase 7 Slice 1 shipped with `YOUR_MAPTILER_KEY_HERE` literally
in production. MapTiler returns HTTP 403 for both the Static Maps API (the
placeholder WebP) and the Style API (MapLibre hydration), so the homepage
map section rendered MapTiler's diagonal-grid error image rather than the
Dark Matter map. All other Phase 7 wiring (pin positions, bounds, hydration
script, accessibility) was correct.

**Fix**: Replaced both occurrences of `'YOUR_MAPTILER_KEY_HERE'` in
`src/pages/index.astro` with the real key `rnng4ZJQRqxg61gTfGU6`
(domain-restricted to `footsteps.gallery` in the MapTiler dashboard).
`npm run build` clean. Committed and pushed to main.

**Lesson (fold into Lessons → Documentation)**: Brief placeholder strings
(`YOUR_X_HERE`) are easy to miss in a multi-file edit. Future briefs that
require a runtime key should either (a) refuse to build without the key set,
or (b) use a sentinel that fails loudly at deploy time, not at first page
load. The MapTiler key shipped to production because nothing in the build
pipeline objected to a known-bad string.

---

## Phase 7 Slice 2 — City coordinates + free-text creation ✅

**Completed**: 25 May 2026, 11:25

**Context**: Two issues with the Phase 7 Slice 1 map:
- Issue A — manually overriding a photo's city in `/admin/photos` leaves `photos.latitude/longitude` unchanged (still the EXIF GPS of the original location), so the map pin drifts to the wrong position.
- Issue B — photos without EXIF GPS are excluded from the map entirely, even when they have a valid country + city assignment.

**Root cause**: The Slice 1 map query used `AVG(photos.latitude)` as the city pin position. If a photo has no GPS, it contributes nothing; if a photo's city was reassigned, its GPS still comes from the original location.

**Solution**: Give cities their own canonical coordinates. `photos.latitude/longitude` stays as immutable EXIF audit data. New `cities.latitude/longitude` columns store the centroid, set via Nominatim forward-geocoding when a city is created and editable via admin UI.

**What was built**

`migrations/0005_add_city_coordinates.sql`
- `ALTER TABLE cities ADD COLUMN latitude REAL`
- `ALTER TABLE cities ADD COLUMN longitude REAL`
- Applied local (wrangler d1 --local) and remote (--command workaround, --file was blocked by Cloudflare API auth bug).

`src/lib/nominatim.ts` — `forwardGeocode(cityName, countryName?)`
- Structured Nominatim query: `?city=X&country=Y&format=jsonv2&limit=1`
- 5s AbortController timeout; User-Agent required header.
- Returns `{ status: 'ok', latitude, longitude, displayName }` | `{ status: 'not_found' }` | `{ status: 'error', reason }`.

`src/pages/api/admin/cities.ts` (POST)
- Forward-geocodes on city creation; stores lat/lon in INSERT.
- 201 response now includes `geocodeStatus`.

`src/pages/api/admin/cities/[id]/coordinates.ts` (PATCH)
- Updates `cities.latitude/longitude` for a given city id.
- Validates range: lat ∈ [-90, 90], lon ∈ [-180, 180]. Accepts `null` to clear.
- Returns updated row.

`src/pages/api/admin/cities/[id]/geocode.ts` (POST)
- Runs `forwardGeocode` without writing; returns the result for user review.
- Looks up city name + country name from DB by id.

`src/pages/api/admin/countries/list.ts`
- Added `ci.latitude, ci.longitude` to city SELECT and `CityRow` type.

`src/pages/api/admin/upload.ts`
- Added `country_free_text` / `city_free_text` form fields: slugified server-side and normalised into the existing `__new__:` code path.
- `isNewCity` branch now calls `forwardGeocode`; stores lat/lon in 5-column city INSERT.
- Country resolution now captures `resolvedCountryName` for geocoding context.
- Response includes `cityGeocodeStatus` and `cityName`.

`src/components/CityCoordinateEditor.astro`
- Modal: `window.CityCoordinateEditor.open(cityId, cityName, countryName, currentLat, currentLon)` → Promise.
- "Run geocode" button calls `POST /api/admin/cities/{id}/geocode`; fills inputs with result.
- Manual lat/lon inputs with range validation.
- "Save" calls `PATCH /api/admin/cities/{id}/coordinates`.
- "Clear coords" empties inputs (save with nulls clears stored coords).

`src/pages/admin/countries/index.astro`
- Imported and mounted `<CityCoordinateEditor />`.
- City rows: added `data-citylat`, `data-citylon`, `data-countryname` attributes.
- 📍 badge (orange) on cities with `latitude == null`.
- "Coords" button with `data-action="edit-city-coords"` → opens editor.
- Event handler calls `window.CityCoordinateEditor.open(...)`, reloads on save.

`src/pages/admin/index.astro`
- Country select gets `+ Add new country…` sentinel option.
- City select gets `+ Add new city…` sentinel option (added in every city load path).
- Selecting either sentinel shows a hidden inline `<input>` (Enter to confirm).
- On Enter: slugifies, inserts `__new__:<slug>` option, sets `state.countrySlug`/`state.geocodedCountryName` (or city equivalents), hides input.
- Upload FormData unchanged — existing `geocoded_country`/`geocoded_city` fields carry the name; server validates slug match.

`src/pages/index.astro` — map query updated:
```sql
SELECT cities.id AS city_id, cities.name AS city_name,
       cities.latitude, cities.longitude,
       countries.slug AS country_slug, countries.name AS country_name,
       COUNT(photos.id) AS photo_count
FROM cities
JOIN countries ON cities.country_id = countries.id
JOIN photos    ON photos.city_id    = cities.id
WHERE photos.is_public = 1
  AND cities.latitude  IS NOT NULL
  AND cities.longitude IS NOT NULL
GROUP BY cities.id
HAVING photo_count > 0
```

**Carries forward**
- Backfill lat/lon on existing cities (London/Tower Bridge, Cessnock) via the new Coords editor.
- D1 --file import issue: Cloudflare API returns auth error 10000 on the `/import` endpoint even with a Super Administrator OAuth token. Workaround: run `--command` instead of `--file`. Report to Cloudflare if it persists.

---

## Phase 7 Slice 3 — World-view cluster map + attribution fix ✅

**Completed**: 26 May 2026, 17:55

**Context**: Two visual defects in the Slice 1 map:
- Defect 1: bounding-box framing pinched between London and Panglao, leaving ~80° of empty Eurasia. Worsens as more regions are added.
- Defect 2: MapTiler attribution pill at bottom-right occluded the Panglao pin.

**What was built**

`src/pages/index.astro` — script block fully replaced:

1. **GeoJSON FeatureCollection** built from the `pins` array (note: GeoJSON coordinate order is `[longitude, latitude]`, not lat/lon).

2. **Clustered GeoJSON source** (`cluster: true`, `clusterMaxZoom: 6`, `clusterRadius: 40`).

3. **Three layers**:
   - `clusters` (circle): dark fill `#1a1a1a`, white stroke 0.6 opacity. Three size bands by `point_count`: <5 → 16px, ≥5 → 22px, ≥15 → 28px. Stroke width 1.5/2/2.5px.
   - `cluster-count` (symbol): `point_count_abbreviated`, `Noto Sans Bold` 12px, `#fafafa`. Font name verified against `basic-v2-dark` style network logs from Slice 1.
   - `unclustered-point` (circle): 10px white dot, 4px translucent stroke ring (matches old DOM-marker shadow).

4. **Click handlers**: cluster click → `getClusterExpansionZoom` + `easeTo`; pin click → `window.location.href` to country page.

5. **Hover popup** on `unclustered-point`: `maplibregl.Popup` with `className: 'footsteps-pin-popup'`, `setText` (not setHTML, avoids XSS from city names). Styled via `global.css`.

6. **Initial view**: `fitBounds([[-170, -55], [180, 75]], { padding: { bottom: 50, ... } })` — world view, bottom padding as attribution-occlusion defence.

7. **Attribution** moved to bottom-left, `compact: true` (collapses to (i) icon).

8. **NavigationControl**: zoom +/- only (`showCompass: false`), top-right.

9. **ResetViewControl**: custom MapLibre control class, 🌍 button, `easeTo({ center: [20, 30], zoom: 1, duration: 600 })`.

`src/styles/global.css` — added:
- `.footsteps-pin-popup` styles (dark bg, white text, thin border, uppercase small text). Popup CSS must be global (MapLibre injects popup outside Astro component scope — scoped styles don't reach it).
- `.footsteps-reset-btn` style (18px font, 29px line-height to match MapLibre 29×29px ctrl button).

Removed: bounding box frontmatter computation, `data-sw-lon/lat/ne-lon/lat` attributes.

**Tunable constants** (recorded for future adjustment):
- `clusterMaxZoom: 6` — clustering stops at country-detail zoom level
- `clusterRadius: 40` — ~40px triggers merge
- `[[-170, -55], [180, 75]]` — world bounds (crops Antarctica, keeps Pacific)

---

### Session: Phase 7 Slice 3 verification + brief-writing retro (26 May 2026, 21:30)

**Context**: Post-Slice 3 close-out. Two workstreams: (1) eyeball-
verify the three Slice 3 carries left open at last session close, and
(2) the brief-writing retrospective that's been deferred twice. Slice 3
shipped without a single follow-up commit — the first Phase 7 slice to
do so — and Slice 2 before it had the same result. Two clean briefs
using the new pre-flight pattern, after Slice 1 took three iterations
without it. Enough signal to draw real lessons.

**Workstream 1 — Slice 3 verification ✅**

All three carries from the Slice 3 close-out walked through via the
Chrome extension against `https://footsteps.gallery`:

- **Hover popup**: ✅ PASS. "LONDON — 1 PHOTO" and "PANGLAO — 2 PHOTOS"
  both render with the `.footsteps-pin-popup` small-caps dark style
  (dark fill, white text, em-dash separator, downward tail to pin).
- **Pin click → country navigation**: ✅ PASS. London → `/countries/
  united-kingdom`, Panglao → `/countries/philippines`. Both pages load
  with correct H1, small-caps city heading, and photo grid.
- **🌍 reset button animation**: ✅ PASS. After three zoom-ins to north
  Africa, click → smooth easeTo back to world view (centre [20, 30],
  zoom 1, 600ms). Mid-animation screenshot at 300ms shows transition
  in progress; final screenshot at 1.3s shows full world bounds restored.

Slice 3 is genuinely closed.

**Two cosmetic observations recorded (neither a defect)**:

- The `renderWorldCopies: true` default still shows a ghost Panglao
  pin in the Pacific to the left of Australia. The one-liner fix
  remains a carry — to be folded into Slice 4 or shipped standalone.
- Hover popup persists when cursor moves pin-to-pin without crossing
  empty space (no `mouseleave` fires on the unclustered-point layer).
  Standard MapLibre behaviour; deferrable. Only manifests with very
  few pins on screen.

**Workstream 2 — Brief-writing retrospective ✅**

Conversation covered four areas. Decisions landed:

1. **When the pre-flight step applies** — third-party API AND first
   time hitting that specific endpoint or feature surface. "Feature
   surface" includes a new query type on a known endpoint (e.g.
   Nominatim forward-geocode vs reverse-geocode). Tighter than
   "every brief" (which would create checkbox ceremony) but firmer
   than "judgement call" (which is what produced Slice 1).
2. **Verification wait-budget by rendering model** — Astro pages
   3–4s, MapLibre 6–8s with popup-on-pin as state probe, R2 image
   grids wait-until-render, Access redirects 5–7s. Time-based waits
   are a proxy for state-based readiness; prefer state probes where
   available. Pairs with "if you see no content, wait once more
   before calling it broken" — the Slice 3 verification misread of
   "still loading" as "broken" was the prompt.
3. **CI grep guard for `YOUR_X_HERE` placeholders** — add it. Roughly
   five lines of YAML in `.github/workflows/`, runs in under a second,
   catches a class of bug the pre-flight pattern doesn't (verified
   assumption + missed substitution). Cheap preventive control
   complementing the detective pre-flight and corrective revert
   workflow. Three controls for a failure mode that ships visibly
   broken is proportionate.
4. **Brief structure standardisation** — codified the eight-section
   template (Context → Pre-flight verified → Files to change →
   Detailed specs → Verification walkthrough → Out of scope →
   Build-log discipline → Conventions). Lives in a new standalone
   doc rather than folded into Lessons, because reference material
   has a different reader and lifespan than narrative history.

**Deliverables**:

- New: `docs/brief-writing-standard.md` — single-file reference,
  ~1.5 pages on a laptop. Read before writing any slice brief.
- This session entry, plus one new Documentation bullet in the
  Lessons section linking to the new doc.

**Carries (updated)**

- `renderWorldCopies: false` one-liner — decision pending (Slice 4
  bundle vs standalone commit)
- Hover-popup-persistence on pin-to-pin moves — defer, cosmetic
- CI grep guard implementation — add to `.github/workflows/` per
  standard doc section 4b. Five-line YAML patch, not yet committed
- Phase 5 real-world test with Lorraine/Mia/Alex — still pending
- `infrastructure.md` doc — still not created; now five entries to
  capture (1 Cloudflare API token, 2 Access apps, 1 Web Analytics
  site, 1 MapTiler key)
- Test-data audit — Philippines public test photos to re-tag private
  before family/friends visit
- `footsteps-upload-script` API token — still pending revocation
- Cessnock test photo de-dupe via `/admin/photos`
- `docs/footsteps_architecture_post_phase_3.svg` and
  `docs/Next Claude prompt - footsteps.txt` — untracked, decisions
  pending
- Node 20 deprecation on action wrappers — bump `@v5` when stable
- Tower Bridge photo `capture_date` backfill via `/admin/photos`
- Favicon 16×16 legibility check

---

### Fix: renderWorldCopies + CI placeholder guard (26 May 2026, 23:30)

**Context**: Two independent one-liners bundled from the post-Slice 3 retro
carries. Neither affects app logic; both close visible gaps noted during
verification.

**Fix A — `renderWorldCopies: false`**

Added to the `new maplibregl.Map({...})` constructor in
`src/pages/index.astro`. MapLibre's default (`true`) wraps the world
horizontally, producing a ghost Panglao pin at approximately lon −237
(the 123°E wrap) visible to the left of Australia at default world zoom.
With `false`, the area beyond ±180° is blank canvas. Known side-effect:
non-square viewports may not zoom out far enough to show the full world —
pre-flight confirmed our `fitBounds([[-170, -55], [180, 75]])` initial
view sits within those bounds and is unaffected (MapLibre issue #4510).

**Fix B — CI placeholder guard**

Added a "Check for unsubstituted placeholders" step to
`.github/workflows/deploy.yml` between `npm ci` and `npm run build`.
Runs `grep -rIn` across `src/` for `YOUR_[A-Z_]+_HERE`, `TODO_RUNTIME_KEY`,
and `REPLACE_ME`. Exit code 0 (match found) → `exit 1` fails the deploy.
Complements the local grep audit (section 4a of the standard doc): pre-flight
catches "did I verify the assumption?"; CI catches "did the substitution
actually land?" — two different failure modes.

`docs/brief-writing-standard.md` section 4b corrected simultaneously: the
original had multiple `--include` flags on one line using brace-expansion
syntax, which is a shell feature not a grep feature. Each flag is now on its
own line, and the error message extended to "— fix before deploying".

**Verified**:

- `grep -rIn -E 'YOUR_[A-Z_]+_HERE|TODO_RUNTIME_KEY|REPLACE_ME' src/` →
  0 matches (exit 1). CI guard would pass on current tree.
- `npm run build` clean (pre-existing chunk-size warning from maplibre, not
  introduced by this change).

**Next session pickup**

Backlog cleanup sequencing (the deferred Workstream 3 from this
handoff). The intent is to close out the open carries in the right
order and reach a properly-finished state to share with family and
friends. No new slices planned.

---

### Session: Workstream 3 — pre-share housekeeping + thumbnail reconciliation slice (26 May 2026, evening)

**Goal**: Work the deferred Workstream 3 carry list to make the site
shareable with Lorraine, Mia, Alex and others. Stages 1 (test-data
audit), 2 (real-world auth test kickoff), 3 (token revocation), 4
(docs), 5 (build log + retro) planned. Mid-session, an unplanned
slice (thumbnail reconciliation) was scoped, designed, built, and
verified — pushed everything else.

**Closed this session**

- **Stage 1 Item 1 — Philippines test-data audit**. Pre-existing
  state: 7 Philippines photos (2 public, 5 private), one image
  duplicated across the audience boundary (same visual, two D1 rows,
  two R2 keyspaces — pattern matches the Cessnock duplicate, not a
  schema violation). Action: deleted the public copy of the duplicate
  in `/admin/photos`, then re-tagged the remaining public photo to
  private. End state: 6 Philippines photos, all private, zero public
  footprint. Verification confirmed homepage cluster map no longer
  shows Panglao pin.

- **Stage 1 Item 2 — Cessnock dedupe**. Closed implicitly via Test B
  of the thumbnail reconciliation slice (see below).

- **Thumbnail reconciliation slice (unplanned, c993221 + follow-up
  fix)**. New helper `src/lib/thumbnails.ts` introducing
  `reconcileCountryThumbnailStatements(db, countryId)` —
  SELECT-inside-UPDATE for atomic batch inclusion, picks most recent
  qualifying photo per audience slot or NULL if none. PATCH and
  DELETE handlers in `src/pages/api/admin/photos/[id].ts` refactored
  to call the helper instead of the previous "clear-and-set-if-NULL"
  conditional batch. Invariant now holds across all audience flips,
  deletes, and cross-country moves: a country has a populated
  thumbnail (per audience) iff at least one qualifying photo exists.

  Initial deploy (c993221) had a column-name defect — helper
  referenced `photos.uploaded_at` (a non-existent column); actual
  column is `created_at`. Caused 500 on every PATCH that triggered
  reconciliation. Fixed in a follow-up commit. Production
  verification matrix passed end-to-end:
  - Test A (audience flip with reconcile, both directions): pass
  - Test B (delete the current thumbnail): pass — closed Cessnock
    Item 2 in the process
  - Test C (cross-country move, two-country reconcile): pass —
    Philippines lost the moved photo, remaining Philippines public
    photo took over the tile; UK gained the moved photo, UK tile
    populated from a previously-NULL slot
  - Test D (no-op PATCH): pass — no spurious side effects

**State change to track**

Workstream 3 started with Philippines fully cleaned (Stage 1 Item 1).
During cross-country test (Test C), Philippines photos were
re-promoted to public for test purposes, then one was moved to UK.
**Current Philippines state at session close**: 1 public photo
remaining (was 2 before the move). **Current UK state**: 1 public
photo (the moved Philippines shot, currently the UK tile on the
homepage). This is acceptable test-data drift — the photo is a real
upload, just an "in the wrong country" one. Move it back later, or
treat as a known quirk until proper UK photos arrive.

**Carries — closed this session**

- ~~Philippines test-data audit~~ (Stage 1 Item 1) — done
- ~~Cessnock duplicate~~ (Stage 1 Item 2) — done via Test B
- ~~Thumbnail not auto-replaced on demote/delete~~ — was implicit in
  the old PATCH/DELETE handlers; reconciliation slice fixes it

**Carries — open at session close**

- Tower Bridge `capture_date` backfill — Stage 1 Item 3, deferred to
  next session. Single-photo edit in `/admin/photos`.
- Phase 5 real-world test with Lorraine, Mia, Alex — Stage 2, not
  kicked off this session. Outbound message still to send.
- Revoke `footsteps-upload-script` API token — Stage 3, deferred.
  Two-minute task in Cloudflare dashboard.
- Untracked working-tree triage (`docs/footsteps_architecture_post_phase_3.svg`,
  `docs/Next Claude prompt - footsteps.txt`) — Stage 4 prerequisite,
  deferred.
- Create `docs/infrastructure.md` — Stage 4, deferred. Five items to
  capture: 1 Cloudflare API token, 2 Cloudflare Access apps, 1 Web
  Analytics site, 1 MapTiler API key.
- Favicon 16×16 legibility — Slice C carry, deferred.
- Node 20 deprecation on `actions/checkout@v5` / `actions/setup-node@v5`
  — wait for `@v5` stable.
- Move the test-uploaded photo back from UK to Philippines (or accept
  the drift). New, very minor.

**Lessons learned**

1. **Pre-flight verification must cover every column referenced in
   brief SQL, not just the most contextually-obvious ones.** The
   brief specified `ORDER BY uploaded_at DESC` in the reconcile
   helper. The pre-flight checklist in the brief grepped `countries`
   column names but didn't grep `photos`. The column didn't exist;
   PATCH 500'd on the first promotion attempt in production. Caught
   immediately by `wrangler tail` (genuine 60-second
   diagnose-and-fix loop) but should have been caught at design
   time. Action: append to `docs/brief-writing-standard.md`
   pre-flight section: *"Every column referenced in any SQL block
   in the brief must be verified against the relevant migration
   file. No exceptions for 'obvious' or 'standard' column names —
   if it appears in a SELECT, INSERT, UPDATE, ORDER BY, or WHERE,
   it gets grepped."* This is the concrete feedback for the
   standard from this session.

2. **The brief-writing standard held up well otherwise.** Eight-
   section template was the right shape for the reconciliation
   slice. Pre-locked decisions (4 design questions, locked one at a
   time via tappable options) meant the brief had no clarifying
   questions for Claude Code at build time. The verification wait-
   budget (~90s for Worker + D1 changes) was accurate. Section 5's
   pre-flight checklist would have caught the column defect if it
   had been more comprehensive — see lesson 1.

3. **Source verification before brief-writing was correctly
   prioritised.** Three PowerShell commands (directory listing,
   grep for `is_public` references, grep for `CREATE TABLE
   countries`) revealed that the existing PATCH handler already
   had partial reconciliation logic — clearing old slots, setting
   new slots if NULL. The brief was rewritten to *replace* this
   logic rather than add alongside it. Without the source read,
   the brief would have produced a layered mess of old conditionals
   and new helper calls.

4. **Atomicity decision (SELECT subquery in UPDATE, batched)
   paid off.** No race window where the homepage tile briefly
   points at a deleted photo. Cleaner than the alternative
   (resolve replacement ID in JS, then batch) for this single-
   user, no-concurrent-writer use case. Worth documenting as a
   pattern in `docs/` if this comes up again.

5. **Mid-session scope inserts are fine when caught early and
   scoped tightly.** The thumbnail reconciliation slice was not
   on the Workstream 3 plan. It was identified during Stage 1
   Item 1 cleanup (user asked "what if I want to promote a private
   photo to public later"), scoped against the existing schema
   invariant, locked through four design questions, built, and
   verified — all in the same session. Took the place of Stages 3
   and 4. Acceptable trade-off: the slice was directly relevant to
   the "make site shareable" theme, and shipped *before* family/
   friends saw the site. Stages 3 and 4 are admin/docs work that
   don't block the share. Push deferred to next session.

**Next session entry point**

Resume Workstream 3 at Stage 1 Item 3 (Tower Bridge `capture_date`),
then Stage 3 (token revocation), Stage 4 (file triage +
infrastructure.md), Stage 2 (Lorraine/Mia/Alex kickoff). Update
`docs/brief-writing-standard.md` with the column-verification rule
from lesson 1 — small two-line edit, do it before the next slice
brief.

---

### Session: Workstream 3 closure + Phase 8 Slice 1 — /admin/access user management (27 May 2026, 09:50)

**Goal**: Close out deferred Workstream 3 items + ship an unplanned-but-substantial Phase 8 Slice 1 (`/admin/access` user management) that emerged mid-session from a user-driven scope expansion.

**Closed this session**

- **Stage 1 Item 3 — Tower Bridge `capture_date` backfill**. The Phase 3-era manual seed had a NULL `capture_date`. Investigation revealed `capture_date` column exists in the schema (column 3 of `photos`) but isn't surfaced in the `/admin/photos` edit modal. Cross-check across all photos confirmed only Tower Bridge was NULL — every other photo has a populated date from EXIF parsing, so a UI surface-up wasn't justified. Fixed via single D1 UPDATE: value `2026-05-17T23:06:18.000Z` matching the row's `created_at`. Verified format-consistent with the rest of the table (ISO 8601 with milliseconds and Z suffix). Acceptable trade-off — the placeholder value is honest about its nature (matches upload time, not a EXIF-derived capture time).

- **Phase 8 Slice 1 — `/admin/access` user management**. Full-fat v1: list current allowlist with notes and last-sign-in column, add new users (Gmail-only validation), remove users (confirm modal, self-row protection), edit notes inline. Responsive table/card hybrid layout per Q9. Source of truth is Cloudflare's Access policy; D1 holds notes only. Two API endpoints (`/api/admin/access/users` for list+add; `/api/admin/access/users/[email]` for delete+patch-note). New shared library `src/lib/cf-access.ts` wraps the Cloudflare Access API surface. Migration `0006_access_user_notes.sql` adds the notes table. Bound via new Worker secret `CF_ACCESS_API_TOKEN`. Verified across 13 steps including live add/remove cycles against the Cloudflare API and dashboard cross-checks. Mobile responsive verified on actual phone (Steve's words: "looks slick"). Commit `b99579e` plus follow-up micro-fix for the Gmail-only hint under "Add user" heading.

- **Pre-flight against Cloudflare Access API** (per `brief-writing-standard.md` section 3) — 4 probes against the live account, including the destructive PUT round-trip to add and remove a test address. Two design-breaking findings caught: (1) **reusable policies cannot be updated via the per-app endpoint** — error code 12130; the Private viewers policy is reusable and required the account-scoped endpoint `/accounts/{aid}/access/policies/{pid}` instead. (2) **PUT semantics are full-body replacement, not partial** — every PUT must preserve `decision`, `name`, `include`, `exclude`, `require`, `precedence`. Both findings baked into the brief before any code was written; the slice shipped without API-shape rework.

- **Stage 3 — `footsteps-upload-script` API token revoked**. Three independent pre-revoke checks (PowerShell `Select-String` of source code, `npx wrangler secret list`, Cloudflare dashboard's "Last used" column) confirmed no active dependency anywhere. The carry has been recorded as "still pending" across roughly 19 session entries; closed in 2 minutes once actually addressed. Lesson on session-overhead patterns noted below.

- **Stage 4a — Untracked working-tree files triaged and resolved**. Commit `0932031`:
  - `docs/footsteps-project-brief.md` — committed (was never tracked; would have been lost on laptop failure). Surprise that this critical file wasn't in git
  - `docs/footsteps_architecture_post_phase_3.svg` — moved to new `docs/archive/` folder with date prefix (`2026-05_architecture_post_phase_3.svg`). Preserves as historical reference; signals via filename that it's superseded
  - `docs/Next Claude prompt - footsteps.txt` — gitignored by exact filename (Steve uses these as session-handoff scratchpads; legitimate working files that shouldn't be in repo)

- **Stage 4b — `docs/infrastructure.md` created** (commit `b5d400a`). 12-item richer version (vs. the original 5-item plan): account ownership, domain registration, Worker bindings (4 of them: ASSETS, DB, PHOTOS, SESSION KV), D1 database UUID, R2 bucket, KV namespace, both Access apps with policy IDs, both active API tokens with rotation procedures, Web Analytics, MapTiler, GitHub repo. Two placeholders to fill in follow-up: Web Analytics site UUID, GitHub Actions secret name verification.

- **Stage 2 — Pilot test email sent to Alex** (`alexcurrie429@gmail.com`). Email mentions the new `/admin/access` page transparently (timestamps only, not viewing history). Alex's response and verification close out async over next 1-2 days. Lorraine and Mia rollout conditional on Alex's success.

**Lessons learned**

1. **Pre-flight value confirmed on a larger API surface.** Same standard applied to Cloudflare Access API (vs. last session's Nominatim) caught two design-breaking findings before any code was written. Both findings (reusable-policy endpoint, full-body PUT) were invisible from the docs and would have produced repeated 400s in production. Pattern holds — pre-flight cost ~20 minutes; revision cost after a broken deploy would have been hours.

2. **Migration sequence numbers must be verified, not assumed.** Brief specified `0004_access_user_notes.sql`; actual next number was `0006` (migrations `0004_add_photo_dimensions` and `0005_add_city_coordinates` had landed in unrecorded slices since last memory update). Claude Code corrected, no harm done. **Action**: append to `docs/brief-writing-standard.md` pre-flight section: *"Migration sequence numbers must be verified by listing `migrations/` directory before writing the brief — assuming N+1 from project memory or build-log entries is unreliable."*

3. **Brief code blocks should defer to "follow existing patterns" rather than invent new ones for project-specific surfaces.** Brief used `requireAdmin(ctx)` and `ctx.locals.runtime.env.*`; project's actual conventions are `requireAdmin(request)` and `env.*` via `cloudflare:workers` import. Both corrected by Claude Code at build time. **Action**: append to standard: *"For brief code involving auth gating, env-binding access, or other project-specific imports, write 'mirror the pattern in existing endpoint X' rather than writing speculative code. Generic Astro/Workers documentation does not reflect this project's specific conventions."*

4. **Pre-flight test data must use addresses verified against the actual account, not "plausible" placeholders.** Pre-flight initially used `steve+pretestaccess@gmail.com` as a test address — not actually a Gmail alias of `stevecurrie2000@gmail.com` (would deliver to a real other person, or bounce). Caught when Steve queried it during the user-facing verification step. Round-trip was harmless because no actual email delivery happened during pre-flight, but the principle was sloppy. Verification corrected to use real alias `stevecurrie2000+pretestaccess@gmail.com`. **Action**: append to standard: *"Any verification test address that ends up on a live external system must be a verified alias of the account in use, not a constructed placeholder."*

5. **Cloudflare API token TTLs are approximate to month boundaries.** Token requested with 27 May 2027 expiry shows as expiring 1 April 2027 in the dashboard — date picker rounded down. Cosmetic but worth knowing: budget calendar reminders for ~30 days before the displayed expiry, not the requested expiry. Reminder set for ~1 March 2027.

6. **Stale "next session" handoff files should be gitignored, not deleted.** Initial recommendation to delete the working scratchpad was wrong — Steve uses these as drafting workspace for the next session's handoff prompt. Workspace files → gitignore by exact filename; shared truth → commit.

7. **Two-minute admin tasks accumulate session-over-session.** The `footsteps-upload-script` revoke has been on the carries list for ~19 session entries. The fix isn't "more discipline"; it's catching them earlier in a session when the queue is short, or batching them deliberately at a quiet moment. Worth a section in `brief-writing-standard.md` on managing the carries list itself.

8. **Build-log update workflow standardised**: this chat produces a copy-paste-ready brief for Claude Code to append the session entry to `docs/build-log.md`. The chat-produced brief is the source of truth; the project-knowledge copy on `claude.ai` is manually synced afterwards, expected to lag the laptop copy.

**Carries — closed this session**

- ~~Tower Bridge `capture_date` backfill~~
- ~~`footsteps-upload-script` API token revoke~~ (~19 session entries deep)
- ~~Untracked working-tree files (project brief, architecture SVG, Next Claude prompt)~~
- ~~`docs/infrastructure.md` creation~~
- ~~Phase 5 real-world auth test — Alex kickoff~~ (verification pending Alex's response, but kickoff complete)

**Carries — open at session close**

- **Alex's verification response** — async over next 1-2 days
- **Lorraine + Mia rollout** — conditional on Alex's success
- **`docs/infrastructure.md` placeholders** — Web Analytics site UUID, GitHub Actions secret name verification. Single follow-up commit
- **`brief-writing-standard.md` updates from this session's lessons** — three small additions (migration sequence verification, "follow existing patterns" guidance, placeholder address rule). Edit before the next slice brief
- **Phase 8 Slice 2 — polished admin landing page** — design session needed before any brief
- **Welcome-email feature** — deliberately deferred. Revisit only if allowlist grows past ~50 entries
- **Stage 5 housekeeping** — favicon 16×16 legibility, Node 20 deprecation on `@v5` action wrappers, UK city-variant naming
- **Tower Bridge capture date as placeholder** — if the original `test-photo.jpg` is ever located, real EXIF date could replace the upload-timestamp value. Low priority

**State changes to track**

- Footsteps Private allowlist verified at 4 entries (Steve, Lorraine, Mia, Alex). Test additions/removals round-tripped successfully against Cloudflare's authoritative store
- New files: `docs/infrastructure.md`, `docs/archive/` directory
- API token inventory: 2 active (`footsteps-github-actions-deploy` no-expiry, `footsteps-access-api-2026-05` expires 1 April 2027), 1 revoked (`footsteps-upload-script`)
- New Worker secret: `CF_ACCESS_API_TOKEN`
- D1 schema: `access_user_notes` table added via migration 0006

---

### Phase 8 Slice 1 — /admin/access user management (27 May 2026)

Commit b99579e. 7 files: `migrations/0006_access_user_notes.sql`,
`src/lib/cf-access.ts`, `src/pages/admin/access.astro`,
`src/pages/api/admin/access/users/index.ts`,
`src/pages/api/admin/access/users/[email].ts`,
`src/components/AdminNav.astro` (Access link added),
`src/env.d.ts` (CF_ACCESS_API_TOKEN binding declared).

Migration 0006 applied locally and remotely (table `access_user_notes`).
Worker secret `CF_ACCESS_API_TOKEN` to be added by Steve via
`npx wrangler secret put` after deploy.

Key implementation notes:
- Migration numbered 0006 (not 0004 as brief stated — 0004 and 0005
  were already taken by `add_photo_dimensions` and `add_city_coordinates`)
- Brief's API code adapted to project conventions: `requireAdmin(request)`
  (not `ctx`), `env` from `cloudflare:workers` (not `ctx.locals.runtime.env`)
- Cloudflare API: account-scoped PUT endpoint used for reusable policy
  (per-app endpoint returns 400, error code 12130, pre-flight verified)
- PUT is full-body replacement; `putPolicy` preserves all original fields,
  omits `connection_rules`, `id`, `uid`, `created_at`, `updated_at`,
  `reusable` (server-managed)
- Audit log filtered client-side by `app_uid` + `action === "login"` +
  `allowed === true`; `ip_address` not surfaced (privacy)

Polish: Gmail-only hint added to /admin/access add form (27 May 2026)

---

### Phase 8 Slice 2 — Admin landing page + public-nav admin link (28 May 2026)

Commit 642cbae. 7 files: `src/middleware.ts` (new),
`src/env.d.ts`, `src/layouts/BaseLayout.astro`,
`src/pages/admin/index.astro` (replaced), `src/pages/admin/upload.astro` (new),
`src/components/AdminNav.astro`, `src/pages/api/admin/dashboard.ts` (new).

What shipped:
- `src/middleware.ts`: best-effort JWT check on every request, decorates
  `Astro.locals.viewerIsAdmin`; swallows all errors (decoration-only, never a gate)
- `src/env.d.ts`: added `SESSION: KVNamespace` and `viewerIsAdmin: boolean`
  to `App.Locals`
- `BaseLayout.astro`: conditional Admin link in public nav, rendered only when
  `viewerIsAdmin && !isAdmin` (hidden on admin pages, not shown to non-admins)
- `admin/index.astro`: new landing page — welcome chrome, 5 stat tiles
  (photos, countries, last upload, allowlist, storage), 4 section links
- `admin/upload.astro`: verbatim move of the old index.astro (upload pipeline)
- `AdminNav.astro`: Home link added as first item; Upload href updated to
  `/admin/upload`. Final nav order: Home | Upload | Photos | Countries | Access
- `api/admin/dashboard.ts`: stats endpoint; queries D1 for counts, lists R2
  objects for storage bytes, calls CF Access API for allowlist count; 5-min
  SESSION KV cache (CACHE_KEY `admin:dashboard`)

Key implementation notes:
- Cache TTL shipped at 300s (brief spec'd 3600s). More responsive for new
  uploads; R2 list cost is negligible. Deliberate deviation kept.
- `allowlistCount` returns null (renders "—") if `CF_ACCESS_API_TOKEN` is absent
- R2 storage uses cursor-paginated `PHOTOS.list()` to handle large buckets
- Middleware file did not pre-exist; created from scratch

Deviations from brief:
- Cache TTL: 300s shipped vs 3600s specified (see notes above)
- Middleware created new (pre-flight confirmed no existing middleware.ts)

Lessons:
1. "Push to main" ≠ "deployed". Initial deploy failed silently with a transient
   GitHub Actions network error (wrangler-action@v3 download blip). Reported
   as deployed based on push succeeding. Caught only during verification prep.
   Action: brief-writing-standard must require "confirm GitHub Actions run
   completed green" as the literal first verification step before any browser
   checks.
2. Pre-flight prevented broken R2 storage tile. Photos table has no size_bytes
   column — planned D1-based approach would have shipped broken. Pivoted to
   R2 list + KV cache before writing any code.
3. Pre-flight caught the index.astro rename surprise. Assumption was "create
   new landing page file". Pre-flight revealed index.astro was the upload page,
   making this a rename-plus-new task rather than just-new.

Carries forward:
- **Node 20 deprecation in GH Actions** — warning on successful run. Three
  affected: `actions/checkout@v4`, `actions/setup-node@v4`,
  `cloudflare/wrangler-action@v3`. Forced to Node 24 on 2 June 2026, removed
  16 September 2026. Bump to current majors. ~5-min job.
- **Alex auth verification** — still pending. Lorraine + Mia rollout conditional.
- **Four brief-writing-standard updates pending** — migration sequence
  verification, "follow existing patterns", placeholder address rule, plus new
  "verify GH Actions green first" rule from this session.
- Stage 5 housekeeping (favicon 16×16 legibility) still open.

---

### Session: Chore — pre-closure housekeeping (28 May 2026, 10:30)

No application code changed. Three files, one commit.

| File | Change |
|---|---|
| `docs/brief-writing-standard.md` | Folded four lessons: migration sequence verification (Lesson A), follow existing patterns (Lesson B), placeholder addresses (Lesson C), GH Actions green check first (Lesson D) |
| `.github/workflows/deploy.yml` | Bumped `actions/checkout@v4` → `@v6`, `actions/setup-node@v4` → `@v6`. `cloudflare/wrangler-action@v3` left unchanged — no v4 exists |
| `docs/build-log.md` | This entry + snapshot table update |

This clears Pile 2 of the pre-closure stocktake. No features, no design work,
no production impact beyond the workflow file (Node 24 runtime upgrade for two
action wrappers). Project enters closure-pending-Alex state after this push.

**Carries closed this session**

- `footsteps-upload-script` API token — confirmed deleted (Steve verified in
  CF dashboard). Build-log carry closed.
- Architecture SVG — confirmed tracked at
  `docs/archive/2026-05_architecture_post_phase_3.svg`. The carry reference
  in earlier entries used wrong path (`docs/footsteps_architecture_post_phase_3.svg`);
  corrected here.
- Four `brief-writing-standard.md` updates — all folded in (migration number
  verification, follow existing patterns, placeholder address rule, GH Actions
  green check).
- Two of three GH Actions on Node 20 — bumped to v6.

**Carries that remain**

- **`cloudflare/wrangler-action` Node 20 deprecation** — still @v3; no v4
  exists yet. Deprecation warning will persist on every deploy run. Watch
  the wrangler-action repo for v4. Hard deadline: 16 September 2026 (Node 20
  removed from GitHub-hosted runners).
- **Alex / Lorraine / Mia real-world auth test** — reframed as post-closure
  ops work. Test happens organically when each user first attempts sign-in.
  No active action needed from Steve.
- Stage 5 housekeeping (favicon 16×16 legibility) — deferred indefinitely.

---

### Session: Chore — favicon replacement (28 May 2026, 11:30)

Two binary files, one commit.

| File | Change |
|---|---|
| `public/favicon.svg` | Replaced Slice C hand-drawn version with a potrace-traced SVG of Steve's new outlined-foot image. Same 64×64 viewBox, same `#0a0a0a` background, same `#fafafa` foreground. Two paths (toe bean + main foot shape) |
| `public/apple-touch-icon.png` | Regenerated 180×180 from the new SVG via `sharp` with `density: 1500` |
| `docs/build-log.md` | This entry |

No code changes. No schema changes. Existing `<link>` tags in `BaseLayout.astro`
already pointed at the right paths. Temp script `scripts/build-apple-touch.mjs`
created for the rasterisation step then deleted before commit.

**Carries — still open**
- Favicon 16×16 legibility (Slice C carry, deferred indefinitely). New design
  is slightly more legible than the old at 32px but still loses definition at
  16px — inherent to a detailed-foot silhouette at that size. Resolving would
  mean a simplified secondary glyph; separate design call.

---

### Session: Chore — revert favicon to Astro default (28 May 2026, 12:15)

Four files, one commit.

| File | Change |
|---|---|
| `public/favicon.svg` | Restored Astro default (the stock rocket-wedge SVG). Replaces the custom footprint introduced in Slice C |
| `public/apple-touch-icon.png` | Deleted. The custom design wasn't landing; reverting to "no custom apple-touch-icon" rather than maintaining a broken one |
| `src/layouts/BaseLayout.astro` | Removed `<link rel="apple-touch-icon" sizes="180x180">`. Existing `<link rel="icon" type="image/svg+xml">` left in place — still correct |
| `docs/build-log.md` | This entry |

Custom favicon design parked indefinitely. Revisit when there's a clearer
visual direction.

**Carries — closed by this session**
- Favicon 16×16 legibility (Slice C carry) — moot. No custom favicon, no legibility problem.

**Carries — still open**
- None added.

---

### Session: Chore — simplify browser tab titles (28 May 2026, 14:00)

Dropped "— Europe Photography" suffix from homepage. Tab titles now follow `{context} — Footsteps` pattern, with homepage as just "Footsteps".

| File | Change |
|---|---|
| `src/layouts/BaseLayout.astro` | No change needed — already renders `title` prop verbatim and defaults to `"Footsteps"` |
| `src/pages/index.astro` | `title="Footsteps — Europe Photography"` → `title="Footsteps"` |
| `src/pages/404.astro` | `title="Off the path — Footsteps"` → `title="Not Found — Footsteps"` |
| `src/pages/admin/access.astro` | `title="Access — Footsteps Admin"` → `title="Access — Admin — Footsteps"` |
| `src/pages/admin/photos/index.astro` | `title="Admin — Photos"` → `title="Photos — Admin — Footsteps"` |
| `src/pages/admin/upload.astro` | `title="Admin — Upload"` → `title="Upload — Admin — Footsteps"` |
| `src/pages/admin/countries/index.astro` | `title="Countries & Cities — Admin"` → `title="Countries — Admin — Footsteps"` |
| `docs/build-log.md` | This entry |

Already-correct pages (no change needed): `src/pages/private/index.astro`, `src/pages/private/countries/[slug].astro`, `src/pages/countries/[slug].astro`, `src/pages/admin/index.astro`.

**Tab title pattern** (new convention):

| Page | Tab title |
|---|---|
| `/` | Footsteps |
| `/countries/[slug]` | {country.name} — Footsteps |
| `/private` | Private — Footsteps |
| `/private/countries/[slug]` | {country.name} — Private — Footsteps |
| `/admin` | Admin — Footsteps |
| `/admin/upload` | Upload — Admin — Footsteps |
| `/admin/photos` | Photos — Admin — Footsteps |
| `/admin/countries` | Countries — Admin — Footsteps |
| `/admin/access` | Access — Admin — Footsteps |
| `/404` | Not Found — Footsteps |

Future pages should set `<BaseLayout title="...">` using the `{context} — Footsteps` (or `{context} — Admin — Footsteps`) pattern.

**Carries — still open**
- None added.
