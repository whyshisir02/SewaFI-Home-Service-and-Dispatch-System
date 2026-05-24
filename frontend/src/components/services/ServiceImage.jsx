import { useEffect, useMemo, useState } from 'react';
import { Fan, Hammer, Paintbrush, Sparkles, Wrench, Zap } from 'lucide-react';
import { cn } from '../../lib/cn';

const resolveImageSource = (service, explicitSrc) => {
  const candidate = explicitSrc ?? service?.imageUrl ?? service?.image ?? '';
  return typeof candidate === 'string' ? candidate.trim() : '';
};

const resolveServiceIcon = (service) => {
  const searchable = [
    service?.name,
    service?.title,
    service?.category?.name,
    service?.subCategory?.name,
    service?.serviceCategory?.name,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (/(electrical|electric|wiring|power|light)/.test(searchable)) return Zap;
  if (/(plumb|pipe|drain|faucet|water)/.test(searchable)) return Wrench;
  if (/(carpentry|carpenter|wood|furniture)/.test(searchable)) return Hammer;
  if (/(paint|painting|painter|color)/.test(searchable)) return Paintbrush;
  if (/(clean|cleaning|sanitize|housekeep|maid|sweep)/.test(searchable)) return Sparkles;
  if (/(ac|air\s*condition|appliance|fridge|refrigerator|washing|hvac|cooling)/.test(searchable)) return Fan;
  return Wrench;
};

export function ServiceImage({
  service,
  src,
  alt,
  mediaClassName,
  imageClassName,
  fallbackClassName,
  iconClassName,
  loading = 'lazy',
}) {
  const resolvedSrc = useMemo(() => resolveImageSource(service, src), [service, src]);
  const [imageFailed, setImageFailed] = useState(false);
  const IconComponent = useMemo(() => resolveServiceIcon(service), [service]);

  useEffect(() => {
    setImageFailed(false);
  }, [resolvedSrc]);

  const canShowImage = Boolean(resolvedSrc) && !imageFailed;
  const safeAlt = alt || `${service?.name || service?.title || 'Service'} image`;

  if (canShowImage) {
    return (
      <img
        src={resolvedSrc}
        alt={safeAlt}
        loading={loading}
        decoding="async"
        className={cn('w-full object-cover', mediaClassName, imageClassName)}
        onError={() => setImageFailed(true)}
      />
    );
  }

  return (
    <div
      className={cn(
        'flex w-full items-center justify-center bg-[radial-gradient(circle_at_top,var(--sf-secondary-soft),transparent_38%),linear-gradient(135deg,var(--sf-primary-soft),var(--sf-surface-soft))] text-[var(--sf-primary)]',
        mediaClassName,
        fallbackClassName
      )}
      aria-hidden="true"
    >
      <IconComponent className={cn('h-10 w-10', iconClassName)} />
    </div>
  );
}

export default ServiceImage;
