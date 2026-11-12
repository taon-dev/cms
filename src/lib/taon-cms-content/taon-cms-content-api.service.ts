//#region imports
import { Injectable } from '@angular/core';
import type { TaonPermissionEntity } from '@taon-dev/session/src';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Taon, TaonBaseAngularService, TaonStorageObject } from 'taon/src';

import type { TaonCmsApplicationHookEntity } from '../taon-cms-application-hook/taon-cms-application-hook.entity';
import { TaonCmsApplicationHook } from '../taon-cms-application-hooks';
import type { TaonCmsContentRevisionEntity } from '../taon-cms-content-revision/taon-cms-content-revision.entity';

import { TaonCmsContentStorageController } from './taon-cms-content-storage.controller';
import { TAON_CMS_MAX_UPLOAD_BYTES } from './taon-cms-content.constants';
import { TaonCmsContentController } from './taon-cms-content.controller';
import type { TaonCmsContentEntity } from './taon-cms-content.entity';
import type {
  TaonCmsCreateContent,
  TaonCmsCreateRelatedChildInput,
  TaonCmsCreateRelatedChildResult,
  TaonCmsPublicVideoChild,
  TaonCmsRestoreContent,
  TaonCmsUpdateContent,
  TaonCmsPermissionConfiguration,
  TaonCmsPostVersionKind,
  TaonCmsPostVersionLinks,
  TaonCmsVisibilityConfiguration,
} from './taon-cms-content.models';

//#endregion

@Injectable()
export class TaonCmsContentApiService<
  HOOKS extends TaonCmsApplicationHook = TaonCmsApplicationHook,
> extends TaonBaseAngularService {
  //#region fields & getters
  protected readonly taonCmsContentController = this.inject(
    TaonCmsContentController,
  );

  protected readonly taonCmsContentStorageController = this.inject(
    TaonCmsContentStorageController,
  );

  public get crudController(): TaonCmsContentController {
    return this.taonCmsContentController;
  }

  public get frontendUrl(): string {
    return this.ctx.frontendHostUri.origin;
  }

  public getPostUrl(slug: string): string {
    return `${this.frontendUrl}/posts/${encodeURIComponent(slug)}`;
  }
  //#endregion

  //#region API / get by id
  public async getById(id: number): Promise<TaonCmsContentEntity> {
    return (await this.taonCmsContentController.getBy(id).request()).body.json;
  }
  //#endregion

  //#region API / get by slug
  public async getBySlug(slug: string): Promise<TaonCmsContentEntity> {
    return (await this.taonCmsContentController.getBySlug(slug).request()).body
      .json;
  }
  //#endregion

  public async getPublicBySlug(slug: string): Promise<TaonCmsContentEntity> {
    const response =
      await this.taonCmsContentController.getPublicBySlug(slug).request!();
    if (response.statusCode >= 400 || !response.body?.json) {
      throw new Error(response.responseText || 'The post could not be loaded.');
    }
    return response.body.json;
  }

  public async getJsonTableBySlug(
    slug: string,
  ): Promise<Record<string, unknown>[]> {
    const response =
      await this.taonCmsContentController.getJsonTableBySlug(slug).request!();
    if (response.statusCode >= 400 || !Array.isArray(response.body?.json)) {
      throw new Error(
        response.responseText || 'The JSON Table could not be loaded.',
      );
    }
    return response.body.json;
  }

  public getPublicJsonTableBySlug(
    slug: string,
  ): Observable<Record<string, unknown>[]> {
    return this.taonCmsContentController.getPublicJsonTableBySlug(slug)
      .request!().observable.pipe(
      map(c => c.body.json as Record<string, unknown>[]),
      catchError(error => {
        console.error(`Failed to load JSON table "${slug}":`, error);
        return of([] as Record<string, unknown>[]);
      }),
    );
  }

  public getPublicExcerptBySlug(slug: string): Observable<string> {
    return this.taonCmsContentController.getPublicExcerptBySlug(slug)
      .request!().observable.pipe(
      map(c => c.body.text),
      catchError(error => {
        console.error(`Failed to load JSON table "${slug}":`, error);
        return '---';
      }),
    );
  }

  public getPublicVideoChildrenBySlug(
    slug: string,
  ): Observable<TaonCmsPublicVideoChild[]> {
    return this.taonCmsContentController.getPublicVideoChildrenBySlug(slug)
      .request!().observable.pipe(
      map(c => c.body.json as TaonCmsPublicVideoChild[]),
      catchError(error => {
        console.error(
          `Failed to load public video children for "${slug}":`,
          error,
        );
        return of([] as TaonCmsPublicVideoChild[]);
      }),
    );
  }

  //#region API / get video link by slug
  /**
   * Get link to private video
   */
  public getVideoLinkBySlug(slug: string): Observable<string> {
    return this.taonCmsContentController
      .getVideoLinkBySlug(slug)
      .request()
      .observable.pipe(
        map(res => res.body.text),
        catchError(err => {
          console.error(err);
          return of('');
        }),
      );
  }
  //#endregion

  //#region API / get public video link by slug
  public async getPublicVideoLinkBySlug(slug: string): Promise<string> {
    return (
      await this.taonCmsContentController
        .getPublicVideoLinkBySlug(slug)
        .request()
    ).body.text;
  }
  //#endregion

  //#region API / get audio link by slug
  public getAudioLinkBySlug(slug: string): Observable<string> {
    return this.taonCmsContentController
      .getAudioLinkBySlug(slug)
      .request()
      .observable.pipe(
        map(res => res.body.text),
        catchError(err => {
          console.error(err);
          return of('');
        }),
      );
  }
  //#endregion

  //#region API / get public audio link by slug
  public async getPublicAudioLinkBySlug(slug: string): Promise<string> {
    return (
      await this.taonCmsContentController
        .getPublicAudioLinkBySlug(slug)
        .request()
    ).body.text;
  }
  //#endregion

  //#region API / get attachment link by slug
  public async getAttachmentLinkBySlug(slug: string): Promise<string> {
    return (
      await this.taonCmsContentController
        .getAttachmentLinkBySlug(slug)
        .request()
    ).body.text;
  }
  //#endregion

  //#region API / get public attachment link by slug
  public async getPublicAttachmentLinkBySlug(slug: string): Promise<string> {
    return (
      await this.taonCmsContentController
        .getPublicAttachmentLinkBySlug(slug)
        .request()
    ).body.text;
  }
  //#endregion

  //#region API / get content by hook
  public getContentByHook(hook: HOOKS): Observable<string> {
    return this.taonCmsContentController.getContentByHook(hook)
      .request!().observable.pipe(map(res => res.body.text));
  }
  //#endregion

  //#region API / get public content by hook
  public getPublicContentByHook(hook: HOOKS): Observable<string> {
    return this.taonCmsContentController.getPublicContentByHook(hook)
      .request!().observable.pipe(
      map(res => (res.body.text || '')?.replace(/\\n/g, '\n')),
      catchError(() => of('---')),
    );
  }
  //#endregion

  //#region API / list application hooks
  public listApplicationHooks(): Observable<TaonCmsApplicationHookEntity[]> {
    return this.taonCmsContentController.listApplicationHooks()
      .request!().observable.pipe(map(res => res.body.json));
  }
  //#endregion

  //#region API / upload media
  public async uploadMedia(
    file: File,
    onProgress?: (percentage: number) => void,
    signal?: AbortSignal,
  ): Promise<TaonStorageObject> {
    if (file.size > TAON_CMS_MAX_UPLOAD_BYTES) {
      throw new Error(
        `The file "${file.name}" is too large. The maximum upload size is 1 GB.`,
      );
    }
    const objects =
      await this.taonCmsContentStorageController.uploadFileInChunks(file, {
        fileName: file.name,
        contentType: file.type || 'application/octet-stream',
        signal,
        onProgress,
      });
    if (!Array.isArray(objects) || objects.length !== 1 || !objects[0]?.key) {
      throw new Error('The upload did not return a media key.');
    }
    onProgress?.(100);
    return objects[0];
  }
  //#endregion

  public async deleteUnattachedMedia(key: string): Promise<boolean> {
    return (
      await this.taonCmsContentStorageController
        .deleteUnattachedMedia(key)
        .request()
    ).body.json;
  }

  //#region API / list assets
  public listAssets(): Observable<TaonStorageObject[]> {
    return this.taonCmsContentStorageController
      .list({})
      .request()
      .observable.pipe(map(res => res.body.json));
  }
  //#endregion

  //#region API / get asset url
  public async getAssetUrl(key: string): Promise<string> {
    return (
      await this.taonCmsContentStorageController
        .getPrivateUrl(key, { expiresInSeconds: 5 * 60 })
        .request()
    ).body.text;
  }
  //#endregion

  //#region API / create content
  public listTagIds(id: number): Observable<number[]> {
    return this.taonCmsContentController
      .listTagIds(id)
      .request()
      .observable.pipe(map(res => res.body.json));
  }

  public async getThumbnailLinkBySlug(
    slug: string,
    publicOnly = false,
  ): Promise<string> {
    const response = publicOnly
      ? await this.taonCmsContentController
          .getPublicThumbnailLinkBySlug(slug)
          .request()
      : await this.taonCmsContentController
          .getThumbnailLinkBySlug(slug)
          .request();
    return response.body.text;
  }

  public createContent(
    input: TaonCmsCreateContent,
  ): Observable<TaonCmsContentEntity> {
    return this.taonCmsContentController.createContent(input)
      .request!().observable.pipe(map(res => res.body.json));
  }
  //#endregion

  public async createRelatedChild(
    parentId: number,
    input: TaonCmsCreateRelatedChildInput,
  ): Promise<TaonCmsCreateRelatedChildResult> {
    return (
      await this.taonCmsContentController
        .createRelatedChild(parentId, input)
        .request()
    ).body.json;
  }

  //#region API / duplicate content
  public duplicateContent(
    id: number,
    includeChildren = false,
  ): Observable<TaonCmsContentEntity> {
    return this.taonCmsContentController.duplicateContent(id, includeChildren)
      .request!().observable.pipe(map(res => res.body.json));
  }
  //#endregion

  //#region API / update content
  public updateContent(
    id: number,
    input: TaonCmsUpdateContent,
  ): Observable<TaonCmsContentEntity> {
    return this.taonCmsContentController.updateContent(id, input)
      .request!().observable.pipe(map(res => res.body.json));
  }
  //#endregion

  //#region API / delete content
  public deleteContent(
    id: number,
    expectedVersion: number,
  ): Observable<TaonCmsContentEntity> {
    return this.taonCmsContentController.deleteContent(id, expectedVersion)
      .request!().observable.pipe(map(res => res.body.json));
  }
  //#endregion

  public permanentlyDeleteContent(
    id: number,
    expectedVersion: number,
  ): Observable<boolean> {
    return this.taonCmsContentController.permanentlyDeleteContent(
      id,
      expectedVersion,
    ).request!().observable.pipe(map(res => res.body.json));
  }

  //#region API / restore content
  public restoreContent(
    id: number,
    input: TaonCmsRestoreContent,
  ): Observable<TaonCmsContentEntity> {
    return this.taonCmsContentController.restoreContent(id, input)
      .request!().observable.pipe(map(res => res.body.json));
  }
  //#endregion

  //#region API / list revisions
  public listRevisions(id: number): Observable<TaonCmsContentRevisionEntity[]> {
    return this.taonCmsContentController.listRevisions(id)
      .request!().observable.pipe(map(res => res.body.json));
  }
  //#endregion

  //#region API / list related posts
  public listCourses(): Observable<TaonCmsContentEntity[]> {
    return this.taonCmsContentController.listCourses()
      .request!().observable.pipe(map(res => res.body.json));
  }

  public listRelatedPosts(id: number): Observable<TaonCmsContentEntity[]> {
    return this.taonCmsContentController.listRelatedPosts(id)
      .request!().observable.pipe(map(res => res.body.json));
  }
  //#endregion

  public async getParentPost(id: number): Promise<TaonCmsContentEntity | null> {
    return (await this.taonCmsContentController.getParentPost(id).request())
      .body.json;
  }

  public async getVisibilityConfiguration(
    id: number,
  ): Promise<TaonCmsVisibilityConfiguration> {
    return (
      await this.taonCmsContentController
        .getVisibilityConfiguration(id)
        .request()
    ).body.json;
  }

  public async getPostVersions(id: number): Promise<TaonCmsPostVersionLinks> {
    return (await this.taonCmsContentController.getPostVersions(id).request())
      .body.json;
  }

  //#region API / list permissions
  public listPermissions(id: number): Observable<TaonPermissionEntity[]> {
    return this.taonCmsContentController.listPermissions(id)
      .request!().observable.pipe(map(res => res.body.json));
  }
  //#endregion

  //#region API / get permission configuration
  public getPermissionConfiguration(
    id: number,
  ): Observable<TaonCmsPermissionConfiguration> {
    return this.taonCmsContentController.getPermissionConfiguration(id)
      .request!().observable.pipe(map(res => res.body.json));
  }
  //#endregion

  //#region API / add related post
  public addRelatedPost(
    id: number,
    relatedPostId: number,
    expectedVersion: number,
  ): Observable<TaonCmsContentEntity> {
    return this.taonCmsContentController.addRelatedPost(
      id,
      relatedPostId,
      expectedVersion,
    ).request!().observable.pipe(map(res => res.body.json));
  }
  //#endregion

  //#region API / delete related post
  public deleteRelatedPost(
    id: number,
    relatedPostId: number,
    expectedVersion: number,
  ): Observable<TaonCmsContentEntity> {
    return this.taonCmsContentController.deleteRelatedPost(
      id,
      relatedPostId,
      expectedVersion,
    ).request!().observable.pipe(map(res => res.body.json));
  }
  //#endregion

  public linkVersionPost(
    id: number,
    versionPostId: number,
    kind: TaonCmsPostVersionKind,
    expectedVersion: number,
  ): Observable<TaonCmsContentEntity> {
    return this.taonCmsContentController.linkVersionPost(
      id,
      versionPostId,
      kind,
      expectedVersion,
    ).request!().observable.pipe(map(res => res.body.json));
  }

  public removeVersionPost(
    id: number,
    kind: TaonCmsPostVersionKind,
    expectedVersion: number,
  ): Observable<TaonCmsContentEntity> {
    return this.taonCmsContentController.removeVersionPost(
      id,
      kind,
      expectedVersion,
    ).request!().observable.pipe(map(res => res.body.json));
  }

  //#region API / get all entites
  /**
   * TODO not good idea if manu posts - refactor later:
   *  - add pagination for post selector
   */
  public get allMyEntities$(): Observable<TaonCmsContentEntity[]> {
    return this.taonCmsContentController.getAll().request!().observable.pipe(
      map(res => res.body?.json),
    );
  }
  //#endregion
}
