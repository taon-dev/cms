import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Taon, TaonBaseAngularService } from 'taon/src';

import type { TaonCmsCommentEntity } from './taon-cms-comment.entity';
import { TaonCmsCommentController } from './taon-cms-comment.controller';

@Injectable()
export class TaonCmsCommentApiService extends TaonBaseAngularService {
  private taonCmsCommentController = this.injectController(TaonCmsCommentController);

  public get allMyEntities$(): Observable<TaonCmsCommentEntity[]> {
    return this.taonCmsCommentController.getAll().request!().observable.pipe(
      map(res => res.body?.json),
    );
  }

  public helloWorld(user:string): Observable<string> {
    return this.taonCmsCommentController.helloWord(user).request!().observable.pipe(
      map(res => res.responseText as string),
    );
  }
}