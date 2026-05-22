import { Alert, Button, Empty, Skeleton } from 'antd';
import { Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import { RepositoryScope } from '@finni/shared';
import { BrandLogo } from '@/components/atoms/BrandLogo';
import { ErrorBoundary } from '@/components/molecules/ErrorBoundary';
import { YourDaySummary } from '@/components/organisms/YourDaySummary';
import { usePatientListQuery } from '@/queries/patientQueries';
import { useYourDayPageStyles } from '@/pages/YourDayPage.styles';

const SKELETON_ROWS = 4;

// At-a-glance daily summary over the active caseload. Mirrors the explicit loading/error/empty/data
// states from CaseloadView; wraps the data region in an ErrorBoundary for per-widget resilience.
export function YourDayPage(): JSX.Element {
  const { styles } = useYourDayPageStyles();
  const navigate = useNavigate();
  const query = usePatientListQuery(RepositoryScope.Active);

  const renderContent = (): JSX.Element => {
    if (query.isError) {
      return (
        <Alert
          type="error"
          showIcon
          message="Could not load caseload"
          description="Something went wrong fetching patient data."
          action={
            <Button size="small" onClick={() => void query.refetch()}>
              Retry
            </Button>
          }
        />
      );
    }

    if (query.isLoading) {
      return (
        <div aria-busy="true">
          <Skeleton active paragraph={{ rows: SKELETON_ROWS }} />
        </div>
      );
    }

    if (!query.data || query.data.length === 0) {
      return <Empty description="No active patients in the caseload" />;
    }

    return (
      <ErrorBoundary fallbackTitle="The summary could not be displayed">
        <YourDaySummary patients={query.data} />
      </ErrorBoundary>
    );
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <BrandLogo />
        <Typography.Title level={3} className={styles.title}>
          Your day
        </Typography.Title>
        <nav className={styles.nav}>
          <Button onClick={() => navigate('/')}>Back to caseload</Button>
        </nav>
      </header>

      <div className={styles.content}>{renderContent()}</div>
    </div>
  );
}
