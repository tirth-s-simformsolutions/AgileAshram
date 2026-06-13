import {
  Component, inject, signal, computed, viewChild, ElementRef, afterNextRender
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { GeminiService } from '../../../core/services/gemini';
import { ComplaintService } from '../../../core/services/complaint';
import { LocationService } from '../../../core/services/location';
import { ChatMessage, GeminiClassification, ComplaintCategory, ComplaintSeverity, Department } from '../../../core/models/complaint.model';
import { ChatBubble } from '../../../shared/components/chat-bubble/chat-bubble';
import { FileUpload } from '../../../shared/components/file-upload/file-upload';

type IntakeStep = 'chat' | 'confirming' | 'locating' | 'submitting' | 'done';

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

@Component({
  selector: 'app-complaint-intake',
  standalone: true,
  imports: [RouterLink, FormsModule, ChatBubble, FileUpload],
  templateUrl: './complaint-intake.html',
})
export class ComplaintIntake {
  private readonly router = inject(Router);
  private readonly geminiSvc = inject(GeminiService);
  private readonly complaintSvc = inject(ComplaintService);
  private readonly locationSvc = inject(LocationService);

  readonly scrollContainer = viewChild<ElementRef<HTMLDivElement>>('scrollContainer');

  readonly messages = signal<ChatMessage[]>([
    { role: 'bot', text: 'Namaste! Describe your civic problem below — add a photo if you can.', timestamp: new Date() },
  ]);
  readonly isTyping = signal(false);
  readonly attachedFile = signal<File | null>(null);

  // Plain property for two-way ngModel binding; mirrors a signal for computed()
  private readonly _inputText = signal('');
  get inputText(): string { return this._inputText(); }
  set inputText(v: string) { this._inputText.set(v); }
  readonly currentStep = signal<IntakeStep>('chat');
  readonly classification = signal<GeminiClassification | null>(null);
  readonly ticketId = signal<string | null>(null);

  protected readonly quickSuggestions = QUICK_SUGGESTIONS;

  protected readonly showSuggestions = computed(() => this.messages().length <= 1 && this.currentStep() === 'chat');

  protected readonly canSend = computed(
    () => (this._inputText().trim().length > 0 || this.attachedFile() !== null) && !this.isTyping()
  );

  constructor() {
    afterNextRender(() => {
      const el = this.scrollContainer()?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }

  protected onFileChange(file: File | null): void {
    this.attachedFile.set(file);
  }

  protected selectSuggestion(suggestion: string): void {
    this._inputText.set(suggestion);
  }

  protected sendMessage(): void {
    const text = this._inputText().trim();
    const file = this.attachedFile();
    if (!text && !file) return;

    // Build user message
    const userMsg: ChatMessage = { role: 'user', text: text || '(Photo attached)', timestamp: new Date() };
    this.messages.update(msgs => [...msgs, userMsg]);
    this._inputText.set('');
    this.attachedFile.set(null);

    // Show typing indicator
    this.isTyping.set(true);
    this.currentStep.set('confirming');

    // TODO: Replace setTimeout mock with real GeminiService.classify() call
    // this.geminiSvc.classify(text, imageBase64).subscribe(c => this.handleClassification(c));
    setTimeout(() => {
      const result: GeminiClassification = text.toLowerCase().includes('garbage') || text.toLowerCase().includes('sanitation')
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
    const isConfirm = text === 'yes' || text === 'y' || text === 'confirm' || text === 'ok' || text === 'haan';

    const userMsg: ChatMessage = { role: 'user', text: this._inputText().trim() || 'Yes', timestamp: new Date() };
    this.messages.update(msgs => [...msgs, userMsg]);
    this._inputText.set('');

    if (!isConfirm) {
      // Re-classify
      this.currentStep.set('chat');
      const botMsg: ChatMessage = { role: 'bot', text: 'No problem! Please describe the issue again and I\'ll re-classify it.', timestamp: new Date() };
      this.messages.update(msgs => [...msgs, botMsg]);
      return;
    }

    this.currentStep.set('locating');
    this.isTyping.set(true);
    const locMsg: ChatMessage = { role: 'bot', text: 'Confirmed! Getting your location…', timestamp: new Date() };
    this.messages.update(msgs => [...msgs, locMsg]);

    // TODO: Replace with real location + submitComplaint flow
    setTimeout(() => {
      this.currentStep.set('submitting');
      const tid = `NV-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 89999)}`;
      this.ticketId.set(tid);
      this.isTyping.set(false);
      this.currentStep.set('done');
      const doneMsg: ChatMessage = {
        role: 'bot',
        text: `Your complaint has been submitted successfully!\n\nYour ticket ID is: ${tid}\n\nSave this ID to track the status of your complaint.`,
        timestamp: new Date(),
      };
      this.messages.update(msgs => [...msgs, doneMsg]);
    }, 2000);
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
