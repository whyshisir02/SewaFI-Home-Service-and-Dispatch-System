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
import { toArray } from '../../../utils/collection';
import { formatDate } from '../../../utils/formatDate';
import { ROUTES } from '../../../constants/routes.constant';
import { useAdminUserDetails, useAdminUsers } from '../hooks/useAdminUsers';

const roleOptions = [
  { value: 'all', label: 'All Roles' },
  { value: 'CUSTOMER', label: 'Customer' },
  { value: 'PROVIDER', label: 'Provider' },
  { value: 'ADMIN', label: 'Admin' },
];

const accountStatusOptions = [
  { value: 'ALL', label: 'All Accounts' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'SUSPENDED', label: 'Suspended' },
];

const verificationStatusOptions = [
  { value: 'ALL', label: 'All Verification' },
  { value: 'VERIFIED', label: 'Verified Users' },
  { value: 'UNVERIFIED', label: 'Unverified Users' },
  { value: 'APPROVED_PROVIDER', label: 'Approved Providers' },
  { value: 'PENDING_PROVIDER', label: 'Pending Providers' },
  { value: 'REJECTED_PROVIDER', label: 'Rejected Providers' },
];

const sortOptions = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'name_asc', label: 'Name A-Z' },
  { value: 'name_desc', label: 'Name Z-A' },
];

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
  const accountStatus = searchParams.get('accountStatus') || 'ALL';
  const verificationStatus = searchParams.get('verificationStatus') || 'ALL';
  const sort = searchParams.get('sort') || 'newest';
  const page = Number(searchParams.get('page') || 1);

  const backendFilters = useMemo(
    () => ({
      page,
      limit: 20,
      ...(search ? { search } : {}),
      ...(role !== 'all' ? { role } : {}),
      ...(accountStatus !== 'ALL' ? { accountStatus } : {}),
      ...(verificationStatus !== 'ALL' ? { verificationStatus } : {}),
      ...(sort !== 'newest' ? { sort } : {}),
    }),
    [accountStatus, page, role, search, sort, verificationStatus]
  );

  const { usersQuery, statsQuery, updateStatusMutation, deleteUserMutation } = useAdminUsers(backendFilters);
  const users = useMemo(() => toArray(usersQuery.data, ['users']), [usersQuery.data]);
  const detailsQuery = useAdminUserDetails(selectedUserId);
  const selectedUser = detailsQuery.data || users.find((item) => String(item?.id) === String(selectedUserId));

  const setParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (!value || value === 'all' || value === 'newest' || value === 'ALL') next.delete(key);
    else next.set(key, value);
    if (key !== 'page') next.delete('page');
    setSearchParams(next);
  };

  const filteredUsers = useMemo(() => users, [users]);

  const stats = useMemo(() => {
    const rawStats = statsQuery.data?.users || statsQuery.data || {};
    return {
      total: Number(rawStats?.total || 0),
      customers: Number(rawStats?.customers || 0),
      providers: Number(rawStats?.providers || 0),
      admins: Number(rawStats?.admins || 0),
      verified: Number(rawStats?.verified || 0),
      suspended: Number(rawStats?.suspended || 0),
      others: Number(rawStats?.others || 0),
    };
  }, [statsQuery.data]);

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
          { label: 'Approved Providers', value: stats.providers, icon: ShieldCheck },
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
      <p className="text-xs text-[var(--sf-text-muted)]">
        Overall platform users (global totals). Table filters affect only the list below.
      </p>

      <section className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-4">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr_0.8fr]">
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
            <span>Account Status</span>
            <select value={accountStatus} onChange={(event) => setParam('accountStatus', event.target.value)} className="h-11 w-full rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface)] px-3 text-sm text-[var(--sf-text-main)]">
              {accountStatusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <label className="space-y-1 text-sm text-[var(--sf-text-main)]">
            <span>Verification Status</span>
            <select value={verificationStatus} onChange={(event) => setParam('verificationStatus', event.target.value)} className="h-11 w-full rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface)] px-3 text-sm text-[var(--sf-text-main)]">
              {verificationStatusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
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
                  <th className="px-4 py-3">Account Status</th>
                  <th className="px-4 py-3">Verification Status</th>
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
                      <td className="px-4 py-4 text-sm"><StatusBadge status={getAccountStatus(item)} /></td>
                      <td className="px-4 py-4 text-sm">
                        {item?.role === 'PROVIDER' ? (
                          <StatusBadge status={getProviderApprovalStatus(item) || 'PENDING_APPROVAL'} />
                        ) : (
                          <StatusBadge status={isUserVerified(item) ? 'VERIFIED' : 'UNVERIFIED'} />
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm text-[var(--sf-text-muted)]">{item?.createdAt ? formatDate(item.createdAt) : '—'}</td>
                      <td className="px-4 py-4 text-sm text-[var(--sf-text-muted)]">
                        {item?.role === 'PROVIDER' && getProviderApprovalStatus(item)
                          ? `Provider verification: ${getProviderApprovalStatus(item)}`
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
                <article key={item?.id} className="w-full min-w-0 rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-4">
                  <p className="truncate font-semibold text-[var(--sf-text-main)]">{item?.fullName || item?.name || 'Unknown'}</p>
                  <p className="mt-1 truncate text-sm text-[var(--sf-text-muted)]">{item?.email || '—'}</p>
                  <p className="truncate text-sm text-[var(--sf-text-muted)]">{item?.phone || '—'}</p>
                  <p className="mt-1 text-xs text-[var(--sf-text-muted)]">Joined {item?.createdAt ? formatDate(item.createdAt) : '—'}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <StatusBadge status={item?.role || 'CUSTOMER'} />
                    <span className="self-center text-xs text-[var(--sf-text-muted)]">Account:</span>
                    <StatusBadge status={getAccountStatus(item)} />
                    <span className="self-center text-xs text-[var(--sf-text-muted)]">
                      {item?.role === 'PROVIDER' ? 'Provider:' : 'Verification:'}
                    </span>
                    {item?.role === 'PROVIDER' ? (
                      <StatusBadge status={getProviderApprovalStatus(item) || 'PENDING_APPROVAL'} />
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
