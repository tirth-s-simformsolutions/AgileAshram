import {
  Component, inject, signal, computed, effect, ElementRef, viewChild,
  afterNextRender, PLATFORM_ID, DestroyRef
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ComplaintService } from '../../../core/services/complaint';
import { Sidebar } from '../../../shared/components/sidebar/sidebar';

interface GpsPoint { lat: number; lng: number; }

interface Hotspot {
  lat: number;          // centroid
  lng: number;
  count: number;
  level: 'low' | 'medium' | 'high';
}

// Ahmedabad centre + AMC bounds (mirrors the map-picker constants).
const CENTER_LAT = 23.0225;
const CENTER_LNG = 72.5714;
const AMC_BOUNDS = { south: 22.87, north: 23.16, west: 72.43, east: 72.73 };

// ~500 m grid cell for density bucketing (0.0045° ≈ 500 m at this latitude).
const CELL_DEG = 0.0045;

@Component({
  selector: 'app-hotspot-map',
  standalone: true,
  imports: [Sidebar],
  templateUrl: './hotspot-map.html',
})
export class HotspotMap {
  private readonly complaintSvc = inject(ComplaintService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);

  readonly mapContainer = viewChild<ElementRef<HTMLDivElement>>('mapContainer');

  readonly points = signal<GpsPoint[]>([]);
  readonly isLoading = signal(true);
  readonly loadError = signal(false);
  private readonly mapReady = signal(false);

  readonly hotspots = computed<Hotspot[]>(() => this.bucketize(this.points()));

  readonly stats = computed(() => {
    const spots = this.hotspots();
    const busiest = spots.reduce((m, s) => Math.max(m, s.count), 0);
    return {
      total: this.points().length,
      hotspots: spots.length,
      busiest,
      critical: spots.filter(s => s.level === 'high').length,
    };
  });

  protected readonly sidebarRef = viewChild(Sidebar);
  protected openMobileNav(): void { this.sidebarRef()?.openMobileSidebar(); }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private map: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private L: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private markerLayer: any = null;

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      afterNextRender(() => { this.initMap(); });
    }

    this.complaintSvc.getGpsPoints().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: pts => { this.points.set(pts); this.isLoading.set(false); },
      error: () => { this.isLoading.set(false); this.loadError.set(true); },
    });

    // Re-render markers whenever data or map readiness changes.
    effect(() => {
      const spots = this.hotspots();
      if (this.mapReady()) this.renderHotspots(spots);
    });
  }

  // Aggregate raw points into grid cells, count per cell, classify density.
  private bucketize(pts: GpsPoint[]): Hotspot[] {
    const cells = new Map<string, { sumLat: number; sumLng: number; count: number }>();
    for (const p of pts) {
      const key = `${Math.round(p.lat / CELL_DEG)}_${Math.round(p.lng / CELL_DEG)}`;
      const cell = cells.get(key) ?? { sumLat: 0, sumLng: 0, count: 0 };
      cell.sumLat += p.lat;
      cell.sumLng += p.lng;
      cell.count += 1;
      cells.set(key, cell);
    }
    return [...cells.values()].map(c => ({
      lat: c.sumLat / c.count,
      lng: c.sumLng / c.count,
      count: c.count,
      level: c.count >= 6 ? 'high' : c.count >= 3 ? 'medium' : 'low',
    }));
  }

  private async initMap(): Promise<void> {
    const el = this.mapContainer()?.nativeElement;
    if (!el || this.map) return;

    const L = await import('leaflet');
    this.L = L;

    const bounds = L.latLngBounds(
      [AMC_BOUNDS.south, AMC_BOUNDS.west],
      [AMC_BOUNDS.north, AMC_BOUNDS.east]
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mapOptions: any = {
      center: [CENTER_LAT, CENTER_LNG],
      zoom: 12,
      minZoom: 11,
      maxZoom: 18,
      maxBounds: bounds,
      maxBoundsViscosity: 1.0,
      zoomControl: true,
    };
    this.map = L.map(el, mapOptions);

    // Light basemap — density heat reads clearest over a muted street map.
    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
      {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        maxZoom: 19,
      }
    ).addTo(this.map);

    this.markerLayer = L.layerGroup().addTo(this.map);
    this.mapReady.set(true);
  }

  private renderHotspots(spots: Hotspot[]): void {
    if (!this.map || !this.L || !this.markerLayer) return;
    const L = this.L;
    this.markerLayer.clearLayers();

    for (const s of spots) {
      const { fill, stroke } = this.levelColors(s.level);
      const radius = 10 + Math.min(s.count, 20) * 1.6; // scale with count, capped

      const circle = L.circleMarker([s.lat, s.lng], {
        radius,
        color: stroke,
        weight: 2,
        fillColor: fill,
        fillOpacity: 0.55,
      });
      circle.bindTooltip(
        `${s.count} complaint${s.count === 1 ? '' : 's'}`,
        { direction: 'top', offset: [0, -radius] }
      );

      // Count label centred on the bubble.
      const label = L.divIcon({
        html: `<span style="font:700 12px var(--font-sans,sans-serif);color:#fff">${s.count}</span>`,
        className: '',
        iconSize: [radius * 2, radius * 2],
        iconAnchor: [radius, radius],
      });
      const marker = L.marker([s.lat, s.lng], { icon: label, interactive: false });

      this.markerLayer.addLayer(circle);
      this.markerLayer.addLayer(marker);
    }
  }

  private levelColors(level: Hotspot['level']): { fill: string; stroke: string } {
    switch (level) {
      case 'high':   return { fill: '#D92D20', stroke: '#B42318' };
      case 'medium': return { fill: '#E8830C', stroke: '#B45309' };
      default:       return { fill: '#1A7F4B', stroke: '#15643B' };
    }
  }
}
