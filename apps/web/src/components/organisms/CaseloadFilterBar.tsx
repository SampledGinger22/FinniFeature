import { useMemo } from 'react';
import { Button, Input, Segmented, Select, Slider, Typography } from 'antd';
import { PatientStatus, RepositoryScope } from '@finni/shared';
import { patientStatusLabels } from '@/components/atoms/StatusTag';
import { useCaseloadStore } from '@/state/useCaseloadStore';
import { useCaseloadFilterBarStyles } from '@/components/organisms/CaseloadFilterBar.styles';
import type { CaseloadFacets } from '@/filtering/caseloadFiltering';

export interface CaseloadFilterBarProps {
  facets: CaseloadFacets;
  totalLoaded: number;
  matchCount: number;
}

const statusFilterOptions = Object.values(PatientStatus).map((status) => ({
  value: status,
  label: patientStatusLabels[status],
}));

// Scope is the one server dimension. Only Active/Archived belong in the caseload; soft-deleted
// patients live on the dedicated Trash page (Settings), so Trash is intentionally not offered here.
const scopeOptions = [
  { value: RepositoryScope.Active, label: 'Active' },
  { value: RepositoryScope.IncludeArchived, label: 'Archived' },
];

// The hero compound filter (§9): each control is general — it offers exactly the facets present in
// the loaded set and writes straight to the caseload store, so all three views share one filter layer.
export function CaseloadFilterBar({ facets, totalLoaded, matchCount }: CaseloadFilterBarProps): JSX.Element {
  const { styles } = useCaseloadFilterBarStyles();
  const filters = useCaseloadStore((state) => state.filters);
  const scope = useCaseloadStore((state) => state.scope);
  const setSearchText = useCaseloadStore((state) => state.setSearchText);
  const setStatuses = useCaseloadStore((state) => state.setStatuses);
  const setRegion = useCaseloadStore((state) => state.setRegion);
  const setCity = useCaseloadStore((state) => state.setCity);
  const setAgeRange = useCaseloadStore((state) => state.setAgeRange);
  const setScope = useCaseloadStore((state) => state.setScope);
  const resetFilters = useCaseloadStore((state) => state.resetFilters);

  // Options change only when the loaded scope changes (facets derive from the unfiltered set),
  // so memoize them — a name-search keystroke must not rebuild the region/city dropdowns.
  const regionOptions = useMemo(() => facets.regions.map((region) => ({ value: region, label: region })), [facets.regions]);
  const cityOptions = useMemo(() => facets.cities.map((city) => ({ value: city, label: city })), [facets.cities]);

  return (
    <div className={styles.bar} role="search" aria-label="Caseload filters">
      <Input
        className={styles.search}
        allowClear
        placeholder="Search"
        aria-label="Search"
        title="Search names, locations, emails, and phone numbers"
        value={filters.searchText}
        onChange={(event) => setSearchText(event.target.value)}
      />
      <Select
        className={styles.control}
        mode="multiple"
        allowClear
        placeholder="Status"
        aria-label="Status"
        options={statusFilterOptions}
        value={filters.statuses}
        onChange={(value: PatientStatus[]) => setStatuses(value)}
      />
      <Select
        className={styles.control}
        allowClear
        placeholder="Region"
        aria-label="Region"
        options={regionOptions}
        value={filters.region}
        onChange={(value: string | null) => setRegion(value ?? null)}
      />
      <Select
        className={styles.control}
        allowClear
        showSearch
        placeholder="City"
        aria-label="City"
        options={cityOptions}
        value={filters.city}
        onChange={(value: string | null) => setCity(value ?? null)}
      />
      {facets.ageBounds ? (
        <div className={styles.ageControl}>
          <Typography.Text className={styles.label}>Age</Typography.Text>
          <Slider
            className={styles.ageSlider}
            range
            min={facets.ageBounds.min}
            max={facets.ageBounds.max}
            value={[filters.ageMin ?? facets.ageBounds.min, filters.ageMax ?? facets.ageBounds.max]}
            onChange={(value: number[]) => setAgeRange(value[0] ?? null, value[1] ?? null)}
          />
        </div>
      ) : null}
      <div className={styles.ageControl}>
        <Typography.Text className={styles.label}>Show</Typography.Text>
        <Segmented
          options={scopeOptions}
          value={scope}
          onChange={(value) => setScope(value as RepositoryScope)}
        />
      </div>
      <span className={styles.spacer} />
      <Typography.Text className={styles.count}>{`${matchCount} of ${totalLoaded}`}</Typography.Text>
      <Button onClick={resetFilters}>Reset filters</Button>
    </div>
  );
}
