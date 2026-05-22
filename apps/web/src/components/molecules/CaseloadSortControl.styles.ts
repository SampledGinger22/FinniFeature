import { createStyles } from 'antd-style';

// The order-by Select needs a floor width so its option labels (Name / Age / Status) are not
// clipped inside the compact group that pairs it with the direction toggle.
export const useCaseloadSortControlStyles = createStyles(({ css }) => ({
  field: css`
    min-width: calc(var(--finni-space-xl) * 5);
  `,
}));
