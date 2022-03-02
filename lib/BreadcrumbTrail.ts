import { Breadcrumb } from '@bugsnag/core';

export class BreadcrumbTrail {
  static DEFAULT_MAX_LENGTH = 25;

  #list: Breadcrumb[] = [];
  #maxLength = BreadcrumbTrail.DEFAULT_MAX_LENGTH;

  add(breadcrumb: Breadcrumb) {
    this.#list.unshift(breadcrumb);

    // Don't trim the end immediately after going over, wait a bit
    if (this.#list.length > 2 * this.#maxLength) {
      this.#list.length = this.#maxLength;
    }
  }

  setMaxLength(maxLength: number) {
    this.#maxLength = maxLength;
  }

  getBreadcrumbs(): Breadcrumb[] {
    return this.#list.slice(0, this.#maxLength).reverse();
  }
}
