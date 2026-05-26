## 2. Design Aesthetic — Dark Photographer Style

- **Background**: True black or very dark charcoal (`#0a0a0a`)
- **Text**: Off-white (`#fafafa`)
- **Typography**: Playfair Display (headings, serif) + Inter (body, sans-serif)
- **Layout**: Full-bleed hero images, generous white space, minimal chrome
- **Country grid**: Large square thumbnails with country name overlaid on hover
- **Photo grid**: Masonry layout (photos flow naturally regardless of orientation)
- **Lightbox**: Full-screen photo viewer with arrow-key navigation (planned, Phase 6)
- **Captions**: City/town shown in small caps below each photo
- **Private routes**: Warm amber nav tint (`bg-amber-950/10`) to visually distinguish from public

## 3. Auto-Country Detection (Core Feature)

On photo upload:
1. System reads EXIF metadata
2. Extracts GPS coordinates (latitude/longitude)
3. Reverse-geocodes via Nominatim (free) to determine country + city
4. If country doesn't exist yet → creates a new country section, uses this photo as default thumbnail
5. If it exists → adds to that country, slots into the right city
6. **Override capability**: change country thumbnail anytime; edit city/country/audience post-upload via `/admin/photos`

**Fallback**: If photo has no GPS data, EXIF GPS, or Nominatim can't resolve the city, the admin review table surfaces an appropriate toast and the upload proceeds with manual country/city pick.

**Geocode resolution chain**: `city → town → village → suburb → hamlet → municipality → county → borough`. Suburb-preference rule: if `suburb` is present and differs from `city`, prefer `suburb` (e.g. Marrickville vs. Sydney).

## 4. Admin Panel

Auth-gated (Cloudflare Access + Google SSO + email allowlist) admin area where Steve can:
- **Drag-and-drop batch upload** (`/admin`) — drop a folder of photos, per-row metadata review before commit
- **Photo management** (`/admin/photos`, Phase 6) — contact-sheet grid with edit modal for country/city/audience/caption, infinite scroll, filter chips, inline city creation
- **Country management** (`/admin/countries`) — rename, delete, change public/private thumbnail, add city, manage photos per city
- **Subtle admin nav strip** across all `/admin/*` pages (Upload | Photos | Countries)

## 5. Standard Features Included

- Client-side image resize to four R2 variants (thumb, medium, full, original)
- Responsive design (phone, tablet, desktop)
- Lazy loading (planned, Phase 6)
- EXIF preservation (stored in D1, hidden by default)
- Image protection (right-click disabled, watermark option — to be decided)
- SEO basics for public side
- Cloudflare's privacy-friendly analytics (planned, Phase 6)
- Custom 404 page (planned, Phase 6)
- Loading skeletons (planned, Phase 6)

## 6. Tech Stack

| Component | Choice |
|---|---|
| Framework | Astro v6 |
| Styling | Tailwind CSS v4 |
| Image processing | Client-side `<canvas>` resize at upload time |
| Storage | Cloudflare R2 (bucket: `footsteps-photos`) |
| Database | Cloudflare D1 (database: `footsteps-db`) |
| Backend logic | Cloudflare Workers |
| Hosting | Cloudflare Workers (auto-deploy via GitHub Actions on push to main) |
| Auth | Cloudflare Access with Google SSO, per-email allowlist |
| Geocoding | Nominatim (free, ~1 req/sec fair-use) |

## 7. Cost Estimate

~AU$15-20/year for domain (already purchased — `footsteps.gallery`). Everything else within Cloudflare free tiers unless storage exceeds 10GB (then ~AU$0.023/GB/month on R2).

## 8. Build Phases

1. **Phase 1** ✅ — Astro + Tailwind + dark theme + initial deploy
2. **Phase 2** ✅ — Country grid + country/city pages
3. **Phase 3** ✅ — Cloudflare R2 + D1 setup, image-serving Worker proxy
4. **Phase 4** ✅ — Admin upload pipeline: Cloudflare Access auth, EXIF parsing, Nominatim geocoding + auto-create, per-file review table, `/admin/countries` management page
5. **Phase 5** ✅ — Private section + Cloudflare Access (Google SSO, 4-email allowlist)
6. **Phase 6** 🔄 — Polish: `/admin/photos` page (in progress), lightbox, lazy loading + Astro `<Image>`, custom 404, Cloudflare Analytics, JWT signature validation for admin/private auth
7. **Phase 7** ⏳ — Public homepage map view (dynamic pins at photo locations, fit-to-bounds, click-through to country pages)

## 9. Key Decisions Made

- Photos only for v1 (videos deferred)
- Country is the top-level organising principle
- Within country: cities (auto-detected from GPS)
- Public/private is access layer over the same country/city structure
- Per-email Google SSO allowlist for private (not shared password) — enables named access logs and per-person revocation
- "Private" terminology (over "Family") — close friends may be granted access too
- City/town shown in small caps under photos (not country, which is contextual)
- Dark photographer aesthetic confirmed
- Weekly upload batches expected
- Sequential client-side upload (one POST at a time) — avoids hammering R2 with parallel PUTs
- One photo belongs to exactly one audience (public OR private, not both)
- Country and city auto-create silently on upload; manual overrides via `/admin/photos`
- First photo for a new country sets the private thumbnail unconditionally, and the public thumbnail if the photo is public
- Build-log discipline: every session entry includes date AND time (e.g. "22 May 2026, 21:00") from Phase 4 Slice 5 onwards

## 9a. Planned for Phase 7 — Public Map View

A dynamic map on the public homepage (`/`) showing pins at the locations where Steve has photographed. Sits at the top of the homepage, with the country thumbnail grid underneath.

### Design intent

- **Auto-frames to existing data**: with photos only in UK, the map shows the UK at a sensible zoom. When Greek photos arrive, the map expands to include Greece. When Australian photos arrive, it zooms out to a world view. Driven by the bounds of all photo GPS coordinates in D1.
- **Pin granularity**: per-city (one pin per city with photos, not per-photo). Avoids clutter when there are many photos in one location.
- **Click behaviour**: tapping a pin navigates to that pin's country page. Possibly with a tooltip preview (photo count, country name) on hover or initial tap.

### Tentative tech direction

- **Map library**: MapLibre GL JS (vector, dark-theme-capable, better suited to the photographer aesthetic than Leaflet)
- **Tile provider**: MapTiler free tier (100k tiles/month) or another OSM-vector provider
- **Lazy-loaded**: render a static placeholder on first paint; hydrate the interactive map after, so homepage first-paint stays fast
- **Pin data**: pre-computed server-side from D1 in the existing homepage Astro page (no extra round-trip)

### When to build

After 100+ photos exist across 5+ countries. The map needs to be designed from real data — its visual density and the geographic shape of the journey only become clear at scale. Until then, the country thumbnail grid is sufficient.

### Schema readiness

D1 schema already supports this: `photos.latitude` and `photos.longitude` exist (Phase 4 Slice 2), and `cities.country_id` is indexed. No migrations required when the build starts.

### Out of scope for Phase 7 (v1)

- Per-photo pins with clustering (could be Phase 7 v2 if useful)
- Lightbox-from-pin photo viewer
- Animated transitions between countries
- Heat-map / density visualisation
- A private equivalent map on `/private`

The Phase 7 v1 is the simplest version that delivers the "where I've been" narrative on the public homepage.

## 10. Domain Status

✅ **Live**: `footsteps.gallery` (Cloudflare Registrar). Also accessible via `footsteps.stevecurrie2000.workers.dev`.