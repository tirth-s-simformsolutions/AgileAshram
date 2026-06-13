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
const DEFAULT_ZOOM = 14;

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

  readonly resolvedAddress = signal('Double-click on the map to place a pin');
  readonly searchResults = signal<NominatimResult[]>([]);
  readonly isSearching = signal(false);
  readonly isGeocoding = signal(false);
  readonly searchError = signal<string | null>(null);
  readonly hasPin = signal(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private map: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private marker: any = null;
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
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5&countrycodes=in`,
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mapOptions: any = {
      center: [DEFAULT_LAT, DEFAULT_LNG],
      zoom: DEFAULT_ZOOM,
      zoomControl: true,
      doubleClickZoom: false,
      tap: false, // disable Leaflet mobile tap handler; we handle click ourselves
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

    // Tap/click → place or move marker (works on mobile touch and desktop click)
    this.map.on('click', (e: { latlng: { lat: number; lng: number } }) => {
      const { lat, lng } = e.latlng;
      if (this.marker) {
        this.marker.setLatLng([lat, lng]);
      } else {
        this.marker = L.marker([lat, lng], { icon: pinIcon, draggable: true }).addTo(this.map);
        this.marker.on('dragend', () => {
          const pos = this.marker.getLatLng() as { lat: number; lng: number };
          this.pinSubject$.next({ lat: pos.lat, lng: pos.lng });
        });
      }
      // Immediately enable Confirm — address resolves async
      this.hasPin.set(true);
      this.resolvedAddress.set('Detecting address…');
      this.map.panTo([lat, lng]);
      this.pinSubject$.next({ lat, lng });
    });
  }

  protected placeMarkerAt(lat: number, lng: number): void {
    if (!this.map) return;
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
          this.pinSubject$.next({ lat: pos.lat, lng: pos.lng });
        });
      }
      this.map.setView([lat, lng], 16);
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
