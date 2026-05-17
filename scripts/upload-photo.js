// scripts/upload-photo.js — local upload tool for Footsteps
// Resizes a JPEG into four variants, uploads them to R2, and records
// the photo in D1. Runs locally against production; never touches wrangler --local.
//
// Usage:
//   node scripts/upload-photo.js <file> <country-slug> <city-slug> [--public] [--caption "text"]
//   node scripts/upload-photo.js "./photos/*.jpg" france paris --public

import 'dotenv/config';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, dirname, basename, join } from 'node:path';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import prompts from 'prompts';
import mime from 'mime-types';

// ─── Environment ──────────────────────────────────────────────────────────────

const ACCOUNT_ID  = process.env.CLOUDFLARE_ACCOUNT_ID;
const API_TOKEN   = process.env.CLOUDFLARE_API_TOKEN;
const R2_BUCKET   = process.env.R2_BUCKET;
const D1_DATABASE_ID = process.env.D1_DATABASE_ID;

for (const [name, val] of [
  ['CLOUDFLARE_ACCOUNT_ID', ACCOUNT_ID],
  ['CLOUDFLARE_API_TOKEN',  API_TOKEN],
  ['R2_BUCKET',             R2_BUCKET],
  ['D1_DATABASE_ID',        D1_DATABASE_ID],
]) {
  if (!val) {
    console.error(`Missing environment variable: ${name}\nCheck your .env file — see scripts/README.md for setup instructions.`);
    process.exit(1);
  }
}

// ─── Cloudflare API helpers ───────────────────────────────────────────────────

// Runs a parameterised SQL query against the production D1 database.
async function d1Query(sql, params = []) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1/database/${D1_DATABASE_ID}/query`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sql, params }),
  });
  const data = await res.json();
  if (!data.success) {
    throw new Error(`D1 query failed: ${JSON.stringify(data.errors)}`);
  }
  return data.result[0]; // { results: [...], success, meta: { last_row_id, ... } }
}

// Uploads a buffer to R2 under the given key.
async function r2Put(key, buffer, contentType = 'image/jpeg') {
  const url = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/r2/buckets/${R2_BUCKET}/objects/${encodeURIComponent(key)}`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${API_TOKEN}`,
      'Content-Type': contentType,
    },
    body: buffer,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`R2 upload failed for '${key}' [${res.status}]: ${body}`);
  }
}

// Deletes a key from R2. Best-effort — used for cleanup on partial failure.
async function r2Delete(key) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/r2/buckets/${R2_BUCKET}/objects/${encodeURIComponent(key)}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${API_TOKEN}` },
  });
  if (!res.ok) {
    console.warn(`  Warning: could not delete '${key}' from R2 during cleanup.`);
  }
}

// ─── Country / city resolution ────────────────────────────────────────────────

const countryCache = new Map();
const cityCache    = new Map();

// Converts a slug like "united-kingdom" into "United Kingdom" for prompts.
function humanise(slug) {
  return slug.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
}

// Looks up a country by slug, prompting to create it if missing.
// Returns { id, name } or null if the user declines creation.
async function resolveCountry(slug) {
  if (countryCache.has(slug)) return countryCache.get(slug);

  const { results } = await d1Query(
    'SELECT id, name FROM countries WHERE slug = ?', [slug]
  );

  if (results.length > 0) {
    countryCache.set(slug, results[0]);
    return results[0];
  }

  const response = await prompts([
    {
      type: 'confirm',
      name: 'create',
      message: `Country '${slug}' doesn't exist. Create it?`,
      initial: true,
    },
    {
      type: (prev) => (prev ? 'text' : null),
      name: 'name',
      message: 'Country name:',
      initial: humanise(slug),
    },
  ], { onCancel: () => process.exit(0) });

  if (!response.create) return null;

  // Pick the next sort_order in increments of 10, leaving room between entries
  const { meta } = await d1Query(
    `INSERT INTO countries (slug, name, sort_order)
     VALUES (?, ?, (SELECT COALESCE(MAX(sort_order), 0) + 10 FROM countries))`,
    [slug, response.name]
  );
  const country = { id: meta.last_row_id, name: response.name };
  countryCache.set(slug, country);
  console.log(`  Created country: ${response.name}`);
  return country;
}

// Looks up a city by slug within a country, prompting to create if missing.
// Returns { id, name } or null if the user declines creation.
async function resolveCity(countryId, countryName, slug) {
  const cacheKey = `${countryId}:${slug}`;
  if (cityCache.has(cacheKey)) return cityCache.get(cacheKey);

  const { results } = await d1Query(
    'SELECT id, name FROM cities WHERE country_id = ? AND slug = ?',
    [countryId, slug]
  );

  if (results.length > 0) {
    cityCache.set(cacheKey, results[0]);
    return results[0];
  }

  const response = await prompts([
    {
      type: 'confirm',
      name: 'create',
      message: `City '${slug}' in ${countryName} doesn't exist. Create it?`,
      initial: true,
    },
    {
      type: (prev) => (prev ? 'text' : null),
      name: 'name',
      message: 'City name:',
      initial: humanise(slug),
    },
  ], { onCancel: () => process.exit(0) });

  if (!response.create) return null;

  const { meta } = await d1Query(
    'INSERT INTO cities (country_id, slug, name) VALUES (?, ?, ?)',
    [countryId, slug, response.name]
  );
  const city = { id: meta.last_row_id, name: response.name };
  cityCache.set(cacheKey, city);
  console.log(`  Created city: ${response.name}`);
  return city;
}

// ─── Image processing ─────────────────────────────────────────────────────────

// The four size targets. sharp strips EXIF by default on resize, which is
// what we want for thumb/medium/full. The original is kept untouched.
const VARIANTS = [
  { suffix: 'thumb',  width: 800  },
  { suffix: 'medium', width: 1200 },
  { suffix: 'full',   width: 2400 },
];

// ─── Per-photo pipeline ───────────────────────────────────────────────────────

async function processPhoto(filePath, countrySlug, citySlug, isPublic, caption) {
  const absPath  = resolve(filePath);
  const filename = basename(filePath);

  // 1. Validate the file exists
  if (!existsSync(absPath)) {
    console.error(`  ✗ File not found: ${filePath}`);
    return false;
  }

  // 2. Validate it's a JPEG (by extension and by content)
  const mimeType = mime.lookup(absPath) || '';
  if (mimeType !== 'image/jpeg') {
    console.warn(`  ⚠ Skipping — not a JPEG (detected: ${mimeType || 'unknown'})`);
    return false;
  }

  let metadata;
  try {
    metadata = await sharp(absPath).metadata();
  } catch (err) {
    console.warn(`  ⚠ Skipping — could not read image: ${err.message}`);
    return false;
  }
  if (metadata.format !== 'jpeg') {
    console.warn(`  ⚠ Skipping — sharp reports format '${metadata.format}', expected jpeg`);
    return false;
  }

  // 3. EXIF — Phase 4 will parse capture_date, latitude, longitude from the
  //    raw EXIF buffer. For now we store nulls.
  const captureDate = null;
  const latitude    = null;
  const longitude   = null;

  // 4. Resolve country + city (prompt to create if missing, cache for batch)
  const country = await resolveCountry(countrySlug);
  if (!country) {
    console.log(`  → Skipping (country creation declined)`);
    return false;
  }

  const city = await resolveCity(country.id, country.name, citySlug);
  if (!city) {
    console.log(`  → Skipping (city creation declined)`);
    return false;
  }

  // 5. Generate UUID and derive R2 keys for all four variants
  const photoId = uuidv4();
  const keys = {
    thumb:    `${photoId}-thumb.jpg`,
    medium:   `${photoId}-medium.jpg`,
    full:     `${photoId}-full.jpg`,
    original: `${photoId}-original.jpg`,
  };

  // 6. Build resized buffers. sharp strips EXIF on resize by default.
  //    withoutEnlargement ensures we never upscale a small source image.
  const buffers = {};
  for (const { suffix, width } of VARIANTS) {
    let pipeline = sharp(absPath);
    if ((metadata.width ?? Infinity) > width) {
      pipeline = pipeline.resize(width, null, { withoutEnlargement: true });
    }
    buffers[keys[suffix]] = await pipeline.jpeg({ quality: 85 }).toBuffer();
  }
  // Original: read the file directly — no processing, EXIF preserved
  buffers[keys.original] = readFileSync(absPath);

  // 7. Upload all four variants to R2, cleaning up on partial failure
  const uploadedKeys = [];
  try {
    for (const [key, buffer] of Object.entries(buffers)) {
      process.stdout.write(`  Uploading ${key} ...`);
      await r2Put(key, buffer, 'image/jpeg');
      uploadedKeys.push(key);
      process.stdout.write(' ✓\n');
    }
  } catch (err) {
    process.stdout.write('\n');
    console.error(`  ✗ Upload error: ${err.message}`);
    if (uploadedKeys.length > 0) {
      console.log(`  Cleaning up ${uploadedKeys.length} partial upload(s)...`);
      for (const key of uploadedKeys) await r2Delete(key);
    }
    return false;
  }

  // 8. Insert the photo row into D1
  try {
    await d1Query(
      `INSERT INTO photos
         (id, city_id, country_id, capture_date, caption, is_public,
          latitude, longitude, original_filename,
          r2_key_thumb, r2_key_medium, r2_key_full, r2_key_original)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        photoId, city.id, country.id,
        captureDate, caption ?? null, isPublic ? 1 : 0,
        latitude, longitude, filename,
        keys.thumb, keys.medium, keys.full, keys.original,
      ]
    );
  } catch (err) {
    console.error(`  ✗ D1 insert failed: ${err.message}`);
    for (const key of Object.values(keys)) await r2Delete(key);
    return false;
  }

  // 9. If this country has no thumbnail yet, use this photo as the default
  await d1Query(
    'UPDATE countries SET thumbnail_photo_id = ? WHERE id = ? AND thumbnail_photo_id IS NULL',
    [photoId, country.id]
  );

  const visibility = isPublic ? 'public' : 'private';
  console.log(`  ✓ ${filename} → ${countrySlug}/${citySlug} (${visibility})`);
  return true;
}

// ─── CLI ──────────────────────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);

  if (args.length < 3) {
    console.error([
      '',
      'Usage:',
      '  node scripts/upload-photo.js <file> <country-slug> <city-slug> [--public] [--caption "text"]',
      '',
      'Examples:',
      '  node scripts/upload-photo.js ./photos/paris.jpg france paris',
      '  node scripts/upload-photo.js "./photos/*.jpg" france paris --public',
      '  node scripts/upload-photo.js ./photo.jpg united-kingdom london --public --caption "Tower Bridge at dusk"',
      '',
    ].join('\n'));
    process.exit(1);
  }

  const [filePattern, countrySlug, citySlug, ...rest] = args;

  const slugRe = /^[a-z0-9]+(-[a-z0-9]+)*$/;
  if (!slugRe.test(countrySlug)) {
    console.error(`Invalid country slug '${countrySlug}' — use lowercase letters and hyphens only (e.g. united-kingdom)`);
    process.exit(1);
  }
  if (!slugRe.test(citySlug)) {
    console.error(`Invalid city slug '${citySlug}' — use lowercase letters and hyphens only (e.g. new-york)`);
    process.exit(1);
  }

  const isPublic    = rest.includes('--public');
  const captionIdx  = rest.indexOf('--caption');
  const caption     = captionIdx !== -1 ? rest[captionIdx + 1] ?? null : null;

  return { filePattern, countrySlug, citySlug, isPublic, caption };
}

// Expands a glob pattern like "./photos/*.jpg" into a list of file paths.
// Handles only the simple *.ext pattern; anything more complex is treated as literal.
function expandGlob(pattern) {
  if (!pattern.includes('*')) return [pattern];

  const dir    = dirname(pattern) || '.';
  const suffix = basename(pattern).replace(/\*/g, '');

  try {
    return readdirSync(dir)
      .filter(f => f.toLowerCase().endsWith(suffix.toLowerCase()))
      .sort()
      .map(f => join(dir, f));
  } catch {
    console.error(`Could not list directory: ${dir}`);
    process.exit(1);
  }
}

async function main() {
  const { filePattern, countrySlug, citySlug, isPublic, caption } = parseArgs();
  const files = expandGlob(filePattern);

  if (files.length === 0) {
    console.error(`No files matched: ${filePattern}`);
    process.exit(1);
  }

  const plural = files.length === 1 ? 'file' : 'files';
  console.log(`\nUploading ${files.length} ${plural} → ${countrySlug}/${citySlug}\n`);

  let uploaded = 0;
  let skipped  = 0;

  for (const file of files) {
    console.log(`Processing: ${basename(file)}`);
    const ok = await processPhoto(file, countrySlug, citySlug, isPublic, caption);
    if (ok) uploaded++;
    else skipped++;
    console.log();
  }

  console.log(`Done — ${uploaded} uploaded, ${skipped} skipped.`);
  if (uploaded > 0) {
    console.log(`View at: https://footsteps.gallery/countries/${countrySlug}`);
  }
}

main().catch(err => {
  console.error(`\nFatal error: ${err.message}`);
  process.exit(1);
});
