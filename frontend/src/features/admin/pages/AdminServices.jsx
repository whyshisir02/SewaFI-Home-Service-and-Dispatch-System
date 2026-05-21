import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle2, RefreshCw, Tag, Wrench, XCircle } from 'lucide-react';
import { Button } from '../../../components/ui/Button/Button';
import { Input } from '../../../components/ui/Input/Input';
import { Container } from '../../../components/ui/Layout/Container';
import { PageHeader } from '../../../components/common/PageHeader';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { Modal } from '../../../components/ui/Overlay/Modal';
import { Drawer } from '../../../components/ui/Overlay/Drawer';
import { ConfirmDialog } from '../../../components/ui/Overlay/ConfirmDialog';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import { formatCurrency } from '../../../utils/formatCurrency';
import { formatDate } from '../../../utils/formatDate';
import { getErrorMessage } from '../../../utils/errorHandler';
import { appToast } from '../../../lib/toast';
import { adminApi } from '../api/admin.api';
import { useAdminServiceDetails, useAdminServices } from '../hooks/useAdminServices';

const statusOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

const featuredOptions = [
  { value: 'all', label: 'All' },
  { value: 'featured', label: 'Featured' },
  { value: 'not_featured', label: 'Not Featured' },
];

const sortOptions = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'name_asc', label: 'Name A-Z' },
  { value: 'name_desc', label: 'Name Z-A' },
];

const getServicesArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.services)) return payload.services;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const getCategoryName = (service, categories) => {
  const label = service?.category?.name || service?.categoryName;
  if (label) return label;
  const categoryId = service?.categoryId || service?.category?.id;
  if (!categoryId) return null;
  const match = (Array.isArray(categories) ? categories : []).find((item) => String(item?.id) === String(categoryId));
  return match?.name || null;
};

const getPriceText = (service) => {
  if (service?.basePrice != null) return formatCurrency(service.basePrice);
  if (service?.minPrice != null && service?.maxPrice != null) return `${formatCurrency(service.minPrice)} - ${formatCurrency(service.maxPrice)}`;
  if (service?.minPrice != null) return `From ${formatCurrency(service.minPrice)}`;
  return 'Not set';
};

const getServiceImage = (service) =>
  service?.imageUrl ||
  service?.image ||
  service?.thumbnailUrl ||
  service?.coverImage ||
  '';

const getUploadedImagePayload = (uploaded) => {
  const data = uploaded?.data || uploaded;

  return {
    imageUrl:
      data?.imageUrl ||
      data?.url ||
      data?.secure_url ||
      '',
    imagePublicId:
      data?.publicId ||
      data?.public_id ||
      data?.imagePublicId ||
      '',
  };
};

function ServiceForm({ categories, initialValues, submitLabel, loading, onSubmit, onUploadImage }) {
  const [form, setForm] = useState(() => ({
    name: initialValues?.name || '',
    categoryId: initialValues?.categoryId || initialValues?.category?.id || '',
    description: initialValues?.description || '',
    longDescription: initialValues?.longDescription || '',
    basePrice: initialValues?.basePrice ?? '',
    estimatedDuration: initialValues?.estimatedDuration || '',
    imageUrl: getServiceImage(initialValues) || '',
    imagePublicId: initialValues?.imagePublicId || '',
    isActive: initialValues?.isActive ?? true,
    isFeatured: initialValues?.isFeatured ?? false,
  }));
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({
          ...form,
          basePrice: form.basePrice === '' ? undefined : Number(form.basePrice),
        });
      }}
    >
      <Input label="Service Name" value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} required />
      <label className="space-y-1 text-sm text-[var(--sf-text-main)]">
        <span>Category</span>
        <select
          value={form.categoryId}
          onChange={(event) => setForm((prev) => ({ ...prev, categoryId: event.target.value }))}
          className="h-11 w-full rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface)] px-3 text-sm text-[var(--sf-text-main)]"
          required
        >
          <option value="">Select category</option>
          {(Array.isArray(categories) ? categories : []).map((item) => (
            <option key={item?.id} value={item?.id}>{item?.name}</option>
          ))}
        </select>
      </label>
      <Input label="Short Description" value={form.description} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} />
      <Input label="Long Description" value={form.longDescription} onChange={(event) => setForm((prev) => ({ ...prev, longDescription: event.target.value }))} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Input label="Base Price" type="number" value={form.basePrice} onChange={(event) => setForm((prev) => ({ ...prev, basePrice: event.target.value }))} />
        <Input label="Estimated Duration" value={form.estimatedDuration} onChange={(event) => setForm((prev) => ({ ...prev, estimatedDuration: event.target.value }))} />
      </div>
      <div className="space-y-2">
        <label className="space-y-1 text-sm text-[var(--sf-text-main)]">
          <span>Service Image</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => setSelectedImage(event.target.files?.[0] || null)}
            className="h-11 w-full rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface)] px-3 py-2 text-sm text-[var(--sf-text-main)]"
          />
        </label>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-xl"
            disabled={!selectedImage || uploadingImage}
            loading={uploadingImage}
            onClick={async () => {
              if (!selectedImage) return;
              setUploadingImage(true);
              try {
                const uploaded = await onUploadImage(selectedImage);
                const { imageUrl, imagePublicId } = getUploadedImagePayload(uploaded);

                if (!imageUrl) {
                  throw new Error('Image uploaded, but no image URL was returned by the backend.');
                }

                setForm((prev) => ({
                  ...prev,
                  imageUrl,
                  imagePublicId: imagePublicId || prev.imagePublicId,
                }));

                appToast.success('Image uploaded successfully.');
                setSelectedImage(null);
              } catch (error) {
                appToast.error(getErrorMessage(error, 'Unable to upload image right now.'));
              } finally {
                setUploadingImage(false);
              }
            }}
          >
            Upload Image
          </Button>
        </div>
        {form.imageUrl ? <img src={form.imageUrl} alt="Service preview" className="h-24 w-full rounded-xl object-cover" /> : null}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex items-center gap-2 text-sm text-[var(--sf-text-main)]">
          <input type="checkbox" checked={Boolean(form.isActive)} onChange={(event) => setForm((prev) => ({ ...prev, isActive: event.target.checked }))} />
          Active
        </label>
        <label className="flex items-center gap-2 text-sm text-[var(--sf-text-main)]">
          <input type="checkbox" checked={Boolean(form.isFeatured)} onChange={(event) => setForm((prev) => ({ ...prev, isFeatured: event.target.checked }))} />
          Featured
        </label>
      </div>
      <Button type="submit" className="h-11 rounded-xl" loading={loading}disabled={loading || uploadingImage}>
        {submitLabel}
      </Button>
    </form>
  );
}

function AdminServices() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedServiceId, setSelectedServiceId] = useState(null);
  const [editServiceId, setEditServiceId] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [supportsActions, setSupportsActions] = useState({
    create: true,
    update: true,
    toggle: true,
    archive: true,
    delete: true,
  });
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || 'all';
  const status = searchParams.get('status') || 'all';
  const featured = searchParams.get('featured') || 'all';
  const sort = searchParams.get('sort') || 'newest';
  const page = Number(searchParams.get('page') || 1);

  const filters = useMemo(
    () => ({
      page,
      limit: 20,
      ...(search ? { search } : {}),
      ...(category !== 'all' ? { categoryId: category } : {}),
      ...(status === 'active' ? { isActive: true } : {}),
      ...(status === 'inactive' ? { isActive: false } : {}),
      ...(featured === 'featured' ? { isFeatured: true } : {}),
      ...(featured === 'not_featured' ? { isFeatured: false } : {}),
      ...(sort !== 'newest' ? { sort } : {}),
    }),
    [category, featured, page, search, sort, status]
  );

  const {
    servicesQuery,
    statsQuery,
    categoriesQuery,
    createServiceMutation,
    updateServiceMutation,
    toggleServiceMutation,
    archiveServiceMutation,
    deleteServiceMutation,
  } = useAdminServices(filters);

  const services = useMemo(() => getServicesArray(servicesQuery.data), [servicesQuery.data]);
  const serviceDetailsQuery = useAdminServiceDetails(selectedServiceId || editServiceId);
  const selectedService = serviceDetailsQuery.data || services.find((item) => String(item?.id) === String(selectedServiceId));
  const editService = serviceDetailsQuery.data || services.find((item) => String(item?.id) === String(editServiceId));

  const filteredServices = useMemo(() => {
    const needle = search.trim().toLowerCase();
    let list = services.filter((item) => {
      if (category !== 'all') {
        const categoryId = String(item?.categoryId || item?.category?.id || '');
        if (categoryId !== String(category)) return false;
      }
      if (status === 'active' && item?.isActive !== true) return false;
      if (status === 'inactive' && item?.isActive !== false) return false;
      if (featured === 'featured' && item?.isFeatured !== true) return false;
      if (featured === 'not_featured' && item?.isFeatured === true) return false;
      if (!needle) return true;
      const text = `${item?.name || ''} ${getCategoryName(item, categoriesQuery.data) || ''} ${item?.description || ''}`.toLowerCase();
      return text.includes(needle);
    });
    if (sort === 'oldest') list = [...list].sort((a, b) => new Date(a?.createdAt || 0) - new Date(b?.createdAt || 0));
    else if (sort === 'name_asc') list = [...list].sort((a, b) => String(a?.name || '').localeCompare(String(b?.name || '')));
    else if (sort === 'name_desc') list = [...list].sort((a, b) => String(b?.name || '').localeCompare(String(a?.name || '')));
    else list = [...list].sort((a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0));
    return list;
  }, [category, categoriesQuery.data, featured, search, services, sort, status]);

  const stats = useMemo(() => {
    const raw = statsQuery.data?.services || statsQuery.data;
    const derived = {
      total: services.length,
      active: services.filter((item) => item?.isActive === true).length,
      inactive: services.filter((item) => item?.isActive === false).length,
      featured: services.filter((item) => item?.isFeatured === true).length,
      categories: new Set(services.map((item) => item?.categoryId || item?.category?.id).filter(Boolean)).size,
    };
    return {
      total: raw?.total ?? derived.total,
      active: raw?.active ?? derived.active,
      inactive: raw?.inactive ?? derived.inactive,
      featured: raw?.featured ?? derived.featured,
      categories: raw?.categories ?? derived.categories,
      derived: !(raw?.total != null),
    };
  }, [services, statsQuery.data]);

  const setParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (!value || value === 'all' || value === 'newest') next.delete(key);
    else next.set(key, value);
    if (key !== 'page') next.delete('page');
    setSearchParams(next);
  };

  const normalizeEndpointSupport = (actionKey, error) => {
    if (error?.response?.status === 404 || error?.response?.status === 405) {
      setSupportsActions((prev) => ({ ...prev, [actionKey]: false }));
    }
  };

  const onCreateService = async (payload) => {
    try {
      await createServiceMutation.mutateAsync(payload);
      appToast.success('Service created successfully.');
      setShowCreate(false);
      servicesQuery.refetch();
      statsQuery.refetch();
    } catch (error) {
      normalizeEndpointSupport('create', error);
      appToast.error(getErrorMessage(error, 'Unable to create service right now.'));
    }
  };

  const uploadServiceImage = async (file) => {
    const uploaded = await adminApi.uploadServiceImage(file);
    return getUploadedImagePayload(uploaded);
  };

  const onUpdateService = async (payload) => {
    if (!editServiceId) return;
    try {
      await updateServiceMutation.mutateAsync({ id: editServiceId, payload });
      appToast.success('Service updated successfully.');
      setEditServiceId(null);
      servicesQuery.refetch();
    } catch (error) {
      normalizeEndpointSupport('update', error);
      appToast.error(getErrorMessage(error, 'Unable to update service right now.'));
    }
  };

  const runAction = async () => {
    if (!pendingAction?.type || !pendingAction?.id) return;
    try {
      if (pendingAction.type === 'toggle') {
        await toggleServiceMutation.mutateAsync({ id: pendingAction.id, isActive: pendingAction.nextIsActive });
        appToast.success(`Service ${pendingAction.nextIsActive ? 'activated' : 'deactivated'} successfully.`);
      } else if (pendingAction.type === 'archive') {
        await archiveServiceMutation.mutateAsync(pendingAction.id);
        appToast.success('Service archived successfully.');
      } else if (pendingAction.type === 'delete') {
        await deleteServiceMutation.mutateAsync(pendingAction.id);
        appToast.success('Service deleted successfully.');
      }
      setPendingAction(null);
      servicesQuery.refetch();
      statsQuery.refetch();
    } catch (error) {
      normalizeEndpointSupport(pendingAction.type, error);
      appToast.error(getErrorMessage(error, 'Unable to update service right now.'));
    }
  };

  const actionButtons = (service) => (
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="outline" className="h-9 rounded-xl" onClick={() => setSelectedServiceId(service?.id)}>
        View Details
      </Button>
      {supportsActions.update ? (
        <Button type="button" variant="outline" className="h-9 rounded-xl" onClick={() => setEditServiceId(service?.id)}>
          Edit
        </Button>
      ) : null}
      {supportsActions.toggle && service?.isActive != null ? (
        <Button type="button" variant="outline" className="h-9 rounded-xl" onClick={() => setPendingAction({ type: 'toggle', id: service?.id, nextIsActive: !service.isActive, name: service?.name })}>
          {service.isActive ? 'Deactivate' : 'Activate'}
        </Button>
      ) : null}
      {supportsActions.archive ? (
        <Button type="button" variant="outline" className="h-9 rounded-xl" onClick={() => setPendingAction({ type: 'archive', id: service?.id, name: service?.name })}>
          Archive
        </Button>
      ) : null}
      {supportsActions.delete ? (
        <Button type="button" variant="danger" className="h-9 rounded-xl" onClick={() => setPendingAction({ type: 'delete', id: service?.id, name: service?.name })}>
          Delete
        </Button>
      ) : null}
    </div>
  );

  const detailsContent = selectedService ? (
    <div className="space-y-3 text-sm text-[var(--sf-text-muted)]">
      <p><span className="font-semibold text-[var(--sf-text-main)]">Name:</span> {selectedService?.name || '—'}</p>
      {selectedService?.slug ? <p><span className="font-semibold text-[var(--sf-text-main)]">Slug:</span> {selectedService.slug}</p> : null}
      <p><span className="font-semibold text-[var(--sf-text-main)]">Category:</span> {getCategoryName(selectedService, categoriesQuery.data) || '—'}</p>
      <p><span className="font-semibold text-[var(--sf-text-main)]">Description:</span> {selectedService?.description || '—'}</p>
      {selectedService?.longDescription ? <p><span className="font-semibold text-[var(--sf-text-main)]">Long Description:</span> {selectedService.longDescription}</p> : null}
      <p><span className="font-semibold text-[var(--sf-text-main)]">Price:</span> {getPriceText(selectedService)}</p>
      <p><span className="font-semibold text-[var(--sf-text-main)]">Duration:</span> {selectedService?.estimatedDuration || 'Not set'}</p>
      <p><span className="font-semibold text-[var(--sf-text-main)]">Status:</span> <StatusBadge status={selectedService?.isActive ? 'APPROVED' : 'SUSPENDED'} className="ml-2" /></p>
      <p><span className="font-semibold text-[var(--sf-text-main)]">Featured:</span> {selectedService?.isFeatured ? 'Yes' : 'No'}</p>
      {selectedService?.imageUrl ? <img src={selectedService.imageUrl} alt={selectedService.name || 'Service'} className="h-32 w-full rounded-xl object-cover" /> : null}
      {selectedService?.createdAt ? <p><span className="font-semibold text-[var(--sf-text-main)]">Created:</span> {formatDate(selectedService.createdAt, { includeTime: true })}</p> : null}
      {selectedService?.updatedAt ? <p><span className="font-semibold text-[var(--sf-text-main)]">Updated:</span> {formatDate(selectedService.updatedAt, { includeTime: true })}</p> : null}
      <div>{actionButtons(selectedService)}</div>
    </div>
  ) : (
    <p className="text-sm text-[var(--sf-text-muted)]">Service details unavailable.</p>
  );

  return (
    <Container className="space-y-6 py-6 lg:py-8">
      <PageHeader
        eyebrow="Admin"
        title="Services"
        description="Manage service listings, categories, visibility, pricing hints, and booking availability."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" className="h-11 rounded-xl" onClick={() => {
              servicesQuery.refetch();
              statsQuery.refetch();
              categoriesQuery.refetch();
            }}>
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            {supportsActions.create ? (
              <Button type="button" className="h-11 rounded-xl" onClick={() => setShowCreate(true)}>
                Add Service
              </Button>
            ) : null}
          </div>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {[
          { label: 'Total Services', value: stats.total, icon: Wrench },
          { label: 'Active Services', value: stats.active, icon: CheckCircle2 },
          { label: 'Inactive Services', value: stats.inactive, icon: XCircle },
          { label: 'Featured Services', value: stats.featured, icon: Tag },
          { label: 'Categories', value: stats.categories, icon: Tag },
        ].map((card) => (
          <article key={card.label} className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-4">
            <div className="flex items-center gap-2 text-[var(--sf-text-muted)]">
              <card.icon className="h-4 w-4" />
              <p className="text-xs font-semibold uppercase tracking-[0.12em]">{card.label}</p>
            </div>
            <p className="mt-2 text-2xl font-extrabold text-[var(--sf-text-main)]">{card.value ?? '—'}</p>
            {stats.derived ? <p className="mt-1 text-xs text-[var(--sf-text-muted)]">From loaded services</p> : null}
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-4">
        <div className="grid gap-3 lg:grid-cols-[1.2fr_0.9fr_0.8fr_0.8fr_0.8fr]">
          <Input label="Search" value={search} onChange={(event) => setParam('search', event.target.value)} placeholder="Search by service name, category, or description..." />
          <label className="space-y-1 text-sm text-[var(--sf-text-main)]">
            <span>Category</span>
            <select value={category} onChange={(event) => setParam('category', event.target.value)} className="h-11 w-full rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface)] px-3 text-sm text-[var(--sf-text-main)]">
              <option value="all">All categories</option>
              {(Array.isArray(categoriesQuery.data) ? categoriesQuery.data : []).map((item) => (
                <option key={item?.id} value={item?.id}>{item?.name}</option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm text-[var(--sf-text-main)]">
            <span>Status</span>
            <select value={status} onChange={(event) => setParam('status', event.target.value)} className="h-11 w-full rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface)] px-3 text-sm text-[var(--sf-text-main)]">
              {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <label className="space-y-1 text-sm text-[var(--sf-text-main)]">
            <span>Featured</span>
            <select value={featured} onChange={(event) => setParam('featured', event.target.value)} className="h-11 w-full rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface)] px-3 text-sm text-[var(--sf-text-main)]">
              {featuredOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <label className="space-y-1 text-sm text-[var(--sf-text-main)]">
            <span>Sort</span>
            <select value={sort} onChange={(event) => setParam('sort', event.target.value)} className="h-11 w-full rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface)] px-3 text-sm text-[var(--sf-text-main)]">
              {sortOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
        </div>
      </section>

      {servicesQuery.isLoading ? (
        <section className="space-y-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-24 animate-pulse rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)]" />
          ))}
        </section>
      ) : null}

      {!servicesQuery.isLoading && servicesQuery.isError ? (
        <section className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5">
          <p className="font-semibold text-[var(--sf-text-main)]">Unable to load services right now.</p>
          <Button type="button" variant="outline" className="mt-3 rounded-xl" onClick={() => servicesQuery.refetch()}>
            Retry
          </Button>
        </section>
      ) : null}

      {!servicesQuery.isLoading && !servicesQuery.isError && !filteredServices.length ? (
        <section className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-6 text-center">
          <p className="text-lg font-semibold text-[var(--sf-text-main)]">
            {services.length ? 'No services match these filters.' : 'No services found.'}
          </p>
          {services.length ? (
            <Button type="button" variant="outline" className="mt-4 rounded-xl" onClick={() => setSearchParams(new URLSearchParams())}>
              Clear Filters
            </Button>
          ) : null}
        </section>
      ) : null}

      {!servicesQuery.isLoading && !servicesQuery.isError && filteredServices.length ? (
        <>
          <section className="hidden overflow-hidden rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] lg:block">
            <table className="w-full text-left">
              <thead className="bg-[var(--sf-surface-soft)]">
                <tr className="text-xs uppercase tracking-[0.12em] text-[var(--sf-text-muted)]">
                  <th className="px-4 py-3">Service</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Duration</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Featured</th>
                  <th className="px-4 py-3">Updated</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredServices.map((service) => (
                  <tr key={service?.id} className="border-t border-[var(--sf-border)]">
                    <td className="px-4 py-4">
                      <p className="font-semibold text-[var(--sf-text-main)]">{service?.name || 'Unnamed service'}</p>
                      <p className="text-xs text-[var(--sf-text-muted)]">{service?.slug || service?.id}</p>
                    </td>
                    <td className="px-4 py-4 text-sm text-[var(--sf-text-muted)]">{getCategoryName(service, categoriesQuery.data) || '—'}</td>
                    <td className="px-4 py-4 text-sm text-[var(--sf-text-muted)]">{getPriceText(service)}</td>
                    <td className="px-4 py-4 text-sm text-[var(--sf-text-muted)]">{service?.estimatedDuration || 'Not set'}</td>
                    <td className="px-4 py-4"><StatusBadge status={service?.isActive ? 'APPROVED' : 'SUSPENDED'} /></td>
                    <td className="px-4 py-4 text-sm">{service?.isFeatured ? <StatusBadge status="PENDING" /> : '—'}</td>
                    <td className="px-4 py-4 text-sm text-[var(--sf-text-muted)]">{service?.updatedAt ? formatDate(service.updatedAt) : '—'}</td>
                    <td className="px-4 py-4">{actionButtons(service)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="space-y-3 lg:hidden">
            {filteredServices.map((service) => (
              <article key={service?.id} className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-4">
                <p className="font-semibold text-[var(--sf-text-main)]">{service?.name || 'Unnamed service'}</p>
                <p className="text-xs text-[var(--sf-text-muted)]">{service?.slug || service?.id}</p>
                <p className="mt-1 text-sm text-[var(--sf-text-muted)]">{getCategoryName(service, categoriesQuery.data) || 'Category unavailable'}</p>
                <p className="text-sm text-[var(--sf-text-muted)]">{getPriceText(service)} • {service?.estimatedDuration || 'Duration not set'}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <StatusBadge status={service?.isActive ? 'APPROVED' : 'SUSPENDED'} />
                  {service?.isFeatured ? <StatusBadge status="PENDING" /> : null}
                </div>
                <div className="mt-3">{actionButtons(service)}</div>
              </article>
            ))}
          </section>
        </>
      ) : null}

      {/* TODO: Add explicit pagination controls when services endpoint returns stable page/total metadata. */}

      {isDesktop ? (
        <Modal open={Boolean(selectedServiceId)} onClose={() => setSelectedServiceId(null)} title="Service Details">
          {serviceDetailsQuery.isLoading ? <p className="text-sm text-[var(--sf-text-muted)]">Loading service details...</p> : detailsContent}
        </Modal>
      ) : (
        <Drawer open={Boolean(selectedServiceId)} onClose={() => setSelectedServiceId(null)} title="Service Details">
          {serviceDetailsQuery.isLoading ? <p className="text-sm text-[var(--sf-text-muted)]">Loading service details...</p> : detailsContent}
        </Drawer>
      )}

      {isDesktop ? (
        <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Service">
          <ServiceForm
            categories={categoriesQuery.data}
            submitLabel="Create Service"
            loading={createServiceMutation.isPending}
            onSubmit={onCreateService}
            onUploadImage={uploadServiceImage}
          />
        </Modal>
      ) : (
        <Drawer open={showCreate} onClose={() => setShowCreate(false)} title="Create Service">
          <ServiceForm
            categories={categoriesQuery.data}
            submitLabel="Create Service"
            loading={createServiceMutation.isPending}
            onSubmit={onCreateService}
            onUploadImage={uploadServiceImage}
          />
        </Drawer>
      )}

      {isDesktop ? (
        <Modal open={Boolean(editServiceId)} onClose={() => setEditServiceId(null)} title="Edit Service">
          <ServiceForm
            categories={categoriesQuery.data}
            initialValues={editService}
            submitLabel="Save Changes"
            loading={updateServiceMutation.isPending}
            onSubmit={onUpdateService}
            onUploadImage={uploadServiceImage}
          />
        </Modal>
      ) : (
        <Drawer open={Boolean(editServiceId)} onClose={() => setEditServiceId(null)} title="Edit Service">
          <ServiceForm
            categories={categoriesQuery.data}
            initialValues={editService}
            submitLabel="Save Changes"
            loading={updateServiceMutation.isPending}
            onSubmit={onUpdateService}
            onUploadImage={uploadServiceImage}
          />
        </Drawer>
      )}

      <ConfirmDialog
        open={Boolean(pendingAction)}
        onClose={() => setPendingAction(null)}
        onConfirm={runAction}
        title={
          pendingAction?.type === 'delete'
            ? 'Delete service?'
            : pendingAction?.type === 'archive'
              ? 'Archive service?'
              : 'Update service status?'
        }
        description={`Are you sure you want to ${pendingAction?.type || 'update'} ${pendingAction?.name || 'this service'}?`}
        confirmLabel={
          pendingAction?.type === 'delete'
            ? 'Delete'
            : pendingAction?.type === 'archive'
              ? 'Archive'
              : 'Confirm'
        }
      />
    </Container>
  );
}

export default AdminServices;
