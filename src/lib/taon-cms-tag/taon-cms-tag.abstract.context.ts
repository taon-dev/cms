//#region imports
import { createContext, TaonBaseContext } from 'taon/src';

import { TaonCmsTagEntity } from './taon-cms-tag.entity';
import { TaonCmsTagController } from './taon-cms-tag.controller';
import { TaonCmsTagRepository } from './taon-cms-tag.repository';
import { TaonCmsTagProvider } from './taon-cms-tag.provider';
import { TaonCmsTagMiddleware } from './taon-cms-tag.middleware';
import { TaonCmsTagSubscriber } from './taon-cms-tag.subscriber';
//#endregion

export const TaonCmsTagAbstractContext = createContext(() => ({
  contextName: 'TaonCmsTagAbstractContext',
  abstract: true,
  contexts: { TaonBaseContext },
  entities: { TaonCmsTagEntity },
  controllers: { TaonCmsTagController },
  repositories: { TaonCmsTagRepository },
  providers: { TaonCmsTagProvider },
  middlewares: { TaonCmsTagMiddleware },
  subscribers: { TaonCmsTagSubscriber },
}));
