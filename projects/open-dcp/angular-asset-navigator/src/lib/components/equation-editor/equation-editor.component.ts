import { CommonModule } from '@angular/common';
import {
    Component,
    EventEmitter,
    Input,
    NgZone,
    OnChanges,
    Output,
    SimpleChanges
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { Operator, Variable } from "@open-dcp/equation-editor";
import { EquationEditorComponent } from "@open-dcp/angular-equation-editor";
import { DefaultButtonComponent } from "@open-dcp/angular-basic-components";
import { EditorTranslation, translateString } from '../../composables/useTranslation';
import { FormulaDescriptionVisibility, FunctionInput } from '../../types/AssetNavigator';

export interface EditorFence {
  variableOpen?: string;
  variableClose?: string;
  numberOpen?: string | null;
  numberClose?: string | null;
}

export type EquationValue = NonNullable<EquationEditorComponent['modelValue']>;

export interface FormulaOption {
  name: string;
  value: string;
  webId?: string;
  valueType?: string;
  uoM?: string;
  description?: string;
}

@Component({
  selector: 'odcp-asset-equation-editor',
  standalone: true,
  imports: [
    CommonModule, 
    TranslateModule, 
    EquationEditorComponent, 
    DefaultButtonComponent
  ],
  templateUrl: './equation-editor.component.html',
  styles: `
    :host {
      display: flex;
      flex-wrap: wrap;
      column-gap: 12px;
      row-gap: 8px;
      gap: 10px;
      min-width: 260px !important;
      align-items: flex-start;
    }

    :host ::ng-deep .odcp-asset-equation-editor {
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
    }

    .odcp-asset-equation-editor-buttons {
      display: flex;
      gap: 10px;
      padding-top: 10px;
    }
  `
})
export class AssetEquationEditorComponent implements OnChanges {
  @Input({ required: true }) options: FormulaOption[] = [];
  @Input() translation?: EditorTranslation;
  @Input() allowCancel = true;
  @Input() functions?: FunctionInput[];
  @Input() operators?: Operator[];
  @Input() ignoreDescription?: FormulaDescriptionVisibility;
  @Input() resetToken = 0;
  @Input() fence!: EditorFence;

  @Output() cancel = new EventEmitter<void>();
  @Output() apply = new EventEmitter<EquationValue | undefined>();
  @Output() copy = new EventEmitter<void>();
  @Output() errors = new EventEmitter<unknown>();

  equation?: EquationValue;
  readonly noFunctions: FunctionInput[] = [];
  readonly noOperators: Operator[] = [];
  readonly defaultDescriptionVisibility: FormulaDescriptionVisibility = {};
  hasEquationErrors = false;
  editorInstanceKey = 0;
  editorInstances: number[] = [0];
  variables: Variable[] = [];

  constructor(private readonly zone: NgZone) {}
  
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['options']) {
      this.variables = this.options.map(option => ({
        label: option.name,
        value: option.webId ?? option.value,
        data: {
          valueType: option.valueType ?? undefined,
          uoM: option.uoM ?? undefined,
          description: option.description ?? undefined
        }
      }));
    }

    if (changes['resetToken'] && !changes['resetToken'].firstChange) {
      this.equation = undefined;
      this.hasEquationErrors = false;
      this.editorInstanceKey += 1;
      this.editorInstances = [this.editorInstanceKey];
    }
  }

  trackByInstance(_index: number, instance: number): number {
    return instance;
  }

  handleError(errors: unknown): void {
    Promise.resolve().then(() => {
      this.hasEquationErrors = Array.isArray(errors) ? errors.length > 0 : !!errors;
      this.errors.emit(errors);
    });
  }

  getLabel(label: string) {
    return translateString(label, this.translation);
  }

  onEquationChange(value: EquationValue): void {
    Promise.resolve().then(() => (this.equation = value));
  }
}
