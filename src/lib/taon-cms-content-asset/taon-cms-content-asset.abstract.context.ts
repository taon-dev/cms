//#region imports
import { createContext, TaonBaseContext } from 'taon/src';

import { TaonCmsContentAssetEntity } from './taon-cms-content-asset.entity';
import { TaonCmsContentAssetController } from './taon-cms-content-asset.controller';
import { TaonCmsContentAssetRepository } from './taon-cms-content-asset.repository';
import { TaonCmsContentAssetProvider } from './taon-cms-content-asset.provider';
import { TaonCmsContentAssetMiddleware } from './taon-cms-content-asset.middleware';
import { TaonCmsContentAssetSubscriber } from './taon-cms-content-asset.subscriber';
//#endregion

export const TaonCmsContentAssetContext = createContext(() => ({
  contextName: 'TaonCmsContentAssetContext',
  abstract: true,
  contexts: { TaonBaseContext },
  entities: { TaonCmsContentAssetEntity },
  controllers: { TaonCmsContentAssetController },
  repositories: { TaonCmsContentAssetRepository },
  providers: { TaonCmsContentAssetProvider },
  middlewares: { TaonCmsContentAssetMiddleware },
  subscribers: { TaonCmsContentAssetSubscriber },
}));