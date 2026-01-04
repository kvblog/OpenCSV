
import { Component, input, output, computed, signal, ViewChild, ElementRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LOGO_DATA_URI } from '../utils/logo.constant';
import { ScrollAnimateDirective } from '../directives/scroll-animate.directive';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ScrollAnimateDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    @keyframes slideInBottom {
      0% {
        opacity: 0;
        transform: translateY(50px);
      }
      100% {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    /* Make this class available globally within this component's shadow DOM/scope */
    ::ng-deep .animate-slide-in-bottom {
      animation: slideInBottom 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
    }
  `],
  template: `
    <!-- Main scrollable container for everything -->
    <div 
      class="h-full overflow-y-auto custom-scrollbar bg-[#F3F6FC] px-4 py-6 scroll-smooth" 
      (scroll)="onScroll($event)"
      #scrollContainer
    >
      
      <!-- Stats Section -->
      <div class="mb-8 z-10 transition-all duration-300 ease-in-out">
        <!-- Stats Toggle Header -->
        <div class="flex items-center justify-between mb-3 select-none cursor-pointer group" (click)="toggleStats()">
           <div class="flex items-center gap-2">
             <h2 class="text-sm font-bold text-gray-500 uppercase tracking-widest">Статистика</h2>
             <span class="text-xs bg-gray-200 px-2.5 py-0.5 rounded-full text-gray-600 font-bold shadow-sm">{{ totalRows() }} чел.</span>
           </div>
           <button 
             class="p-2 rounded-full text-gray-400 hover:bg-white hover:shadow-sm transition-all"
             title="{{ showStats() ? 'Скрыть статистику' : 'Показать статистику' }}"
           >
             <svg class="w-5 h-5 transition-transform duration-300" [class.rotate-180]="!showStats()" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"></path>
             </svg>
           </button>
        </div>

        <!-- Stats Grid (Collapsible) -->
        @if (showStats()) {
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 w-full max-w-7xl mx-auto animate-[slideDown_0.3s_ease-out]">
            
            <!-- 1. Total (По штату) -->
            <div class="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center min-h-[80px]">
              <span class="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">По штату</span>
              <span class="text-2xl font-bold text-gray-800">{{ totalRows() }}</span>
            </div>

            <!-- 2. Vacant (Вакант) -->
            <div class="bg-purple-50 p-4 rounded-2xl shadow-sm border border-purple-100 flex flex-col items-center justify-center min-h-[80px]">
              <span class="text-[10px] font-bold text-purple-800/60 uppercase tracking-wider mb-1">Вакант</span>
              <span class="text-2xl font-bold text-purple-900">{{ vacantPosCount() }}</span>
            </div>

            <!-- 3. Present (Налицо) -->
            <div class="bg-emerald-50 p-4 rounded-2xl shadow-sm border border-emerald-100 flex flex-col items-center justify-center min-h-[80px]">
              <span class="text-[10px] font-bold text-emerald-800/60 uppercase tracking-wider mb-1">Налицо</span>
              <span class="text-2xl font-bold text-emerald-900">{{ presentCount() }}</span>
            </div>

            <!-- 4. On Task (На задаче) -->
            <div class="bg-teal-50 p-4 rounded-2xl shadow-sm border border-teal-100 flex flex-col items-center justify-center min-h-[80px]">
              <span class="text-[10px] font-bold text-teal-800/60 uppercase tracking-wider mb-1">На задаче</span>
              <span class="text-2xl font-bold text-teal-900">{{ onTaskCount() }}</span>
            </div>

            <!-- 5. Recovery (Восстановление) -->
            <div class="bg-amber-50 p-4 rounded-2xl shadow-sm border border-amber-100 flex flex-col items-center justify-center min-h-[80px]">
              <span class="text-[10px] font-bold text-amber-800/60 uppercase tracking-wider mb-1">Восстановление</span>
              <span class="text-2xl font-bold text-amber-900">{{ recoveryCount() }}</span>
            </div>

            <!-- 6. Hospital (Госпиталь) -->
            <div class="bg-pink-50 p-4 rounded-2xl shadow-sm border border-pink-100 flex flex-col items-center justify-center min-h-[80px]">
              <span class="text-[10px] font-bold text-pink-800/60 uppercase tracking-wider mb-1">Госпиталь</span>
              <span class="text-2xl font-bold text-pink-900">{{ hospitalCount() }}</span>
            </div>

            <!-- 7. Vacation (Отпуск) -->
            <div class="bg-blue-50 p-4 rounded-2xl shadow-sm border border-blue-100 flex flex-col items-center justify-center min-h-[80px]">
              <span class="text-[10px] font-bold text-blue-800/60 uppercase tracking-wider mb-1">Отпуск</span>
              <span class="text-2xl font-bold text-blue-900">{{ vacationCount() }}</span>
            </div>
            
            <!-- 8. SOCH (СОЧ) -->
            <div class="bg-red-50 p-4 rounded-2xl shadow-sm border border-red-100 flex flex-col items-center justify-center min-h-[80px]">
              <span class="text-[10px] font-bold text-red-800/60 uppercase tracking-wider mb-1">СОЧ</span>
              <span class="text-2xl font-bold text-red-900">{{ sochCount() }}</span>
            </div>
          </div>
        }
      </div>

      <!-- Personnel Cards Area -->
      <div class="pb-24"> <!-- Extra padding for FAB -->
        <div class="max-w-7xl mx-auto">
          
          <div class="flex flex-col gap-8">
            @for (group of groupedPersonnel(); track group.name) {
              <section class="animate-[fadeIn_0.3s_ease-out]">
                <!-- Group Header -->
                <div 
                  class="flex items-center mb-4 cursor-pointer select-none group hover:bg-white p-3 rounded-xl transition-all border border-transparent hover:border-gray-200 hover:shadow-sm"
                  (click)="toggleGroup(group.name)"
                >
                  <div class="mr-3 text-gray-400 transition-transform duration-300 bg-gray-100 rounded-full p-1" [class.-rotate-90]="isGroupCollapsed(group.name)">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                  <h3 class="text-lg font-bold text-gray-800 pr-4 z-10 flex items-center gap-3">
                    {{ group.name }} 
                    <span class="text-xs font-bold bg-gray-100 text-gray-500 px-2.5 py-1 rounded-md">
                      {{ group.rows.length }}
                    </span>
                  </h3>
                  <div class="h-px bg-gray-200 flex-1 ml-4 group-hover:bg-gray-300 transition-colors"></div>
                </div>

                <!-- Cards Grid -->
                @if (!isGroupCollapsed(group.name)) {
                  <div class="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                    @for (person of group.rows; track $index) {
                      <!-- Card with scroll animation -->
                      <div 
                        scrollAnimate
                        class="relative flex flex-col rounded-2xl sm:rounded-3xl overflow-hidden transition-all duration-300 group shadow-sm hover:shadow-lg border border-gray-100/50 cursor-pointer select-none bg-white"
                        [class]="getCardThemeClasses(person)"
                        (mousedown)="startLongPress(person)"
                        (touchstart)="startLongPress(person)"
                        (mouseup)="cancelLongPress()"
                        (touchend)="cancelLongPress()"
                        (mouseleave)="cancelLongPress()"
                        (click)="onCardClick(person)"
                      >
                        
                        <!-- Photo Area (1:1) -->
                        <div class="w-full aspect-square bg-gray-200 relative overflow-hidden pointer-events-none">
                          <img 
                            [src]="getPhotoUrl(person)" 
                            alt="Photo" 
                            loading="lazy"
                            class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            (error)="handleImageError($event)"
                          >
                          <div class="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60"></div>
                        </div>

                        <!-- Content Body -->
                        <div class="p-4 sm:p-5 flex flex-col flex-1 gap-1.5 pointer-events-none relative">
                           <!-- Floating Rank Badge -->
                           <div class="absolute -top-8 left-4 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm border border-white/20">
                             <p class="uppercase text-[10px] font-bold tracking-widest text-gray-800">
                               {{ person['Воинское звание'] || '---' }}
                             </p>
                           </div>

                          <!-- Name -->
                          <h3 class="text-sm sm:text-lg font-extrabold uppercase tracking-wide leading-tight line-clamp-2 mt-1 text-gray-900">
                            {{ person['Фамилия'] || person['ФИО'] || 'Без фамилии' }} 
                            <span class="font-medium text-gray-600 block text-xs sm:text-sm normal-case mt-0.5">{{ person['Имя'] || '' }} {{ person['Отчество'] || '' }}</span>
                          </h3>

                          <!-- Role -->
                          <p class="text-[11px] sm:text-xs text-gray-500 font-medium leading-relaxed line-clamp-2 mb-2 min-h-[2.5em]">
                            {{ person['Должность'] || 'Должность не указана' }}
                          </p>

                          <!-- Divider -->
                          <div class="h-px bg-gray-100 w-full my-1"></div>

                          <!-- Footer -->
                          <div class="mt-auto flex flex-col sm:flex-row sm:items-end justify-between gap-1 w-full">
                            <!-- Stats -->
                            <div class="flex flex-col gap-0.5 text-[10px] sm:text-xs text-gray-400 font-semibold">
                              <span class="tracking-wider">Л/Н: <span class="text-gray-600 font-mono">{{ person['Личный номер'] || '---' }}</span></span>
                              <span class="tracking-wider">Возраст: <span class="text-gray-600">{{ getAgeLabel(person['Возраст'] || '') }}</span></span>
                            </div>

                            <!-- Callsign -->
                            <div 
                               class="text-xs sm:text-sm font-black uppercase tracking-wide text-right self-end ml-auto truncate max-w-full"
                               [class]="getTextColorClass(person)"
                            >
                              {{ person['Позывной'] || '' }}
                            </div>
                          </div>
                        </div>

                        <!-- Expense Status Badge -->
                        @if (person['Расход']) {
                           <div 
                             class="absolute top-2 right-2 sm:top-3 sm:right-3 px-2.5 py-1 rounded-md shadow-sm border border-white/20 backdrop-blur-md"
                             [class]="getStatusBadgeClasses(person['Расход'])"
                           >
                             <span class="text-[9px] sm:text-xs font-bold uppercase tracking-wide">
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

      <!-- Expanded Card Overlay -->
      @if (expandedPerson(); as person) {
        <div 
          class="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/80 backdrop-blur-md p-6 animate-[fadeIn_0.2s_ease-out]"
          (click)="closeExpanded()"
        >
          <div 
             class="relative w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col ring-1 ring-white/10"
             (click)="$event.stopPropagation()" 
          >
             <button (click)="closeExpanded()" class="absolute top-3 right-3 z-20 bg-white/20 text-white rounded-full p-2 hover:bg-white/40 backdrop-blur-md transition-colors">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
             </button>

             <div class="w-full aspect-square bg-gray-200 relative overflow-hidden">
                <img 
                  [src]="getPhotoUrl(person)" 
                  alt="Photo" 
                  class="w-full h-full object-cover"
                  (error)="handleImageError($event)"
                >
                <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                
                <div class="absolute bottom-0 left-0 w-full p-6 text-white">
                  <p class="uppercase text-xs font-bold tracking-widest opacity-80 mb-1">
                    {{ person['Воинское звание'] || 'Звание не указано' }}
                  </p>
                  <h3 class="text-3xl font-black uppercase leading-none">
                    {{ person['Фамилия'] || person['ФИО'] }} 
                  </h3>
                  <p class="text-lg font-medium opacity-90">{{ person['Имя'] }} {{ person['Отчество'] }}</p>
                </div>
             </div>

             <div class="p-6 flex flex-col gap-4 bg-white">
                
                <!-- Role Field (Restored to Text Style) -->
                <p class="text-xs font-bold text-primary uppercase tracking-widest mb-4 opacity-90 leading-relaxed">
                   {{ person['Должность'] || 'Должность не указана' }}
                </p>
                
                <div class="grid grid-cols-2 gap-4">
                   <div class="bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <span class="text-xs font-bold text-gray-400 uppercase block mb-1">Личный номер</span>
                      <span class="font-mono font-bold text-gray-800">{{ person['Личный номер'] || '---' }}</span>
                   </div>
                   <div class="bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <span class="text-xs font-bold text-gray-400 uppercase block mb-1">Возраст</span>
                      <span class="font-bold text-gray-800">{{ getAgeLabel(person['Возраст'] || '') }}</span>
                   </div>
                </div>

                <div class="flex justify-between items-center pt-2 border-t border-gray-100 mt-2">
                   @if (person['Расход']) {
                     <div class="px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wide" [class]="getStatusBadgeClasses(person['Расход'])">
                        {{ person['Расход'] }}
                     </div>
                   }
                   <div class="text-xl font-black uppercase tracking-wide text-right ml-auto" [class]="getTextColorClass(person)">
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
          class="fixed bottom-8 right-8 w-12 h-12 bg-primary text-white rounded-full shadow-lg shadow-primary/40 flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 z-50 animate-[scaleIn_0.2s_ease-out] border border-white/20"
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

  protected readonly LOGO_DATA_URI = LOGO_DATA_URI;

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

    // Return logo if not found (or allow img error handler to catch it)
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

  // Determine Text Color for Callsign (No Wrapper)
  getTextColorClass(person: Record<string, string>): string {
    const category = (person['ШДК категория в/сл.'] || '').toLowerCase().trim();
    const surname = (person['Фамилия'] || '').toLowerCase().trim();

    if (surname === 'вакант') return 'text-purple-800';
    if (category === 'офицер' || category === 'сержант') return 'text-red-700';

    return 'text-blue-700'; 
  }

  // Card Background Logic - Keeping it lighter/cleaner now
  getCardThemeClasses(person: Record<string, string>): string {
    const category = (person['ШДК категория в/сл.'] || '').toLowerCase().trim();
    const surname = (person['Фамилия'] || '').toLowerCase().trim();

    // Subtle colored borders instead of full colored backgrounds for cleaner look
    if (surname === 'вакант') return 'hover:border-purple-200';
    if (category === 'офицер') return 'hover:border-red-200';
    if (category === 'прапорщик') return 'hover:border-green-200';
    if (category === 'сержант') return 'hover:border-blue-200';

    return 'hover:border-gray-300';
  }

  // Status Badge Logic - Stronger colors
  getStatusBadgeClasses(status: string): string {
    const s = status.toLowerCase().trim();
    if (s === 'налицо') return 'bg-emerald-100 text-emerald-800';
    if (s === 'отпуск') return 'bg-blue-100 text-blue-800';
    if (s === 'болен' || s === 'госпиталь' || s === 'медицинская рота') return 'bg-amber-100 text-amber-900';
    if (s === 'соч') return 'bg-red-600 text-white';
    return 'bg-gray-200 text-gray-600';
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
