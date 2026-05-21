import { App, Button, Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import type { PatientWithRelations } from '@finni/shared';
import {
  useArchivePatientMutation,
  useRestorePatientMutation,
  useSoftDeletePatientMutation,
  useUnarchivePatientMutation,
} from '@/queries/patientQueries';
import { patientFullName } from '@/filtering/caseloadFiltering';

interface PatientActionsMenuProps {
  patient: PatientWithRelations;
}

const ACTION_ARCHIVE = 'archive';
const ACTION_UNARCHIVE = 'unarchive';
const ACTION_RESTORE = 'restore';
const ACTION_DELETE = 'delete';

// Contextual lifecycle actions for one patient (§12), shared by every view so the card, table,
// and board offer the same operations. Self-contains its mutations; stops click propagation so
// using it inside a clickable card never opens the edit drawer.
export function PatientActionsMenu({ patient }: PatientActionsMenuProps): JSX.Element {
  const { message, modal } = App.useApp();
  const archive = useArchivePatientMutation();
  const unarchive = useUnarchivePatientMutation();
  const softDelete = useSoftDeletePatientMutation();
  const restore = useRestorePatientMutation();

  const isDeleted = patient.deletedAt !== null;
  const items: MenuProps['items'] = isDeleted
    ? [{ key: ACTION_RESTORE, label: 'Restore' }]
    : [
        patient.archived
          ? { key: ACTION_UNARCHIVE, label: 'Unarchive' }
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

  const onClick: MenuProps['onClick'] = ({ key, domEvent }) => {
    domEvent.stopPropagation();
    if (key === ACTION_ARCHIVE) {
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
    }
  };

  return (
    <Dropdown menu={{ items, onClick }} trigger={['click']}>
      <Button
        type="text"
        aria-label={`Actions for ${patientFullName(patient)}`}
        onClick={(event) => event.stopPropagation()}
      >
        ⋮
      </Button>
    </Dropdown>
  );
}
