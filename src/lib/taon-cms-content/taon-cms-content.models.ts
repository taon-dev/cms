export enum TaonCmsContentState {
  Active = 'active',
  Inactive = 'inactive',
}

export interface TaonCmsContentFields {
  type: string;
  title: string;
  slug: string;
  body: string | null;
  excerpt: string | null;
  categoryId: number | null;
  authorUserId: number | null;
  status: 'draft' | 'published' | 'archived';
  publishedAt: Date | null;
}

export interface TaonCmsCreateContent
  extends
    Pick<TaonCmsContentFields, 'type' | 'title' | 'slug'>,
    Partial<Omit<TaonCmsContentFields, 'type' | 'title' | 'slug'>> {
  tagIds?: number[];
}

export interface TaonCmsUpdateContent extends Partial<TaonCmsContentFields> {
  tagIds?: number[];
  expectedVersion: number;
}

export interface TaonCmsRestoreContent {
  revisionNumber: number;
  expectedVersion: number;
}

export interface TaonCmsContentSnapshot extends TaonCmsContentFields {
  tagIds: number[];
}
