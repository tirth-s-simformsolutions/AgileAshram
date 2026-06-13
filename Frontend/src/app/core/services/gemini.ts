import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { AiSuggestion } from '../models/complaint.model';

/**
 * Proxies AI routing calls through the NagarVaani backend (Google Gemini
 * server-side — the key never reaches the browser). Used by the complaint
 * intake flow to preview the AI's department/severity guess before submit.
 */
@Injectable({ providedIn: 'root' })
export class GeminiService {
  private readonly http = inject(HttpClient);

  /**
   * Ask the backend to suggest the responsible department + severity for a
   * complaint. Requires the image to already be uploaded (publicUrl).
   */
  suggestIndustries(
    content: string,
    place: string,
    time: string,
    imageUrl: string
  ): Observable<AiSuggestion> {
    return this.http
      .post<{ data: AiSuggestion }>('/api/v1/ai/suggest-industries', {
        content, place, time, imageUrl,
      })
      .pipe(map(res => res.data));
  }
}
