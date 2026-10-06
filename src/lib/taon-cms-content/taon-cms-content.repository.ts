//#region imports
import { TaonBaseRepository, TaonRepository } from 'taon/src';
import { Raw } from 'taon-typeorm/src';
import type { EntityManager } from 'taon-typeorm/src';

import { TaonCmsCategoryRepository } from '../taon-cms-category/taon-cms-category.repository';
import type { TaonCmsContentRevisionEntity } from '../taon-cms-content-revision/taon-cms-content-revision.entity';
import { TaonCmsContentRevisionRepository } from '../taon-cms-content-revision/taon-cms-content-revision.repository';
import { TaonCmsContentTagRepository } from '../taon-cms-content-tag/taon-cms-content-tag.repository';
import { TaonCmsTagRepository } from '../taon-cms-tag/taon-cms-tag.repository';

import { TaonCmsContentEntity } from './taon-cms-content.entity';
import type {
  TaonCmsContentFields,
  TaonCmsContentSnapshot,
  TaonCmsCreateContent,
  TaonCmsRestoreContent,
  TaonCmsUpdateContent,
} from './taon-cms-content.models';
import {
  contentError,
  requireContentId,
  requireContentVersion,
  validateContentInput,
} from './taon-cms-content.validation';
//#endregion

@TaonRepository({
  className: 'TaonCmsContentRepository',
})
export class TaonCmsContentRepository extends TaonBaseRepository<TaonCmsContentEntity> {
  entityClassResolveFn: () => typeof TaonCmsContentEntity = () =>
    TaonCmsContentEntity;

  private readonly taonCmsContentRevisionRepository = this.injectCustomRepo(
    TaonCmsContentRevisionRepository,
  );

  private readonly taonCmsContentTagRepository = this.injectCustomRepo(
    TaonCmsContentTagRepository,
  );

  private readonly taonCmsCategoryRepository = this.injectCustomRepo(
    TaonCmsCategoryRepository,
  );

  private readonly tags = this.injectCustomRepo(TaonCmsTagRepository);

  async createContent(
    input: TaonCmsCreateContent,
  ): Promise<TaonCmsContentEntity> {
    //#region @websqlFunc
    validateContentInput(input, true);
    return this.connection.transaction(async manager => {
      const fields = this.contentFields(input);
      const tagIds = [...new Set(input.tagIds ?? [])];
      await this.validateReferences(fields, tagIds, manager);
      await this.requireAvailableSlug(fields.slug, manager);
      const repository = manager.getRepository<TaonCmsContentEntity>(
        this.target,
      );
      const now = new Date();
      const content = await repository.save(
        repository.create({
          ...fields,
          version: 1,
          createdAt: now,
          updatedAt: now,
        }),
      );
      await this.taonCmsContentTagRepository.replaceTags(content.id, tagIds, manager);
      await this.taonCmsContentRevisionRepository.recordContent(
        content,
        { ...fields, tagIds },
        manager,
      );
      return content;
    });
    //#endregion
  }

  async updateContent(
    id: number,
    input: TaonCmsUpdateContent,
  ): Promise<TaonCmsContentEntity> {
    //#region @websqlFunc
    requireContentId(id);
    validateContentInput(input);
    requireContentVersion(input.expectedVersion);
    return this.connection.transaction(async manager => {
      const current = await this.requireContent(id, manager);
      const snapshot = await this.snapshotOf(current, manager);
      const fields = this.contentFields(input, snapshot);
      const tagIds =
        input.tagIds === undefined
          ? snapshot.tagIds
          : [...new Set(input.tagIds)];
      return this.commitUpdate(
        current,
        input.expectedVersion,
        { ...fields, tagIds },
        manager,
      );
    });
    //#endregion
  }

  async archiveContent(
    id: number,
    expectedVersion: number,
  ): Promise<TaonCmsContentEntity> {
    //#region @websqlFunc
    return this.updateContent(id, { status: 'archived', expectedVersion });
    //#endregion
  }

  async restoreContent(
    id: number,
    input: TaonCmsRestoreContent,
  ): Promise<TaonCmsContentEntity> {
    //#region @websqlFunc
    requireContentId(id);
    if (!input || typeof input !== 'object') {
      contentError('Restore input must be an object.');
    }
    requireContentVersion(input.revisionNumber, 'revisionNumber');
    requireContentVersion(input.expectedVersion);
    return this.connection.transaction(async manager => {
      const current = await this.requireContent(id, manager);
      const revision = await this.taonCmsContentRevisionRepository.requireRevision(
        id,
        input.revisionNumber,
        manager,
      );
      if (!revision.snapshot) {
        contentError(
          'This legacy revision has no complete snapshot and cannot be restored.',
          409,
        );
      }
      const storedSnapshot = revision.snapshot;
      const snapshotFields: (keyof TaonCmsContentSnapshot)[] = [
        'type',
        'title',
        'slug',
        'body',
        'excerpt',
        'categoryId',
        'authorUserId',
        'status',
        'publishedAt',
        'tagIds',
      ];
      if (snapshotFields.some(field => storedSnapshot[field] === undefined)) {
        contentError(
          'This revision has an incomplete snapshot and cannot be restored.',
          409,
        );
      }
      validateContentInput(revision.snapshot, true);
      const snapshot = {
        ...this.contentFields(revision.snapshot),
        tagIds: revision.snapshot.tagIds,
      };
      return this.commitUpdate(
        current,
        input.expectedVersion,
        snapshot,
        manager,
      );
    });
    //#endregion
  }

  async listRevisions(id: number): Promise<TaonCmsContentRevisionEntity[]> {
    //#region @websqlFunc
    requireContentId(id);
    return this.connection.transaction(async manager => {
      await this.requireContent(id, manager);
      return this.taonCmsContentRevisionRepository.listForContent(id, manager);
    });
    //#endregion
  }

  private async requireContent(
    id: number,
    manager: EntityManager,
  ): Promise<TaonCmsContentEntity> {
    //#region @websqlFunc
    const content = await manager
      .getRepository<TaonCmsContentEntity>(this.target)
      .findOneBy({ id });
    if (!content) {
      contentError(`Content ${id} does not exist.`, 404);
    }
    return content;
    //#endregion
  }

  private contentFields(
    input: Partial<TaonCmsContentFields>,
    current?: TaonCmsContentFields,
  ): TaonCmsContentFields {
    const type = input.type ?? current?.type;
    const title = input.title ?? current?.title;
    const slug = input.slug ?? current?.slug;
    if (type === undefined || title === undefined || slug === undefined) {
      contentError('type, title, and slug are required.');
    }
    const publishedAt =
      input.publishedAt === undefined
        ? (current?.publishedAt ?? null)
        : input.publishedAt;
    return {
      type,
      title,
      slug,
      body: input.body === undefined ? (current?.body ?? null) : input.body,
      excerpt:
        input.excerpt === undefined
          ? (current?.excerpt ?? null)
          : input.excerpt,
      categoryId:
        input.categoryId === undefined
          ? (current?.categoryId ?? null)
          : input.categoryId,
      authorUserId:
        input.authorUserId === undefined
          ? (current?.authorUserId ?? null)
          : input.authorUserId,
      status: input.status ?? current?.status ?? 'draft',
      publishedAt: publishedAt === null ? null : new Date(publishedAt),
    };
  }

  private async snapshotOf(
    content: TaonCmsContentEntity,
    manager: EntityManager,
  ): Promise<TaonCmsContentSnapshot> {
    //#region @websqlFunc
    return {
      ...this.contentFields({
        ...content,
        status: this.contentStatus(content.status),
      }),
      tagIds: await this.taonCmsContentTagRepository.findTagIds(content.id, manager),
    };
    //#endregion
  }

  private contentStatus(status: string): TaonCmsContentFields['status'] {
    if (status !== 'draft' && status !== 'published' && status !== 'archived') {
      contentError(`Unsupported stored content status: ${status}.`, 409);
    }
    return status;
  }

  private async validateReferences(
    fields: TaonCmsContentFields,
    tagIds: number[],
    manager: EntityManager,
  ): Promise<void> {
    //#region @websqlFunc
    if (fields.categoryId !== null) {
      await this.taonCmsCategoryRepository.requireCategory(fields.categoryId, manager);
    }
    await this.tags.requireTags(tagIds, manager);
    //#endregion
  }

  private async requireAvailableSlug(
    slug: string,
    manager: EntityManager,
    contentId?: number,
  ): Promise<void> {
    //#region @websqlFunc
    const existing = await manager
      .getRepository<TaonCmsContentEntity>(this.target)
      .findOneBy({ slug });
    if (existing && existing.id !== contentId) {
      contentError(`Slug "${slug}" is already in use.`, 409);
    }
    //#endregion
  }

  private async commitUpdate(
    current: TaonCmsContentEntity,
    expectedVersion: number,
    snapshot: TaonCmsContentSnapshot,
    manager: EntityManager,
  ): Promise<TaonCmsContentEntity> {
    //#region @websqlFunc
    if (current.version !== expectedVersion) {
      contentError('Content has changed. Reload it before editing.', 409);
    }
    await this.validateReferences(snapshot, snapshot.tagIds, manager);
    await this.requireAvailableSlug(snapshot.slug, manager, current.id);
    // Preserve the first pre-API version before replacing it.
    const history = await this.taonCmsContentRevisionRepository.listForContent(current.id, manager);
    if (
      !history.some(revision => revision.revisionNumber === current.version)
    ) {
      await this.taonCmsContentRevisionRepository.recordContent(
        current,
        await this.snapshotOf(current, manager),
        manager,
      );
    }
    const fields = this.contentFields(snapshot);
    const repository = manager.getRepository<TaonCmsContentEntity>(this.target);
    const result = await repository.update(
      { id: current.id, version: expectedVersion },
      { ...fields, version: expectedVersion + 1, updatedAt: new Date() },
    );
    if (result.affected !== 1) {
      contentError('Content has changed. Reload it before editing.', 409);
    }
    await this.taonCmsContentTagRepository.replaceTags(current.id, snapshot.tagIds, manager);
    const updated = await this.requireContent(current.id, manager);
    await this.taonCmsContentRevisionRepository.recordContent(
      updated,
      { ...fields, tagIds: snapshot.tagIds },
      manager,
    );
    return updated;
    //#endregion
  }

  /**
   * TODO remove this demo example method
   */
  async countEntitesWithEvenId(): Promise<number> {
    //#region @websqlFunc
    const result = await this.count({
      where: {
        id: Raw(alias => `${alias} % 2 = 0`),
      },
    });
    return result;
    //#endregion
  }
}
