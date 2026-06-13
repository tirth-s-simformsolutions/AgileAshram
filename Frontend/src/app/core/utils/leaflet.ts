// Leaflet 1.x ships as CommonJS. Under the bundler's ESM interop, a dynamic
// `import('leaflet')` puts the real module on `.default` (so `L.map` etc. live
// there), while some builds expose it on the namespace directly. Normalise both.
export async function loadLeaflet(): Promise<typeof import('leaflet')> {
  const mod = await import('leaflet');
  const candidate = (mod as { default?: typeof import('leaflet') }).default;
  return candidate ?? mod;
}
