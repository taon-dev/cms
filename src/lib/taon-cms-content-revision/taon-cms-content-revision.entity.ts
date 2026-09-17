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

import { TaonCmsContentRevisionDefaultsValues } from './taon-cms-content-revision.constants';
//#endregion

@TaonEntity({
  className: 'TaonCmsContentRevisionEntity',
  createTable: true,
})
export class TaonCmsContentRevisionEntity extends TaonBaseEntity<TaonCmsContentRevisionEntity> {
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
  @Column({ type: 'integer' })
  //#endregion
  revisionNumber: number;

  //#region @websql
  @Column({ type: 'varchar' })
  //#endregion
  title: string;

  //#region @websql
  @Column({ type: 'text', nullable: true })
  //#endregion
  body: string | null;

  //#region @websql
  @Column({ type: 'integer', nullable: true })
  //#endregion
  createdByUserId: number | null;

  //#region @websql
  @Column({ type: 'datetime' })
  //#endregion
  createdAt: Date;
}
