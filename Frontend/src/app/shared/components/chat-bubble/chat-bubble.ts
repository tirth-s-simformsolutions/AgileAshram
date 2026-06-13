import { Component, computed, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ChatMessage } from '../../../core/models/complaint.model';

@Component({
  selector: 'app-chat-bubble',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './chat-bubble.html',
})
export class ChatBubble {
  readonly message = input.required<ChatMessage>();

  readonly isUser = computed(() => this.message().role === 'user');

  readonly wrapperClasses = computed(() =>
    this.isUser()
      ? 'flex justify-end'
      : 'flex justify-start'
  );

  readonly bubbleClasses = computed(() =>
    this.isUser()
      ? 'bg-[color:var(--color-primary-700)] text-white rounded-[var(--radius-card)] rounded-tr-[var(--radius-control)] max-w-[75%] md:max-w-[60%]'
      : 'bg-[color:var(--color-paper-50)] border border-[color:var(--color-paper-300)] text-[color:var(--color-ink-900)] rounded-[var(--radius-card)] rounded-tl-[var(--radius-control)] max-w-[75%] md:max-w-[60%]'
  );

  readonly timestampClasses = computed(() =>
    this.isUser() ? 'text-right' : 'text-left'
  );
}
