//#region imports
import { TaonBaseRepository, TaonRepository } from 'taon/src';
import { Raw } from 'taon-typeorm/src';

import { TaonCmsContentRevisionEntity } from './taon-cms-content-revision.entity';
//#endregion

@TaonRepository({
  className: 'TaonCmsContentRevisionRepository',
})
export class TaonCmsContentRevisionRepository extends TaonBaseRepository<TaonCmsContentRevisionEntity> {
  entityClassResolveFn: () => typeof TaonCmsContentRevisionEntity = () => TaonCmsContentRevisionEntity;

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