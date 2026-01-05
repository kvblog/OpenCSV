
import { Component, inject, signal, computed, effect, ViewChild, ElementRef, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CsvService, CsvData } from './services/csv.service';
import { StorageService } from './services/storage.service';
import { CsvUploaderComponent } from './components/csv-uploader.component';
import { DashboardComponent } from './components/dashboard.component';
import { FormsModule } from '@angular/forms';
import { LogoComponent } from './components/logo.component';
import { LOGO_DATA_URI } from './utils/logo.constant';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, CsvUploaderComponent, DashboardComponent, FormsModule, LogoComponent],
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent implements OnInit {
  protected readonly Math = Math;
  protected readonly LOGO_DATA_URI = LOGO_DATA_URI;
  
  private csvService = inject(CsvService);
  private storageService = inject(StorageService);

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
  // Added 'lists' to the allowed views
  currentView = signal<'upload' | 'viewer' | 'dashboard' | 'lists'>('upload');
  fileName = signal<string>('');
  csvData = signal<CsvData | null>(null);
  isLoading = signal(false); // For async restoration
  isResetConfirmOpen = signal(false);
  
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

  // Copy Feedback State
  showCopyToast = signal(false);
  copyToastMessage = signal('');

  // --- LISTS FEATURE STATE ---
  savedList = signal<Record<string, string>[]>([]);
  isListCreationModalOpen = signal(false);
  // Set of Row Objects (using reference equality)
  tempListSelection = signal<Set<Record<string, string>>>(new Set());
  private listSelectionLongPressTimeout: any;
  private isListSelectionActionTriggered = false;

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

        // Restore list if exists
        if (data.savedList && Array.isArray(data.savedList)) {
          this.savedList.set(data.savedList);
        }
        
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

  // Generated Text for Lists View
  formattedListText = computed(() => {
    const list = this.savedList();
    if (list.length === 0) return '';
    
    // Sort Alphabetically by Surname
    const sorted = [...list].sort((a, b) => {
      const nameA = (a['Фамилия'] || a['ФИО'] || '').toLowerCase();
      const nameB = (b['Фамилия'] || b['ФИО'] || '').toLowerCase();
      return nameA.localeCompare(nameB);
    });

    return sorted.map((row, index) => {
      const rank = row['Воинское звание'] || '';
      const surname = (row['Фамилия'] || '').toUpperCase(); // Uppercase Surname
      const name = row['Имя'] || '';
      const patronymic = row['Отчество'] || '';
      const callsign = row['Позывной'] ? `- ${row['Позывной']}` : '';
      
      // Format: {Number} {Rank} {FIO} - {Callsign}
      const fio = `${surname} ${name} ${patronymic}`.trim();
      
      return `${index + 1}. ${rank} ${fio} ${callsign}`.replace(/\s+/g, ' ').trim();
    }).join('\n');
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

      // Persist (and keep existing list if any, but currently just overwriting file data)
      // Note: If onFileLoaded is called, we usually treat it as a new session, but let's persist the list if we want it to survive
      await this.saveCurrentState(file.name, text, this.imageMap());
    } finally {
      this.isLoading.set(false);
    }
  }

  onImagesLoaded(map: Map<string, string>) {
    this.imageMap.set(map);
  }

  private async saveCurrentState(fileName: string, csvText: string, images: Map<string, string>): Promise<void> {
    await this.storageService.saveData(fileName, csvText, images);
    // Also save the list just in case
    await this.storageService.saveList(this.savedList());
  }

  // Triggered by button click
  reset() {
    this.isResetConfirmOpen.set(true);
    this.isMobileMenuOpen.set(false);
  }

  // Actual deletion logic
  async confirmReset() {
    this.isResetConfirmOpen.set(false);
    
    this.csvData.set(null);
    this.currentView.set('upload');
    this.selectedRowIndex.set(null);
    this.isMobileMenuOpen.set(false);
    this.activeFilters.set({});
    this.searchQuery.set('');
    this.isSearchExpanded.set(false);
    this.tableFontSize.set(14);
    this.fileName.set('');
    
    // Clear Lists
    this.savedList.set([]);
    this.tempListSelection.set(new Set());
    
    // Revoke old URLs to free memory
    this.imageMap().forEach(url => URL.revokeObjectURL(url));
    this.imageMap.set(new Map());
    
    this.closeDetailModal();
    
    // Clear Storage
    await this.storageService.clearData();
  }

  cancelReset() {
    this.isResetConfirmOpen.set(false);
  }

  // --- View Navigation ---
  setView(view: 'viewer' | 'dashboard' | 'lists') {
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

  // Trigger visual feedback (green circle)
  triggerCopySuccess() {
    this.showCopyToast.set(true);
    setTimeout(() => this.showCopyToast.set(false), 1500);
  }

  copyToClipboard(text: string, label: string) {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      // Just trigger visual, no text needed for the circle toast
      this.triggerCopySuccess();
    }).catch(err => {
      console.error('Copy failed', err);
    });
  }

  // Special method for Name Click
  copyFullInfo(row: Record<string, string>) {
    if (!row) return;

    // Helper: Sentence case (First upper, rest lower)
    const toSentenceCase = (str: string) => {
      if (!str) return '';
      const lower = str.toLowerCase();
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    };

    // Helper: Title Case (Every word starts with Upper)
    const toTitleCase = (str: string) => {
      if (!str) return '';
      return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    // 1. Role: First word capitalized, rest lowercase
    const roleRaw = (row['Должность'] || '').trim();
    const role = toSentenceCase(roleRaw);

    // 2. Rank: All lowercase
    const rank = (row['Воинское звание'] || '').trim().toLowerCase();

    // 3. Name: Title Case
    const surname = toTitleCase(row['Фамилия'] || '');
    const name = toTitleCase(row['Имя'] || '');
    const patronymic = toTitleCase(row['Отчество'] || '');

    const fullString = `${role} ${rank} ${surname} ${name} ${patronymic}`.replace(/\s+/g, ' ').trim();
    
    if (fullString) {
      this.copyToClipboard(fullString, 'Данные');
    }
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
    // Added even:bg-gray-50 for zebra striping
    let classes = 'border-b border-[#E3E3E3] last:border-none transition-colors cursor-pointer select-none text-sm ';

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

    // Default with zebra striping
    return classes + 'bg-white even:bg-[#F9FAFB] hover:bg-[#F2F2F2] text-[#1F1F1F]';
  }

  // --- LISTS FEATURE METHODS ---

  openCreateListModal() {
    // Clear temp selection when opening
    this.tempListSelection.set(new Set());
    this.isListCreationModalOpen.set(true);
    this.isMobileMenuOpen.set(false);
  }

  closeCreateListModal() {
    this.isListCreationModalOpen.set(false);
    this.tempListSelection.set(new Set());
  }

  saveCreatedList() {
    const selected = Array.from(this.tempListSelection());
    this.savedList.set(selected);
    this.closeCreateListModal();
    // Persist immediately
    this.storageService.saveList(selected);
  }

  deleteList() {
    this.savedList.set([]);
    // Persist empty list
    this.storageService.saveList([]);
  }

  copyListText() {
    const text = this.formattedListText();
    if (text) {
      this.copyToClipboard(text, 'Список');
    }
  }

  startListSelectionLongPress(row: Record<string, string>) {
    this.isListSelectionActionTriggered = false;
    this.listSelectionLongPressTimeout = setTimeout(() => {
      this.toggleListSelection(row);
      this.isListSelectionActionTriggered = true;
      if (navigator.vibrate) navigator.vibrate(50);
    }, 300); // Shorter duration for selection feels snappier
  }

  cancelListSelectionLongPress() {
    if (this.listSelectionLongPressTimeout) {
      clearTimeout(this.listSelectionLongPressTimeout);
      this.listSelectionLongPressTimeout = null;
    }
  }

  toggleListSelection(row: Record<string, string>) {
    this.tempListSelection.update(current => {
      const newSet = new Set(current);
      if (newSet.has(row)) {
        newSet.delete(row);
      } else {
        newSet.add(row);
      }
      return newSet;
    });
  }

  isPersonSelectedForList(row: Record<string, string>): boolean {
    return this.tempListSelection().has(row);
  }

  // --- Helper Methods for Modal Display ---
  
  getPhotoUrl(person: any): string {
    if (!person) return '';
    const map = this.imageMap();
    const surname = (person['Фамилия'] || '').trim();
    const name = (person['Имя'] || '').trim();
    const patronymic = (person['Отчество'] || '').trim();

    if (surname.toLowerCase() === 'вакант') {
      if (map.has('Вакант.jpg')) return map.get('Вакант.jpg')!;
      if (map.has('nophoto.jpg')) return map.get('nophoto.jpg')!;
    }

    const filename = `${surname}${name}${patronymic}.jpg`;
    if (map.has(filename)) return map.get(filename)!;
    if (map.has('nophoto.jpg')) return map.get('nophoto.jpg')!;

    // Return the default PNG path; component will fallback to SVG if 404
    return this.LOGO_DATA_URI;
  }

  // Method to handle image loading errors safely
  handleImageError(event: any) {
    const img = event.target as HTMLImageElement;
    // Check if the current source is already the logo (checking end of string to handle absolute URLs)
    if (img && !img.src.endsWith(this.LOGO_DATA_URI)) {
      img.src = this.LOGO_DATA_URI;
    }
  }

  getAgeLabel(ageStr: string): string {
    if (!ageStr || ageStr.trim() === '' || ageStr === '--') return '--';
    const age = parseInt(ageStr, 10);
    if (isNaN(age)) return ageStr;

    let suffix = 'лет';
    const lastDigit = age % 10;
    const lastTwoDigits = age % 100;

    if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
      suffix = 'лет';
    } else if (lastDigit === 1) {
      suffix = 'год';
    } else if (lastDigit >= 2 && lastDigit <= 4) {
      suffix = 'года';
    }

    return `${age} ${suffix}`;
  }
}
