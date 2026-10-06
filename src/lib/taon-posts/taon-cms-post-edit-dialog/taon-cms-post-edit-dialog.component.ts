import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  viewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

import type { TaonCmsContentEntity } from '../../taon-cms-content/taon-cms-content.entity';
import { TaonCmsPostComponent } from '../taon-cms-post/taon-cms-post.component';

export interface TaonCmsPostEditDialogData {
  post?: TaonCmsContentEntity;
  mode: 'edit' | 'add';
}

@Component({
  selector: 'taon-cms-post-edit-dialog',
  templateUrl: './taon-cms-post-edit-dialog.component.html',
  styleUrls: ['./taon-cms-post-edit-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatDialogModule, MatIconModule, TaonCmsPostComponent],
})
export class TaonCmsPostEditDialogComponent {
  readonly data = inject<TaonCmsPostEditDialogData>(MAT_DIALOG_DATA);
  readonly editor = viewChild(TaonCmsPostComponent);
  readonly changed = new EventEmitter<TaonCmsContentEntity>();
  private readonly ref = inject(MatDialogRef<TaonCmsPostEditDialogComponent>);

  close(): void {
    if (!this.editor()?.busy() && !this.editor()?.dialogOpen()) {
      this.ref.close();
    }
  }

  deleted(post: TaonCmsContentEntity): void {
    this.ref.close(post);
  }
}
