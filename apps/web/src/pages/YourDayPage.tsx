import { Typography } from 'antd';
import { Link } from 'react-router-dom';
import { BrandLogo } from '@/components/atoms/BrandLogo';
import { useYourDayPageStyles } from '@/pages/YourDayPage.styles';

// Placeholder "Your day" page — replaced by the your-day stream in Step 5. Will summarize the
// caseload at a glance (counts by status, recent activity) over the shared data layer.
export function YourDayPage(): JSX.Element {
  const { styles } = useYourDayPageStyles();
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <BrandLogo />
        <Typography.Title level={3} className={styles.title}>
          Your day
        </Typography.Title>
        <Link to="/">Back to caseload</Link>
      </header>
      <Typography.Paragraph>Daily summary coming in Step 5.</Typography.Paragraph>
    </div>
  );
}
