//@ts-nocheck
export * from './migrations_index._auto-generated_';
export * from './1792579000000_postPermissionInheritance';
export * from './1793043000000_postThumbnails';

import { MIGRATIONS_CLASSES_FOR_CmsContext as generatedMigrations } from './migrations_index._auto-generated_';
import { CmsContext_1792579000000_postPermissionInheritance } from './1792579000000_postPermissionInheritance';
import { CmsContext_1793043000000_postThumbnails } from './1793043000000_postThumbnails';

export const MIGRATIONS_CLASSES_FOR_CmsContext = {
  ...generatedMigrations,
  CmsContext_1792579000000_postPermissionInheritance,
  CmsContext_1793043000000_postThumbnails,
};
