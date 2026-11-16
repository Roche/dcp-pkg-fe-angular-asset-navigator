import { provideAnimations } from "@angular/platform-browser/animations";
import { applicationConfig, StoryObj, type Meta } from "@storybook/angular";
import { importProvidersFrom } from "@angular/core";
import { TranslateModule } from "@ngx-translate/core";
import { AssetNavigatorComponent } from "../../lib/components/asset-navigator/asset-navigator.component";
import { AssetNavigatorLevel } from "../../lib/types/AssetNavigator";
import { MOCK_SITE_ID } from "../mocks/asset-hierarchy-mock-api.data";

// Hierarchy data is served by the shared MSW handlers registered in .storybook/preview.ts.
const meta: Meta<AssetNavigatorComponent> = {
  title: "Components/AssetNavigator/Default",
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
    startLink: '',
    siteId: MOCK_SITE_ID,
    multiple: false,
    supportFormula: false,
  },
  parameters: {
    layout: 'padded',
  },
};

export default meta;

type Story = StoryObj<AssetNavigatorComponent>;

export const Default: Story = {};
