//#region imports
import { TaonBaseContext, createContext } from 'taon/src';

import { TaonCmsCategoryContext } from './taon-cms-category';
import { TaonCmsCommentContext } from './taon-cms-comment';
import { TaonCmsContentContext } from './taon-cms-content';
import { TaonCmsContentAssetContext } from './taon-cms-content-asset';
import { TaonCmsContentPermissionContext } from './taon-cms-content-permission';
import { TaonCmsContentRevisionContext } from './taon-cms-content-revision';
import { TaonCmsContentTagContext } from './taon-cms-content-tag';
import { TaonCmsTagContext } from './taon-cms-tag';

//#endregion

export const TaonCmsAbstractContext = createContext(() => ({
  contextName: 'TaonCmsAbstractContext',
  abstract: true,
  database: false,
  contexts: {
    TaonBaseContext,
    TaonCmsCategoryContext,
    TaonCmsCommentContext,
    TaonCmsContentContext,
    TaonCmsContentAssetContext,
    TaonCmsContentPermissionContext,
    TaonCmsContentRevisionContext,
    TaonCmsContentTagContext,
    TaonCmsTagContext,
  },
  entities: {},
  controllers: {},
  repositories: {},
  middlewares: {},
  providers: {},
}));
