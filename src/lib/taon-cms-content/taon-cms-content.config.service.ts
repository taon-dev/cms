import { Injectable } from '@angular/core';
import { TaonBaseAngularService } from 'taon/src';

import { TaonCmsContentProvider } from './taon-cms-content.provider';

@Injectable()
export class TaonCmsContentConfigService extends TaonBaseAngularService {
  taonCmsContentProvider = this.injectProvider(TaonCmsContentProvider);
}
