import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Taon, TaonBaseAngularService } from 'taon/src';

import type { TaonCmsContentRevisionEntity } from '../taon-cms-content-revision/taon-cms-content-revision.entity';

import { TaonCmsContentController } from './taon-cms-content.controller';
import type { TaonCmsContentEntity } from './taon-cms-content.entity';
import type {
  TaonCmsCreateContent,
  TaonCmsRestoreContent,
  TaonCmsUpdateContent,
} from './taon-cms-content.models';

@Injectable()
export class TaonCmsContentApiService extends TaonBaseAngularService {
  public readonly taonCmsContentController = this.injectController(
    TaonCmsContentController,
  );

  public createContent(
    input: TaonCmsCreateContent,
  ): Observable<TaonCmsContentEntity> {
    return this.taonCmsContentController.createContent(input)
      .request!().observable.pipe(map(res => res.body.json));
  }

  public updateContent(
    id: number,
    input: TaonCmsUpdateContent,
  ): Observable<TaonCmsContentEntity> {
    return this.taonCmsContentController.updateContent(id, input)
      .request!().observable.pipe(map(res => res.body.json));
  }

  public deleteContent(
    id: number,
    expectedVersion: number,
  ): Observable<TaonCmsContentEntity> {
    return this.taonCmsContentController.deleteContent(id, expectedVersion)
      .request!().observable.pipe(map(res => res.body.json));
  }

  public restoreContent(
    id: number,
    input: TaonCmsRestoreContent,
  ): Observable<TaonCmsContentEntity> {
    return this.taonCmsContentController.restoreContent(id, input)
      .request!().observable.pipe(map(res => res.body.json));
  }

  public listRevisions(id: number): Observable<TaonCmsContentRevisionEntity[]> {
    return this.taonCmsContentController.listRevisions(id)
      .request!().observable.pipe(map(res => res.body.json));
  }

  public get allMyEntities$(): Observable<TaonCmsContentEntity[]> {
    return this.taonCmsContentController.getAll().request!().observable.pipe(
      map(res => res.body?.json),
    );
  }
}
