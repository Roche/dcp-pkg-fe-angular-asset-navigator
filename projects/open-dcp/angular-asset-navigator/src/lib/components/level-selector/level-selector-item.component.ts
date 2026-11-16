import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, OnDestroy, SimpleChanges, ViewEncapsulation } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { lastValueFrom, Subject, takeUntil } from 'rxjs';
import { ODCPAssetNavigatorService } from '../../services/asset-navigator.service';
import { AssetNavigatorOption } from '../../types/AssetNavigator';

const TOOLTIP_OPEN_DELAY = 500;

@Component({
  selector: 'odcp-level-selector-item',
  standalone: true,
  imports: [CommonModule, MatTooltipModule, TranslateModule],
  encapsulation: ViewEncapsulation.None,
  template: `
    <span class="level-selector-item"
          [matTooltip]="loading ? ('loading' | translate) + '...' : tooltipContent"
          [matTooltipDisabled]="disabled || !item.description"
          [matTooltipShowDelay]="openDelay"
          matTooltipPosition="right"
          matTooltipClass="asset-navigator-tooltip-content"
          (mouseenter)="onTooltipOpen()"
          (mouseleave)="onTooltipClose()">
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
export class LevelSelectorItemComponent implements OnChanges, OnDestroy {
  @Input({ required: true }) item!: AssetNavigatorOption;
  @Input() disabled = false;

  private readonly cancel$ = new Subject<void>();

  readonly openDelay = TOOLTIP_OPEN_DELAY;
  loading = false;
  tooltipContent = '';

  private loaded = false;
  private openTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private readonly assetNavigatorService: ODCPAssetNavigatorService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['item']) {
      this.tooltipContent = this.item.description ?? '';
      this.loaded = false;
    }
  }

  ngOnDestroy(): void {
    this.clearOpenTimer();
    this.cancel$.next();
    this.cancel$.complete();
  }

  onTooltipOpen(): void {
      if (this.disabled || !this.item.description) {
          return;
      }
      this.clearOpenTimer();
      this.openTimer = setTimeout(() => {
          this.openTimer = null;
          void this.loadDescription();
      }, this.openDelay);
  }

  onTooltipClose(): void {
    this.clearOpenTimer();
    this.cancel$.next();
  }

  private async loadDescription(): Promise<void> {
    if (this.loaded || this.loading) {
      return;
    }

    this.loading = true;

    const [elementId] = this.item.value.split('/');
    lastValueFrom(this.assetNavigatorService.fetchElementMetaData(elementId, undefined).pipe(takeUntil(this.cancel$)))
      .then(response => {
        const meta = response.data;
        this.tooltipContent = meta?.description || (this.item.description ?? '');
        this.loaded = true;
      }).catch(error => {
        const name = (error as { name?: string } | null)?.name;
        if (name !== 'CanceledError' && name !== 'AbortError') {
          throw error;
        }
      }).finally(() => {
        this.loading = false;
      });

  }

  private clearOpenTimer(): void {
    if (this.openTimer !== null) {
      clearTimeout(this.openTimer);
      this.openTimer = null;
    }
  }
}
