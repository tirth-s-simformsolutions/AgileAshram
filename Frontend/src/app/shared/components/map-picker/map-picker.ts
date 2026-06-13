import {
  Component, inject, signal, output, ElementRef, viewChild,
  afterNextRender, PLATFORM_ID, DestroyRef
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, debounceTime, switchMap, catchError, of } from 'rxjs';

export interface PickedLocation {
  lat: number;
  lng: number;
  address: string;
}

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
}

const DEFAULT_LAT = 23.0225;
const DEFAULT_LNG = 72.5714;
const DEFAULT_ZOOM = 13;

// AMC (Ahmedabad Municipal Corporation) boundary
const AMC_BOUNDS = {
  south: 22.87,
  north: 23.16,
  west:  72.43,
  east:  72.73,
};

// Saffron pin SVG used as DivIcon
const PIN_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42">
  <path d="M16 2C9.373 2 4 7.373 4 14c0 9.5 12 26 12 26S28 23.5 28 14C28 7.373 22.627 2 16 2z"
        fill="#C9A84C" stroke="white" stroke-width="2"/>
  <circle cx="16" cy="14" r="5.5" fill="white"/>
</svg>`;

@Component({
  selector: 'app-map-picker',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './map-picker.html',
})
export class MapPicker {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly http = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);

  readonly locationPicked = output<PickedLocation>();
  readonly modalClosed = output<void>();

  readonly mapContainer = viewChild<ElementRef<HTMLDivElement>>('mapContainer');

  private readonly _searchQuery = signal('');
  get searchQuery(): string { return this._searchQuery(); }
  set searchQuery(v: string) {
    this._searchQuery.set(v);
    if (v.trim().length > 2) {
      this.searchSubject$.next(v);
    } else {
      this.searchResults.set([]);
    }
  }

  readonly resolvedAddress = signal('Tap within the circle to place a pin');
  readonly searchResults = signal<NominatimResult[]>([]);
  readonly isSearching = signal(false);
  readonly isGeocoding = signal(false);
  readonly searchError = signal<string | null>(null);
  readonly hasPin = signal(false);

  // Geolocation state
  readonly userLocation = signal<{ lat: number; lng: number } | null>(null);
  readonly geoStatus = signal<'idle' | 'requesting' | 'granted' | 'denied' | 'unavailable'>('idle');
  readonly radiusError = signal<string | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private map: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private marker: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private radiusCircle: any = null;
  private readonly searchSubject$ = new Subject<string>();
  private readonly pinSubject$ = new Subject<{ lat: number; lng: number }>();

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      afterNextRender(() => { this.initMap(); });
    }

    this.searchSubject$.pipe(
      debounceTime(500),
      switchMap(q => {
        this.isSearching.set(true);
        this.searchError.set(null);
        return this.http.get<NominatimResult[]>(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q + ' Ahmedabad')}&limit=5&countrycodes=in&viewbox=${AMC_BOUNDS.west},${AMC_BOUNDS.north},${AMC_BOUNDS.east},${AMC_BOUNDS.south}&bounded=1`,
          { headers: { 'User-Agent': 'NagarVaani/1.0 civic-portal' } }
        ).pipe(
          catchError(() => {
            this.searchError.set('Search unavailable. Double-click the map to place pin.');
            return of<NominatimResult[]>([]);
          })
        );
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(results => {
      this.isSearching.set(false);
      this.searchResults.set(results ?? []);
    });

    // Debounced reverse geocode triggered by pin placement / drag
    this.pinSubject$.pipe(
      debounceTime(400),
      switchMap(({ lat, lng }) => {
        this.isGeocoding.set(true);
        return this.http.get<{ display_name: string }>(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
          { headers: { 'User-Agent': 'NagarVaani/1.0 civic-portal' } }
        ).pipe(catchError(() => of(null)));
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(res => {
      this.isGeocoding.set(false);
      this.hasPin.set(true);
      if (res?.display_name) {
        this.resolvedAddress.set(res.display_name);
      } else {
        const pos = this.marker?.getLatLng() as { lat: number; lng: number } | null;
        this.resolvedAddress.set(
          pos ? `Unknown location (${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)})` : 'Unknown location'
        );
      }
    });
  }

  private async initMap(): Promise<void> {
    const el = this.mapContainer()?.nativeElement;
    if (!el || this.map) return;

    const L = await import('leaflet');

    const amcLatLngBounds = L.latLngBounds(
      [AMC_BOUNDS.south, AMC_BOUNDS.west],
      [AMC_BOUNDS.north, AMC_BOUNDS.east]
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mapOptions: any = {
      center: [DEFAULT_LAT, DEFAULT_LNG],
      zoom: DEFAULT_ZOOM,
      minZoom: 11,       // can't zoom out past city level
      maxZoom: 19,
      maxBounds: amcLatLngBounds, // initial guard — replaced by the 100 m circle once location is known
      maxBoundsViscosity: 1.0,
      zoomControl: true,
      doubleClickZoom: false,
      tap: false,
    };
    this.map = L.map(el, mapOptions);

    // Satellite tiles — Esri World Imagery (no API key required)
    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
        maxZoom: 19,
      }
    ).addTo(this.map);

    // Set crosshair cursor so user knows they can click
    el.style.cursor = 'crosshair';

    const pinIcon = L.divIcon({
      html: PIN_SVG,
      className: '',
      iconSize: [32, 42],
      iconAnchor: [16, 42], // point of pin at bottom-center
      popupAnchor: [0, -42],
    });

    // Tap/click → place or move marker, but only inside the 100 m radius
    this.map.on('click', (e: { latlng: { lat: number; lng: number } }) => {
      const { lat, lng } = e.latlng;
      const user = this.userLocation();
      if (!user) return; // location not yet granted — overlay blocks interaction anyway

      const dist = this.map.distance([user.lat, user.lng], [lat, lng]) as number;
      if (dist > 100) {
        this.radiusError.set('Pin must be within 100 m of your location.');
        return;
      }
      this.radiusError.set(null);

      if (this.marker) {
        this.marker.setLatLng([lat, lng]);
      } else {
        this.marker = L.marker([lat, lng], { icon: pinIcon, draggable: true }).addTo(this.map);
        this.marker.on('dragend', () => {
          const pos = this.marker.getLatLng() as { lat: number; lng: number };
          const u = this.userLocation();
          if (u) {
            const d = this.map.distance([u.lat, u.lng], [pos.lat, pos.lng]) as number;
            if (d > 100) {
              // Snap back to the last valid position
              this.radiusError.set('Pin must be within 100 m of your location.');
              this.marker.setLatLng(this.lastValidPin ?? [u.lat, u.lng]);
              return;
            }
          }
          this.radiusError.set(null);
          this.lastValidPin = [pos.lat, pos.lng];
          this.pinSubject$.next({ lat: pos.lat, lng: pos.lng });
        });
      }
      // Immediately enable Confirm — address resolves async
      this.lastValidPin = [lat, lng];
      this.hasPin.set(true);
      this.resolvedAddress.set('Detecting address…');
      this.map.panTo([lat, lng]);
      this.pinSubject$.next({ lat, lng });
    });

    // Ask for the user's location now that the map exists
    this.requestLocation();
  }

  protected requestLocation(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (!('geolocation' in navigator)) {
      this.geoStatus.set('unavailable');
      return;
    }
    this.geoStatus.set('requesting');
    navigator.geolocation.getCurrentPosition(
      pos => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        this.userLocation.set({ lat, lng });
        this.geoStatus.set('granted');
        this.applyRadiusRestriction(lat, lng);
      },
      err => {
        // 1 = PERMISSION_DENIED
        this.geoStatus.set(err.code === 1 ? 'denied' : 'unavailable');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  private async applyRadiusRestriction(lat: number, lng: number): Promise<void> {
    if (!this.map) return;
    const L = await import('leaflet');

    // Reset any previous pin from an earlier (denied/retry) session
    if (this.marker) {
      this.map.removeLayer(this.marker);
      this.marker = null;
      this.hasPin.set(false);
    }
    if (this.radiusCircle) {
      this.map.removeLayer(this.radiusCircle);
      this.radiusCircle = null;
    }

    // 100 m allowed-area circle
    this.radiusCircle = L.circle([lat, lng], {
      radius: 100,
      color: '#E8830C',
      weight: 2,
      fillColor: '#E8830C',
      fillOpacity: 0.08,
    }).addTo(this.map);

    // "You are here" dot — non-draggable
    L.circleMarker([lat, lng], {
      radius: 6,
      color: '#ffffff',
      weight: 2,
      fillColor: '#1d4ed8',
      fillOpacity: 1,
    }).addTo(this.map);

    // Constrain panning to the circle and fit the view to it
    const bounds = this.radiusCircle.getBounds();
    this.map.setMaxBounds(bounds);
    this.map.options.maxBoundsViscosity = 1.0;
    this.map.fitBounds(bounds);
    this.radiusError.set(null);
  }

  private lastValidPin: [number, number] | null = null;

  protected placeMarkerAt(lat: number, lng: number): void {
    if (!this.map) return;
    const user = this.userLocation();
    if (!user) return;
    const dist = this.map.distance([user.lat, user.lng], [lat, lng]) as number;
    if (dist > 100) {
      this.radiusError.set('That address is outside the 100 m radius of your location.');
      return;
    }
    this.radiusError.set(null);
    import('leaflet').then(L => {
      const pinIcon = L.divIcon({
        html: PIN_SVG,
        className: '',
        iconSize: [32, 42],
        iconAnchor: [16, 42],
      });
      if (this.marker) {
        this.marker.setLatLng([lat, lng]);
      } else {
        this.marker = L.marker([lat, lng], { icon: pinIcon, draggable: true }).addTo(this.map);
        this.marker.on('dragend', () => {
          const pos = this.marker.getLatLng() as { lat: number; lng: number };
          const u = this.userLocation();
          if (u) {
            const d = this.map.distance([u.lat, u.lng], [pos.lat, pos.lng]) as number;
            if (d > 100) {
              this.radiusError.set('Pin must be within 100 m of your location.');
              this.marker.setLatLng(this.lastValidPin ?? [u.lat, u.lng]);
              return;
            }
          }
          this.radiusError.set(null);
          this.lastValidPin = [pos.lat, pos.lng];
          this.pinSubject$.next({ lat: pos.lat, lng: pos.lng });
        });
      }
      this.lastValidPin = [lat, lng];
      this.hasPin.set(true);
      this.map.setView([lat, lng], 18);
      this.pinSubject$.next({ lat, lng });
    });
  }

  protected selectResult(result: NominatimResult): void {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    this.placeMarkerAt(lat, lng);
    this.resolvedAddress.set(result.display_name);
    this.searchResults.set([]);
    this._searchQuery.set('');
  }

  protected clearSearch(): void {
    this._searchQuery.set('');
    this.searchResults.set([]);
    this.searchError.set(null);
  }

  protected confirm(): void {
    const pos = this.marker?.getLatLng() as { lat: number; lng: number } | null;
    if (!pos) return;
    this.locationPicked.emit({
      lat: pos.lat,
      lng: pos.lng,
      address: this.resolvedAddress(),
    });
  }

  protected close(): void {
    this.modalClosed.emit();
  }
}
