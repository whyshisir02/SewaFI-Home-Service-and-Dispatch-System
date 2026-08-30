import { describe, expect, it } from 'vitest';
import { serviceBookPath, serviceDetailPath } from './servicePaths';

describe('serviceDetailPath', () => {
  it('prefers the slug over the id', () => {
    expect(serviceDetailPath({ id: 1, slug: 'ac-repair' })).toBe('/services/ac-repair');
  });

  it('falls back to the id when the slug is missing', () => {
    expect(serviceDetailPath({ id: 1 })).toBe('/services/1');
  });
});

describe('serviceBookPath', () => {
  it('includes the serviceId and categoryId', () => {
    expect(serviceBookPath({ id: 5, categoryId: 3 })).toBe('/customer/book/5?serviceId=5&categoryId=3');
  });

  it('omits the categoryId when absent', () => {
    expect(serviceBookPath({ id: 5 })).toBe('/customer/book/5?serviceId=5');
  });
});
