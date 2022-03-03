import { Breadcrumb } from '@bugsnag/core';
import { BreadcrumbTrail } from '../BreadcrumbTrail';

function createBreadcrumb(message: string, date: string) {
  const b = new Breadcrumb();
  b.message = message;
  b.timestamp = new Date(date);
  return b;
}

describe('Breadcrumb trail', () => {
  it('should store breadcrumbs and retrieve them ordered newest to oldest', () => {
    const trail = new BreadcrumbTrail();
    const b1 = createBreadcrumb('1', '2022-01-01');
    const b2 = createBreadcrumb('2', '2022-02-01');
    const b3 = createBreadcrumb('3', '2022-05-01');
    const b4 = createBreadcrumb('4', '2022-04-01');

    trail.add(b1);
    trail.add(b2);
    trail.add(b3);
    trail.add(b4);

    expect(trail.getBreadcrumbs()).toEqual([b3, b4, b2, b1]);
  });

  it('should only return the max length that is configured', () => {
    const trail = new BreadcrumbTrail();
    trail.setMaxLength(2);

    const b1 = createBreadcrumb('1', '2022-01-01');
    const b2 = createBreadcrumb('2', '2022-02-01');
    const b3 = createBreadcrumb('3', '2022-03-01');
    const b4 = createBreadcrumb('4', '2022-04-01');
    const b5 = createBreadcrumb('5', '2022-05-01');
    const b6 = createBreadcrumb('6', '2022-06-01');

    trail.add(b1);
    trail.add(b2);
    trail.add(b3);
    trail.add(b4);
    trail.add(b5);
    trail.add(b6);

    expect(trail.getBreadcrumbs()).toEqual([b6, b5]);
  });
});
