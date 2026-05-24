import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { RefreshCw, ShieldCheck, UserCheck, UserCog, Users, UserX } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { PageHeader } from '../../../components/common/PageHeader';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { Button } from '../../../components/ui/Button/Button';
import { Container } from '../../../components/ui/Layout/Container';
import { ConfirmDialog } from '../../../components/ui/Overlay/ConfirmDialog';
import { Modal } from '../../../components/ui/Overlay/Modal';
import { Drawer } from '../../../components/ui/Overlay/Drawer';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import { appToast } from '../../../lib/toast';
import { getErrorMessage } from '../../../utils/errorHandler';
import { formatDate } from '../../../utils/formatDate';
import { ROUTES } from '../../../constants/routes.constant';
import { useAdminUserDetails, useAdminUsers } from '../hooks/useAdminUsers';

const roleOptions = [
  { value: 'all', label: 'All Roles' },
  { value: 'CUSTOMER', label: 'Customer' },
  { value: 'PROVIDER', label: 'Provider' },
  { value: 'ADMIN', label: 'Admin' },
];

const statusOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'SUSPENDED', label: 'Suspended' },
  { value: 'VERIFIED', label: 'Verified' },
  { value: 'UNVERIFIED', label: 'Unverified' },
];

const sortOptions = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'name_asc', label: 'Name A-Z' },
  { value: 'name_desc', label: 'Name Z-A' },
];

const getUsersArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.users)) return payload.users;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const isUserVerified = (user) =>
  Boolean(user?.isVerified ?? user?.isEmailVerified ?? user?.emailVerified);

const getProviderApprovalStatus = (user) =>
  user?.providerStatus || user?.providerProfile?.status || user?.relatedInfo?.providerStatus || null;

const getAccountStatus = (user) => {
  if (user?.accountStatus) return user.accountStatus;
  if (user?.status) return user.status;
  if (user?.isActive === false) return 'SUSPENDED';
  return isUserVerified(user) ? 'ACTIVE' : 'EMAIL_UNVERIFIED';
};

function AdminUsers() {
  const { user: currentUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);
  const [supportsStatusActions, setSupportsStatusActions] = useState(true);
  const [supportsDelete, setSupportsDelete] = useState(true);
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  const search = searchParams.get('search') || '';
  const role = searchParams.get('role') || 'all';
  const status = searchParams.get('status') || 'all';
  const sort = searchParams.get('sort') || 'newest';
  const page = Number(searchParams.get('page') || 1);

  const backendFilters = useMemo(
    () => ({
      page,
      limit: 20,
      ...(search ? { search } : {}),
      ...(role !== 'all' ? { role } : {}),
      ...(status !== 'all' ? { status } : {}),
      ...(sort !== 'newest' ? { sort } : {}),
    }),
    [page, role, search, sort, status]
  );

  const { usersQuery, statsQuery, updateStatusMutation, deleteUserMutation } = useAdminUsers(backendFilters);
  const users = useMemo(() => getUsersArray(usersQuery.data), [usersQuery.data]);
  const detailsQuery = useAdminUserDetails(selectedUserId);
  const selectedUser = detailsQuery.data || users.find((item) => String(item?.id) === String(selectedUserId));

  const setParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (!value || value === 'all' || value === 'newest') next.delete(key);
    else next.set(key, value);
    if (key !== 'page') next.delete('page');
    setSearchParams(next);
  };

  const filteredUsers = useMemo(() => {
    const needle = search.trim().toLowerCase();
    let result = users.filter((item) => {
      if (role !== 'all' && item?.role !== role) return false;
      if (status === 'VERIFIED' && !isUserVerified(item)) return false;
      if (status === 'UNVERIFIED' && isUserVerified(item)) return false;
      if (status === 'ACTIVE' && getAccountStatus(item) !== 'ACTIVE') return false;
      if (status === 'SUSPENDED' && getAccountStatus(item) !== 'SUSPENDED') return false;
      if (!needle) return true;
      const text = `${item?.fullName || item?.name || ''} ${item?.email || ''} ${item?.phone || ''}`.toLowerCase();
      return text.includes(needle);
    });
    if (sort === 'oldest') {
      result = [...result].sort((a, b) => new Date(a?.createdAt || 0) - new Date(b?.createdAt || 0));
    } else if (sort === 'name_asc') {
      result = [...result].sort((a, b) => String(a?.fullName || a?.name || '').localeCompare(String(b?.fullName || b?.name || '')));
    } else if (sort === 'name_desc') {
      result = [...result].sort((a, b) => String(b?.fullName || b?.name || '').localeCompare(String(a?.fullName || a?.name || '')));
    } else {
      result = [...result].sort((a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0));
    }
    return result;
  }, [role, search, sort, status, users]);

  const stats = useMemo(() => {
    const rawStats = statsQuery.data?.users || statsQuery.data;
    const fromLoaded = {
      total: users.length,
      customers: users.filter((item) => item?.role === 'CUSTOMER').length,
      providers: users.filter((item) => item?.role === 'PROVIDER').length,
      admins: users.filter((item) => item?.role === 'ADMIN').length,
      verified: users.filter((item) => isUserVerified(item)).length,
      suspended: users.filter((item) => getAccountStatus(item) === 'SUSPENDED').length,
    };
    return {
      total: rawStats?.total ?? fromLoaded.total,
      customers: rawStats?.customers ?? fromLoaded.customers,
      providers: rawStats?.providers ?? fromLoaded.providers,
      admins: rawStats?.admins ?? fromLoaded.admins,
      verified: rawStats?.verified ?? fromLoaded.verified,
      suspended: rawStats?.suspended ?? rawStats?.inactive ?? fromLoaded.suspended,
      derived: !(rawStats?.total != null),
    };
  }, [statsQuery.data, users]);

  const runUserAction = async () => {
    if (!pendingAction?.userId || !pendingAction?.type) return;
    try {
      if (pendingAction.type === 'delete') {
        await deleteUserMutation.mutateAsync(pendingAction.userId);
        appToast.success('User deactivated successfully.');
      } else if (pendingAction.type === 'suspend') {
        await updateStatusMutation.mutateAsync({ id: pendingAction.userId, status: 'SUSPENDED' });
        appToast.success('User suspended successfully.');
      } else if (pendingAction.type === 'activate') {
        await updateStatusMutation.mutateAsync({ id: pendingAction.userId, status: 'ACTIVE' });
        appToast.success('User activated successfully.');
      }
      setPendingAction(null);
      usersQuery.refetch();
    } catch (error) {
      const statusCode = error?.response?.status;
      if ((statusCode === 404 || statusCode === 405) && pendingAction.type === 'delete') {
        setSupportsDelete(false);
      }
      if ((statusCode === 404 || statusCode === 405) && pendingAction.type !== 'delete') {
        setSupportsStatusActions(false);
      }
      appToast.error(getErrorMessage(error, 'Unable to complete this user action right now.'));
    }
  };

  const closeDetails = () => setSelectedUserId(null);

  const detailsContent = selectedUser ? (
    <div className="space-y-3 text-sm text-[var(--sf-text-muted)]">
      <p><span className="font-semibold text-[var(--sf-text-main)]">Name:</span> {selectedUser?.fullName || selectedUser?.name || 'Unknown'}</p>
      <p><span className="font-semibold text-[var(--sf-text-main)]">Email:</span> {selectedUser?.email || '—'}</p>
      <p><span className="font-semibold text-[var(--sf-text-main)]">Phone:</span> {selectedUser?.phone || '—'}</p>
      <p><span className="font-semibold text-[var(--sf-text-main)]">Role:</span> <StatusBadge status={selectedUser?.role || 'CUSTOMER'} className="ml-2" /></p>
      <p><span className="font-semibold text-[var(--sf-text-main)]">Verification:</span> <StatusBadge status={isUserVerified(selectedUser) ? 'VERIFIED' : 'UNVERIFIED'} className="ml-2" /></p>
      <p><span className="font-semibold text-[var(--sf-text-main)]">Account status:</span> <StatusBadge status={getAccountStatus(selectedUser)} className="ml-2" /></p>
      {selectedUser?.createdAt ? <p><span className="font-semibold text-[var(--sf-text-main)]">Joined:</span> {formatDate(selectedUser.createdAt, { includeTime: true })}</p> : null}
      {selectedUser?.updatedAt ? <p><span className="font-semibold text-[var(--sf-text-main)]">Updated:</span> {formatDate(selectedUser.updatedAt, { includeTime: true })}</p> : null}
      {selectedUser?.role === 'PROVIDER' && getProviderApprovalStatus(selectedUser) ? (
        <p><span className="font-semibold text-[var(--sf-text-main)]">Provider profile:</span> <StatusBadge status={getProviderApprovalStatus(selectedUser)} className="ml-2" /></p>
      ) : null}
    </div>
  ) : (
    <p className="text-sm text-[var(--sf-text-muted)]">User details unavailable.</p>
  );

  return (
    <Container className="space-y-6 py-6 lg:py-8">
      <PageHeader
        eyebrow="Admin"
        title="Users"
        description="View and manage customer, provider, and admin accounts on SewaFi."
        actions={
          <Button type="button" variant="outline" className="h-11 rounded-xl" onClick={() => {
            usersQuery.refetch();
            statsQuery.refetch();
          }}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {[
          { label: 'Total Users', value: stats.total, icon: Users },
          { label: 'Customers', value: stats.customers, icon: UserCheck },
          { label: 'Providers', value: stats.providers, icon: ShieldCheck },
          { label: 'Admins', value: stats.admins, icon: UserCog },
          { label: 'Verified', value: stats.verified, icon: UserCheck },
          { label: 'Suspended', value: stats.suspended, icon: UserX },
        ].map((card) => (
          <article key={card.label} className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-4">
            <div className="flex items-center gap-2 text-[var(--sf-text-muted)]">
              <card.icon className="h-4 w-4" />
              <p className="text-xs font-semibold uppercase tracking-[0.12em]">{card.label}</p>
            </div>
            <p className="mt-2 text-2xl font-extrabold text-[var(--sf-text-main)]">{card.value ?? '—'}</p>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-4">
        <div className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr]">
          <label className="space-y-1 text-sm text-[var(--sf-text-main)]">
            <span>Search</span>
            <input
              value={search}
              onChange={(event) => setParam('search', event.target.value)}
              placeholder="Search by name, email, phone..."
              className="h-11 w-full rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface)] px-3 text-sm text-[var(--sf-text-main)]"
            />
          </label>
          <label className="space-y-1 text-sm text-[var(--sf-text-main)]">
            <span>Role</span>
            <select value={role} onChange={(event) => setParam('role', event.target.value)} className="h-11 w-full rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface)] px-3 text-sm text-[var(--sf-text-main)]">
              {roleOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <label className="space-y-1 text-sm text-[var(--sf-text-main)]">
            <span>Status</span>
            <select value={status} onChange={(event) => setParam('status', event.target.value)} className="h-11 w-full rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface)] px-3 text-sm text-[var(--sf-text-main)]">
              {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
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

      {usersQuery.isLoading ? (
        <section className="space-y-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-20 animate-pulse rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)]" />
          ))}
        </section>
      ) : null}

      {!usersQuery.isLoading && usersQuery.isError ? (
        <section className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5">
          <p className="font-semibold text-[var(--sf-text-main)]">Unable to load users right now.</p>
          <Button type="button" variant="outline" className="mt-3 rounded-xl" onClick={() => usersQuery.refetch()}>
            Retry
          </Button>
        </section>
      ) : null}

      {!usersQuery.isLoading && !usersQuery.isError && !filteredUsers.length ? (
        <section className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-6 text-center">
          <p className="text-lg font-semibold text-[var(--sf-text-main)]">
            {users.length ? 'No users match these filters.' : 'No users found.'}
          </p>
          {users.length ? (
            <Button type="button" variant="outline" className="mt-4 rounded-xl" onClick={() => setSearchParams(new URLSearchParams())}>
              Clear Filters
            </Button>
          ) : null}
        </section>
      ) : null}

      {!usersQuery.isLoading && !usersQuery.isError && filteredUsers.length ? (
        <>
          <section className="hidden overflow-x-auto rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] lg:block">
            <table className="w-full min-w-[1220px] text-left">
              <thead className="bg-[var(--sf-surface-soft)]">
                <tr className="text-xs uppercase tracking-[0.12em] text-[var(--sf-text-muted)]">
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Joined</th>
                  <th className="px-4 py-3">Related Info</th>
                  <th className="sticky right-0 z-10 whitespace-nowrap bg-[var(--sf-surface-soft)] px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((item) => {
                  const isSelf = String(item?.id) === String(currentUser?.id);
                  return (
                    <tr key={item?.id} className="border-t border-[var(--sf-border)]">
                      <td className="px-4 py-4">
                        <p className="font-semibold text-[var(--sf-text-main)]">{item?.fullName || item?.name || 'Unknown'}</p>
                        <p className="text-xs text-[var(--sf-text-muted)]">{item?.id}</p>
                      </td>
                      <td className="px-4 py-4 text-sm text-[var(--sf-text-muted)]">
                        <p className="max-w-[220px] truncate">{item?.email || 'N/A'}</p>
                        <p className="max-w-[170px] truncate">{item?.phone || 'N/A'}</p>
                      </td>
                      <td className="px-4 py-4"><StatusBadge status={item?.role || 'CUSTOMER'} /></td>
                      <td className="px-4 py-4 text-sm">
                        <div className="flex flex-wrap gap-2">
                          <StatusBadge status={getAccountStatus(item)} />
                          {item?.role === 'PROVIDER' && getProviderApprovalStatus(item) ? (
                            <StatusBadge status={getProviderApprovalStatus(item)} />
                          ) : (
                            <StatusBadge status={isUserVerified(item) ? 'VERIFIED' : 'UNVERIFIED'} />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-[var(--sf-text-muted)]">{item?.createdAt ? formatDate(item.createdAt) : '—'}</td>
                      <td className="px-4 py-4 text-sm text-[var(--sf-text-muted)]">
                        {item?.role === 'PROVIDER' && getProviderApprovalStatus(item)
                          ? `Provider: ${getProviderApprovalStatus(item)}`
                          : item?.bookingsCount != null
                            ? `Bookings: ${item.bookingsCount}`
                            : '—'}
                      </td>
                      <td className="sticky right-0 z-[1] whitespace-nowrap bg-[var(--sf-surface)] px-4 py-4 shadow-[-8px_0_8px_-8px_rgba(15,23,42,0.18)]">
                        <div className="flex flex-wrap gap-2">
                          <Button type="button" variant="outline" className="h-9 rounded-xl" onClick={() => setSelectedUserId(item?.id)}>
                            View Details
                          </Button>
                          {supportsStatusActions && !isSelf ? (
                            getAccountStatus(item) === 'SUSPENDED' ? (
                              <Button
                                type="button"
                                variant="outline"
                                className="h-9 rounded-xl"
                                onClick={() => setPendingAction({ type: 'activate', userId: item?.id, name: item?.fullName || item?.name })}
                                disabled={updateStatusMutation.isPending}
                              >
                                Activate
                              </Button>
                            ) : (
                              <Button
                                type="button"
                                variant="outline"
                                className="h-9 rounded-xl"
                                onClick={() => setPendingAction({ type: 'suspend', userId: item?.id, name: item?.fullName || item?.name })}
                                disabled={updateStatusMutation.isPending}
                              >
                                Suspend
                              </Button>
                            )
                          ) : null}
                          {supportsDelete && !isSelf ? (
                            <Button
                              type="button"
                              variant="danger"
                              className="h-9 rounded-xl"
                              onClick={() => setPendingAction({ type: 'delete', userId: item?.id, name: item?.fullName || item?.name })}
                              disabled={deleteUserMutation.isPending}
                            >
                              Delete
                            </Button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>

          <section className="space-y-3 lg:hidden">
            {filteredUsers.map((item) => {
              const isSelf = String(item?.id) === String(currentUser?.id);
              return (
                <article key={item?.id} className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-4">
                  <p className="font-semibold text-[var(--sf-text-main)]">{item?.fullName || item?.name || 'Unknown'}</p>
                  <p className="mt-1 text-sm text-[var(--sf-text-muted)]">{item?.email || '—'}</p>
                  <p className="text-sm text-[var(--sf-text-muted)]">{item?.phone || '—'}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <StatusBadge status={item?.role || 'CUSTOMER'} />
                    <StatusBadge status={getAccountStatus(item)} />
                    {item?.role === 'PROVIDER' && getProviderApprovalStatus(item) ? (
                      <StatusBadge status={getProviderApprovalStatus(item)} />
                    ) : (
                      <StatusBadge status={isUserVerified(item) ? 'VERIFIED' : 'UNVERIFIED'} />
                    )}
                  </div>
                  <div className="mt-3 grid gap-2">
                    <Button type="button" variant="outline" className="h-10 rounded-xl" onClick={() => setSelectedUserId(item?.id)}>View Details</Button>
                    {supportsStatusActions && !isSelf ? (
                      getAccountStatus(item) === 'SUSPENDED' ? (
                        <Button
                          type="button"
                          variant="outline"
                          className="h-10 rounded-xl"
                          onClick={() => setPendingAction({ type: 'activate', userId: item?.id, name: item?.fullName || item?.name })}
                          disabled={updateStatusMutation.isPending}
                        >
                          Activate
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          className="h-10 rounded-xl"
                          onClick={() => setPendingAction({ type: 'suspend', userId: item?.id, name: item?.fullName || item?.name })}
                          disabled={updateStatusMutation.isPending}
                        >
                          Suspend
                        </Button>
                      )
                    ) : null}
                    {supportsDelete && !isSelf ? (
                      <Button
                        type="button"
                        variant="danger"
                        className="h-10 rounded-xl"
                        onClick={() => setPendingAction({ type: 'delete', userId: item?.id, name: item?.fullName || item?.name })}
                        disabled={deleteUserMutation.isPending}
                      >
                        Delete
                      </Button>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </section>
        </>
      ) : null}

      {/* TODO: Replace local fallback filtering with fully backend-driven filtering once all admin user query params are supported server-side. */}
      {/* TODO: Add explicit pagination controls once users endpoint consistently returns page/total metadata. */}

      {isDesktop ? (
        <Modal open={Boolean(selectedUserId)} onClose={closeDetails} title="User Details">
          {detailsQuery.isLoading ? <p className="text-sm text-[var(--sf-text-muted)]">Loading user details...</p> : detailsContent}
        </Modal>
      ) : (
        <Drawer open={Boolean(selectedUserId)} onClose={closeDetails} title="User Details">
          {detailsQuery.isLoading ? <p className="text-sm text-[var(--sf-text-muted)]">Loading user details...</p> : detailsContent}
        </Drawer>
      )}

      <ConfirmDialog
        open={Boolean(pendingAction)}
        onClose={() => setPendingAction(null)}
        onConfirm={runUserAction}
        title={
          pendingAction?.type === 'delete'
            ? 'Delete user?'
            : pendingAction?.type === 'suspend'
              ? 'Suspend user?'
              : 'Activate user?'
        }
        description={`Are you sure you want to ${pendingAction?.type || 'update'} ${pendingAction?.name || 'this user'}?`}
        confirmLabel={
          pendingAction?.type === 'delete'
            ? 'Delete'
            : pendingAction?.type === 'suspend'
              ? 'Suspend'
              : 'Activate'
        }
        confirmLoading={updateStatusMutation.isPending || deleteUserMutation.isPending}
      />
    </Container>
  );
}

export default AdminUsers;
