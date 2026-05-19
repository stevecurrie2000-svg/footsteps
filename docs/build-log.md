# Footsteps — Build Log

A running record of what's been done, decisions made, and lessons
learned. Updated at the end of every session, not just at phase
boundaries.

---

## Current snapshot

**Last updated**: 19 May 2026, end of Phase 4 Slice 5 session

| Item | State |
|---|---|
| Live site | `footsteps.gallery` + `footsteps.stevecurrie2000.workers.dev` |
| Deployment model | Cloudflare **Worker**, auto-deploy via GitHub Actions on push to main |
| Phase 1 — Foundations | ✅ Done |
| Phase 2 — Country/city pages | ✅ Done |
| Phase 3 — Storage & database | ✅ Done |
| Phase 4 Slice 1 — Admin upload + Access | ✅ Done |
| Phase 4 Slice 2 — EXIF parsing | ✅ Done |
| Phase 4 Slice 3 — Nominatim geocoding + auto-create | ✅ Done |
| Phase 4 Slice 4 — Per-file review table | ✅ Done |
| Phase 4 Slice 5 — `/admin/countries` management | ✅ Done |
| Phase 5 — Family section + Access | ⏳ Not started — next session |
| Phase 6 — Polish | ⏳ Not started |
| Next immediate task | Start Phase 5 — family section structure + Cloudflare Access app |

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

## Phase 5: Family Section + Access ⏳

*Planned, not yet started.*

Will include:
- Cloudflare Access setup with shared password
- `/family` section mirroring public structure
- Routing logic to keep private photos out of public listings
- Image-serving route extended to honour Access claims for private
  photos (currently returns 404 for `is_public = 0`)

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

- **Family password**: To be set when Cloudflare Access configured in
  Phase 5.
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

## Lessons learned

**Documentation**

- Update the build log every session, not just at phase boundaries.
  Three undocumented sessions cost ~30 minutes of state reconstruction.
- End every Claude Code session with an explicit state summary: what
  changed, what external services were configured, what's unfinished.
  Paste it into the build log before closing.
- Keep the build log on disk (in the repo) as the source of truth, not
  only in claude.ai project knowledge.

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
