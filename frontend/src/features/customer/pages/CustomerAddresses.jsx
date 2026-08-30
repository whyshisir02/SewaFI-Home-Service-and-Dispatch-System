import { useMemo, useState } from 'react';
import { Button } from '../../../components/ui/Button/Button';
import { Container } from '../../../components/ui/Layout/Container';
import { EmptyState } from '../../../components/ui/Feedback/EmptyState';
import { appToast } from '../../../lib/toast';
import { getErrorMessage } from '../../../utils/errorHandler';
import { useAddressActions, useCustomerAddresses } from '../hooks/useCustomerAddresses';
import AddressesHeader from '../components/addresses/AddressesHeader';
import DefaultAddressCard from '../components/addresses/DefaultAddressCard';
import AddressCard from '../components/addresses/AddressCard';
import AddressFormDialog from '../components/addresses/AddressFormDialog';
import DeleteAddressDialog from '../components/addresses/DeleteAddressDialog';

const EMPTY_FORM_VALUES = {
  label: '',
  fullName: '',
  phone: '',
  province: '',
  district: '',
  municipality: '',
  ward: '',
  addressLine: '',
  landmark: '',
  latitude: '',
  longitude: '',
  isDefault: false,
};

const getAddressFieldSupport = () => ({
  label: true,
  fullName: true,
  phone: true,
  ward: true,
  landmark: true,
  coordinates: true,
  defaultFlag: true,
});

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-24 animate-pulse rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)]" />
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-52 animate-pulse rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)]" />
        ))}
      </div>
    </div>
  );
}

function CustomerAddresses() {
  const addressesQuery = useCustomerAddresses();
  const { createMutation, updateMutation, deleteMutation, defaultMutation } = useAddressActions();

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('create');
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const addresses = useMemo(() => addressesQuery.data?.items || [], [addressesQuery.data?.items]);
  const fieldSupport = useMemo(() => getAddressFieldSupport(), []);

  const supportsAddressApi = !addressesQuery.isError || addressesQuery.error?.code !== 'ADDRESS_ENDPOINT_UNAVAILABLE';
  const defaultAddress = addresses.find((item) => item?.isDefault) || null;

  const canCreate = supportsAddressApi && !addressesQuery.isError;
  const canEdit = supportsAddressApi && !addressesQuery.isError;
  const canDelete = supportsAddressApi && !addressesQuery.isError;
  const canSetDefault = supportsAddressApi && !addressesQuery.isError;

  const openCreateDialog = () => {
    setFormMode('create');
    setSelectedAddress(EMPTY_FORM_VALUES);
    setFormOpen(true);
  };

  const openEditDialog = (address) => {
    setFormMode('edit');
    setSelectedAddress(address);
    setFormOpen(true);
  };

  const closeFormDialog = () => {
    if (createMutation.isPending || updateMutation.isPending) return;
    setFormOpen(false);
    setSelectedAddress(null);
  };

  const handleSubmitForm = async (payload) => {
    try {
      if (formMode === 'edit' && selectedAddress?.id) {
        await updateMutation.mutateAsync({ id: selectedAddress.id, payload });
        appToast.success('Address updated successfully.');
      } else {
        await createMutation.mutateAsync(payload);
        appToast.success('Address saved successfully.');
      }
      setFormOpen(false);
      setSelectedAddress(null);
    } catch (error) {
      appToast.error(getErrorMessage(error, 'Unable to save address right now.'));
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget?.id) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      appToast.success('Address deleted successfully.');
      setDeleteTarget(null);
    } catch (error) {
      appToast.error(getErrorMessage(error, 'Unable to delete address right now.'));
    }
  };

  const handleSetDefault = async (address) => {
    if (!address?.id) return;
    try {
      await defaultMutation.mutateAsync(address.id);
      appToast.success('Default address updated.');
    } catch (error) {
      appToast.error(getErrorMessage(error, 'Unable to set default address right now.'));
    }
  };

  return (
    <Container className="space-y-6 py-6 lg:py-8">
      <AddressesHeader
        onRefresh={() => addressesQuery.refetch()}
        onAdd={openCreateDialog}
        canAdd={canCreate}
        refreshing={addressesQuery.isFetching}
      />

      {addressesQuery.isLoading ? <LoadingSkeleton /> : null}

      {!addressesQuery.isLoading && addressesQuery.isError && addressesQuery.error?.code === 'ADDRESS_ENDPOINT_UNAVAILABLE' ? (
        <section className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-6 text-center">
          <h2 className="text-xl font-bold text-[var(--sf-text-main)]">Saved addresses are temporarily unavailable.</h2>
          <p className="mt-2 text-sm text-[var(--sf-text-muted)]">Please try again shortly.</p>
        </section>
      ) : null}

      {!addressesQuery.isLoading && addressesQuery.isError && addressesQuery.error?.code !== 'ADDRESS_ENDPOINT_UNAVAILABLE' ? (
        <section className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-6">
          <p className="font-semibold text-[var(--sf-text-main)]">Unable to load saved addresses right now.</p>
          <p className="mt-1 text-sm text-[var(--sf-text-muted)]">{getErrorMessage(addressesQuery.error, 'Please try again.')}</p>
          <div className="mt-4">
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => addressesQuery.refetch()}>
              Retry
            </Button>
          </div>
        </section>
      ) : null}

      {!addressesQuery.isLoading && !addressesQuery.isError ? (
        <>
          <DefaultAddressCard address={defaultAddress} />

          {!addresses.length ? (
            <EmptyState
              title="No saved addresses yet."
              description="Add your home or service location to make booking faster."
              actionLabel={canCreate ? 'Add Address' : undefined}
              onAction={canCreate ? openCreateDialog : undefined}
            />
          ) : (
            <section className="grid gap-4 md:grid-cols-2">
              {addresses.map((address) => (
                <AddressCard
                  key={address?.id}
                  address={address}
                  canEdit={canEdit}
                  canDelete={canDelete}
                  canSetDefault={canSetDefault}
                  settingDefault={defaultMutation.isPending && defaultMutation.variables === address?.id}
                  onEdit={openEditDialog}
                  onDelete={setDeleteTarget}
                  onSetDefault={handleSetDefault}
                />
              ))}
            </section>
          )}
        </>
      ) : null}

      <AddressFormDialog
        key={`${formOpen}-${formMode}-${selectedAddress?.id || 'new'}`}
        open={formOpen}
        mode={formMode}
        initialValues={selectedAddress}
        loading={createMutation.isPending || updateMutation.isPending}
        fieldSupport={fieldSupport}
        onClose={closeFormDialog}
        onSubmit={handleSubmitForm}
      />

      <DeleteAddressDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        loading={deleteMutation.isPending}
      />
    </Container>
  );
}

export default CustomerAddresses;
