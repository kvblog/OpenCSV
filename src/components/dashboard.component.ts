import { Component, input, output, computed, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Main scrollable container for everything -->
    <div 
      class="h-full overflow-y-auto custom-scrollbar bg-surface px-4 py-6 scroll-smooth" 
      (scroll)="onScroll($event)"
      #scrollContainer
    >
      
      <!-- Stats Header -->
      <div class="mb-8 z-10">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-7xl mx-auto">
          
          <!-- Total -->
          <div class="bg-surface-light p-4 rounded-2xl shadow-elevation-1 flex flex-col items-center justify-center">
            <span class="text-xs font-medium text-[#444746] uppercase tracking-wide mb-1">По штату</span>
            <span class="text-2xl font-normal text-[#1F1F1F]">{{ totalRows() }}</span>
          </div>

          <!-- Present -->
          <div class="bg-[#C4EED0] p-4 rounded-2xl shadow-elevation-1 flex flex-col items-center justify-center text-[#072711]">
            <span class="text-xs font-medium uppercase tracking-wide mb-1 opacity-80">Налицо</span>
            <span class="text-2xl font-normal">{{ presentCount() }}</span>
          </div>

          <!-- Vacation -->
          <div class="bg-[#D3E3FD] p-4 rounded-2xl shadow-elevation-1 flex flex-col items-center justify-center text-[#041E49]">
            <span class="text-xs font-medium uppercase tracking-wide mb-1 opacity-80">Отпуск</span>
            <span class="text-2xl font-normal">{{ vacationCount() }}</span>
          </div>

          <!-- Vacant -->
          <div class="bg-[#FFDAD6] p-4 rounded-2xl shadow-elevation-1 flex flex-col items-center justify-center text-[#410002]">
            <span class="text-xs font-medium uppercase tracking-wide mb-1 opacity-80">Вакант</span>
            <span class="text-2xl font-normal">{{ vacantPosCount() }}</span>
          </div>

        </div>
      </div>

      <!-- Personnel Cards Area -->
      <div class="pb-20"> <!-- Extra padding for FAB -->
        <div class="max-w-7xl mx-auto">
          
          <div class="flex flex-col gap-10">
            @for (group of groupedPersonnel(); track group.name) {
              <section class="animate-[fadeIn_0.3s_ease-out]">
                <!-- Group Header -->
                <div class="flex items-center mb-6">
                  <h3 class="text-lg font-normal text-[#1F1F1F] bg-surface pr-4 z-10">
                    {{ group.name }} <span class="text-[#444746] text-sm ml-1">({{ group.rows.length }})</span>
                  </h3>
                  <div class="h-px bg-[#E3E3E3] flex-1"></div>
                </div>

                <!-- Cards Grid: Changed to grid-cols-2 for mobile to fit 4 in view -->
                <div class="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
                  @for (person of group.rows; track $index) {
                    <!-- Material 3 Card with Long Press Logic -->
                    <div 
                      class="relative flex flex-col rounded-[16px] sm:rounded-[24px] overflow-hidden transition-all duration-300 group shadow-elevation-1 hover:shadow-elevation-2 border cursor-pointer select-none"
                      [class]="getCardThemeClasses(person)"
                      (mousedown)="startLongPress(person)"
                      (touchstart)="startLongPress(person)"
                      (mouseup)="cancelLongPress()"
                      (touchend)="cancelLongPress()"
                      (mouseleave)="cancelLongPress()"
                      (click)="onCardClick(person)"
                    >
                      
                      <!-- Photo Area (1:1 Aspect Ratio) -->
                      <div class="w-full aspect-square bg-[#E3E3E3] relative overflow-hidden pointer-events-none">
                        <img 
                          [src]="getPhotoUrl(person)" 
                          alt="Photo" 
                          class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          onerror="this.src='https://via.placeholder.com/400x500?text=No+Photo'"
                        >
                        <div class="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-50"></div>
                      </div>

                      <!-- Content Body: Compact padding for mobile -->
                      <div class="p-2 sm:p-5 flex flex-col flex-1 gap-0.5 sm:gap-1 pointer-events-none">
                        
                        <!-- Name: Smaller text on mobile -->
                        <h3 class="text-xs sm:text-xl font-normal leading-tight line-clamp-2 mb-0.5 sm:mb-1">
                          {{ person['Фамилия'] || person['ФИО'] || 'Без фамилии' }} 
                          {{ person['Имя'] || '' }} 
                          {{ person['Отчество'] || '' }}
                        </h3>

                        <!-- Description (Role & Rank) -->
                        <div class="text-[10px] sm:text-sm opacity-80 mb-1 sm:mb-3 leading-relaxed">
                          <p class="font-medium truncate">{{ person['Должность'] || 'Должность не указана' }}</p>
                          <p class="uppercase text-[9px] sm:text-xs tracking-wider opacity-80 mt-0.5 truncate">{{ person['Воинское звание'] || 'Звание не указано' }}</p>
                        </div>

                        <!-- Divider (Hidden on very small mobile to save space, visible on tablet+) -->
                        <div class="h-px bg-black/10 w-full my-1 sm:my-2 hidden sm:block"></div>

                        <!-- Footer Row: Stats & Callsign -->
                        <div class="mt-auto flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2">
                          
                          <!-- Left: Stats (Hidden on compact mobile grid) -->
                          <div class="hidden sm:flex flex-col gap-1 text-xs opacity-70 font-medium">
                            <div class="flex items-center gap-1.5" title="Личный номер">
                              <span class="uppercase tracking-wider opacity-70">Л/Н:</span>
                              <span>{{ person['Личный номер'] || '---' }}</span>
                            </div>
                            <div class="flex items-center gap-1.5" title="Возраст">
                              <span class="uppercase tracking-wider opacity-70">Возраст:</span>
                              <span>{{ getAgeLabel(person['Возраст'] || '') }}</span>
                            </div>
                          </div>

                          <!-- Right: Callsign -->
                          <div 
                             class="text-[10px] sm:text-sm font-bold uppercase tracking-wide text-left sm:text-right truncate"
                             [class]="getTextColorClass(person)"
                          >
                            {{ person['Позывной'] || '' }}
                          </div>

                        </div>

                      </div>

                      <!-- Expense Status Badge: Smaller on mobile -->
                      @if (person['Расход']) {
                         <div 
                           class="absolute top-1 right-1 sm:top-4 sm:right-4 px-1.5 py-0.5 sm:px-3 sm:py-1 rounded-full shadow-sm"
                           [class]="getStatusBadgeClasses(person['Расход'])"
                         >
                           <span class="text-[9px] sm:text-xs font-bold uppercase tracking-wide drop-shadow-sm">
                             {{ person['Расход'] }}
                           </span>
                         </div>
                      }
                    </div>
                  }
                </div>
              </section>
            }
          </div>

        </div>
      </div>

      <!-- Expanded Card Overlay (Short Tap View) -->
      @if (expandedPerson(); as person) {
        <div 
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-[scaleIn_0.15s_ease-out]"
          (click)="closeExpanded()"
        >
          <!-- Expanded Card (Full Size) -->
          <div 
             class="relative w-full max-w-sm rounded-[24px] overflow-hidden shadow-2xl flex flex-col"
             [class]="getCardThemeClasses(person)"
             (click)="$event.stopPropagation()" 
          >
             <!-- Close Btn -->
             <button (click)="closeExpanded()" class="absolute top-2 right-2 z-20 bg-black/20 text-white rounded-full p-2 hover:bg-black/40">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
             </button>

             <!-- Photo Area -->
             <div class="w-full aspect-square bg-[#E3E3E3] relative overflow-hidden">
                <img 
                  [src]="getPhotoUrl(person)" 
                  alt="Photo" 
                  class="w-full h-full object-cover"
                  onerror="this.src='https://via.placeholder.com/400x500?text=No+Photo'"
                >
                <div class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
             </div>

             <!-- Full Content -->
             <div class="p-6 flex flex-col gap-2">
                <h3 class="text-2xl font-normal leading-tight">
                  {{ person['Фамилия'] || person['ФИО'] || 'Без фамилии' }} 
                  {{ person['Имя'] || '' }} 
                  {{ person['Отчество'] || '' }}
                </h3>
                <div class="text-base opacity-80 mb-2">
                  <p class="font-medium">{{ person['Должность'] || 'Должность не указана' }}</p>
                  <p class="uppercase text-sm tracking-wider opacity-80 mt-1">{{ person['Воинское звание'] || 'Звание не указано' }}</p>
                </div>
                
                <div class="h-px bg-black/10 w-full my-2"></div>
                
                <div class="flex justify-between items-end">
                   <div class="flex flex-col gap-1 text-sm opacity-80">
                      <div><span class="font-bold">Л/Н:</span> {{ person['Личный номер'] || '---' }}</div>
                      <div><span class="font-bold">Возраст:</span> {{ getAgeLabel(person['Возраст'] || '') }}</div>
                      @if (person['Расход']) {
                        <div class="mt-2 inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide w-max" [class]="getStatusBadgeClasses(person['Расход'])">
                           {{ person['Расход'] }}
                        </div>
                      }
                   </div>
                   <div class="text-xl font-bold uppercase tracking-wide" [class]="getTextColorClass(person)">
                      {{ person['Позывной'] || '' }}
                   </div>
                </div>
             </div>
          </div>
        </div>
      }
      
      <!-- Scroll To Top FAB -->
      @if (showScrollButton()) {
        <button 
          (click)="scrollToTop()"
          class="fixed bottom-6 right-6 w-14 h-14 bg-primary-container hover:bg-[#C2D6FC] text-[#041E49] rounded-[16px] shadow-elevation-3 flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 z-50 animate-[scaleIn_0.2s_ease-out]"
          title="Наверх"
        >
           <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path></svg>
        </button>
      }

    </div>
  `
})
export class DashboardComponent {
  rows = input.required<Record<string, string>[]>();
  images = input<Map<string, string>>(new Map());
  searchText = input<string>('');
  filters = input<Record<string, Set<string>>>({}); 
  
  detailRequested = output<Record<string, string>>();
  
  showScrollButton = signal(false);
  expandedPerson = signal<Record<string, string> | null>(null);

  private longPressTimer: any;
  private isLongPressTriggered = false;
  
  @ViewChild('scrollContainer') scrollContainer!: ElementRef;

  // Configuration for groups
  private readonly GROUP_CONFIG = [
    { name: 'Управление роты', start: 1, end: 6 },
    { name: '1 штурмовой взвод', start: 7, end: 25 },
    { name: '2 штурмовой взвод', start: 26, end: 44 },
    { name: '3 штурмовой взвод', start: 45, end: 63 },
    { name: '4 штурмовой взвод', start: 64, end: 82 },
    { name: '5 штурмовой взвод', start: 83, end: 101 },
    { name: 'взвод огневой поддержки', start: 102, end: 129 },
    { name: 'разведывательное отделение', start: 130, end: 135 },
    { name: 'огнеметное отделение', start: 136, end: 140 },
    { name: 'взвод БПЛА', start: 141, end: 152 },
    { name: 'отделение сбора и эвакуации раненных', start: 152, end: 157 } 
  ];

  totalRows = computed(() => this.rows().length);
  
  presentCount = computed(() => {
    return this.rows().filter(row => {
      const val = row['Расход'];
      return val && val.toLowerCase().trim() === 'налицо';
    }).length;
  });

  vacationCount = computed(() => {
    return this.rows().filter(row => {
      const val = row['Расход'];
      return val && val.toLowerCase().trim() === 'отпуск';
    }).length;
  });

  vacantPosCount = computed(() => {
    return this.rows().filter(row => {
      const surname = (row['Фамилия'] || '').toLowerCase().trim();
      return surname === 'вакант';
    }).length;
  });

  groupedPersonnel = computed(() => {
    const all = this.rows();
    const query = (this.searchText() || '').toLowerCase().trim();
    const activeFilters = this.filters();
    const filterKeys = Object.keys(activeFilters);
    const searchColumns = ['Должность', 'Фамилия', 'Личный номер', 'Регион проживания', 'Позывной'];
    
    if (all.length === 0) return [];
    
    return this.GROUP_CONFIG.map(config => {
      // 1. First, slice the group based on the FIXED indices from the Full List
      const startIndex = Math.max(0, config.start - 1);
      const endIndex = Math.min(all.length, config.end);
      let groupRows = all.slice(startIndex, endIndex);

      // 2. Apply Filters specifically to this group's members
      if (filterKeys.length > 0) {
        groupRows = groupRows.filter(row => {
          return filterKeys.every(key => {
            const selectedValues = activeFilters[key];
            if (!selectedValues || selectedValues.size === 0) return true; 
            const rowValue = row[key] || '(Empty)';
            return selectedValues.has(rowValue);
          });
        });
      }

      // 3. Apply Search specifically to this group's members
      if (query) {
        groupRows = groupRows.filter(row => {
          return searchColumns.some(col => {
            const val = row[col];
            return val && (val as string).toLowerCase().includes(query);
          });
        });
      }

      // 4. Sort by Number
      groupRows = groupRows.sort((a, b) => {
        const numA = parseInt(a['№ п/п'] || '0', 10);
        const numB = parseInt(b['№ п/п'] || '0', 10);
        return numA - numB;
      });

      return {
        name: config.name,
        rows: groupRows
      };
    }).filter(group => group.rows.length > 0);
  });

  getPhotoUrl(person: any): string {
    const map = this.images();
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

    return `https://via.placeholder.com/400x500?text=${encodeURIComponent(surname || 'No Photo')}`;
  }

  // Helper to format age with Russian declension
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

  // Determine Text Color for Callsign (No Wrapper)
  getTextColorClass(person: Record<string, string>): string {
    const category = (person['ШДК категория в/сл.'] || '').toLowerCase().trim();
    const surname = (person['Фамилия'] || '').toLowerCase().trim();

    if (surname === 'вакант') {
      return 'text-[#410002]';
    }

    if (category === 'офицер' || category === 'сержант') {
      return 'text-[#B3261E]'; 
    }

    return 'text-[#0B57D0]'; // Blue (Primary)
  }

  // Card Background Logic
  getCardThemeClasses(person: Record<string, string>): string {
    const category = (person['ШДК категория в/сл.'] || '').toLowerCase().trim();
    const surname = (person['Фамилия'] || '').toLowerCase().trim();

    // Vacant -> Purple
    if (surname === 'вакант') {
      return 'bg-[#F3E5F5] text-[#410002] border-transparent hover:bg-[#E1BEE7]';
    }

    // Officer -> Light Red
    if (category === 'офицер') {
       return 'bg-[#F9DEDC] text-[#410002] border-transparent hover:bg-[#F2B8B5]';
    }

    // Praporshchik -> Light Green
    if (category === 'прапорщик') {
       return 'bg-[#DCF8C6] text-[#072711] border-transparent hover:bg-[#C5E1A5]';
    }

    // Sergeant -> Light Blue
    if (category === 'сержант') {
       return 'bg-[#E3F2FD] text-[#041E49] border-transparent hover:bg-[#BBDEFB]';
    }

    // Default -> Light Surface
    return 'bg-surface-light text-[#1F1F1F] border-transparent hover:border-[#E3E3E3]';
  }

  // Status Badge Logic
  getStatusBadgeClasses(status: string): string {
    const s = status.toLowerCase().trim();
    if (s === 'налицо') return 'bg-[#C4EED0] text-[#072711]';
    if (s === 'отпуск') return 'bg-[#D3E3FD] text-[#041E49]';
    if (s === 'болен' || s === 'госпиталь') return 'bg-[#FDF2B4] text-[#484600]';
    if (s === 'соч') return 'bg-[#B3261E] text-white';
    return 'bg-[#E3E3E3] text-[#444746]';
  }

  // Scroll Handling
  onScroll(event: Event) {
    const target = event.target as HTMLElement;
    if (target.scrollTop > 300) {
      this.showScrollButton.set(true);
    } else {
      this.showScrollButton.set(false);
    }
  }

  scrollToTop() {
    if (this.scrollContainer) {
      this.scrollContainer.nativeElement.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  // --- Long Press & Click Logic ---
  
  startLongPress(person: Record<string, string>) {
    this.isLongPressTriggered = false; // Reset flag
    this.longPressTimer = setTimeout(() => {
      this.isLongPressTriggered = true;
      this.detailRequested.emit(person);
      if (navigator.vibrate) navigator.vibrate(50);
    }, 500); // 500ms for long press
  }

  cancelLongPress() {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  }

  onCardClick(person: Record<string, string>) {
    // Only trigger expand (click) if the long press didn't trigger
    if (!this.isLongPressTriggered) {
      this.expandedPerson.set(person);
    }
    this.isLongPressTriggered = false; // Reset for next interaction
  }

  closeExpanded() {
    this.expandedPerson.set(null);
  }
}