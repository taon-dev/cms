import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MtxGrid, MtxGridColumn } from '@ng-matero/extensions/grid';

interface TaonCmsAssetRow {
  id: number;
  name: string;
}

@Component({
  selector: 'taon-cms-assets-backoffice',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MtxGrid],
  template: `
    <h1>CMS assets</h1>
    <mtx-grid [data]="assets" [columns]="columns"></mtx-grid>
  `,
})
export class TaonCmsAssetsBackofficeComponent {
  readonly assets: TaonCmsAssetRow[] = [
    { id: 1, name: 'Sample image.jpg' },
    { id: 2, name: 'Sample document.pdf' },
  ];

  readonly columns: MtxGridColumn[] = [
    { header: 'ID', field: 'id', sortable: true },
    { header: 'Asset Name', field: 'name', sortable: true },
  ];
}
