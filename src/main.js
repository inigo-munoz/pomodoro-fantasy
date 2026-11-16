import { createApp } from './app.js';
import { boot } from './boot.js';
import { registerServiceWorker } from './pwa.js';

// The service worker first, so a fixed build can still reach a device whose save will not open.
// Not in the Android app: its files ship inside it, and updates come from the store.
if (import.meta.env.MODE !== 'native') registerServiceWorker();
boot(document.querySelector('#app'), { createApp });
