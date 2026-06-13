import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable, from, throwError } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';

export interface GeolocationPosition {
  lat: number;
  lng: number;
  accuracy?: number;
}

export interface ReverseGeocodeResult {
  address: string;
  city?: string;
  state?: string;
}

@Injectable({ providedIn: 'root' })
export class LocationService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly http = inject(HttpClient);

  getCurrentPosition(): Observable<GeolocationPosition> {
    if (!isPlatformBrowser(this.platformId)) {
      return throwError(() => new Error('Geolocation not available on server'));
    }
    if (!navigator.geolocation) {
      return throwError(() => new Error('Geolocation not supported by this browser'));
    }
    return new Observable<GeolocationPosition>(observer => {
      navigator.geolocation.getCurrentPosition(
        pos => {
          observer.next({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy });
          observer.complete();
        },
        err => observer.error(new Error(err.message)),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
      );
    });
  }

  reverseGeocode(lat: number, lng: number): Observable<ReverseGeocodeResult> {
    return this.http
      .get<{ display_name: string; address: { city?: string; state?: string } }>(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      )
      .pipe(
        switchMap(res =>
          from([{ address: res.display_name, city: res.address?.city, state: res.address?.state }])
        )
      );
  }
}
