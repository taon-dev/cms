import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  HostListener,
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
import { Translation } from '@taon-dev/i18n/src';
import { Taon } from 'taon/src';

import type { TaonCmsContentEntity } from '../../taon-cms-content/taon-cms-content.entity';
import { TaonCmsPostComponent } from '../taon-cms-post/taon-cms-post.component';

const t = Translation.for(Taon.__FILE_RELATIVE_PATH, Taon.LANG_IMPORT_MAP);

export interface TaonCmsPostEditDialogData {
  post?: TaonCmsContentEntity;
  mode: 'edit' | 'add';
}

@Component({
  selector: 'taon-cms-post-edit-dialog',
  templateUrl: './taon-cms-post-edit-dialog.component.html',
  styleUrls: ['./taon-cms-post-edit-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    TaonCmsPostComponent,
  ],
})
export class TaonCmsPostEditDialogComponent {
  readonly t = t.for(this);

  readonly data = inject<TaonCmsPostEditDialogData>(MAT_DIALOG_DATA);

  readonly editor = viewChild(TaonCmsPostComponent);

  readonly changed = new EventEmitter<TaonCmsContentEntity>();

  private readonly ref = inject(MatDialogRef<TaonCmsPostEditDialogComponent>);

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.ref.close();
  }

  close(): void {
    if (!this.editor()?.busy() && !this.editor()?.dialogOpen()) {
      this.ref.close();
    }
  }

  deleted(post: TaonCmsContentEntity): void {
    this.ref.close(post);
  }
}
