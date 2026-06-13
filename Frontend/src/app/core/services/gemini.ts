import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { GeminiClassification } from '../models/complaint.model';

interface ClassifyRequest {
  text: string;
  imageBase64?: string;
}

interface ClassifyResponse {
  classification: GeminiClassification;
}

interface ChatRequest {
  messages: Array<{ role: string; content: string }>;
}

interface ChatResponse {
  reply: string;
}

/**
 * GeminiService proxies all Gemini API calls through the NagarVaani
 * backend at /api/gemini. The API key never touches the browser.
 */
@Injectable({ providedIn: 'root' })
export class GeminiService {
  private readonly http = inject(HttpClient);

  /**
   * Classify a complaint description (and optional image) into category,
   * severity, department, and a short summary.
   * @param text      Plain-text description of the complaint.
   * @param imageBase64 Optional base64-encoded image (data URI prefix stripped).
   */
  classify(text: string, imageBase64?: string): Observable<GeminiClassification> {
    const body: ClassifyRequest = imageBase64 ? { text, imageBase64 } : { text };
    return this.http
      .post<ClassifyResponse>('/api/gemini/classify', body)
      .pipe(map(res => res.classification));
  }

  /**
   * Send a conversation turn to the Gemini chat model.
   * Returns the assistant's reply text.
   * @param messages Full conversation history in [{role, content}] format.
   */
  chat(messages: Array<{ role: string; content: string }>): Observable<string> {
    const body: ChatRequest = { messages };
    return this.http
      .post<ChatResponse>('/api/gemini/chat', body)
      .pipe(map(res => res.reply));
  }
}
