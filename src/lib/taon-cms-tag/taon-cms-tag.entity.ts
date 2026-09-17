//#region imports
import {
  Column,
  CustomColumn,
  Taon,
  TaonBaseAbstractEntity,
  TaonEntity,
} from 'taon/src';
import { _ } from 'tnp-core/src';

import { TaonCmsTagDefaultsValues } from './taon-cms-tag.constants';
//#endregion

@TaonEntity({
  className: 'TaonCmsTagEntity',
  createTable: true,
})
export class TaonCmsTagEntity extends TaonBaseAbstractEntity<TaonCmsTagEntity> {
  //#region @websql
  @Column({ type: 'varchar', unique: true })
  //#endregion
  name: string;

  //#region @websql
  @Column({ type: 'varchar', unique: true })
  //#endregion
  slug: string;

  //#region @websql
  @Column({ type: 'varchar', nullable: true })
  //#endregion
  description: string | null;
}
