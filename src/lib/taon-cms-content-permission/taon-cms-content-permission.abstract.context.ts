//#region imports
import { createContext, TaonBaseContext } from 'taon/src';

import { TaonCmsContentPermissionEntity } from './taon-cms-content-permission.entity';
import { TaonCmsContentPermissionController } from './taon-cms-content-permission.controller';
import { TaonCmsContentPermissionRepository } from './taon-cms-content-permission.repository';
import { TaonCmsContentPermissionProvider } from './taon-cms-content-permission.provider';
import { TaonCmsContentPermissionMiddleware } from './taon-cms-content-permission.middleware';
import { TaonCmsContentPermissionSubscriber } from './taon-cms-content-permission.subscriber';
//#endregion

export const TaonCmsContentPermissionAbstractContext = createContext(() => ({
  contextName: 'TaonCmsContentPermissionAbstractContext',
  abstract: true,
  contexts: { TaonBaseContext },
  entities: { TaonCmsContentPermissionEntity },
  controllers: { TaonCmsContentPermissionController },
  repositories: { TaonCmsContentPermissionRepository },
  providers: { TaonCmsContentPermissionProvider },
  middlewares: { TaonCmsContentPermissionMiddleware },
  subscribers: { TaonCmsContentPermissionSubscriber },
}));
