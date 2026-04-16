// @/main.ts
// pnpm -F @webroamer/os-front-end dev
import './App';

import { initializeLocale } from '@webroamer/commons';

await initializeLocale();

window.document.body.innerHTML = '';

const app = window.document.createElement('os-root');

window.document.body.appendChild(app);
