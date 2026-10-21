//#region imports
import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {
  TaonAdminLayoutComponent,
  TaonBackofficeNotificationsComponent,
} from '@taon-dev/ui/src';
import { HttpResponseError, RestErrorResponseWrapper } from 'ng2-rest/src';
import { Translation } from '@taon-dev/i18n/src';
import { Taon } from 'taon/src';

import { TaonBaselineBackofficeOutletName } from './taon-baseline-backoffice.models';
import { TaonBaselineBackofficeRoutes } from './taon-baseline-backoffice.routes';
//#endregion

const t = Translation.for(Taon.__FILE_RELATIVE_PATH, Taon.LANG_IMPORT_MAP);

@Component({
  selector: 'app-taon-baseline-backoffice',
  templateUrl: './taon-baseline-backoffice.component.html',
  styleUrls: ['./taon-baseline-backoffice.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AsyncPipe,
    RouterOutlet,
    TaonAdminLayoutComponent,
    TaonBackofficeNotificationsComponent,
  ],
})
export class TaonBaselineBackofficeComponent {
  readonly t = t.for(this);

  title = this.t.gettext('Application Title');

  get adminRoutes() {
    return TaonBaselineBackofficeRoutes[0].children;
  }

  outlet = TaonBaselineBackofficeOutletName;

  filter(
    error: HttpResponseError<RestErrorResponseWrapper>,
  ): HttpResponseError<RestErrorResponseWrapper> {
    return error;
  }
}
