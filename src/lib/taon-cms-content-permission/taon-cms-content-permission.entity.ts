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

import { TaonCmsContentPermissionDefaultsValues } from './taon-cms-content-permission.constants';
//#endregion

@TaonEntity({
  className: 'TaonCmsContentPermissionEntity',
  createTable: true,
})
export class TaonCmsContentPermissionEntity extends TaonBaseEntity<TaonCmsContentPermissionEntity> {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer', default: 0 })
  version: number;

  @Column({ type: 'integer' })
  contentId: number;

  @Column({ type: 'varchar' })
  type: string;
  // public | authenticated | permission | role |
  // purchase | subscription

  @Column({ type: 'integer', nullable: true })
  permissionId: number | null;

  @Column({ type: 'integer', nullable: true })
  roleId: number | null;

  @Column({ type: 'integer', nullable: true })
  productId: number | null;

  @Column({ type: 'varchar', nullable: true })
  stripePriceId: string | null;

  @Column({ type: 'simple-json', nullable: true })
  config: Record<string, any> | null;

  @Column({ type: 'datetime' })
  createdAt: Date;
}
