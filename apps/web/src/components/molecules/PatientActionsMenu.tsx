import { Button, Dropdown } from 'antd';
import type { PatientWithRelations } from '@finni/shared';
import { usePatientActions } from '@/components/molecules/usePatientActions';
import { patientFullName } from '@/filtering/caseloadFiltering';

interface PatientActionsMenuProps {
  patient: PatientWithRelations;
}

// Kebab affordance for one patient's contextual actions (§12), shared by the card and table. The
// menu config (incl. the quick "Set status" submenu) comes from usePatientActions, the same source
// the right-click context menu uses. Stops click propagation so it never opens the edit drawer.
export function PatientActionsMenu({ patient }: PatientActionsMenuProps): JSX.Element {
  const getMenu = usePatientActions();
  return (
    <Dropdown menu={getMenu(patient)} trigger={['click']}>
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
