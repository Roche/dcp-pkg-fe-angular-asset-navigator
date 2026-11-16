import { CommonModule, JsonPipe } from "@angular/common";
import { provideAnimations } from "@angular/platform-browser/animations";
import { TranslateService } from "@ngx-translate/core";
import { applicationConfig, moduleMetadata, type Meta, type StoryFn } from "@storybook/angular";
import { AssetNavigatorComponent } from "../../lib/components/asset-navigator/asset-navigator.component";
import { APP_INITIALIZER, inject } from "@angular/core";
import { HttpEventType, provideHttpClient, withInterceptors, type HttpInterceptorFn } from "@angular/common/http";
import { finalize, tap } from "rxjs";
import { linkOf } from "../mocks/asset-hierarchy-mock-api.data";
import { metaDataHandler } from "../mocks/asset-hierarchy-mock-api";

let translate: TranslateService;

const metaDataLoggingInterceptor: HttpInterceptorFn = (req, next) => {
  const match = /\/hierarchy\/([^/]+)\/meta-data$/.exec(req.url);
  if (!match) {
    return next(req);
  }
  const webId = decodeURIComponent(match[1]);
  let settled = false;
  console.log('[HTTP] Metadata request started for:', webId);
  return next(req).pipe(
    tap({
      next: event => {
        if (event.type === HttpEventType.Response) {
          settled = true;
          console.log('[HTTP] Metadata fetched successfully for:', webId);
        }
      },
      error: () => {
        settled = true;
        console.log('[HTTP] Metadata request FAILED for:', webId);
      }
    }),
    finalize(() => {
      if (!settled) {
        console.log('[HTTP] Metadata request ABORTED for:', webId);
      }
    })
  );
};

const meta: Meta<AssetNavigatorComponent> = {
  title: "Components/AssetNavigator/Default/Tooltip Request Cancellation",
  component: AssetNavigatorComponent,
  decorators: [
    moduleMetadata({ imports: [JsonPipe, CommonModule] }),
    applicationConfig({ providers: [
      provideAnimations(),
      provideHttpClient(withInterceptors([metaDataLoggingInterceptor])),
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
    msw: { handlers: [metaDataHandler({ latency: 3000 })] },
  },
};
export default meta;

const Template: StoryFn<AssetNavigatorComponent> = () => {
  const startLink = linkOf('F1EmBSL-B90', 'level');

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
    props: { startLink, translation },
    template: `
      <div>
        <p style="margin-bottom: 1rem; font-size: 0.9rem; color: #666;">
          Hover an item to trigger a <strong>3-second</strong> metadata request (served by MSW).
          Move the cursor away before it finishes — the in-flight request will be 
          aborted (visible in Network tab and console). Hovering again retries the fetch.
        </p>
        <odcp-asset-navigator [startLink]="startLink" [translation]="translation" />
      </div>
    `,
  };
};

export const TooltipRequestCancellation = Template.bind({});