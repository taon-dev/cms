//#region imports
import {
  Column,
  JoinTable,
  ManyToMany,
  CustomColumn,
  PrimaryGeneratedColumn,
  Taon,
  TaonBaseAbstractEntity,
  TaonBaseEntity,
  TaonEntity,
} from 'taon/src';
import { _ } from 'tnp-core/src';

import { TaonCmsContentDefaultsValues } from './taon-cms-content.constants';
import { TaonCmsContentType } from './taon-cms-content.models';
//#endregion

@TaonEntity({
  className: 'TaonCmsContentEntity',
  createTable: true,
})
export class TaonCmsContentEntity extends TaonBaseEntity<TaonCmsContentEntity> {
  //#region @websql
  @PrimaryGeneratedColumn()
  //#endregion
  id: number;

  //#region @websql
  @Column({ type: 'integer', default: 0 })
  //#endregion
  version: number;

  //#region @websql
  @Column({ type: 'varchar', default: TaonCmsContentType.Normal })
  //#endregion
  type: TaonCmsContentType = TaonCmsContentType.Normal;

  //#region @websql
  @Column({ type: 'varchar' })
  //#endregion
  title: string;

  //#region @websql
  @Column({ type: 'varchar', unique: true })
  //#endregion
  slug: string;

  //#region @websql
  @ManyToMany(() => TaonCmsContentEntity)
  @JoinTable({
    name: 'taon_cms_related_posts',
    joinColumn: { name: 'contentId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'relatedPostId', referencedColumnName: 'id' },
  })
  //#endregion
  relatedPosts: TaonCmsContentEntity[];

  //#region @websql
  @Column({ type: 'text', nullable: true })
  //#endregion
  excerpt: string | null;

  //#region @websql
  @Column({ type: 'text', nullable: true })
  //#endregion
  body: string | null;

  //#region @websql
  @Column({ type: 'varchar', nullable: true })
  //#endregion
  videoKey: string | null = null;

  //#region @websql
  @Column({ type: 'varchar', nullable: true })
  //#endregion
  audioKey: string | null = null;

  //#region @websql
  @Column({ type: 'varchar', nullable: true })
  //#endregion
  attachmentKey: string | null = null;

  //#region @websql
  @Column({ type: 'integer', nullable: true })
  //#endregion
  categoryId: number | null;

  //#region @websql
  @Column({ type: 'integer', nullable: true })
  //#endregion
  authorUserId: number | null;

  //#region @websql
  @Column({ type: 'varchar', default: 'draft' })
  //#endregion
  status: string;
  // draft | published | archived

  //#region @websql
  @Column({ type: 'datetime', nullable: true })
  //#endregion
  publishedAt: Date | null;

  //#region @websql
  @Column({ type: 'datetime' })
  //#endregion
  createdAt: Date;

  //#region @websql
  @Column({ type: 'datetime' })
  //#endregion
  updatedAt: Date;
}
