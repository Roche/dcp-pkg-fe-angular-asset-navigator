import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { AssetNavigatorOption, AssetNavigatorSensorOption, FormulaDescriptionVisibility, FunctionInput } from '../../types/AssetNavigator';
import { EditorTranslation, translateString } from '../../composables/useTranslation';
import { AssetEquationEditorComponent, EditorFence, FormulaOption } from '../equation-editor/equation-editor.component';
import { SensorSelectorComponent } from '../sensor-selector/sensor-selector.component';
import { Operator } from '@open-dcp/equation-editor';
import { TranslateModule } from '@ngx-translate/core';

type SensorOption = AssetNavigatorOption | AssetNavigatorSensorOption;

const sensorId = (sensor: SensorOption): string => sensor.webId ?? sensor.value;

const toFormulaOption = (sensor: SensorOption): FormulaOption => ({
  name: sensor.label,
  value: sensor.value,
  webId: sensor.webId,
  valueType: 'valueType' in sensor ? sensor.valueType : undefined,
  uoM: 'uom' in sensor ? sensor.uom : undefined,
  description: sensor.description
});

@Component({
  selector: 'odcp-editor-final-step',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    AssetEquationEditorComponent,
    SensorSelectorComponent,
    TranslateModule
  ],
  templateUrl: './final-step.component.html',
  styles: `
    .editor-final-step {
      display: flex;
      gap: 1rem;
      align-items: flex-start;
      width: 100%;
    }

    .activate-formula-button {
      margin-top: 10px;
    }

    .clear-sensors-button {
      margin-top: 10px;
    }
    
    .editor-editor-container {
      display: flex;
      gap: 1rem;
      align-items: flex-start;
    }
  `
})
export class FinalStepComponent implements OnChanges {
  @Input() supportFormula = false;
  @Input() formulaOnly = false;
  @Input({ required: true }) isLoading = false;
  @Input() multiple = false;
  @Input() clearable = false;
  @Input({ required: true }) sensors: SensorOption[] = [];
  @Input() functions?: FunctionInput[];
  @Input() operators?: Operator[];
  @Input() ignoreDescription?: FormulaDescriptionVisibility;
  @Input() translation?: EditorTranslation;
  @Input() equationResetToken = 0;
  @Input() disabledIds: string[] = [];
  @Input() hideDisabledIds = false;
  @Input() selectedSensorValues: string[] | null = null;
  @Input({ required: true }) fence!: EditorFence;

  @Output() sensorSelect = new EventEmitter<string[]>();
  @Output() formulaApply = new EventEmitter<unknown>();
  @Output() clearSensors = new EventEmitter<void>();
  @Output() copy = new EventEmitter<void>();
  @Output() selectedSensorValuesChange = new EventEmitter<string[]>();

  formulaModeEnabled = false;
  processedSensors: SensorOption[] = [];
  formulaOptions: FormulaOption[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['sensors'] || changes['disabledIds'] || changes['hideDisabledIds']) {
      let result = this.sensors;

      if (this.hideDisabledIds) {
        result = result.filter(sensor => !this.disabledIds.includes(sensorId(sensor)));
      }

      this.processedSensors = result.map(sensor => ({
        ...sensor,
        disabled: this.disabledIds.includes(sensorId(sensor))
      }));
      this.formulaOptions = this.processedSensors.map(toFormulaOption);
    }
  }

  onSelectedSensorValuesChange(values: string[]): void {
    this.selectedSensorValuesChange.emit(values);
    this.sensorSelect.emit(values);
  }

  get isFormulaEditorVisible(): boolean {
    return this.formulaOnly || this.formulaModeEnabled;
  }

  onFormulaCancel(): void {
    if (this.formulaOnly) {
      return;
    }

    this.formulaModeEnabled = false;
  }
  
  getLabel(label: string) {
    return translateString(label, this.translation);
  }
}
