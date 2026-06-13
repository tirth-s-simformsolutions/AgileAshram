import { Component, inject, output, signal, PLATFORM_ID, OnDestroy } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [],
  templateUrl: './file-upload.html',
})
export class FileUpload implements OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);

  readonly fileChange = output<File | null>();

  readonly isDragOver = signal(false);
  readonly selectedFile = signal<File | null>(null);
  readonly previewUrl = signal<string | null>(null);

  private objectUrl: string | null = null;

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
    const file = event.dataTransfer?.files[0];
    if (file && file.type.startsWith('image/')) {
      this.processFile(file);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.processFile(file);
    // Reset input so same file can be re-selected
    input.value = '';
  }

  private processFile(file: File): void {
    this.revokeObjectUrl();
    this.selectedFile.set(file);
    if (isPlatformBrowser(this.platformId)) {
      this.objectUrl = URL.createObjectURL(file);
      this.previewUrl.set(this.objectUrl);
    }
    this.fileChange.emit(file);
  }

  removeFile(): void {
    this.revokeObjectUrl();
    this.selectedFile.set(null);
    this.previewUrl.set(null);
    this.fileChange.emit(null);
  }

  private revokeObjectUrl(): void {
    if (this.objectUrl && isPlatformBrowser(this.platformId)) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
    }
  }

  ngOnDestroy(): void {
    this.revokeObjectUrl();
  }
}
