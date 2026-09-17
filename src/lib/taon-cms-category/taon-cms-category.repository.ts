//#region imports
import { TaonBaseRepository, TaonRepository } from 'taon/src';
import { Raw } from 'taon-typeorm/src';

import { TaonCmsCategoryEntity } from './taon-cms-category.entity';
//#endregion

@TaonRepository({
  className: 'TaonCmsCategoryRepository',
})
export class TaonCmsCategoryRepository extends TaonBaseRepository<TaonCmsCategoryEntity> {
  entityClassResolveFn: () => typeof TaonCmsCategoryEntity = () => TaonCmsCategoryEntity;

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