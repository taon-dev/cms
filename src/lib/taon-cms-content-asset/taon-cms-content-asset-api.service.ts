import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Taon, TaonBaseAngularService } from 'taon/src';

import type { TaonCmsContentAssetEntity } from './taon-cms-content-asset.entity';
import { TaonCmsContentAssetController } from './taon-cms-content-asset.controller';

@Injectable()
export class TaonCmsContentAssetApiService extends TaonBaseAngularService {
  private taonCmsContentAssetController = this.injectController(TaonCmsContentAssetController);

  public get allMyEntities$(): Observable<TaonCmsContentAssetEntity[]> {
    return this.taonCmsContentAssetController.getAll().request!().observable.pipe(
      map(res => res.body?.json),
    );
  }

  public helloWorld(user:string): Observable<string> {
    return this.taonCmsContentAssetController.helloWord(user).request!().observable.pipe(
      map(res => res.responseText as string),
    );
  }
}