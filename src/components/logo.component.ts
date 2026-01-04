
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { LOGO_DATA_URI } from '../utils/logo.constant';

@Component({
  selector: 'app-logo',
  standalone: true,
  template: `
    <div class="w-full h-full flex items-center justify-center overflow-hidden">
      <img 
        [src]="logoPath" 
        alt="Logo" 
        class="w-full h-full object-contain"
      >
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`:host { display: block; width: 100%; height: 100%; }`]
})
export class LogoComponent {
  logoPath = LOGO_DATA_URI;
}
