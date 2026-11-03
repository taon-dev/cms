import {
  Column,
  CreateDateColumn,
  Index,
  PrimaryGeneratedColumn,
  TaonBaseEntity,
  TaonEntity,
} from 'taon/src';

@TaonEntity({
  className: 'TaonCmsCommentVoteEntity',
  createTable: true,
})
//#region @websql
@Index(['commentId', 'userId'], { unique: true })
//#endregion
export class TaonCmsCommentVoteEntity extends TaonBaseEntity<TaonCmsCommentVoteEntity> {
  //#region @websql
  @PrimaryGeneratedColumn()
  //#endregion
  id!: number;

  //#region @websql
  @Column({ type: 'integer' })
  //#endregion
  commentId!: number;

  //#region @websql
  @Column({ type: 'integer' })
  //#endregion
  userId!: number;

  //#region @websql
  @Column({ type: 'integer' })
  //#endregion
  value!: -1 | 1;

  //#region @websql
  @CreateDateColumn()
  //#endregion
  createdAt!: Date;
}
