import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
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

import { TaonCmsContentApiService } from '../../taon-cms-content/taon-cms-content-api.service';
import type { TaonCmsContentEntity } from '../../taon-cms-content/taon-cms-content.entity';

export interface TaonRelatedPostChooserData {
  postId?: number;
  excludedIds: number[];
}

@Component({
  selector: 'taon-related-post-chooser',
  templateUrl: './taon-related-post-chooser.component.html',
  styleUrls: ['./taon-related-post-chooser.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatDialogModule, MatRadioModule],
  providers: [TaonCmsContentApiService],
})
export class TaonRelatedPostChooserComponent {
  readonly data = inject<TaonRelatedPostChooserData>(MAT_DIALOG_DATA);
  readonly posts = signal<TaonCmsContentEntity[]>([]);
  readonly selected = signal<number | null>(null);
  readonly query = signal('');
  readonly loading = signal(false);
  readonly error = signal('');
  readonly filteredPosts = computed(() => {
    const query = this.query().trim().toLowerCase();
    return this.posts().filter(post =>
      post.id !== this.data.postId &&
      !this.data.excludedIds.includes(post.id) &&
      `${post.id} ${post.title} ${post.slug}`.toLowerCase().includes(query),
    );
  });

  private readonly api = inject(TaonCmsContentApiService);
  private readonly ref = inject(
    MatDialogRef<TaonRelatedPostChooserComponent, TaonCmsContentEntity>,
  );
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.load();
  }

  load(): void {
    if (this.loading()) {
      return;
    }
    this.loading.set(true);
    this.selected.set(null);
    this.error.set('');
    this.api.allMyEntities$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: posts => this.posts.set(posts),
        error: (error: unknown) => {
          console.error('[taon-related-post-chooser] Unable to load posts', error);
          this.error.set('Posts could not be loaded. Please try again.');
        },
      });
  }

  search(event: Event): void {
    if (event.target instanceof HTMLInputElement) {
      this.query.set(event.target.value);
      this.selected.set(null);
    }
  }

  choose(): void {
    if (this.loading() || this.error()) {
      return;
    }
    const post = this.filteredPosts().find(post => post.id === this.selected());
    if (!post) {
      this.error.set('Select a related post.');
      return;
    }
    this.ref.close(post);
  }

  cancel(): void {
    this.ref.close();
  }
}
