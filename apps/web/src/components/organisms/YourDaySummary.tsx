import { useMemo } from 'react';
import { Card, Statistic, Typography } from 'antd';
import { PatientStatus } from '@finni/shared';
import type { PatientWithRelations } from '@finni/shared';
import { patientStatusLabels } from '@/components/atoms/StatusTag';
import { summarizeCaseload } from '@/pages/yourDayStats';
import { useYourDaySummaryStyles } from '@/components/organisms/YourDaySummary.styles';

interface YourDaySummaryProps {
  patients: PatientWithRelations[];
}

// Ordered display sequence for the six lifecycle statuses — funnel-top first, churned last.
const STATUS_DISPLAY_ORDER: PatientStatus[] = [
  PatientStatus.Inquiry,
  PatientStatus.Waitlisted,
  PatientStatus.Onboarding,
  PatientStatus.Active,
  PatientStatus.Paused,
  PatientStatus.Churned,
];

// Presentational organism: accepts the loaded patient list and renders caseload stats. All
// computation is delegated to summarizeCaseload so this stays pure-presentation.
export function YourDaySummary({ patients }: YourDaySummaryProps): JSX.Element {
  const { styles } = useYourDaySummaryStyles();
  const summary = useMemo(() => summarizeCaseload(patients), [patients]);

  return (
    <div className={styles.section}>
      <div className={styles.statsRow}>
        <Card className={styles.statCard}>
          <Statistic title="Total active patients" value={summary.total} />
        </Card>
        <Card className={styles.statCard}>
          <Statistic title="Insured" value={summary.insured} />
        </Card>
        <Card className={styles.statCard}>
          <Statistic title="Uninsured" value={summary.uninsured} />
        </Card>
      </div>

      <Typography.Text className={styles.sectionTitle}>By status</Typography.Text>
      <div className={styles.statusGrid}>
        {STATUS_DISPLAY_ORDER.map((status) => (
          <Card key={status} size="small">
            <Statistic title={patientStatusLabels[status]} value={summary.byStatus[status]} />
          </Card>
        ))}
      </div>

      {summary.needsAttention.length > 0 && (
        <>
          <Typography.Text className={styles.sectionTitle}>Needs attention</Typography.Text>
          <div className={styles.attentionList}>
            {summary.needsAttention.map((patient) => (
              <Card key={patient.id} size="small">
                <span className={styles.attentionName}>
                  {patient.firstName} {patient.lastName}
                </span>{' '}
                &mdash; {patientStatusLabels[patient.status]}
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
