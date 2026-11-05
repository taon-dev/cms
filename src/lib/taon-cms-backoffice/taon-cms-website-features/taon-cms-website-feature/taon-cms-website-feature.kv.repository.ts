//#region imports
import { TaonBaseKvRepository, TaonRepository } from 'taon/src';

import { contentError } from '../../../taon-cms-content/taon-cms-content.validation';
import type { TaonCmsWebsiteFeatureModels } from './taon-cms-website-feature.models';
import { TaonCmsWebsiteFeatureUtils } from './taon-cms-website-feature.utils';
//#endregion

@TaonRepository({
  className: 'TaonCmsWebsiteFeatureKvRepository',
})
export class TaonCmsWebsiteFeatureKvRepository extends TaonBaseKvRepository<{
  features: TaonCmsWebsiteFeatureModels.Feature[];
}> {
  private mutation: Promise<void> = Promise.resolve();

  async listFeatures(): Promise<TaonCmsWebsiteFeatureModels.Feature[]> {
    //#region @websqlFunc
    const features = await this.get('features');
    if (
      features !== undefined &&
      (!Array.isArray(features) || features.some(feature =>
        !feature ||
        typeof feature.key !== 'string' ||
        typeof feature.name !== 'string' ||
        (feature.enabled != null && typeof feature.enabled !== 'boolean'),
      ))
    ) {
      contentError('Stored website features are invalid.', 500);
    }
    return (features ?? []).map(feature => ({
      ...feature,
      enabled: feature.enabled ?? true,
    }));
    //#endregion
  }

  async isEnabled(key: string): Promise<boolean> {
    //#region @websqlFunc
    if (typeof key !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(key)) {
      contentError('The feature key is invalid.');
    }
    return (await this.listFeatures()).find(feature => feature.key === key)
      ?.enabled ?? true;
    //#endregion
  }

  async addFeature(name: string): Promise<TaonCmsWebsiteFeatureModels.Feature[]> {
    //#region @websqlFunc
    const key = typeof name === 'string' ? TaonCmsWebsiteFeatureUtils.keyFromName(name) : '';
    if (!key || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(key)) {
      contentError('Enter a feature name that produces a valid key.');
    }
    return this.mutate(features => {
      if (features.some(feature => feature.key === key)) {
        contentError('A feature with this key already exists.', 409);
      }
      return [...features, { key, name: name.trim(), enabled: true }];
    });
    //#endregion
  }

  async setEnabled(
    key: string,
    enabled: boolean,
  ): Promise<TaonCmsWebsiteFeatureModels.Feature[]> {
    //#region @websqlFunc
    if (typeof enabled !== 'boolean') {
      contentError('The feature value must be a boolean.');
    }
    return this.mutate(features => {
      this.requireFeature(features, key);
      return features.map(feature =>
        feature.key === key ? { ...feature, enabled } : feature,
      );
    });
    //#endregion
  }

  async deleteFeature(key: string): Promise<TaonCmsWebsiteFeatureModels.Feature[]> {
    //#region @websqlFunc
    return this.mutate(features => {
      this.requireFeature(features, key);
      return features.filter(feature => feature.key !== key);
    });
    //#endregion
  }

  private requireFeature(
    features: TaonCmsWebsiteFeatureModels.Feature[],
    key: string,
  ): void {
    //#region @websqlFunc
    if (!features.some(feature => feature.key === key)) {
      contentError('The feature no longer exists. Reload the list.', 404);
    }
    //#endregion
  }

  private async mutate(
    update: (
      features: TaonCmsWebsiteFeatureModels.Feature[],
    ) => TaonCmsWebsiteFeatureModels.Feature[],
  ): Promise<TaonCmsWebsiteFeatureModels.Feature[]> {
    //#region @websqlFunc
    const result = this.mutation.then(async () => {
      const features = update(await this.listFeatures());
      await this.set('features', features);
      return features;
    });
    this.mutation = result.then(() => undefined, () => undefined);
    return result;
    //#endregion
  }
}
