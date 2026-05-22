import { useMemo } from 'react';
import { App, Card, Select, Tag, Typography } from 'antd';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { DateTimeUtil, PatientStatus } from '@finni/shared';
import type { PatientUpdateInput, PatientWithRelations } from '@finni/shared';
import { PatientAvatar } from '@/components/atoms/PatientAvatar';
import { StatusTag, patientStatusLabels } from '@/components/atoms/StatusTag';
import { PatientActionsMenu } from '@/components/molecules/PatientActionsMenu';
import { patientFullName } from '@/filtering/caseloadFiltering';
import { useUpdatePatientMutation } from '@/queries/patientQueries';
import { useCaseloadStore } from '@/state/useCaseloadStore';
import type { PatientCollectionViewProps } from '@/components/organisms/patientCollectionView';
import {
  caseloadBoardColumns,
  groupPatientsByStatus,
  resolveStatusChange,
} from '@/components/organisms/caseloadBoard';
import { useCaseloadBoardViewStyles } from '@/components/organisms/CaseloadBoardView.styles';

// Pointer drags only begin after a small move, so a plain click still opens the edit drawer
// instead of being swallowed as a drag (D: board card = click-to-edit, hold-to-move).
const DRAG_ACTIVATION_DISTANCE = 5;

// Column-chooser options in canonical lifecycle order (matches the board column order).
const boardColumnOptions = caseloadBoardColumns.map((status) => ({
  value: status,
  label: patientStatusLabels[status],
}));

interface BoardCardProps {
  patient: PatientWithRelations;
  onEditPatient: (patient: PatientWithRelations) => void;
}

function BoardCard({ patient, onEditPatient }: BoardCardProps): JSX.Element {
  const { styles, cx } = useCaseloadBoardViewStyles();
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: patient.id });
  const fullName = patientFullName(patient);

  return (
    <Card
      ref={setNodeRef}
      size="small"
      className={cx(styles.card, isDragging && styles.cardDragging)}
      {...attributes}
      {...listeners}
      role="button"
      aria-label={`Edit ${fullName}`}
      onClick={() => onEditPatient(patient)}
    >
      <div className={styles.cardBody}>
        <PatientAvatar seed={patient.id} alt={fullName} />
        <div className={styles.cardDetails}>
          <Typography.Text className={styles.cardName} ellipsis>
            {fullName}
          </Typography.Text>
          <span className={styles.cardMeta}>Age {DateTimeUtil.calculateAge(patient.dateOfBirth)}</span>
          <div className={styles.cardTags}>
            <StatusTag status={patient.status} />
            {patient.hasInsurance ? <Tag>Insured</Tag> : null}
          </div>
        </div>
        <PatientActionsMenu patient={patient} />
      </div>
    </Card>
  );
}

interface BoardColumnProps {
  status: PatientStatus;
  patients: PatientWithRelations[];
  onEditPatient: (patient: PatientWithRelations) => void;
}

function BoardColumn({ status, patients, onEditPatient }: BoardColumnProps): JSX.Element {
  const { styles, cx } = useCaseloadBoardViewStyles();
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <section
      ref={setNodeRef}
      className={cx(styles.column, isOver && styles.columnOver)}
      aria-label={`${patientStatusLabels[status]} column`}
    >
      <header className={styles.columnHeader}>
        <span>{patientStatusLabels[status]}</span>
        <Tag>{patients.length}</Tag>
      </header>
      <div className={styles.columnList}>
        {patients.length === 0 ? (
          <span className={styles.columnEmpty}>No patients</span>
        ) : (
          patients.map((patient) => (
            <BoardCard key={patient.id} patient={patient} onEditPatient={onEditPatient} />
          ))
        )}
      </div>
    </section>
  );
}

// Builds the full update payload from a patient with only its status replaced — the PATCH
// contract requires the whole core record (D15), so a status move sends every current field.
function statusUpdateInput(patient: PatientWithRelations, status: PatientStatus): PatientUpdateInput {
  return {
    firstName: patient.firstName,
    middleName: patient.middleName,
    lastName: patient.lastName,
    dateOfBirth: patient.dateOfBirth,
    status,
    hasInsurance: patient.hasInsurance,
  };
}

// Kanban board: one droppable column per lifecycle status, compact draggable cards. Dragging a
// card to another column changes its status; a plain click opens the edit drawer (§8).
export function CaseloadBoardView({ patients, onEditPatient }: PatientCollectionViewProps): JSX.Element {
  const { styles } = useCaseloadBoardViewStyles();
  const { message } = App.useApp();
  const mutation = useUpdatePatientMutation();
  const boardStatuses = useCaseloadStore((state) => state.boardStatuses);
  const setBoardStatuses = useCaseloadStore((state) => state.setBoardStatuses);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: DRAG_ACTIVATION_DISTANCE } }),
    useSensor(KeyboardSensor),
  );
  const groups = useMemo(() => groupPatientsByStatus(patients), [patients]);
  // Show only the chosen status columns, in canonical order, so a provider can hide ones they
  // don't track. Drag-and-drop still targets any rendered column.
  const visibleColumns = useMemo(
    () => caseloadBoardColumns.filter((status) => boardStatuses.includes(status)),
    [boardStatuses],
  );

  const handleDragEnd = (event: DragEndEvent): void => {
    const overStatus = event.over ? String(event.over.id) : null;
    const change = resolveStatusChange(String(event.active.id), overStatus, patients);
    if (!change) return;
    mutation.mutate(
      { id: change.patient.id, input: statusUpdateInput(change.patient, change.newStatus) },
      {
        onSuccess: () => message.success(`Moved to ${patientStatusLabels[change.newStatus]}`),
        onError: () => message.error('Could not move patient. Try again.'),
      },
    );
  };

  return (
    <div>
      <div className={styles.toolbar}>
        <Typography.Text className={styles.cardMeta}>Columns</Typography.Text>
        <Select
          className={styles.chooser}
          mode="multiple"
          allowClear
          placeholder="Columns to show"
          aria-label="Board columns"
          options={boardColumnOptions}
          value={boardStatuses}
          onChange={(value: PatientStatus[]) => setBoardStatuses(value)}
        />
      </div>
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className={styles.board}>
          {visibleColumns.map((status) => (
            <BoardColumn
              key={status}
              status={status}
              patients={groups[status]}
              onEditPatient={onEditPatient}
            />
          ))}
        </div>
      </DndContext>
    </div>
  );
}
