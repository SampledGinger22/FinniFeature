import { createStyles } from 'antd-style';

export interface AvatarFallbackColors {
  background: string;
  foreground: string;
}

// Fallback colors arrive as a prop (token values, not literals): either the seed-hashed ring with
// a light silhouette, or a status-tinted pair for the initials monogram in dense rows.
export const usePatientAvatarStyles = createStyles(({ css }, colors: AvatarFallbackColors) => ({
  fallback: css`
    background: ${colors.background};
    color: ${colors.foreground};
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
  `,
}));
