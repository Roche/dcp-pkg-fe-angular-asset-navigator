import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { TranslateModule } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { AssetNavigatorOption, AssetNavigatorSelection, SelectedValue } from '../../types/AssetNavigator';
import { LevelSelectorItemComponent } from './level-selector-item.component';
import { EditorTranslation, translateString } from '../../composables/useTranslation';

export function isSelectedValueDevice(value: SelectedValue, options: AssetNavigatorOption[]): boolean {
  if (value === null || value === '') {
    return false;
  }

  const values = Array.isArray(value) ? value : [value];
  if (values.length === 0) {
    return false;
  }

  return values.every(item => options.find(option => option.value === item)?.isDevice === true);
}

const normalizeSelection = (val: SelectedValue | undefined): SelectedValue =>
  Array.isArray(val) ? [...val] : (val ?? null);

const selectionsEqual = (left: SelectedValue, right: SelectedValue): boolean => {
  if (Array.isArray(left) && Array.isArray(right)) {
    return left.length === right.length && left.every((item, index) => item === right[index]);
  }

  return left === right;
};

@Component({
  selector: 'odcp-level-selector',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatChipsModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    LevelSelectorItemComponent,
    TranslateModule
  ],
  templateUrl: './level-selector.component.html',
  styles: `
    .asset-navigator-combobox {
      width: 260px !important;
      flex-shrink: 0 !important;

      &__field {
        width: 100%;
      }

      &__option-label {
        display: block;
      }

      &__option-description {
        display: block;
        font-size: 0.75rem;
        opacity: 0.7;
      }

      &__option--selected {
        font-weight: 600;
      }
    }

    :host ::ng-deep .asset-navigator-combobox {
      .mat-mdc-text-field-wrapper,
      .mat-mdc-form-field-flex,
      .mat-mdc-form-field-infix,
      input {
        background: transparent !important;
        padding-left: 0 !important;
      }

      .mdc-text-field--filled:not(.mdc-text-field--disabled) {
        background-color: transparent !important;
      }

      .mat-mdc-form-field-focus-overlay {
        background: transparent !important;
        opacity: 0 !important;
      }

      .mat-mdc-form-field-icon-suffix .mat-icon {
        color: var(--mat-sys-primary, var(--mdc-theme-primary)) !important;
      }

      .mat-mdc-floating-label {
        margin-left: 0 !important;
      }
    }
  `
})
export class LevelSelectorComponent implements OnChanges, OnDestroy {
  @Input({ required: true }) options: AssetNavigatorOption[] = [];
  @Input() label = '';
  @Input({ required: true }) isLoading = false;
  @Input() multiple = false;
  @Input() device = false;
  @Input() clearable = false;
  @Input() clearableFinalStep = false;
  @Input() selectedValue: SelectedValue = null;
  @Input() disabledIds: string[] = [];
  @Input() hideDisabledIds = false;
  @Input() translation?: EditorTranslation;

  @Output() select = new EventEmitter<AssetNavigatorSelection>();
  @Output() cleared = new EventEmitter<void>();

  readonly searchControl = new FormControl('', { nonNullable: true });

  selected: SelectedValue = null;
  processedOptions: AssetNavigatorOption[] = [];
  filteredOptions: AssetNavigatorOption[] = [];

  private readonly subscription = new Subscription();

  constructor() {
    this.subscription.add(
      this.searchControl.valueChanges.subscribe(() => this.refreshFilteredOptions())
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['options'] || changes['disabledIds'] || changes['hideDisabledIds']) {
      this.refreshProcessedOptions();
    }

    if (changes['selectedValue']) {
      const normalized = normalizeSelection(this.selectedValue);
      if (!selectionsEqual(this.selected, normalized)) {
        this.selected = normalized;
        this.restoreDisplayText();
      }
    }

    if (changes['isLoading']) {
      this.isLoading ? this.searchControl.disable() : this.searchControl.enable();
    }

    this.refreshFilteredOptions();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  get hasSelection(): boolean {
    return Array.isArray(this.selected) ? this.selected.length > 0 : !!this.selected;
  }

  get isDeviceSelection(): boolean {
    return isSelectedValueDevice(this.selected, this.processedOptions);
  }

  get isDeviceMode(): boolean {
    return this.device && this.multiple && this.hasSelection && this.isDeviceSelection;
  }

  get showClear(): boolean {
    return this.hasSelection && (this.clearable || (this.clearableFinalStep && this.isDeviceSelection));
  }

  get selectedOption(): AssetNavigatorOption | null {
    if (Array.isArray(this.selected) || !this.selected) {
      return null;
    }
    const value = this.selected;
    return this.processedOptions.find(option => option.value === value) ?? null;
  }

  get selectedOptions(): AssetNavigatorOption[] {
    if (!Array.isArray(this.selected)) {
      return [];
    }
    return this.selected
        .map(item => this.processedOptions.find(option => option.value === item))
        .filter((option): option is AssetNavigatorOption => option !== undefined);
  }

  trackByValue(_index: number, option: AssetNavigatorOption): string {
    return option.value;
  }

  isOptionDisabled(option: AssetNavigatorOption): boolean {
    return option.disabled === true || (this.isDeviceMode && option.isDevice !== true);
  }

  isOptionSelected(option: AssetNavigatorOption): boolean {
    return Array.isArray(this.selected) ? this.selected.includes(option.value) : this.selected === option.value;
  }

  onOptionSelected(event: MatAutocompleteSelectedEvent): void {
    const value = event.option.value as string;
    const current = this.selected;

    if (this.isDeviceMode && Array.isArray(current)) {
      const next = current.includes(value)
          ? current.filter(item => item !== value)
          : [...current, value];
      this.searchControl.setValue('');
      this.applySelection(next);
      return;
    }

    const isDevice = isSelectedValueDevice(value, this.processedOptions);
    if (isDevice && this.multiple && this.device) {
      this.searchControl.setValue('');
      this.applySelection([value]);
      return;
    }

    this.selected = value;
    this.restoreDisplayText();
    this.select.emit({ value, isDevice });
  }

  removeValue(value: string): void {
    if (!Array.isArray(this.selected)) {
      return;
    }
    this.applySelection(this.selected.filter(item => item !== value));
  }

  clear(event: Event): void {
    event.stopPropagation();
    this.selected = null;
    this.searchControl.setValue('');
    this.cleared.emit();
  }

  restoreDisplayText(): void {
    const text = this.isDeviceMode ? '' : (this.selectedOption?.label ?? '');
    if (this.searchControl.value !== text) {
      this.searchControl.setValue(text);
    }
  }

  private applySelection(next: string[]): void {
    if (next.length === 0) {
      this.selected = null;
      this.cleared.emit();
      return;
    }

    this.selected = next;
    this.select.emit({ value: next, isDevice: isSelectedValueDevice(next, this.processedOptions) });
  }

  private refreshProcessedOptions(): void {
    let result = this.options;

    if (this.hideDisabledIds) {
      result = result.filter(option => !this.disabledIds.includes(option.value));
    }

    this.processedOptions = result.map(option => ({
      ...option,
      disabled: this.disabledIds.includes(option.value)
    }));
  }

  private refreshFilteredOptions(): void {
    const term = this.searchControl.value.trim().toLowerCase();

    if (!term || (!this.isDeviceMode && term === this.selectedOption?.label.toLowerCase())) {
      this.filteredOptions = this.processedOptions;
      return;
    }

    this.filteredOptions = this.processedOptions.filter(option =>
      option.label.toLowerCase().includes(term) ||
      (option.description?.toLowerCase().includes(term) ?? false)
    );
  }

  getLabel(label: string) {
    return translateString(label, this.translation);
  }
  
}
