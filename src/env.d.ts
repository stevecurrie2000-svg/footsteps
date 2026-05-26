/// <reference types="astro/client" />

// Cloudflare Workers bindings — mirrors the bindings declared in wrangler.jsonc
interface Env {
  DB: D1Database;
  PHOTOS: R2Bucket;
  ASSETS: Fetcher;
  CF_ACCESS_API_TOKEN?: string;
}

type Runtime = import('@astrojs/cloudflare').Runtime<Env>;

declare namespace App {
  interface Locals extends Runtime {}
}
