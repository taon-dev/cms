import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Taon, TaonBaseAngularService } from 'taon/src';

import { TaonCmsContentController } from '../taon-cms-content/taon-cms-content.controller';
import type { TaonCmsContentEntity } from '../taon-cms-content/taon-cms-content.entity';
import type { TaonCmsRestoreContent } from '../taon-cms-content/taon-cms-content.models';

import type { TaonCmsContentRevisionEntity } from './taon-cms-content-revision.entity';
import { TaonCmsContentRevisionController } from './taon-cms-content-revision.controller';

@Injectable()
export class TaonCmsContentRevisionApiService extends TaonBaseAngularService {
  private readonly contentController = this.injectController(
    TaonCmsContentController,
  );

  private taonCmsContentRevisionController = this.injectController(
    TaonCmsContentRevisionController,
  );

  public listRevisions(id: number): Observable<TaonCmsContentRevisionEntity[]> {
    return this.contentController.listRevisions(id)
      .request!().observable.pipe(map(res => res.body.json));
  }

  public restoreContent(
    id: number,
    input: TaonCmsRestoreContent,
  ): Observable<TaonCmsContentEntity> {
    return this.contentController.restoreContent(id, input)
      .request!().observable.pipe(map(res => res.body.json));
  }

  public get allMyEntities$(): Observable<TaonCmsContentRevisionEntity[]> {
    return this.taonCmsContentRevisionController.getAll()
      .request!().observable.pipe(map(res => res.body?.json));
  }
}
