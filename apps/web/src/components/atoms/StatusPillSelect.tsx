import { PatientStatus } from '@finni/shared';
import { patientStatusLabels } from '@/components/atoms/StatusTag';
import { useStatusPillSelectStyles } from '@/components/atoms/StatusPillSelect.styles';

interface StatusPillSelectProps {
  value?: PatientStatus;
  onChange?: (value: PatientStatus) => void;
}

const statusOrder = Object.values(PatientStatus);

// Single-select lifecycle picker rendered as color-dot pills. Shaped as a controlled input (value
// + onChange) so it drops straight into an antd Form.Item. Selected pill carries the status tint.
export function StatusPillSelect({ value, onChange }: StatusPillSelectProps): JSX.Element {
  const { styles } = useStatusPillSelectStyles();
  return (
    <div className={styles.group} role="radiogroup" aria-label="Lifecycle status">
      {statusOrder.map((status) => {
        const selected = value === status;
        return (
          <button
            key={status}
            type="button"
            className={styles.pill}
            role="radio"
            aria-checked={selected}
            style={
              selected
                ? {
                    background: `var(--finni-status-${status}-bg)`,
                    borderColor: `var(--finni-status-${status}-fg)`,
                    color: `var(--finni-status-${status}-fg)`,
                  }
                : undefined
            }
            onClick={() => onChange?.(status)}
          >
            <span className={styles.dot} style={{ background: `var(--finni-status-${status}-fg)` }} />
            {patientStatusLabels[status]}
          </button>
        );
      })}
    </div>
  );
}
