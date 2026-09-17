//#region imports
import { TaonBaseRepository, TaonRepository } from 'taon/src';
import { Raw } from 'taon-typeorm/src';

import { TaonCmsContentAssetEntity } from './taon-cms-content-asset.entity';
//#endregion

@TaonRepository({
  className: 'TaonCmsContentAssetRepository',
})
export class TaonCmsContentAssetRepository extends TaonBaseRepository<TaonCmsContentAssetEntity> {
  entityClassResolveFn: () => typeof TaonCmsContentAssetEntity = () => TaonCmsContentAssetEntity;

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