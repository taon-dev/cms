import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Translation } from '@taon-dev/i18n/src';
import { Taon } from 'taon/src';
import { _ } from 'tnp-core/src';

const t = Translation.for(Taon.__FILE_RELATIVE_PATH, Taon.LANG_IMPORT_MAP);

export interface TaonCmsTaxonomyQuickCreateData {
  taxonomy: 'category' | 'tag';
}

export interface TaonCmsTaxonomyQuickCreateResult {
  name: string;
  slug: string;
  description: string | null;
  parentCategoryId: number | null;
  sortOrder: number;
}

@Component({
  selector: 'taon-cms-taxonomy-quick-create-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  template: `
    <h2 mat-dialog-title>
      {{
        data.taxonomy === 'category'
          ? t.gettext('Add category')
          : t.gettext('Add tag')
      }}
    </h2>
    <form (ngSubmit)="create()">
      <mat-dialog-content>
        <mat-form-field appearance="outline">
          <mat-label>{{ t.gettext('Name') }}</mat-label>
          <input
            matInput
            name="name"
            required
            [ngModel]="name"
            (ngModelChange)="updateName($event)" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>{{ t.gettext('Slug') }}</mat-label>
          <input
            matInput
            name="slug"
            required
            [(ngModel)]="slug"
            (input)="slugManuallySet = true" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>{{ t.gettext('Description') }}</mat-label>
          <textarea
            matInput
            name="description"
            [(ngModel)]="description"></textarea>
        </mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button
          mat-button
          type="button"
          (click)="dialogRef.close()">
          {{ t.gettext('Cancel') }}
        </button>
        <button
          mat-flat-button
          color="primary"
          type="submit"
          [disabled]="!name.trim() || !slug.trim()">
          {{ t.gettext('Create') }}
        </button>
      </mat-dialog-actions>
    </form>
  `,
})
export class TaonCmsTaxonomyQuickCreateDialogComponent {
  readonly t = t.for(this);

  readonly data = inject<TaonCmsTaxonomyQuickCreateData>(MAT_DIALOG_DATA);

  readonly dialogRef = inject<
    MatDialogRef<
      TaonCmsTaxonomyQuickCreateDialogComponent,
      TaonCmsTaxonomyQuickCreateResult
    >
  >(MatDialogRef);

  name = '';

  slug = '';

  description = '';

  slugManuallySet = false;

  updateName(value: string): void {
    this.name = value;
    if (!this.slugManuallySet) {
      this.slug = _.kebabCase(value);
    }
  }

  create(): void {
    if (!this.name.trim() || !this.slug.trim()) {
      return;
    }
    this.dialogRef.close({
      name: this.name.trim(),
      slug: this.slug.trim(),
      description: this.description.trim() || null,
      parentCategoryId: null,
      sortOrder: 0,
    });
  }
}
