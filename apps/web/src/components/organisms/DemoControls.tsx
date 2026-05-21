import { App, Button, Card, Typography } from 'antd';
import {
  useBlankSlateDemoMutation,
  usePurgeExpiredDemoMutation,
  useReseedDemoMutation,
} from '@/queries/patientQueries';
import { useDemoControlsStyles } from '@/components/organisms/DemoControls.styles';

// Confirm-gated demo dataset controls (§12). These would not exist in production — they are
// surfaced only in the demo/dev build so reviewers can reset the seed without touching a DB.
export function DemoControls(): JSX.Element {
  const { message, modal } = App.useApp();
  const { styles } = useDemoControlsStyles();

  const purgeExpired = usePurgeExpiredDemoMutation();
  const reseed = useReseedDemoMutation();
  const blankSlate = useBlankSlateDemoMutation();

  const handlePurgeExpired = (): void => {
    modal.confirm({
      title: 'Purge expired soft-deleted patients?',
      content: 'Permanently removes records past the 30-day retention window.',
      okText: 'Purge',
      onOk: () =>
        purgeExpired.mutateAsync().then(
          (result) => message.success(`Purged ${result.purged} record(s)`),
          () => message.error('Purge failed'),
        ),
    });
  };

  const handleReseed = (): void => {
    modal.confirm({
      title: 'Reseed the demo dataset?',
      content: 'Replaces current data with the standard demo patients.',
      okText: 'Reseed',
      onOk: () =>
        reseed.mutateAsync().then(
          (result) => message.success(`Seeded ${result.total} patient(s)`),
          () => message.error('Reseed failed'),
        ),
    });
  };

  const handleBlankSlate = (): void => {
    modal.confirm({
      title: 'Wipe all patients?',
      content:
        'This removes every patient record permanently. There is no undo. Use only to start from an empty dataset.',
      okText: 'Wipe everything',
      okButtonProps: { danger: true },
      onOk: () =>
        blankSlate.mutateAsync().then(
          (result) => message.success(`Removed ${result.removed} record(s)`),
          () => message.error('Blank slate failed'),
        ),
    });
  };

  return (
    <Card
      className={styles.panel}
      title="Demo controls"
      size="small"
      bordered
    >
      <Typography.Text className={styles.subtitle}>
        These reset the dataset and would not exist in production.
      </Typography.Text>
      <div className={styles.actions}>
        <Button
          onClick={handlePurgeExpired}
          loading={purgeExpired.isPending}
        >
          Purge expired
        </Button>
        <Button
          onClick={handleReseed}
          loading={reseed.isPending}
        >
          Reseed
        </Button>
        <Button
          danger
          onClick={handleBlankSlate}
          loading={blankSlate.isPending}
        >
          Blank slate
        </Button>
      </div>
    </Card>
  );
}
