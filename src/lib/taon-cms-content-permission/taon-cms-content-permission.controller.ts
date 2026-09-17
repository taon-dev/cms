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

import { TaonCmsContentPermissionEntity } from './taon-cms-content-permission.entity';
import { TaonCmsContentPermissionRepository } from './taon-cms-content-permission.repository';
//#endregion

@TaonController<TaonCmsContentPermissionController>({
  className: 'TaonCmsContentPermissionController',
  allowedMethods: []
})
export class TaonCmsContentPermissionController extends TaonBaseCrudController<TaonCmsContentPermissionEntity> {
  entityClassResolveFn: () => typeof TaonCmsContentPermissionEntity = () => TaonCmsContentPermissionEntity;

  taonCmsContentPermissionRepository = this.injectCustomRepo(TaonCmsContentPermissionRepository);

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
        await this.taonCmsContentPermissionRepository.countEntitesWithEvenId();
      return `Hello ${yourName || 'world'} from ${ClassHelpers.getName(TaonCmsContentPermissionController)}
      controller..  ${numOfEntities} entites in db..
      ${numberOfEvenEntities} entites with even ids (2,4,6,8 etc.)
      `;
    };
    //#endregion
  }
  //#endregion
}
