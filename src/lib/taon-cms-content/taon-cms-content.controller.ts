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
  TaonCmsRestoreContent,
  TaonCmsUpdateContent,
  TaonCmsPermissionConfiguration,
} from './taon-cms-content.models';
import { TaonCmsContentRepository } from './taon-cms-content.repository';
import { contentError } from './taon-cms-content.validation';
//#endregion

@TaonController<TaonCmsContentController>({
  //#region controller options
  className: 'TaonCmsContentController',
  allowedMethods: [
    'getAll',
    'getBy',
    'createContent',
    'duplicateContent',
    'updateContent',
    'deleteContent',
    'restoreContent',
    'listRevisions',
    'listRelatedPosts',
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
    'paginationQuery',
  ],
  //#endregion
})
export class TaonCmsContentController extends TaonBaseCrudController<TaonCmsContentEntity> {
  //#region fields & getters
  entityClassResolveFn: () => typeof TaonCmsContentEntity = () =>
    TaonCmsContentEntity;

  private readonly taonCmsContentRepository = this.injectCustomRepo(
    TaonCmsContentRepository,
  );

  private readonly taonSessionRepository = this.injectCustomRepo(
    TaonSessionRepository,
  );

  private readonly taonAuthContextRepository = this.injectCustomRepo(
    TaonAuthContextRepository,
  );

  private readonly taonCmsContentStorageController = this.injectController(
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
      methodConfig.methodName === 'getPublicContentByHook' ||
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
  ): Taon.Response<TaonCmsContentEntity> {
    //#region @websqlFunc
    return async () => this.taonCmsContentRepository.duplicateContent(id);
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
