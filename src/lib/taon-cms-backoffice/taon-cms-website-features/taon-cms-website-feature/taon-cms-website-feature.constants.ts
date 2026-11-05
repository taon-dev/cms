import type { TaonCmsWebsiteFeatureModels } from './taon-cms-website-feature.models';
import { Translation } from '@taon-dev/i18n/src';
import { Taon } from 'taon/src';

const t = Translation.for(Taon.__FILE_RELATIVE_PATH, Taon.LANG_IMPORT_MAP);

export const TaonCmsWebsiteFeatureDefaultsValues = {
  enabled: true,
} satisfies Partial<TaonCmsWebsiteFeatureModels.Feature>;

export enum TaonCmsWebsiteFeatureErrors {
  INVALID_PASSWORD_EXAMPLE_ERROR = 'INVALID_PASSWORD_EXAMPLE_ERROR',
}

export const TaonCmsWebsiteFeatureTranslationErorsMap = new Map([
  [TaonCmsWebsiteFeatureErrors.INVALID_PASSWORD_EXAMPLE_ERROR, t.gettext('Invalid Password')],
]);