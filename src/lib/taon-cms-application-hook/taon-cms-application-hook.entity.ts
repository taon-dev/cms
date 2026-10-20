import {
  Column,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  TaonBaseEntity,
  TaonEntity,
} from 'taon/src';

import type { TaonCmsApplicationHook } from '../taon-cms-application-hooks';
import { TaonCmsContentEntity } from '../taon-cms-content/taon-cms-content.entity';

@TaonEntity({
  className: 'TaonCmsApplicationHookEntity',
  createTable: true,
})
export class TaonCmsApplicationHookEntity extends TaonBaseEntity<TaonCmsApplicationHookEntity> {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', unique: true })
  hook: TaonCmsApplicationHook;

  @Column({ type: 'integer', nullable: true, unique: true })
  contentId: number | null;

  @OneToOne(
    () => TaonCmsContentEntity,
    content => content.applicationHook,
    { nullable: true, onDelete: 'SET NULL' },
  )
  @JoinColumn({ name: 'contentId', referencedColumnName: 'id' })
  content: TaonCmsContentEntity | null;
}
