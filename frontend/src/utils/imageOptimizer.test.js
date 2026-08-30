import { describe, expect, it } from 'vitest';
import { optimizeImageUrl } from './imageOptimizer.js';

const CLOUDINARY = 'https://res.cloudinary.com/demo/image/upload/v123/service-photo.jpg';

describe('optimizeImageUrl', () => {
  it('adds f_auto,q_auto transforms to Cloudinary URLs', () => {
    const result = optimizeImageUrl(CLOUDINARY);
    expect(result).toBe(
      'https://res.cloudinary.com/demo/image/upload/f_auto,q_auto/v123/service-photo.jpg'
    );
  });

  it('adds width transform when provided', () => {
    const result = optimizeImageUrl(CLOUDINARY, { width: 640 });
    expect(result).toContain('w_640');
    expect(result).toContain('f_auto');
    expect(result).toContain('q_auto');
  });

  it('returns non-Cloudinary URLs unchanged', () => {
    const url = 'https://example.com/photo.jpg';
    expect(optimizeImageUrl(url)).toBe(url);
    expect(optimizeImageUrl(url, { width: 400 })).toBe(url);
  });

  it('returns non-string input unchanged', () => {
    expect(optimizeImageUrl(null)).toBeNull();
    expect(optimizeImageUrl(undefined)).toBeUndefined();
    expect(optimizeImageUrl(123)).toBe(123);
  });

  it('does not stack transforms on already-transformed URLs', () => {
    const transformed =
      'https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_640/v123/photo.jpg';
    expect(optimizeImageUrl(transformed, { width: 800 })).toBe(transformed);
  });
});
