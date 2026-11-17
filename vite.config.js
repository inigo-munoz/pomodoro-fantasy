import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { config } from './src/data/config.js';
import { musicCacheRule } from './src/platform/musicCache.js';
import { cspPlugin } from './src/platform/csp.js';

// `vite build --mode native` builds the Android app (Capacitor): assets from the app root, no
// service worker (the files ship inside the app), into dist-native/ for Capacitor to copy.
export default defineConfig(({ mode }) => ({
  // The web app is served from https://inigo-munoz.github.io/pomodoro-fantasy/, not a root.
  base: mode === 'native' ? '/' : '/pomodoro-fantasy/',
  build: { outDir: mode === 'native' ? 'dist-native' : 'dist' },
  plugins: [
    cspPlugin(),
    VitePWA({
      disable: mode === 'native',
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
          // Android masks home-screen icons (circle, squircle…); these keep the dragon inside
          // the safe zone on a soft background made from the icon itself.
          { src: 'icon-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  test: { environment: 'jsdom' },
}));
