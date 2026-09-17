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

import { TaonCmsContentRevisionEntity } from './taon-cms-content-revision.entity';
import { TaonCmsContentRevisionRepository } from './taon-cms-content-revision.repository';
//#endregion

@TaonController<TaonCmsContentRevisionController>({
  className: 'TaonCmsContentRevisionController',
  allowedMethods: []
})
export class TaonCmsContentRevisionController extends TaonBaseCrudController<TaonCmsContentRevisionEntity> {
  entityClassResolveFn: () => typeof TaonCmsContentRevisionEntity = () => TaonCmsContentRevisionEntity;

  taonCmsContentRevisionRepository = this.injectCustomRepo(TaonCmsContentRevisionRepository);

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
        await this.taonCmsContentRevisionRepository.countEntitesWithEvenId();
      return `Hello ${yourName || 'world'} from ${ClassHelpers.getName(TaonCmsContentRevisionController)}
      controller..  ${numOfEntities} entites in db..
      ${numberOfEvenEntities} entites with even ids (2,4,6,8 etc.)
      `;
    };
    //#endregion
  }
  //#endregion
}
