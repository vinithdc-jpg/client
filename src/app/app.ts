import { NgClass } from '@angular/common';
import { AfterViewInit, Component, HostListener, OnDestroy, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { AuthService } from '../core/services/auth.service';

@Component({
  imports: [NgClass, RouterLink, RouterLinkActive, RouterOutlet],
  selector: 'app-root',
  templateUrl: './app.html',
})
export class App implements AfterViewInit, OnDestroy {
  protected readonly authService = inject(AuthService);
  protected readonly router = inject(Router);
  protected readonly isScrolled = signal(false);
  protected readonly mobileMenuOpen = signal(false);
  protected readonly indicatorX = signal(0);
  protected readonly indicatorWidth = signal(0);
  protected readonly hoveredIndex = signal(-1);

  private readonly subscriptions = new Subscription();
  private resizeObserver?: ResizeObserver;
  private mutationObserver?: MutationObserver;
  private animationFrame = 0;
  private scrollFrame = 0;
  private navContainer?: HTMLElement;
  private activeNavItem?: HTMLAnchorElement;
  private hoveredNavItem?: HTMLAnchorElement;
  private menuToggle?: HTMLButtonElement;

  ngAfterViewInit(): void {
    this.subscriptions.add(
      this.router.events
        .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
        .subscribe(() => {
          this.closeMobileMenu();
          this.hoveredIndex.set(-1);
          this.scheduleIndicatorUpdate();
        }),
    );

    this.scheduleIndicatorUpdate();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.resizeObserver?.disconnect();
    this.mutationObserver?.disconnect();
    cancelAnimationFrame(this.animationFrame);
    cancelAnimationFrame(this.scrollFrame);
  }

  protected logout(): void {
    this.authService.logout();
    this.closeMobileMenu();
    void this.router.navigate(['/login']);
  }

  protected toggleMobileMenu(toggle: HTMLButtonElement): void {
    this.menuToggle = toggle;
    this.mobileMenuOpen.update((open) => !open);
  }

  protected closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  protected onNavItemHover(index: number, item: HTMLAnchorElement, nav: HTMLElement): void {
    this.hoveredIndex.set(index);
    this.hoveredNavItem = item;
    if (this.navContainer !== nav) {
      this.observeNavigation(nav);
    }
    this.navContainer = nav;
    this.updateIndicator(item, nav);
  }

  protected onNavMouseLeave(nav: HTMLElement): void {
    this.hoveredIndex.set(-1);
    this.hoveredNavItem = undefined;
    this.updateIndicator(this.activeNavItem, nav);
  }

  protected onRouteLinkActiveChange(
    index: number,
    active: boolean,
    item: HTMLAnchorElement,
    nav: HTMLElement,
  ): void {
    if (active) {
      this.activeNavItem = item;
      this.navContainer = nav;
      this.observeNavigation(nav);
    } else if (this.activeNavItem === item) {
      this.activeNavItem = undefined;
    }
    this.updateIndicator(this.hoveredNavItem ?? this.activeNavItem, nav);
  }

  protected onNavFocusIn(event: FocusEvent, nav: HTMLElement): void {
    const item = (event.target as HTMLElement).closest<HTMLAnchorElement>('a[data-route]');
    const index = item
      ? Array.from(nav.querySelectorAll<HTMLAnchorElement>('a[data-route]')).indexOf(item)
      : -1;
    if (item && index >= 0) {
      this.onNavItemHover(index, item, nav);
    }
  }

  protected onNavFocusOut(event: FocusEvent, nav: HTMLElement): void {
    if (!nav.contains(event.relatedTarget as Node | null)) {
      this.hoveredIndex.set(-1);
      this.hoveredNavItem = undefined;
      this.updateIndicator(this.activeNavItem, nav);
    }
  }

  @HostListener('document:keydown', ['$event'])
  protected onWindowKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.mobileMenuOpen()) {
      this.closeMobileMenu();
      this.menuToggle?.focus();
    }
  }

  @HostListener('window:scroll')
  protected onWindowScroll(): void {
    if (this.scrollFrame) {
      return;
    }

    this.scrollFrame = requestAnimationFrame(() => {
      this.isScrolled.set(window.scrollY > 12);
      this.scrollFrame = 0;
    });
  }

  @HostListener('window:resize')
  protected onWindowResize(): void {
    this.scheduleIndicatorUpdate();
  }

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: MouseEvent): void {
    const target = event.target;
    if (this.mobileMenuOpen() && target instanceof Element && !target.closest('header')) {
      this.closeMobileMenu();
    }
  }

  private observeNavigation(nav: HTMLElement): void {
    this.resizeObserver?.disconnect();
    this.mutationObserver?.disconnect();
    if (typeof ResizeObserver === 'undefined') {
      this.resizeObserver = undefined;
    } else {
      this.resizeObserver = new ResizeObserver(() => this.scheduleIndicatorUpdate());
      this.resizeObserver.observe(nav);
      nav.querySelectorAll('a[data-route]').forEach((item) => this.resizeObserver?.observe(item));
    }

    if (typeof MutationObserver !== 'undefined') {
      this.mutationObserver = new MutationObserver(() => this.scheduleIndicatorUpdate());
      this.mutationObserver.observe(nav, {
        attributes: true,
        attributeFilter: ['aria-current'],
        subtree: true,
      });
    }
  }

  private scheduleIndicatorUpdate(
    item = this.hoveredNavItem ?? this.activeNavItem,
    nav = this.navContainer,
  ): void {
    cancelAnimationFrame(this.animationFrame);
    this.animationFrame = requestAnimationFrame(() => {
      this.updateIndicator(item, nav);
    });
  }

  private updateIndicator(item?: HTMLAnchorElement, nav?: HTMLElement): void {
    if (!item || !nav || nav.getBoundingClientRect().width === 0) {
      this.indicatorWidth.set(0);
      return;
    }

    const navBounds = nav.getBoundingClientRect();
    const itemBounds = item.getBoundingClientRect();
    this.indicatorX.set(itemBounds.left - navBounds.left);
    this.indicatorWidth.set(itemBounds.width);
  }
}
