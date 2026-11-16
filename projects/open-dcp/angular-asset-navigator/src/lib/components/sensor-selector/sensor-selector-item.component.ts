import { Component, Input, ViewEncapsulation } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AssetNavigatorOption } from '../../types/AssetNavigator';

@Component({
  selector: 'odcp-sensor-selector-item',
  standalone: true,
  imports: [MatTooltipModule],
  encapsulation: ViewEncapsulation.None,
  template: `
    <span class="level-selector-item"
          [matTooltip]="item.description ?? ''"
          [matTooltipDisabled]="disabled || !item.description"
          [matTooltipShowDelay]="200"
          matTooltipClass="asset-navigator-tooltip-content">
      {{ item.label }}
    </span>
  `,
  styles: `
    .level-selector-item {
      display: block;
      width: 100%;
    }

    .asset-navigator-tooltip-content {
      max-width: 320px;
    }
  `
})
export class SensorSelectorItemComponent {
  @Input({ required: true }) item!: AssetNavigatorOption;
  @Input() disabled = false;
}
