//#region imports
import {
  Column,
  CustomColumn,
  Taon,
  TaonBaseAbstractEntity,
  TaonEntity,
} from 'taon/src';
import { _ } from 'tnp-core/src';

import { TaonCmsCategoryDefaultsValues } from './taon-cms-category.constants';
//#endregion

@TaonEntity({
  className: 'TaonCmsCategoryEntity',
  createTable: true,
})
export class TaonCmsCategoryEntity extends TaonBaseAbstractEntity<TaonCmsCategoryEntity> {
  //#region @websql
  @Column({ type: 'integer', nullable: true })
  //#endregion
  parentCategoryId: number | null;

  //#region @websql
  @Column({ type: 'varchar' })
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

  //#region @websql
  @Column({ type: 'integer', default: 0 })
  //#endregion
  sortOrder: number;
}
