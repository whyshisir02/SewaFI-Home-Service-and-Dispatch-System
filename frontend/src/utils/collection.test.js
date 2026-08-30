import { describe, expect, it } from 'vitest';
import { toArray } from './collection.js';

describe('toArray', () => {
  it('returns the payload unchanged when it is already an array', () => {
    const payload = [{ id: 1 }];
    expect(toArray(payload)).toBe(payload);
  });

  it('resolves a domain key before the generic fallbacks', () => {
    const payload = { bookings: [{ id: 'b1' }], data: [{ id: 'wrong' }] };
    expect(toArray(payload, ['bookings'])).toEqual([{ id: 'b1' }]);
  });

  it('honours the order of the keys argument', () => {
    const payload = { services: [{ id: 's1' }], items: [{ id: 'i1' }] };
    expect(toArray(payload, ['items', 'services'])).toEqual([{ id: 'i1' }]);
  });

  it('skips domain keys that are present but not arrays', () => {
    const payload = { faqs: { total: 0 }, data: [{ id: 'd1' }] };
    expect(toArray(payload, ['faqs'])).toEqual([{ id: 'd1' }]);
  });

  it('falls back to payload.data when no domain key matches', () => {
    expect(toArray({ data: [1, 2] }, ['providers'])).toEqual([1, 2]);
  });

  it('falls back to payload.items when data is absent', () => {
    expect(toArray({ items: [3] }, ['providers'])).toEqual([3]);
  });

  it('prefers data over items', () => {
    expect(toArray({ data: ['a'], items: ['b'] })).toEqual(['a']);
  });

  it('returns an empty array for null, undefined and primitives', () => {
    expect(toArray(null)).toEqual([]);
    expect(toArray(undefined)).toEqual([]);
    expect(toArray('nope')).toEqual([]);
    expect(toArray(42)).toEqual([]);
  });

  it('returns an empty array when nothing matches', () => {
    expect(toArray({ total: 0, page: 1 }, ['users'])).toEqual([]);
  });

  it('works without a keys argument', () => {
    expect(toArray({ data: [1] })).toEqual([1]);
  });
});
