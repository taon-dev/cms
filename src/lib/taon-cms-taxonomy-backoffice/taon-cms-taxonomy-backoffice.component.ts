import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute } from '@angular/router';
import { MtxGridColumn } from '@ng-matero/extensions/grid';
import { Translation } from '@taon-dev/i18n/src';
import {
  TaonConfirmDialogComponent,
  TaonDatatableComponent,
} from '@taon-dev/ui/src';
import { Observable, finalize } from 'rxjs';
import { Taon } from 'taon/src';

import { TaonCmsCategoryApiService } from '../taon-cms-category/taon-cms-category-api.service';
import type { TaonCmsCategoryEntity } from '../taon-cms-category/taon-cms-category.entity';
import type { TaonCmsCategoryFields } from '../taon-cms-category/taon-cms-taxonomy.validation';
import { TaonCmsTagApiService } from '../taon-cms-tag/taon-cms-tag-api.service';
import type { TaonCmsTagEntity } from '../taon-cms-tag/taon-cms-tag.entity';

const t = Translation.for(Taon.__FILE_RELATIVE_PATH, Taon.LANG_IMPORT_MAP);
type TaxonomyRow = TaonCmsCategoryEntity | TaonCmsTagEntity;

@Component({
  selector: 'taon-cms-taxonomy-backoffice',
  templateUrl: './taon-cms-taxonomy-backoffice.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    TaonDatatableComponent,
  ],
  providers: [TaonCmsCategoryApiService, TaonCmsTagApiService],
  styles: [
    `
      :host {
        display: block;
      }
      form {
        display: grid;
        gap: 1rem;
        max-width: 640px;
        margin-block: 1.5rem;
      }
      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
      }
    `,
  ],
})
export class TaonCmsTaxonomyBackofficeComponent {
  readonly t = t.for(this);
  readonly isCategory =
    inject(ActivatedRoute).snapshot.data['taxonomy'] === 'category';
  private readonly categories = inject(TaonCmsCategoryApiService);
  private readonly tags = inject(TaonCmsTagApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialog = inject(MatDialog);
  readonly rows = signal<TaxonomyRow[]>([]);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly editing = signal(false);
  editingId: number | null = null;
  draft: TaonCmsCategoryFields = this.emptyDraft();

  readonly columns: MtxGridColumn[] = [
    { header: this.t.gettext('Name'), field: 'name', sortable: true },
    { header: this.t.gettext('Slug'), field: 'slug', sortable: true },
    ...(this.isCategory
      ? [
          {
            header: this.t.gettext('Parent Category'),
            field: 'parentName',
            sortable: true,
          },
          {
            header: this.t.gettext('Sort Order'),
            field: 'sortOrder',
            sortable: true,
          },
        ]
      : [
          {
            header: this.t.gettext('Description'),
            field: 'description',
            sortable: true,
          },
        ]),
    {
      header: this.t.gettext('Actions'),
      field: 'actions',
      type: 'button',
      buttons: [
        {
          type: 'icon',
          icon: 'edit',
          tooltip: this.t.gettext('Edit'),
          disabled: () => this.busy(),
          click: (row: TaxonomyRow) => this.edit(row),
        },
        {
          type: 'icon',
          icon: 'delete',
          tooltip: this.t.gettext('Delete'),
          disabled: () => this.busy(),
          click: (row: TaxonomyRow) => this.delete(row),
        },
      ],
    },
  ];

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    if (this.busy()) {
      return;
    }
    const request: Observable<TaxonomyRow[]> = this.isCategory
      ? this.categories.allMyEntities$
      : this.tags.allMyEntities$;
    this.run(request, rows => this.rows.set(rows));
  }

  tableRows() {
    return this.rows().map(row => ({
      ...row,
      parentName:
        'parentCategoryId' in row
          ? (this.rows().find(parent => parent.id === row.parentCategoryId)
              ?.name ?? '')
          : '',
    }));
  }

  parentOptions(): TaonCmsCategoryEntity[] {
    const categories = this.rows().filter(
      (row): row is TaonCmsCategoryEntity => 'parentCategoryId' in row,
    );
    return categories.filter(category => {
      const visited = new Set<number>();
      let current: TaonCmsCategoryEntity | undefined = category;
      while (current) {
        if (current.id === this.editingId || visited.has(current.id)) {
          return false;
        }
        visited.add(current.id);
        current = categories.find(
          parent => parent.id === current?.parentCategoryId,
        );
      }
      return true;
    });
  }

  edit(row?: TaxonomyRow): void {
    if (this.busy()) {
      return;
    }
    this.editingId = row?.id ?? null;
    this.draft = row
      ? {
          name: row.name,
          slug: row.slug,
          description: row.description,
          parentCategoryId:
            'parentCategoryId' in row ? row.parentCategoryId : null,
          sortOrder: 'sortOrder' in row ? row.sortOrder : 0,
        }
      : this.emptyDraft();
    this.error.set('');
    this.editing.set(true);
  }

  save(): void {
    if (this.busy()) {
      return;
    }
    const request: Observable<TaxonomyRow> = this.isCategory
      ? this.categories.save(this.editingId, this.draft)
      : this.tags.save(this.editingId, this.draft);
    this.run(request, saved => {
      this.editing.set(false);
      this.rows.update(rows => [
        ...rows.filter(row => row.id !== saved.id),
        saved,
      ]);
    });
  }

  delete(row: TaxonomyRow): void {
    if (this.busy()) {
      return;
    }
    this.dialog
      .open(TaonConfirmDialogComponent, {
        data: {
          title: this.isCategory
            ? this.t.gettext('Delete category?')
            : this.t.gettext('Delete tag?'),
          message: this.t.gettext(
            'Only unused items can be deleted. This cannot be undone.',
          ),
          confirmText: this.t.gettext('Delete'),
        },
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(confirmed => {
        if (confirmed) {
          this.run(
            this.isCategory
              ? this.categories.delete(row.id)
              : this.tags.delete(row.id),
            () => {
              if (this.editingId === row.id) {
                this.editing.set(false);
              }
              this.rows.update(rows => rows.filter(item => item.id !== row.id));
            },
          );
        }
      });
  }

  private run<T>(request: Observable<T>, next: (value: T) => void): void {
    if (this.busy()) {
      return;
    }
    this.busy.set(true);
    this.error.set('');
    request
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.busy.set(false)),
      )
      .subscribe({
        next: value => {
          this.busy.set(false);
          next(value);
        },
        error: (error: unknown) => {
          console.error('[taon-cms-taxonomy] Operation failed', error);
          this.error.set(
            this.t.gettext(
              'The operation failed. Check for duplicate names or slugs, invalid parents, or items still used by posts or child categories, then reload and try again.',
            ),
          );
        },
      });
  }

  private emptyDraft(): TaonCmsCategoryFields {
    return {
      name: '',
      slug: '',
      description: '',
      parentCategoryId: null,
      sortOrder: 0,
    };
  }
}
