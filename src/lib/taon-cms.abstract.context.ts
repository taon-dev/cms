// THIS FILE IS GENERATED - DO NOT MODIFY
import { createContext, TaonBaseContext } from 'taon/src';
import { TaonCmsCategoryAbstractContext } from './taon-cms-category/taon-cms-category.abstract.context';
import { TaonCmsCommentAbstractContext } from './taon-cms-comment/taon-cms-comment.abstract.context';
import { TaonCmsContentAbstractContext } from './taon-cms-content/taon-cms-content.abstract.context';
import { TaonCmsContentAssetAbstractContext } from './taon-cms-content-asset/taon-cms-content-asset.abstract.context';
import { TaonCmsContentPermissionAbstractContext } from './taon-cms-content-permission/taon-cms-content-permission.abstract.context';
import { TaonCmsContentRevisionAbstractContext } from './taon-cms-content-revision/taon-cms-content-revision.abstract.context';
import { TaonCmsContentTagAbstractContext } from './taon-cms-content-tag/taon-cms-content-tag.abstract.context';
import { TaonCmsTagAbstractContext } from './taon-cms-tag/taon-cms-tag.abstract.context';

export const TaonCmsAbstractContext = createContext(() => ({
  contextName: 'TaonCmsAbstractContext',
  abstract: true,
  contexts: {
    TaonCmsCategoryAbstractContext,
    TaonCmsCommentAbstractContext,
    TaonCmsContentAbstractContext,
    TaonCmsContentAssetAbstractContext,
    TaonCmsContentPermissionAbstractContext,
    TaonCmsContentRevisionAbstractContext,
    TaonCmsContentTagAbstractContext,
    TaonCmsTagAbstractContext,
  },
}));

// THIS FILE IS GENERATED - DO NOT MODIFY
