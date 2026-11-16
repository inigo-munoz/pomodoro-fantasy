import { createApp } from './app.js';
import { boot } from './boot.js';
import { registerServiceWorker } from './pwa.js';

// The service worker first, so a fixed build can still reach a device whose save will not open.
registerServiceWorker();
boot(document.querySelector('#app'), { createApp });
