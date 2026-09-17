//#region imports
import { createContext, TaonBaseContext } from 'taon/src';

import { TaonCmsContentRevisionEntity } from './taon-cms-content-revision.entity';
import { TaonCmsContentRevisionController } from './taon-cms-content-revision.controller';
import { TaonCmsContentRevisionRepository } from './taon-cms-content-revision.repository';
import { TaonCmsContentRevisionProvider } from './taon-cms-content-revision.provider';
import { TaonCmsContentRevisionMiddleware } from './taon-cms-content-revision.middleware';
import { TaonCmsContentRevisionSubscriber } from './taon-cms-content-revision.subscriber';
//#endregion

export const TaonCmsContentRevisionContext = createContext(() => ({
  contextName: 'TaonCmsContentRevisionContext',
  abstract: true,
  contexts: { TaonBaseContext },
  entities: { TaonCmsContentRevisionEntity },
  controllers: { TaonCmsContentRevisionController },
  repositories: { TaonCmsContentRevisionRepository },
  providers: { TaonCmsContentRevisionProvider },
  middlewares: { TaonCmsContentRevisionMiddleware },
  subscribers: { TaonCmsContentRevisionSubscriber },
}));