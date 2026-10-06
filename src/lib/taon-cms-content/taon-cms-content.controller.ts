//#region imports
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
} from 'taon/src';
import { _ } from 'tnp-core/src';

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
    'createContent',
    'updateContent',
    'deleteContent',
    'restoreContent',
    'listRevisions',
    'listRelatedPosts',
    'addRelatedPost',
    'deleteRelatedPost',
    'paginationQuery'
  ],
})
export class TaonCmsContentController extends TaonBaseCrudController<TaonCmsContentEntity> {
  entityClassResolveFn: () => typeof TaonCmsContentEntity = () =>
    TaonCmsContentEntity;

  taonCmsContentRepository = this.injectCustomRepo(TaonCmsContentRepository);

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

  @POST()
  addRelatedPost(
    @Query('id') id: number,
    @Query('relatedPostId') relatedPostId: number,
    @Query('expectedVersion') expectedVersion: number,
  ): Taon.Response<TaonCmsContentEntity> {
    //#region @websqlFunc
    return async () => this.taonCmsContentRepository.addRelatedPost(
      id, relatedPostId, expectedVersion,
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
    return async () => this.taonCmsContentRepository.deleteRelatedPost(
      id, relatedPostId, expectedVersion,
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
