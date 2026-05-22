import { Button, Select, Space, Tooltip } from 'antd';
import { SortAscendingOutlined, SortDescendingOutlined } from '@ant-design/icons';
import { useCaseloadStore } from '@/state/useCaseloadStore';
import { CaseloadSortDirection, CaseloadSortField } from '@/enums/caseloadSort';

// Field labels live in the web layer (UI copy), keyed by the const-object union values.
const sortFieldLabels: Record<CaseloadSortField, string> = {
  [CaseloadSortField.Name]: 'Name',
  [CaseloadSortField.Age]: 'Age',
  [CaseloadSortField.Status]: 'Status',
};

const sortFieldOptions = Object.values(CaseloadSortField).map((value) => ({
  value,
  label: sortFieldLabels[value],
}));

// The shared order-by control. Writes sortField/sortDirection into the caseload store, which both
// card and table views read through useFilteredPatients — so the ordering is identical and the
// switch never refetches. Default is Name ascending.
export function CaseloadSortControl(): JSX.Element {
  const sortField = useCaseloadStore((state) => state.sortField);
  const sortDirection = useCaseloadStore((state) => state.sortDirection);
  const setSort = useCaseloadStore((state) => state.setSort);

  const ascending = sortDirection === CaseloadSortDirection.Asc;
  const toggleDirection = (): void =>
    setSort(sortField, ascending ? CaseloadSortDirection.Desc : CaseloadSortDirection.Asc);

  return (
    <Space.Compact>
      <Select<CaseloadSortField>
        value={sortField}
        options={sortFieldOptions}
        onChange={(value) => setSort(value, sortDirection)}
        aria-label="Sort patients by"
      />
      <Tooltip title={ascending ? 'Ascending' : 'Descending'}>
        <Button
          icon={ascending ? <SortAscendingOutlined /> : <SortDescendingOutlined />}
          onClick={toggleDirection}
          aria-label={ascending ? 'Sort ascending' : 'Sort descending'}
        />
      </Tooltip>
    </Space.Compact>
  );
}
