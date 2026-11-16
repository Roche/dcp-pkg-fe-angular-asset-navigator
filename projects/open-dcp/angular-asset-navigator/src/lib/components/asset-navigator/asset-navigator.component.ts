import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { AssetNavigatorChange, AssetNavigatorDataTransformer, AssetNavigatorLevel, AssetNavigatorSelection, FormulaDescriptionVisibility, FunctionInput } from '../../types/AssetNavigator';
import { translateString, EditorTranslation } from '../../composables/useTranslation';
import { AssetEquationEditorComponent, EditorFence } from '../equation-editor/equation-editor.component';
import { SensorSelectorComponent } from '../sensor-selector/sensor-selector.component';
import { Operator } from '@open-dcp/equation-editor';
import { LevelSelectorComponent } from '../level-selector/level-selector.component';
import { ODCPAssetNavigatorService } from '../../services/asset-navigator.service';
import { DcHttp } from '@open-dcp/angular-services';
import NavigatorLevelType from '../../enums/NavigatorLevelType';
import { lastValueFrom } from 'rxjs';
import { deriveSelectedDeviceValue, isSelectedValueDevice } from '../../composables/useDeviceValue';
import { AssetNavigatorSkeletonComponent } from '../asset-navigator-skeleton/asset-navigator-skeleton.component';
import { FinalStepComponent } from '../final-step/final-step.component';

@Component({
  selector: 'odcp-asset-navigator',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    AssetNavigatorSkeletonComponent,
    AssetEquationEditorComponent,
    FinalStepComponent,
    LevelSelectorComponent,
    SensorSelectorComponent
  ],
  templateUrl: './asset-navigator.component.html',
  styles: `
    .asset-navigator {
      display: flex;
      flex-wrap: wrap;
      column-gap: 12px;
      row-gap: 8px;
      width: 100%;
    }
    .editor-final-step {
      display: flex;
      gap: 1rem;
      align-items: flex-start;
    }

    .activate-formula-button {
      margin-top: 10px;
    }

    .clear-sensors-button {
      margin-top: 10px;
    }
  `
})
export class AssetNavigatorComponent implements OnInit, OnChanges {
  @Input() initialState?: AssetNavigatorLevel[];
  @Input() startLink?: string;
  @Input() siteId: number = 1;
  @Input() device = false;
  @Input() multiple = false;
  @Input() clearable = false;
  @Input() clearableFinalStep = false;
  @Input() formulaOnly = false;
  @Input() supportFormula = false;
  @Input() formulaFunctions?: FunctionInput[] = [];
  @Input() formulaOperators?: Operator[] = [];
  @Input() ignoreDescription?: FormulaDescriptionVisibility;
  @Input() resetToken = 0;
  @Input() translation?: EditorTranslation;
  @Input() nbrSkeletonItems = 3;
  @Input() fence: EditorFence = {
    variableOpen: '{',
    variableClose: '}',
    numberOpen: null,
    numberClose: null
  };
  @Input() disabledIds: string[] = [];
  @Input() hideDisabledIds = false;
  @Input() dataTransformer?: AssetNavigatorDataTransformer;

  @Output() change = new EventEmitter<AssetNavigatorChange>();
  @Output() complete = new EventEmitter<AssetNavigatorChange>();
  @Output() formulaCopied = new EventEmitter<void>();

  readonly assetNavigatorService = inject(ODCPAssetNavigatorService);

  assetNavigatorLevels: AssetNavigatorLevel[] = [];
  isLoading = false;
  formulaModeEnabled = false;
  selectedFormula: unknown = null;
  equationResetToken = 0;

  private sensorHistory: Record<string, string[]> = {};

  constructor(private readonly http: DcHttp) {}

  ngOnInit(): void {
    this.assetNavigatorService.configure(this.siteId, this.dataTransformer);
    this.assetNavigatorLevels = this.normalizeInitialLevels(this.initialState ?? []);
    
    if (this.sensorLevel && this.selectedSensorValues.length > 0) {
      this.sensorHistory[this.getPathKey()] = this.selectedSensorValues;
    }

    if (!this.initialState || this.initialState.length === 0) {
      this.isLoading = true;
      const url  = this.startLink?.trim() || undefined;
      this.fetchHierarchy(url)
        .then(initialData => {
          const processedHierarchy = this.assetNavigatorService.processHierarchy(initialData, url);
          this.assetNavigatorLevels = [processedHierarchy];
        })
        .finally(() => {
          this.isLoading = false;
        });
      return;
    }

    this.hydrateNextLevelFromState();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['supportFormula'] || changes['formulaOnly']) {
      this.syncFormulaMode();
    }
  }

  get noneSensorLevels(): AssetNavigatorLevel[] {
    return this.assetNavigatorLevels.filter(level => level.levelType !== NavigatorLevelType.Sensor);
  }

  get sensorLevel(): AssetNavigatorLevel | undefined {
    return this.assetNavigatorLevels.find(level => level.levelType === NavigatorLevelType.Sensor);
  }

  get effectiveSupportFormula(): boolean {
    return this.supportFormula || this.formulaOnly;
  }

  get effectiveEquationResetToken(): number {
    return this.resetToken + this.equationResetToken;
  }

  get showSkeleton(): boolean {
    return this.isLoading && this.assetNavigatorLevels.length === 0;
  }

  get selectedSensorValues(): string[] {
    const level = this.sensorLevel;
    if (!level?.value) {
      return [];
    }
    return Array.isArray(level.value) ? level.value : [level.value];
  }

  trackByIndex(index: number): number {
    return index;
  }

  getLevelLabel(levelType: NavigatorLevelType, index: number): string {
    const label = translateString(levelType, this.translation);
    if (levelType !== NavigatorLevelType.Level) {
      return label;
    }

    return `${label} ${index + 1}`;
  }

  onSelectedSensorValuesChange(values: string[]): void {
    const level = this.sensorLevel;
    if (!level) {
      return;
    }

    level.value = values.length === 0 ? null : values;
    this.handleSensorValuesChange(values);
  }

  levelSelected(index: number, selection: AssetNavigatorSelection): void {
    const firstValue = Array.isArray(selection.value) ? (selection.value[0] ?? null) : selection.value;
    this.assetNavigatorLevels[index].value = selection.value;
    if (selection.isDevice) {
      this.assetNavigatorLevels[index].levelType = NavigatorLevelType.Device;
    }
    this.assetNavigatorLevels.splice(index + 1);
    this.syncFormulaMode();

    if (this.device && selection.isDevice) {
      this.selectedFormula = null;
      this.formulaModeEnabled = false;
      this.change.emit(this.buildPayload(true));
      this.complete.emit(this.buildPayload(true));
      return;
    }

    this.change.emit(this.buildPayload(false));

    if (!firstValue) {
      return;
    }

    this.isLoading = true;
    this.fetchHierarchy(firstValue)
      .then(newData => {
        const processedHierarchy = this.assetNavigatorService.processHierarchy(newData, firstValue);
        
        if (processedHierarchy.options.length === 0) {
          return;
        }

        let restoredSensors: string[] | null = null;
        if (processedHierarchy.levelType === NavigatorLevelType.Sensor) {
          const saved = this.sensorHistory[this.getPathKey()];
          if (saved?.length) {
            processedHierarchy.value = saved;
            restoredSensors = saved;
          }
        }
        this.assetNavigatorLevels.push(processedHierarchy);
        this.syncFormulaMode();

        if (restoredSensors) {
          this.handleSensorValuesChange(restoredSensors);
        }
      })
      .finally(() => {
        this.isLoading = false;
      });
  }

  onLevelCleared(index: number): void {
    this.assetNavigatorLevels[index].value = null;
    this.assetNavigatorLevels.splice(index + 1);
    this.resetCompletionState();
    this.syncFormulaMode();
    this.change.emit(this.buildPayload(false));
  }

  onFormulaApply(formula: unknown): void {
    this.selectedFormula = formula;
    this.formulaModeEnabled = true;
    this.change.emit(this.buildPayload(true, true));
    this.complete.emit(this.buildPayload(true, true));
  }

  onClearSensors(): void {
    const level = this.sensorLevel;
    if (level) {
      level.value = null;
    }
    this.resetCompletionState();
    this.equationResetToken += 1;
    this.change.emit(this.buildPayload(false));
    this.handleSensorValuesChange([]);
  }

  private handleSensorValuesChange(values: string[]): void {
    if (this.sensorLevel) {
      this.sensorHistory[this.getPathKey()] = values;
    }
    if (values.length > 0) {
      this.change.emit(this.buildPayload(true));
      this.complete.emit(this.buildPayload(true));
      return;
    }

    this.change.emit(this.buildPayload(false));
  }

  private syncFormulaMode(): void {
    if (!this.effectiveSupportFormula || !this.sensorLevel) {
      this.formulaModeEnabled = false;
    }
  }

  private resetCompletionState(): void {
    this.selectedFormula = null;
    this.formulaModeEnabled = false;
  }

  private buildPayload(complete: boolean, isFormulaApply = false): AssetNavigatorChange {
    return {
      levels: this.assetNavigatorLevels,
      selectedDeviceValue: deriveSelectedDeviceValue(this.assetNavigatorLevels),
      selectedSensorValues: this.formulaModeEnabled ? null : this.selectedSensorValues,
      allSelectedSensorValues: [...new Set(Object.values(this.sensorHistory).flat())],
      formulaEnabled: this.formulaModeEnabled,
      formula: this.formulaModeEnabled ? this.selectedFormula : null,
      complete,
      isFormulaApply
    };
  }

  private getPathKey(): string {
    return this.assetNavigatorLevels
      .filter(level => level.levelType !== NavigatorLevelType.Sensor)
      .map(level => (Array.isArray(level.value) ? level.value.join(',') : (level.value ?? '')))
      .join('|');
  }

  private cloneLevel (level: AssetNavigatorLevel) {
    return {
      ...level,
      options: [...level.options],
      value: Array.isArray(level.value) ? [...level.value] : level.value,
    }
  }

  private levelHasDeviceSelection (level: AssetNavigatorLevel) {
    if (level.levelType === NavigatorLevelType.Device) {
      return true;
    }

    return isSelectedValueDevice(level.value, level.options);
  }


  private normalizeInitialLevels(levels: AssetNavigatorLevel[]): AssetNavigatorLevel[] {
    const clonedLevels = levels.map(this.cloneLevel);

    if (!this.device) {
      return clonedLevels;
    }

    const deviceIndex = clonedLevels.findIndex(level => this.levelHasDeviceSelection(level));
    if (deviceIndex === -1) {
      return clonedLevels;
    }

    clonedLevels[deviceIndex].levelType = NavigatorLevelType.Device;
    return clonedLevels.slice(0, deviceIndex + 1);
  }

  
  private getFirstSelectionValue(value: null | string | string[]): string | null {
    if (Array.isArray(value)) {
      return value[0] ?? null;
    }

    return value ?? null;
  }


  private hydrateNextLevelFromState(): void {
    if (this.assetNavigatorLevels.length === 0) {
      return;
    }

    const lastLevel = this.assetNavigatorLevels[this.assetNavigatorLevels.length - 1];
    if (lastLevel.levelType === NavigatorLevelType.Sensor) {
      return;
    }

    if (this.device && this.levelHasDeviceSelection(lastLevel)) {
      return;
    }

    const selectedValue = this.getFirstSelectionValue(lastLevel.value);
    if (!selectedValue) {
      return;
    }

    this.isLoading = true;
    this.fetchHierarchy(selectedValue)
      .then(newData => {
        const processedHierarchy = this.assetNavigatorService.processHierarchy(newData, selectedValue);
        this.isLoading = false;
        if (processedHierarchy.options.length === 0) {
          return;
        }

        this.assetNavigatorLevels.push(processedHierarchy);
        this.hydrateNextLevelFromState();
      })
      .catch(() => {
        this.isLoading = false;
      });
  }

  private fetchHierarchy(link?: string) {
    return lastValueFrom(this.assetNavigatorService.fetchHierarchy(link));
  }
}

