import { Component, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-csv-uploader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="w-full flex flex-col gap-4">
      
      <!-- CSV Drop Zone -->
      <div 
        class="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-xl transition-all duration-300 ease-in-out bg-white relative overflow-hidden"
        [class.border-brand-300]="!isDragging()"
        [class.border-brand-500]="isDragging()"
        [class.bg-brand-50]="isDragging()"
        (dragover)="onDragOver($event)"
        (dragleave)="onDragLeave($event)"
        (drop)="onDrop($event)">
        
        <div class="flex flex-col items-center justify-center pt-5 pb-6 z-10">
          <svg class="w-12 h-12 mb-3 text-primary-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
          </svg>
          <p class="mb-2 text-lg font-semibold text-primary-700">1. Загрузите CSV файл</p>
          <p class="text-xs text-primary-400 mb-4">Перетащите или нажмите для выбора</p>
          
          <input #fileInput type="file" accept=".csv" class="hidden" (change)="onFileSelected($event)" />
          
          <button 
            (click)="fileInput.click()"
            class="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm rounded-lg transition-colors shadow-sm">
            Выбрать файл
          </button>
        </div>
      </div>

      <!-- Photo Folder Loader -->
      <div class="bg-white border border-primary-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div class="flex items-center gap-3">
          <div class="p-2 bg-primary-100 rounded-lg text-primary-600">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path><line x1="12" y1="11" x2="12" y2="17"></line><line x1="9" y1="14" x2="15" y2="14"></line></svg>
          </div>
          <div>
            <h3 class="text-sm font-bold text-primary-800">2. Папка с фотографиями (Опционально)</h3>
            <p class="text-xs text-primary-500">Укажите путь: Документы&#92;IDphoto</p>
          </div>
        </div>
        
        <div class="flex items-center gap-2">
           @if (loadedImageCount() > 0) {
             <span class="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md border border-green-100 animate-[fadeIn_0.3s_ease-out]">
               Загружено: {{ loadedImageCount() }}
             </span>
           }
           <button 
             (click)="folderInput.click()"
             class="px-4 py-2 bg-white border border-primary-300 hover:bg-primary-50 text-primary-700 font-semibold text-xs rounded-lg transition-colors uppercase tracking-wider">
             Выбрать папку
           </button>
        </div>
        
        <!-- Note: webkitdirectory is non-standard but supported in most browsers for folder selection -->
        <input #folderInput type="file" webkitdirectory directory multiple class="hidden" (change)="onFolderSelected($event)" />
      </div>

    </div>
  `
})
export class CsvUploaderComponent {
  fileLoaded = output<File>();
  imagesLoaded = output<Map<string, string>>();
  
  isDragging = signal(false);
  loadedImageCount = signal(0);

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      // Prioritize CSV
      let csvFile: File | null = null;
      for (let i = 0; i < files.length; i++) {
        if (files[i].name.endsWith('.csv') || files[i].type === 'text/csv') {
          csvFile = files[i];
          break;
        }
      }

      if (csvFile) {
        this.fileLoaded.emit(csvFile);
      }
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
  }

  onFolderSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const imageMap = new Map<string, string>();
      let count = 0;

      Array.from(input.files).forEach(file => {
        if (file.type.startsWith('image/')) {
          // Store Blob URL
          const url = URL.createObjectURL(file);
          imageMap.set(file.name, url);
          count++;
        }
      });

      this.loadedImageCount.set(count);
      this.imagesLoaded.emit(imageMap);
    }
  }

  private handleFile(file: File) {
    if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
      this.fileLoaded.emit(file);
    } else {
      alert('Пожалуйста, выберите корректный CSV файл.');
    }
  }
}