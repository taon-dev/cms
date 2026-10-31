import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Input,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Translation } from '@taon-dev/i18n/src';
import { Taon } from 'taon/src';

import { TaonCmsContentApiService } from '../../taon-cms-content/taon-cms-content-api.service';
import type { TaonCmsContentEntity } from '../../taon-cms-content/taon-cms-content.entity';
import { defaultThumbnailUrl } from '../taon-cms-post/taon-cms-thumbnail';

const t = Translation.for(Taon.__FILE_RELATIVE_PATH, Taon.LANG_IMPORT_MAP);

@Component({
  selector: 'taon-cms-course-cover',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule],
  templateUrl: './taon-cms-course-cover.component.html',
  styles: [`
    :host {
      display: block;
    }
    img {
      display: block;
      max-height: 50px;
      max-width: 90px;
      width: auto;
      height: auto;
      object-fit: contain;
    }
  `],
})
export class TaonCmsCourseCoverComponent implements OnInit {
  readonly t = t.for(this);

  @Input({ required: true })
  post!: TaonCmsContentEntity;

  private readonly api = inject(TaonCmsContentApiService);

  private readonly destroyRef = inject(DestroyRef);

  readonly url = signal('');

  readonly loading = signal(false);

  readonly error = signal('');

  ngOnInit(): void {
    void this.reload();
  }

  async reload(): Promise<void> {
    if (this.loading()) {
      return;
    }
    this.loading.set(true);
    this.url.set('');
    this.error.set('');
    try {
      const url =
        defaultThumbnailUrl(this.post.thumbnailKey ?? '') ??
        await this.api.getThumbnailLinkBySlug(this.post.slug);
      if (!url) {
        throw new Error('The thumbnail URL is empty.');
      }
      if (!this.destroyRef.destroyed) {
        this.url.set(url);
      }
    } catch (error: unknown) {
      console.error('[taon-cms-course-cover] Unable to load thumbnail', error);
      if (!this.destroyRef.destroyed) {
        this.failed();
      }
    } finally {
      if (!this.destroyRef.destroyed) {
        this.loading.set(false);
      }
    }
  }

  failed(): void {
    this.url.set('');
    this.error.set(this.t.gettext('Cover unavailable. Retry'));
  }
}
