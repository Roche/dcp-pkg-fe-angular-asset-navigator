import { CommonModule, JsonPipe } from "@angular/common";
import { provideAnimations } from "@angular/platform-browser/animations";
import { TranslateService } from "@ngx-translate/core";
import { applicationConfig, moduleMetadata, type Meta, type StoryFn } from "@storybook/angular";
import { APP_INITIALIZER, inject, signal } from "@angular/core";
import { SensorSelectorComponent } from "../../lib/components/sensor-selector/sensor-selector.component";
import { baseSensors } from "./mockData";

let translate: TranslateService;

const meta: Meta<SensorSelectorComponent> = {
  title: "Components/SensorSelector/Default",
  component: SensorSelectorComponent,
  decorators: [
    moduleMetadata({ imports: [JsonPipe, CommonModule] }),
    applicationConfig({ providers: [
      provideAnimations(),
      {
        provide: APP_INITIALIZER,
        multi: true,
        useFactory: () => {
          translate = inject(TranslateService);
          return () => {};
        },
      }
    ] }),
  ],
};
export default meta;

const Template: StoryFn<SensorSelectorComponent> = () => {
  const disabledIds: string[] = [];
  const preselectedValues: string[] = [];
  const clearable = true;
  const multiple = false;
  const hideDisabledIds = false;
  const options = baseSensors;

  const selectedSensorValues = signal<string[]>([]);

  const translation = {
    translationPrefix: "@open-dcp/i18n",
    translator: (key: string, params?: Record<string, any>) => {
      const text = translate.instant(key, params);
      return params
      ? text.replace(/\{\s*([\w.]+)\s*\}/g, (m: string, k: string) => (k in params ? String(params[k]) : m))
      : text;
    },
  };
  
  const selectedSensorValuesChange = (values: string[]) => {
    selectedSensorValues.set(values);
  };

  return {
    props: { 
      disabledIds, 
      preselectedValues,
      clearable,
      multiple,
      hideDisabledIds,
      options, 
      translation, 
      selectedSensorValues, 
      selectedSensorValuesChange 
    },
    template: `
      <div>
        <odcp-sensor-selector [clearable]="clearable"
                              [disabledIds]="disabledIds" 
                              [hideDisabledIds]="hideDisabledIds" 
                              [multiple]="multiple" 
                              [options]="options"
                              [preselectedValues]="preselectedValues"
                              [translation]="translation"
                              (selectedSensorValuesChange)="selectedSensorValuesChange($event)" />
        <p style="margin-top: 1rem; font-size: 0.85rem; color: #555;">
          Selected: {{ selectedSensorValues().join(', ') || '–' }}
        </p>
      </div>
    `,
  };
};

export const Default = Template.bind({});