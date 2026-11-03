import {
  Column,
  CreateDateColumn,
  Index,
  PrimaryGeneratedColumn,
  TaonBaseEntity,
  TaonEntity,
} from 'taon/src';

@TaonEntity({
  className: 'TaonCmsCommentSpamReportEntity',
  createTable: true,
})
//#region @websql
@Index(['commentId', 'userId'], { unique: true })
//#endregion
export class TaonCmsCommentSpamReportEntity extends TaonBaseEntity<TaonCmsCommentSpamReportEntity> {
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
  @CreateDateColumn()
  //#endregion
  createdAt!: Date;
}
