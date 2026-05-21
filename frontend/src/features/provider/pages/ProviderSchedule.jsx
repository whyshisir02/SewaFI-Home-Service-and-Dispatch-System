import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Plus, Trash2 } from 'lucide-react';
import { PageHeader } from '../../../components/common/PageHeader';
import { Button } from '../../../components/ui/Button/Button';
import { Select } from '../../../components/ui/Input/Select';
import { Card } from '../../../components/ui/Layout/Card';
import { Container } from '../../../components/ui/Layout/Container';
import { appToast } from '../../../lib/toast';
import { ROUTES } from '../../../constants/routes.constant';
import { getErrorMessage } from '../../../utils/errorHandler';
import { getProviderProfile, parseAvailability } from '../../../components/provider/providerDashboardUtils';
import { ProviderScheduleForm } from '../components/ProviderScheduleForm';
import { useProviderAreas, useProviderAreaActions } from '../hooks/useProviderAreas';
import { useProviderSchedule } from '../hooks/useProviderSchedule';
import {
  useDistricts,
  useMunicipalities,
  useProvinces,
} from '../../location/hooks/useLocations';

const DEFAULT_WORKING_DAYS = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];

const toLocationOptions = (items = []) =>
  items.map((item) => {
    const label = item?.name || item?.label || item;
    const value = item?.name || item?.value || item;
    return { label, value };
  });

function ProviderSchedule() {
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedMunicipality, setSelectedMunicipality] = useState('');
  const { profileQuery, updateScheduleMutation } = useProviderSchedule();
  const areasQuery = useProviderAreas();
  const { addAreaMutation, removeAreaMutation } = useProviderAreaActions();
  const provincesQuery = useProvinces();
  const districtsQuery = useDistricts(selectedProvince);
  const municipalitiesQuery = useMunicipalities(selectedProvince, selectedDistrict);

  const providerProfile = getProviderProfile(profileQuery.data);
  const availability = parseAvailability(providerProfile?.availability);
  const providerStatus = providerProfile?.status || 'PENDING_APPROVAL';
  const canManageAreas = providerStatus === 'APPROVED';
  const workingAreas = Array.isArray(areasQuery.data) ? areasQuery.data : [];

  const initialValues = useMemo(
    () => ({
      availableToday: availability.availableToday ?? true,
      workingDays:
        Array.isArray(availability.workingDays) && availability.workingDays.length
          ? availability.workingDays
          : DEFAULT_WORKING_DAYS,
      startTime: availability.startTime || '09:00',
      endTime: availability.endTime || '18:00',
    }),
    [availability.availableToday, availability.endTime, availability.startTime, availability.workingDays]
  );

  const onSaveSchedule = async (values) => {
    try {
      await updateScheduleMutation.mutateAsync({
        availableToday: Boolean(values.availableToday),
        workingDays: values.workingDays,
        startTime: values.startTime,
        endTime: values.endTime,
      });
      appToast.success('Schedule saved successfully.');
    } catch (error) {
      appToast.error(getErrorMessage(error, 'Unable to save schedule right now.'));
    }
  };

  const onAddArea = async () => {
    if (!selectedProvince || !selectedDistrict) {
      appToast.error('Please select province and district.');
      return;
    }

    try {
      await addAreaMutation.mutateAsync({
        province: selectedProvince,
        district: selectedDistrict,
        municipality: selectedMunicipality || null,
      });
      appToast.success('Working area added.');
      setSelectedMunicipality('');
    } catch (error) {
      appToast.error(getErrorMessage(error, 'Unable to add working area.'));
    }
  };

  const onRemoveArea = async (areaId) => {
    try {
      await removeAreaMutation.mutateAsync(areaId);
      appToast.success('Working area removed.');
    } catch (error) {
      appToast.error(getErrorMessage(error, 'Unable to remove working area.'));
    }
  };

  return (
    <Container className="space-y-8">
      <PageHeader
        eyebrow="Schedule"
        title="Manage schedule and service coverage"
        description="Control availability for new bookings and define the areas where you accept jobs."
        actions={
          <Button as={Link} to={ROUTES.provider.availability} variant="outline" className="h-11 rounded-xl">
            Availability Overview
          </Button>
        }
      />

      <Card>
        <ProviderScheduleForm
          initialValues={initialValues}
          onSubmit={onSaveSchedule}
          loading={updateScheduleMutation.isPending}
        />
        <p className="mt-3 text-sm text-[var(--sf-text-muted)]">
          Dispatch coverage is area-based. Configure working days and time windows here, then manage service areas below.
        </p>
      </Card>

      <Card className="space-y-4">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-[var(--sf-primary)]" />
          <h3 className="text-lg font-semibold text-[var(--sf-text-main)]">Working areas</h3>
        </div>

        {!canManageAreas ? (
          <p className="text-sm text-[var(--sf-text-muted)]">
            Your provider profile must be approved before you can modify dispatch coverage areas.
          </p>
        ) : null}

        <div className="grid gap-3 md:grid-cols-3">
          <Select
            label="Province"
            placeholder={provincesQuery.isLoading ? 'Loading provinces...' : 'Select province'}
            value={selectedProvince}
            onChange={(event) => {
              setSelectedProvince(event.target.value);
              setSelectedDistrict('');
              setSelectedMunicipality('');
            }}
            options={toLocationOptions(provincesQuery.data || [])}
            disabled={!canManageAreas}
          />
          <Select
            label="District"
            placeholder={districtsQuery.isLoading ? 'Loading districts...' : 'Select district'}
            value={selectedDistrict}
            onChange={(event) => {
              setSelectedDistrict(event.target.value);
              setSelectedMunicipality('');
            }}
            options={toLocationOptions(districtsQuery.data || [])}
            disabled={!selectedProvince || !canManageAreas}
          />
          <Select
            label="Municipality (optional)"
            placeholder={
              municipalitiesQuery.isLoading
                ? 'Loading municipalities...'
                : 'Leave empty for whole district'
            }
            value={selectedMunicipality}
            onChange={(event) => setSelectedMunicipality(event.target.value)}
            options={toLocationOptions(municipalitiesQuery.data || [])}
            disabled={!selectedDistrict || !canManageAreas}
          />
        </div>

        <div className="flex justify-end">
          <Button
            type="button"
            className="h-11 rounded-xl"
            onClick={onAddArea}
            disabled={!canManageAreas || addAreaMutation.isPending}
            loading={addAreaMutation.isPending}
          >
            <Plus className="h-4 w-4" />
            Add Working Area
          </Button>
        </div>

        {areasQuery.isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-12 animate-pulse rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface-soft)]" />
            ))}
          </div>
        ) : workingAreas.length ? (
          <div className="space-y-2">
            {workingAreas.map((area) => (
              <div
                key={area.id}
                className="flex flex-col gap-3 rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface-soft)] p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <p className="text-sm text-[var(--sf-text-main)]">
                  {[area?.municipality || 'Whole district', area?.district, area?.province]
                    .filter(Boolean)
                    .join(', ')}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 rounded-xl border-[var(--sf-danger)] text-[var(--sf-danger)] hover:bg-[var(--sf-danger)]/10"
                  onClick={() => onRemoveArea(area.id)}
                  disabled={!canManageAreas || removeAreaMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                  Remove
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--sf-text-muted)]">
            No working areas added yet. Add at least one area to receive matching nearby jobs.
          </p>
        )}
      </Card>
    </Container>
  );
}

export default ProviderSchedule;
