//#region imports
import { TaonBaseRepository, TaonRepository } from 'taon/src';
import { Raw } from 'taon-typeorm/src';
import type { EntityManager } from 'taon-typeorm/src';
import { Translation } from '@taon-dev/i18n/src';
import { Taon } from 'taon/src';
import { contentError } from '../taon-cms-content/taon-cms-content.validation';
import { requireContentId } from '../taon-cms-content/taon-cms-content.validation';
import { TaonCmsContentTagEntity } from '../taon-cms-content-tag/taon-cms-content-tag.entity';
import {
  TaonCmsTaxonomyFields,
  validateTaxonomy,
} from '../taon-cms-category/taon-cms-taxonomy.validation';

import { TaonCmsTagEntity } from './taon-cms-tag.entity';
//#endregion

const t = Translation.for(Taon.__FILE_RELATIVE_PATH, Taon.LANG_IMPORT_MAP);

@TaonRepository({
  className: 'TaonCmsTagRepository',
})
export class TaonCmsTagRepository extends TaonBaseRepository<TaonCmsTagEntity> {
  entityClassResolveFn: () => typeof TaonCmsTagEntity = () => TaonCmsTagEntity;

  async saveTag(
    id: number | null,
    input: TaonCmsTaxonomyFields,
  ): Promise<TaonCmsTagEntity> {
    //#region @websqlFunc
    validateTaxonomy(input);
    if (id !== null) {
      requireContentId(id);
    }
    return this.connection.transaction('SERIALIZABLE', async manager => {
      const repository = manager.getRepository(TaonCmsTagEntity);
      if (id !== null) {
        await this.requireTags([id], manager);
      }
      const name = input.name.trim();
      const slug = input.slug.trim();
      const existing = await repository.find({ where: [{ name }, { slug }] });
      if (existing.some(tag => tag.id !== id)) {
        contentError(
          t.gettext('This tag name or slug is already in use.'),
          409,
        );
      }
      return repository.save(
        repository.create({
          ...(id === null ? {} : { id }),
          name,
          slug,
          description: input.description,
        }),
      );
    });
    //#endregion
  }

  async deleteTag(id: number): Promise<void> {
    //#region @websqlFunc
    requireContentId(id);
    await this.connection.transaction('SERIALIZABLE', async manager => {
      await this.requireTags([id], manager);
      if (
        await manager
          .getRepository(TaonCmsContentTagEntity)
          .countBy({ tagId: id })
      ) {
        contentError(
          t.gettext('Remove this tag from posts before deleting it.'),
          409,
        );
      }
      await manager.getRepository(TaonCmsTagEntity).delete(id);
    });
    //#endregion
  }

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
