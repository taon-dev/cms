//#region imports
import {
  Body,
  DELETE,
  GET,
  HttpStatusEnum,
  Models,
  POST,
  Query,
  Taon,
  TaonBaseCrudController,
  TaonController,
  getStatusCode,
} from 'taon/src';
import {
  TaonAuthContextRepository,
  TaonSessionRepository,
  TaonSessionUserEntity,
} from '@taon-dev/session/src';

import { TaonCmsContentEntity } from '../taon-cms-content/taon-cms-content.entity';
import { TaonCmsContentRepository } from '../taon-cms-content/taon-cms-content.repository';

import { TaonCmsCommentBlockedPhraseEntity } from './taon-cms-comment-blocked-phrase.entity';
import { TaonCmsCommentBlockedUserEntity } from './taon-cms-comment-blocked-user.entity';
import { TaonCmsCommentEntity } from './taon-cms-comment.entity';
import { TaonCmsCommentSpamReportEntity } from './taon-cms-comment-spam-report.entity';
import { TaonCmsCommentVoteEntity } from './taon-cms-comment-vote.entity';
//#endregion

interface CreateCommentInput {
  contentId: number;
  body: string;
}

interface VoteInput {
  commentId: number;
  value: -1 | 1;
}

interface BlockedUserInput {
  userId: number;
  blocked: boolean;
}

export interface CommentListItem extends TaonCmsCommentEntity {
  voteScore: number;
  upvotes: number;
  downvotes: number;
  spamReports: number;
  currentUserVote: -1 | 1 | 0;
  currentUserReported: boolean;
  postTitle: string;
  postSlug: string;
  authorName: string;
}

@TaonController<TaonCmsCommentController>({
  className: 'TaonCmsCommentController',
  allowedMethods: [
    'getComments',
    'createComment',
    'deleteComment',
    'voteComment',
    'reportSpam',
    'getCommentsBackoffice',
    'getBlockedUsers',
    'setBlockedUser',
    'getBlockedPhrases',
    'addBlockedPhrase',
    'deleteBlockedPhrase',
  ],
})
export class TaonCmsCommentController extends TaonBaseCrudController<TaonCmsCommentEntity> {
  entityClassResolveFn: () => typeof TaonCmsCommentEntity = () =>
    TaonCmsCommentEntity;

  private readonly taonSessionRepository = this.inject(
    TaonSessionRepository,
  );

  private readonly taonAuthContextRepository = this.inject(
    TaonAuthContextRepository,
  );

  private readonly posts = this.inject(TaonCmsContentRepository);

  private repository<T>(entity: { new (): T }) {
    return this.ctx.connection.manager.getRepository(entity);
  }

  private async requireAuthenticated(
    req: Models.TaonCtrlBeforeEachRequestParams<TaonCmsCommentController>['req'],
    res: Models.TaonCtrlBeforeEachRequestParams<TaonCmsCommentController>['res'],
    t: Models.TaonCtrlBeforeEachRequestParams<TaonCmsCommentController>['t'],
  ): Promise<number> {
    //#region @websqlFunc
    await this.taonSessionRepository.throwIfNotAuthenticated({ req, res });
    const userId = Number(req.userId);
    if (!Number.isSafeInteger(userId) || userId <= 0) {
      Taon.error({
        status: getStatusCode(HttpStatusEnum.UNAUTHORIZED),
        message: t.gettext('Authentication is required to comment.'),
      });
    }
    return userId;
    //#endregion
  }

  private async requireCmsManager(
    req: Models.TaonCtrlBeforeEachRequestParams<TaonCmsCommentController>['req'],
    t: Models.TaonCtrlBeforeEachRequestParams<TaonCmsCommentController>['t'],
  ): Promise<void> {
    //#region @websqlFunc

    await this.taonSessionRepository.throwIfNotAuthenticated({ req });
    const context = await this.taonAuthContextRepository.getContext(
      req.userId,
      req.sessionId,
    );
    if (!context?.hasAccess?.toManageCms) {
      Taon.error({
        status: getStatusCode(HttpStatusEnum.FORBIDDEN),
        message: t.gettext("You can't manage CMS comments."),
      });
    }
    //#endregion
  }

  @GET()
  getComments(
    @Query('contentId') contentId: number,
  ): Taon.Response<CommentListItem[]> {
    //#region @websqlFunc
    return async (req, res, { t }) => {
      const id = Number(contentId);
      if (!Number.isSafeInteger(id) || id <= 0) {
        return [];
      }
      const post = await this.repository(TaonCmsContentEntity).findOne({
        where: { id },
      });
      if (!post) {
        return [];
      }
      await this.requirePostReadAccess(post, req, res, t);
      const currentUserId = Number(req.userId) || 0;
      const comments = await this.db.find({
        where: { contentId: id, status: 'published' },
        order: { createdAt: 'ASC' },
      });
      return this.withModerationData(comments, currentUserId);
    };
    //#endregion
  }

  @POST()
  createComment(
    @Body() input: CreateCommentInput,
  ): Taon.Response<CommentListItem> {
    //#region @websqlFunc
    return async (req, res, { t }) => {
      const userId = await this.requireAuthenticated(req, res, t);
      const contentId = Number(input?.contentId);
      const body = typeof input?.body === 'string' ? input.body.trim() : '';
      if (!Number.isSafeInteger(contentId) || contentId <= 0 || !body) {
        Taon.error({
          status: getStatusCode(HttpStatusEnum.BAD_REQUEST),
          message: t.gettext('A post and comment text are required.'),
        });
      }
      if (body.length > 500) {
        Taon.error({
          status: getStatusCode(HttpStatusEnum.BAD_REQUEST),
          message: t.gettext('Comments cannot exceed 500 characters.'),
        });
      }

      const post = await this.repository(TaonCmsContentEntity).findOne({
        where: { id: contentId },
      });
      if (!post) {
        Taon.error({
          status: getStatusCode(HttpStatusEnum.NOT_FOUND),
          message: t.gettext('The post was not found.'),
        });
      }
      await this.requirePostReadAccess(post, req, res, t);

      const blockedUser = await this.repository(
        TaonCmsCommentBlockedUserEntity,
      ).findOne({ where: { userId } });
      if (blockedUser) {
        Taon.error({
          status: getStatusCode(HttpStatusEnum.FORBIDDEN),
          message: t.gettext('Your account is not allowed to comment.'),
        });
      }

      const blockedPhrases = await this.repository(
        TaonCmsCommentBlockedPhraseEntity,
      ).find();
      const lowerBody = body.toLowerCase();
      if (
        blockedPhrases.some(phrase =>
          lowerBody.includes(phrase.normalizedPhrase),
        )
      ) {
        Taon.error({
          status: getStatusCode(HttpStatusEnum.BAD_REQUEST),
          message: t.gettext('Your comment contains a blocked word or phrase.'),
        });
      }

      const dayStart = new Date();
      dayStart.setHours(0, 0, 0, 0);
      const tomorrow = new Date(dayStart);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const commentsToday = await this.db
        .createQueryBuilder('comment')
        .where('comment.userId = :userId', { userId })
        .andWhere('comment.createdAt >= :dayStart', { dayStart })
        .andWhere('comment.createdAt < :tomorrow', { tomorrow })
        .getCount();
      if (commentsToday >= 50) {
        Taon.error({
          status: 429,
          message: t.gettext(
            'You have reached the limit of 50 comments per day.',
          ),
        });
      }

      const comment = await this.db.save(
        this.db.create({
          contentId,
          parentCommentId: null,
          userId,
          body,
          status: 'published',
        }),
      );
      return (await this.withModerationData([comment], userId))[0];
    };
    //#endregion
  }

  @DELETE()
  deleteComment(@Query('id') commentId: number): Taon.Response<boolean> {
    //#region @websqlFunc
    return async (req, res, { t }) => {
      const userId = await this.requireAuthenticated(req, res, t);
      const comment = await this.db.findOne({ where: { id: commentId } });
      if (!comment) {
        Taon.error({
          status: getStatusCode(HttpStatusEnum.NOT_FOUND),
          message: t.gettext('The comment was not found.'),
        });
      }
      const context = await this.taonAuthContextRepository.getContext(
        req.userId,
        req.sessionId,
      );
      if (comment.userId !== userId && !context?.hasAccess?.toManageCms) {
        Taon.error({
          status: getStatusCode(HttpStatusEnum.FORBIDDEN),
          message: t.gettext('You are not allowed to delete this comment.'),
        });
      }
      await this.repository(TaonCmsCommentVoteEntity).delete({ commentId });
      await this.repository(TaonCmsCommentSpamReportEntity).delete({
        commentId,
      });
      await this.db.remove(comment);
      return true;
    };
    //#endregion
  }

  @POST()
  voteComment(@Body() input: VoteInput): Taon.Response<CommentListItem> {
    //#region @websqlFunc
    return async (req, res, { t }) => {
      const userId = await this.requireAuthenticated(req, res, t);
      if (
        !Number.isSafeInteger(Number(input?.commentId)) ||
        (input.value !== -1 && input.value !== 1)
      ) {
        Taon.error({
          status: getStatusCode(HttpStatusEnum.BAD_REQUEST),
          message: t.gettext('Choose a valid comment vote.'),
        });
      }
      const commentId = Number(input.commentId);
      const comment = await this.db.findOne({ where: { id: commentId } });
      if (!comment) {
        Taon.error({
          status: getStatusCode(HttpStatusEnum.NOT_FOUND),
          message: t.gettext('The comment was not found.'),
        });
      }
      const post = await this.repository(TaonCmsContentEntity).findOne({
        where: { id: comment.contentId },
      });
      if (!post) {
        Taon.error({
          status: getStatusCode(HttpStatusEnum.NOT_FOUND),
          message: t.gettext('The post was not found.'),
        });
      }
      await this.requirePostReadAccess(post, req, res, t);
      const votes = this.repository(TaonCmsCommentVoteEntity);
      const existing = await votes.findOne({ where: { commentId, userId } });
      if (existing?.value === input.value) {
        await votes.remove(existing);
      } else if (existing) {
        existing.value = input.value;
        await votes.save(existing);
      } else {
        await votes.save(
          votes.create({ commentId, userId, value: input.value }),
        );
      }
      return (await this.withModerationData([comment], userId))[0];
    };
    //#endregion
  }

  @POST()
  reportSpam(@Body('commentId') commentId: number): Taon.Response<boolean> {
    //#region @websqlFunc
    return async (req, res, { t }) => {
      const userId = await this.requireAuthenticated(req, res, t);
      const id = Number(commentId);
      if (!Number.isSafeInteger(id) || id <= 0) {
        Taon.error({
          status: getStatusCode(HttpStatusEnum.BAD_REQUEST),
          message: t.gettext('A valid comment is required.'),
        });
      }
      const comment = await this.db.findOne({ where: { id } });
      if (!comment) {
        Taon.error({
          status: getStatusCode(HttpStatusEnum.NOT_FOUND),
          message: t.gettext('The comment was not found.'),
        });
      }
      const post = await this.repository(TaonCmsContentEntity).findOne({
        where: { id: comment.contentId },
      });
      if (!post) {
        Taon.error({
          status: getStatusCode(HttpStatusEnum.NOT_FOUND),
          message: t.gettext('The post was not found.'),
        });
      }
      await this.requirePostReadAccess(post, req, res, t);
      const reports = this.repository(TaonCmsCommentSpamReportEntity);
      const existing = await reports.findOne({
        where: { commentId: id, userId },
      });
      if (!existing) {
        await reports.save(reports.create({ commentId: id, userId }));
      }
      return true;
    };
    //#endregion
  }

  @GET()
  getCommentsBackoffice(
    @Query('pageNumber') pageNumber = 1,
    @Query('pageSize') pageSize = 10,
    @Query('id') id?: string,
    @Query('text') text?: string,
    @Query('author') author?: string,
  ): Taon.Response<{ items: CommentListItem[]; total: number }> {
    //#region @websqlFunc
    return async (req, _res, { t }) => {
      await this.requireCmsManager(req, t);
      const page = Math.max(1, Number(pageNumber) || 1);
      const size = Math.min(100, Math.max(1, Number(pageSize) || 10));
      const query = this.db.createQueryBuilder('comment');
      if (id?.trim()) {
        const commentId = Number(id.trim());
        query.andWhere('comment.id = :id', {
          id: Number.isSafeInteger(commentId) && commentId > 0 ? commentId : -1,
        });
      }
      if (text?.trim()) {
        query.andWhere('LOWER(comment.body) LIKE :text', {
          text: `%${text.trim().toLowerCase()}%`,
        });
      }
      if (author?.trim()) {
        query
          .leftJoin(
            TaonSessionUserEntity,
            'sessionUser',
            'sessionUser.id = comment.userId',
          )
          .andWhere(
            '(LOWER(sessionUser.username) LIKE :author OR CAST(comment.userId AS TEXT) LIKE :author)',
            { author: `%${author.trim().toLowerCase()}%` },
          );
      }
      query.orderBy('comment.createdAt', 'DESC');
      query.skip((page - 1) * size).take(size);
      const [comments, total] = await query.getManyAndCount();
      return {
        items: await this.withModerationData(comments, Number(req.userId) || 0),
        total,
      };
    };
    //#endregion
  }

  @GET()
  getBlockedUsers(): Taon.Response<TaonCmsCommentBlockedUserEntity[]> {
    //#region @websqlFunc
    return async (req, _res, { t }) => {
      await this.requireCmsManager(req, t);
      return this.repository(TaonCmsCommentBlockedUserEntity).find({
        order: { createdAt: 'DESC' },
      });
    };
    //#endregion
  }

  @POST()
  setBlockedUser(@Body() input: BlockedUserInput): Taon.Response<boolean> {
    //#region @websqlFunc
    return async (req, _res, { t }) => {
      await this.requireCmsManager(req, t);
      const userId = Number(input?.userId);
      if (
        !Number.isSafeInteger(userId) ||
        userId <= 0 ||
        typeof input?.blocked !== 'boolean'
      ) {
        Taon.error({
          status: getStatusCode(HttpStatusEnum.BAD_REQUEST),
          message: t.gettext(
            'A valid user ID and blocked status are required.',
          ),
        });
      }
      if (input.blocked) {
        const user = await this.repository(TaonSessionUserEntity).findOne({
          where: { id: userId },
        });
        if (!user) {
          Taon.error({
            status: getStatusCode(HttpStatusEnum.NOT_FOUND),
            message: t.gettext('The user was not found.'),
          });
        }
      }
      const blockedUsers = this.repository(TaonCmsCommentBlockedUserEntity);
      const existing = await blockedUsers.findOne({ where: { userId } });
      if (input.blocked && !existing) {
        await blockedUsers.save(blockedUsers.create({ userId }));
      } else if (!input.blocked && existing) {
        await blockedUsers.remove(existing);
      }
      return true;
    };
    //#endregion
  }

  @GET()
  getBlockedPhrases(): Taon.Response<TaonCmsCommentBlockedPhraseEntity[]> {
    //#region @websqlFunc
    return async (req, _res, { t }) => {
      await this.requireCmsManager(req, t);
      return this.repository(TaonCmsCommentBlockedPhraseEntity).find({
        order: { phrase: 'ASC' },
      });
    };
    //#endregion
  }

  @POST()
  addBlockedPhrase(
    @Body('phrase') phrase: string,
  ): Taon.Response<TaonCmsCommentBlockedPhraseEntity> {
    //#region @websqlFunc
    return async (req, _res, { t }) => {
      await this.requireCmsManager(req, t);
      const normalizedPhrase =
        typeof phrase === 'string' ? phrase.trim().toLowerCase() : '';
      const displayPhrase = typeof phrase === 'string' ? phrase.trim() : '';
      if (!displayPhrase || displayPhrase.length > 500) {
        Taon.error({
          status: getStatusCode(HttpStatusEnum.BAD_REQUEST),
          message: t.gettext(
            'Enter a word or phrase of at most 500 characters.',
          ),
        });
      }
      const phrases = this.repository(TaonCmsCommentBlockedPhraseEntity);
      const existing = await phrases.findOne({ where: { normalizedPhrase } });
      if (existing) {
        return existing;
      }
      return phrases.save(
        phrases.create({ phrase: displayPhrase, normalizedPhrase }),
      );
    };
    //#endregion
  }

  @DELETE()
  deleteBlockedPhrase(@Query('id') id: number): Taon.Response<boolean> {
    //#region @websqlFunc
    return async (req, _res, { t }) => {
      await this.requireCmsManager(req, t);
      const phrase = await this.repository(
        TaonCmsCommentBlockedPhraseEntity,
      ).findOne({ where: { id } });
      if (!phrase) {
        Taon.error({
          status: getStatusCode(HttpStatusEnum.NOT_FOUND),
          message: t.gettext('The blocked phrase was not found.'),
        });
      }
      await this.repository(TaonCmsCommentBlockedPhraseEntity).remove(phrase);
      return true;
    };
    //#endregion
  }

  private async requirePostReadAccess(
    post: TaonCmsContentEntity,
    req: Models.TaonCtrlBeforeEachRequestParams<TaonCmsCommentController>['req'],
    res: Models.TaonCtrlBeforeEachRequestParams<TaonCmsCommentController>['res'],
    t: Models.TaonCtrlBeforeEachRequestParams<TaonCmsCommentController>['t'],
  ): Promise<void> {
    //#region @websqlFunc
    const { permissions } = await this.posts.getPermissionConfiguration(
      post.id,
      true,
    );
    const isPublic = post.status === 'published' && permissions.length === 0;
    if (isPublic) {
      return;
    }
    await this.taonSessionRepository.throwIfNotAuthenticated({ req, res });
    const context = await this.taonAuthContextRepository.getContext(
      req.userId,
      req.sessionId,
    );
    const userPermissions = new Set(context?.permissions ?? []);
    if (
      !context?.isSuperUser &&
      !permissions.some(permission => userPermissions.has(permission.code))
    ) {
      Taon.error({
        status: getStatusCode(HttpStatusEnum.FORBIDDEN),
        message: t.gettext('You do not have access to this post.'),
      });
    }
    //#endregion
  }

  private async withModerationData(
    comments: TaonCmsCommentEntity[],
    currentUserId: number,
  ): Promise<CommentListItem[]> {
    //#region @websqlFunc
    const voteRepository = this.repository(TaonCmsCommentVoteEntity);
    const reportRepository = this.repository(TaonCmsCommentSpamReportEntity);
    return Promise.all(
      comments.map(async comment => {
        const [votes, reports, post, user] = await Promise.all([
          voteRepository.find({ where: { commentId: comment.id } }),
          reportRepository.find({ where: { commentId: comment.id } }),
          this.repository(TaonCmsContentEntity).findOne({
            where: { id: comment.contentId },
          }),
          this.repository(TaonSessionUserEntity).findOne({
            where: { id: comment.userId },
          }),
        ]);
        const upvotes = votes.filter(vote => vote.value === 1).length;
        const downvotes = votes.filter(vote => vote.value === -1).length;
        return Object.assign(new TaonCmsCommentEntity(), comment, {
          upvotes,
          downvotes,
          voteScore: upvotes - downvotes,
          spamReports: reports.length,
          currentUserVote:
            votes.find(vote => vote.userId === currentUserId)?.value ?? 0,
          currentUserReported: reports.some(
            report => report.userId === currentUserId,
          ),
          postTitle: post?.title ?? '',
          postSlug: post?.slug ?? '',
          authorName: user?.username?.trim() || `User #${comment.userId}`,
        }) as CommentListItem;
      }),
    );
    //#endregion
  }
}
