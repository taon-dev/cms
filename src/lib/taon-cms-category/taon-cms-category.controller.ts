//#region imports
import {
  Taon,
  ClassHelpers,
  TaonController,
  TaonBaseCrudController,
  Query,
  GET,
} from 'taon/src';
import { _ } from 'tnp-core/src';

import { TaonCmsCategoryEntity } from './taon-cms-category.entity';
import { TaonCmsCategoryRepository } from './taon-cms-category.repository';
//#endregion

@TaonController<TaonCmsCategoryController>({
  className: 'TaonCmsCategoryController',
  allowedMethods: []
})
export class TaonCmsCategoryController extends TaonBaseCrudController<TaonCmsCategoryEntity> {
  entityClassResolveFn: () => typeof TaonCmsCategoryEntity = () => TaonCmsCategoryEntity;

  taonCmsCategoryRepository = this.injectCustomRepo(TaonCmsCategoryRepository);

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
        await this.taonCmsCategoryRepository.countEntitesWithEvenId();
      return `Hello ${yourName || 'world'} from ${ClassHelpers.getName(TaonCmsCategoryController)}
      controller..  ${numOfEntities} entites in db..
      ${numberOfEvenEntities} entites with even ids (2,4,6,8 etc.)
      `;
    };
    //#endregion
  }
  //#endregion
}
