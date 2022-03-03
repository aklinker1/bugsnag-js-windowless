import { Config as CoreConfig } from '@bugsnag/core';

export interface Config extends CoreConfig {
  /**
   * @see https://docs.bugsnag.com/platforms/javascript/configuration-options/#generateanonymousid
   */
  generateAnonymousId?: boolean;
}
