import { Injectable } from '@angular/core';
import { TaonBaseAngularService } from 'taon/src';

import { TaonCmsContentProvider } from './taon-cms-content.provider';

@Injectable()
export class TaonCmsContentConfigService extends TaonBaseAngularService {
  taonCmsContentProvider = this.inject(TaonCmsContentProvider);

  get siteName(): string {
    return this.taonCmsContentProvider.siteName;
  }

  get requiredSlugs(): string[] {
    return [
      ...new Set(
        (this.taonCmsContentProvider.requiredSlugs ?? [])
          .map(slug => String(slug ?? '').trim())
          .filter(Boolean),
      ),
    ];
  }
}
