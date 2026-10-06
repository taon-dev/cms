//#region imports
import { TaonBaseRepository, TaonRepository } from 'taon/src';
import { Raw } from 'taon-typeorm/src';
import type { EntityManager } from 'taon-typeorm/src';
import { contentError } from '../taon-cms-content/taon-cms-content.validation';

import { TaonCmsCategoryEntity } from './taon-cms-category.entity';
//#endregion

@TaonRepository({
  className: 'TaonCmsCategoryRepository',
})
export class TaonCmsCategoryRepository extends TaonBaseRepository<TaonCmsCategoryEntity> {
  entityClassResolveFn: () => typeof TaonCmsCategoryEntity = () =>
    TaonCmsCategoryEntity;

  async requireCategory(id: number, manager: EntityManager): Promise<void> {
    //#region @websqlFunc
    const category = await manager
      .getRepository<TaonCmsCategoryEntity>(this.target)
      .findOneBy({ id });
    if (!category) {
      contentError(`Category ${id} does not exist.`, 404);
    }
    //#endregion
  }
}
