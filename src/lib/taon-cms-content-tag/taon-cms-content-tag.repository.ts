//#region imports
import { TaonBaseRepository, TaonRepository } from 'taon/src';
import { Raw } from 'taon-typeorm/src';
import type { EntityManager } from 'taon-typeorm/src';

import { TaonCmsContentTagEntity } from './taon-cms-content-tag.entity';
//#endregion

@TaonRepository({
  className: 'TaonCmsContentTagRepository',
})
export class TaonCmsContentTagRepository extends TaonBaseRepository<TaonCmsContentTagEntity> {
  entityClassResolveFn: () => typeof TaonCmsContentTagEntity = () =>
    TaonCmsContentTagEntity;

  async findTagIds(
    contentId: number,
    manager: EntityManager,
  ): Promise<number[]> {
    //#region @websqlFunc
    const links = await manager
      .getRepository<TaonCmsContentTagEntity>(this.target)
      .find({ where: { contentId }, order: { tagId: 'ASC' } });
    return links.map(link => link.tagId);
    //#endregion
  }

  async replaceTags(
    contentId: number,
    tagIds: number[],
    manager: EntityManager,
  ): Promise<void> {
    //#region @websqlFunc
    const repository = manager.getRepository<TaonCmsContentTagEntity>(
      this.target,
    );
    await repository.delete({ contentId });
    const links = [...new Set(tagIds)].map(tagId =>
      repository.create({ contentId, tagId }),
    );
    if (links.length) {
      await repository.save(links);
    }
    //#endregion
  }
}
