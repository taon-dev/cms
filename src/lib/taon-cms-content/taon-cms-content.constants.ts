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

/**
 * Strict maximum size of a single CMS media upload (1 GB).
 */
export const TAON_CMS_MAX_UPLOAD_BYTES = 1_000_000_000;
