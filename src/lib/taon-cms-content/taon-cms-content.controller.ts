//#region imports
import {
  TaonSessionRepository,
  type TaonPermissionEntity,
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
} from 'taon/src';
import { _ } from 'tnp-core/src';

import {
  TaonAuthContextRepository,
  TaonSessionCoreAuthorization,
} from '../decorators/taon-cms-authorization';
import type { TaonCmsApplicationHookEntity } from '../taon-cms-application-hook/taon-cms-application-hook.entity';
import type { TaonCmsContentRevisionEntity } from '../taon-cms-content-revision/taon-cms-content-revision.entity';

import { TaonCmsContentEntity } from './taon-cms-content.entity';
import type {
  TaonCmsCreateContent,
  TaonCmsRestoreContent,
  TaonCmsUpdateContent,
} from './taon-cms-content.models';
import { TaonCmsContentRepository } from './taon-cms-content.repository';
import { TaonCmsContentStorageController } from './taon-cms-content-storage.controller';
import { contentError } from './taon-cms-content.validation';
//#endregion

@TaonController<TaonCmsContentController>({
  className: 'TaonCmsContentController',
  allowedMethods: [
    'getAll',
    'getBy',
    'createContent',
    'updateContent',
    'deleteContent',
    'restoreContent',
    'listRevisions',
    'listRelatedPosts',
    'listPermissions',
    'listApplicationHooks',
    'getContentByHook',
    'getPublicContentByHook',
    'getVideoLinkBySlug',
    'getPublicVideoLinkBySlug',
    'getAudioLinkBySlug',
    'getPublicAudioLinkBySlug',
    'getAttachmentLinkBySlug',
    'getPublicAttachmentLinkBySlug',
    'addRelatedPost',
    'deleteRelatedPost',
    'paginationQuery',
  ],
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
      methodConfig.methodName === 'getPublicAttachmentLinkBySlug'
    ) {
      return;
    }
    await this.taonSessionRepository.throwIfNotAuthenticated({ req, res });
    if (
      methodConfig.methodName === 'getVideoLinkBySlug' ||
      methodConfig.methodName === 'getAudioLinkBySlug' ||
      methodConfig.methodName === 'getAttachmentLinkBySlug'
    ) {
      return;
    }
    const ctx = await this.taonAuthContextRepository.getContext(
      req.userId,
      req.sessionId,
    );
    if (!ctx?.hasAccess?.toManagePosts) {
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
    return req => this.getMediaLinkBySlug(slug, 'video', false, req);
    //#endregion
  }

  //#region methods / get public video link by slug
  @GET()
  getPublicVideoLinkBySlug(@Query('slug') slug: string): Taon.Response<string> {
    //#region @websqlFunc
    return req => this.getMediaLinkBySlug(slug, 'video', true, req);
    //#endregion
  }
  //#endregion

  //#region methods / get audio link by slug
  @GET()
  getAudioLinkBySlug(@Query('slug') slug: string): Taon.Response<string> {
    //#region @websqlFunc
    return req => this.getMediaLinkBySlug(slug, 'audio', false, req);
    //#endregion
  }
  //#endregion

  //#region methods / get public audio link by slug
  @GET()
  getPublicAudioLinkBySlug(@Query('slug') slug: string): Taon.Response<string> {
    //#region @websqlFunc
    return req => this.getMediaLinkBySlug(slug, 'audio', true, req);
    //#endregion
  }
  //#endregion

  //#region methods / get attachment link by slug
  @GET()
  getAttachmentLinkBySlug(@Query('slug') slug: string): Taon.Response<string> {
    //#region @websqlFunc
    return req => this.getMediaLinkBySlug(slug, 'attachment', false, req);
    //#endregion
  }
  //#endregion

  //#region methods / get public attachment link by slug
  @GET()
  getPublicAttachmentLinkBySlug(
    @Query('slug') slug: string,
  ): Taon.Response<string> {
    //#region @websqlFunc
    return req => this.getMediaLinkBySlug(slug, 'attachment', true, req);
    //#endregion
  }
  //#endregion
  //#endregion

  //#region methods / get media link
  private async getMediaLinkBySlug(
    slug: string,
    type: 'video' | 'audio' | 'attachment',
    publicOnly: boolean,
    req: ExpressRequest,
  ): Promise<string> {
    //#region @websqlFunc
    const content =
      await this.taonCmsContentRepository.getContentBySlugForMedia(slug);
    if (!content) {
      contentError('Content was not found.', 404);
    }
    const field =
      type === 'video'
        ? 'videoKey'
        : type === 'audio'
          ? 'audioKey'
          : 'attachmentKey';
    const key = content![field];
    if (!key) {
      contentError(`Content has no ${type} media.`, 404);
    }
    if (
      !(await this.taonCmsContentStorageController.isMediaObjectAvailable(key!))
    ) {
      contentError('The media file was not found in storage.', 404);
    }
    const isPublic =
      content!.status === 'published' && content!.permissions.length === 0;
    if (publicOnly && !isPublic) {
      contentError('This content is not publicly accessible.', 403);
    }
    if (!publicOnly) {
      const context = await this.taonAuthContextRepository.getContext(
        req.userId,
        req.sessionId,
      );
      const userPermissionCodes = new Set<string>(context?.permissions ?? []);
      const hasPermission = content!.permissions.some(permission =>
        userPermissionCodes.has(permission.code),
      );
      if (!context?.isSuperUser && !isPublic && !hasPermission) {
        contentError('You do not have access to this content.', 403);
      }
    }

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
    return async () => this.taonCmsContentRepository.getContentByHook(hook);
    //#endregion
  }
  //#endregion

  //#region methods / get public content by hook
  @GET()
  getPublicContentByHook(@Query('hook') hook: string): Taon.Response<string> {
    //#region @websqlFunc
    return async () => this.taonCmsContentRepository.getContentByHook(hook);
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
