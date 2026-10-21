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
import { Taon, type TaonStorageObject } from 'taon/src';

import { TaonCmsContentApiService } from '../taon-cms-content/taon-cms-content-api.service';

const t = Translation.for(Taon.__FILE_RELATIVE_PATH, Taon.LANG_IMPORT_MAP);

@Component({
  selector: 'taon-cms-asset-preview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule],
  styleUrl: './taon-cms-asset-preview.component.scss',
  templateUrl: './taon-cms-asset-preview.component.html',
})
export class TaonCmsAssetPreviewComponent implements OnInit {
  readonly t = t.for(this);

  @Input({ required: true })
  asset!: TaonStorageObject;

  private readonly api = inject(TaonCmsContentApiService);

  private readonly destroyRef = inject(DestroyRef);

  readonly url = signal('');

  readonly loading = signal(false);

  readonly error = signal('');

  get previewKind(): 'video' | 'audio' | 'attachment' {
    const contentType = this.asset.contentType?.trim().toLowerCase();
    if (contentType?.startsWith('video/')) {
      return 'video';
    }
    if (contentType?.startsWith('audio/')) {
      return 'audio';
    }
    return 'attachment';
  }

  ngOnInit(): void {
    void this.reload();
  }

  async reload(): Promise<void> {
    if (this.loading()) {
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.url.set('');
    try {
      const url = new URL(await this.api.getAssetUrl(this.asset.key));
      if (this.previewKind === 'attachment') {
        url.searchParams.set('download', 'true');
      }
      if (!this.destroyRef.destroyed) {
        this.url.set(url.href);
      }
    } catch (error: unknown) {
      if (!this.destroyRef.destroyed) {
        console.error(
          '[taon-cms-asset-preview] Unable to load asset URL',
          error,
        );
        this.error.set(
          this.t.gettext('The asset could not be opened. Please retry.'),
        );
      }
    } finally {
      if (!this.destroyRef.destroyed) {
        this.loading.set(false);
      }
    }
  }

  playbackError(): void {
    this.error.set(
      this.t.gettext(
        'Playback failed or the preview link expired. Please retry.',
      ),
    );
  }
}
