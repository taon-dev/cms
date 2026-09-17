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

import { TaonCmsCommentEntity } from './taon-cms-comment.entity';
import { TaonCmsCommentRepository } from './taon-cms-comment.repository';
//#endregion

@TaonController<TaonCmsCommentController>({
  className: 'TaonCmsCommentController',
  allowedMethods: []
})
export class TaonCmsCommentController extends TaonBaseCrudController<TaonCmsCommentEntity> {
  entityClassResolveFn: () => typeof TaonCmsCommentEntity = () => TaonCmsCommentEntity;

  taonCmsCommentRepository = this.injectCustomRepo(TaonCmsCommentRepository);

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
        await this.taonCmsCommentRepository.countEntitesWithEvenId();
      return `Hello ${yourName || 'world'} from ${ClassHelpers.getName(TaonCmsCommentController)}
      controller..  ${numOfEntities} entites in db..
      ${numberOfEvenEntities} entites with even ids (2,4,6,8 etc.)
      `;
    };
    //#endregion
  }
  //#endregion
}
