//#region imports
import { createContext, TaonBaseContext } from 'taon/src';

import { TaonCmsCategoryAbstractContext } from '../taon-cms-category/taon-cms-category.abstract.context';
import { TaonCmsContentRevisionAbstractContext } from '../taon-cms-content-revision/taon-cms-content-revision.abstract.context';
import { TaonCmsContentTagAbstractContext } from '../taon-cms-content-tag/taon-cms-content-tag.abstract.context';
import { TaonCmsTagAbstractContext } from '../taon-cms-tag/taon-cms-tag.abstract.context';

import { TaonCmsContentController } from './taon-cms-content.controller';
import { TaonCmsContentEntity } from './taon-cms-content.entity';
import { TaonCmsContentMiddleware } from './taon-cms-content.middleware';
import { TaonCmsContentProvider } from './taon-cms-content.provider';
import { TaonCmsContentRepository } from './taon-cms-content.repository';
import { TaonCmsContentSubscriber } from './taon-cms-content.subscriber';

//#endregion

export const TaonCmsContentAbstractContext = createContext(() => ({
  contextName: 'TaonCmsContentAbstractContext',
  abstract: true,
  contexts: {
    TaonBaseContext,
    TaonCmsCategoryAbstractContext,
    TaonCmsTagAbstractContext,
    TaonCmsContentTagAbstractContext,
    TaonCmsContentRevisionAbstractContext,
  },
  entities: { TaonCmsContentEntity },
  controllers: { TaonCmsContentController },
  repositories: { TaonCmsContentRepository },
  providers: { TaonCmsContentProvider },
  middlewares: { TaonCmsContentMiddleware },
  subscribers: { TaonCmsContentSubscriber },
}));
