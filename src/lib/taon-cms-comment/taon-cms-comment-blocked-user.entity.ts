import {
  Column,
  CreateDateColumn,
  Index,
  PrimaryGeneratedColumn,
  TaonBaseEntity,
  TaonEntity,
} from 'taon/src';

@TaonEntity({
  className: 'TaonCmsCommentBlockedUserEntity',
  createTable: true,
})
//#region @websql
@Index(['userId'], { unique: true })
//#endregion
export class TaonCmsCommentBlockedUserEntity extends TaonBaseEntity<TaonCmsCommentBlockedUserEntity> {
  //#region @websql
  @PrimaryGeneratedColumn()
  //#endregion
  id!: number;

  //#region @websql
  @Column({ type: 'integer' })
  //#endregion
  userId!: number;

  //#region @websql
  @CreateDateColumn()
  //#endregion
  createdAt!: Date;
}
