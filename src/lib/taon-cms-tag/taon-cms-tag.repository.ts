//#region imports
import { TaonBaseRepository, TaonRepository } from 'taon/src';
import { Raw } from 'taon-typeorm/src';

import { TaonCmsTagEntity } from './taon-cms-tag.entity';
//#endregion

@TaonRepository({
  className: 'TaonCmsTagRepository',
})
export class TaonCmsTagRepository extends TaonBaseRepository<TaonCmsTagEntity> {
  entityClassResolveFn: () => typeof TaonCmsTagEntity = () => TaonCmsTagEntity;

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