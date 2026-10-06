export enum TaonCmsContentType {
  Normal = 'normal',
  Video = 'video',
  Audio = 'audio',
  Attachment = 'attachment',
}

export enum TaonCmsContentState {
  Active = 'active',
  Inactive = 'inactive',
}

export interface TaonCmsContentFields {
  type: TaonCmsContentType;
  title: string;
  slug: string;
  body: string | null;
  videoKey: string | null;
  audioKey: string | null;
  attachmentKey: string | null;
  excerpt: string | null;
  categoryId: number | null;
  authorUserId: number | null;
  status: 'draft' | 'published' | 'archived';
  publishedAt: Date | null;
}

export interface TaonCmsCreateContent
  extends
    Pick<TaonCmsContentFields, 'title' | 'slug'>,
    Partial<Omit<TaonCmsContentFields, 'title' | 'slug'>> {
  tagIds?: number[];
  relatedPostIds?: number[];
}

export interface TaonCmsUpdateContent extends Partial<TaonCmsContentFields> {
  tagIds?: number[];
  relatedPostIds?: number[];
  expectedVersion: number;
}

export interface TaonCmsRestoreContent {
  revisionNumber: number;
  expectedVersion: number;
}

export interface TaonCmsContentSnapshot extends TaonCmsContentFields {
  tagIds: number[];
  relatedPostIds?: number[];
}
