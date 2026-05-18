# Footsteps — Build Log

A running record of what's been done, decisions made, and lessons
learned. Updated at the end of every session, not just at phase
boundaries.

---

## Current snapshot

**Last updated**: 18 May 2026, end of Phase 4 Slice 1 build session

| Item | State |
|---|---|
| Live site | `footsteps.gallery` + `footsteps.stevecurrie2000.workers.dev` |
| Deployment model | Cloudflare **Worker** (not Pages), auto-deploy via GitHub Actions on push to main |
| Phase 1 — Foundations | ✅ Done |
| Phase 2 — Country/city pages | ✅ Done |
| Phase 3 — Storage & database | ✅ Done — first photo live |
| Phase 4 — Admin upload pipeline | 🔄 Slice 1 substantially complete, Slices 2–5 pending |
| Phase 5 — Family section + Access | ⏳ Not started |
| Phase 6 — Polish | ⏳ Not started |
| Next immediate task | Cloudflare cache purge + final Slice 1 verification, then start Slice 2 — EXIF parsing on upload |

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
