import { TaonPermissionEntity } from '@taon-dev/session/src';
import type { TaonCmsContentEntity } from './taon-cms-content.entity';

export enum TaonCmsContentType {
  Normal = 'normal',
  Video = 'video',
  Audio = 'audio',
  Attachment = 'attachment',
  JsonTable = 'json-table',
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
  thumbnailKey: string | null;
  excerpt: string | null;
  categoryId: number | null;
  authorUserId: number | null;
  status: 'draft' | 'published' | 'archived';
  publishedAt: Date | null;
  applyPermissionsToRelatedPosts: boolean;
  applyVisibilityToRelatedPosts: boolean;
}

export interface TaonCmsPermissionConfiguration {
  permissions: TaonPermissionEntity[];
  source: { id: number; title: string } | null;
}

export interface TaonCmsVisibilityConfiguration {
  status: TaonCmsContentFields['status'];
  source: { id: number; title: string } | null;
}

export type TaonCmsPostVersionKind = 'public' | 'private';

export interface TaonCmsPostVersionLinks {
  publicVersionPost: TaonCmsContentEntity | null;
  privateVersionPost: TaonCmsContentEntity | null;
}

export interface TaonCmsCreateContent
  extends
    Pick<TaonCmsContentFields, 'title' | 'slug'>,
    Partial<Omit<TaonCmsContentFields, 'title' | 'slug'>> {
  tagIds?: number[];
  relatedPostIds?: number[];
  permissionIds?: number[];
  applicationHook?: TaonCmsApplicationHook | null;
}

export interface TaonCmsCreateRelatedChildInput {
  titlePrefix: string;
  expectedTitle: string;
  fileName: string;
  mimeType: string;
  sourceKey: string;
  type: TaonCmsContentType;
  body: string | null;
  videoKey: string | null;
  audioKey: string | null;
  attachmentKey: string | null;
  thumbnailKey: string;
}

export interface TaonCmsCreateRelatedChildResult {
  child: TaonCmsContentEntity;
  parentVersion: number;
}

export interface TaonCmsPublicVideoChild {
  slug: string;
  title: string;
  excerpt: string | null;
  videoUrl: string;
  posterUrl: string;
}

export interface TaonCmsUpdateContent extends Partial<TaonCmsContentFields> {
  tagIds?: number[];
  relatedPostIds?: number[];
  permissionIds?: number[];
  applicationHook?: TaonCmsApplicationHook | null;
  expectedVersion: number;
}

export interface TaonCmsRestoreContent {
  revisionNumber: number;
  expectedVersion: number;
}

export interface TaonCmsContentSnapshot extends TaonCmsContentFields {
  tagIds: number[];
  relatedPostIds?: number[];
  relatedPostOrderSaved?: boolean;
  permissionIds: number[];
}
import type { TaonCmsApplicationHook } from '../taon-cms-application-hooks';
