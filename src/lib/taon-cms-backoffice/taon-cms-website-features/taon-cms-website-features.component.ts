//#region imports
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Translation } from '@taon-dev/i18n/src';
import { Taon } from 'taon/src';

import { TaonCmsWebsiteFeatureApiService } from './taon-cms-website-feature/taon-cms-website-feature.api.service';
import type { TaonCmsWebsiteFeatureModels } from './taon-cms-website-feature/taon-cms-website-feature.models';
import { TaonCmsWebsiteFeatureUtils } from './taon-cms-website-feature/taon-cms-website-feature.utils';
//#endregion

const t = Translation.for(Taon.__FILE_RELATIVE_PATH, Taon.LANG_IMPORT_MAP);

@Component({
  selector: 'app-taon-cms-website-features',
  templateUrl: './taon-cms-website-features.component.html',
  styleUrls: ['./taon-cms-website-features.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, MatButtonModule, MatCheckboxModule, MatFormFieldModule, MatIconModule, MatInputModule],
  providers: [TaonCmsWebsiteFeatureApiService],
})
export class TaonCmsWebsiteFeaturesComponent {
  t = t.for(this);
  private readonly taonCmsWebsiteFeatureApiService = inject(TaonCmsWebsiteFeatureApiService);
  private readonly destroyRef = inject(DestroyRef);
  readonly features = signal<TaonCmsWebsiteFeatureModels.Feature[]>([]);
  readonly busy = signal(false);
  readonly loaded = signal(false);
  readonly error = signal('');
  readonly feedback = signal('');
  name = '';

  ngOnInit(): void {
    void this.reload();
  }

  async reload(): Promise<void> {
    await this.run(
      () => this.taonCmsWebsiteFeatureApiService.listFeatures(),
      this.t.gettext('Website features loaded.'),
    );
  }

  async addFeature(): Promise<void> {
    if (this.busy() || !this.loaded()) {
      return;
    }
    const key = TaonCmsWebsiteFeatureUtils.keyFromName(this.name);
    this.error.set('');
    if (!key || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(key)) {
      this.error.set(this.t.gettext('Enter a feature name that produces a valid key.'));
      return;
    }
    if (this.features().some(feature => feature.key === key)) {
      this.error.set(this.t.gettext('A feature with this key already exists.'));
      return;
    }
    const saved = await this.run(
      () => this.taonCmsWebsiteFeatureApiService.addFeature(this.name),
      this.t.gettext('Feature added.'),
    );
    if (saved) {
      this.name = '';
    }
  }

  async toggle(feature: TaonCmsWebsiteFeatureModels.Feature, enabled: boolean): Promise<void> {
    if (this.busy()) {
      return;
    }
    const previous = this.features();
    this.features.set(previous.map(row =>
      row.key === feature.key ? { ...row, enabled } : row,
    ));
    const saved = await this.run(
      () => this.taonCmsWebsiteFeatureApiService.setEnabled(feature.key, enabled),
      this.t.gettext('Feature saved.'),
    );
    if (!saved && !this.destroyRef.destroyed) {
      this.features.set(previous.map(row => ({ ...row })));
    }
  }

  async deleteFeature(feature: TaonCmsWebsiteFeatureModels.Feature): Promise<void> {
    await this.run(
      () => this.taonCmsWebsiteFeatureApiService.deleteFeature(feature.key),
      this.t.gettext('Feature deleted. Missing features are enabled by default.'),
    );
  }

  async copyKey(key: string): Promise<void> {
    this.feedback.set('');
    this.error.set('');
    try {
      if (!navigator.clipboard) {
        throw new Error('Clipboard access is unavailable.');
      }
      await navigator.clipboard.writeText(key);
      this.feedback.set(this.t.gettext('Feature key copied.'));
    } catch (error: unknown) {
      console.error('[taon-cms-website-features] Unable to copy key', error);
      this.error.set(this.t.gettext('The feature key could not be copied.'));
    }
  }

  private async run(
    request: () => Promise<TaonCmsWebsiteFeatureModels.Feature[]>,
    message: string,
  ): Promise<boolean> {
    if (this.busy()) {
      return false;
    }
    this.busy.set(true);
    this.error.set('');
    this.feedback.set('');
    try {
      const features = await request();
      if (!this.destroyRef.destroyed) {
        this.features.set(features);
        this.loaded.set(true);
        this.feedback.set(message);
      }
      return true;
    } catch (error: unknown) {
      console.error('[taon-cms-website-features] Request failed', error);
      if (!this.destroyRef.destroyed) {
        this.error.set(this.t.gettext('Website features could not be saved or loaded. Please try again.'));
      }
      return false;
    } finally {
      if (!this.destroyRef.destroyed) {
        this.busy.set(false);
      }
    }
  }
}