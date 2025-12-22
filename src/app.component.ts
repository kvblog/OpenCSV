import { Component, inject, signal, computed, effect, ViewChild, ElementRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CsvService, CsvData } from './services/csv.service';
import { StorageService } from './services/storage.service'; // Added
import { CsvUploaderComponent } from './components/csv-uploader.component';
import { DashboardComponent } from './components/dashboard.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, CsvUploaderComponent, DashboardComponent, FormsModule],
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit {
  private csvService = inject(CsvService);
  private storageService = inject(StorageService); // Injected

  // Constants
  readonly ALLOWED_FILTER_COLUMNS = ['Регион проживания', 'Расход', 'ШДК категория в/сл.', 'ШДК подразделение'];
  readonly SEARCH_COLUMNS = ['Должность', 'Фамилия', 'Личный номер', 'Регион проживания', 'Позывной'];
  private readonly PIN_STORAGE_KEY = 'app_access_pin';

  // --- Authentication State ---
  isAuthenticated = signal(false);
  pinMode = signal<'create' | 'confirm' | 'unlock'>('unlock');
  enteredPin = signal('');
  tempPin = signal(''); 
  pinError = signal('');
  
  // Application State
  currentView = signal<'upload' | 'viewer' | 'dashboard'>('upload');
  fileName = signal<string>('');
  csvData = signal<CsvData | null>(null);
  isLoading = signal(false); // For async restoration
  
  // Image State
  imageMap = signal<Map<string, string>>(new Map());

  // Search State
  searchQuery = signal('');
  isSearchExpanded = signal(false);
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  selectedRowIndex = signal<number | null>(null);
  isMobileMenuOpen = signal(false);
  tableFontSize = signal<number>(14); 
  
  // Filter State
  isFilterModalOpen = signal(false);
  activeFilters = signal<Record<string, Set<string>>>({});
  tempFilters = signal<Record<string, Set<string>>>({}); 
  selectedFilterColumn = signal<string | null>(null);

  // Detail View State
  isDetailModalOpen = signal(false);
  detailData = signal<Record<string, string> | null>(null);
  private longPressTimeout: any;

  constructor() {
    this.checkPinStatus();
  }

  async ngOnInit() {
    // Attempt to restore data
    try {
      this.isLoading.set(true);
      const data = await this.storageService.loadData();
      if (data) {
        // Data exists, restore it
        this.fileName.set(data.fileName);
        this.imageMap.set(data.imageMap);
        
        const parsed = this.csvService.parse(data.csvText);
        this.csvData.set(parsed);
        
        // Go straight to viewer
        this.currentView.set('viewer');
      }
    } catch (e) {
      console.error('Failed to restore data', e);
    } finally {
      this.isLoading.set(false);
    }
  }

  // Computed Data
  headers = computed(() => this.csvData()?.headers || []);
  allRows = computed(() => this.csvData()?.rows || []); 
  
  availableFilterColumns = computed(() => {
    const currentHeaders = this.headers();
    return this.ALLOWED_FILTER_COLUMNS.filter(col => currentHeaders.includes(col));
  });

  filterColumnValues = computed(() => {
    const col = this.selectedFilterColumn();
    const rows = this.allRows();
    if (!col || !rows.length) return [];
    const values = new Set(rows.map(r => r[col] || '(Empty)'));
    return Array.from(values).sort();
  });

  filteredRows = computed(() => {
    const rows = this.allRows();
    const filters = this.activeFilters();
    const filterKeys = Object.keys(filters);
    const query = this.searchQuery().toLowerCase().trim();

    // 1. Apply Filters
    let result = rows;
    if (filterKeys.length > 0) {
      result = result.filter(row => {
        return filterKeys.every(key => {
          const selectedValues = filters[key];
          if (!selectedValues || selectedValues.size === 0) return true; 
          const rowValue = row[key] || '(Empty)';
          return selectedValues.has(rowValue);
        });
      });
    }

    // 2. Apply Search
    if (query) {
      result = result.filter(row => {
        return this.SEARCH_COLUMNS.some(col => {
          const val = row[col];
          return val && val.toLowerCase().includes(query);
        });
      });
    }

    return result;
  });

  rowCount = computed(() => this.filteredRows().length);
  
  detailTitle = computed(() => {
    const row = this.detailData();
    if (!row) return 'Детали';
    return row['Фамилия'] || row['Name'] || row['ФИО'] || 'Карточка';
  });

  // --- Auth Logic ---

  private checkPinStatus() {
    const savedPin = localStorage.getItem(this.PIN_STORAGE_KEY);
    if (savedPin) {
      this.pinMode.set('unlock');
    } else {
      this.pinMode.set('create');
    }
  }

  addPinDigit(digit: number) {
    if (this.enteredPin().length < 4) {
      this.enteredPin.update(p => p + digit.toString());
      this.pinError.set('');
      if (this.enteredPin().length === 4) {
        setTimeout(() => this.submitPin(), 100); 
      }
    }
  }

  removePinDigit() {
    this.enteredPin.update(p => p.slice(0, -1));
    this.pinError.set('');
  }

  private submitPin() {
    const pin = this.enteredPin();
    const mode = this.pinMode();

    if (mode === 'create') {
      this.tempPin.set(pin);
      this.enteredPin.set('');
      this.pinMode.set('confirm');
    } 
    else if (mode === 'confirm') {
      if (pin === this.tempPin()) {
        localStorage.setItem(this.PIN_STORAGE_KEY, pin);
        this.isAuthenticated.set(true);
      } else {
        this.pinError.set('Пин-коды не совпадают. Попробуйте снова.');
        this.enteredPin.set('');
        this.tempPin.set('');
        this.pinMode.set('create'); 
      }
    } 
    else if (mode === 'unlock') {
      const saved = localStorage.getItem(this.PIN_STORAGE_KEY);
      if (pin === saved) {
        this.isAuthenticated.set(true);
      } else {
        this.pinError.set('Неверный пин-код');
        this.enteredPin.set('');
      }
    }
  }

  getPinTitle(): string {
    switch (this.pinMode()) {
      case 'create': return 'Придумайте PIN-код';
      case 'confirm': return 'Повторите PIN-код';
      case 'unlock': return 'Введите PIN-код';
      default: return '';
    }
  }

  // --- File Logic ---
  async onFileLoaded(file: File) {
    this.isLoading.set(true);
    try {
      this.fileName.set(file.name);
      const text = await file.text();
      const parsed = this.csvService.parse(text);
      this.csvData.set(parsed);
      this.currentView.set('viewer');
      this.activeFilters.set({});
      this.searchQuery.set('');

      // Persist
      await this.saveCurrentState(file.name, text);
    } finally {
      this.isLoading.set(false);
    }
  }

  onImagesLoaded(map: Map<string, string>) {
    this.imageMap.set(map);
    // If we already have CSV data, update storage with new images
    if (this.csvData()) {
       // We need to re-save the whole state to be safe, or just images?
       // For simplicity, we assume user flow is Photos -> CSV. 
       // If they do Photos second, we trigger save when CSV is loaded. 
       // If they do CSV first, then Photos, we should trigger a save.
       // However, we can't easily get the raw CSV text again unless we stored it.
       // Let's assume the standard flow or just rely on the onFileLoaded to save everything.
       // But if they just add photos, we might miss saving if we don't handle it.
       // Since the flow is Photos -> CSV, the `onFileLoaded` will handle saving both.
    }
  }

  private async saveCurrentState(fileName: string, csvText: string) {
    await this.storageService.saveData(fileName, csvText, this.imageMap());
  }

  async reset() {
    if(confirm('Вы уверены? Текущие данные и фотографии будут удалены.')) {
      this.csvData.set(null);
      this.currentView.set('upload');
      this.selectedRowIndex.set(null);
      this.isMobileMenuOpen.set(false);
      this.activeFilters.set({});
      this.searchQuery.set('');
      this.isSearchExpanded.set(false);
      this.tableFontSize.set(14);
      
      // Revoke old URLs to free memory
      this.imageMap().forEach(url => URL.revokeObjectURL(url));
      this.imageMap.set(new Map());
      
      this.closeDetailModal();
      
      // Clear Storage
      await this.storageService.clearData();
    }
  }

  // --- View Navigation ---
  setView(view: 'viewer' | 'dashboard') {
    this.currentView.set(view);
    this.isMobileMenuOpen.set(false);
  }

  selectRow(index: number) {
    this.selectedRowIndex.set(index);
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen.update(v => !v);
  }

  changeFontSize(delta: number) {
    this.tableFontSize.update(current => {
      const newVal = current + delta;
      return Math.max(10, Math.min(24, newVal));
    });
  }

  // --- Search Logic ---
  toggleSearch() {
    this.isSearchExpanded.update(v => !v);
    if (this.isSearchExpanded()) {
      setTimeout(() => {
        if (this.searchInput) {
          this.searchInput.nativeElement.focus();
        }
      }, 50);
    }
  }

  closeSearch() {
    if (this.searchQuery()) {
      this.searchQuery.set(''); 
    } else {
      this.isSearchExpanded.set(false); 
    }
  }

  // --- Long Press / Detail Logic ---

  startLongPress(index: number, row: Record<string, string>) {
    this.longPressTimeout = setTimeout(() => {
      this.openDetailModal(row);
      if (navigator.vibrate) navigator.vibrate(50);
    }, 500); 
  }

  cancelLongPress() {
    if (this.longPressTimeout) {
      clearTimeout(this.longPressTimeout);
      this.longPressTimeout = null;
    }
  }

  openDetailModal(row: Record<string, string>) {
    this.detailData.set(row);
    this.isDetailModalOpen.set(true);
  }

  closeDetailModal() {
    this.isDetailModalOpen.set(false);
    this.detailData.set(null);
  }

  // --- Filter Logic ---

  openFilterModal() {
    const active = this.activeFilters();
    const temp: Record<string, Set<string>> = {};
    Object.keys(active).forEach(key => {
      temp[key] = new Set(active[key]);
    });
    this.tempFilters.set(temp);
    
    const available = this.availableFilterColumns();
    if (available.length > 0) {
      this.selectedFilterColumn.set(available[0]);
    }

    this.isFilterModalOpen.set(true);
    this.isMobileMenuOpen.set(false);
  }

  closeFilterModal() {
    this.isFilterModalOpen.set(false);
  }

  selectFilterColumnInModal(col: string) {
    this.selectedFilterColumn.set(col);
  }

  toggleFilterValue(value: string) {
    const col = this.selectedFilterColumn();
    if (!col) return;

    this.tempFilters.update(current => {
      const newFilters = { ...current };
      if (!newFilters[col]) {
        newFilters[col] = new Set();
      }
      const colSet = new Set(newFilters[col]);
      if (colSet.has(value)) {
        colSet.delete(value);
      } else {
        colSet.add(value);
      }
      newFilters[col] = colSet;
      return newFilters;
    });
  }

  isFilterValueSelected(col: string, value: string): boolean {
    const filters = this.tempFilters();
    return filters[col]?.has(value) ?? false;
  }

  applyFilters() {
    const temp = this.tempFilters();
    const clean: Record<string, Set<string>> = {};
    Object.keys(temp).forEach(key => {
      if (temp[key].size > 0) {
        clean[key] = temp[key];
      }
    });
    this.activeFilters.set(clean);
    this.selectedRowIndex.set(null);
    this.closeFilterModal();
  }

  clearAllFilters() {
    this.activeFilters.set({});
    this.tempFilters.set({});
    this.closeFilterModal();
  }

  // --- Row Styling Logic ---
  getRowClasses(row: Record<string, string>, index: number): string {
    const isSelected = this.selectedRowIndex() === index;
    let classes = 'border-b border-[#F2F2F2] last:border-none transition-colors cursor-pointer select-none ';

    if (isSelected) {
      return classes + 'bg-[#FFF9C4] text-[#1F1F1F] font-medium'; 
    }

    const category = (row['ШДК категория в/сл.'] || '').toLowerCase().trim();
    const surname = (row['Фамилия'] || '').toLowerCase().trim();

    if (surname === 'вакант') {
      return classes + 'bg-[#F3E5F5] text-[#410002] hover:bg-[#E1BEE7]'; 
    }
    if (category === 'офицер') {
      return classes + 'bg-[#F9DEDC] text-[#410002] hover:bg-[#F2B8B5]';
    }
    if (category === 'прапорщик') {
      return classes + 'bg-[#DCF8C6] text-[#072711] hover:bg-[#C5E1A5]'; 
    }
    if (category === 'сержант') {
      return classes + 'bg-[#E3F2FD] text-[#041E49] hover:bg-[#BBDEFB]'; 
    }

    return classes + 'bg-white hover:bg-[#F9F9F9] text-[#1F1F1F]';
  }
}