import type { TaonCmsContentEntity } from './taon-cms-content.entity';
import { TaonCmsContentType } from './taon-cms-content.models';

export const TaonCmsContentDefaultsValues = {
  description: '',
  version: 0,
  id: void 0,
  type: TaonCmsContentType.Normal,
  videoKey: null,
  audioKey: null,
  attachmentKey: null,
  thumbnailKey: null,
} as Partial<TaonCmsContentEntity>;
