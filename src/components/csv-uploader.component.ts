import { Component, output, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-csv-uploader',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="w-full grid grid-cols-1 md:grid-cols-2 gap-6">
      
      <!-- STEP 1: Photo Folder Loader -->
      <div 
        class="flex flex-col items-center justify-center w-full min-h-[16rem] h-auto py-8 border-2 border-dashed rounded-3xl transition-all duration-300 ease-in-out relative overflow-hidden group hover:bg-gray-50 hover:border-primary-300"
        [class.border-primary]="isDraggingPhotos()"
        [class.bg-primary-50]="isDraggingPhotos()"
        [class.border-gray-200]="!isDraggingPhotos()"
        [class.bg-gray-50]="!isDraggingPhotos()"
        (dragover)="onDragOverPhotos($event)"
        (dragleave)="onDragLeavePhotos($event)"
        (drop)="onDropPhotos($event)">
        
        <div class="flex flex-col items-center justify-center z-10 px-4 text-center">
          
          <!-- Icon Trigger -->
          <button 
            (click)="folderInput.click()"
            class="mb-5 p-5 bg-white rounded-full shadow-lg shadow-gray-200/50 group-hover:scale-110 transition-all duration-300 border border-gray-100 cursor-pointer outline-none focus:ring-4 focus:ring-primary/10"
            [class.text-primary]="loadedImageCount() === 0"
            [class.text-emerald-500]="loadedImageCount() > 0"
            [class.shadow-primary-10]="loadedImageCount() === 0"
            [class.shadow-emerald-100]="loadedImageCount() > 0"
            title="Выбрать папку"
          >
            @if (loadedImageCount() > 0) {
              <!-- Success Checkmark -->
              <svg class="w-10 h-10 animate-[scaleIn_0.3s_cubic-bezier(0.175,0.885,0.32,1.275)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path>
              </svg>
            } @else {
              <!-- Default Icon -->
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path><line x1="12" y1="11" x2="12" y2="17"></line><line x1="9" y1="14" x2="15" y2="14"></line></svg>
            }
          </button>

          <p class="mb-2 text-lg font-bold text-gray-800">1. Загрузите фотографии</p>
          <p class="text-xs text-gray-500 mb-2 max-w-[200px] font-medium leading-relaxed">
            Нажмите на иконку, чтобы выбрать папку с фото
          </p>

          <!-- Success Text -->
          @if (loadedImageCount() > 0) {
            <div class="mt-2 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-[11px] font-bold animate-[fadeIn_0.5s_ease-out]">
              Загружено: {{ loadedImageCount() }} фото
            </div>
          }
          
          <input #folderInput type="file" webkitdirectory directory multiple class="hidden" (change)="onFolderSelected($event)" />
        </div>
      </div>

      <!-- STEP 2: CSV Drop Zone -->
      <div 
        class="flex flex-col items-center justify-center w-full min-h-[16rem] h-auto py-8 border-2 border-dashed rounded-3xl transition-all duration-300 ease-in-out relative overflow-hidden group hover:bg-gray-50 hover:border-primary-300"
        [class.border-primary]="isDraggingCsv()"
        [class.bg-primary-50]="isDraggingCsv()"
        [class.border-gray-200]="!isDraggingCsv()"
        [class.bg-gray-50]="!isDraggingCsv()"
        (dragover)="onDragOverCsv($event)"
        (dragleave)="onDragLeaveCsv($event)"
        (drop)="onDropCsv($event)">
        
        <div class="flex flex-col items-center justify-center z-10 px-4 text-center">
          
          <!-- Icon Trigger -->
          <button 
            (click)="fileInput.click()"
            class="mb-5 p-5 bg-white rounded-full text-gray-600 shadow-lg shadow-gray-200/50 group-hover:scale-110 group-hover:text-primary transition-all duration-300 border border-gray-100 cursor-pointer outline-none focus:ring-4 focus:ring-primary/10"
            title="Выбрать файл"
          >
            <svg class="w-10 h-10" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
              <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
            </svg>
          </button>

          <p class="mb-2 text-lg font-bold text-gray-800">2. Загрузите CSV файл</p>
          <p class="text-xs text-gray-500 mb-2 max-w-[200px] font-medium leading-relaxed">
            Нажмите на иконку, чтобы выбрать файл штата
          </p>
          
          <input #fileInput type="file" accept=".csv,text/csv,application/vnd.ms-excel,text/plain" class="hidden" (change)="onFileSelected($event)" />
        </div>
      </div>

    </div>
  `
})
export class CsvUploaderComponent {
  fileLoaded = output<File>();
  imagesLoaded = output<Map<string, string>>();
  
  isDraggingPhotos = signal(false);
  isDraggingCsv = signal(false);
  loadedImageCount = signal(0);

  // --- Photo Drag Handlers ---
  onDragOverPhotos(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingPhotos.set(true);
  }
  onDragLeavePhotos(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingPhotos.set(false);
  }
  onDropPhotos(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingPhotos.set(false);
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.processImages(files);
    }
  }

  // --- CSV Drag Handlers ---
  onDragOverCsv(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingCsv.set(true);
  }
  onDragLeaveCsv(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingCsv.set(false);
  }
  onDropCsv(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingCsv.set(false);
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.processCsv(files);
    }
  }

  // --- File Selection Handlers ---

  onFolderSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.processImages(input.files);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleCsvFile(input.files[0]);
    }
  }

  // --- Processing Logic ---

  private processImages(fileList: FileList) {
    const imageMap = new Map<string, string>();
    let count = 0;

    Array.from(fileList).forEach(file => {
      // Basic check for images
      if (file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif)$/i.test(file.name)) {
        const url = URL.createObjectURL(file);
        imageMap.set(file.name, url);
        count++;
      }
    });

    if (count > 0) {
      this.loadedImageCount.set(count);
      this.imagesLoaded.emit(imageMap);
    }
  }

  private processCsv(fileList: FileList) {
    // Prioritize CSV
    let csvFile: File | null = null;
    for (let i = 0; i < fileList.length; i++) {
      if (fileList[i].name.endsWith('.csv') || fileList[i].type === 'text/csv') {
        csvFile = fileList[i];
        break;
      }
    }
    if (csvFile) {
      this.handleCsvFile(csvFile);
    }
  }

  private handleCsvFile(file: File) {
    if (file.type === 'text/csv' || file.type === 'application/vnd.ms-excel' || file.name.endsWith('.csv')) {
      this.fileLoaded.emit(file);
    } else {
      alert('Пожалуйста, выберите корректный CSV файл.');
    }
  }
}