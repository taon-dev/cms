//#region imports
import { createContext, TaonBaseContext } from 'taon/src';

import { TaonCmsContentTagEntity } from './taon-cms-content-tag.entity';
import { TaonCmsContentTagController } from './taon-cms-content-tag.controller';
import { TaonCmsContentTagRepository } from './taon-cms-content-tag.repository';
import { TaonCmsContentTagProvider } from './taon-cms-content-tag.provider';
import { TaonCmsContentTagMiddleware } from './taon-cms-content-tag.middleware';
import { TaonCmsContentTagSubscriber } from './taon-cms-content-tag.subscriber';
//#endregion

export const TaonCmsContentTagContext = createContext(() => ({
  contextName: 'TaonCmsContentTagContext',
  abstract: true,
  contexts: { TaonBaseContext },
  entities: { TaonCmsContentTagEntity },
  controllers: { TaonCmsContentTagController },
  repositories: { TaonCmsContentTagRepository },
  providers: { TaonCmsContentTagProvider },
  middlewares: { TaonCmsContentTagMiddleware },
  subscribers: { TaonCmsContentTagSubscriber },
}));