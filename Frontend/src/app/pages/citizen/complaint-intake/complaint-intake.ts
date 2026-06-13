import {
  Component, inject, signal, computed, viewChild, ElementRef,
  afterNextRender, effect, PLATFORM_ID, DestroyRef
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { timer } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { GeminiService } from '../../../core/services/gemini';
import { ComplaintService } from '../../../core/services/complaint';
import {
  ChatMessage, GeminiClassification, ComplaintCategory,
  ComplaintSeverity, Department
} from '../../../core/models/complaint.model';
import { ChatBubble } from '../../../shared/components/chat-bubble/chat-bubble';
import { FileUpload } from '../../../shared/components/file-upload/file-upload';
import { MapPicker, PickedLocation } from '../../../shared/components/map-picker/map-picker';
import { isLocationInWard } from '../../../core/utils/ward-boundaries';

type IntakeStep = 'chat' | 'confirming' | 'submitting' | 'done';

const QUICK_SUGGESTIONS = [
  'Pothole on my street',
  'Garbage not collected',
  'Street light not working',
  'Water leakage',
  'Broken footpath',
] as const;

const MOCK_CLASSIFICATION: GeminiClassification = {
  category: 'infrastructure',
  severity: 'medium',
  department: 'infrastructure',
  summary: 'Road damage or infrastructure issue reported by citizen.',
};

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
  private readonly geminiSvc = inject(GeminiService);
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
  readonly classification = signal<GeminiClassification | null>(null);
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

  // Ward + location sufficient for final submission (description already captured)
  readonly canSubmit = computed(
    () => this.hasWard() && this.hasLocation()
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
    if (!text || !file) return;

    const userMsg: ChatMessage = { role: 'user', text, timestamp: new Date() };
    this.messages.update(msgs => [...msgs, userMsg]);
    this._inputText.set('');

    this.isTyping.set(true);
    this.currentStep.set('confirming');

    // TODO: Replace with real GeminiService.classify() call
    setTimeout(() => {
      const result: GeminiClassification =
        text.toLowerCase().includes('garbage') || text.toLowerCase().includes('sanitation')
          ? { category: 'sanitation' as ComplaintCategory, severity: 'medium' as ComplaintSeverity, department: 'sanitation' as Department, summary: 'Sanitation or garbage collection issue.' }
          : text.toLowerCase().includes('water')
          ? { category: 'water' as ComplaintCategory, severity: 'high' as ComplaintSeverity, department: 'infrastructure' as Department, summary: 'Water supply or leakage issue.' }
          : MOCK_CLASSIFICATION;
      this.handleClassification(result);
    }, 1500);
  }

  private handleClassification(result: GeminiClassification): void {
    this.classification.set(result);
    this.isTyping.set(false);
    const botMsg: ChatMessage = {
      role: 'bot',
      text: `I've categorised your complaint:\n\nCategory: ${result.category}\nSeverity: ${result.severity}\nDepartment: ${result.department}\nSummary: ${result.summary}\n\nDoes this look right? Reply "yes" to confirm, or describe the issue differently.`,
      timestamp: new Date(),
    };
    this.messages.update(msgs => [...msgs, botMsg]);
  }

  protected handleConfirmation(): void {
    if (this.currentStep() !== 'confirming') return;
    const text = this._inputText().trim().toLowerCase();
    const isConfirm = ['yes', 'y', 'confirm', 'ok', 'haan'].includes(text);

    const userMsg: ChatMessage = { role: 'user', text: this._inputText().trim() || 'Yes', timestamp: new Date() };
    this.messages.update(msgs => [...msgs, userMsg]);
    this._inputText.set('');

    if (!isConfirm) {
      this.currentStep.set('chat');
      const botMsg: ChatMessage = {
        role: 'bot',
        text: "No problem! Please describe the issue again and I'll re-classify it.",
        timestamp: new Date(),
      };
      this.messages.update(msgs => [...msgs, botMsg]);
      return;
    }

    if (!this.canSubmit()) {
      const nudge: ChatMessage = {
        role: 'bot',
        text: 'Please ensure your ward and map location are correctly set (see bottom bar), then type "yes" again.',
        timestamp: new Date(),
      };
      this.messages.update(msgs => [...msgs, nudge]);
      return;
    }

    this.confirmAndSubmit();
  }

  private confirmAndSubmit(): void {
    this.currentStep.set('submitting');
    this.isTyping.set(true);

    // TODO: Replace with real ComplaintService.submit()
    setTimeout(() => {
      const tid = `NV-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 89999)}`;
      this.ticketId.set(tid);
      this.isTyping.set(false);
      this.currentStep.set('done');
      const doneMsg: ChatMessage = {
        role: 'bot',
        text: `Complaint submitted!\n\nTicket ID: ${tid}\nWard: ${this._selectedWard()}\nLocation: ${this.pickedLocation()?.address ?? 'picked on map'}\n\nSave this ID to track your complaint.`,
        timestamp: new Date(),
      };
      this.messages.update(msgs => [...msgs, doneMsg]);
    }, 1500);
  }

  protected onSend(): void {
    if (this.currentStep() === 'confirming') {
      this.handleConfirmation();
    } else if (this.currentStep() === 'chat') {
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
