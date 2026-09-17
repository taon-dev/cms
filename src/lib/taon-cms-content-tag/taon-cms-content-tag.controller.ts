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

import { TaonCmsContentTagEntity } from './taon-cms-content-tag.entity';
import { TaonCmsContentTagRepository } from './taon-cms-content-tag.repository';
//#endregion

@TaonController<TaonCmsContentTagController>({
  className: 'TaonCmsContentTagController',
  allowedMethods: []
})
export class TaonCmsContentTagController extends TaonBaseCrudController<TaonCmsContentTagEntity> {
  entityClassResolveFn: () => typeof TaonCmsContentTagEntity = () => TaonCmsContentTagEntity;

  taonCmsContentTagRepository = this.injectCustomRepo(TaonCmsContentTagRepository);

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
        await this.taonCmsContentTagRepository.countEntitesWithEvenId();
      return `Hello ${yourName || 'world'} from ${ClassHelpers.getName(TaonCmsContentTagController)}
      controller..  ${numOfEntities} entites in db..
      ${numberOfEvenEntities} entites with even ids (2,4,6,8 etc.)
      `;
    };
    //#endregion
  }
  //#endregion
}
