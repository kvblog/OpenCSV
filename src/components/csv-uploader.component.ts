import { Component, output, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-csv-uploader',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="w-full flex flex-col gap-6">
      
      <!-- STEP 1: Photo Folder Loader -->
      <div 
        class="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-3xl transition-all duration-300 ease-in-out relative overflow-hidden group"
        [class.border-primary]="isDraggingPhotos()"
        [class.bg-primary-50]="isDraggingPhotos()"
        [class.border-gray-200]="!isDraggingPhotos()"
        [class.bg-gray-50]="!isDraggingPhotos()"
        [class.hover:border-primary-300]="!isDraggingPhotos()"
        (dragover)="onDragOverPhotos($event)"
        (dragleave)="onDragLeavePhotos($event)"
        (drop)="onDropPhotos($event)">
        
        <div class="flex flex-col items-center justify-center pt-5 pb-6 z-10 px-4 text-center">
          <!-- Icon -->
          <div class="mb-4 p-4 bg-white rounded-full text-primary shadow-md group-hover:scale-110 transition-transform">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path><line x1="12" y1="11" x2="12" y2="17"></line><line x1="9" y1="14" x2="15" y2="14"></line></svg>
          </div>

          <p class="mb-1 text-lg font-bold text-gray-700">1. Загрузите фотографии</p>
          <p class="text-xs text-gray-500 mb-6 max-w-xs font-medium">
            Выберите папку с фотографиями личного состава
          </p>
          
          <!-- Status Indicator (Enhanced) -->
          @if (loadedImageCount() > 0) {
             <div class="mb-6 w-full max-w-[280px] bg-white rounded-2xl p-2 pr-5 border border-emerald-100 shadow-lg shadow-emerald-100/40 flex items-center gap-3 animate-[fadeIn_0.5s_ease-out]">
                <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-200 shrink-0">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <div class="flex flex-col text-left">
                  <span class="text-[10px] font-bold text-emerald-600/80 uppercase tracking-wider leading-tight mb-0.5">Успешно</span>
                  <span class="text-sm font-bold text-gray-800 leading-tight">
                    {{ loadedImageCount() }} фото
                  </span>
                </div>
             </div>
          }

          <!-- Note: added 'multiple' explicitly. 'webkitdirectory' allows folder picking on Desktop. 
               On Mobile, it often falls back to file picking, so 'multiple' is key. -->
          <input #folderInput type="file" webkitdirectory directory multiple class="hidden" (change)="onFolderSelected($event)" />
          
          <button 
            (click)="folderInput.click()"
            class="px-8 py-3 bg-primary-container text-primary-onContainer hover:bg-primary-light/50 hover:shadow-elevation-2 font-bold text-sm rounded-full transition-all duration-300 shadow-elevation-1 active:scale-95 active:shadow-sm">
            Выбрать папку
          </button>
        </div>
      </div>

      <!-- STEP 2: CSV Drop Zone -->
      <div 
        class="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-3xl transition-all duration-300 ease-in-out relative overflow-hidden group"
        [class.border-primary]="isDraggingCsv()"
        [class.bg-primary-50]="isDraggingCsv()"
        [class.border-gray-200]="!isDraggingCsv()"
        [class.bg-gray-50]="!isDraggingCsv()"
        [class.hover:border-primary-300]="!isDraggingCsv()"
        (dragover)="onDragOverCsv($event)"
        (dragleave)="onDragLeaveCsv($event)"
        (drop)="onDropCsv($event)">
        
        <div class="flex flex-col items-center justify-center pt-5 pb-6 z-10 px-4 text-center">
          <!-- Icon -->
          <div class="mb-4 p-4 bg-white rounded-full text-gray-600 shadow-md group-hover:scale-110 transition-transform">
            <svg class="w-8 h-8" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
              <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
            </svg>
          </div>

          <p class="mb-1 text-lg font-bold text-gray-700">2. Загрузите CSV файл</p>
          <p class="text-xs text-gray-500 mb-6 font-medium">Штат или список личного состава</p>
          
          <input #fileInput type="file" accept=".csv,text/csv,application/vnd.ms-excel,text/plain" class="hidden" (change)="onFileSelected($event)" />
          
          <button 
            (click)="fileInput.click()"
            class="px-8 py-3 bg-primary hover:bg-blue-700 text-white font-bold text-sm rounded-full transition-all shadow-lg shadow-primary/20 active:scale-95">
            Выбрать файл
          </button>
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