import { cn } from '../../lib/cn';

export function SectionHeader({ eyebrow, title, description, align = 'center', className }) {
  const isCentered = align === 'center';

  return (
    <div className={cn('max-w-3xl', isCentered ? 'mx-auto text-center' : '', className)}>
      {eyebrow ? (
        <p className="text-sm font-bold uppercase tracking-[0.22em] text-[var(--sf-secondary)]">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="mt-3 font-display text-[28px] font-extrabold leading-[36px] tracking-tight text-[var(--sf-text-main)] sm:text-[38px] sm:leading-[48px]">
        {title}
      </h2>
      {description ? (
        <p className="mt-4 text-[15px] leading-7 text-[var(--sf-text-muted)] sm:text-lg sm:leading-8">
          {description}
        </p>
      ) : null}
    </div>
  );
}

export default SectionHeader;
