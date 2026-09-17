import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Taon, TaonBaseAngularService } from 'taon/src';

import type { TaonCmsTagEntity } from './taon-cms-tag.entity';
import { TaonCmsTagController } from './taon-cms-tag.controller';

@Injectable()
export class TaonCmsTagApiService extends TaonBaseAngularService {
  private taonCmsTagController = this.injectController(TaonCmsTagController);

  public get allMyEntities$(): Observable<TaonCmsTagEntity[]> {
    return this.taonCmsTagController.getAll().request!().observable.pipe(
      map(res => res.body?.json),
    );
  }

  public helloWorld(user:string): Observable<string> {
    return this.taonCmsTagController.helloWord(user).request!().observable.pipe(
      map(res => res.responseText as string),
    );
  }
}