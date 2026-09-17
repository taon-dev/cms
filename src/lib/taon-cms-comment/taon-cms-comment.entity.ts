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

import { TaonCmsCommentDefaultsValues } from './taon-cms-comment.constants';
//#endregion

@TaonEntity({
  className: 'TaonCmsCommentEntity',
  createTable: true,
})
export class TaonCmsCommentEntity extends TaonBaseEntity<TaonCmsCommentEntity> {
  //#region @websql
  @PrimaryGeneratedColumn()
  //#endregion
  id: number;

  //#region @websql
  @Column({ type: 'integer', default: 0 })
  //#endregion
  version: number;

  //#region @websql
  @Column({ type: 'integer' })
  //#endregion
  contentId: number;

  //#region @websql
  @Column({ type: 'integer', nullable: true })
  //#endregion
  parentCommentId: number | null;

  //#region @websql
  @Column({ type: 'integer', nullable: true })
  //#endregion
  userId: number | null;

  //#region @websql
  @Column({ type: 'text' })
  //#endregion
  body: string;

  //#region @websql
  @Column({ type: 'varchar', default: 'published' })
  //#endregion
  status: string;

  //#region @websql
  @Column({ type: 'datetime' })
  //#endregion
  createdAt: Date;

  //#region @websql
  @Column({ type: 'datetime' })
  //#endregion
  updatedAt: Date;
}
