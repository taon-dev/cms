//#region imports
import { TaonBaseRepository, TaonRepository } from 'taon/src';
import { Raw } from 'taon-typeorm/src';

import { TaonCmsContentPermissionEntity } from './taon-cms-content-permission.entity';
//#endregion

@TaonRepository({
  className: 'TaonCmsContentPermissionRepository',
})
export class TaonCmsContentPermissionRepository extends TaonBaseRepository<TaonCmsContentPermissionEntity> {
  entityClassResolveFn: () => typeof TaonCmsContentPermissionEntity = () => TaonCmsContentPermissionEntity;

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