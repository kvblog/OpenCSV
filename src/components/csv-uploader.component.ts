import { Component, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-csv-uploader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="w-full flex flex-col gap-6">
      
      <!-- STEP 1: Photo Folder Loader -->
      <div 
        class="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-xl transition-all duration-300 ease-in-out bg-white relative overflow-hidden"
        [class.border-brand-300]="!isDraggingPhotos()"
        [class.border-brand-500]="isDraggingPhotos()"
        [class.bg-brand-50]="isDraggingPhotos()"
        (dragover)="onDragOverPhotos($event)"
        (dragleave)="onDragLeavePhotos($event)"
        (drop)="onDropPhotos($event)">
        
        <div class="flex flex-col items-center justify-center pt-5 pb-6 z-10 px-4 text-center">
          <!-- Icon -->
          <div class="mb-3 p-3 bg-primary-100 rounded-full text-primary-600">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path><line x1="12" y1="11" x2="12" y2="17"></line><line x1="9" y1="14" x2="15" y2="14"></line></svg>
          </div>

          <p class="mb-1 text-lg font-semibold text-primary-700">1. Загрузите фотографии</p>
          <p class="text-xs text-primary-400 mb-4 max-w-xs">
            На Android: Откройте папку и выберите все фото (долгим нажатием). На ПК: Выберите папку.
          </p>
          
          <!-- Status Indicator -->
          @if (loadedImageCount() > 0) {
             <div class="mb-4 flex items-center gap-2 animate-[fadeIn_0.3s_ease-out]">
                <span class="text-sm font-bold text-green-700 bg-green-100 px-3 py-1 rounded-full border border-green-200 shadow-sm">
                  Успешно загружено: {{ loadedImageCount() }}
                </span>
             </div>
          }

          <!-- Note: added 'multiple' explicitly. 'webkitdirectory' allows folder picking on Desktop. 
               On Mobile, it often falls back to file picking, so 'multiple' is key. -->
          <input #folderInput type="file" webkitdirectory directory multiple class="hidden" (change)="onFolderSelected($event)" />
          
          <button 
            (click)="folderInput.click()"
            class="px-6 py-2.5 bg-[#1F1F1F] hover:bg-[#303033] text-white font-bold text-sm rounded-lg transition-all shadow-md active:scale-95 uppercase tracking-wide">
            Выбрать папку / Фото
          </button>
        </div>
      </div>

      <!-- STEP 2: CSV Drop Zone -->
      <div 
        class="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-xl transition-all duration-300 ease-in-out bg-white relative overflow-hidden"
        [class.border-brand-300]="!isDraggingCsv()"
        [class.border-brand-500]="isDraggingCsv()"
        [class.bg-brand-50]="isDraggingCsv()"
        (dragover)="onDragOverCsv($event)"
        (dragleave)="onDragLeaveCsv($event)"
        (drop)="onDropCsv($event)">
        
        <div class="flex flex-col items-center justify-center pt-5 pb-6 z-10 px-4 text-center">
          <!-- Icon -->
          <div class="mb-3 p-3 bg-gray-100 rounded-full text-gray-600">
            <svg class="w-8 h-8" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
              <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
            </svg>
          </div>

          <p class="mb-1 text-lg font-semibold text-primary-700">2. Загрузите CSV файл</p>
          <p class="text-xs text-primary-400 mb-4">Штат или список личного состава</p>
          
          <input #fileInput type="file" accept=".csv,text/csv,application/vnd.ms-excel,text/plain" class="hidden" (change)="onFileSelected($event)" />
          
          <button 
            (click)="fileInput.click()"
            class="px-6 py-2.5 bg-[#1F1F1F] hover:bg-[#303033] text-white font-bold text-sm rounded-lg transition-all shadow-md active:scale-95 uppercase tracking-wide">
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