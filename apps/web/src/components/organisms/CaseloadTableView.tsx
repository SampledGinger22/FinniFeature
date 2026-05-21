import { useMemo } from 'react';
import { Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DateTimeUtil } from '@finni/shared';
import type { PatientWithRelations } from '@finni/shared';
import { PatientAvatar } from '@/components/atoms/PatientAvatar';
import { StatusTag } from '@/components/atoms/StatusTag';
import { PatientActionsMenu } from '@/components/molecules/PatientActionsMenu';
import { patientFullName } from '@/filtering/caseloadFiltering';
import type { PatientCollectionViewProps } from '@/components/organisms/patientCollectionView';
import { patientStatusLabels } from '@/components/atoms/StatusTag';
import { useCaseloadTableViewStyles } from '@/components/organisms/CaseloadTableView.styles';

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

  // Stable column defs so antd's Table header isn't reconciled on every data/filter re-render.
  const columns: ColumnsType<PatientWithRelations> = useMemo(() => [
    {
      title: 'Patient',
      key: 'patient',
      render: (_: unknown, record: PatientWithRelations) => {
        const name = patientFullName(record);
        return (
          <div className={styles.nameCell}>
            <PatientAvatar seed={record.id} size="small" alt={name} />
            <Typography.Text className={styles.nameCellText} ellipsis>
              {name}
            </Typography.Text>
          </div>
        );
      },
    },
    {
      title: 'Age',
      key: 'age',
      width: 80,
      sorter: (a: PatientWithRelations, b: PatientWithRelations) =>
        DateTimeUtil.calculateAge(a.dateOfBirth) - DateTimeUtil.calculateAge(b.dateOfBirth),
      render: (_: unknown, record: PatientWithRelations) =>
        DateTimeUtil.calculateAge(record.dateOfBirth),
    },
    {
      title: 'Status',
      key: 'status',
      width: 140,
      sorter: (a: PatientWithRelations, b: PatientWithRelations) =>
        patientStatusLabels[a.status].localeCompare(patientStatusLabels[b.status]),
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
      width: 110,
      render: (_: unknown, record: PatientWithRelations) =>
        record.hasInsurance ? <Tag>Insured</Tag> : '—',
    },
    {
      title: '',
      key: 'actions',
      width: 56,
      render: (_: unknown, record: PatientWithRelations) => (
        <PatientActionsMenu patient={record} />
      ),
    },
  ], [styles]);

  return (
    <Table<PatientWithRelations>
      dataSource={patients}
      columns={columns}
      rowKey={(patient) => patient.id}
      size="middle"
      pagination={false}
      rowClassName={styles.tableRow}
      onRow={(record) => ({
        onClick: () => onEditPatient(record),
      })}
    />
  );
}
