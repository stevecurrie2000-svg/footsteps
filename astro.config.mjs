// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  // 'server' mode with the Cloudflare adapter compiles to a Worker.
  // Static pages opt back in via `export const prerender = true`.
  output: 'server',
  adapter: cloudflare({ imageService: 'cloudflare' }),
  vite: {
    plugins: [tailwindcss()]
  }
});
