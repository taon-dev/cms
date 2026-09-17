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

import { TaonCmsContentEntity } from './taon-cms-content.entity';
import { TaonCmsContentRepository } from './taon-cms-content.repository';
//#endregion

@TaonController<TaonCmsContentController>({
  className: 'TaonCmsContentController',
  allowedMethods: [],
})
export class TaonCmsContentController extends TaonBaseCrudController<TaonCmsContentEntity> {
  entityClassResolveFn: () => typeof TaonCmsContentEntity = () =>
    TaonCmsContentEntity;

  taonCmsContentRepository = this.injectCustomRepo(TaonCmsContentRepository);

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
        await this.taonCmsContentRepository.countEntitesWithEvenId();
      return `Hello ${yourName || 'world'} from ${ClassHelpers.getName(TaonCmsContentController)}
      controller..  ${numOfEntities} entites in db..
      ${numberOfEvenEntities} entites with even ids (2,4,6,8 etc.)
      `;
    };
    //#endregion
  }
  //#endregion
}
