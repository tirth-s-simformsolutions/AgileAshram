// Verifies an uploaded complaint photo was actually taken at the reported
// location/time, using its EXIF metadata. No EXIF GPS → we can't verify, so accept.

export interface GeoTimeRef {
  lat: number;
  lng: number;
  toleranceMeters?: number; // default 100
  timeWindowMs?: number; // default 1 hour
  now?: number; // injectable for tests; defaults to Date.now()
}

export type GeoTimeResult =
  | { ok: true; reason: 'no-metadata' | 'match' }
  | { ok: false; reason: 'location' | 'time' };

const EARTH_RADIUS_M = 6_371_000;
const DEFAULT_TOLERANCE_M = 100;
const DEFAULT_TIME_WINDOW_MS = 60 * 60 * 1000;

function distanceMeters(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const lat1 = toRad(aLat);
  const lat2 = toRad(bLat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Browser-only. Reads EXIF GPS + capture time and checks them against the
 * reported location and the current time.
 *  - no GPS in EXIF            → accept (nothing to verify)
 *  - GPS > tolerance away      → reject ('location')
 *  - capture time > window old → reject ('time')   (only when a timestamp exists)
 */
export async function checkImageGeoTime(file: File, ref: GeoTimeRef): Promise<GeoTimeResult> {
  let exif: Record<string, unknown> | undefined;
  try {
    const exifr = (await import('exifr')).default;
    exif = await exifr.parse(file, { tiff: true, exif: true, gps: true });
  } catch {
    return { ok: true, reason: 'no-metadata' };
  }

  const lat = exif?.['latitude'] as number | undefined;
  const lng = exif?.['longitude'] as number | undefined;
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return { ok: true, reason: 'no-metadata' };
  }

  const tolerance = ref.toleranceMeters ?? DEFAULT_TOLERANCE_M;
  if (distanceMeters(lat, lng, ref.lat, ref.lng) > tolerance) {
    return { ok: false, reason: 'location' };
  }

  const taken = (exif?.['DateTimeOriginal'] ?? exif?.['CreateDate']) as Date | undefined;
  if (taken instanceof Date && !Number.isNaN(taken.getTime())) {
    const window = ref.timeWindowMs ?? DEFAULT_TIME_WINDOW_MS;
    if (Math.abs((ref.now ?? Date.now()) - taken.getTime()) > window) {
      return { ok: false, reason: 'time' };
    }
  }

  return { ok: true, reason: 'match' };
}
