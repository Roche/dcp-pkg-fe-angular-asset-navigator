import { SimpleChange } from '@angular/core';
import { SensorSelectorComponent } from './sensor-selector.component';

describe('SensorSelectorComponent', () => {
    let component: SensorSelectorComponent;

    beforeEach(() => {
        component = new SensorSelectorComponent();
    });

    it('disables only options whose id is in disabledIds (webId first, value fallback)', () => {
        component.isLoading = false;
        component.disabledIds = ['sensor/webid-based', 'sensor/value-based'];
        component.hideDisabledIds = false;
        component.options = [
            {
                label: 'WebId based sensor',
                description: 'Uses webId for disabling',
                value: 'sensor/webid-based/data',
                webId: 'sensor/webid-based'
            },
            {
                label: 'Value based sensor',
                description: 'Uses value for disabling',
                value: 'sensor/value-based'
            },
            {
                label: 'Enabled sensor',
                description: 'Not disabled',
                value: 'sensor/enabled/data',
                webId: 'sensor/enabled'
            }
        ];
        component.ngOnChanges({
            options: new SimpleChange(undefined, component.options, true),
            disabledIds: new SimpleChange(undefined, component.disabledIds, true),
            hideDisabledIds: new SimpleChange(undefined, component.hideDisabledIds, true)
        });

        const disabledByLabel = Object.fromEntries(
            component.filteredOptions.map(item => [item.label, item.disabled])
        );

        expect(disabledByLabel['WebId based sensor']).toBe(true);
        expect(disabledByLabel['Value based sensor']).toBe(true);
        expect(disabledByLabel['Enabled sensor']).toBe(false);
    });
});
