import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Taon, TaonBaseAngularService } from 'taon/src';

import type { TaonCmsContentRevisionEntity } from './taon-cms-content-revision.entity';
import { TaonCmsContentRevisionController } from './taon-cms-content-revision.controller';

@Injectable()
export class TaonCmsContentRevisionApiService extends TaonBaseAngularService {
  private taonCmsContentRevisionController = this.injectController(TaonCmsContentRevisionController);

  public get allMyEntities$(): Observable<TaonCmsContentRevisionEntity[]> {
    return this.taonCmsContentRevisionController.getAll().request!().observable.pipe(
      map(res => res.body?.json),
    );
  }

  public helloWorld(user:string): Observable<string> {
    return this.taonCmsContentRevisionController.helloWord(user).request!().observable.pipe(
      map(res => res.responseText as string),
    );
  }
}