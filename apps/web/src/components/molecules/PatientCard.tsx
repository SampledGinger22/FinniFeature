import { Card, Dropdown, Tag, Typography } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import { DateTimeUtil } from '@finni/shared';
import type { PatientWithRelations } from '@finni/shared';
import { PatientAvatar } from '@/components/atoms/PatientAvatar';
import { StatusTag } from '@/components/atoms/StatusTag';
import { PatientActionsMenu } from '@/components/molecules/PatientActionsMenu';
import { usePatientActions } from '@/components/molecules/usePatientActions';
import { usePatientCardStyles } from '@/components/molecules/PatientCard.styles';

interface PatientCardProps {
  patient: PatientWithRelations;
  onEdit: (patient: PatientWithRelations) => void;
}

// Locality from the primary address (or first); city is optional, region (state) is required.
function primaryLocality(patient: PatientWithRelations): string {
  const address = patient.addresses.find((entry) => entry.isPrimary) ?? patient.addresses[0];
  if (!address) return 'No address on file';
  return address.city ? `${address.city}, ${address.region}` : address.region;
}

// Photo-forward card (§8): avatar, name, derived age, status, locality, insurance flag. The whole
// card opens the edit drawer. Age is derived once via DateTimeUtil so it never disagrees with a filter.
export function PatientCard({ patient, onEdit }: PatientCardProps): JSX.Element {
  const { styles } = usePatientCardStyles();
  const getMenu = usePatientActions();
  const fullName = [patient.firstName, patient.middleName, patient.lastName].filter(Boolean).join(' ');

  // Right-click anywhere on the card opens the same actions menu the kebab does.
  return (
    <Dropdown menu={getMenu(patient)} trigger={['contextMenu']}>
      <Card
        hoverable
        className={styles.card}
        onClick={() => onEdit(patient)}
        role="button"
        aria-label={`Edit ${fullName}`}
      >
        <div className={styles.body}>
          <PatientAvatar seed={patient.id} size="large" alt={fullName} />
          <div className={styles.details}>
            <Typography.Text className={styles.name} ellipsis>
              {fullName}
            </Typography.Text>
            <span className={styles.meta}>
              Age {DateTimeUtil.calculateAge(patient.dateOfBirth)} · {primaryLocality(patient)}
            </span>
            <div className={styles.tags}>
              <StatusTag status={patient.status} />
              {patient.hasInsurance ? <Tag>Insured</Tag> : null}
              {patient.archived ? (
                <Tag color="warning" icon={<InboxOutlined />}>
                  Archived
                </Tag>
              ) : null}
            </div>
          </div>
          <PatientActionsMenu patient={patient} />
        </div>
      </Card>
    </Dropdown>
  );
}
