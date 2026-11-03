//#region imports
import { createContext, TaonBaseContext } from 'taon/src';

import { TaonCmsCommentEntity } from './taon-cms-comment.entity';
import { TaonCmsCommentController } from './taon-cms-comment.controller';
import { TaonCmsCommentRepository } from './taon-cms-comment.repository';
import { TaonCmsCommentProvider } from './taon-cms-comment.provider';
import { TaonCmsCommentMiddleware } from './taon-cms-comment.middleware';
import { TaonCmsCommentSubscriber } from './taon-cms-comment.subscriber';
import { TaonCmsCommentVoteEntity } from './taon-cms-comment-vote.entity';
import { TaonCmsCommentSpamReportEntity } from './taon-cms-comment-spam-report.entity';
import { TaonCmsCommentBlockedUserEntity } from './taon-cms-comment-blocked-user.entity';
import { TaonCmsCommentBlockedPhraseEntity } from './taon-cms-comment-blocked-phrase.entity';
//#endregion

export const TaonCmsCommentAbstractContext = createContext(() => ({
  contextName: 'TaonCmsCommentAbstractContext',
  abstract: true,
  contexts: { TaonBaseContext },
  entities: {
    TaonCmsCommentEntity,
    TaonCmsCommentVoteEntity,
    TaonCmsCommentSpamReportEntity,
    TaonCmsCommentBlockedUserEntity,
    TaonCmsCommentBlockedPhraseEntity,
  },
  controllers: { TaonCmsCommentController },
  repositories: { TaonCmsCommentRepository },
  providers: { TaonCmsCommentProvider },
  middlewares: { TaonCmsCommentMiddleware },
  subscribers: { TaonCmsCommentSubscriber },
}));
