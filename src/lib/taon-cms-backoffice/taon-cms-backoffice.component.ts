//#region imports
import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
//#endregion

@Component({
  selector: 'app-taon-cms-backoffice',
  templateUrl: './taon-cms-backoffice.component.html',
  styleUrls: ['./taon-cms-backoffice.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AsyncPipe, RouterOutlet],
})
export class TaonCmsBackofficeComponent {
  componentLoaded = false;

  onRouteActivate(component: any): void {
    this.componentLoaded = !!component;
  }

  onRouteDeactivate(component: any): void {
    this.componentLoaded = false;
  }
}
