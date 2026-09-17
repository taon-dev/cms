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

import { TaonCmsContentAssetDefaultsValues } from './taon-cms-content-asset.constants';
//#endregion

@TaonEntity({
  className: 'TaonCmsContentAssetEntity',
  createTable: true,
})
export class TaonCmsContentAssetEntity extends TaonBaseEntity<TaonCmsContentAssetEntity> {
  //#region @websql
  @PrimaryGeneratedColumn()
  //#endregion
  id: number;

  //#region @websql
  @Column({ type: 'integer', default: 0 })
  //#endregion
  version: number;

  //#region @websql
  @Column({ type: 'integer', nullable: true })
  //#endregion
  contentId: number | null;

  //#region @websql
  @Column({ type: 'varchar' })
  //#endregion
  type: string;
  // image | video | audio | file

  //#region @websql
  @Column({ type: 'varchar' })
  //#endregion
  storageProvider: string;
  // r2 | filesystem | s3

  //#region @websql
  @Column({ type: 'varchar', nullable: true })
  //#endregion
  bucket: string | null;

  //#region @websql
  @Column({ type: 'varchar' })
  //#endregion
  key: string;

  //#region @websql
  @Column({ type: 'varchar', nullable: true })
  //#endregion
  originalFilename: string | null;

  //#region @websql
  @Column({ type: 'varchar', nullable: true })
  //#endregion
  mimeType: string | null;

  //#region @websql
  @Column({ type: 'integer', nullable: true })
  //#endregion
  size: number | null;

  //#region @websql
  @Column({ type: 'integer', nullable: true })
  //#endregion
  durationSeconds: number | null;

  //#region @websql
  @Column({ type: 'simple-json', nullable: true })
  //#endregion
  metadata: Record<string, any> | null;

  //#region @websql
  @Column({ type: 'datetime' })
  //#endregion
  createdAt: Date;
}
