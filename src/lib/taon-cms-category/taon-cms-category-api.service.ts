import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Taon, TaonBaseAngularService } from 'taon/src';

import type { TaonCmsCategoryEntity } from './taon-cms-category.entity';
import { TaonCmsCategoryController } from './taon-cms-category.controller';

@Injectable()
export class TaonCmsCategoryApiService extends TaonBaseAngularService {
  private taonCmsCategoryController = this.injectController(
    TaonCmsCategoryController,
  );

  public get allMyEntities$(): Observable<TaonCmsCategoryEntity[]> {
    return this.taonCmsCategoryController.getAll().request!().observable.pipe(
      map(res => res.body?.json),
    );
  }
}
