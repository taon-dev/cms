import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Taon, TaonBaseAngularService } from 'taon/src';

import type { TaonCmsContentEntity } from './taon-cms-content.entity';
import { TaonCmsContentController } from './taon-cms-content.controller';

@Injectable()
export class TaonCmsContentApiService extends TaonBaseAngularService {
  private taonCmsContentController = this.injectController(TaonCmsContentController);

  public get allMyEntities$(): Observable<TaonCmsContentEntity[]> {
    return this.taonCmsContentController.getAll().request!().observable.pipe(
      map(res => res.body?.json),
    );
  }

  public helloWorld(user:string): Observable<string> {
    return this.taonCmsContentController.helloWord(user).request!().observable.pipe(
      map(res => res.responseText as string),
    );
  }
}