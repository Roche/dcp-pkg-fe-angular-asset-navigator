import { CommonModule, JsonPipe } from "@angular/common";
import { provideAnimations } from "@angular/platform-browser/animations";
import { TranslateService } from "@ngx-translate/core";
import { applicationConfig, moduleMetadata, type Meta, type StoryFn } from "@storybook/angular";
import { AssetNavigatorComponent } from "../../lib/components/asset-navigator/asset-navigator.component";
import { APP_INITIALIZER, inject } from "@angular/core";
import { formulaInitialState } from "../mocks/asset-hierarchy-mock-api.data";

let translate: TranslateService;

const meta: Meta<AssetNavigatorComponent> = {
  title: "Components/AssetNavigator/Default/Formula Editor",
  component: AssetNavigatorComponent,
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

const Template: StoryFn<AssetNavigatorComponent> = () => {
  const supportFormula = true;
  const formulaOnly =  true;
  const initialState = formulaInitialState;

  const translation = {
    translationPrefix: "@open-dcp/i18n",
    translator: (key: string, params?: Record<string, any>) => {
      const text = translate.instant(key, params);
      return params
      ? text.replace(/\{\s*([\w.]+)\s*\}/g, (m: string, k: string) => (k in params ? String(params[k]) : m))
      : text;
    },
  };

  return {
    props: { supportFormula, formulaOnly, initialState, translation },
    template: `
      <div>
        <odcp-asset-navigator [supportFormula]="supportFormula" 
                              [formulaOnly]="formulaOnly" 
                              [initialState]="initialState" 
                              [translation]="translation" />
      </div>
    `,
  };
};

export const FormulaEditor = Template.bind({});