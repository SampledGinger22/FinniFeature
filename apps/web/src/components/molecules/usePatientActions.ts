import { useCallback } from 'react';
import { App } from 'antd';
import type { MenuProps } from 'antd';
import { PatientStatus } from '@finni/shared';
import type { PatientWithRelations } from '@finni/shared';
import { patientStatusLabels } from '@/components/atoms/StatusTag';
import {
  useArchivePatientMutation,
  usePurgePatientMutation,
  useRestorePatientMutation,
  useSoftDeletePatientMutation,
  useUnarchivePatientMutation,
  useUpdatePatientMutation,
} from '@/queries/patientQueries';
import { patientFullName } from '@/filtering/caseloadFiltering';

const STATUS_KEY_PREFIX = 'status:';
const ACTION_ARCHIVE = 'archive';
const ACTION_UNARCHIVE = 'unarchive';
const ACTION_RESTORE = 'restore';
const ACTION_DELETE = 'delete';
const ACTION_PURGE = 'purge';
const STATUS_ORDER = Object.values(PatientStatus);

// One source of truth for a patient's contextual actions (§12), shared by the card/table kebab and
// the right-click context menu on both. Returns a builder so the mutations are created once per
// host component and reused for every row. Includes a quick "Set status" submenu.
export function usePatientActions(): (patient: PatientWithRelations) => MenuProps {
  const { message, modal } = App.useApp();
  const update = useUpdatePatientMutation();
  const archive = useArchivePatientMutation();
  const unarchive = useUnarchivePatientMutation();
  const softDelete = useSoftDeletePatientMutation();
  const restore = useRestorePatientMutation();
  const purge = usePurgePatientMutation();

  return useCallback(
    (patient: PatientWithRelations): MenuProps => {
      const isDeleted = patient.deletedAt !== null;

      // Quick status change: re-send the current patient fields with the chosen status (address and
      // contacts are left untouched — they are optional on the update contract, D58).
      const setStatus = (status: PatientStatus): void => {
        if (status === patient.status) return;
        update.mutate(
          {
            id: patient.id,
            input: {
              firstName: patient.firstName,
              middleName: patient.middleName,
              lastName: patient.lastName,
              dateOfBirth: patient.dateOfBirth,
              status,
              hasInsurance: patient.hasInsurance,
            },
          },
          {
            onSuccess: () => message.success(`Status set to ${patientStatusLabels[status]}`),
            onError: () => message.error('Could not update status'),
          },
        );
      };

      const statusSubmenu = {
        key: 'set-status',
        label: 'Set status',
        children: STATUS_ORDER.map((status) => ({
          key: `${STATUS_KEY_PREFIX}${status}`,
          label: patientStatusLabels[status],
          disabled: status === patient.status,
        })),
      };

      const items: MenuProps['items'] = isDeleted
        ? [
            { key: ACTION_RESTORE, label: 'Restore' },
            { type: 'divider' },
            { key: ACTION_PURGE, label: 'Delete permanently', danger: true },
          ]
        : [
            statusSubmenu,
            { type: 'divider' },
            patient.archived
              ? { key: ACTION_UNARCHIVE, label: 'Reactivate' }
              : { key: ACTION_ARCHIVE, label: 'Archive' },
            { type: 'divider' },
            { key: ACTION_DELETE, label: 'Delete', danger: true },
          ];

      const runDelete = (): void => {
        modal.confirm({
          title: `Delete ${patientFullName(patient)}?`,
          content: 'They move to Trash and are purged after 30 days. You can restore until then.',
          okText: 'Delete',
          okButtonProps: { danger: true },
          onOk: () =>
            softDelete.mutateAsync(patient.id).then(
              () => message.success('Patient moved to Trash'),
              () => message.error('Could not delete patient'),
            ),
        });
      };

      const runPurge = (): void => {
        modal.confirm({
          title: `Permanently delete ${patientFullName(patient)}?`,
          content: 'This erases the record and all of its data for good. This cannot be undone.',
          okText: 'Delete permanently',
          okButtonProps: { danger: true },
          onOk: () =>
            purge.mutateAsync(patient.id).then(
              () => message.success('Patient permanently deleted'),
              () => message.error('Could not delete patient'),
            ),
        });
      };

      const onClick: NonNullable<MenuProps['onClick']> = ({ key, domEvent }) => {
        domEvent.stopPropagation();
        if (key.startsWith(STATUS_KEY_PREFIX)) {
          setStatus(key.slice(STATUS_KEY_PREFIX.length) as PatientStatus);
        } else if (key === ACTION_ARCHIVE) {
          archive.mutate(patient.id, { onError: () => message.error('Could not archive') });
        } else if (key === ACTION_UNARCHIVE) {
          unarchive.mutate(patient.id, { onError: () => message.error('Could not unarchive') });
        } else if (key === ACTION_RESTORE) {
          restore.mutate(patient.id, {
            onSuccess: () => message.success('Patient restored'),
            onError: () => message.error('Could not restore'),
          });
        } else if (key === ACTION_DELETE) {
          runDelete();
        } else if (key === ACTION_PURGE) {
          runPurge();
        }
      };

      return { items, onClick };
    },
    [message, modal, update, archive, unarchive, softDelete, restore, purge],
  );
}
