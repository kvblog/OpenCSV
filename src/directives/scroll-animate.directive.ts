
import { Directive, ElementRef, inject, AfterViewInit, OnDestroy } from '@angular/core';

@Directive({
  selector: '[scrollAnimate]',
  standalone: true
})
export class ScrollAnimateDirective implements AfterViewInit, OnDestroy {
  private el = inject(ElementRef);
  private observer: IntersectionObserver | null = null;

  ngAfterViewInit() {
    // Set initial state: fully transparent and shifted slightly to prevent flash
    this.el.nativeElement.classList.add('opacity-0');
    
    // Create observer
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Element is visible
          const target = entry.target as HTMLElement;
          
          // Remove transparency and add animation class
          target.classList.remove('opacity-0');
          target.classList.add('animate-slide-in-bottom');
          
          // Stop observing this element (animate only once)
          this.observer?.unobserve(target);
        }
      });
    }, {
      threshold: 0.1, // Trigger when 10% of the item is visible
      rootMargin: '50px 0px' // Start slightly before it enters viewport
    });

    this.observer.observe(this.el.nativeElement);
  }

  ngOnDestroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}
