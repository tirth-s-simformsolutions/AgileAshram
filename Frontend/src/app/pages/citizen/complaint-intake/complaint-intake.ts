import {
  Component, inject, signal, computed, viewChild, ElementRef,
  effect, PLATFORM_ID, DestroyRef
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { timer, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ComplaintService } from '../../../core/services/complaint';
import { ChatMessage, SubmittedComplaint } from '../../../core/models/complaint.model';
import { ChatBubble } from '../../../shared/components/chat-bubble/chat-bubble';
import { FileUpload } from '../../../shared/components/file-upload/file-upload';
import { MapPicker, PickedLocation } from '../../../shared/components/map-picker/map-picker';
import { isLocationInWard } from '../../../core/utils/ward-boundaries';

type IntakeStep = 'chat' | 'submitting' | 'done';

const QUICK_SUGGESTIONS = [
  'Pothole on my street',
  'Garbage not collected',
  'Street light not working',
  'Water leakage',
  'Broken footpath',
] as const;

export const WARDS = [
  { id: 'ward-1',  name: 'Ward 1 – Maninagar' },
  { id: 'ward-2',  name: 'Ward 2 – Navrangpura' },
  { id: 'ward-3',  name: 'Ward 3 – Satellite' },
  { id: 'ward-4',  name: 'Ward 4 – Bopal' },
  { id: 'ward-5',  name: 'Ward 5 – Vastrapur' },
  { id: 'ward-6',  name: 'Ward 6 – Chandkheda' },
  { id: 'ward-7',  name: 'Ward 7 – Naranpura' },
  { id: 'ward-8',  name: 'Ward 8 – Ghatlodia' },
  { id: 'ward-9',  name: 'Ward 9 – Vastral' },
  { id: 'ward-10', name: 'Ward 10 – Nikol' },
  { id: 'ward-11', name: 'Ward 11 – Bapunagar' },
  { id: 'ward-12', name: 'Ward 12 – Gomtipur' },
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
      text: 'Namaste! Select your ward, pick the location on the map, attach a photo, then describe your civic problem.',
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
  private readonly _selectedWard = signal('');
  get selectedWard(): string { return this._selectedWard(); }
  set selectedWard(v: string) {
    this._selectedWard.set(v);
    // Re-validate existing location against new ward, or clear errors
    const loc = this.pickedLocation();
    if (loc && v) {
      this.validateLocation(loc, v);
    } else {
      this.wardMismatch.set(false);
      this.locationError.set(null);
    }
  }

  readonly pickedLocation = signal<PickedLocation | null>(null);
  readonly showMapModal = signal(false);
  readonly wardMismatch = signal(false);
  readonly locationError = signal<string | null>(null);

  // Individual readiness signals — used in template for requirement indicators
  readonly hasWard = computed(() => this._selectedWard() !== '');
  readonly hasLocation = computed(() => this.pickedLocation() !== null && !this.wardMismatch());
  readonly hasPhoto = computed(() => this.attachedFile() !== null);
  readonly hasText = computed(() => this._inputText().trim().length > 0);

  // All 4 required to send the first message
  readonly canSend = computed(
    () =>
      this.hasText() &&
      this.hasPhoto() &&
      this.hasWard() &&
      this.hasLocation() &&
      !this.isTyping()
  );

  protected readonly quickSuggestions = QUICK_SUGGESTIONS;
  protected readonly wards = WARDS;

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
    this.showMapModal.set(false);

    if (!this._selectedWard()) {
      this.locationError.set('Select a ward first, then pick your location.');
      this.pickedLocation.set(null);
      return;
    }

    this.pickedLocation.set(loc);
    this.validateLocation(loc, this._selectedWard());
  }

  private validateLocation(loc: PickedLocation, wardId: string): void {
    if (!isLocationInWard(loc.lat, loc.lng, wardId)) {
      this.wardMismatch.set(true);
      this.locationError.set('Location is outside the selected ward — re-pin or change ward.');
    } else {
      this.wardMismatch.set(false);
      this.locationError.set(null);
    }
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

    // Upload the photo, then file the complaint. Backend AI-routes + grades on submit.
    this.complaintSvc.getPresignedUrl(file.name, file.type).pipe(
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
      error: () => {
        this.isTyping.set(false);
        this.currentStep.set('chat');
        this._inputText.set(text); // restore so the user can retry
        this.messages.update(msgs => [...msgs, {
          role: 'bot',
          text: 'Could not submit your complaint — please check your connection and send again.',
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
