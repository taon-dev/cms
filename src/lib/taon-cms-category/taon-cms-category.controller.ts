//#region imports
import { TaonSessionRepository } from '@taon-dev/session/src';
import { TaonAuthContextRepository } from '@taon-dev/session/src';
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
import { _ } from 'tnp-core/src';

import { contentError } from '../taon-cms-content/taon-cms-content.validation';

import { TaonCmsCategoryEntity } from './taon-cms-category.entity';
import { TaonCmsCategoryRepository } from './taon-cms-category.repository';
import type { TaonCmsCategoryFields } from './taon-cms-taxonomy.validation';
//#endregion

@TaonController<TaonCmsCategoryController>({
  className: 'TaonCmsCategoryController',
  allowedMethods: ['getAll', 'saveCategory', 'deleteCategory'],
})
export class TaonCmsCategoryController extends TaonBaseCrudController<TaonCmsCategoryEntity> {
  entityClassResolveFn: () => typeof TaonCmsCategoryEntity = () =>
    TaonCmsCategoryEntity;

  taonCmsCategoryRepository = this.injectCustomRepo(TaonCmsCategoryRepository);

  private readonly sessions = this.injectCustomRepo(TaonSessionRepository);

  private readonly auth = this.injectCustomRepo(TaonAuthContextRepository);

  protected async beforeEachRequest({
    req,
    res,
    t,
  }: Models.TaonCtrlBeforeEachRequestParams<TaonCmsCategoryController>): Promise<void> {
    //#region @backendFunc
    await this.sessions.throwIfNotAuthenticated({ req, res });
    const context = await this.auth.getContext(req.userId, req.sessionId);
    if (!context?.hasAccess?.toManagePosts) {
      contentError(t.gettext("You can't manage posts"), 403);
    }
    //#endregion
  }

  @POST()
  saveCategory(
    @Query('id') id: number | null,
    @Body() input: TaonCmsCategoryFields,
  ): Taon.Response<TaonCmsCategoryEntity> {
    //#region @websqlFunc
    return () => this.taonCmsCategoryRepository.saveCategory(id ?? null, input);
    //#endregion
  }

  @DELETE()
  deleteCategory(@Query('id') id: number): Taon.Response<void> {
    //#region @websqlFunc
    return () => this.taonCmsCategoryRepository.deleteCategory(id);
    //#endregion
  }
}
