import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Taon, TaonBaseAngularService } from 'taon/src';

import type { TaonCmsCategoryEntity } from './taon-cms-category.entity';
import { TaonCmsCategoryController } from './taon-cms-category.controller';
import type { TaonCmsCategoryFields } from './taon-cms-taxonomy.validation';

@Injectable()
export class TaonCmsCategoryApiService extends TaonBaseAngularService {
  protected readonly taonCmsCategoryController = this.injectController(
    TaonCmsCategoryController,
  );

  public get allMyEntities$(): Observable<TaonCmsCategoryEntity[]> {
    return this.taonCmsCategoryController.getAll().request!().observable.pipe(
      map(res => res.body?.json),
    );
  }

  save(
    id: number | null,
    input: TaonCmsCategoryFields,
  ): Observable<TaonCmsCategoryEntity> {
    return this.taonCmsCategoryController
      .saveCategory(id, input)
      .request()
      .observable.pipe(map(res => res.body.json));
  }

  delete(id: number): Observable<void> {
    return this.taonCmsCategoryController
      .deleteCategory(id)
      .request()
      .observable.pipe(map(() => undefined));
  }
}
