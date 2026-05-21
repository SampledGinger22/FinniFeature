import { Segmented } from 'antd';
import { useCaseloadStore } from '@/state/useCaseloadStore';
import { CaseloadViewMode } from '@/enums/caseloadViewMode';

const VIEW_OPTIONS = [
  { value: CaseloadViewMode.Card, label: 'Cards' },
  { value: CaseloadViewMode.Table, label: 'Table' },
  { value: CaseloadViewMode.Board, label: 'Board' },
];

// Switches the active caseload view. Writes only the view mode in the shared store, so the data
// and filters are untouched and the switch never triggers a refetch (§8).
export function CaseloadViewSwitcher(): JSX.Element {
  const viewMode = useCaseloadStore((state) => state.viewMode);
  const setViewMode = useCaseloadStore((state) => state.setViewMode);
  return (
    <Segmented
      options={VIEW_OPTIONS}
      value={viewMode}
      onChange={(value) => setViewMode(value as CaseloadViewMode)}
      aria-label="Switch caseload view"
    />
  );
}
