import { useMemo } from 'react';
import type { HTMLAttributes } from 'react';
import { Dropdown, Table, Tag, Typography } from 'antd';
import { InboxOutlined, RightOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { SorterResult, SortOrder } from 'antd/es/table/interface';
import { DateTimeUtil } from '@finni/shared';
import type { PatientWithRelations } from '@finni/shared';
import { PatientAvatar } from '@/components/atoms/PatientAvatar';
import { StatusTag } from '@/components/atoms/StatusTag';
import { PatientActionsMenu } from '@/components/molecules/PatientActionsMenu';
import { usePatientActions } from '@/components/molecules/usePatientActions';
import { compareCaseloadPatients, patientFullName, patientInitials } from '@/filtering/caseloadFiltering';
import { derivePatientAttention } from '@/attention/patientAttention';
import type { PatientCollectionViewProps } from '@/components/organisms/patientCollectionView';
import { useCaseloadTableViewStyles } from '@/components/organisms/CaseloadTableView.styles';
import { useCaseloadStore } from '@/state/useCaseloadStore';
import { CaseloadSortDirection, CaseloadSortField } from '@/enums/caseloadSort';

// Column keys that map to a shared sort field; both view and table write the SAME store, so a
// header click and the toolbar Sort control stay in lockstep (one ordering, never two).
const SORT_FIELD_BY_COLUMN: Record<string, CaseloadSortField> = {
  patient: CaseloadSortField.Name,
  age: CaseloadSortField.Age,
  status: CaseloadSortField.Status,
};
// Reflect the shared sort onto whichever column owns it; the rest show no indicator. Module-level
// (stable) so the columns memo can depend only on the sort values, not a per-render closure.
function sortOrderForColumn(
  columnKey: string,
  sortField: CaseloadSortField,
  sortDirection: CaseloadSortDirection,
): SortOrder {
  if (SORT_FIELD_BY_COLUMN[columnKey] !== sortField) return null;
  return sortDirection === CaseloadSortDirection.Asc ? 'ascend' : 'descend';
}

// Primary address used for locality display — isPrimary wins, else first; parallels PatientCard.
function primaryAddress(
  patient: PatientWithRelations,
): PatientWithRelations['addresses'][number] | undefined {
  return patient.addresses.find((address) => address.isPrimary) ?? patient.addresses[0];
}

function formatLocality(patient: PatientWithRelations): string {
  const address = primaryAddress(patient);
  if (!address) return '—';
  return address.city ? `${address.city}, ${address.region}` : address.region;
}

// Dense antd Table for the caseload. Receives a ready, already-filtered set; the switcher
// owns loading/error/empty so this component only handles the data state.
export function CaseloadTableView({ patients, onEditPatient }: PatientCollectionViewProps): JSX.Element {
  const { styles } = useCaseloadTableViewStyles();
  const getMenu = usePatientActions();
  const sortField = useCaseloadStore((state) => state.sortField);
  const sortDirection = useCaseloadStore((state) => state.sortDirection);
  const setSort = useCaseloadStore((state) => state.setSort);
  const patientsById = useMemo(() => new Map(patients.map((entry) => [entry.id, entry])), [patients]);

  // A header click writes back to the shared store; clearing the sort falls back to Name ascending
  // so the order is always deterministic and both views agree.
  const handleSortChange = (sorter: SorterResult<PatientWithRelations> | SorterResult<PatientWithRelations>[]): void => {
    const active = Array.isArray(sorter) ? sorter[0] : sorter;
    const field = active?.columnKey ? SORT_FIELD_BY_COLUMN[String(active.columnKey)] : undefined;
    if (!field || !active?.order) {
      setSort(CaseloadSortField.Name, CaseloadSortDirection.Asc);
      return;
    }
    setSort(field, active.order === 'descend' ? CaseloadSortDirection.Desc : CaseloadSortDirection.Asc);
  };

  // Wrap each row in a context-menu Dropdown so right-click opens the same actions menu as the
  // kebab. antd clones the <tr> (no extra DOM), merging the contextMenu handler with the row click.
  const tableComponents = useMemo(
    () => ({
      body: {
        row: (rowProps: HTMLAttributes<HTMLTableRowElement> & { 'data-row-key'?: string }) => {
          const patient = rowProps['data-row-key'] ? patientsById.get(rowProps['data-row-key']) : undefined;
          if (!patient) return <tr {...rowProps} />;
          return (
            <Dropdown menu={getMenu(patient)} trigger={['contextMenu']}>
              <tr {...rowProps} />
            </Dropdown>
          );
        },
      },
    }),
    [patientsById, getMenu],
  );

  // Stable column defs so antd's Table header isn't reconciled on every data/filter re-render.
  const columns: ColumnsType<PatientWithRelations> = useMemo(() => [
    {
      title: 'Patient',
      key: 'patient',
      sortOrder: sortOrderForColumn('patient', sortField, sortDirection),
      sorter: (a: PatientWithRelations, b: PatientWithRelations) =>
        compareCaseloadPatients(CaseloadSortField.Name, a, b),
      render: (_: unknown, record: PatientWithRelations) => {
        const name = patientFullName(record);
        return (
          <div className={styles.nameCell}>
            <PatientAvatar
              seed={record.id}
              shape="circle"
              initials={patientInitials(record)}
              status={record.status}
              alt={name}
            />
            <span className={styles.nameText}>
              <Typography.Text className={styles.nameCellText} ellipsis>
                {name}
              </Typography.Text>
              {record.archived && (
                <Tag className={styles.archivedFlag} color="warning" icon={<InboxOutlined />}>
                  Archived
                </Tag>
              )}
            </span>
          </div>
        );
      },
    },
    {
      title: 'Age',
      key: 'age',
      width: 80,
      sortOrder: sortOrderForColumn('age', sortField, sortDirection),
      sorter: (a: PatientWithRelations, b: PatientWithRelations) =>
        compareCaseloadPatients(CaseloadSortField.Age, a, b),
      render: (_: unknown, record: PatientWithRelations) =>
        DateTimeUtil.calculateAge(record.dateOfBirth),
    },
    {
      title: 'Status',
      key: 'status',
      width: 140,
      sortOrder: sortOrderForColumn('status', sortField, sortDirection),
      sorter: (a: PatientWithRelations, b: PatientWithRelations) =>
        compareCaseloadPatients(CaseloadSortField.Status, a, b),
      render: (_: unknown, record: PatientWithRelations) => <StatusTag status={record.status} />,
    },
    {
      title: 'Location',
      key: 'location',
      render: (_: unknown, record: PatientWithRelations) => (
        <Typography.Text className={styles.locationText}>{formatLocality(record)}</Typography.Text>
      ),
    },
    {
      title: 'Insurance',
      key: 'insurance',
      width: 130,
      render: (_: unknown, record: PatientWithRelations) =>
        record.hasInsurance ? (
          <span className={styles.insurancePill}>
            <SafetyCertificateOutlined />
            Insured
          </span>
        ) : (
          <span className={styles.muted}>Not on file</span>
        ),
    },
    {
      title: 'Attention',
      key: 'attention',
      render: (_: unknown, record: PatientWithRelations) => {
        const reason = derivePatientAttention(record);
        return reason === null ? (
          <span className={styles.muted}>—</span>
        ) : (
          <span className={styles.attentionCell}>
            <span className={styles.attentionDot} aria-hidden="true" />
            {reason}
          </span>
        );
      },
    },
    {
      title: '',
      key: 'actions',
      width: 88,
      render: (_: unknown, record: PatientWithRelations) => (
        <div className={styles.rowTrailing}>
          <span className={styles.rowActions} onClick={(event) => event.stopPropagation()}>
            <PatientActionsMenu patient={record} />
          </span>
          <RightOutlined className={styles.chevron} aria-hidden="true" />
        </div>
      ),
    },
  ], [styles, sortField, sortDirection]);

  return (
    <Table<PatientWithRelations>
      dataSource={patients}
      columns={columns}
      components={tableComponents}
      rowKey={(patient) => patient.id}
      size="middle"
      pagination={false}
      rowClassName={styles.tableRow}
      onChange={(_pagination, _filters, sorter) => handleSortChange(sorter)}
      onRow={(record) => ({
        onClick: () => onEditPatient(record),
      })}
    />
  );
}
