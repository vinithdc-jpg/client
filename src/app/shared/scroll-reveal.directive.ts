import {
  AfterViewInit,
  ChangeDetectorRef,
  Directive,
  ElementRef,
  HostBinding,
  Input,
  OnDestroy,
  inject,
} from '@angular/core';

@Directive({
  selector: '[appScrollReveal]',
  standalone: true,
})
export class ScrollRevealDirective implements AfterViewInit, OnDestroy {
  @Input() appScrollReveal = 0;

  @HostBinding('class.scroll-reveal')
  protected readonly revealClass = true;

  @HostBinding('class.is-revealed')
  protected isRevealed = false;

  @HostBinding('style.--reveal-delay')
  protected get revealDelay(): string {
    return `${this.appScrollReveal}ms`;
  }

  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly changeDetector = inject(ChangeDetectorRef);
  private observer?: IntersectionObserver;

  ngAfterViewInit(): void {
    if (
      typeof IntersectionObserver === 'undefined' ||
      typeof window === 'undefined' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      this.isRevealed = true;
      this.changeDetector.markForCheck();
      return;
    }

    this.observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          this.isRevealed = true;
          this.changeDetector.markForCheck();
          this.observer?.unobserve(entry.target);
        }
      },
      { threshold: 0.15 },
    );
    this.observer.observe(this.element);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
