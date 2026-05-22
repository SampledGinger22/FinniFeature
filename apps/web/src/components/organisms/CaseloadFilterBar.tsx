import { useMemo } from 'react';
import { Button, Checkbox, Input, InputNumber, Select, Typography } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
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

// Insurance is a fixed three-way facet (no derived options); null means no constraint.
const INSURANCE_ANY = 'any';
const INSURANCE_INSURED = 'insured';
const INSURANCE_UNINSURED = 'uninsured';
const insuranceOptions = [
  { value: INSURANCE_ANY, label: 'insurance: any' },
  { value: INSURANCE_INSURED, label: 'insured' },
  { value: INSURANCE_UNINSURED, label: 'not insured' },
];

function insuredToOption(insured: boolean | null): string {
  if (insured === null) return INSURANCE_ANY;
  return insured ? INSURANCE_INSURED : INSURANCE_UNINSURED;
}

function optionToInsured(value: string): boolean | null {
  if (value === INSURANCE_INSURED) return true;
  if (value === INSURANCE_UNINSURED) return false;
  return null;
}

// The hero compound filter (§9), laid out as a sentence: each control is general — it offers
// exactly the facets present in the loaded set and writes straight to the caseload store, so all
// three views share one filter layer.
export function CaseloadFilterBar({ facets, totalLoaded, matchCount }: CaseloadFilterBarProps): JSX.Element {
  const { styles } = useCaseloadFilterBarStyles();
  const filters = useCaseloadStore((state) => state.filters);
  const scope = useCaseloadStore((state) => state.scope);
  const setSearchText = useCaseloadStore((state) => state.setSearchText);
  const setStatuses = useCaseloadStore((state) => state.setStatuses);
  const setRegion = useCaseloadStore((state) => state.setRegion);
  const setCity = useCaseloadStore((state) => state.setCity);
  const setAgeRange = useCaseloadStore((state) => state.setAgeRange);
  const setInsured = useCaseloadStore((state) => state.setInsured);
  const setScope = useCaseloadStore((state) => state.setScope);
  const resetFilters = useCaseloadStore((state) => state.resetFilters);

  // Options change only when the loaded scope changes (facets derive from the unfiltered set),
  // so memoize them — a name-search keystroke must not rebuild the region/city dropdowns.
  const regionOptions = useMemo(() => facets.regions.map((region) => ({ value: region, label: region })), [facets.regions]);
  const cityOptions = useMemo(() => facets.cities.map((city) => ({ value: city, label: city })), [facets.cities]);

  const showArchived = scope === RepositoryScope.IncludeArchived;

  return (
    <div className={styles.panel} role="search" aria-label="Caseload filters">
      <div className={styles.sentence}>
        <Typography.Text className={styles.connector}>Show me</Typography.Text>
        <Select
          className={styles.statusControl}
          mode="multiple"
          allowClear
          placeholder="any status"
          aria-label="Status"
          options={statusFilterOptions}
          value={filters.statuses}
          onChange={(value: PatientStatus[]) => setStatuses(value)}
        />
        <Typography.Text className={styles.connector}>patients in</Typography.Text>
        <Select
          className={styles.control}
          allowClear
          placeholder="anywhere"
          aria-label="Region"
          options={regionOptions}
          value={filters.region}
          onChange={(value: string | null) => setRegion(value ?? null)}
        />
        <Select
          className={styles.control}
          allowClear
          showSearch
          placeholder="any city"
          aria-label="City"
          options={cityOptions}
          value={filters.city}
          onChange={(value: string | null) => setCity(value ?? null)}
        />
        <Typography.Text className={styles.connector}>aged</Typography.Text>
        <span className={styles.ageGroup}>
          <InputNumber
            className={styles.ageInput}
            min={0}
            placeholder={facets.ageBounds ? String(facets.ageBounds.min) : 'min'}
            aria-label="Minimum age"
            value={filters.ageMin}
            onChange={(value) => setAgeRange(typeof value === 'number' ? value : null, filters.ageMax)}
          />
          <Typography.Text className={styles.connector}>to</Typography.Text>
          <InputNumber
            className={styles.ageInput}
            min={0}
            placeholder={facets.ageBounds ? String(facets.ageBounds.max) : 'max'}
            aria-label="Maximum age"
            value={filters.ageMax}
            onChange={(value) => setAgeRange(filters.ageMin, typeof value === 'number' ? value : null)}
          />
        </span>
        <Select
          className={styles.control}
          aria-label="Insurance"
          options={insuranceOptions}
          value={insuredToOption(filters.insured)}
          onChange={(value: string) => setInsured(optionToInsured(value))}
        />
      </div>

      <div className={styles.row}>
        <Input
          className={styles.search}
          allowClear
          prefix={<SearchOutlined />}
          placeholder="Find by name, location, email, or phone"
          aria-label="Search"
          value={filters.searchText}
          onChange={(event) => setSearchText(event.target.value)}
        />
        <Checkbox
          checked={showArchived}
          onChange={(event) =>
            setScope(event.target.checked ? RepositoryScope.IncludeArchived : RepositoryScope.Active)
          }
        >
          Show archived
        </Checkbox>
        <span className={styles.spacer} />
        <Typography.Text className={styles.count}>{`${matchCount} of ${totalLoaded}`}</Typography.Text>
        <Button onClick={resetFilters}>Reset filters</Button>
      </div>
    </div>
  );
}
