// @ts-check
import { defineConfig } from 'astro/config';

// Statische Seite: wird beim Build komplett vorgerendert und kann auf GitHub Pages oder Cloudflare Pages liegen.
export default defineConfig({
  site: 'https://davidstaufer.de',
  output: 'static',
  devToolbar: { enabled: false },
  // three.js ist allein schon rund 700 kB groß, das ist für die 3D-Seite gewollt
  vite: { build: { chunkSizeWarningLimit: 900 } },
});
