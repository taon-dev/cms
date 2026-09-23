//#region imports
import { createContext, TaonBaseContext } from 'taon/src';

import { TaonCmsCommentEntity } from './taon-cms-comment.entity';
import { TaonCmsCommentController } from './taon-cms-comment.controller';
import { TaonCmsCommentRepository } from './taon-cms-comment.repository';
import { TaonCmsCommentProvider } from './taon-cms-comment.provider';
import { TaonCmsCommentMiddleware } from './taon-cms-comment.middleware';
import { TaonCmsCommentSubscriber } from './taon-cms-comment.subscriber';
//#endregion

export const TaonCmsCommentAbstractContext = createContext(() => ({
  contextName: 'TaonCmsCommentAbstractContext',
  abstract: true,
  contexts: { TaonBaseContext },
  entities: { TaonCmsCommentEntity },
  controllers: { TaonCmsCommentController },
  repositories: { TaonCmsCommentRepository },
  providers: { TaonCmsCommentProvider },
  middlewares: { TaonCmsCommentMiddleware },
  subscribers: { TaonCmsCommentSubscriber },
}));
