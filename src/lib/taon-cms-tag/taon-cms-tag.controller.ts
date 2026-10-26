//#region imports
import {
  Taon,
  ClassHelpers,
  TaonController,
  TaonBaseCrudController,
  Query,
  GET,
  POST,
  DELETE,
  Body,
  Models,
} from 'taon/src';
import { TaonSessionRepository } from '@taon-dev/session/src';
import { TaonAuthContextRepository } from '../decorators/taon-cms-authorization';
import { contentError } from '../taon-cms-content/taon-cms-content.validation';
import type { TaonCmsTaxonomyFields } from '../taon-cms-category/taon-cms-taxonomy.validation';
import { _ } from 'tnp-core/src';

import { TaonCmsTagEntity } from './taon-cms-tag.entity';
import { TaonCmsTagRepository } from './taon-cms-tag.repository';
//#endregion

@TaonController<TaonCmsTagController>({
  className: 'TaonCmsTagController',
  allowedMethods: ['getAll', 'saveTag', 'deleteTag'],
})
export class TaonCmsTagController extends TaonBaseCrudController<TaonCmsTagEntity> {
  entityClassResolveFn: () => typeof TaonCmsTagEntity = () => TaonCmsTagEntity;

  taonCmsTagRepository = this.injectCustomRepo(TaonCmsTagRepository);

  private readonly sessions = this.injectCustomRepo(TaonSessionRepository);
  private readonly auth = this.injectCustomRepo(TaonAuthContextRepository);

  protected async beforeEachRequest({
    req,
    res,
    t,
  }: Models.TaonCtrlBeforeEachRequestParams<TaonCmsTagController>): Promise<void> {
    //#region @backendFunc
    await this.sessions.throwIfNotAuthenticated({ req, res });
    const context = await this.auth.getContext(req.userId, req.sessionId);
    if (!context?.hasAccess?.toManagePosts) {
      contentError(t.gettext("You can't manage posts"), 403);
    }
    //#endregion
  }

  @POST()
  saveTag(
    @Query('id') id: number | null,
    @Body() input: TaonCmsTaxonomyFields,
  ): Taon.Response<TaonCmsTagEntity> {
    //#region @websqlFunc
    return () => this.taonCmsTagRepository.saveTag(id ?? null, input);
    //#endregion
  }

  @DELETE()
  deleteTag(@Query('id') id: number): Taon.Response<void> {
    //#region @websqlFunc
    return () => this.taonCmsTagRepository.deleteTag(id);
    //#endregion
  }

  //#region methods & getters / hello world
  /**
   * TODO remove this demo example method
   */
  @GET()
  helloWord(@Query('yourName') yourName: string): Taon.Response<string> {
    //#region @websqlFunc
    return async (req, res) => {
      const numOfEntities = await this.db.count();
      const numberOfEvenEntities =
        await this.taonCmsTagRepository.countEntitesWithEvenId();
      return `Hello ${yourName || 'world'} from ${ClassHelpers.getName(TaonCmsTagController)}
      controller..  ${numOfEntities} entites in db..
      ${numberOfEvenEntities} entites with even ids (2,4,6,8 etc.)
      `;
    };
    //#endregion
  }
  //#endregion
}
