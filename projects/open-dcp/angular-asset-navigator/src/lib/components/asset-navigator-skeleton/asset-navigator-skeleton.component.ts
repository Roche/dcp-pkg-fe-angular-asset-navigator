import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'odcp-asset-navigator-skeleton',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './asset-navigator-skeleton.component.html',
  styleUrls: ['./asset-navigator-skeleton.component.scss'],
})
export class AssetNavigatorSkeletonComponent implements OnChanges {
  @Input({ required: true }) items = 0;

  placeholders: number[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['items']) {
      this.placeholders = Array.from({ length: this.items }, (_, index) => index);
    }
  }
}
