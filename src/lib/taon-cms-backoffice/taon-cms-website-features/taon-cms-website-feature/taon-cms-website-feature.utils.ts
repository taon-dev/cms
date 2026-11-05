import { TaonCmsWebsiteFeatureModels } from './taon-cms-website-feature.models';
import { _ } from 'tnp-core/src';

export namespace TaonCmsWebsiteFeatureUtils {
  export function keyFromName(name: string): string {
    // Keep digits attached so "Bachata P1" produces "bachata-p1".
    return _.deburr(name.trim())
      .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  export function isActive(state: string): state is TaonCmsWebsiteFeatureModels.TaonCmsWebsiteFeatureState {
    return state === 'active';
  }
}