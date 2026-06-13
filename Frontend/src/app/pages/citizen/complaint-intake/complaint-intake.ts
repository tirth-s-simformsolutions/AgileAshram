import {
  Component, inject, signal, computed, viewChild, ElementRef,
  effect, PLATFORM_ID, DestroyRef
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { timer, from, switchMap, throwError } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ComplaintService } from '../../../core/services/complaint';
import { checkImageGeoTime } from '../../../core/utils/image-geo-check';
import { ChatMessage, SubmittedComplaint } from '../../../core/models/complaint.model';
import { ChatBubble } from '../../../shared/components/chat-bubble/chat-bubble';
import { FileUpload } from '../../../shared/components/file-upload/file-upload';
import { MapPicker, PickedLocation } from '../../../shared/components/map-picker/map-picker';

type IntakeStep = 'chat' | 'submitting' | 'done';

const QUICK_SUGGESTIONS = [
  'Pothole on my street',
  'Garbage not collected',
  'Street light not working',
  'Water leakage',
  'Broken footpath',
] as const;

@Component({
  selector: 'app-complaint-intake',
  standalone: true,
  imports: [RouterLink, FormsModule, ChatBubble, FileUpload, MapPicker],
  templateUrl: './complaint-intake.html',
})
export class ComplaintIntake {
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
  private readonly complaintSvc = inject(ComplaintService);

  readonly scrollContainer = viewChild<ElementRef<HTMLDivElement>>('scrollContainer');

  readonly messages = signal<ChatMessage[]>([
    {
      role: 'bot',
      text: 'Namaste! Pick the location on the map, attach a photo, then describe your civic problem.',
      timestamp: new Date(),
    },
  ]);
  readonly isTyping = signal(false);
  readonly attachedFile = signal<File | null>(null);

  private readonly _inputText = signal('');
  get inputText(): string { return this._inputText(); }
  set inputText(v: string) { this._inputText.set(v); }

  readonly currentStep = signal<IntakeStep>('chat');
  readonly ticketId = signal<string | null>(null);

  // Location state
  readonly pickedLocation = signal<PickedLocation | null>(null);
  readonly showMapModal = signal(false);

  // Individual readiness signals — used in template for requirement indicators
  readonly hasLocation = computed(() => this.pickedLocation() !== null);
  readonly hasPhoto = computed(() => this.attachedFile() !== null);
  readonly hasText = computed(() => this._inputText().trim().length > 0);

  // All required to send the first message
  readonly canSend = computed(
    () =>
      this.hasText() &&
      this.hasPhoto() &&
      this.hasLocation() &&
      !this.isTyping()
  );

  protected readonly quickSuggestions = QUICK_SUGGESTIONS;

  protected readonly showSuggestions = computed(
    () => this.messages().length <= 1 && this.currentStep() === 'chat'
  );

  constructor() {
    effect(() => {
      this.messages();
      this.currentStep();
      timer(0).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
        if (isPlatformBrowser(this.platformId)) {
          const el = this.scrollContainer()?.nativeElement;
          if (el) el.scrollTop = el.scrollHeight;
        }
      });
    });
  }

  protected onFileChange(file: File | null): void {
    this.attachedFile.set(file);
  }

  protected selectSuggestion(suggestion: string): void {
    this._inputText.set(suggestion);
  }

  protected onLocationPicked(loc: PickedLocation): void {
    this.pickedLocation.set(loc);
    this.showMapModal.set(false);
  }

  protected sendMessage(): void {
    const text = this._inputText().trim();
    const file = this.attachedFile();
    const loc = this.pickedLocation();
    if (!text || !file || !loc) return;

    const userMsg: ChatMessage = { role: 'user', text, timestamp: new Date() };
    this.messages.update(msgs => [...msgs, userMsg]);
    this._inputText.set('');

    this.isTyping.set(true);
    this.currentStep.set('submitting');

    // Verify the photo's EXIF location/time matches the reported spot, then
    // upload + file the complaint. Backend AI-routes + grades on submit.
    from(checkImageGeoTime(file, { lat: loc.lat, lng: loc.lng })).pipe(
      switchMap(check => {
        if (!check.ok) return throwError(() => ({ geoReject: check.reason }));
        return this.complaintSvc.getPresignedUrl(file.name, file.type);
      }),
      switchMap(res => {
        const imageUrl = res.data.publicUrl;
        return this.complaintSvc.uploadToStorage(res.data.presignedUrl, file).pipe(
          switchMap(() => this.complaintSvc.submitComplaint({
            description: text,
            imageUrl,
            location: { lat: loc.lat, lng: loc.lng, address: loc.address },
          }))
        );
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: res => this.handleSubmitted(res.data),
      error: (err: { geoReject?: 'location' | 'time' }) => {
        this.isTyping.set(false);
        this.currentStep.set('chat');
        this._inputText.set(text); // restore so the user can retry
        const botText = err?.geoReject === 'location'
          ? 'This photo was not taken at the reported location. Please take a fresh photo at the spot and upload it.'
          : err?.geoReject === 'time'
            ? 'This photo looks old. Please take a fresh photo at the spot now and upload it.'
            : 'Could not submit your complaint — please check your connection and send again.';
        if (err?.geoReject) this.attachedFile.set(null); // force a re-capture on a geo/time reject
        this.messages.update(msgs => [...msgs, {
          role: 'bot',
          text: botText,
          timestamp: new Date(),
        }]);
      },
    });
  }

  private handleSubmitted(data: SubmittedComplaint): void {
    const tid = data.ticketId ?? `NV-${new Date().getFullYear()}-XXXXX`;
    this.ticketId.set(tid);
    this.isTyping.set(false);
    this.currentStep.set('done');

    const dept = data.departmentId?.name ?? 'Auto-routed department';
    this.messages.update(msgs => [...msgs, {
      role: 'bot',
      text: `Complaint submitted!\n\nTicket ID: ${tid}\nDepartment: ${dept}\nSeverity: ${data.severity}\nLocation: ${this.pickedLocation()?.address ?? ''}\n\nSave this ID to track your complaint.`,
      timestamp: new Date(),
    }]);
  }

  protected onSend(): void {
    if (this.currentStep() === 'chat') {
      this.sendMessage();
    }
  }

  protected onTextareaKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (this.canSend()) this.onSend();
    }
  }

  protected goBack(): void {
    this.router.navigate(['/citizen/dashboard']);
  }

  protected trackMessage(_index: number, msg: ChatMessage): string {
    return `${msg.role}-${msg.timestamp?.getTime() ?? _index}`;
  }
}
