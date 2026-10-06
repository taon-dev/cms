export type TaonCmsPostMode = 'view' | 'edit' | 'add' | 'view-clean';

export interface TaonCmsPostDraft extends Pick<
  TaonCmsContentFields, 'type' | 'videoKey' | 'audioKey' | 'attachmentKey'
> {
  title: string;
  slug: string;
  excerpt: string;
  body: string;
}
import type { TaonCmsContentFields } from '../../taon-cms-content/taon-cms-content.models';
