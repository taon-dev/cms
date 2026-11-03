import {
  Column,
  CreateDateColumn,
  Index,
  PrimaryGeneratedColumn,
  TaonBaseEntity,
  TaonEntity,
} from 'taon/src';

@TaonEntity({
  className: 'TaonCmsCommentBlockedPhraseEntity',
  createTable: true,
})
//#region @websql
@Index(['normalizedPhrase'], { unique: true })
//#endregion
export class TaonCmsCommentBlockedPhraseEntity extends TaonBaseEntity<TaonCmsCommentBlockedPhraseEntity> {
  //#region @websql
  @PrimaryGeneratedColumn()
  //#endregion
  id!: number;

  //#region @websql
  @Column({ type: 'varchar', length: 500 })
  //#endregion
  phrase!: string;

  //#region @websql
  @Column({ type: 'varchar', length: 500 })
  //#endregion
  normalizedPhrase!: string;

  //#region @websql
  @CreateDateColumn()
  //#endregion
  createdAt!: Date;
}
