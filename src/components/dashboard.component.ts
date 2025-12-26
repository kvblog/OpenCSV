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
      
      <!-- Stats Section -->
      <div class="mb-6 z-10 transition-all duration-300 ease-in-out">
        <!-- Stats Toggle Header -->
        <div class="flex items-center justify-between mb-2 select-none cursor-pointer group" (click)="toggleStats()">
           <div class="flex items-center gap-2">
             <h2 class="text-sm font-medium text-[#444746] uppercase tracking-wide">Статистика</h2>
             <span class="text-xs bg-[#E3E3E3] px-2 py-0.5 rounded-full text-[#444746]">{{ totalRows() }} чел.</span>
           </div>
           <button 
             class="p-2 rounded-full text-[#444746] hover:bg-[#E3E3E3] transition-colors"
             title="{{ showStats() ? 'Скрыть статистику' : 'Показать статистику' }}"
           >
             <svg class="w-5 h-5 transition-transform duration-300" [class.rotate-180]="!showStats()" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"></path>
             </svg>
           </button>
        </div>

        <!-- Stats Grid (Collapsible) -->
        @if (showStats()) {
          <div class="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 w-full max-w-7xl mx-auto animate-[slideDown_0.3s_ease-out]">
            
            <!-- 1. Total (По штату) -->
            <div class="bg-surface-light p-2.5 rounded-xl shadow-elevation-1 flex flex-col items-center justify-center min-h-[72px]">
              <span class="text-[10px] font-medium text-[#444746] uppercase tracking-wide mb-0.5 text-center leading-tight">По штату</span>
              <span class="text-xl font-medium text-[#1F1F1F] leading-none">{{ totalRows() }}</span>
            </div>

            <!-- 2. Vacant (Вакант) -->
            <div class="bg-[#FFDAD6] p-2.5 rounded-xl shadow-elevation-1 flex flex-col items-center justify-center text-[#410002] min-h-[72px]">
              <span class="text-[10px] font-medium uppercase tracking-wide mb-0.5 opacity-80 text-center leading-tight">Вакант</span>
              <span class="text-xl font-medium leading-none">{{ vacantPosCount() }}</span>
            </div>

            <!-- 3. Present (Налицо) -->
            <div class="bg-[#C4EED0] p-2.5 rounded-xl shadow-elevation-1 flex flex-col items-center justify-center text-[#072711] min-h-[72px]">
              <span class="text-[10px] font-medium uppercase tracking-wide mb-0.5 opacity-80 text-center leading-tight">Налицо</span>
              <span class="text-xl font-medium leading-none">{{ presentCount() }}</span>
            </div>

            <!-- 4. On Task (На задаче) -->
            <div class="bg-[#E0F2F1] p-2.5 rounded-xl shadow-elevation-1 flex flex-col items-center justify-center text-[#004D40] min-h-[72px]">
              <span class="text-[10px] font-medium uppercase tracking-wide mb-0.5 opacity-80 text-center leading-tight">На задаче</span>
              <span class="text-xl font-medium leading-none">{{ onTaskCount() }}</span>
            </div>

            <!-- 5. Recovery (Восстановление) -->
            <div class="bg-[#FFF8E1] p-2.5 rounded-xl shadow-elevation-1 flex flex-col items-center justify-center text-[#5D4037] min-h-[72px]">
              <span class="text-[9px] font-medium uppercase tracking-wide mb-0.5 opacity-80 text-center leading-tight">Восстановление</span>
              <span class="text-xl font-medium leading-none">{{ recoveryCount() }}</span>
            </div>

            <!-- 6. Hospital (Госпиталь) -->
            <div class="bg-[#FCE4EC] p-2.5 rounded-xl shadow-elevation-1 flex flex-col items-center justify-center text-[#880E4F] min-h-[72px]">
              <span class="text-[10px] font-medium uppercase tracking-wide mb-0.5 opacity-80 text-center leading-tight">Госпиталь</span>
              <span class="text-xl font-medium leading-none">{{ hospitalCount() }}</span>
            </div>

            <!-- 7. Vacation (Отпуск) -->
            <div class="bg-[#D3E3FD] p-2.5 rounded-xl shadow-elevation-1 flex flex-col items-center justify-center text-[#041E49] min-h-[72px]">
              <span class="text-[10px] font-medium uppercase tracking-wide mb-0.5 opacity-80 text-center leading-tight">Отпуск</span>
              <span class="text-xl font-medium leading-none">{{ vacationCount() }}</span>
            </div>
            
            <!-- 8. SOCH (СОЧ) -->
            <div class="bg-[#F9DEDC] p-2.5 rounded-xl shadow-elevation-1 flex flex-col items-center justify-center text-[#8C1D18] min-h-[72px]">
              <span class="text-[10px] font-medium uppercase tracking-wide mb-0.5 opacity-80 text-center leading-tight">СОЧ</span>
              <span class="text-xl font-medium leading-none">{{ sochCount() }}</span>
            </div>
          </div>
        }
      </div>

      <!-- Personnel Cards Area -->
      <div class="pb-20"> <!-- Extra padding for FAB -->
        <div class="max-w-7xl mx-auto">
          
          <div class="flex flex-col gap-6">
            @for (group of groupedPersonnel(); track group.name) {
              <section class="animate-[fadeIn_0.3s_ease-out]">
                <!-- Group Header (Clickable to Collapse) -->
                <div 
                  class="flex items-center mb-4 cursor-pointer select-none group hover:bg-black/5 rounded-lg -ml-2 p-2 transition-colors"
                  (click)="toggleGroup(group.name)"
                >
                  <div class="mr-2 text-[#444746] transition-transform duration-300" [class.-rotate-90]="isGroupCollapsed(group.name)">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                  <h3 class="text-lg font-normal text-[#1F1F1F] pr-4 z-10 flex items-center gap-2">
                    {{ group.name }} 
                    <span class="text-xs font-medium bg-[#E3E3E3] text-[#444746] px-2 py-0.5 rounded-full">
                      {{ group.rows.length }}
                    </span>
                  </h3>
                  <div class="h-px bg-[#E3E3E3] flex-1"></div>
                </div>

                <!-- Cards Grid (Collapsible) -->
                @if (!isGroupCollapsed(group.name)) {
                  <div class="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6 animate-[fadeIn_0.2s_ease-out]">
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
                        <div class="p-3 sm:p-5 flex flex-col flex-1 gap-1 pointer-events-none">
                          
                          <!-- 1. Military Rank (Moved ABOVE Name) -->
                          <p class="uppercase text-[10px] sm:text-xs tracking-wider opacity-80 font-medium truncate">
                             {{ person['Воинское звание'] || 'Звание не указано' }}
                          </p>

                          <!-- 2. Name (Increased Size, Matched Font Style to Rank) -->
                          <h3 class="text-sm sm:text-xl font-bold uppercase tracking-wide leading-tight line-clamp-2 mb-1">
                            {{ person['Фамилия'] || person['ФИО'] || 'Без фамилии' }} 
                            {{ person['Имя'] || '' }} 
                            {{ person['Отчество'] || '' }}
                          </h3>

                          <!-- 3. Role (Description) -->
                          <p class="text-[11px] sm:text-sm opacity-80 mb-2 leading-relaxed font-normal line-clamp-2">
                            {{ person['Должность'] || 'Должность не указана' }}
                          </p>

                          <!-- Divider -->
                          <div class="h-px bg-black/10 w-full my-1 hidden sm:block"></div>

                          <!-- Footer Row: Stats & Callsign -->
                          <div class="mt-auto flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2 w-full">
                            
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

                            <!-- Right: Callsign (Aligned Right) -->
                            <div 
                               class="text-[11px] sm:text-sm font-bold uppercase tracking-wide text-right self-end ml-auto truncate max-w-full"
                               [class]="getTextColorClass(person)"
                            >
                              {{ person['Позывной'] || '' }}
                            </div>

                          </div>

                        </div>

                        <!-- Expense Status Badge: Increased Font Size -->
                        @if (person['Расход']) {
                           <div 
                             class="absolute top-1 right-1 sm:top-4 sm:right-4 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full shadow-sm"
                             [class]="getStatusBadgeClasses(person['Расход'])"
                           >
                             <span class="text-[10px] sm:text-sm font-bold uppercase tracking-wide drop-shadow-sm">
                               {{ person['Расход'] }}
                             </span>
                           </div>
                        }
                      </div>
                    }
                  </div>
                }
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
             <div class="p-6 flex flex-col gap-1">
                
                <!-- Rank Above Name -->
                <p class="uppercase text-sm tracking-wider opacity-80 font-medium">
                  {{ person['Воинское звание'] || 'Звание не указано' }}
                </p>

                <!-- Name Larger -->
                <h3 class="text-2xl font-bold uppercase tracking-wide leading-tight mb-2">
                  {{ person['Фамилия'] || person['ФИО'] || 'Без фамилии' }} 
                  {{ person['Имя'] || '' }} 
                  {{ person['Отчество'] || '' }}
                </h3>

                <div class="text-base opacity-80 mb-2">
                  <p class="font-normal">{{ person['Должность'] || 'Должность не указана' }}</p>
                </div>
                
                <div class="h-px bg-black/10 w-full my-2"></div>
                
                <div class="flex justify-between items-end">
                   <div class="flex flex-col gap-1 text-sm opacity-80">
                      <div><span class="font-bold">Л/Н:</span> {{ person['Личный номер'] || '---' }}</div>
                      <div><span class="font-bold">Возраст:</span> {{ getAgeLabel(person['Возраст'] || '') }}</div>
                      @if (person['Расход']) {
                        <!-- Increased Badge Size -->
                        <div class="mt-2 inline-block px-3 py-1 rounded-full text-sm font-bold uppercase tracking-wide w-max" [class]="getStatusBadgeClasses(person['Расход'])">
                           {{ person['Расход'] }}
                        </div>
                      }
                   </div>
                   <!-- Right Aligned Callsign -->
                   <div class="text-xl font-bold uppercase tracking-wide text-right" [class]="getTextColorClass(person)">
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

  // Stats Visibility State
  showStats = signal(true);

  // Group Collapse State
  collapsedGroups = signal<Set<string>>(new Set());

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
    { name: 'отделение сбора и эвакуации раненных', start: 153, end: 157 } 
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

  recoveryCount = computed(() => {
    return this.rows().filter(row => {
      const val = row['Расход'];
      return val && val.toLowerCase().trim() === 'медицинская рота';
    }).length;
  });

  hospitalCount = computed(() => {
    return this.rows().filter(row => {
      const val = row['Расход'];
      return val && val.toLowerCase().trim() === 'госпиталь';
    }).length;
  });
  
  sochCount = computed(() => {
    return this.rows().filter(row => {
      const val = row['Расход'];
      return val && val.toLowerCase().trim() === 'соч';
    }).length;
  });

  onTaskCount = computed(() => {
    const total = this.totalRows();
    const vacant = this.vacantPosCount();
    const present = this.presentCount();
    const recovery = this.recoveryCount();
    const hospital = this.hospitalCount();
    const vacation = this.vacationCount();
    const soch = this.sochCount();

    // Subtract all other buckets from total
    const result = total - vacant - present - recovery - hospital - vacation - soch;
    return Math.max(0, result);
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

  // --- UI Toggles ---

  toggleStats() {
    this.showStats.update(v => !v);
  }

  toggleGroup(groupName: string) {
    this.collapsedGroups.update(set => {
      const newSet = new Set(set);
      if (newSet.has(groupName)) {
        newSet.delete(groupName);
      } else {
        newSet.add(groupName);
      }
      return newSet;
    });
  }

  isGroupCollapsed(groupName: string): boolean {
    return this.collapsedGroups().has(groupName);
  }

  // --- Helpers ---

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

    // Vacant -> Purple (Darker than table #F3E5F5)
    if (surname === 'вакант') {
      return 'bg-[#E1BEE7] text-[#410002] border-transparent hover:bg-[#CE93D8]';
    }

    // Officer -> Light Red (Darker than table #F9DEDC)
    if (category === 'офицер') {
       return 'bg-[#F2B8B5] text-[#410002] border-transparent hover:bg-[#E69A97]';
    }

    // Praporshchik -> Light Green (Darker than table #DCF8C6)
    if (category === 'прапорщик') {
       return 'bg-[#C5E1A5] text-[#072711] border-transparent hover:bg-[#AED581]';
    }

    // Sergeant -> Light Blue (Darker than table #E3F2FD)
    if (category === 'сержант') {
       return 'bg-[#BBDEFB] text-[#041E49] border-transparent hover:bg-[#90CAF9]';
    }

    // Default -> Light Surface (Darker than white)
    return 'bg-[#F0F0F0] text-[#1F1F1F] border-transparent hover:border-[#E3E3E3]';
  }

  // Status Badge Logic
  getStatusBadgeClasses(status: string): string {
    const s = status.toLowerCase().trim();
    if (s === 'налицо') return 'bg-[#C4EED0] text-[#072711]';
    if (s === 'отпуск') return 'bg-[#D3E3FD] text-[#041E49]';
    if (s === 'болен' || s === 'госпиталь' || s === 'медицинская рота') return 'bg-[#FDF2B4] text-[#484600]';
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