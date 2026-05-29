import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle2, FolderTree, Layers, RefreshCw, XCircle } from 'lucide-react';
import { Button } from '../../../components/ui/Button/Button';
import { Input } from '../../../components/ui/Input/Input';
import { Container } from '../../../components/ui/Layout/Container';
import { PageHeader } from '../../../components/common/PageHeader';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { Modal } from '../../../components/ui/Overlay/Modal';
import { Drawer } from '../../../components/ui/Overlay/Drawer';
import { ConfirmDialog } from '../../../components/ui/Overlay/ConfirmDialog';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import { formatDate } from '../../../utils/formatDate';
import { getErrorMessage } from '../../../utils/errorHandler';
import { appToast } from '../../../lib/toast';
import { useAdminCategories, useAdminCategoryDetails } from '../hooks/useAdminCategories';
import { adminApi } from '../api/admin.api';

const statusOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

const usageOptions = [
  { value: 'all', label: 'All' },
  { value: 'with_services', label: 'With Services' },
  { value: 'empty', label: 'Empty' },
];

const sortOptions = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'name_asc', label: 'Name A-Z' },
  { value: 'name_desc', label: 'Name Z-A' },
];

const getCategoriesArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.categories)) return payload.categories;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

function CategoryForm({ initialValues, submitLabel, loading, onSubmit, onUploadImage }) {
  const [form, setForm] = useState(() => ({
    name: initialValues?.name || '',
    slug: initialValues?.slug || '',
    description: initialValues?.description || '',
    icon: initialValues?.icon || '',
    imageUrl: initialValues?.imageUrl || '',
    imagePublicId: initialValues?.imagePublicId || '',
    isActive: initialValues?.isActive ?? true,
    sortOrder: initialValues?.sortOrder ?? '',
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
          sortOrder: form.sortOrder === '' ? undefined : Number(form.sortOrder),
        });
      }}
    >
      <Input label="Category Name" value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} required />
      <Input label="Slug" value={form.slug} onChange={(event) => setForm((prev) => ({ ...prev, slug: event.target.value }))} hint="Used only if backend accepts manual slug updates." />
      <Input label="Description" value={form.description} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} />
      <Input label="Icon" value={form.icon} onChange={(event) => setForm((prev) => ({ ...prev, icon: event.target.value }))} hint="Plain icon identifier only when backend supports it." />
      <div className="space-y-2">
        <label className="space-y-1 text-sm text-[var(--sf-text-main)]">
          <span>Category Image</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => setSelectedImage(event.target.files?.[0] || null)}
            className="h-11 w-full rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface)] px-3 py-2 text-sm text-[var(--sf-text-main)]"
          />
        </label>
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
              setForm((prev) => ({
                ...prev,
                imageUrl: uploaded?.imageUrl || prev.imageUrl,
                imagePublicId: uploaded?.publicId || prev.imagePublicId,
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
        {form.imageUrl ? <img src={form.imageUrl} alt="Category preview" className="h-24 w-full rounded-xl object-cover" /> : null}
      </div>
      <Input label="Sort Order" type="number" value={form.sortOrder} onChange={(event) => setForm((prev) => ({ ...prev, sortOrder: event.target.value }))} />
      <label className="flex items-center gap-2 text-sm text-[var(--sf-text-main)]">
        <input type="checkbox" checked={Boolean(form.isActive)} onChange={(event) => setForm((prev) => ({ ...prev, isActive: event.target.checked }))} />
        Active
      </label>
      <Button type="submit" className="h-11 rounded-xl" loading={loading} disabled={loading}>
        {submitLabel}
      </Button>
    </form>
  );
}

function AdminCategories() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [editCategoryId, setEditCategoryId] = useState(null);
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
  const status = searchParams.get('status') || 'all';
  const usage = searchParams.get('usage') || 'all';
  const sort = searchParams.get('sort') || 'newest';
  const page = Number(searchParams.get('page') || 1);

  const filters = useMemo(
    () => ({
      page,
      limit: 20,
      ...(search ? { search } : {}),
      ...(status === 'active' ? { isActive: true } : {}),
      ...(status === 'inactive' ? { isActive: false } : {}),
      ...(sort !== 'newest' ? { sort } : {}),
    }),
    [page, search, sort, status]
  );

  const {
    categoriesQuery,
    statsQuery,
    createCategoryMutation,
    updateCategoryMutation,
    toggleCategoryMutation,
    archiveCategoryMutation,
    deleteCategoryMutation,
  } = useAdminCategories(filters);

  const categories = useMemo(() => getCategoriesArray(categoriesQuery.data), [categoriesQuery.data]);
  const categoryDetailsQuery = useAdminCategoryDetails(selectedCategoryId || editCategoryId);
  const selectedCategory = categoryDetailsQuery.data || categories.find((item) => String(item?.id) === String(selectedCategoryId));
  const editCategory = categoryDetailsQuery.data || categories.find((item) => String(item?.id) === String(editCategoryId));

  const filteredCategories = useMemo(() => {
    const needle = search.trim().toLowerCase();
    let list = categories.filter((item) => {
      if (status === 'active' && item?.isActive !== true) return false;
      if (status === 'inactive' && item?.isActive !== false) return false;
      if (usage === 'with_services' && !(Number(item?.serviceCount || 0) > 0)) return false;
      if (usage === 'empty' && Number(item?.serviceCount || 0) > 0) return false;
      if (!needle) return true;
      const text = `${item?.name || ''} ${item?.slug || ''} ${item?.description || ''}`.toLowerCase();
      return text.includes(needle);
    });
    if (sort === 'oldest') list = [...list].sort((a, b) => new Date(a?.createdAt || 0) - new Date(b?.createdAt || 0));
    else if (sort === 'name_asc') list = [...list].sort((a, b) => String(a?.name || '').localeCompare(String(b?.name || '')));
    else if (sort === 'name_desc') list = [...list].sort((a, b) => String(b?.name || '').localeCompare(String(a?.name || '')));
    else list = [...list].sort((a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0));
    return list;
  }, [categories, search, sort, status, usage]);

  const hasServiceCount = useMemo(() => categories.some((item) => item?.serviceCount != null), [categories]);

  const stats = useMemo(() => {
    const raw = statsQuery.data || {};
    const derived = {
      total: categories.length,
      active: categories.filter((item) => item?.isActive === true).length,
      inactive: categories.filter((item) => item?.isActive === false).length,
      withServices: categories.filter((item) => Number(item?.serviceCount || 0) > 0).length,
      empty: categories.filter((item) => Number(item?.serviceCount || 0) <= 0).length,
    };
    return {
      total: raw?.total ?? derived.total,
      active: raw?.active ?? derived.active,
      inactive: raw?.inactive ?? derived.inactive,
      withServices: raw?.withServices ?? (hasServiceCount ? derived.withServices : null),
      empty: raw?.emptyCategories ?? (hasServiceCount ? derived.empty : null),
      derived: raw?.total == null,
    };
  }, [categories, hasServiceCount, statsQuery.data]);

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

  const onCreateCategory = async (payload) => {
    try {
      await createCategoryMutation.mutateAsync(payload);
      appToast.success('Category created successfully.');
      setShowCreate(false);
      categoriesQuery.refetch();
      statsQuery.refetch();
    } catch (error) {
      normalizeEndpointSupport('create', error);
      appToast.error(getErrorMessage(error, 'Unable to create category right now.'));
    }
  };

  const uploadCategoryImage = async (file) => adminApi.uploadCategoryImage(file);

  const onUpdateCategory = async (payload) => {
    if (!editCategoryId) return;
    try {
      await updateCategoryMutation.mutateAsync({ id: editCategoryId, payload });
      appToast.success('Category updated successfully.');
      setEditCategoryId(null);
      categoriesQuery.refetch();
    } catch (error) {
      normalizeEndpointSupport('update', error);
      appToast.error(getErrorMessage(error, 'Unable to update category right now.'));
    }
  };

  const runAction = async () => {
    if (!pendingAction?.type || !pendingAction?.id) return;
    try {
      if (pendingAction.type === 'toggle') {
        await toggleCategoryMutation.mutateAsync({ id: pendingAction.id, isActive: pendingAction.nextIsActive });
        appToast.success(`Category ${pendingAction.nextIsActive ? 'activated' : 'deactivated'} successfully.`);
      } else if (pendingAction.type === 'archive') {
        await archiveCategoryMutation.mutateAsync(pendingAction.id);
        appToast.success('Category archived successfully.');
      } else if (pendingAction.type === 'delete') {
        await deleteCategoryMutation.mutateAsync(pendingAction.id);
        appToast.success('Category deleted successfully.');
      }
      setPendingAction(null);
      categoriesQuery.refetch();
      statsQuery.refetch();
    } catch (error) {
      normalizeEndpointSupport(pendingAction.type, error);
      appToast.error(getErrorMessage(error, 'Unable to update category right now.'));
    }
  };

  const actionButtons = (categoryItem) => (
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="outline" className="h-9 rounded-xl" onClick={() => setSelectedCategoryId(categoryItem?.id)}>
        View Details
      </Button>
      {supportsActions.update ? (
        <Button type="button" variant="outline" className="h-9 rounded-xl" onClick={() => setEditCategoryId(categoryItem?.id)}>
          Edit
        </Button>
      ) : null}
      {supportsActions.toggle && categoryItem?.isActive != null ? (
        <Button type="button" variant="outline" className="h-9 rounded-xl" onClick={() => setPendingAction({ type: 'toggle', id: categoryItem?.id, nextIsActive: !categoryItem.isActive, name: categoryItem?.name })}>
          {categoryItem.isActive ? 'Deactivate' : 'Activate'}
        </Button>
      ) : null}
      {supportsActions.archive ? (
        <Button type="button" variant="outline" className="h-9 rounded-xl" onClick={() => setPendingAction({ type: 'archive', id: categoryItem?.id, name: categoryItem?.name })}>
          Archive
        </Button>
      ) : null}
      {supportsActions.delete ? (
        <Button type="button" variant="danger" className="h-9 rounded-xl" onClick={() => setPendingAction({ type: 'delete', id: categoryItem?.id, name: categoryItem?.name })}>
          Delete
        </Button>
      ) : null}
    </div>
  );

  const detailsContent = selectedCategory ? (
    <div className="space-y-3 text-sm text-[var(--sf-text-muted)]">
      <p><span className="font-semibold text-[var(--sf-text-main)]">Name:</span> {selectedCategory?.name || '—'}</p>
      <p><span className="font-semibold text-[var(--sf-text-main)]">Slug:</span> {selectedCategory?.slug || '—'}</p>
      <p><span className="font-semibold text-[var(--sf-text-main)]">Description:</span> {selectedCategory?.description || '—'}</p>
      {selectedCategory?.icon ? <p><span className="font-semibold text-[var(--sf-text-main)]">Icon:</span> {selectedCategory.icon}</p> : null}
      {selectedCategory?.imageUrl ? <img src={selectedCategory.imageUrl} alt={selectedCategory.name || 'Category'} className="h-32 w-full rounded-xl object-cover" /> : null}
      <p><span className="font-semibold text-[var(--sf-text-main)]">Status:</span> <StatusBadge status={selectedCategory?.isActive ? 'ACTIVE' : 'INACTIVE'} className="ml-2" /></p>
      {selectedCategory?.serviceCount != null ? <p><span className="font-semibold text-[var(--sf-text-main)]">Services:</span> {selectedCategory.serviceCount}</p> : null}
      {selectedCategory?.providerCount != null ? <p><span className="font-semibold text-[var(--sf-text-main)]">Providers:</span> {selectedCategory.providerCount}</p> : null}
      {selectedCategory?.createdAt ? <p><span className="font-semibold text-[var(--sf-text-main)]">Created:</span> {formatDate(selectedCategory.createdAt, { includeTime: true })}</p> : null}
      {selectedCategory?.updatedAt ? <p><span className="font-semibold text-[var(--sf-text-main)]">Updated:</span> {formatDate(selectedCategory.updatedAt, { includeTime: true })}</p> : null}
      <div>{actionButtons(selectedCategory)}</div>
    </div>
  ) : (
    <p className="text-sm text-[var(--sf-text-muted)]">Category details unavailable.</p>
  );

  return (
    <Container className="space-y-6 py-6 lg:py-8">
      <PageHeader
        eyebrow="Admin"
        title="Categories"
        description="Manage service categories used across service listings, provider registration, and booking flows."
        actions={(
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" className="h-11 rounded-xl" onClick={() => { categoriesQuery.refetch(); statsQuery.refetch(); }}>
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            {supportsActions.create ? (
              <Button type="button" className="h-11 rounded-xl" onClick={() => setShowCreate(true)}>
                Add Category
              </Button>
            ) : null}
          </div>
        )}
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {[
          { label: 'Total Categories', value: stats.total, icon: FolderTree },
          { label: 'Active Categories', value: stats.active, icon: CheckCircle2 },
          { label: 'Inactive Categories', value: stats.inactive, icon: XCircle },
          { label: 'Categories With Services', value: stats.withServices, icon: Layers },
          { label: 'Empty Categories', value: stats.empty, icon: Layers },
        ].map((card) => (
          <article key={card.label} className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-4">
            <div className="flex items-center gap-2 text-[var(--sf-text-muted)]">
              <card.icon className="h-4 w-4" />
              <p className="text-xs font-semibold uppercase tracking-[0.12em]">{card.label}</p>
            </div>
            <p className="mt-2 text-2xl font-extrabold text-[var(--sf-text-main)]">{card.value ?? '—'}</p>
            {stats.derived ? <p className="mt-1 text-xs text-[var(--sf-text-muted)]">From loaded categories</p> : null}
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-4">
        <div className="grid gap-3 lg:grid-cols-[1.3fr_0.8fr_0.8fr_0.8fr]">
          <Input label="Search" value={search} onChange={(event) => setParam('search', event.target.value)} placeholder="Search by category name, slug, or description..." />
          <label className="space-y-1 text-sm text-[var(--sf-text-main)]">
            <span>Status</span>
            <select value={status} onChange={(event) => setParam('status', event.target.value)} className="h-11 w-full rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface)] px-3 text-sm text-[var(--sf-text-main)]">
              {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          {hasServiceCount ? (
            <label className="space-y-1 text-sm text-[var(--sf-text-main)]">
              <span>Usage</span>
              <select value={usage} onChange={(event) => setParam('usage', event.target.value)} className="h-11 w-full rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface)] px-3 text-sm text-[var(--sf-text-main)]">
                {usageOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
          ) : <div />}
          <label className="space-y-1 text-sm text-[var(--sf-text-main)]">
            <span>Sort</span>
            <select value={sort} onChange={(event) => setParam('sort', event.target.value)} className="h-11 w-full rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface)] px-3 text-sm text-[var(--sf-text-main)]">
              {sortOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
        </div>
      </section>

      {categoriesQuery.isLoading ? (
        <section className="grid gap-3 md:grid-cols-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-36 animate-pulse rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)]" />
          ))}
        </section>
      ) : null}

      {!categoriesQuery.isLoading && categoriesQuery.isError ? (
        <section className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5">
          <p className="font-semibold text-[var(--sf-text-main)]">Unable to load categories right now.</p>
          <Button type="button" variant="outline" className="mt-3 rounded-xl" onClick={() => categoriesQuery.refetch()}>
            Retry
          </Button>
        </section>
      ) : null}

      {!categoriesQuery.isLoading && !categoriesQuery.isError && !filteredCategories.length ? (
        <section className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-6 text-center">
          <p className="text-lg font-semibold text-[var(--sf-text-main)]">{categories.length ? 'No categories match these filters.' : 'No categories found.'}</p>
          {categories.length ? (
            <Button type="button" variant="outline" className="mt-4 rounded-xl" onClick={() => setSearchParams(new URLSearchParams())}>
              Clear Filters
            </Button>
          ) : null}
        </section>
      ) : null}

      {!categoriesQuery.isLoading && !categoriesQuery.isError && filteredCategories.length ? (
        <>
          <section className="hidden overflow-hidden rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] lg:block">
            <div className="overflow-x-auto">
            <table className="min-w-[1040px] w-full text-left">
              <thead className="bg-[var(--sf-surface-soft)]">
                <tr className="text-xs uppercase tracking-[0.12em] text-[var(--sf-text-muted)]">
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Slug</th>
                  <th className="px-4 py-3">Services</th>
                  <th className="px-4 py-3">Providers</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Updated</th>
                  <th className="sticky right-0 bg-[var(--sf-surface-soft)] px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.map((categoryItem) => (
                  <tr key={categoryItem?.id} className="border-t border-[var(--sf-border)]">
                    <td className="px-4 py-4">
                      <p className="font-semibold text-[var(--sf-text-main)]">{categoryItem?.name || 'Unnamed category'}</p>
                      <p className="text-xs text-[var(--sf-text-muted)]">{categoryItem?.description || 'No description'}</p>
                    </td>
                    <td className="px-4 py-4 text-sm text-[var(--sf-text-muted)]">{categoryItem?.slug || '—'}</td>
                    <td className="px-4 py-4 text-sm text-[var(--sf-text-muted)]">{categoryItem?.serviceCount ?? '—'}</td>
                    <td className="px-4 py-4 text-sm text-[var(--sf-text-muted)]">{categoryItem?.providerCount ?? '—'}</td>
                    <td className="px-4 py-4"><StatusBadge status={categoryItem?.isActive ? 'ACTIVE' : 'INACTIVE'} /></td>
                    <td className="px-4 py-4 text-sm text-[var(--sf-text-muted)]">{categoryItem?.updatedAt ? formatDate(categoryItem.updatedAt) : '—'}</td>
                    <td className="sticky right-0 bg-[var(--sf-surface)] px-4 py-4">{actionButtons(categoryItem)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </section>

          <section className="grid gap-3 md:grid-cols-2 lg:hidden">
            {filteredCategories.map((categoryItem) => (
              <article key={categoryItem?.id} className="w-full min-w-0 rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-4">
                <p className="truncate font-semibold text-[var(--sf-text-main)]">{categoryItem?.name || 'Unnamed category'}</p>
                <p className="truncate text-xs text-[var(--sf-text-muted)]">{categoryItem?.slug || categoryItem?.id}</p>
                <p className="mt-1 line-clamp-2 text-sm text-[var(--sf-text-muted)]">{categoryItem?.description || 'No description available'}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <StatusBadge status={categoryItem?.isActive ? 'ACTIVE' : 'INACTIVE'} />
                  {categoryItem?.serviceCount != null ? <span className="rounded-full border border-[var(--sf-border)] px-3 py-1 text-xs text-[var(--sf-text-muted)]">Services: {categoryItem.serviceCount}</span> : null}
                </div>
                <div className="mt-3 [&_button]:h-10 [&_button]:w-full">{actionButtons(categoryItem)}</div>
              </article>
            ))}
          </section>
        </>
      ) : null}

      {isDesktop ? (
        <Modal open={Boolean(selectedCategoryId)} onClose={() => setSelectedCategoryId(null)} title="Category Details">
          {categoryDetailsQuery.isLoading ? <p className="text-sm text-[var(--sf-text-muted)]">Loading category details...</p> : detailsContent}
        </Modal>
      ) : (
        <Drawer open={Boolean(selectedCategoryId)} onClose={() => setSelectedCategoryId(null)} title="Category Details">
          {categoryDetailsQuery.isLoading ? <p className="text-sm text-[var(--sf-text-muted)]">Loading category details...</p> : detailsContent}
        </Drawer>
      )}

      {isDesktop ? (
        <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Category">
          <CategoryForm submitLabel="Create Category" loading={createCategoryMutation.isPending} onSubmit={onCreateCategory} onUploadImage={uploadCategoryImage} />
        </Modal>
      ) : (
        <Drawer open={showCreate} onClose={() => setShowCreate(false)} title="Create Category">
          <CategoryForm submitLabel="Create Category" loading={createCategoryMutation.isPending} onSubmit={onCreateCategory} onUploadImage={uploadCategoryImage} />
        </Drawer>
      )}

      {isDesktop ? (
        <Modal open={Boolean(editCategoryId)} onClose={() => setEditCategoryId(null)} title="Edit Category">
          <CategoryForm initialValues={editCategory} submitLabel="Save Changes" loading={updateCategoryMutation.isPending} onSubmit={onUpdateCategory} onUploadImage={uploadCategoryImage} />
        </Modal>
      ) : (
        <Drawer open={Boolean(editCategoryId)} onClose={() => setEditCategoryId(null)} title="Edit Category">
          <CategoryForm initialValues={editCategory} submitLabel="Save Changes" loading={updateCategoryMutation.isPending} onSubmit={onUpdateCategory} onUploadImage={uploadCategoryImage} />
        </Drawer>
      )}

      <ConfirmDialog
        open={Boolean(pendingAction)}
        onClose={() => setPendingAction(null)}
        onConfirm={runAction}
        title={pendingAction?.type === 'delete' ? 'Delete category?' : pendingAction?.type === 'archive' ? 'Archive category?' : 'Update category status?'}
        description={`Are you sure you want to ${pendingAction?.type || 'update'} ${pendingAction?.name || 'this category'}?`}
        confirmLabel={pendingAction?.type === 'delete' ? 'Delete' : pendingAction?.type === 'archive' ? 'Archive' : 'Confirm'}
      />
    </Container>
  );
}

export default AdminCategories;
