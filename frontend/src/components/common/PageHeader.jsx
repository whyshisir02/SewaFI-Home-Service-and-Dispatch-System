import { Breadcrumb } from '../ui/Navigation/Breadcrumb';

export function PageHeader({ eyebrow, title, description, breadcrumbItems = [], actions }) {
  return (
    <div className="space-y-4">
      {breadcrumbItems.length ? <Breadcrumb items={breadcrumbItems} /> : null}
      {eyebrow ? <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">{eyebrow}</p> : null}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <h1 className="font-display text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl">{title}</h1>
          {description ? <p className="max-w-3xl text-sm text-muted sm:text-base">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
      </div>
    </div>
  );
}

export default PageHeader;
