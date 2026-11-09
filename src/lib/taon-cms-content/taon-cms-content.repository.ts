//#region imports
import { TaonBaseRepository, TaonRepository } from 'taon/src';
import { In, Raw } from 'taon-typeorm/src';
import type { EntityManager } from 'taon-typeorm/src';
import { TaonPermissionEntity } from '@taon-dev/session/src';

import { TaonCmsApplicationHookEntity } from '../taon-cms-application-hook/taon-cms-application-hook.entity';
import type { TaonCmsApplicationHook } from '../taon-cms-application-hooks';
import { TaonCmsCategoryRepository } from '../taon-cms-category/taon-cms-category.repository';
import type { TaonCmsContentRevisionEntity } from '../taon-cms-content-revision/taon-cms-content-revision.entity';
import { TaonCmsContentRevisionRepository } from '../taon-cms-content-revision/taon-cms-content-revision.repository';
import { TaonCmsContentTagRepository } from '../taon-cms-content-tag/taon-cms-content-tag.repository';
import { TaonCmsTagRepository } from '../taon-cms-tag/taon-cms-tag.repository';
import { TaonCmsContentAssetEntity } from '../taon-cms-content-asset/taon-cms-content-asset.entity';
import { _ } from 'tnp-core/src';

import { TaonCmsContentEntity } from './taon-cms-content.entity';
import { TaonCmsContentType } from './taon-cms-content.models';
import { TaonCmsContentUtils } from './taon-cms-content.utils';
import type {
  TaonCmsContentFields,
  TaonCmsContentSnapshot,
  TaonCmsCreateContent,
  TaonCmsCreateRelatedChildInput,
  TaonCmsCreateRelatedChildResult,
  TaonCmsRestoreContent,
  TaonCmsUpdateContent,
  TaonCmsPermissionConfiguration,
  TaonCmsPostVersionKind,
  TaonCmsPostVersionLinks,
  TaonCmsVisibilityConfiguration,
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

  async listTagIds(id: number): Promise<number[]> {
    //#region @websqlFunc
    requireContentId(id);
    return this.connection.transaction(async manager => {
      await this.requireContent(id, manager);
      return this.taonCmsContentTagRepository.findTagIds(id, manager);
    });
    //#endregion
  }

  async getVisibilityConfiguration(
    id: number,
  ): Promise<TaonCmsVisibilityConfiguration> {
    //#region @websqlFunc
    requireContentId(id);
    return this.connection.transaction(async manager => {
      const content = await this.requireContent(id, manager);
      return this.resolveVisibilityConfiguration(content, manager);
    });
    //#endregion
  }

  async createContent(
    input: TaonCmsCreateContent,
  ): Promise<TaonCmsContentEntity> {
    //#region @websqlFunc
    validateContentInput(input, true);
    return this.connection.transaction('SERIALIZABLE', manager =>
      this.createContentWithManager(input, manager),
    );
    //#endregion
  }

  async createRelatedChild(
    parentId: number,
    input: TaonCmsCreateRelatedChildInput,
  ): Promise<TaonCmsCreateRelatedChildResult> {
    //#region @websqlFunc
    requireContentId(parentId, 'parentId');
    this.validateRelatedChildInput(input);
    return this.connection.transaction('SERIALIZABLE', async manager => {
      const parent = await this.requireContent(parentId, manager);
      const prefix = input.titlePrefix.trim();
      const requestedTitle = input.expectedTitle.trim();
      const matchingChild = parent.relatedPosts.find(
        child =>
          child.title === requestedTitle &&
          this.relatedChildMatchesInput(child, input),
      );
      if (matchingChild) {
        return { child: matchingChild, parentVersion: parent.version };
      }
      const uploadedKeys = [
        input.sourceKey,
        ...(input.thumbnailKey.startsWith('cms-placeholder:')
          ? []
          : [input.thumbnailKey]),
      ];
      for (const key of new Set(uploadedKeys)) {
        if (await this.isMediaKeyInUseWithinManager(key, manager)) {
          contentError('An uploaded media file is already assigned to a post.', 409);
        }
      }

      const title = this.nextRelatedChildTitle(prefix, parent.relatedPosts);
      if (requestedTitle !== title) {
        contentError(
          'The child title sequence changed. Reload related posts and retry.',
          409,
        );
      }
      const inheritedVisibility = await this.resolveVisibilityConfiguration(
        parent,
        manager,
      );
      const status = parent.applyVisibilityToRelatedPosts
        ? this.contentStatus(parent.status)
        : inheritedVisibility.source
          ? inheritedVisibility.status
          : 'draft';
      const repository = manager.getRepository<TaonCmsContentEntity>(
        this.target,
      );
      const baseSlug = _.kebabCase(title);
      if (!baseSlug) {
        contentError('The child title cannot be converted into a URL slug.');
      }
      let slug = baseSlug;
      let suffix = 2;
      while (await repository.findOneBy({ slug })) {
        slug = `${baseSlug}-${suffix}`;
        suffix += 1;
      }
      const child = await this.createContentWithManager(
        {
          title,
          slug,
          type: input.type,
          body: input.body,
          videoKey: input.videoKey,
          audioKey: input.audioKey,
          attachmentKey: input.attachmentKey,
          thumbnailKey: input.thumbnailKey,
          status,
          publishedAt: status === 'published' ? new Date() : null,
          relatedPostIds: [],
          tagIds: [],
          permissionIds: [],
          applicationHook: null,
        },
        manager,
      );
      const snapshot = await this.snapshotOf(parent, manager);
      snapshot.relatedPostIds = [
        ...parent.relatedPosts.map(relatedPost => relatedPost.id),
        child.id,
      ];
      const updatedParent = await this.commitUpdate(
        parent,
        parent.version,
        snapshot,
        manager,
        undefined,
        false,
      );
      return { child, parentVersion: updatedParent.version };
    });
    //#endregion
  }

  private validateRelatedChildInput(
    input: TaonCmsCreateRelatedChildInput,
  ): void {
    //#region @websqlFunc
    if (!input || typeof input !== 'object') {
      contentError('The child post input is invalid.');
    }
    const prefix =
      typeof input.titlePrefix === 'string' ? input.titlePrefix.trim() : '';
    if (!prefix || prefix.length > 240 || /[\r\n]/.test(prefix)) {
      contentError('The child title prefix is invalid.');
    }
    if (
      typeof input.expectedTitle !== 'string' ||
      !input.expectedTitle.trim() ||
      input.expectedTitle.trim().length > 255
    ) {
      contentError('The child title is invalid.');
    }
    if (
      typeof input.fileName !== 'string' ||
      !input.fileName.trim() ||
      input.fileName.length > 255 ||
      typeof input.mimeType !== 'string' ||
      input.mimeType.length > 127
    ) {
      contentError('The uploaded file information is invalid.');
    }
    if (
      (input.body !== null && typeof input.body !== 'string') ||
      (typeof input.body === 'string' && input.body.length > 10_000_000)
    ) {
      contentError('The document content is invalid or too large.');
    }
    for (const key of [
      input.videoKey,
      input.audioKey,
      input.attachmentKey,
    ]) {
      if (key !== null && typeof key !== 'string') {
        contentError('The uploaded media key is invalid.');
      }
    }
    if (
      typeof input.sourceKey !== 'string' ||
      !input.sourceKey.trim() ||
      input.sourceKey.length > 1024 ||
      typeof input.thumbnailKey !== 'string' ||
      !input.thumbnailKey.trim() ||
      input.thumbnailKey.length > 1024
    ) {
      contentError('The uploaded media key is invalid.');
    }
    const fileName = input.fileName.split(/[\\/]/).pop() ?? '';
    const keyFileName = input.sourceKey.split('/').pop() ?? '';
    const storedFileName = keyFileName.replace(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}__/i,
      '',
    );
    if (storedFileName === keyFileName) {
      contentError('The uploaded source media key is invalid.');
    }
    const extension = fileName.match(/\.([^.]+)$/)?.[1]?.toLowerCase() ?? '';
    const keyExtension =
      storedFileName.match(/\.([^.]+)$/)?.[1]?.toLowerCase() ?? '';
    if (extension !== keyExtension) {
      contentError('The uploaded file extension does not match its media key.');
    }
    const documentExtensions = new Set(['doc', 'docx', 'rtf', 'txt']);
    const videoExtensions = new Set([
      '3gp',
      'avi',
      'm4v',
      'mkv',
      'mov',
      'mp4',
      'mpeg',
      'mpg',
      'ogv',
      'webm',
    ]);
    const audioExtensions = new Set([
      'aac',
      'flac',
      'm4a',
      'mp3',
      'oga',
      'ogg',
      'opus',
      'wav',
      'weba',
      'wma',
    ]);
    const mimeType = input.mimeType.toLowerCase();
    const expectedType = documentExtensions.has(extension)
      ? TaonCmsContentType.Normal
      : mimeType.startsWith('video/')
        ? TaonCmsContentType.Video
        : mimeType.startsWith('audio/')
          ? TaonCmsContentType.Audio
          : videoExtensions.has(extension)
            ? TaonCmsContentType.Video
            : audioExtensions.has(extension)
              ? TaonCmsContentType.Audio
              : TaonCmsContentType.Attachment;
    if (input.type !== expectedType) {
      contentError('The uploaded file type does not match the child post type.');
    }
    if (input.type === TaonCmsContentType.Video) {
      if (
        input.videoKey !== input.sourceKey ||
        input.audioKey !== null ||
        input.attachmentKey !== null ||
        input.body !== null ||
        input.thumbnailKey === 'cms-placeholder:video'
      ) {
        contentError('The video child media mapping is invalid.');
      }
      if (!/\.(?:avif|gif|jpe?g|png|webp)$/i.test(input.thumbnailKey)) {
        contentError('The video thumbnail file type is invalid.');
      }
    } else if (input.type === TaonCmsContentType.Audio) {
      if (
        input.audioKey !== input.sourceKey ||
        input.videoKey !== null ||
        input.attachmentKey !== null ||
        input.body !== null ||
        input.thumbnailKey !== 'cms-placeholder:audio'
      ) {
        contentError('The audio child media mapping is invalid.');
      }
    } else if (input.type === TaonCmsContentType.Normal) {
      if (
        !input.body?.trim() ||
        input.videoKey !== null ||
        input.audioKey !== null ||
        input.attachmentKey !== null ||
        input.thumbnailKey !== 'cms-placeholder:normal'
      ) {
        contentError('The document child content mapping is invalid.');
      }
    } else if (
      input.attachmentKey !== input.sourceKey ||
      input.videoKey !== null ||
      input.audioKey !== null ||
      input.body !== null ||
      input.thumbnailKey !== 'cms-placeholder:normal'
    ) {
      contentError('The attachment child media mapping is invalid.');
    }
    //#endregion
  }

  private relatedChildMatchesInput(
    child: TaonCmsContentEntity,
    input: TaonCmsCreateRelatedChildInput,
  ): boolean {
    //#region @websqlFunc
    return (
      child.type === input.type &&
      child.body === input.body &&
      child.videoKey === input.videoKey &&
      child.audioKey === input.audioKey &&
      child.attachmentKey === input.attachmentKey &&
      child.thumbnailKey === input.thumbnailKey
    );
    //#endregion
  }

  private nextRelatedChildTitle(
    prefix: string,
    children: TaonCmsContentEntity[],
  ): string {
    //#region @websqlFunc
    let highest = 0;
    for (const child of children) {
      const candidatePrefix = `${prefix} `;
      if (!child.title.startsWith(candidatePrefix)) {
        continue;
      }
      const suffix = child.title.slice(candidatePrefix.length);
      if (!/^\d+$/.test(suffix)) {
        continue;
      }
      const number = Number(suffix);
      if (Number.isSafeInteger(number)) {
        highest = Math.max(highest, number);
      }
    }
    const next = highest + 1;
    if (!Number.isSafeInteger(next)) {
      contentError('No available child title number could be generated.', 409);
    }
    return `${prefix} ${String(next).padStart(2, '0')}`;
    //#endregion
  }

  private async isMediaKeyInUseWithinManager(
    key: string,
    manager: EntityManager,
  ): Promise<boolean> {
    //#region @websqlFunc
    return !!(await manager
      .getRepository<TaonCmsContentEntity>(this.target)
      .findOne({
        where: [
          { videoKey: key },
          { audioKey: key },
          { attachmentKey: key },
          { thumbnailKey: key },
        ],
        select: { id: true },
      }));
    //#endregion
  }

  private async resolveVisibilityConfiguration(
    post: TaonCmsContentEntity,
    manager: EntityManager,
  ): Promise<TaonCmsVisibilityConfiguration> {
    //#region @websqlFunc
    const repository = manager.getRepository<TaonCmsContentEntity>(this.target);
    let childId = post.id;
    const visited = new Set<number>([childId]);
    while (true) {
      const parents = await repository.find({
        where: { relatedPosts: { id: childId } },
      });
      if (parents.length > 1) {
        contentError('A post cannot have multiple parent posts.', 409);
      }
      const parent = parents[0];
      if (!parent) {
        return { status: this.contentStatus(post.status), source: null };
      }
      if (visited.has(parent.id)) {
        contentError('Related posts cannot contain circular relationships.', 409);
      }
      visited.add(parent.id);
      if (parent.applyVisibilityToRelatedPosts) {
        return {
          status: this.contentStatus(parent.status),
          source: { id: parent.id, title: parent.title },
        };
      }
      childId = parent.id;
    }
    //#endregion
  }

  async duplicateContent(
    id: number,
    includeChildren: boolean,
    copyStorageObject: (key: string) => Promise<string>,
    deleteStorageObject: (key: string) => Promise<void>,
  ): Promise<TaonCmsContentEntity> {
    //#region @websqlFunc
    requireContentId(id);
    const copiedKeys: string[] = [];
    try {
      return await this.connection.transaction(
        'SERIALIZABLE',
        async manager => {
          const processed = new Set<number>();
          const duplicateNode = async (
            source: TaonCmsContentEntity,
            inheritedStatus?: TaonCmsContentFields['status'],
          ): Promise<TaonCmsContentEntity> => {
            if (processed.has(source.id)) {
              contentError(
                'The related post hierarchy contains a cycle or duplicate post.',
                409,
              );
            }
            processed.add(source.id);
            const sourcePost = await this.requireContent(source.id, manager);
            const snapshot = await this.snapshotOf(sourcePost, manager);
            const configuration = await this.resolvePermissionConfiguration(
              sourcePost,
              manager,
            );
            const children: TaonCmsContentEntity[] = [];
            const status = inheritedStatus ?? snapshot.status;
            const descendantStatus =
              inheritedStatus ??
              (snapshot.applyVisibilityToRelatedPosts ? status : undefined);
            if (includeChildren) {
              for (const child of sourcePost.relatedPosts ?? []) {
                children.push(await duplicateNode(child, descendantStatus));
              }
            }
            const titleAndSlug = await this.nextCopyTitleAndSlug(
              sourcePost.title,
              sourcePost.slug,
              manager,
            );
            const copiedSnapshot = { ...snapshot, status };
            const copiedAssetKeys = new Map<string, string>();
            for (const field of [
              'videoKey',
              'audioKey',
              'attachmentKey',
              'thumbnailKey',
            ] as const) {
              const key = copiedSnapshot[field];
              if (key && !key.startsWith('cms-placeholder:')) {
                let copiedKey = copiedAssetKeys.get(key);
                if (!copiedKey) {
                  copiedKey = await copyStorageObject(key);
                  copiedKeys.push(copiedKey);
                  copiedAssetKeys.set(key, copiedKey);
                }
                copiedSnapshot[field] = copiedKey;
              }
            }
            const duplicate = await this.createContentWithManager(
              {
                ...copiedSnapshot,
                ...titleAndSlug,
                relatedPostIds: children.map(child => child.id),
                applicationHook: null,
                permissionIds: configuration.permissions.map(
                  permission => permission.id,
                ),
              },
              manager,
            );
            const assetRepository =
              manager.getRepository<TaonCmsContentAssetEntity>(
                TaonCmsContentAssetEntity,
              );
            const sourceAssets = await assetRepository.find({
              where: { contentId: sourcePost.id },
            });
            for (const asset of sourceAssets) {
              const copiedKey = copiedAssetKeys.get(asset.key);
              if (!copiedKey) {
                continue;
              }
              await assetRepository.save(
                assetRepository.create({
                  version: 1,
                  contentId: duplicate.id,
                  type: asset.type,
                  storageProvider: asset.storageProvider,
                  bucket: asset.bucket,
                  key: copiedKey,
                  originalFilename: asset.originalFilename,
                  mimeType: asset.mimeType,
                  size: asset.size,
                  durationSeconds: asset.durationSeconds,
                  metadata: asset.metadata,
                  createdAt: new Date(),
                }),
              );
            }
            return duplicate;
          };
          return duplicateNode(await this.requireContent(id, manager));
        },
      );
    } catch (error) {
      const cleanupErrors: unknown[] = [];
      for (const key of copiedKeys.reverse()) {
        try {
          await deleteStorageObject(key);
        } catch (cleanupError) {
          cleanupErrors.push(cleanupError);
        }
      }
      if (cleanupErrors.length) {
        console.error(
          '[taon-cms-content] Unable to clean up duplicated media',
          cleanupErrors,
        );
        contentError(
          'Post duplication failed and one or more copied asset files could not be removed.',
          500,
        );
      }
      throw error;
    }
    //#endregion
  }

  private async nextCopyTitleAndSlug(
    title: string,
    slug: string,
    manager: EntityManager,
  ): Promise<{ title: string; slug: string }> {
    const titleSuffix = title.match(/\s+COPY(\d+)$/i);
    const slugSuffix = slug.match(/-copy(\d+)$/i);
    const baseTitle = title.replace(/(?:\s+COPY\d+)+$/i, '');
    const baseSlug = slug.replace(/(?:-copy\d+)+$/i, '');
    let number =
      Math.max(Number(titleSuffix?.[1] ?? 0), Number(slugSuffix?.[1] ?? 0)) +
      1;
    const repository = manager.getRepository<TaonCmsContentEntity>(this.target);
    while (Number.isSafeInteger(number)) {
      const copyTitle = `${baseTitle} COPY${number}`;
      const copySlug = `${baseSlug}-copy${number}`;
      const existing = await repository.findOne({
        where: [{ title: copyTitle }, { slug: copySlug }],
      });
      if (!existing) {
        return { title: copyTitle, slug: copySlug };
      }
      number += 1;
    }
    contentError('No available copy number could be generated.', 409);
  }

  private async createContentWithManager(
    input: TaonCmsCreateContent,
    manager: EntityManager,
  ): Promise<TaonCmsContentEntity> {
    //#region @websqlFunc
    const fields = this.contentFields(input);
    if (fields.status === 'published' && fields.publishedAt === null) {
      fields.publishedAt = new Date();
    }
    const tagIds = [...new Set(input.tagIds ?? [])];
    const relatedPostIds = [...new Set(input.relatedPostIds ?? [])];
    const permissionIds = [...new Set(input.permissionIds ?? [])];
    await this.validateReferences(fields, tagIds, permissionIds, manager);
    await this.requireAvailableSlug(fields.slug, manager);
    const repository = manager.getRepository<TaonCmsContentEntity>(this.target);
    const now = new Date();
    const content = await repository.save(
      repository.create({
        ...fields,
        version: 1,
        createdAt: now,
        updatedAt: now,
      }),
    );
    await this.taonCmsContentTagRepository.replaceTags(
      content.id,
      tagIds,
      manager,
    );
    await this.replaceRelatedPosts(content.id, relatedPostIds, [], manager);
    if (fields.applyVisibilityToRelatedPosts && relatedPostIds.length) {
      await this.propagateVisibilityToRelatedPosts(
        content.id,
        fields.status,
        manager,
        new Set([content.id]),
      );
    }
    await this.validatePermissionInheritance(manager);
    await this.replacePermissions(content.id, permissionIds, [], manager);
    await this.replaceApplicationHook(
      content.id,
      input.applicationHook ?? null,
      manager,
    );
    await this.taonCmsContentRevisionRepository.recordContent(
      content,
      { ...fields, tagIds, relatedPostIds, relatedPostOrderSaved: true, permissionIds },
      manager,
    );
    return this.requireContent(content.id, manager);
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
    return this.connection.transaction('SERIALIZABLE', async manager => {
      const current = await this.requireContent(id, manager);
      const snapshot = await this.snapshotOf(current, manager);
      const visibility = await this.resolveVisibilityConfiguration(
        current,
        manager,
      );
      if (
        input.status !== undefined &&
        visibility.source &&
        input.status !== visibility.status
      ) {
        contentError(
          'Visibility is inherited from a parent post and cannot be changed here.',
          409,
        );
      }
      const fields = this.contentFields(input, snapshot);
      if (visibility.source) {
        fields.status = visibility.status;
      }
      if (
        input.status === 'published' &&
        snapshot.status !== 'published' &&
        input.publishedAt === undefined
      ) {
        fields.publishedAt = new Date();
      }
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
        input.applicationHook,
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

  async permanentlyDeleteContent(
    id: number,
    expectedVersion: number,
    deleteStorageObject: (key: string) => Promise<void>,
  ): Promise<void> {
    //#region @websqlFunc
    requireContentId(id);
    requireContentVersion(expectedVersion);
    const assetKeys = await this.connection.transaction(
      'SERIALIZABLE',
      async manager => {
        const content = await this.requireContent(id, manager);
        if (content.version !== expectedVersion) {
          contentError('Content has changed. Reload it before editing.', 409);
        }
        if (content.status !== 'archived') {
          contentError('Only archived posts can be permanently deleted.', 409);
        }
        const repository = manager.getRepository<TaonCmsContentEntity>(
          TaonCmsContentEntity,
        );
        const assetRepository =
          manager.getRepository<TaonCmsContentAssetEntity>(
            TaonCmsContentAssetEntity,
          );
        const assetKeys = [
          content.videoKey,
          content.audioKey,
          content.attachmentKey,
          content.thumbnailKey,
        ].filter(
          (key): key is string =>
            !!key && !key.startsWith('cms-placeholder:'),
        );
        const unusedAssetKeys: string[] = [];
        for (const key of new Set(assetKeys)) {
          const references = await repository.find({
            where: [
              { videoKey: key },
              { audioKey: key },
              { attachmentKey: key },
              { thumbnailKey: key },
            ],
          });
          const assetReferences = await assetRepository.find({
            where: { key },
          });
          if (
            !references.some(reference => reference.id !== id) &&
            !assetReferences.some(asset => asset.contentId !== id)
          ) {
            unusedAssetKeys.push(key);
          }
        }
        if (content.relatedPosts?.length) {
          await repository
            .createQueryBuilder()
            .relation('relatedPosts')
            .of(id)
            .remove(content.relatedPosts.map(post => post.id));
        }
        const parents = await repository.find({
          where: { relatedPosts: { id } },
        });
        for (const parent of parents) {
          await repository
            .createQueryBuilder()
            .relation('relatedPosts')
            .of(parent.id)
            .remove(id);
        }
        const versionPosts = await repository.find({
          where: [{ publicVersionPostId: id }, { privateVersionPostId: id }],
        });
        for (const versionPost of versionPosts) {
          if (versionPost.publicVersionPostId === id) {
            versionPost.publicVersionPostId = null;
          }
          if (versionPost.privateVersionPostId === id) {
            versionPost.privateVersionPostId = null;
          }
          versionPost.version += 1;
          versionPost.updatedAt = new Date();
          await repository.save(versionPost);
        }
        await this.taonCmsContentTagRepository.replaceTags(
          id,
          [],
          manager,
        );
        await this.replacePermissions(
          id,
          [],
          content.permissions.map(permission => permission.id),
          manager,
        );
        await this.replaceApplicationHook(id, null, manager);
        await assetRepository.delete({ contentId: id });
        await manager
          .getRepository<TaonCmsContentRevisionEntity>(
            this.taonCmsContentRevisionRepository.target,
          )
          .delete({ contentId: id });
        await repository.delete({ id });
        return unusedAssetKeys;
      },
    );
    const cleanupErrors: unknown[] = [];
    for (const key of assetKeys) {
      try {
        await deleteStorageObject(key);
      } catch (error) {
        cleanupErrors.push(error);
      }
    }
    if (cleanupErrors.length) {
      console.error(
        '[taon-cms-content] Unable to clean up permanently deleted assets',
        cleanupErrors,
      );
      contentError(
        'The post was deleted, but one or more asset files could not be removed.',
        500,
      );
    }
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
    return this.connection.transaction('SERIALIZABLE', async manager => {
      const current = await this.requireContent(id, manager);
      const revision =
        await this.taonCmsContentRevisionRepository.requireRevision(
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
        ...this.contentFields(
          revision.snapshot,
          await this.snapshotOf(current, manager),
        ),
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

  async listCourses(): Promise<TaonCmsContentEntity[]> {
    //#region @websqlFunc
    return this.connection
      .getRepository<TaonCmsContentEntity>(this.target)
      .createQueryBuilder('content')
      .innerJoin('content.relatedPosts', 'relatedPost')
      .where('content.status != :archived', { archived: 'archived' })
      .andWhere('content.thumbnailKey IS NOT NULL')
      .andWhere('content.thumbnailKey != :empty', { empty: '' })
      .distinct(true)
      .orderBy('content.id', 'ASC')
      .getMany();
    //#endregion
  }

  async listRelatedPosts(id: number): Promise<TaonCmsContentEntity[]> {
    //#region @websqlFunc
    requireContentId(id);
    return this.connection.transaction(
      async manager => (await this.requireContent(id, manager)).relatedPosts,
    );
    //#endregion
  }

  async listPublicVideoChildren(
    parentId: number,
  ): Promise<TaonCmsContentEntity[]> {
    //#region @websqlFunc
    requireContentId(parentId, 'parentId');
    return this.connection.transaction(async manager => {
      const parent = await this.requireContent(parentId, manager);
      const publicChildren: TaonCmsContentEntity[] = [];
      for (const child of parent.relatedPosts) {
        if (
          child.type !== TaonCmsContentType.Video ||
          child.status !== 'published' ||
          !child.videoKey
        ) {
          continue;
        }
        const permissions = await this.resolvePermissionConfiguration(
          child,
          manager,
        );
        if (!permissions.permissions?.length) {
          publicChildren.push(child);
        }
      }
      return publicChildren;
    });
    //#endregion
  }

  async getParentPost(id: number): Promise<TaonCmsContentEntity | null> {
    //#region @websqlFunc
    requireContentId(id);
    return this.connection.transaction(async manager => {
      const parents = await manager
        .getRepository<TaonCmsContentEntity>(this.target)
        .find({
          where: { relatedPosts: { id } },
          order: { id: 'ASC' },
        });
      if (parents.length > 1) {
        contentError('A post cannot have multiple parent posts.', 409);
      }
      return parents[0] ?? null;
    });
    //#endregion
  }

  async getPostVersions(id: number): Promise<TaonCmsPostVersionLinks> {
    //#region @websqlFunc
    requireContentId(id);
    return this.connection.transaction(async manager => {
      const repository = manager.getRepository<TaonCmsContentEntity>(
        this.target,
      );
      const post = await this.requireContent(id, manager);
      const [publicVersionPost, privateVersionPost] = await Promise.all([
        post.publicVersionPostId
          ? repository.findOneBy({ id: post.publicVersionPostId })
          : null,
        post.privateVersionPostId
          ? repository.findOneBy({ id: post.privateVersionPostId })
          : null,
      ]);
      const validPublicVersion = Boolean(
        publicVersionPost &&
          publicVersionPost.privateVersionPostId === post.id &&
          publicVersionPost.publicVersionPostId === null,
      );
      const validPrivateVersion = Boolean(
        privateVersionPost &&
          privateVersionPost.publicVersionPostId === post.id &&
          privateVersionPost.privateVersionPostId === null,
      );
      let staleLinksRemoved = false;
      if (post.publicVersionPostId && !validPublicVersion) {
        post.publicVersionPostId = null;
        staleLinksRemoved = true;
      }
      if (post.privateVersionPostId && !validPrivateVersion) {
        post.privateVersionPostId = null;
        staleLinksRemoved = true;
      }
      if (staleLinksRemoved) {
        await repository.update(id, {
          publicVersionPostId: post.publicVersionPostId,
          privateVersionPostId: post.privateVersionPostId,
          version: post.version + 1,
          updatedAt: new Date(),
        });
      }
      return {
        publicVersionPost: validPublicVersion ? publicVersionPost : null,
        privateVersionPost: validPrivateVersion ? privateVersionPost : null,
      };
    });
    //#endregion
  }

  async listPermissions(id: number): Promise<TaonPermissionEntity[]> {
    //#region @websqlFunc
    requireContentId(id);
    return (await this.getPermissionConfiguration(id)).permissions;
    //#endregion
  }

  async getPermissionConfiguration(
    id: number,
    skipTransaction = false,
  ): Promise<TaonCmsPermissionConfiguration> {
    //#region @websqlFunc
    requireContentId(id);
    if (skipTransaction) {
      const manager = this.connection.manager;
      const post = await this.requireContent(id, manager);
      return await this.resolvePermissionConfiguration(post, manager);
    }
    return this.connection.transaction(async manager => {
      const post = await this.requireContent(id, manager);
      return await this.resolvePermissionConfiguration(post, manager);
    });
    //#endregion
  }

  private async resolvePermissionConfiguration(
    post: TaonCmsContentEntity,
    manager: EntityManager,
  ): Promise<TaonCmsPermissionConfiguration> {
    //#region @websqlFunc
    const repository = manager.getRepository<TaonCmsContentEntity>(this.target);
    let source = post;
    const visited = new Set<number>();
    while (true) {
      if (visited.has(source.id)) {
        contentError('Permission inheritance contains a cycle.', 409);
      }
      visited.add(source.id);
      const parents = await repository.find({
        where: {
          applyPermissionsToRelatedPosts: true,
          relatedPosts: { id: source.id },
        },
        relations: { permissions: true },
      });
      if (parents.length > 1) {
        contentError(
          'A post cannot inherit permissions from multiple sources.',
          409,
        );
      }
      if (!parents.length) {
        return {
          permissions: source.permissions,
          source:
            source.id === post.id
              ? null
              : { id: source.id, title: source.title },
        };
      }
      source = parents[0];
    }
    //#endregion
  }

  private async validatePermissionInheritance(
    manager: EntityManager,
  ): Promise<void> {
    //#region @websqlFunc
    const parents = await manager
      .getRepository<TaonCmsContentEntity>(this.target)
      .find({
        where: { applyPermissionsToRelatedPosts: true },
        relations: { relatedPosts: true },
      });
    const sources = new Map<number, number>();
    for (const parent of parents) {
      for (const child of parent.relatedPosts) {
        if (sources.has(child.id)) {
          contentError(
            `Content ${child.id} would inherit permissions from multiple sources.`,
            409,
          );
        }
        sources.set(child.id, parent.id);
      }
    }
    for (const id of sources.keys()) {
      const visited = new Set<number>();
      let current: number | undefined = id;
      while (current !== undefined) {
        if (visited.has(current)) {
          contentError('Permission inheritance cannot contain cycles.', 409);
        }
        visited.add(current);
        current = sources.get(current);
      }
    }
    //#endregion
  }

  private async requireOwnPermissionEdit(
    id: number,
    permissionIds: number[],
    current: TaonCmsContentEntity,
    manager: EntityManager,
  ): Promise<void> {
    //#region @websqlFunc
    const configuration = await this.resolvePermissionConfiguration(
      current,
      manager,
    );
    const ownIds = new Set(
      current.permissions.map(permission => permission.id),
    );
    if (
      configuration.source &&
      (ownIds.size !== new Set(permissionIds).size ||
        permissionIds.some(permissionId => !ownIds.has(permissionId)))
    ) {
      contentError(
        `Content ${id} inherits permissions; edit the source post instead.`,
        409,
      );
    }
    //#endregion
  }

  async listApplicationHooks(): Promise<TaonCmsApplicationHookEntity[]> {
    //#region @websqlFunc
    return this.connection
      .getRepository(TaonCmsApplicationHookEntity)
      .find({ order: { hook: 'ASC' } });
    //#endregion
  }

  async getContentByHook(hook: string): Promise<string> {
    //#region @websqlFunc
    return (await this.getContentForHook(hook))?.body ?? '';
    //#endregion
  }

  async getContentForHook(hook: string): Promise<TaonCmsContentEntity | null> {
    //#region @websqlFunc
    if (!hook) {
      contentError('Application hook is required.');
    }
    const applicationHook = await this.connection
      .getRepository(TaonCmsApplicationHookEntity)
      .findOne({
        where: { hook: hook as TaonCmsApplicationHook },
        relations: { content: { permissions: true } },
      });
    return applicationHook?.content ?? null;
    //#endregion
  }

  //#region methods / media access
  async getContentBySlugForMedia(
    slug: string,
  ): Promise<TaonCmsContentEntity | null> {
    //#region @websqlFunc
    if (!slug) {
      contentError('Content slug is required.');
    }
    return this.connection
      .getRepository<TaonCmsContentEntity>(this.target)
      .findOne({
        where: { slug },
        relations: { permissions: true },
      });
    //#endregion
  }

  async isPublicMediaKey(key: string): Promise<boolean> {
    //#region @websqlFunc
    const contents = await this.connection
      .getRepository<TaonCmsContentEntity>(this.target)
      .find({
        where: [
          { videoKey: key },
          { audioKey: key },
          { attachmentKey: key },
          { thumbnailKey: key },
        ],
        relations: { permissions: true },
      });
    if (!contents.length) {
      return false;
    }
    for (const content of contents) {
      if (
        content.status !== 'published' ||
        (await this.getPermissionConfiguration(content.id)).permissions.length >
          0
      ) {
        return false;
      }
    }
    return true;
    //#endregion
  }
  //#endregion

  async isMediaKeyInUse(key: string): Promise<boolean> {
    //#region @websqlFunc
    return !!(await this.connection
      .getRepository<TaonCmsContentEntity>(this.target)
      .findOne({
        where: [
          { videoKey: key },
          { audioKey: key },
          { attachmentKey: key },
          { thumbnailKey: key },
        ],
        select: { id: true },
      }));
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

  async linkVersionPost(
    id: number,
    versionPostId: number,
    kind: TaonCmsPostVersionKind,
    expectedVersion: number,
  ): Promise<TaonCmsContentEntity> {
    //#region @websqlFunc
    requireContentId(id);
    requireContentId(versionPostId, 'versionPostId');
    requireContentVersion(expectedVersion);
    if (kind !== 'public' && kind !== 'private') {
      contentError('The post version kind is invalid.');
    }
    if (id === versionPostId) {
      contentError('A post cannot be its own version.');
    }
    return this.connection.transaction('SERIALIZABLE', async manager => {
      const repository = manager.getRepository<TaonCmsContentEntity>(
        this.target,
      );
      const post = await this.requireContent(id, manager);
      const versionPost = await this.requireContent(versionPostId, manager);
      if (post.version !== expectedVersion) {
        contentError('Content has changed. Reload it before editing.', 409);
      }
      const versionStatusAllowed =
        kind === 'public'
          ? versionPost.status === 'published' &&
            (post.status === 'draft' || post.status === 'archived')
          : (versionPost.status === 'draft' ||
              versionPost.status === 'archived') &&
            post.status === 'published';
      if (!versionStatusAllowed) {
        contentError('The selected post is not eligible for this version link.');
      }

      const currentVersionId =
        kind === 'public'
          ? post.publicVersionPostId
          : post.privateVersionPostId;
      const oppositeVersionId =
        kind === 'public'
          ? post.privateVersionPostId
          : post.publicVersionPostId;
      const reciprocalVersionId =
        kind === 'public'
          ? versionPost.privateVersionPostId
          : versionPost.publicVersionPostId;
      const oppositeReciprocalVersionId =
        kind === 'public'
          ? versionPost.publicVersionPostId
          : versionPost.privateVersionPostId;
      if (oppositeVersionId !== null) {
        contentError('This post is already linked to a different version.', 409);
      }
      if (
        (reciprocalVersionId !== null &&
          reciprocalVersionId !== post.id) ||
        oppositeReciprocalVersionId !== null
      ) {
        contentError('The selected post is already linked to another pair.', 409);
      }
      if (currentVersionId === versionPost.id) {
        return post;
      }

      const currentVersion = currentVersionId
        ? await repository.findOneBy({ id: currentVersionId })
        : null;
      if (currentVersion) {
        const oldReciprocal =
          kind === 'public'
            ? currentVersion.privateVersionPostId
            : currentVersion.publicVersionPostId;
        if (oldReciprocal !== post.id) {
          contentError('The existing post version link is conflicting.', 409);
        }
        await repository.update(currentVersion.id, {
          ...(kind === 'public'
            ? { privateVersionPostId: null }
            : { publicVersionPostId: null }),
          version: currentVersion.version + 1,
          updatedAt: new Date(),
        });
      }

      const now = new Date();
      await repository.update(post.id, {
        ...(kind === 'public'
          ? { publicVersionPostId: versionPost.id }
          : { privateVersionPostId: versionPost.id }),
        version: post.version + 1,
        updatedAt: now,
      });
      await repository.update(versionPost.id, {
        ...(kind === 'public'
          ? { privateVersionPostId: post.id }
          : { publicVersionPostId: post.id }),
        version: versionPost.version + 1,
        updatedAt: now,
      });
      return this.requireContent(post.id, manager);
    });
    //#endregion
  }

  async removeVersionPost(
    id: number,
    kind: TaonCmsPostVersionKind,
    expectedVersion: number,
  ): Promise<TaonCmsContentEntity> {
    //#region @websqlFunc
    requireContentId(id);
    requireContentVersion(expectedVersion);
    if (kind !== 'public' && kind !== 'private') {
      contentError('The post version kind is invalid.');
    }
    return this.connection.transaction('SERIALIZABLE', async manager => {
      const repository = manager.getRepository<TaonCmsContentEntity>(
        this.target,
      );
      const post = await this.requireContent(id, manager);
      if (post.version !== expectedVersion) {
        contentError('Content has changed. Reload it before editing.', 409);
      }
      const canEditVersion =
        kind === 'public'
          ? post.status === 'draft' || post.status === 'archived'
          : post.status === 'published';
      if (!canEditVersion) {
        contentError(
          'Version editing is disabled for the current post status.',
          409,
        );
      }
      const versionPostId =
        kind === 'public'
          ? post.publicVersionPostId
          : post.privateVersionPostId;
      if (!versionPostId) {
        return post;
      }
      const versionPost = await repository.findOneBy({ id: versionPostId });
      if (versionPost) {
        const reciprocalVersionId =
          kind === 'public'
            ? versionPost.privateVersionPostId
            : versionPost.publicVersionPostId;
        if (reciprocalVersionId !== post.id) {
          contentError('The post version link is conflicting.', 409);
        }
        await repository.update(versionPost.id, {
          ...(kind === 'public'
            ? { privateVersionPostId: null }
            : { publicVersionPostId: null }),
          version: versionPost.version + 1,
          updatedAt: new Date(),
        });
      }
      await repository.update(post.id, {
        ...(kind === 'public'
          ? { publicVersionPostId: null }
          : { privateVersionPostId: null }),
        version: post.version + 1,
        updatedAt: new Date(),
      });
      return this.requireContent(post.id, manager);
    });
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
    return this.connection.transaction('SERIALIZABLE', async manager => {
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

  async requireContent(
    id: number,
    manager: EntityManager,
  ): Promise<TaonCmsContentEntity> {
    //#region @websqlFunc
    const content = await manager
      .getRepository<TaonCmsContentEntity>(this.target)
      .findOne({
        where: { id },
        relations: {
          relatedPosts: true,
          permissions: true,
          applicationHook: true,
        },
      });
    if (!content) {
      contentError(`Content ${id} does not exist.`, 404);
    }
    await this.taonCmsContentRevisionRepository.applyRelatedPostOrder(
      content,
      manager,
    );
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
        input.videoKey === undefined
          ? (current?.videoKey ?? null)
          : input.videoKey,
      audioKey:
        input.audioKey === undefined
          ? (current?.audioKey ?? null)
          : input.audioKey,
      attachmentKey:
        input.attachmentKey === undefined
          ? (current?.attachmentKey ?? null)
          : input.attachmentKey,
      thumbnailKey:
        input.thumbnailKey === undefined
          ? (current?.thumbnailKey ?? null)
          : input.thumbnailKey,
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
      applyPermissionsToRelatedPosts:
        input.applyPermissionsToRelatedPosts ??
        current?.applyPermissionsToRelatedPosts ??
        false,
      applyVisibilityToRelatedPosts:
        input.applyVisibilityToRelatedPosts ??
        current?.applyVisibilityToRelatedPosts ??
        false,
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
      tagIds: await this.taonCmsContentTagRepository.findTagIds(
        content.id,
        manager,
      ),
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
      await this.taonCmsCategoryRepository.requireCategory(
        fields.categoryId,
        manager,
      );
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
    const added = relatedPostIds.filter(
      postId => !previousIds.includes(postId),
    );
    const removed = previousIds.filter(
      postId => !relatedPostIds.includes(postId),
    );
    for (const relatedPostId of added) {
      const parents = await repository.find({
        where: { relatedPosts: { id: relatedPostId } },
        select: { id: true },
      });
      if (parents.some(parent => parent.id !== id)) {
        contentError('A post cannot have multiple parent posts.', 409);
      }
      if (await this.relatedPostPathExists(relatedPostId, id, manager)) {
        contentError('Related posts cannot contain circular relationships.', 409);
      }
    }
    if (added.length || removed.length) {
      await repository
        .createQueryBuilder()
        .relation('relatedPosts')
        .of(id)
        .addAndRemove(added, removed);
    }
    //#endregion
  }

  private async relatedPostPathExists(
    startId: number,
    targetId: number,
    manager: EntityManager,
  ): Promise<boolean> {
    //#region @websqlFunc
    const repository = manager.getRepository<TaonCmsContentEntity>(this.target);
    const pending = [startId];
    const visited = new Set<number>();
    while (pending.length) {
      const currentId = pending.pop();
      if (currentId === undefined) {
        continue;
      }
      if (currentId === targetId) {
        return true;
      }
      if (visited.has(currentId)) {
        continue;
      }
      visited.add(currentId);
      const current = await repository.findOne({
        where: { id: currentId },
        relations: { relatedPosts: true },
      });
      pending.push(...(current?.relatedPosts ?? []).map(post => post.id));
    }
    return false;
    //#endregion
  }

  private async replacePermissions(
    id: number,
    permissionIds: number[],
    previousIds: number[],
    manager: EntityManager,
  ): Promise<void> {
    //#region @websqlFunc
    const added = permissionIds.filter(
      permissionId => !previousIds.includes(permissionId),
    );
    const removed = previousIds.filter(
      permissionId => !permissionIds.includes(permissionId),
    );
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

  private async replaceApplicationHook(
    contentId: number,
    hook: TaonCmsApplicationHook | null,
    manager: EntityManager,
  ): Promise<void> {
    //#region @websqlFunc
    const repository = manager.getRepository(TaonCmsApplicationHookEntity);
    const current = await repository.findOneBy({ contentId });
    if (hook === null) {
      if (current) {
        current.contentId = null;
        await repository.save(current);
      }
      return;
    }
    const target = await repository.findOneBy({ hook });
    if (!target) {
      contentError(`Application hook "${hook}" is not configured.`, 404);
    }
    if (target.contentId !== null && target.contentId !== contentId) {
      contentError(`Application hook "${hook}" is already in use.`, 409);
    }
    if (current?.id === target.id) {
      return;
    }
    if (current) {
      current.contentId = null;
      await repository.save(current);
    }
    target.contentId = contentId;
    await repository.save(target);
    //#endregion
  }

  private async commitUpdate(
    current: TaonCmsContentEntity,
    expectedVersion: number,
    snapshot: TaonCmsContentSnapshot,
    manager: EntityManager,
    applicationHook?: TaonCmsApplicationHook | null,
    propagateVisibility = true,
  ): Promise<TaonCmsContentEntity> {
    //#region @websqlFunc
    if (current.version !== expectedVersion) {
      contentError('Content has changed. Reload it before editing.', 409);
    }
    await this.requireOwnPermissionEdit(
      current.id,
      snapshot.permissionIds,
      current,
      manager,
    );
    await this.validateReferences(
      snapshot,
      snapshot.tagIds,
      snapshot.permissionIds,
      manager,
    );
    await this.requireAvailableSlug(snapshot.slug, manager, current.id);
    // Preserve the first pre-API version before replacing it.
    const history = await this.taonCmsContentRevisionRepository.listForContent(
      current.id,
      manager,
    );
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
    await this.taonCmsContentTagRepository.replaceTags(
      current.id,
      snapshot.tagIds,
      manager,
    );
    await this.replaceRelatedPosts(
      current.id,
      [...new Set(snapshot.relatedPostIds ?? [])],
      current.relatedPosts.map(post => post.id),
      manager,
    );
    await this.validatePermissionInheritance(manager);
    await this.replacePermissions(
      current.id,
      [...new Set(snapshot.permissionIds ?? [])],
      current.permissions.map(permission => permission.id),
      manager,
    );
    if (applicationHook !== undefined) {
      await this.replaceApplicationHook(current.id, applicationHook, manager);
    }
    const updated = await this.requireContent(current.id, manager);
    // The join table has no order; the revision snapshot is the saved sequence.
    const relatedPostIds = [...new Set(snapshot.relatedPostIds ?? [])];
    TaonCmsContentUtils.orderRelatedPosts(updated.relatedPosts, relatedPostIds);
    await this.taonCmsContentRevisionRepository.recordContent(
      updated,
      {
        ...fields,
        tagIds: snapshot.tagIds,
        relatedPostIds,
        relatedPostOrderSaved: true,
        permissionIds: updated.permissions.map(permission => permission.id),
      },
      manager,
    );
    if (propagateVisibility) {
      const visibility = await this.resolveVisibilityConfiguration(
        updated,
        manager,
      );
      if (snapshot.applyVisibilityToRelatedPosts || visibility.source) {
        await this.propagateVisibilityToRelatedPosts(
          updated.id,
          snapshot.status,
          manager,
          new Set([updated.id]),
        );
      }
    }
    return updated;
    //#endregion
  }

  private async propagateVisibilityToRelatedPosts(
    parentId: number,
    status: TaonCmsContentFields['status'],
    manager: EntityManager,
    visited: Set<number>,
  ): Promise<void> {
    //#region @websqlFunc
    const parent = await this.requireContent(parentId, manager);
    for (const relatedPost of parent.relatedPosts ?? []) {
      if (visited.has(relatedPost.id)) {
        contentError(
          'Related posts cannot contain circular relationships.',
          409,
        );
      }
      visited.add(relatedPost.id);
      const child = await this.requireContent(relatedPost.id, manager);
      if (child.status !== status) {
        const snapshot = await this.snapshotOf(child, manager);
        const previousStatus = snapshot.status;
        snapshot.status = status;
        if (status === 'published' && previousStatus !== 'published') {
          snapshot.publishedAt = new Date();
        }
        await this.commitUpdate(
          child,
          child.version,
          snapshot,
          manager,
          undefined,
          false,
        );
      }
      await this.propagateVisibilityToRelatedPosts(
        child.id,
        status,
        manager,
        visited,
      );
    }
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
