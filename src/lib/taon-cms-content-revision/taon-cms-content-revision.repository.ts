//#region imports
import { TaonBaseRepository, TaonRepository } from 'taon/src';
import { Raw } from 'taon-typeorm/src';
import type { EntityManager } from 'taon-typeorm/src';

import type { TaonCmsContentEntity } from '../taon-cms-content/taon-cms-content.entity';
import type { TaonCmsContentSnapshot } from '../taon-cms-content/taon-cms-content.models';
import { contentError } from '../taon-cms-content/taon-cms-content.validation';

import { TaonCmsContentRevisionEntity } from './taon-cms-content-revision.entity';
//#endregion

@TaonRepository({
  className: 'TaonCmsContentRevisionRepository',
})
export class TaonCmsContentRevisionRepository extends TaonBaseRepository<TaonCmsContentRevisionEntity> {
  entityClassResolveFn: () => typeof TaonCmsContentRevisionEntity = () =>
    TaonCmsContentRevisionEntity;

  async listForContent(
    contentId: number,
    manager: EntityManager,
  ): Promise<TaonCmsContentRevisionEntity[]> {
    //#region @websqlFunc
    return manager
      .getRepository<TaonCmsContentRevisionEntity>(this.target)
      .find({
        where: { contentId },
        order: { revisionNumber: 'DESC' },
      });
    //#endregion
  }

  async requireRevision(
    contentId: number,
    revisionNumber: number,
    manager: EntityManager,
  ): Promise<TaonCmsContentRevisionEntity> {
    //#region @websqlFunc
    const revision = await manager
      .getRepository<TaonCmsContentRevisionEntity>(this.target)
      .findOneBy({ contentId, revisionNumber });
    if (!revision) {
      contentError(
        `Revision ${revisionNumber} of content ${contentId} does not exist.`,
        404,
      );
    }
    return revision;
    //#endregion
  }

  async recordContent(
    content: TaonCmsContentEntity,
    snapshot: TaonCmsContentSnapshot,
    manager: EntityManager,
  ): Promise<TaonCmsContentRevisionEntity> {
    //#region @websqlFunc
    const repository = manager.getRepository<TaonCmsContentRevisionEntity>(
      this.target,
    );
    return repository.save(
      repository.create({
        contentId: content.id,
        revisionNumber: content.version,
        version: 1,
        title: content.title,
        body: content.body,
        snapshot,
        createdByUserId: content.authorUserId,
        createdAt: new Date(),
      }),
    );
    //#endregion
  }
}
