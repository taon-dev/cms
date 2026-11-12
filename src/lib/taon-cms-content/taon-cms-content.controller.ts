//#region imports
import {
  TaonSessionRepository,
  type TaonPermissionEntity,
} from '@taon-dev/session/src';
import {
  TaonAuthContextRepository,
  TaonSessionCoreAuthorization,
} from '@taon-dev/session/src';
import {
  Taon,
  ClassHelpers,
  TaonController,
  TaonBaseCrudController,
  Query,
  GET,
  POST,
  PUT,
  DELETE,
  Body,
  ExpressRequest,
  Models,
  getStatusCode,
  HttpStatusEnum,
  ExpressResponse,
} from 'taon/src';
import { _ } from 'tnp-core/src';

import type { TaonCmsApplicationHookEntity } from '../taon-cms-application-hook/taon-cms-application-hook.entity';
import type { TaonCmsContentRevisionEntity } from '../taon-cms-content-revision/taon-cms-content-revision.entity';

import { TaonCmsContentStorageController } from './taon-cms-content-storage.controller';
import { TaonCmsContentEntity } from './taon-cms-content.entity';
import type {
  TaonCmsCreateContent,
  TaonCmsCreateRelatedChildInput,
  TaonCmsCreateRelatedChildResult,
  TaonCmsPublicVideoChild,
  TaonCmsRestoreContent,
  TaonCmsUpdateContent,
  TaonCmsPermissionConfiguration,
  TaonCmsPostVersionKind,
  TaonCmsPostVersionLinks,
  TaonCmsVisibilityConfiguration,
} from './taon-cms-content.models';
import { TaonCmsContentType } from './taon-cms-content.models';
import { TaonCmsContentRepository } from './taon-cms-content.repository';
import { contentError } from './taon-cms-content.validation';
import {
  defaultThumbnailKey,
  defaultThumbnailUrl,
} from '../taon-posts/taon-cms-post/taon-cms-thumbnail';
import {
  parseSpreadsheetDocument,
  TAON_SPREADSHEET_MAX_BYTES,
} from '../taon-spreadsheet-table/taon-spreadsheet-table.utils';
//#endregion

@TaonController<TaonCmsContentController>({
  //#region controller options
  className: 'TaonCmsContentController',
  allowedMethods: [
    'getPublicExcerptBySlug',
    'getAll',
    'getBy',
    'getJsonTableBySlug',
    'getPublicJsonTableBySlug',
    'getPublicBySlug',
    'getPublicVideoChildrenBySlug',
    'createContent',
    'createRelatedChild',
    'duplicateContent',
    'permanentlyDeleteContent',
    'updateContent',
    'deleteContent',
    'restoreContent',
    'listRevisions',
    'listRelatedPosts',
    'getParentPost',
    'getVisibilityConfiguration',
    'getPostVersions',
    'listCourses',
    'listPermissions',
    'getPermissionConfiguration',
    'listApplicationHooks',
    'getContentByHook',
    'getPublicContentByHook',
    'getVideoLinkBySlug',
    'getPublicVideoLinkBySlug',
    'getAudioLinkBySlug',
    'getPublicAudioLinkBySlug',
    'getAttachmentLinkBySlug',
    'getPublicAttachmentLinkBySlug',
    'getThumbnailLinkBySlug',
    'getPublicThumbnailLinkBySlug',
    'listTagIds',
    'addRelatedPost',
    'deleteRelatedPost',
    'linkVersionPost',
    'removeVersionPost',
    'paginationQuery',
  ],
  //#endregion
})
export class TaonCmsContentController extends TaonBaseCrudController<TaonCmsContentEntity> {
  //#region fields & getters
  entityClassResolveFn: () => typeof TaonCmsContentEntity = () =>
    TaonCmsContentEntity;

  private readonly taonCmsContentRepository = this.inject(
    TaonCmsContentRepository,
  );

  private readonly taonSessionRepository = this.inject(
    TaonSessionRepository,
  );

  private readonly taonAuthContextRepository = this.inject(
    TaonAuthContextRepository,
  );

  private readonly taonCmsContentStorageController = this.inject(
    TaonCmsContentStorageController,
  );
  //#endregion

  //#region methods / before each request
  protected async beforeEachRequest({
    req,
    res,
    methodConfig,
    t,
  }: Models.TaonCtrlBeforeEachRequestParams<TaonCmsContentController>): Promise<void> {
    //#region @backendFunc
    if (
      methodConfig.methodName === 'getPublicExcerptBySlug' ||
      methodConfig.methodName === 'getPublicContentByHook' ||
      methodConfig.methodName === 'getPublicJsonTableBySlug' ||
      methodConfig.methodName === 'getPublicBySlug' ||
      methodConfig.methodName === 'getPublicVideoChildrenBySlug' ||
      methodConfig.methodName === 'listCourses' ||
      methodConfig.methodName === 'getPublicVideoLinkBySlug' ||
      methodConfig.methodName === 'getPublicAudioLinkBySlug' ||
      methodConfig.methodName === 'getPublicAttachmentLinkBySlug' ||
      methodConfig.methodName === 'getPublicThumbnailLinkBySlug'
    ) {
      return;
    }
    await this.taonSessionRepository.throwIfNotAuthenticated({ req, res });
    if (
      methodConfig.methodName === 'getVideoLinkBySlug' ||
      methodConfig.methodName === 'getAudioLinkBySlug' ||
      methodConfig.methodName === 'getAttachmentLinkBySlug' ||
      methodConfig.methodName === 'getJsonTableBySlug' ||
      methodConfig.methodName === 'getContentByHook' ||
      methodConfig.methodName === 'getThumbnailLinkBySlug'
    ) {
      return;
    }

    await this.taonSessionRepository.throwIfNotAuthenticated({ req, res });
    const ctx = await this.taonAuthContextRepository.getContext(
      req.userId,
      req.sessionId,
    );
    if (!ctx?.hasAccess?.toManageCms) {
      Taon.error({
        message: t.gettext("You can't manage posts"),
        status: getStatusCode(HttpStatusEnum.FORBIDDEN),
      });
    }
    //#endregion
  }
  //#endregion

  //#region methods / get video link by slug
  @GET()
  getVideoLinkBySlug(@Query('slug') slug: string): Taon.Response<string> {
    //#region @websqlFunc
    return (req, _res, { t }) =>
      this.getMediaLinkBySlug(slug, 'video', false, req, t);
    //#endregion
  }

  //#region methods / get public video link by slug
  @GET()
  getPublicVideoLinkBySlug(@Query('slug') slug: string): Taon.Response<string> {
    //#region @websqlFunc
    return (req, _res, { t }) =>
      this.getMediaLinkBySlug(slug, 'video', true, req, t);
    //#endregion
  }
  //#endregion

  //#region methods / get audio link by slug
  @GET()
  getAudioLinkBySlug(@Query('slug') slug: string): Taon.Response<string> {
    //#region @websqlFunc
    return (req, _res, { t }) =>
      this.getMediaLinkBySlug(slug, 'audio', false, req, t);
    //#endregion
  }
  //#endregion

  //#region methods / get public audio link by slug
  @GET()
  getPublicAudioLinkBySlug(@Query('slug') slug: string): Taon.Response<string> {
    //#region @websqlFunc
    return (req, _res, { t }) =>
      this.getMediaLinkBySlug(slug, 'audio', true, req, t);
    //#endregion
  }
  //#endregion

  //#region methods / get attachment link by slug
  @GET()
  getAttachmentLinkBySlug(@Query('slug') slug: string): Taon.Response<string> {
    //#region @websqlFunc
    return (req, _res, { t }) =>
      this.getMediaLinkBySlug(slug, 'attachment', false, req, t);
    //#endregion
  }
  //#endregion

  //#region methods / get public attachment link by slug
  @GET()
  getPublicAttachmentLinkBySlug(
    @Query('slug') slug: string,
  ): Taon.Response<string> {
    //#region @websqlFunc
    return (req, _res, { t }) =>
      this.getMediaLinkBySlug(slug, 'attachment', true, req, t);
    //#endregion
  }
  //#endregion
  //#endregion

  //#region methods / get media link
  @GET()
  getThumbnailLinkBySlug(@Query('slug') slug: string): Taon.Response<string> {
    //#region @websqlFunc
    return (req, _res, { t }) =>
      this.getMediaLinkBySlug(slug, 'thumbnail', false, req, t);
    //#endregion
  }

  @GET()
  getPublicThumbnailLinkBySlug(
    @Query('slug') slug: string,
  ): Taon.Response<string> {
    //#region @websqlFunc
    return (req, _res, { t }) =>
      this.getMediaLinkBySlug(slug, 'thumbnail', true, req, t);
    //#endregion
  }

  @GET()
  listCourses(): Taon.Response<TaonCmsContentEntity[]> {
    //#region @websqlFunc
    return async () => this.taonCmsContentRepository.listCourses();
    //#endregion
  }

  @GET()
  listTagIds(@Query('id') id: number): Taon.Response<number[]> {
    //#region @websqlFunc
    return async () => this.taonCmsContentRepository.listTagIds(id);
    //#endregion
  }

  private async getMediaLinkBySlug(
    slug: string,
    type: 'video' | 'audio' | 'attachment' | 'thumbnail',
    publicOnly: boolean,
    req: ExpressRequest,
    t: Models.TaonCtrlBeforeEachRequestParams<TaonCmsContentController>['t'],
  ): Promise<string> {
    //#region @websqlFunc
    const content =
      await this.taonCmsContentRepository.getContentBySlugForMedia(slug);
    if (!content) {
      contentError(t.gettext('Content was not found.'), 404);
    }
    const field =
      type === 'video'
        ? 'videoKey'
        : type === 'audio'
          ? 'audioKey'
          : type === 'thumbnail'
            ? 'thumbnailKey'
            : 'attachmentKey';
    const key = content![field];
    if (!key) {
      contentError(
        t.gettext('Content has no [[ type ]] media.', { type }),
        404,
      );
    }
    if (
      !(await this.taonCmsContentStorageController.isMediaObjectAvailable(key!))
    ) {
      contentError(t.gettext('The media file was not found in storage.'), 404);
    }
    await this.requireReadAccess(content!, publicOnly, req, t);

    const isPrivate = !publicOnly;
    const token = isPrivate
      ? await this.taonCmsContentStorageController.createStorageDownloadToken({
          key: key!,
          expiresAt: Date.now() + 5 * 60 * 1000,
        })
      : undefined;
    return this.taonCmsContentStorageController.buildStorageDownloadUrl({
      req,
      key: key!,
      private: isPrivate,
      token,
      download: type === 'attachment',
    });
    //#endregion
  }

  //#region methods / require read access
  private async requireReadAccess(
    content: TaonCmsContentEntity,
    publicOnly: boolean,
    req: ExpressRequest,
    t: Models.TaonCtrlBeforeEachRequestParams<TaonCmsContentController>['t'],
  ): Promise<void> {
    //#region @websqlFunc

    const { permissions } =
      await this.taonCmsContentRepository.getPermissionConfiguration(
        content.id,
      );
    const isPublic = content.status === 'published' && permissions.length === 0;
    if (publicOnly) {
      if (!isPublic) {
        contentError(
          t.gettext('This content is not publicly accessible.'),
          403,
        );
      }
    } else {
      await this.taonSessionRepository.throwIfNotAuthenticated({ req });
      const context = await this.taonAuthContextRepository.getContext(
        req.userId,
        req.sessionId,
      );
      const userPermissionCodes = new Set<string>(context?.permissions ?? []);
      const hasPermission = permissions.some(permission =>
        userPermissionCodes.has(permission.code),
      );
      if (!context?.isSuperUser && !isPublic && !hasPermission) {
        contentError(t.gettext('You do not have access to this content.'), 403);
      }
    }
    //#endregion
  }
  //#endregion
  //#endregion

  //#region methods / get by id
  @GET()
  getBy(@Query('id') id: number | string): Taon.Response<TaonCmsContentEntity> {
    //#region @websqlFunc
    return () => {
      const contentId = Number(id);
      if (!Number.isSafeInteger(contentId) || contentId <= 0) {
        contentError('contentId must be a positive integer.');
      }
      return this.taonCmsContentRepository.connection.transaction(manager =>
        this.taonCmsContentRepository.requireContent(contentId, manager),
      );
    };
    //#endregion
  }

  @GET()
  getBySlug(@Query(`slug`) slug: string): Taon.Response<TaonCmsContentEntity> {
    //#region @websqlFunc
    return async () => {
      const model = await this.db.findOne({
        where: {
          slug,
        },
      });
      return model;
    };
    //#endregion
  }
  //#endregion

  @GET()
  getJsonTableBySlug(
    @Query('slug') slug: string,
  ): Taon.Response<Record<string, unknown>[]> {
    //#region @websqlFunc
    return async (req, _res, { t }) => {
      const post = await this.requireJsonTablePost(slug, req, t, false);
      return this.jsonTableRows(post.body, t);
    };
    //#endregion
  }

  @GET()
  getPublicJsonTableBySlug(
    @Query('slug') slug: string,
  ): Taon.Response<Record<string, unknown>[]> {
    //#region @websqlFunc
    return async (req, _res, { t }) => {
      const post = await this.requireJsonTablePost(slug, req, t, true);
      return this.jsonTableRows(post.body, t);
    };
    //#endregion
  }

  @GET()
  getPublicExcerptBySlug(@Query('slug') slug: string): Taon.Response<string> {
    //#region @websqlFunc
    return async (req, _res, { t }) => {
      const model = await this.db.findOne({
        where: {
          slug,
        },
      });
      return model?.excerpt || '';
    };
    //#endregion
  }

  private async requireJsonTablePost(
    slug: string,
    req: ExpressRequest,
    t: Models.TaonCtrlBeforeEachRequestParams<TaonCmsContentController>['t'],
    publicOnly: boolean,
  ): Promise<TaonCmsContentEntity> {
    //#region @websqlFunc
    const normalizedSlug = typeof slug === 'string' ? slug.trim() : '';
    if (!normalizedSlug || normalizedSlug.length > 255) {
      contentError(t.gettext('The post slug is invalid.'), 400);
    }
    const post =
      await this.taonCmsContentRepository.getContentBySlugForMedia(
        normalizedSlug,
      );
    if (!post) {
      contentError(t.gettext('The post was not found.'), 404);
    }
    if (post.type !== TaonCmsContentType.JsonTable) {
      contentError(t.gettext('The post is not a JSON Table.'), 400);
    }
    await this.requireReadAccess(post, publicOnly, req, t);
    return post;
    //#endregion
  }

  private jsonTableRows(
    body: string | null,
    t: Models.TaonCtrlBeforeEachRequestParams<TaonCmsContentController>['t'],
  ): Record<string, unknown>[] {
    //#region @websqlFunc
    if (body && body.length > TAON_SPREADSHEET_MAX_BYTES) {
      contentError('JSON Table content exceeds the 10 MB limit.', 400);
    }
    try {
      return parseSpreadsheetDocument(body).rows;
    } catch (error) {
      if (error instanceof Error) {
        contentError(
          t.gettext('JSON Table content is invalid: [[ error ]]', {
            error: error.message,
          }),
          400,
        );
      }
      throw error;
    }
    //#endregion
  }

  @GET()
  getPublicBySlug(
    @Query('slug') slug: string,
  ): Taon.Response<TaonCmsContentEntity> {
    //#region @websqlFunc
    return async (req, _res, { t }) => {
      const normalizedSlug = typeof slug === 'string' ? slug.trim() : '';
      if (!normalizedSlug || normalizedSlug.length > 255) {
        contentError(t.gettext('The post slug is invalid.'), 400);
      }
      const post =
        await this.taonCmsContentRepository.getContentBySlugForMedia(
          normalizedSlug,
        );
      if (!post) {
        contentError(t.gettext('The post was not found.'), 404);
      }
      await this.requireReadAccess(post, true, req, t);
      return Object.assign(new TaonCmsContentEntity(), post, {
        permissions: [],
        relatedPosts: [],
        applicationHook: null,
      });
    };
    //#endregion
  }
  //#endregion

  @GET()
  getPublicVideoChildrenBySlug(
    @Query('slug') slug: string,
  ): Taon.Response<TaonCmsPublicVideoChild[]> {
    //#region @websqlFunc
    return async (req, _res, { t }) => {
      const normalizedSlug = typeof slug === 'string' ? slug.trim() : '';
      if (!normalizedSlug || normalizedSlug.length > 255) {
        contentError(t.gettext('The post slug is invalid.'), 400);
      }
      const parent =
        await this.taonCmsContentRepository.getContentBySlugForMedia(
          normalizedSlug,
        );
      if (!parent) {
        contentError(t.gettext('The post was not found.'), 404);
      }
      await this.requireReadAccess(parent, true, req, t);
      const children =
        await this.taonCmsContentRepository.listPublicVideoChildren(parent.id);
      const publicVideos: TaonCmsPublicVideoChild[] = [];
      for (const child of children) {
        if (!child.videoKey) {
          continue;
        }
        if (
          !(await this.taonCmsContentStorageController.isPublicMediaObject(
            child.videoKey,
          ))
        ) {
          continue;
        }
        const fallbackThumbnail = defaultThumbnailUrl(
          defaultThumbnailKey(child.type),
        );
        const posterUrl =
          child.thumbnailKey &&
          !child.thumbnailKey.startsWith('cms-placeholder:') &&
          (await this.taonCmsContentStorageController.isPublicMediaObject(
            child.thumbnailKey,
          ))
            ? this.taonCmsContentStorageController.buildStorageDownloadUrl({
                req,
                key: child.thumbnailKey,
                private: false,
              })
            : (fallbackThumbnail ?? '');
        publicVideos.push({
          slug: child.slug,
          title: child.title,
          excerpt: child.excerpt,
          videoUrl:
            this.taonCmsContentStorageController.buildStorageDownloadUrl({
              req,
              key: child.videoKey,
              private: false,
            }),
          posterUrl,
        });
      }
      return publicVideos;
    };
    //#endregion
  }
  //#endregion

  //#region methods / create content
  @POST()
  createContent(
    @Body() input: TaonCmsCreateContent,
  ): Taon.Response<TaonCmsContentEntity> {
    //#region @websqlFunc
    return async () => this.taonCmsContentRepository.createContent(input);
    //#endregion
  }
  //#endregion

  @POST()
  createRelatedChild(
    @Query('parentId') parentId: number,
    @Body() input: TaonCmsCreateRelatedChildInput,
  ): Taon.Response<TaonCmsCreateRelatedChildResult> {
    //#region @websqlFunc
    return async () => {
      if (!input || typeof input !== 'object') {
        contentError('The child post input is invalid.');
      }
      if (typeof input.sourceKey !== 'string') {
        contentError('The uploaded source media key is invalid.');
      }
      for (const key of [
        input.videoKey,
        input.audioKey,
        input.attachmentKey,
        input.thumbnailKey,
      ]) {
        if (key !== null && typeof key !== 'string') {
          contentError('The uploaded media key is invalid.');
        }
      }
      if (
        !(await this.taonCmsContentStorageController.isMediaObjectAvailable(
          input.sourceKey,
        ))
      ) {
        contentError('The uploaded source file was not found.', 404);
      }
      for (const key of [
        input.videoKey,
        input.audioKey,
        input.attachmentKey,
        input.thumbnailKey,
      ]) {
        if (
          key &&
          !key.startsWith('cms-placeholder:') &&
          !(await this.taonCmsContentStorageController.isMediaObjectAvailable(
            key,
          ))
        ) {
          contentError('The uploaded media file was not found.', 404);
        }
      }
      return this.taonCmsContentRepository.createRelatedChild(parentId, input);
    };
    //#endregion
  }
  //#endregion

  //#region methods / update content
  @PUT()
  updateContent(
    @Query('id') id: number,
    @Body() input: TaonCmsUpdateContent,
  ): Taon.Response<TaonCmsContentEntity> {
    //#region @websqlFunc
    return async () => this.taonCmsContentRepository.updateContent(id, input);
    //#endregion
  }
  //#endregion

  @POST()
  duplicateContent(
    @Query('id') id: number,
    @Query('includeChildren') includeChildren = false,
  ): Taon.Response<TaonCmsContentEntity> {
    //#region @websqlFunc
    return async () =>
      this.taonCmsContentRepository.duplicateContent(
        id,
        includeChildren,
        key =>
          this.taonCmsContentStorageController.copyMediaObjectForDuplication(
            key,
          ),
        key =>
          this.taonCmsContentStorageController.deleteMediaObjectForDuplication(
            key,
          ),
      );
    //#endregion
  }

  @DELETE()
  permanentlyDeleteContent(
    @Query('id') id: number,
    @Query('expectedVersion') expectedVersion: number,
  ): Taon.Response<boolean> {
    //#region @websqlFunc
    return async () => {
      await this.taonCmsContentRepository.permanentlyDeleteContent(
        id,
        expectedVersion,
        key =>
          this.taonCmsContentStorageController.deleteMediaObjectForDuplication(
            key,
          ),
      );
      return true;
    };
    //#endregion
  }

  //#region methods / delete content
  @DELETE()
  deleteContent(
    @Query('id') id: number,
    @Query('expectedVersion') expectedVersion: number,
  ): Taon.Response<TaonCmsContentEntity> {
    //#region @websqlFunc
    return async () =>
      this.taonCmsContentRepository.archiveContent(id, expectedVersion);
    //#endregion
  }
  //#endregion

  //#region methods / restore content
  @POST()
  restoreContent(
    @Query('id') id: number,
    @Body() input: TaonCmsRestoreContent,
  ): Taon.Response<TaonCmsContentEntity> {
    //#region @websqlFunc
    return async () => this.taonCmsContentRepository.restoreContent(id, input);
    //#endregion
  }
  //#endregion

  //#region methods / list related posts
  @GET()
  listRelatedPosts(
    @Query('id') id: number,
  ): Taon.Response<TaonCmsContentEntity[]> {
    //#region @websqlFunc
    return async () => this.taonCmsContentRepository.listRelatedPosts(id);
    //#endregion
  }
  //#endregion

  @GET()
  getParentPost(
    @Query('id') id: number,
  ): Taon.Response<TaonCmsContentEntity | null> {
    //#region @websqlFunc
    return async () => this.taonCmsContentRepository.getParentPost(id);
    //#endregion
  }

  @GET()
  getVisibilityConfiguration(
    @Query('id') id: number,
  ): Taon.Response<TaonCmsVisibilityConfiguration> {
    //#region @websqlFunc
    return async () =>
      this.taonCmsContentRepository.getVisibilityConfiguration(id);
    //#endregion
  }

  @GET()
  getPostVersions(
    @Query('id') id: number,
  ): Taon.Response<TaonCmsPostVersionLinks> {
    //#region @websqlFunc
    return async () => this.taonCmsContentRepository.getPostVersions(id);
    //#endregion
  }

  //#region methods / list permissions
  @GET()
  listPermissions(
    @Query('id') id: number,
  ): Taon.Response<TaonPermissionEntity[]> {
    //#region @websqlFunc
    return async () => this.taonCmsContentRepository.listPermissions(id);
    //#endregion
  }
  //#endregion

  //#region methods / get permission configuration
  @GET()
  getPermissionConfiguration(
    @Query('id') id: number,
  ): Taon.Response<TaonCmsPermissionConfiguration> {
    //#region @websqlFunc
    return async () =>
      this.taonCmsContentRepository.getPermissionConfiguration(id);
    //#endregion
  }
  //#endregion

  //#region methods / list application hooks
  @GET()
  listApplicationHooks(): Taon.Response<TaonCmsApplicationHookEntity[]> {
    //#region @websqlFunc
    return async () => this.taonCmsContentRepository.listApplicationHooks();
    //#endregion
  }
  //#endregion

  //#region methods / get content by hook
  @GET()
  getContentByHook(@Query('hook') hook: string): Taon.Response<string> {
    //#region @websqlFunc
    return async (req, _res, { t }) => {
      const content =
        await this.taonCmsContentRepository.getContentForHook(hook);
      if (!content) {
        return '';
      }
      await this.requireReadAccess(content, false, req, t);
      return content.body ?? '';
    };
    //#endregion
  }
  //#endregion

  //#region methods / get public content by hook
  @GET()
  getPublicContentByHook(@Query('hook') hook: string): Taon.Response<string> {
    //#region @websqlFunc
    return async (req, _res, { t }) => {
      const content =
        await this.taonCmsContentRepository.getContentForHook(hook);
      if (!content) {
        return '';
      }
      await this.requireReadAccess(content, true, req, t);
      return content.body ?? '';
    };
    //#endregion
  }
  //#endregion

  //#region methods / add related post
  @POST()
  addRelatedPost(
    @Query('id') id: number,
    @Query('relatedPostId') relatedPostId: number,
    @Query('expectedVersion') expectedVersion: number,
  ): Taon.Response<TaonCmsContentEntity> {
    //#region @websqlFunc
    return async () =>
      this.taonCmsContentRepository.addRelatedPost(
        id,
        relatedPostId,
        expectedVersion,
      );
    //#endregion
  }
  //#endregion

  //#region methods / delete related post
  @DELETE()
  deleteRelatedPost(
    @Query('id') id: number,
    @Query('relatedPostId') relatedPostId: number,
    @Query('expectedVersion') expectedVersion: number,
  ): Taon.Response<TaonCmsContentEntity> {
    //#region @websqlFunc
    return async () =>
      this.taonCmsContentRepository.deleteRelatedPost(
        id,
        relatedPostId,
        expectedVersion,
      );
    //#endregion
  }
  //#endregion

  @POST()
  linkVersionPost(
    @Query('id') id: number,
    @Query('versionPostId') versionPostId: number,
    @Query('kind') kind: TaonCmsPostVersionKind,
    @Query('expectedVersion') expectedVersion: number,
  ): Taon.Response<TaonCmsContentEntity> {
    //#region @websqlFunc
    return async () =>
      this.taonCmsContentRepository.linkVersionPost(
        id,
        versionPostId,
        kind,
        expectedVersion,
      );
    //#endregion
  }

  @DELETE()
  removeVersionPost(
    @Query('id') id: number,
    @Query('kind') kind: TaonCmsPostVersionKind,
    @Query('expectedVersion') expectedVersion: number,
  ): Taon.Response<TaonCmsContentEntity> {
    //#region @websqlFunc
    return async () =>
      this.taonCmsContentRepository.removeVersionPost(
        id,
        kind,
        expectedVersion,
      );
    //#endregion
  }

  //#region methods / list revisions
  @GET()
  listRevisions(
    @Query('id') id: number,
  ): Taon.Response<TaonCmsContentRevisionEntity[]> {
    //#region @websqlFunc
    return async () => this.taonCmsContentRepository.listRevisions(id);
    //#endregion
  }
  //#endregion
}
