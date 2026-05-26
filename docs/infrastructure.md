# Infrastructure reference

A reference for the credentials, accounts, and identifiers that
underpin **Footsteps**. Written for future-you, having forgotten
most of this, needing to rotate a key or troubleshoot an outage.

**Last updated**: 27 May 2026

---

## Accounts and ownership

| Service | Owner email | Notes |
|---|---|---|
| Cloudflare | `stevecurrie2000@gmail.com` | Single account, all resources |
| GitHub | `stevecurrie2000@gmail.com` | Username: `stevecurrie2000-svg` |
| MapTiler | `stevecurrie2000@gmail.com` | Free tier (100k tiles/month) |
| Google (SSO IdP) | `stevecurrie2000@gmail.com` | The IdP used by Cloudflare Access |

A single email failure (password reset, account lockout) would
affect every service — they are not independent. Keep the recovery
email and 2FA backup codes for `stevecurrie2000@gmail.com` somewhere
safe and accessible outside Google.

---

## Cloudflare account

- **Account ID**: `873b7aeacb430d54a2754ed115518e7e`
- **Owner email**: `stevecurrie2000@gmail.com`
- **Console**: https://dash.cloudflare.com/

This account holds the Worker, the D1 database, the R2 bucket, the
KV namespace, the Web Analytics site, both Access apps, the
registered domain, and the API tokens.

---

## Domain

- **Name**: `footsteps.gallery`
- **Registrar**: Cloudflare Registrar (within the same account)
- **DNS**: Cloudflare-managed (orange-cloud proxied where applicable)
- **Workers route**: `footsteps.gallery/*` → Worker named `footsteps`.
  Configured via Cloudflare dashboard (NOT in `wrangler.jsonc`)
- **Public access URL also resolvable at**: `footsteps.stevecurrie2000.workers.dev`

Annual renewal — Cloudflare Registrar charges at-cost (~AU$15-20/yr).
Cloudflare emails the owner address 60/30/7 days before expiry.

---

## Worker

- **Name**: `footsteps`
- **Source**: GitHub repo `stevecurrie2000-svg/footsteps`
- **Config file**: `wrangler.jsonc` at repo root
- **Compatibility date**: `2025-01-01`
- **Deploy mechanism**: GitHub Actions auto-deploys on push to `main`

**Bindings declared in `wrangler.jsonc`**:

| Binding name | Type | Resource |
|---|---|---|
| `ASSETS` | Static assets | `./dist/client` |
| `DB` | D1 | `footsteps-db` |
| `PHOTOS` | R2 | `footsteps-photos` |
| `SESSION` | KV | UUID `2f4c26f795e2448d9bb59e4ef074913b` |

**Secrets bound at runtime** (not in `wrangler.jsonc`; managed via
`wrangler secret put`):

- `CF_ACCESS_API_TOKEN` — Cloudflare API token used by `/admin/access`
  (see "API tokens" below)

To list secrets currently bound: `npx wrangler secret list`.

---

## D1 database

- **Name**: `footsteps-db`
- **UUID**: `88724f39-402b-45a0-b75b-e9309e4686e3`
- **Created**: 17 May 2026
- **Migrations directory**: `migrations/` in repo

To run a query: `npx wrangler d1 execute footsteps-db --remote --command "SELECT ..."`.
For local dev: drop `--remote`.

---

## R2 bucket

- **Name**: `footsteps-photos`
- **Created**: 17 May 2026
- **Cost note**: free under 10 GB; ~AU$0.023/GB/month above that

Stores the four image variants per photo (thumb, medium, full,
original). Keys follow `photos/{photo_id}/{variant}.jpg` shape.

---

## Cloudflare Access apps

Two distinct apps, each gating a different surface. Both authenticate
against the same Google SSO identity provider.

### Footsteps Admin

- **App ID**: `1b2e3b52-7716-42bd-ab3a-97e226669f70`
- **AUD**: `bafdabb557e52a26bdc2a4dba3f5f14c4d134c7516c0fe88c8fdf1d81f9a8152`
- **Gates**: `footsteps.gallery/admin/*`, `footsteps.gallery/api/admin/*`,
  `footsteps.gallery/admin`
- **Policy**: "Admin only" — `stevecurrie2000@gmail.com` only
- **Session duration**: 24h

### Footsteps Private

- **App ID**: `5e4b7765-0fdf-41c4-ba72-59eb8b2ff989`
- **AUD**: `df9c357e79378370ed071fbab914a7d3cbdc3d10bc0b8768abf0402dc9f53277`
- **Gates**: `footsteps.gallery/private`, `footsteps.gallery/private/*`,
  `footsteps.gallery/api/private/*`, `footsteps.gallery/i/*`
- **Policy**: "Private viewers" (reusable; policy ID
  `76191195-0f7d-41d3-bc18-4e9e30c222a5`) — Gmail allowlist of
  family + friends
- **Session duration**: 24h
- **Important**: this policy is `reusable: true`. Updates via API
  must use the account-scoped endpoint
  `/accounts/{aid}/access/policies/{pid}`, NOT the per-app endpoint
  `/accounts/{aid}/access/apps/{aid}/policies/{pid}`. The per-app
  endpoint returns 400 with error code 12130 for reusable policies.
  Detail learned via pre-flight 27 May 2026.

To manage the Private allowlist: use `/admin/access` on the site
itself (preferred), or fall back to Zero Trust → Access → Policies →
Private viewers in the Cloudflare dashboard.

---

## API tokens

All under the same Cloudflare account.

### `footsteps-github-actions-deploy`

- **Purpose**: GitHub Actions deploys the Worker on push to main
- **Scope**: D1, Workers KV Storage, plus deploy permissions
- **Resource scope**: Single account (`stevecurrie2000@gmail.com`)
- **TTL**: No expiry
- **Stored at**: GitHub repo → Settings → Secrets and variables →
  Actions → `CLOUDFLARE_API_TOKEN`
- **Created**: Phase 3 (~17 May 2026)

To rotate: create a replacement token in Cloudflare with the same
scopes, update the GitHub secret, verify a deploy succeeds, then
delete the old token. Do not delete the old token first — a failed
GitHub deploy is a real outage.

### `footsteps-access-api-2026-05`

- **Purpose**: Powers the `/admin/access` page — reads and writes
  the Footsteps Private allowlist; reads Access audit logs
- **Scopes**: `Access: Apps and Policies — Edit`,
  `Access: Audit Logs — Read`
- **Resource scope**: All accounts (effectively this account)
- **TTL**: ~12 months — expires **1 April 2027** (Cloudflare's date
  picker rounded down from the requested 27 May 2027)
- **Stored at**: Worker secret `CF_ACCESS_API_TOKEN`
- **Created**: 27 May 2026

To rotate: create a replacement token with the same two scopes and a
new TTL, then `npx wrangler secret put CF_ACCESS_API_TOKEN` and paste
the new value. Verify by loading `/admin/access` and confirming the
user list still appears. Then delete the old token from Cloudflare.

**Calendar reminder**: set for ~1 March 2027 (~30 days before
expiry) to rotate before lapse.

---

## Web Analytics

- **Provider**: Cloudflare Web Analytics
- **Site UUID**: see Cloudflare dashboard → Analytics & Logs →
  Web Analytics → site list. (Recorded here once captured.)
- **Beacon location**: `BaseLayout.astro` SSR template, conditional
  on `!isAdmin && !isPrivate` — only public pages
- **Excluded surfaces**: `/admin/*` (signal noise), `/private/*`
  (named-allowlist privacy)
- **Cost**: free tier

To pause / unpause: Cloudflare dashboard → Web Analytics → site →
Settings. Source-code disable: comment the beacon snippet in
`src/layouts/BaseLayout.astro`.

---

## MapTiler

- **Purpose**: Vector tiles for the public homepage map
- **Account**: `stevecurrie2000@gmail.com`
- **Console**: https://cloud.maptiler.com/
- **API key**: stored as the constant inside `src/pages/index.astro`
  (intentionally public — MapTiler keys are referrer-restricted, not
  secret)
- **Restrictions**: configured to allow only `footsteps.gallery`
  and `footsteps.stevecurrie2000.workers.dev` referrers
- **Cost**: free tier (100k tile loads/month). Current usage
  comfortably under

To rotate: MapTiler console → Keys → new key with same referrer
restrictions → update the constant in `src/pages/index.astro` →
verify map loads → delete old key.

---

## GitHub

- **Repo**: `stevecurrie2000-svg/footsteps`
- **Branch**: `main` (only branch in use; no protection rules)
- **Workflow**: `.github/workflows/deploy.yml` — Node 22, uses
  `cloudflare/wrangler-action@v3` for deploy auth
- **Secrets**: `CLOUDFLARE_API_TOKEN` (the
  `footsteps-github-actions-deploy` Cloudflare token); plus
  `CLOUDFLARE_ACCOUNT_ID` (`873b7aeacb430d54a2754ed115518e7e`)
- **Deploy trigger**: push to main

---

## Historical references

For full architecture lineage, see:
- `docs/build-log.md` — session-by-session history
- `docs/archive/` — superseded snapshots (e.g.
  `2026-05_architecture_post_phase_3.svg`)

---

## Things deliberately NOT documented here

These would be either security risks if recorded or are sufficiently
context-dependent that recording them would mislead:

- The actual API token values (rotate via Cloudflare → re-bind via
  `wrangler secret put`)
- The Worker secret values themselves (write-only via `wrangler
  secret put`; never readable after creation)
- The Cloudflare account password (lives in your password manager)
- Google 2FA backup codes (live in your password manager / printed
  somewhere safe)
- The Gmail allowlist for `/private` — the `/admin/access` UI is the
  source of truth, and family/friend email addresses are
  unnecessary to put in a repo committed to GitHub

If any of the above need recovery, work back from password manager +
Cloudflare's "Last used" telemetry per token.