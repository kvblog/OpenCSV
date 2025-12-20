import { Component, inject, signal, computed, effect, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CsvService, CsvData } from './services/csv.service';
import { GeminiService } from './services/gemini.service';
import { CsvUploaderComponent } from './components/csv-uploader.component';
import { DashboardComponent } from './components/dashboard.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, CsvUploaderComponent, DashboardComponent, FormsModule],
  templateUrl: './app.component.html'
})
export class AppComponent {
  private csvService = inject(CsvService);
  private geminiService = inject(GeminiService);

  // Constants
  readonly ALLOWED_FILTER_COLUMNS = ['Регион проживания', 'Расход', 'ШДК категория в/сл.', 'ШДК подразделение'];
  readonly SEARCH_COLUMNS = ['Должность', 'Фамилия', 'Личный номер', 'Регион проживания', 'Позывной'];
  private readonly PIN_STORAGE_KEY = 'app_access_pin';

  // --- Authentication State ---
  isAuthenticated = signal(false);
  pinMode = signal<'create' | 'confirm' | 'unlock'>('unlock');
  enteredPin = signal('');
  tempPin = signal(''); // Stores first PIN during setup
  pinError = signal('');
  
  // Application State
  currentView = signal<'upload' | 'viewer' | 'dashboard'>('upload');
  fileName = signal<string>('');
  csvData = signal<CsvData | null>(null);
  
  // Image State
  imageMap = signal<Map<string, string>>(new Map());

  // Search State
  searchQuery = signal('');
  isSearchExpanded = signal(false);
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  selectedRowIndex = signal<number | null>(null);
  isMobileMenuOpen = signal(false);
  tableFontSize = signal<number>(14); // Default font size in px
  
  // Filter State
  isFilterModalOpen = signal(false);
  activeFilters = signal<Record<string, Set<string>>>({});
  tempFilters = signal<Record<string, Set<string>>>({}); 
  selectedFilterColumn = signal<string | null>(null);

  // Detail View State
  isDetailModalOpen = signal(false);
  detailData = signal<Record<string, string> | null>(null);
  private longPressTimeout: any;

  // Gemini State
  isAnalyzing = signal(false);
  isChatting = signal(false);
  analysisResult = signal<string | null>(null);
  showAiPanel = signal(false);
  chatInput = signal('');
  chatHistory = signal<{role: 'user' | 'ai', text: string}[]>([]);

  constructor() {
    this.checkPinStatus();
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
        // Check only specific columns for the search query
        return this.SEARCH_COLUMNS.some(col => {
          const val = row[col];
          return val && val.toLowerCase().includes(query);
        });
      });
    }

    return result;
  });

  rowCount = computed(() => this.filteredRows().length);
  
  // Detail Modal Title
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
      this.pinError.set(''); // Clear errors on typing
      
      // Auto-submit if 4 digits reached
      if (this.enteredPin().length === 4) {
        setTimeout(() => this.submitPin(), 100); // Small delay for UX
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
        // Success Setup
        localStorage.setItem(this.PIN_STORAGE_KEY, pin);
        this.isAuthenticated.set(true);
      } else {
        this.pinError.set('Пин-коды не совпадают. Попробуйте снова.');
        this.enteredPin.set('');
        this.tempPin.set('');
        this.pinMode.set('create'); // Restart setup
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
    this.fileName.set(file.name);
    const text = await file.text();
    const parsed = this.csvService.parse(text);
    this.csvData.set(parsed);
    this.currentView.set('viewer');
    this.activeFilters.set({});
    this.searchQuery.set('');
  }

  onImagesLoaded(map: Map<string, string>) {
    this.imageMap.set(map);
  }

  reset() {
    this.csvData.set(null);
    this.currentView.set('upload');
    this.analysisResult.set(null);
    this.chatHistory.set([]);
    this.showAiPanel.set(false);
    this.selectedRowIndex.set(null);
    this.isMobileMenuOpen.set(false);
    this.activeFilters.set({});
    this.searchQuery.set('');
    this.isSearchExpanded.set(false);
    this.tableFontSize.set(14);
    this.imageMap.set(new Map()); // Reset images
    this.closeDetailModal();
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
      this.searchQuery.set(''); // Clear text first if exists
    } else {
      this.isSearchExpanded.set(false); // Collapse if empty
    }
  }

  // --- Long Press / Detail Logic ---

  startLongPress(index: number, row: Record<string, string>) {
    this.longPressTimeout = setTimeout(() => {
      this.openDetailModal(row);
      // Haptic feedback if available
      if (navigator.vibrate) navigator.vibrate(50);
    }, 500); // 500ms long press
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

    // 1. Clicked/Selected Row (Yellow) - Top Priority
    if (isSelected) {
      return classes + 'bg-[#FFF9C4] text-[#1F1F1F] font-medium'; // Yellow 100
    }

    const category = (row['ШДК категория в/сл.'] || '').toLowerCase().trim();
    const surname = (row['Фамилия'] || '').toLowerCase().trim();

    // 2. Vacant -> Purple
    if (surname === 'вакант') {
      return classes + 'bg-[#F3E5F5] text-[#410002] hover:bg-[#E1BEE7]'; // Purple 50 / 100
    }

    // 3. Officer -> Light Red
    if (category === 'офицер') {
      return classes + 'bg-[#F9DEDC] text-[#410002] hover:bg-[#F2B8B5]';
    }

    // 4. Praporshchik -> Light Green
    if (category === 'прапорщик') {
      return classes + 'bg-[#DCF8C6] text-[#072711] hover:bg-[#C5E1A5]'; 
    }

    // 5. Sergeant -> Light Blue
    if (category === 'сержант') {
      return classes + 'bg-[#E3F2FD] text-[#041E49] hover:bg-[#BBDEFB]'; // Blue 50 / 100
    }

    // Default -> Hover Grey
    return classes + 'bg-white hover:bg-[#F9F9F9] text-[#1F1F1F]';
  }

  // Gemini Interactions
  async triggerAnalysis() {
    const data = this.csvData();
    if (!data) return;

    this.showAiPanel.set(true);
    this.isAnalyzing.set(true);

    try {
      const sample = data.rows.slice(0, 30);
      const result = await this.geminiService.analyzeCsv(this.fileName(), data.headers, sample);
      this.analysisResult.set(result);
    } catch (err) {
      this.analysisResult.set('Error analyzing data. Please try again.');
    } finally {
      this.isAnalyzing.set(false);
    }
  }

  async sendChatMessage() {
    const msg = this.chatInput();
    const data = this.csvData();
    if (!msg.trim() || !data) return;

    this.chatHistory.update(h => [...h, { role: 'user', text: msg }]);
    this.chatInput.set('');
    this.isChatting.set(true);

    try {
      const sample = data.rows.slice(0, 30);
      const answer = await this.geminiService.askQuestion(msg, data.headers, sample);
      this.chatHistory.update(h => [...h, { role: 'ai', text: answer }]);
    } catch (err) {
      this.chatHistory.update(h => [...h, { role: 'ai', text: 'Sorry, I encountered an error processing your request.' }]);
    } finally {
      this.isChatting.set(false);
    }
  }

  toggleAiPanel() {
    this.showAiPanel.update(v => !v);
  }
}