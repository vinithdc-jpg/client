import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './landing.html',
  host: { class: 'block' },
})
export class LandingComponent implements OnInit, OnDestroy {
  readonly rotatingWords = ['best work', 'big idea', 'next project'];
  activeWord = this.rotatingWords[0];
  readonly currentYear = new Date().getFullYear();
  private rotationTimer?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    this.rotationTimer = setInterval(() => {
      const currentIndex = this.rotatingWords.indexOf(this.activeWord);
      this.activeWord = this.rotatingWords[(currentIndex + 1) % this.rotatingWords.length];
    }, 2800);
  }

  ngOnDestroy(): void {
    if (this.rotationTimer) {
      clearInterval(this.rotationTimer);
    }
  }
}
