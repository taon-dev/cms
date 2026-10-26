//#region imports
import { TaonBaseRepository, TaonRepository } from 'taon/src';
import { Raw } from 'taon-typeorm/src';
import { Translation } from '@taon-dev/i18n/src';
import { Taon } from 'taon/src';
import type { EntityManager } from 'taon-typeorm/src';
import { contentError } from '../taon-cms-content/taon-cms-content.validation';

import { TaonCmsCategoryEntity } from './taon-cms-category.entity';
import { TaonCmsContentEntity } from '../taon-cms-content/taon-cms-content.entity';
import { requireContentId } from '../taon-cms-content/taon-cms-content.validation';
import {
  TaonCmsCategoryFields,
  validateCategoryHierarchy,
  validateTaxonomy,
} from './taon-cms-taxonomy.validation';
//#endregion

const t = Translation.for(Taon.__FILE_RELATIVE_PATH, Taon.LANG_IMPORT_MAP);

@TaonRepository({
  className: 'TaonCmsCategoryRepository',
})
export class TaonCmsCategoryRepository extends TaonBaseRepository<TaonCmsCategoryEntity> {
  entityClassResolveFn: () => typeof TaonCmsCategoryEntity = () =>
    TaonCmsCategoryEntity;

  async saveCategory(
    id: number | null,
    input: TaonCmsCategoryFields,
  ): Promise<TaonCmsCategoryEntity> {
    //#region @websqlFunc
    validateTaxonomy(input);
    if (!Number.isSafeInteger(input.sortOrder)) {
      contentError(t.gettext('Sort order must be an integer.'));
    }
    if (id !== null) {
      requireContentId(id);
    }
    if (input.parentCategoryId !== null) {
      requireContentId(input.parentCategoryId);
    }
    return this.connection.transaction('SERIALIZABLE', async manager => {
      const repository = manager.getRepository(TaonCmsCategoryEntity);
      if (id !== null) {
        await this.requireCategory(id, manager);
      }
      validateCategoryHierarchy(
        id,
        input.parentCategoryId,
        await repository.find(),
      );
      const slug = input.slug.trim();
      const existing = await repository.findOneBy({ slug });
      if (existing && existing.id !== id) {
        contentError(t.gettext('This category slug is already in use.'), 409);
      }
      return repository.save(
        repository.create({
          ...(id === null ? {} : { id }),
          name: input.name.trim(),
          slug,
          description: input.description,
          sortOrder: input.sortOrder,
          parentCategoryId: input.parentCategoryId,
        }),
      );
    });
    //#endregion
  }

  async deleteCategory(id: number): Promise<void> {
    //#region @websqlFunc
    requireContentId(id);
    await this.connection.transaction('SERIALIZABLE', async manager => {
      await this.requireCategory(id, manager);
      const children = await manager
        .getRepository(TaonCmsCategoryEntity)
        .countBy({ parentCategoryId: id });
      const posts = await manager
        .getRepository(TaonCmsContentEntity)
        .countBy({ categoryId: id });
      if (children || posts) {
        contentError(
          t.gettext(
            'Reassign child categories and posts before deleting this category.',
          ),
          409,
        );
      }
      await manager.getRepository(TaonCmsCategoryEntity).delete(id);
    });
    //#endregion
  }

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
