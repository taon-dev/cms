import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Taon, TaonBaseAngularService } from 'taon/src';

import type { TaonCmsTagEntity } from './taon-cms-tag.entity';
import { TaonCmsTagController } from './taon-cms-tag.controller';

@Injectable()
export class TaonCmsTagApiService extends TaonBaseAngularService {
  private readonly taonCmsTagController =
    this.injectController(TaonCmsTagController);
}
