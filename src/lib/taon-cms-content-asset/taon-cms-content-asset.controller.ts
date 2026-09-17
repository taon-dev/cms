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

import { TaonCmsContentAssetEntity } from './taon-cms-content-asset.entity';
import { TaonCmsContentAssetRepository } from './taon-cms-content-asset.repository';
//#endregion

@TaonController<TaonCmsContentAssetController>({
  className: 'TaonCmsContentAssetController',
  allowedMethods: []
})
export class TaonCmsContentAssetController extends TaonBaseCrudController<TaonCmsContentAssetEntity> {
  entityClassResolveFn: () => typeof TaonCmsContentAssetEntity = () => TaonCmsContentAssetEntity;

  taonCmsContentAssetRepository = this.injectCustomRepo(TaonCmsContentAssetRepository);

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
        await this.taonCmsContentAssetRepository.countEntitesWithEvenId();
      return `Hello ${yourName || 'world'} from ${ClassHelpers.getName(TaonCmsContentAssetController)}
      controller..  ${numOfEntities} entites in db..
      ${numberOfEvenEntities} entites with even ids (2,4,6,8 etc.)
      `;
    };
    //#endregion
  }
  //#endregion
}
