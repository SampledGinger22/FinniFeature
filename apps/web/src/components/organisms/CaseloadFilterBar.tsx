import { Button, Space, Typography } from 'antd';
import { useCaseloadStore } from '@/state/useCaseloadStore';
import type { CaseloadFacets } from '@/filtering/caseloadFiltering';

export interface CaseloadFilterBarProps {
  facets: CaseloadFacets;
  totalLoaded: number;
  matchCount: number;
}

// Placeholder for the hero compound filter (status × location × age × name search) — replaced by
// the filter-bar stream in Step 5. Already shows live counts and reset so the contract is real.
export function CaseloadFilterBar({ totalLoaded, matchCount }: CaseloadFilterBarProps): JSX.Element {
  const resetFilters = useCaseloadStore((state) => state.resetFilters);
  return (
    <Space>
      <Typography.Text>{`Showing ${matchCount} of ${totalLoaded}`}</Typography.Text>
      <Button size="small" onClick={resetFilters}>
        Reset filters
      </Button>
    </Space>
  );
}
