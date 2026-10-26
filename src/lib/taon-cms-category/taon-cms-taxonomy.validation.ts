import { Translation } from '@taon-dev/i18n/src';
import { Taon } from 'taon/src';

import { contentError } from '../taon-cms-content/taon-cms-content.validation';

const t = Translation.for(Taon.__FILE_RELATIVE_PATH, Taon.LANG_IMPORT_MAP);

export interface TaonCmsTaxonomyFields {
  name: string;
  slug: string;
  description: string | null;
}

export interface TaonCmsCategoryFields extends TaonCmsTaxonomyFields {
  parentCategoryId: number | null;
  sortOrder: number;
}

export function validateTaxonomy(input: TaonCmsTaxonomyFields): void {
  if (
    !input ||
    typeof input.name !== 'string' ||
    !input.name.trim() ||
    typeof input.slug !== 'string' ||
    !input.slug.trim() ||
    (input.description !== null && typeof input.description !== 'string')
  ) {
    contentError(
      t.gettext('Name, slug, and a valid description are required.'),
    );
  }
}

export function validateCategoryHierarchy(
  id: number | null,
  parentId: number | null,
  categories: { id: number; parentCategoryId: number | null }[],
): void {
  const visited = new Set<number>();
  if (id !== null) {
    visited.add(id);
  }
  let current = parentId;
  while (current !== null) {
    if (visited.has(current)) {
      contentError(t.gettext('A category cannot be its own ancestor.'));
    }
    visited.add(current);
    const parent = categories.find(category => category.id === current);
    if (!parent) {
      contentError(t.gettext('The parent category does not exist.'));
    }
    current = parent.parentCategoryId;
  }
}
