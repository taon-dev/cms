//#region imports
import {
  Column,
  CustomColumn,
  Taon,
  TaonBaseAbstractEntity,
  TaonEntity,
} from 'taon/src';
import { _ } from 'tnp-core/src';

import { TaonCmsContentTagDefaultsValues } from './taon-cms-content-tag.constants';
//#endregion

@TaonEntity({
  className: 'TaonCmsContentTagEntity',
  createTable: true,
})
export class TaonCmsContentTagEntity extends TaonBaseAbstractEntity<TaonCmsContentTagEntity> {
  //#region @websql
  @Column({ type: 'integer' })
  //#endregion
  contentId: number;

  //#region @websql
  @Column({ type: 'integer' })
  //#endregion
  tagId: number;
}
