export type TaonCmsPostMode = 'view' | 'edit' | 'add' | 'view-clean';

export interface TaonCmsPostDraft {
  title: string;
  slug: string;
  excerpt: string;
  body: string;
}