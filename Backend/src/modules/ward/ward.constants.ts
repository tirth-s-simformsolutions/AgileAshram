import { readFileSync } from 'fs';
import { join } from 'path';

export const SUCCESS_MSG = {
  SEED: 'wardSuccess.SEED',
  ALREADY_EXISTS: 'wardSuccess.ALREADY_EXISTS',
};

interface WardSeed {
  number: number;
  name: string;
  boundary: { type: 'Polygon'; coordinates: number[][][] };
}

interface GeoJsonFeature {
  properties?: { Name?: string };
  geometry: { type: string; coordinates: number[][][] };
}

/**
 * Loads real AMC ward boundaries from the bundled GeoJSON
 * (DataMeet, CC BY 4.0 — Ahmedabad/Wards.geojson, 48 wards).
 *
 * - `Name` is "<number> <NAME>" (e.g. "48 RAMOL HATHIJAN") → split into number + name.
 * - Positions are [lng, lat, elevation]; the elevation is stripped so MongoDB's
 *   2dsphere index gets clean 2D [lng, lat] positions.
 */
export function loadWards(): WardSeed[] {
  const filePath = join(__dirname, 'data', 'amc-wards.geojson');
  const geojson = JSON.parse(readFileSync(filePath, 'utf8')) as { features: GeoJsonFeature[] };

  return geojson.features.map(feature => {
    const rawName = String(feature.properties?.Name ?? '').trim();
    const match = rawName.match(/^(\d+)\s+(.*)$/);

    const coordinates = feature.geometry.coordinates.map(ring =>
      ring.map(position => [position[0], position[1]]),
    );

    return {
      number: match ? parseInt(match[1], 10) : 0,
      name: match ? match[2] : rawName,
      boundary: { type: 'Polygon', coordinates },
    };
  });
}
