import { Breadcrumb } from '@bugsnag/core';
import { BreadcrumbTrail } from '../BreadcrumbTrail';
import { describe, it, expect } from 'vitest';

function createBreadcrumb(message: string) {
  const b = new Breadcrumb();
  b.message = message;
  return b;
}

describe('Breadcrumb trail', () => {
  it('should store breadcrumbs and retrieve them ordered newest to oldest', () => {
    const trail = new BreadcrumbTrail();
    const b1 = createBreadcrumb('1');
    const b2 = createBreadcrumb('2');
    const b3 = createBreadcrumb('3');
    const b4 = createBreadcrumb('4');

    trail.add(b1);
    trail.add(b2);
    trail.add(b3);
    trail.add(b4);

    expect(trail.getBreadcrumbs()).toEqual([b1, b2, b3, b4]);
  });

  it('should only return the max length that is configured', () => {
    const trail = new BreadcrumbTrail();
    trail.setMaxLength(2);

    const b1 = createBreadcrumb('1');
    const b2 = createBreadcrumb('2');
    const b3 = createBreadcrumb('3');
    const b4 = createBreadcrumb('4');
    const b5 = createBreadcrumb('5');
    const b6 = createBreadcrumb('6');

    trail.add(b1);
    trail.add(b2);
    trail.add(b3);
    trail.add(b4);
    trail.add(b5);
    trail.add(b6);

    expect(trail.getBreadcrumbs()).toEqual([b5, b6]);
  });
});
