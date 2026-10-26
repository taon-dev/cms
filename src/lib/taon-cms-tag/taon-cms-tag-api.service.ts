import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Taon, TaonBaseAngularService } from 'taon/src';

import type { TaonCmsTagEntity } from './taon-cms-tag.entity';
import { TaonCmsTagController } from './taon-cms-tag.controller';
import type { TaonCmsTaxonomyFields } from '../taon-cms-category/taon-cms-taxonomy.validation';

@Injectable()
export class TaonCmsTagApiService extends TaonBaseAngularService {
  private readonly taonCmsTagController =
    this.injectController(TaonCmsTagController);

  get allMyEntities$(): Observable<TaonCmsTagEntity[]> {
    return this.taonCmsTagController
      .getAll()
      .request()
      .observable.pipe(map(res => res.body.json));
  }

  save(
    id: number | null,
    input: TaonCmsTaxonomyFields,
  ): Observable<TaonCmsTagEntity> {
    return this.taonCmsTagController
      .saveTag(id, input)
      .request()
      .observable.pipe(map(res => res.body.json));
  }

  delete(id: number): Observable<void> {
    return this.taonCmsTagController
      .deleteTag(id)
      .request()
      .observable.pipe(map(() => undefined));
  }
}
