import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { TaonCmsCommentApiService } from '../../taon-cms-comment-api.service';
import { Translation } from '@taon-dev/i18n/src';
import { Taon } from 'taon/src';

const t = Translation.for(Taon.__FILE_RELATIVE_PATH, Taon.LANG_IMPORT_MAP);

@Component({
  selector: 'app-taon-cms-comments-filters-settings',
  templateUrl: './taon-cms-comments-filters-settings.component.html',
  styleUrls: ['./taon-cms-comments-filters-settings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, MatButtonModule],
  providers: [TaonCmsCommentApiService],
})
export class TaonCmsCommentsFiltersSettingsComponent implements OnInit {
  readonly t = t.for(this);

  private readonly api = inject(TaonCmsCommentApiService);

  readonly phrases = signal<{ id: number; phrase: string }[]>([]);

  readonly phrase = signal('');

  readonly error = signal('');

  readonly loading = signal(false);

  ngOnInit(): void {
    void this.reload();
  }

  async reload(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    try {
      this.phrases.set(await this.api.getBlockedPhrases());
    } catch (error) {
      console.error('[cms-comment-filters] Unable to load blocked phrases', error);
      this.error.set(error instanceof Error ? error.message : this.t.gettext('Blocked phrases could not be loaded.'));
    } finally {
      this.loading.set(false);
    }
  }

  async add(): Promise<void> {
    const phrase = this.phrase().trim();
    if (!phrase) {
      return;
    }
    this.error.set('');
    try {
      await this.api.addBlockedPhrase(phrase);
      this.phrase.set('');
      await this.reload();
    } catch (error) {
      console.error('[cms-comment-filters] Unable to add blocked phrase', error);
      this.error.set(error instanceof Error ? error.message : this.t.gettext('The phrase could not be added.'));
    }
  }

  async remove(id: number): Promise<void> {
    this.error.set('');
    try {
      await this.api.deleteBlockedPhrase(id);
      await this.reload();
    } catch (error) {
      console.error('[cms-comment-filters] Unable to delete blocked phrase', error);
      this.error.set(error instanceof Error ? error.message : this.t.gettext('The phrase could not be deleted.'));
    }
  }
}