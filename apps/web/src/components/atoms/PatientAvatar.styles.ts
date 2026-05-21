import { createStyles } from 'antd-style';

// The deterministic background is computed from the patient seed (a token color), so it arrives
// as a prop rather than a literal. The silhouette uses the avatar-silhouette CSS var.
export const usePatientAvatarStyles = createStyles(({ css }, background: string) => ({
  fallback: css`
    background: ${background};
    color: var(--finni-avatar-silhouette);
    display: inline-flex;
    align-items: center;
    justify-content: center;
  `,
}));
