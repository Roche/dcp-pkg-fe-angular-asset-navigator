import { CommonModule, JsonPipe } from "@angular/common";
import { provideAnimations } from "@angular/platform-browser/animations";
import { TranslateService } from "@ngx-translate/core";
import { applicationConfig, moduleMetadata, type Meta, type StoryFn } from "@storybook/angular";
import { AssetNavigatorComponent } from "../../lib/components/asset-navigator/asset-navigator.component";
import { APP_INITIALIZER, inject } from "@angular/core";
import { dataTransformer, linkOf, toTransformerElement } from "../mocks/asset-hierarchy-mock-api.data";
import { hierarchyNextHandler } from "../mocks/asset-hierarchy-mock-api";

let translate: TranslateService;

const meta: Meta<AssetNavigatorComponent> = {
  title: "Components/AssetNavigator/Default/With Transfer",
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
  parameters: {
    // The backend answers with `asset*` fields instead of the DCP ones; dataTransformer maps them back.
    msw: { handlers: [hierarchyNextHandler({ transform: toTransformerElement })] },
  },
};
export default meta;

const Template: StoryFn<AssetNavigatorComponent> = () => {
  const startLink = linkOf('F1EmBSL-B95', 'level');

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
    props: { startLink, translation, dataTransformer },
    template: `
      <div>
        <p style="margin-bottom: 1rem; font-size: 0.9rem; color: #666;">
          Raw backend fields are normalized through the dataTransformer prop before mapping.
        </p>
        <odcp-asset-navigator [startLink]="startLink" [translation]="translation" [dataTransformer]="dataTransformer" />
      </div>
    `,
  };
};

export const WithTransfer = Template.bind({});