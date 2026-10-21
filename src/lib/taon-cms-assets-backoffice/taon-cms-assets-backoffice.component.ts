import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MtxGridColumn } from '@ng-matero/extensions/grid';
import { TaonDatatableComponent } from '@taon-dev/ui/src';
import { finalize, map } from 'rxjs';
import type { TaonStorageObject as TaonStorageObjectBase } from 'taon/src';
import { _ } from 'tnp-core/src';

import { TaonCmsContentApiService } from '../taon-cms-content/taon-cms-content-api.service';

import { TaonCmsAssetPreviewComponent } from './taon-cms-asset-preview.component';

type TaonStorageObject = TaonStorageObjectBase & { keyVisible?: string };

@Component({
  selector: 'taon-cms-assets-backoffice',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    TaonDatatableComponent,
    TaonCmsAssetPreviewComponent,
  ],
  providers: [TaonCmsContentApiService],
  templateUrl: './taon-cms-assets-backoffice.component.html',
})
export class TaonCmsAssetsBackofficeComponent implements OnInit {
  private readonly api = inject(TaonCmsContentApiService);

  private readonly destroyRef = inject(DestroyRef);

  readonly assets = signal<TaonStorageObject[]>([]);

  readonly loading = signal(false);

  readonly error = signal('');

  readonly columns: MtxGridColumn[] = [
    { header: 'ID', field: 'keyVisible', sortable: true, showExpand: true },
    { header: 'File Name', field: 'fileName', sortable: true },
    { header: 'Content Type', field: 'contentType', sortable: true },
  ];

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    if (this.loading()) {
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.api
      .listAssets()
      .pipe(
        map(c => c as TaonStorageObject[]),
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: assets =>
          this.assets.set(
            assets.map(c => {
              c.keyVisible = _.first(c.key.split('__'));
              return c;
            }),
          ),
        error: (error: unknown) => {
          console.error(
            '[taon-cms-assets-backoffice] Unable to load assets',
            error,
          );
          this.error.set('Assets could not be loaded. Please try reloading.');
        },
      });
  }
}
