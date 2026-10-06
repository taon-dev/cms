//#region imports
import { TaonBaseRepository, TaonRepository } from 'taon/src';
import { Raw } from 'taon-typeorm/src';
import type { EntityManager } from 'taon-typeorm/src';
import { contentError } from '../taon-cms-content/taon-cms-content.validation';

import { TaonCmsTagEntity } from './taon-cms-tag.entity';
//#endregion

@TaonRepository({
  className: 'TaonCmsTagRepository',
})
export class TaonCmsTagRepository extends TaonBaseRepository<TaonCmsTagEntity> {
  entityClassResolveFn: () => typeof TaonCmsTagEntity = () => TaonCmsTagEntity;

  async requireTags(ids: number[], manager: EntityManager): Promise<void> {
    //#region @websqlFunc
    for (const id of new Set(ids)) {
      const tag = await manager
        .getRepository<TaonCmsTagEntity>(this.target)
        .findOneBy({ id });
      if (!tag) {
        contentError(`Tag ${id} does not exist.`, 404);
      }
    }
    //#endregion
  }

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
