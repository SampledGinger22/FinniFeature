import { Tag } from 'antd';
import { PatientStatus } from '@finni/shared';
import { useStatusTagStyles } from '@/components/atoms/StatusTag.styles';

// Display labels for the six-state lifecycle (§6.4). UI copy lives in the web layer; the shared
// package owns the enum values, not their presentation. Exported so the edit-drawer select reuses it.
export const patientStatusLabels: Record<PatientStatus, string> = {
  [PatientStatus.Inquiry]: 'Inquiry',
  [PatientStatus.Waitlisted]: 'Waitlist',
  [PatientStatus.Onboarding]: 'Onboarding',
  [PatientStatus.Active]: 'Active',
  [PatientStatus.Paused]: 'Paused',
  [PatientStatus.Churned]: 'Churned',
};

interface StatusTagProps {
  status: PatientStatus;
}

export function StatusTag({ status }: StatusTagProps): JSX.Element {
  const { styles } = useStatusTagStyles(status);
  return <Tag className={styles.tag}>{patientStatusLabels[status]}</Tag>;
}
