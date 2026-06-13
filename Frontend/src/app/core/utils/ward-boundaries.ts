export interface WardBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

// Approximate bounding boxes for Ahmedabad city wards (dummy data)
export const WARD_BOUNDS: Record<string, WardBounds> = {
  'ward-1':  { south: 22.970, north: 23.010, west: 72.580, east: 72.630 }, // Maninagar
  'ward-2':  { south: 23.010, north: 23.050, west: 72.540, east: 72.580 }, // Navrangpura
  'ward-3':  { south: 23.010, north: 23.060, west: 72.490, east: 72.540 }, // Satellite
  'ward-4':  { south: 23.010, north: 23.080, west: 72.440, east: 72.500 }, // Bopal
  'ward-5':  { south: 23.020, north: 23.060, west: 72.510, east: 72.555 }, // Vastrapur
  'ward-6':  { south: 23.070, north: 23.130, west: 72.550, east: 72.620 }, // Chandkheda
  'ward-7':  { south: 23.050, north: 23.090, west: 72.540, east: 72.580 }, // Naranpura
  'ward-8':  { south: 23.060, north: 23.110, west: 72.570, east: 72.640 }, // Ghatlodia
  'ward-9':  { south: 22.990, north: 23.040, west: 72.630, east: 72.690 }, // Vastral
  'ward-10': { south: 23.010, north: 23.060, west: 72.610, east: 72.670 }, // Nikol
  'ward-11': { south: 23.010, north: 23.060, west: 72.585, east: 72.630 }, // Bapunagar
  'ward-12': { south: 22.970, north: 23.020, west: 72.600, east: 72.650 }, // Gomtipur
};

export function isLocationInWard(lat: number, lng: number, wardId: string): boolean {
  const b = WARD_BOUNDS[wardId];
  if (!b) return true;
  return lat >= b.south && lat <= b.north && lng >= b.west && lng <= b.east;
}
