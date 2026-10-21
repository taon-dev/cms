//#region imports
import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Translation } from '@taon-dev/i18n/src';
import { Taon } from 'taon/src';
//#endregion

const t = Translation.for(Taon.__FILE_RELATIVE_PATH, Taon.LANG_IMPORT_MAP);

@Component({
  selector: 'app-taon-cms-backoffice',
  templateUrl: './taon-cms-backoffice.component.html',
  styleUrls: ['./taon-cms-backoffice.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AsyncPipe, RouterOutlet],
})
export class TaonCmsBackofficeComponent {
  readonly t = t.for(this);

  componentLoaded = false;

  onRouteActivate(component: any): void {
    this.componentLoaded = !!component;
  }

  onRouteDeactivate(component: any): void {
    this.componentLoaded = false;
  }
}
