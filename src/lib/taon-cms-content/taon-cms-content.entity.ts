//#region imports
import {
  Column,
  CustomColumn,
  PrimaryGeneratedColumn,
  Taon,
  TaonBaseAbstractEntity,
  TaonBaseEntity,
  TaonEntity,
} from 'taon/src';
import { _ } from 'tnp-core/src';

import { TaonCmsContentDefaultsValues } from './taon-cms-content.constants';
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
  @Column({ type: 'varchar' })
  //#endregion
  type: string;
  // article | video | audio | page | file

  //#region @websql
  @Column({ type: 'varchar' })
  //#endregion
  title: string;

  //#region @websql
  @Column({ type: 'varchar', unique: true })
  //#endregion
  slug: string;

  //#region @websql
  @Column({ type: 'text', nullable: true })
  //#endregion
  excerpt: string | null;

  //#region @websql
  @Column({ type: 'text', nullable: true })
  //#endregion
  body: string | null;

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
