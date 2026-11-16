import { CommonModule, JsonPipe } from "@angular/common";
import { provideAnimations } from "@angular/platform-browser/animations";
import { TranslateService } from "@ngx-translate/core";
import { applicationConfig, moduleMetadata, type Meta, type StoryFn } from "@storybook/angular";
import { AssetNavigatorComponent } from "../../lib/components/asset-navigator/asset-navigator.component";
import { APP_INITIALIZER, inject } from "@angular/core";
import { linkOf } from "../mocks/asset-hierarchy-mock-api.data";

let translate: TranslateService;

const meta: Meta<AssetNavigatorComponent> = {
  title: "Components/AssetNavigator/Default/Disabled Variable",
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
  const startLink = linkOf('F1EmBSL-B90', 'level');
  const disabledIds = [linkOf('F1EmBSL-B90-DSP', 'group')];
  const hideDisabledIds = false;

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
    props: { startLink, disabledIds, hideDisabledIds, translation },
    template: `
      <div>
        <p style="margin-bottom: 1rem; font-size: 0.9rem; color: #666;">
          Starts in Building 90; Downstream Processing is disabled but visible in the dropdown
        </p>
        <odcp-asset-navigator [startLink]="startLink" 
                              [disabledIds]="disabledIds" 
                              [hideDisabledIds]="hideDisabledIds" 
                              [translation]="translation" />
      </div>
    `,
  };
};

export const DisabledVariable = Template.bind({});