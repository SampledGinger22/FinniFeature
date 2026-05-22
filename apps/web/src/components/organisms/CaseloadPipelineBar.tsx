import { useMemo } from 'react';
import { Typography } from 'antd';
import type { PatientWithRelations } from '@finni/shared';
import { patientStatusLabels } from '@/components/atoms/StatusTag';
import { useCaseloadStore } from '@/state/useCaseloadStore';
import { derivePipelineSegments } from '@/components/organisms/caseloadPipeline';
import { useCaseloadPipelineBarStyles } from '@/components/organisms/CaseloadPipelineBar.styles';

interface CaseloadPipelineBarProps {
  patients: PatientWithRelations[];
  matchCount: number;
}

// Pipeline over the loaded set: one status-tinted segment per status, widths proportional to count,
// each toggling its status filter in the shared store so the views below narrow in step.
export function CaseloadPipelineBar({ patients, matchCount }: CaseloadPipelineBarProps): JSX.Element | null {
  const { styles, cx } = useCaseloadPipelineBarStyles();
  const activeStatuses = useCaseloadStore((state) => state.filters.statuses);
  const toggleStatus = useCaseloadStore((state) => state.toggleStatus);

  const segments = useMemo(() => derivePipelineSegments(patients), [patients]);

  if (patients.length === 0) return null;

  return (
    <section className={styles.section} aria-label="Caseload pipeline">
      <div className={styles.header}>
        <Typography.Text className={styles.eyebrow}>Caseload pipeline</Typography.Text>
        <Typography.Text className={styles.count}>{`${matchCount} match · ${patients.length} total`}</Typography.Text>
        <Typography.Text className={styles.hint}>Click a segment to filter</Typography.Text>
      </div>
      <div className={styles.bar} role="group" aria-label="Filter by status">
        {segments.map((segment) => {
          const active = activeStatuses.includes(segment.status);
          const label = patientStatusLabels[segment.status];
          return (
            <button
              key={segment.status}
              type="button"
              className={cx(styles.segment, active && styles.segmentActive)}
              style={{
                background: `var(--finni-status-${segment.status}-bg)`,
                color: `var(--finni-status-${segment.status}-fg)`,
              }}
              aria-pressed={active}
              aria-label={`${label}, ${segment.count} patients`}
              onClick={() => toggleStatus(segment.status)}
            >
              <span className={styles.dot} aria-hidden="true" />
              <span className={styles.segmentLabel}>{label}</span>
              <span className={styles.segmentCount}>{segment.count}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
