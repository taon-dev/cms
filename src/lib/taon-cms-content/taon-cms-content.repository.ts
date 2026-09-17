//#region imports
import { TaonBaseRepository, TaonRepository } from 'taon/src';
import { Raw } from 'taon-typeorm/src';

import { TaonCmsContentEntity } from './taon-cms-content.entity';
//#endregion

@TaonRepository({
  className: 'TaonCmsContentRepository',
})
export class TaonCmsContentRepository extends TaonBaseRepository<TaonCmsContentEntity> {
  entityClassResolveFn: () => typeof TaonCmsContentEntity = () => TaonCmsContentEntity;

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