import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatRadioModule } from '@angular/material/radio';
import { Translation } from '@taon-dev/i18n/src';
import { Taon } from 'taon/src';

const t = Translation.for(Taon.__FILE_RELATIVE_PATH, Taon.LANG_IMPORT_MAP);

export interface TaonCmsPostChoiceDialogData<T extends string> {
  title: string;
  options: { value: T; label: string }[];
  selected: T;
}

@Component({
  selector: 'taon-cms-post-choice-dialog',
  templateUrl: './taon-cms-post-choice-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, MatButtonModule, MatDialogModule, MatRadioModule],
})
export class TaonCmsPostChoiceDialogComponent<T extends string> {
  readonly t = t.for(this);

  readonly data =
    inject<TaonCmsPostChoiceDialogData<T>>(MAT_DIALOG_DATA);

  private readonly dialogRef =
    inject<MatDialogRef<TaonCmsPostChoiceDialogComponent<T>, T>>(
      MatDialogRef,
    );

  selected = this.data.selected;

  confirm(): void {
    this.dialogRef.close(this.selected);
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
