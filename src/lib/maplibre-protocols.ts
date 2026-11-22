import { addProtocol } from 'maplibre-gl';
import { Protocol } from 'pmtiles';

// Sources with `pmtiles://` URLs (e.g. the PMTiles demo styles of MapLibre).
addProtocol('pmtiles', new Protocol().tile);
