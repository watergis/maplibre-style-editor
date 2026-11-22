import { setWorkerUrl } from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';

// MapLibre GL JS finds its worker next to its own module, which is not where Vite serves it once
// bundled: point MapLibre to the worker bundled by Vite.
setWorkerUrl(workerUrl);
