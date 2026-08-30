/**
 * Rewrites a Cloudinary delivery URL to apply on-the-fly optimizations:
 * auto quality, auto format (WebP/AVIF), and optional width resize.
 * Non-Cloudinary URLs (local assets, other CDNs) are returned unchanged.
 *
 * @param {string} url - Original image URL
 * @param {object} [options]
 * @param {number} [options.width] - Target width in px (Cloudinary scales, keeping aspect)
 * @returns {string} Optimized URL or the original URL
 */
export const optimizeImageUrl = (url, { width } = {}) => {
  if (typeof url !== 'string' || !url.includes('res.cloudinary.com')) return url;

  const transforms = ['f_auto', 'q_auto'];
  if (width) transforms.push(`w_${Math.round(width)}`);

  const transformation = transforms.join(',');

  // Insert after "/upload/" (Cloudinary's transformation insertion point).
  // Skip if this URL already carries transformations.
  if (url.includes('/upload/')) {
    const [before, after] = url.split('/upload/');
    if (after.startsWith(`${transformation}/`) || /^[a-z]+_/.test(after.split('/')[0])) {
      return url; // already transformed — don't stack
    }
    return `${before}/upload/${transformation}/${after}`;
  }

  return url;
};

export default optimizeImageUrl;
