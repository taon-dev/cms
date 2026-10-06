import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatRadioModule } from '@angular/material/radio';
import { finalize } from 'rxjs';

import type { TaonCmsContentEntity } from '../../taon-cms-content/taon-cms-content.entity';
import { TaonCmsContentRevisionApiService } from '../../taon-cms-content-revision/taon-cms-content-revision-api.service';
import type { TaonCmsContentRevisionEntity } from '../../taon-cms-content-revision/taon-cms-content-revision.entity';

@Component({
  selector: 'taon-cms-revision-chooser',
  templateUrl: './taon-cms-revision-chooser.component.html',
  styleUrls: ['./taon-cms-revision-chooser.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, MatButtonModule, MatDialogModule, MatRadioModule],
  providers: [TaonCmsContentRevisionApiService],
})
export class TaonCmsRevisionChooserComponent {
  readonly post = inject<TaonCmsContentEntity>(MAT_DIALOG_DATA);
  readonly revisions = signal<TaonCmsContentRevisionEntity[]>([]);
  readonly selected = signal<number | null>(null);
  readonly loading = signal(false);
  readonly applying = signal(false);
  readonly error = signal('');

  private readonly api = inject(TaonCmsContentRevisionApiService);
  private readonly ref = inject(
    MatDialogRef<TaonCmsRevisionChooserComponent, TaonCmsContentEntity>,
  );
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.load();
  }

  load(): void {
    if (this.loading() || this.applying()) {
      return;
    }
    this.selected.set(null);
    this.loading.set(true);
    this.error.set('');
    this.api.listRevisions(this.post.id).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.loading.set(false)),
    ).subscribe({
      next: revisions => this.revisions.set(
        [...revisions].sort((a, b) => b.revisionNumber - a.revisionNumber),
      ),
      error: (error: unknown) => {
        console.error('[taon-cms-revision-chooser] Unable to load revisions', error);
        this.error.set('Revisions could not be loaded. Please try again.');
      },
    });
  }

  apply(): void {
    const revisionNumber = this.selected();
    if (this.loading() || this.applying()) {
      return;
    }
    if (revisionNumber === null) {
      this.error.set('Select a revision to restore.');
      return;
    }
    this.applying.set(true);
    this.error.set('');
    this.api.restoreContent(this.post.id, {
      revisionNumber,
      expectedVersion: this.post.version,
    }).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.applying.set(false)),
    ).subscribe({
      next: post => this.ref.close(post),
      error: (error: unknown) => {
        console.error('[taon-cms-revision-chooser] Unable to restore revision', error);
        this.error.set(
          'The revision could not be restored. If the post changed, close and ' +
          'reopen it to load its latest version.',
        );
      },
    });
  }

  cancel(): void {
    if (!this.applying()) {
      this.ref.close();
    }
  }
}
