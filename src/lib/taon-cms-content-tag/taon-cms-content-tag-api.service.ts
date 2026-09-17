import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Taon, TaonBaseAngularService } from 'taon/src';

import type { TaonCmsContentTagEntity } from './taon-cms-content-tag.entity';
import { TaonCmsContentTagController } from './taon-cms-content-tag.controller';

@Injectable()
export class TaonCmsContentTagApiService extends TaonBaseAngularService {
  private taonCmsContentTagController = this.injectController(TaonCmsContentTagController);

  public get allMyEntities$(): Observable<TaonCmsContentTagEntity[]> {
    return this.taonCmsContentTagController.getAll().request!().observable.pipe(
      map(res => res.body?.json),
    );
  }

  public helloWorld(user:string): Observable<string> {
    return this.taonCmsContentTagController.helloWord(user).request!().observable.pipe(
      map(res => res.responseText as string),
    );
  }
}