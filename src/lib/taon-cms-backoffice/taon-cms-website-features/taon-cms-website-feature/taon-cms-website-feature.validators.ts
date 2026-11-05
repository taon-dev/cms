import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms'; // @browser
import { TaonCmsWebsiteFeatureErrors } from './taon-cms-website-feature.constants';

export namespace TaonCmsWebsiteFeatureValidators {
  //#region @browser
  /**
   * TODO REMOVE THIS EXAMPLE.
   */
  export const passwordMatchValidator: ValidatorFn = (
    control: AbstractControl,
  ): ValidationErrors | null => {
    const password = control.get('password');
    const passwordRepeat = control.get('passwordRepeat');

    if (!password || !passwordRepeat) {
      return null;
    }

    return password.value === passwordRepeat.value
      ? null
      : { [TaonCmsWebsiteFeatureErrors.INVALID_PASSWORD_EXAMPLE_ERROR]: true };
  };
  //#endregion

}