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
    'addRelatedPost',
    'deleteRelatedPost',
    'paginationQuery',
  ],
})
export class TaonCmsContentController extends TaonBaseCrudController<TaonCmsContentEntity> {
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

  protected async beforeEachRequest({
    req,
    res,
    methodConfig,
    t,
  }: Models.TaonCtrlBeforeEachRequestParams<TaonCmsContentController>): Promise<void> {
    //#region @backendFunc
    if (methodConfig.methodName === 'getPublicContentByHook') {
      return;
    }
    await this.taonSessionRepository.throwIfNotAuthenticated({ req, res });
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

  //#region get by id
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

  @POST()
  createContent(
    @Body() input: TaonCmsCreateContent,
  ): Taon.Response<TaonCmsContentEntity> {
    //#region @websqlFunc
    return async () => this.taonCmsContentRepository.createContent(input);
    //#endregion
  }

  @PUT()
  updateContent(
    @Query('id') id: number,
    @Body() input: TaonCmsUpdateContent,
  ): Taon.Response<TaonCmsContentEntity> {
    //#region @websqlFunc
    return async () => this.taonCmsContentRepository.updateContent(id, input);
    //#endregion
  }

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

  @POST()
  restoreContent(
    @Query('id') id: number,
    @Body() input: TaonCmsRestoreContent,
  ): Taon.Response<TaonCmsContentEntity> {
    //#region @websqlFunc
    return async () => this.taonCmsContentRepository.restoreContent(id, input);
    //#endregion
  }

  @GET()
  listRelatedPosts(
    @Query('id') id: number,
  ): Taon.Response<TaonCmsContentEntity[]> {
    //#region @websqlFunc
    return async () => this.taonCmsContentRepository.listRelatedPosts(id);
    //#endregion
  }

  @GET()
  listPermissions(
    @Query('id') id: number,
  ): Taon.Response<TaonPermissionEntity[]> {
    //#region @websqlFunc
    return async () => this.taonCmsContentRepository.listPermissions(id);
    //#endregion
  }

  @GET()
  listApplicationHooks(): Taon.Response<TaonCmsApplicationHookEntity[]> {
    //#region @websqlFunc
    return async () => this.taonCmsContentRepository.listApplicationHooks();
    //#endregion
  }

  @GET()
  getContentByHook(@Query('hook') hook: string): Taon.Response<string> {
    //#region @websqlFunc
    return async () => this.taonCmsContentRepository.getContentByHook(hook);
    //#endregion
  }

  @GET()
  getPublicContentByHook(@Query('hook') hook: string): Taon.Response<string> {
    //#region @websqlFunc
    return async () => this.taonCmsContentRepository.getContentByHook(hook);
    //#endregion
  }

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

  @GET()
  listRevisions(
    @Query('id') id: number,
  ): Taon.Response<TaonCmsContentRevisionEntity[]> {
    //#region @websqlFunc
    return async () => this.taonCmsContentRepository.listRevisions(id);
    //#endregion
  }
}
