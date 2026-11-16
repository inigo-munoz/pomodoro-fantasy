import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { config } from './src/data/config.js';
import { musicCacheRule } from './src/platform/musicCache.js';
import { cspPlugin } from './src/platform/csp.js';

export default defineConfig({
  // Served from https://inigo-munoz.github.io/pomodoro-fantasy/, not from a domain root.
  base: '/pomodoro-fantasy/',
  plugins: [
    cspPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        // woff2 belongs here or the display font is a network request the offline app cannot make.
        // Music mp3 deliberately does NOT: the tracks run to tens of MB, and precaching them would make
        // every install carry every song the child may never choose. They are cached on first
        // play instead, by the rule below.
        // The sound effects are the exception: a few KB each, and a timer that cannot chime
        // offline would miss the one sound that matters.
        globPatterns: ['**/*.{js,css,html,webp,png,svg,woff2}', 'art/sfx/*.mp3'],
        runtimeCaching: [musicCacheRule(config)],
      },
      manifest: {
        name: 'Pomodoro Fantasy',
        short_name: 'Fantasy',
        display: 'standalone',
        // A tablet on a desk stand is usually landscape; the column layout works either way.
        orientation: 'any',
        background_color: '#1b1030',
        theme_color: '#1b1030',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
  test: { environment: 'jsdom' },
});
