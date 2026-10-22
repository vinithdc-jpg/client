import {
  Component,
  ElementRef,
  forwardRef,
  HostListener,
  Input,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

interface CalendarDay {
  date: Date;
  label: number;
  isCurrentMonth: boolean;
  isSelected: boolean;
  isToday: boolean;
}

@Component({
  selector: 'app-date-picker',
  standalone: true,
  templateUrl: './date-picker.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DatePickerComponent),
      multi: true,
    },
  ],
})
export class DatePickerComponent implements ControlValueAccessor {
  @Input() inputId = 'date-picker';
  @Input() placeholder = 'Select a date';

  private selectedValue = '';
  private viewDate = this.startOfMonth(new Date());
  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  isOpen = false;
  isDisabled = false;
  readonly weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  constructor(private readonly elementRef: ElementRef<HTMLElement>) {}

  get monthLabel(): string {
    return this.viewDate.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  }

  get selectedLabel(): string {
    const date = this.parseDate(this.selectedValue);
    return date
      ? date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      : '';
  }

  get hasSelectedValue(): boolean {
    return this.selectedValue !== '';
  }

  get calendarDays(): CalendarDay[] {
    const firstOfMonth = this.startOfMonth(this.viewDate);
    const firstVisibleDay = new Date(
      firstOfMonth.getFullYear(),
      firstOfMonth.getMonth(),
      1 - firstOfMonth.getDay(),
    );
    const numberOfDays = new Date(
      firstOfMonth.getFullYear(),
      firstOfMonth.getMonth() + 1,
      0,
    ).getDate();
    const numberOfWeeks = Math.ceil((firstOfMonth.getDay() + numberOfDays) / 7);
    const selectedValue = this.selectedValue;
    const todayValue = this.toDateValue(new Date());

    return Array.from({ length: numberOfWeeks * 7 }, (_, index) => {
      const date = new Date(
        firstVisibleDay.getFullYear(),
        firstVisibleDay.getMonth(),
        firstVisibleDay.getDate() + index,
      );
      const value = this.toDateValue(date);

      return {
        date,
        label: date.getDate(),
        isCurrentMonth: date.getMonth() === firstOfMonth.getMonth(),
        isSelected: value === selectedValue,
        isToday: value === todayValue,
      };
    });
  }

  writeValue(value: string | null): void {
    this.selectedValue = value ?? '';
    const selectedDate = this.parseDate(this.selectedValue);
    if (selectedDate) {
      this.viewDate = this.startOfMonth(selectedDate);
    }
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
  }

  toggleCalendar(): void {
    if (this.isDisabled) {
      return;
    }
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      const selectedDate = this.parseDate(this.selectedValue);
      this.viewDate = this.startOfMonth(selectedDate ?? new Date());
    }
  }

  changeMonth(offset: number): void {
    this.viewDate = new Date(
      this.viewDate.getFullYear(),
      this.viewDate.getMonth() + offset,
      1,
    );
  }

  selectDate(date: Date): void {
    this.selectedValue = this.toDateValue(date);
    this.onChange(this.selectedValue);
    this.onTouched();
    this.isOpen = false;
  }

  selectToday(): void {
    this.selectDate(new Date());
  }

  clearDate(): void {
    this.selectedValue = '';
    this.onChange('');
    this.onTouched();
    this.isOpen = false;
  }

  @HostListener('document:click', ['$event'])
  closeOnOutsideClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target as Node)) {
      this.isOpen = false;
    }
  }

  @HostListener('document:keydown.escape')
  closeOnEscape(): void {
    this.isOpen = false;
  }

  private startOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  private toDateValue(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private parseDate(value: string): Date | null {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) {
      return null;
    }

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
      ? date
      : null;
  }
}
