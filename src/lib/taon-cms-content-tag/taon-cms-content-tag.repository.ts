//#region imports
import { TaonBaseRepository, TaonRepository } from 'taon/src';
import { Raw } from 'taon-typeorm/src';

import { TaonCmsContentTagEntity } from './taon-cms-content-tag.entity';
//#endregion

@TaonRepository({
  className: 'TaonCmsContentTagRepository',
})
export class TaonCmsContentTagRepository extends TaonBaseRepository<TaonCmsContentTagEntity> {
  entityClassResolveFn: () => typeof TaonCmsContentTagEntity = () => TaonCmsContentTagEntity;

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