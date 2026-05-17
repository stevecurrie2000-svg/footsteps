# Upload script

Local tool for adding photos to Footsteps. Runs on your laptop and talks directly
to the production Cloudflare D1 (database) and R2 (photo storage) via the API.

---

## 1. Set up credentials

### Find your Account ID
1. Log into [dash.cloudflare.com](https://dash.cloudflare.com)
2. On any page, look at the **right-hand sidebar** — your Account ID is listed there
3. Alternatively: click your account name in the top-left → the ID appears in the URL

### Create an API token
1. Go to [dash.cloudflare.com/profile/api-tokens](https://dash.cloudflare.com/profile/api-tokens)
2. Click **Create Token** → choose **Custom token**
3. Give it a name, e.g. `footsteps-upload`
4. Under **Permissions**, add:
   - Account → **D1** → Edit
   - Account → **R2 Storage** → Edit
5. Under **Account Resources**, set it to your specific account (not "All accounts")
6. Click **Continue to summary** → **Create Token**
7. Copy the token — you only see it once

### Fill in `.env`
Edit the `.env` file at the project root:

```
CLOUDFLARE_ACCOUNT_ID=abc123...        ← from step above
CLOUDFLARE_API_TOKEN=your-token-here   ← from step above
R2_BUCKET=footsteps-photos
D1_DATABASE_ID=88724f39-402b-45a0-b75b-e9309e4686e3
```

The `.env` file is in `.gitignore` and will never be committed.

---

## 2. Usage

### Single photo
```
node scripts/upload-photo.js <file-path> <country-slug> <city-slug> [--public] [--caption "text"]
```

### Bulk (all JPEGs in a folder)
```
node scripts/upload-photo.js "./photos/*.jpg" <country-slug> <city-slug>
```

### Examples
```bash
# Upload privately (default) — review before publishing
node scripts/upload-photo.js ./photos/paris-001.jpg france paris

# Upload and make immediately public, with a caption
node scripts/upload-photo.js ./photos/london-042.jpg united-kingdom london --public --caption "Tower Bridge at dusk"

# Bulk upload an entire folder, all public
node scripts/upload-photo.js "./photos/rome/*.jpg" italy rome --public
```

---

## 3. Flags

| Flag | Description |
|---|---|
| `--public` | Makes the photo visible on the site immediately. Omit to upload privately (safe default). |
| `--caption "text"` | Optional caption shown under the photo. |

---

## 4. What happens

For each JPEG file:

1. Validates the file is a JPEG
2. Checks the country/city slugs exist in D1 — prompts to create them if not
3. Generates four variants with [sharp](https://sharp.pixelplumbing.com/):
   - **Thumbnail** — 800px wide, quality 85, EXIF stripped
   - **Medium** — 1200px wide, quality 85, EXIF stripped
   - **Full** — 2400px wide, quality 85, EXIF stripped
   - **Original** — untouched, EXIF preserved
4. Uploads all four to R2 as `{uuid}-thumb.jpg`, `{uuid}-medium.jpg`, etc.
5. Inserts a row into the D1 `photos` table
6. If the country has no thumbnail yet, sets this photo as the default thumbnail

---

## 5. Where photos end up

- **R2**: `footsteps-photos` bucket, four objects per photo (thumb/medium/full/original)
- **D1**: one row in the `photos` table, with `is_public = 0` unless `--public` was passed

To see what's in R2:
```
npx wrangler r2 object list footsteps-photos
```

To query photos in D1:
```
npx wrangler d1 execute footsteps-db --remote --command="SELECT id, original_filename, is_public FROM photos ORDER BY created_at DESC LIMIT 20;"
```

---

## 6. Making a private photo public

After uploading without `--public`, flip the flag in D1:

```
npx wrangler d1 execute footsteps-db --remote --command="UPDATE photos SET is_public = 1 WHERE id = '<uuid>';"
```

The site reads `is_public` on every request, so the photo appears immediately — no redeploy needed.

---

## 7. Deleting a photo

There's no delete command yet (Phase 4). To delete manually:

**Step 1 — Remove from D1:**
```
npx wrangler d1 execute footsteps-db --remote --command="DELETE FROM photos WHERE id = '<uuid>';"
```

**Step 2 — Remove all four variants from R2:**
```
npx wrangler r2 object delete footsteps-photos <uuid>-thumb.jpg
npx wrangler r2 object delete footsteps-photos <uuid>-medium.jpg
npx wrangler r2 object delete footsteps-photos <uuid>-full.jpg
npx wrangler r2 object delete footsteps-photos <uuid>-original.jpg
```

**Step 3 — If it was a country thumbnail**, clear the reference:
```
npx wrangler d1 execute footsteps-db --remote --command="UPDATE countries SET thumbnail_photo_id = NULL WHERE thumbnail_photo_id = '<uuid>';"
```
