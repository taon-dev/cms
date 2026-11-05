import { ChangeDetectionStrategy, Component, effect, inject, input, signal } from '@angular/core';
import { Translation } from '@taon-dev/i18n/src';
import { Taon } from 'taon/src';

import { TaonCmsContentApiService } from '../../taon-cms-content/taon-cms-content-api.service';
import type { TaonCmsContentEntity } from '../../taon-cms-content/taon-cms-content.entity';
import { defaultThumbnailUrl } from './taon-cms-thumbnail';

const t = Translation.for(Taon.__FILE_RELATIVE_PATH, Taon.LANG_IMPORT_MAP);

@Component({
  selector: 'taon-cms-post-thumbnail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (url()) {
      <img [src]="url()" [alt]="post().title" />
    }
    @if (error()) {
      <span role="alert">{{ error() }}</span>
    }
  `,
  styles: [`
    :host { display: inline-flex; vertical-align: middle; }
    img { max-height: 50px; max-width: 100%; width: auto; height: auto; object-fit: contain; }
  `],
})
export class TaonCmsPostThumbnailComponent {
  readonly t = t.for(this);
  readonly post = input.required<TaonCmsContentEntity>();
  readonly url = signal('');
  readonly error = signal('');
  private readonly taonCmsContentApiService = inject(TaonCmsContentApiService);

  constructor() {
    effect(onCleanup => {
      const key = this.post().thumbnailKey;
      let active = true;
      onCleanup(() => { active = false; });
      this.url.set('');
      this.error.set('');
      if (!key) {
        return;
      }
      const placeholder = defaultThumbnailUrl(key);
      if (placeholder) {
        this.url.set(placeholder);
        return;
      }
      void this.taonCmsContentApiService.getAssetUrl(key)
        .then(url => {
          if (active) {
            this.url.set(url);
          }
        })
        .catch((error: unknown) => {
          console.error('[taon-cms-post-thumbnail] Unable to load thumbnail', error);
          if (active) {
            this.error.set(this.t.gettext('The thumbnail could not be loaded.'));
          }
        });
    });
  }
}
