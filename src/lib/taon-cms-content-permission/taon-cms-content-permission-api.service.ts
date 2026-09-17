import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Taon, TaonBaseAngularService } from 'taon/src';

import type { TaonCmsContentPermissionEntity } from './taon-cms-content-permission.entity';
import { TaonCmsContentPermissionController } from './taon-cms-content-permission.controller';

@Injectable()
export class TaonCmsContentPermissionApiService extends TaonBaseAngularService {
  private taonCmsContentPermissionController = this.injectController(TaonCmsContentPermissionController);

  public get allMyEntities$(): Observable<TaonCmsContentPermissionEntity[]> {
    return this.taonCmsContentPermissionController.getAll().request!().observable.pipe(
      map(res => res.body?.json),
    );
  }

  public helloWorld(user:string): Observable<string> {
    return this.taonCmsContentPermissionController.helloWord(user).request!().observable.pipe(
      map(res => res.responseText as string),
    );
  }
}