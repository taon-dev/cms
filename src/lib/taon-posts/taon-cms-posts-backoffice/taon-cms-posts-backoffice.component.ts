//#region imports
import {
  ChangeDetectionStrategy,
  Component,
  ViewChild,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MtxGridColumn } from '@ng-matero/extensions/grid';
import { TaonDatatableComponent } from '@taon-dev/ui/src';
import { Translation } from '@taon-dev/i18n/src';
import { Taon } from 'taon/src';

import { TaonCmsContentApiService } from '../../taon-cms-content/taon-cms-content-api.service';
import type { TaonCmsContentEntity } from '../../taon-cms-content/taon-cms-content.entity';
import { TaonCmsPostTableActions } from './taon-cms-post-table-actions.directive';
//#endregion

const t = Translation.for(Taon.__FILE_RELATIVE_PATH, Taon.LANG_IMPORT_MAP);

@Component({
  selector: 'app-taon-cms-posts-backoffice',
  templateUrl: './taon-cms-posts-backoffice.component.html',
  styleUrls: ['./taon-cms-posts-backoffice.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, TaonDatatableComponent],
  providers: [TaonCmsContentApiService],
})
export class TaonCmsPostsBackofficeComponent extends TaonCmsPostTableActions {
  readonly t = t.for(this);

  @ViewChild(TaonDatatableComponent)
  readonly datatable!: TaonDatatableComponent;

  readonly posts = signal<TaonCmsContentEntity[]>([]);

  readonly loading = signal(false);

  public get crud() {
    return this.taonCmsContentApiService.crudController;
  }

  readonly columns: MtxGridColumn[] = [
    { header: 'ID', field: 'id', sortable: true },
    { header: this.t.gettext('Title'), field: 'title', sortable: true },
    { header: this.t.gettext('Status'), field: 'status', sortable: true },
    this.actionsColumn,
  ];

  reload(): void {
    this.datatable.reload();
  }

  ngAfterViewInit(): void {
    this.reload();
  }
}
