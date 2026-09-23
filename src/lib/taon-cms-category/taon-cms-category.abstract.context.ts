//#region imports
import { createContext, TaonBaseContext } from 'taon/src';

import { TaonCmsCategoryEntity } from './taon-cms-category.entity';
import { TaonCmsCategoryController } from './taon-cms-category.controller';
import { TaonCmsCategoryRepository } from './taon-cms-category.repository';
import { TaonCmsCategoryProvider } from './taon-cms-category.provider';
import { TaonCmsCategoryMiddleware } from './taon-cms-category.middleware';
import { TaonCmsCategorySubscriber } from './taon-cms-category.subscriber';
//#endregion

export const TaonCmsCategoryAbstractContext = createContext(() => ({
  contextName: 'TaonCmsCategoryAbstractContext',
  abstract: true,
  contexts: { TaonBaseContext },
  entities: { TaonCmsCategoryEntity },
  controllers: { TaonCmsCategoryController },
  repositories: { TaonCmsCategoryRepository },
  providers: { TaonCmsCategoryProvider },
  middlewares: { TaonCmsCategoryMiddleware },
  subscribers: { TaonCmsCategorySubscriber },
}));
