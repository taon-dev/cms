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

import { TaonCmsTagEntity } from './taon-cms-tag.entity';
import { TaonCmsTagRepository } from './taon-cms-tag.repository';
//#endregion

@TaonController<TaonCmsTagController>({
  className: 'TaonCmsTagController',
  allowedMethods: []
})
export class TaonCmsTagController extends TaonBaseCrudController<TaonCmsTagEntity> {
  entityClassResolveFn: () => typeof TaonCmsTagEntity = () => TaonCmsTagEntity;

  taonCmsTagRepository = this.injectCustomRepo(TaonCmsTagRepository);

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
