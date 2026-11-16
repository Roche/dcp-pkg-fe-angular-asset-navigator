import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { TranslateModule } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { AssetNavigatorOption, SelectedValue } from '../../types/AssetNavigator';
import { SensorSelectorItemComponent } from './sensor-selector-item.component';
import { EditorTranslation, translateString } from '../../composables/useTranslation';

const optionId = (option: AssetNavigatorOption): string => option.webId ?? option.value;

@Component({
  selector: 'odcp-sensor-selector',
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
    TranslateModule,
    SensorSelectorItemComponent
  ],
  templateUrl: './sensor-selector.component.html',
  styles: `
    :host {
      display: block;
      flex: 1 1 auto;
      min-width: 0;
    }

    .asset-navigator-combobox {
      min-width: 260px;

      &__field {
        width: 100%;
      }

      &__option--selected {
        font-weight: 600;
      }
    }
    :host ::ng-deep mat-form-field {
      width: 100%;
    }
  `
})
export class SensorSelectorComponent implements OnChanges, OnDestroy {
  @Input({ required: true }) options: AssetNavigatorOption[] = [];
  @Input() label = '';
  @Input({ required: true }) isLoading = false;
  @Input() multiple = false;
  @Input() clearable = false;
  @Input() preselectedValues: string[] = [];
  @Input() disabledIds: string[] = [];
  @Input() hideDisabledIds = false;
  @Input() selectedSensorValues: string[] | null = null;
  @Input() translation?: EditorTranslation;

  @Output() selectedSensorValuesChange = new EventEmitter<string[]>();

  readonly searchControl = new FormControl('', { nonNullable: true });

  processedOptions: AssetNavigatorOption[] = [];
  filteredOptions: AssetNavigatorOption[] = [];

  private localSelected: SelectedValue = null;
  private readonly subscription = new Subscription();

  constructor() {
    this.subscription.add(
      this.searchControl.valueChanges.subscribe(() => this.refreshFilteredOptions())
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['multiple'] && this.selectedSensorValues === null) {
      this.localSelected = this.multiple ? [] : null;
    }

    if (changes['options'] || changes['disabledIds'] || changes['hideDisabledIds']) {
      this.refreshProcessedOptions();
    }

    if (changes['isLoading']) {
      this.isLoading ? this.searchControl.disable() : this.searchControl.enable();
    }

    this.restoreDisplayText();
    this.refreshFilteredOptions();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  get selected(): SelectedValue {
    if (this.selectedSensorValues === null) {
      return this.localSelected;
    }

    const available = this.selectedSensorValues
        .map(webId => this.options.find(option => optionId(option) === webId)?.value)
        .filter((value): value is string => value !== undefined);

    return this.multiple ? available : (available[0] ?? null);
  }

  get hasSelection(): boolean {
    const val = this.selected;
    return Array.isArray(val) ? val.length > 0 : !!val;
  }

  get selectedOption(): AssetNavigatorOption | null {
    const val = this.selected;
    if (Array.isArray(val) || !val) {
      return null;
    }
    return this.processedOptions.find(option => option.value === val) ?? null;
  }

  get selectedOptions(): AssetNavigatorOption[] {
    const val = this.selected;
    if (!Array.isArray(val)) {
      return [];
    }
    return val
        .map(item => this.processedOptions.find(option => option.value === item))
        .filter((option): option is AssetNavigatorOption => option !== undefined);
  }

  trackByValue(_index: number, option: AssetNavigatorOption): string {
    return option.value;
  }

  isOptionSelected(option: AssetNavigatorOption): boolean {
    const val = this.selected;
    return Array.isArray(val) ? val.includes(option.value) : val === option.value;
  }

  onOptionSelected(event: MatAutocompleteSelectedEvent): void {
    const value = event.option.value as string;

    if (this.multiple) {
      const current = Array.isArray(this.selected) ? this.selected : [];
      const next = current.includes(value)
          ? current.filter(item => item !== value)
          : [...current, value];
      this.searchControl.setValue('');
      this.setSelected(next);
      return;
    }

    this.setSelected(value);
    this.restoreDisplayText();
  }

  removeValue(value: string): void {
    const current = this.selected;
    if (!Array.isArray(current)) {
      return;
    }
    this.setSelected(current.filter(item => item !== value));
  }

  clear(event: Event): void {
    event.stopPropagation();
    this.searchControl.setValue('');
    this.setSelected(null);
  }

  restoreDisplayText(): void {
    const text = this.multiple ? '' : (this.selectedOption?.label ?? '');
    if (this.searchControl.value !== text) {
      this.searchControl.setValue(text);
    }
  }

  private setSelected(val: SelectedValue): void {
    const webIds = val === null
          ? []
          : (Array.isArray(val) ? val : [val]).map(value => this.getWebIdForOption(value));
    this.selectedSensorValues = webIds;
    this.selectedSensorValuesChange.emit(webIds);
  }

  private getWebIdForOption(value: string): string {
    const option = this.options.find(item => item.value === value);
    return option ? optionId(option) : value;
  }

  private refreshProcessedOptions(): void {
    let result = this.options;

    if (this.hideDisabledIds) {
      result = result.filter(option => !this.disabledIds.includes(optionId(option)));
    }

    this.processedOptions = result.map(option => ({
      ...option,
      disabled: this.disabledIds.includes(optionId(option))
    }));
  }

  private refreshFilteredOptions(): void {
    const term = this.searchControl.value.trim().toLowerCase();

    if (!term || (!this.multiple && term === this.selectedOption?.label.toLowerCase())) {
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
