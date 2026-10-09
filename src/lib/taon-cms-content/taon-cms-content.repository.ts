//#region imports
import { TaonBaseRepository, TaonRepository } from 'taon/src';
import { In, Raw } from 'taon-typeorm/src';
import type { EntityManager } from 'taon-typeorm/src';
import { TaonPermissionEntity } from '@taon-dev/session/src';

import { TaonCmsCategoryRepository } from '../taon-cms-category/taon-cms-category.repository';
import type { TaonCmsContentRevisionEntity } from '../taon-cms-content-revision/taon-cms-content-revision.entity';
import { TaonCmsContentRevisionRepository } from '../taon-cms-content-revision/taon-cms-content-revision.repository';
import { TaonCmsContentTagRepository } from '../taon-cms-content-tag/taon-cms-content-tag.repository';
import { TaonCmsTagRepository } from '../taon-cms-tag/taon-cms-tag.repository';

import { TaonCmsContentEntity } from './taon-cms-content.entity';
import { TaonCmsContentType } from './taon-cms-content.models';
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
      const relatedPostIds = [...new Set(input.relatedPostIds ?? [])];
      const permissionIds = [...new Set(input.permissionIds ?? [])];
      await this.validateReferences(fields, tagIds, permissionIds, manager);
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
      await this.replaceRelatedPosts(content.id, relatedPostIds, [], manager);
      await this.replacePermissions(content.id, permissionIds, [], manager);
      await this.taonCmsContentRevisionRepository.recordContent(
        content,
        { ...fields, tagIds, relatedPostIds, permissionIds },
        manager,
      );
      return this.requireContent(content.id, manager);
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
      const relatedPostIds =
        input.relatedPostIds === undefined
          ? snapshot.relatedPostIds
          : [...new Set(input.relatedPostIds)];
      const permissionIds =
        input.permissionIds === undefined
          ? snapshot.permissionIds
          : [...new Set(input.permissionIds)];
      return this.commitUpdate(
        current,
        input.expectedVersion,
        { ...fields, tagIds, relatedPostIds, permissionIds },
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
        // Older complete snapshots predate primary media; preserve those keys.
        ...this.contentFields(revision.snapshot, await this.snapshotOf(current, manager)),
        tagIds: revision.snapshot.tagIds,
        relatedPostIds: revision.snapshot.relatedPostIds ?? [],
        permissionIds: revision.snapshot.permissionIds ?? [],
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

  async listRelatedPosts(id: number): Promise<TaonCmsContentEntity[]> {
    //#region @websqlFunc
    requireContentId(id);
    return this.connection.transaction(async manager =>
      (await this.requireContent(id, manager)).relatedPosts,
    );
    //#endregion
  }

  async listPermissions(id: number): Promise<TaonPermissionEntity[]> {
    //#region @websqlFunc
    requireContentId(id);
    return this.connection.transaction(async manager =>
      (await this.requireContent(id, manager)).permissions,
    );
    //#endregion
  }

  async addRelatedPost(
    id: number,
    relatedPostId: number,
    expectedVersion: number,
  ): Promise<TaonCmsContentEntity> {
    //#region @websqlFunc
    return this.changeRelatedPost(id, relatedPostId, expectedVersion, true);
    //#endregion
  }

  async deleteRelatedPost(
    id: number,
    relatedPostId: number,
    expectedVersion: number,
  ): Promise<TaonCmsContentEntity> {
    //#region @websqlFunc
    return this.changeRelatedPost(id, relatedPostId, expectedVersion, false);
    //#endregion
  }

  private async changeRelatedPost(
    id: number,
    relatedPostId: number,
    expectedVersion: number,
    adding: boolean,
  ): Promise<TaonCmsContentEntity> {
    //#region @websqlFunc
    requireContentId(id);
    requireContentId(relatedPostId, 'relatedPostId');
    requireContentVersion(expectedVersion);
    if (id === relatedPostId) {
      contentError('A post cannot relate to itself.');
    }
    return this.connection.transaction(async manager => {
      const current = await this.requireContent(id, manager);
      await this.requireContent(relatedPostId, manager);
      const snapshot = await this.snapshotOf(current, manager);
      const ids = snapshot.relatedPostIds ?? [];
      snapshot.relatedPostIds = adding
        ? [...new Set([...ids, relatedPostId])]
        : ids.filter(postId => postId !== relatedPostId);
      return this.commitUpdate(current, expectedVersion, snapshot, manager);
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
      .findOne({
        where: { id },
        relations: { relatedPosts: true, permissions: true },
      });
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
    const type = input.type ?? current?.type ?? TaonCmsContentType.Normal;
    const title = input.title ?? current?.title;
    const slug = input.slug ?? current?.slug;
    if (title === undefined || slug === undefined) {
      contentError('title and slug are required.');
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
      videoKey:
        input.videoKey === undefined ? (current?.videoKey ?? null) : input.videoKey,
      audioKey:
        input.audioKey === undefined ? (current?.audioKey ?? null) : input.audioKey,
      attachmentKey:
        input.attachmentKey === undefined
          ? (current?.attachmentKey ?? null)
          : input.attachmentKey,
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
      relatedPostIds: content.relatedPosts.map(post => post.id),
      permissionIds: content.permissions.map(permission => permission.id),
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
    permissionIds: number[],
    manager: EntityManager,
  ): Promise<void> {
    //#region @websqlFunc
    if (fields.categoryId !== null) {
      await this.taonCmsCategoryRepository.requireCategory(fields.categoryId, manager);
    }
    await this.tags.requireTags(tagIds, manager);
    await this.requirePermissions(permissionIds, manager);
    //#endregion
  }

  private async requirePermissions(
    permissionIds: number[],
    manager: EntityManager,
  ): Promise<void> {
    //#region @websqlFunc
    if (!permissionIds.length) {
      return;
    }
    const permissions = await manager
      .getRepository<TaonPermissionEntity>(TaonPermissionEntity)
      .findBy({ id: In(permissionIds) });
    const foundIds = new Set(permissions.map(permission => permission.id));
    const missingId = permissionIds.find(id => !foundIds.has(id));
    if (missingId !== undefined) {
      contentError(`Permission ${missingId} does not exist.`, 404);
    }
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

  private async replaceRelatedPosts(
    id: number,
    relatedPostIds: number[],
    previousIds: number[],
    manager: EntityManager,
  ): Promise<void> {
    //#region @websqlFunc
    if (relatedPostIds.includes(id)) {
      contentError('A post cannot relate to itself.');
    }
    const repository = manager.getRepository<TaonCmsContentEntity>(this.target);
    if (relatedPostIds.length) {
      const posts = await repository.findBy({ id: In(relatedPostIds) });
      const foundIds = new Set(posts.map(post => post.id));
      const missingId = relatedPostIds.find(postId => !foundIds.has(postId));
      if (missingId !== undefined) {
        contentError(`Content ${missingId} does not exist.`, 404);
      }
    }
    const added = relatedPostIds.filter(postId => !previousIds.includes(postId));
    const removed = previousIds.filter(postId => !relatedPostIds.includes(postId));
    if (added.length || removed.length) {
      await repository.createQueryBuilder()
        .relation('relatedPosts')
        .of(id)
        .addAndRemove(added, removed);
    }
    //#endregion
  }

  private async replacePermissions(
    id: number,
    permissionIds: number[],
    previousIds: number[],
    manager: EntityManager,
  ): Promise<void> {
    //#region @websqlFunc
    const added = permissionIds.filter(permissionId => !previousIds.includes(permissionId));
    const removed = previousIds.filter(permissionId => !permissionIds.includes(permissionId));
    if (added.length || removed.length) {
      await manager
        .getRepository<TaonCmsContentEntity>(this.target)
        .createQueryBuilder()
        .relation('permissions')
        .of(id)
        .addAndRemove(added, removed);
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
    await this.validateReferences(
      snapshot,
      snapshot.tagIds,
      snapshot.permissionIds,
      manager,
    );
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
    await this.replaceRelatedPosts(
      current.id,
      [...new Set(snapshot.relatedPostIds ?? [])],
      current.relatedPosts.map(post => post.id),
      manager,
    );
    await this.replacePermissions(
      current.id,
      [...new Set(snapshot.permissionIds ?? [])],
      current.permissions.map(permission => permission.id),
      manager,
    );
    const updated = await this.requireContent(current.id, manager);
    await this.taonCmsContentRevisionRepository.recordContent(
      updated,
      {
        ...fields,
        tagIds: snapshot.tagIds,
        relatedPostIds: updated.relatedPosts.map(post => post.id),
        permissionIds: updated.permissions.map(permission => permission.id),
      },
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
