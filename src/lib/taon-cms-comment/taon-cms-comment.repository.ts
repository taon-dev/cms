//#region imports
import { TaonBaseRepository, TaonRepository } from 'taon/src';
import { Raw } from 'taon-typeorm/src';

import { TaonCmsCommentEntity } from './taon-cms-comment.entity';
//#endregion

@TaonRepository({
  className: 'TaonCmsCommentRepository',
})
export class TaonCmsCommentRepository extends TaonBaseRepository<TaonCmsCommentEntity> {
  entityClassResolveFn: () => typeof TaonCmsCommentEntity = () => TaonCmsCommentEntity;

  /**
   * TODO remove this demo example method
   */
  async countEntitesWithEvenId(): Promise<number> {
    //#region @websqlFunc
    const result = await this.count({
      where: {
        id: Raw(alias => `${alias} % 2 = 0`),
      },
    });
    return result;
    //#endregion
  }
}