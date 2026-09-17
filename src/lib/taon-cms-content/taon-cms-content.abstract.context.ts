//#region imports
import { createContext, TaonBaseContext } from 'taon/src';

import { TaonCmsContentEntity } from './taon-cms-content.entity';
import { TaonCmsContentController } from './taon-cms-content.controller';
import { TaonCmsContentRepository } from './taon-cms-content.repository';
import { TaonCmsContentProvider } from './taon-cms-content.provider';
import { TaonCmsContentMiddleware } from './taon-cms-content.middleware';
import { TaonCmsContentSubscriber } from './taon-cms-content.subscriber';
//#endregion

export const TaonCmsContentContext = createContext(() => ({
  contextName: 'TaonCmsContentContext',
  abstract: true,
  contexts: { TaonBaseContext },
  entities: { TaonCmsContentEntity },
  controllers: { TaonCmsContentController },
  repositories: { TaonCmsContentRepository },
  providers: { TaonCmsContentProvider },
  middlewares: { TaonCmsContentMiddleware },
  subscribers: { TaonCmsContentSubscriber },
}));