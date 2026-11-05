//#region imports
import { createContext, TaonBaseContext } from 'taon/src';
import { TaonSessionAbstractContext } from '@taon-dev/session/src';

import { TaonCmsWebsiteFeatureController } from './taon-cms-website-feature.controller';
import { TaonCmsWebsiteFeatureKvRepository } from './taon-cms-website-feature.kv.repository';
import { TaonCmsWebsiteFeatureProvider } from './taon-cms-website-feature.provider';
//#endregion

export const TaonCmsWebsiteFeatureAbstractContext = createContext(() => ({
  contextName: 'TaonCmsWebsiteFeatureAbstractContext',
  abstract: true,
  contexts: { TaonBaseContext, TaonSessionAbstractContext },
  controllers: { TaonCmsWebsiteFeatureController },
  repositories: {
    TaonCmsWebsiteFeatureKvRepository,
  },
  providers: { TaonCmsWebsiteFeatureProvider },
}));
