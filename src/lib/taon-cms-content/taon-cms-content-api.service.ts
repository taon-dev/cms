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
import { TaonCmsContentController } from './taon-cms-content.controller';
import type { TaonCmsContentEntity } from './taon-cms-content.entity';
import type {
  TaonCmsCreateContent,
  TaonCmsRestoreContent,
  TaonCmsUpdateContent,
  TaonCmsPermissionConfiguration,
} from './taon-cms-content.models';
import { trackCmsUpload } from './taon-cms-upload-progress';

//#endregion

@Injectable()
export class TaonCmsContentApiService<
  HOOKS extends TaonCmsApplicationHook = TaonCmsApplicationHook,
> extends TaonBaseAngularService {
  //#region fields & getters
  protected readonly taonCmsContentController = this.injectController(
    TaonCmsContentController,
  );

  protected readonly taonCmsContentStorageController = this.injectController(
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
      map(res => res.body.text),
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
  ): Promise<TaonStorageObject> {
    const formData = new FormData();
    formData.append('file', file);
    const stopTracking = onProgress
      ? trackCmsUpload(
          this.taonCmsContentStorageController.getThisControllerMethodFullUrl(
            'uploadFormDataToServer',
          ),
          formData,
          onProgress,
        )
      : undefined;
    try {
      const response = await this.taonCmsContentStorageController
        .uploadFormDataToServer(formData)
        .request();
      const objects = response.body.json;
      if (!Array.isArray(objects) || objects.length !== 1 || !objects[0]?.key) {
        throw new Error('The upload did not return a media key.');
      }
      onProgress?.(100);
      return objects[0];
    } finally {
      stopTracking?.();
    }
  }
  //#endregion

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

  //#region API / duplicate content
  public duplicateContent(id: number): Observable<TaonCmsContentEntity> {
    return this.taonCmsContentController.duplicateContent(id)
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
