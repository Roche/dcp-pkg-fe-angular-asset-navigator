import { provideAnimations } from "@angular/platform-browser/animations";
import { applicationConfig, StoryObj, type Meta } from "@storybook/angular";
import { importProvidersFrom } from "@angular/core";
import { TranslateModule } from "@ngx-translate/core";
import { AssetNavigatorComponent } from "../../lib/components/asset-navigator/asset-navigator.component";
import { AssetNavigatorLevel } from "../../lib/types/AssetNavigator";
import { MOCK_SITE_ID } from "../mocks/asset-hierarchy-mock-api.data";
import { hierarchyNextHandler } from "../mocks/asset-hierarchy-mock-api";

const meta: Meta<AssetNavigatorComponent> = {
  title: "Components/AssetNavigator/Skeleton",
  component: AssetNavigatorComponent,
  decorators: [
    applicationConfig({ providers: [
        provideAnimations(),
        importProvidersFrom(TranslateModule.forRoot())
      ]
    }),
  ],
  args: {
    initialState: [] as AssetNavigatorLevel[],
    siteId: MOCK_SITE_ID,
    multiple: false,
    supportFormula: false,
    nbrSkeletonItems: 3,
  },
  parameters: {
    layout: 'padded',
    // The hierarchy request never resolves, so the skeleton stays visible.
    msw: { handlers: [hierarchyNextHandler({ latency: 'infinite' })] },
  },
};
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
