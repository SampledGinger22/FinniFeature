import { useEffect, useState } from 'react';
import { App, Button, DatePicker, Drawer, Form, Input, Steps, Switch, Timeline, Typography } from 'antd';
import {
  EditOutlined,
  EnvironmentOutlined,
  MailOutlined,
  PhoneOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import {
  ContactMethodType,
  DateTimeUtil,
  PatientStatus,
  patientUpdateSchema,
} from '@finni/shared';
import type { PatientUpdateInput, PatientWithRelations } from '@finni/shared';
import { PatientAvatar } from '@/components/atoms/PatientAvatar';
import { StatusTag, patientStatusLabels } from '@/components/atoms/StatusTag';
import { StatusPillSelect } from '@/components/atoms/StatusPillSelect';
import {
  useArchivePatientMutation,
  usePurgePatientMutation,
  useRestorePatientMutation,
  useSoftDeletePatientMutation,
  useUnarchivePatientMutation,
  useUpdatePatientMutation,
} from '@/queries/patientQueries';
import { patientFullName, patientInitials } from '@/filtering/caseloadFiltering';
import { usePreferencesStore } from '@/state/usePreferencesStore';
import { usePatientEditDrawerStyles } from '@/components/organisms/PatientEditDrawer.styles';

interface PatientEditDrawerProps {
  patient: PatientWithRelations | null;
  open: boolean;
  onClose: () => void;
}

interface PatientEditFormValues {
  firstName: string;
  middleName: string;
  lastName: string;
  dateOfBirth: string;
  status: PatientStatus;
  hasInsurance: boolean;
}

type DrawerMode = 'view' | 'edit';

const DOB_DISPLAY_FORMAT = 'MMM D, YYYY';
const STATUS_ORDER = Object.values(PatientStatus);
// backdrop-filter value lives here (not a token) so the drawer mask blurs the workspace behind it.
const MASK_BLUR = { backdropFilter: 'blur(3px)' };

function primaryAddress(patient: PatientWithRelations): PatientWithRelations['addresses'][number] | undefined {
  return patient.addresses.find((address) => address.isPrimary) ?? patient.addresses[0];
}

function formatLocality(patient: PatientWithRelations): string {
  const address = primaryAddress(patient);
  if (!address) return '—';
  return address.city ? `${address.city}, ${address.region}` : address.region;
}

// View/Edit = right drawer (§8): the lateral motion signals "inspect a row". It opens read-first and
// flips to the patient form on Edit record. The same shared Zod schema validates form and API (D15).
export function PatientEditDrawer({ patient, open, onClose }: PatientEditDrawerProps): JSX.Element {
  const { styles } = usePatientEditDrawerStyles();
  const { message, modal } = App.useApp();
  const [mode, setMode] = useState<DrawerMode>('view');
  const [form] = Form.useForm<PatientEditFormValues>();
  const watchedDob = Form.useWatch('dateOfBirth', form);
  const timezone = usePreferencesStore((state) => state.timezone);

  const updateMutation = useUpdatePatientMutation();
  const archive = useArchivePatientMutation();
  const unarchive = useUnarchivePatientMutation();
  const softDelete = useSoftDeletePatientMutation();
  const restore = useRestorePatientMutation();
  const purge = usePurgePatientMutation();

  // Each open starts in view mode; entering edit seeds the form from the current patient.
  useEffect(() => {
    if (open) setMode('view');
  }, [open, patient?.id]);

  useEffect(() => {
    if (mode === 'edit' && patient) {
      form.setFieldsValue({
        firstName: patient.firstName,
        middleName: patient.middleName ?? '',
        lastName: patient.lastName,
        dateOfBirth: patient.dateOfBirth,
        status: patient.status,
        hasInsurance: patient.hasInsurance,
      });
    }
  }, [mode, patient, form]);

  const handleFinish = (values: PatientEditFormValues): void => {
    if (!patient) return;
    const candidate: PatientUpdateInput = {
      firstName: values.firstName,
      middleName: values.middleName.trim() === '' ? null : values.middleName.trim(),
      lastName: values.lastName,
      dateOfBirth: values.dateOfBirth,
      status: values.status,
      hasInsurance: values.hasInsurance,
    };
    const parsed = patientUpdateSchema.safeParse(candidate);
    if (!parsed.success) {
      form.setFields(
        parsed.error.issues.map((issue) => ({
          name: issue.path[0] as keyof PatientEditFormValues,
          errors: [issue.message],
        })),
      );
      return;
    }
    updateMutation.mutate(
      { id: patient.id, input: parsed.data },
      {
        onSuccess: () => {
          message.success('Patient updated');
          onClose();
        },
        onError: () => message.error('Could not update patient. Try again.'),
      },
    );
  };

  const runArchive = (): void => {
    if (!patient) return;
    archive.mutate(patient.id, {
      onSuccess: () => {
        message.success('Patient archived');
        onClose();
      },
      onError: () => message.error('Could not archive'),
    });
  };

  const runUnarchive = (): void => {
    if (!patient) return;
    unarchive.mutate(patient.id, {
      onSuccess: () => message.success('Patient reactivated'),
      onError: () => message.error('Could not reactivate'),
    });
  };

  const runRestore = (): void => {
    if (!patient) return;
    restore.mutate(patient.id, {
      onSuccess: () => {
        message.success('Patient restored');
        onClose();
      },
      onError: () => message.error('Could not restore'),
    });
  };

  const runDelete = (): void => {
    if (!patient) return;
    modal.confirm({
      title: `Delete ${patientFullName(patient)}?`,
      content: 'They move to Trash and are purged after 30 days. You can restore until then.',
      okText: 'Delete',
      okButtonProps: { danger: true },
      onOk: () =>
        softDelete.mutateAsync(patient.id).then(
          () => {
            message.success('Patient moved to Trash');
            onClose();
          },
          () => message.error('Could not delete patient'),
        ),
    });
  };

  const runPurge = (): void => {
    if (!patient) return;
    modal.confirm({
      title: `Permanently delete ${patientFullName(patient)}?`,
      content: 'This erases the record and all of its data for good. This cannot be undone.',
      okText: 'Delete permanently',
      okButtonProps: { danger: true },
      onOk: () =>
        purge.mutateAsync(patient.id).then(
          () => {
            message.success('Patient permanently deleted');
            onClose();
          },
          () => message.error('Could not delete patient'),
        ),
    });
  };

  const renderViewFooter = (): JSX.Element | null => {
    if (!patient) return null;
    const isDeleted = patient.deletedAt !== null;
    return (
      <div className={styles.footer}>
        {isDeleted ? (
          <>
            <Button onClick={runRestore}>Restore</Button>
            <Button danger onClick={runPurge}>
              Delete permanently
            </Button>
          </>
        ) : (
          <>
            <Button onClick={patient.archived ? runUnarchive : runArchive}>
              {patient.archived ? 'Reactivate' : 'Archive'}
            </Button>
            <Button danger onClick={runDelete}>
              Delete
            </Button>
          </>
        )}
        <Button type="primary" icon={<EditOutlined />} className={styles.footerEdit} onClick={() => setMode('edit')}>
          Edit record
        </Button>
      </div>
    );
  };

  const renderEditFooter = (): JSX.Element => (
    <div className={styles.footer}>
      <Button className={styles.footerEdit} onClick={() => setMode('view')}>
        Cancel
      </Button>
      <Button type="primary" loading={updateMutation.isPending} onClick={() => form.submit()}>
        Save changes
      </Button>
    </div>
  );

  const renderView = (record: PatientWithRelations): JSX.Element => {
    const name = patientFullName(record);
    const zone = DateTimeUtil.resolveTimezone(timezone);
    const address = primaryAddress(record);
    return (
      <div className={styles.body}>
        <div className={styles.header}>
          <PatientAvatar seed={record.id} size={64} initials={patientInitials(record)} status={record.status} alt={name} />
          <div className={styles.identity}>
            <Typography.Title level={3} className={styles.name}>
              {name}
            </Typography.Title>
            <span className={styles.metaLine}>
              {`Age ${DateTimeUtil.calculateAge(record.dateOfBirth)} · ${DateTimeUtil.formatDob(record.dateOfBirth)} · ${formatLocality(record)}`}
            </span>
            <div className={styles.pills}>
              <StatusTag status={record.status} />
              <span className={styles.insuredPill}>
                <SafetyCertificateOutlined />
                {record.hasInsurance ? 'Insured' : 'Not on file'}
              </span>
              <span className={styles.idText}>{`ID · ${record.id.slice(0, 6).toUpperCase()}`}</span>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <span className={styles.sectionLabel}>Lifecycle</span>
          <Steps
            size="small"
            responsive={false}
            current={STATUS_ORDER.indexOf(record.status)}
            items={STATUS_ORDER.map((status) => ({ title: patientStatusLabels[status] }))}
          />
        </div>

        <div className={styles.section}>
          <span className={styles.sectionLabel}>Contact</span>
          {record.contactMethods.map((method) => (
            <div key={method.id} className={styles.card}>
              <span className={styles.cardIcon}>
                {method.type === ContactMethodType.Email ? <MailOutlined /> : <PhoneOutlined />}
              </span>
              <div>
                <div className={styles.cardLabel}>{`${method.type} · ${method.label}`}</div>
                <div className={styles.cardValue}>{method.value}</div>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.section}>
          <span className={styles.sectionLabel}>Address</span>
          <div className={styles.card}>
            <span className={styles.cardIcon}>
              <EnvironmentOutlined />
            </span>
            <div>
              <div className={styles.cardLabel}>{`${address?.type ?? 'home'} address`}</div>
              {address?.line1 && <div className={styles.cardValue}>{address.line1}</div>}
              <div className={styles.cardValue}>{formatLocality(record)}{address?.postalCode ? ` ${address.postalCode}` : ''}</div>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <span className={styles.sectionLabel}>Recent</span>
          <Timeline
            items={[
              { children: `Status: ${patientStatusLabels[record.status]}` },
              { children: `Record updated · ${DateTimeUtil.toUserZone(record.updatedAt, zone, DOB_DISPLAY_FORMAT)}` },
              { children: `Added to caseload · ${DateTimeUtil.toUserZone(record.createdAt, zone, DOB_DISPLAY_FORMAT)}` },
            ]}
          />
        </div>
      </div>
    );
  };

  const renderEdit = (record: PatientWithRelations): JSX.Element => (
    <Form
      form={form}
      layout="vertical"
      initialValues={{
        firstName: record.firstName,
        middleName: record.middleName ?? '',
        lastName: record.lastName,
        dateOfBirth: record.dateOfBirth,
        status: record.status,
        hasInsurance: record.hasInsurance,
      }}
      onFinish={handleFinish}
    >
      <Form.Item label="First name" name="firstName">
        <Input />
      </Form.Item>
      <Form.Item label="Middle name" name="middleName">
        <Input allowClear />
      </Form.Item>
      <Form.Item label="Last name" name="lastName">
        <Input />
      </Form.Item>
      <Form.Item
        label="Date of birth"
        name="dateOfBirth"
        extra={watchedDob ? `Age ${DateTimeUtil.calculateAge(watchedDob)}` : undefined}
        getValueProps={(value) => ({ value: DateTimeUtil.toDatePickerValue(value) })}
        normalize={(value) => DateTimeUtil.fromDatePickerValue(value)}
      >
        <DatePicker
          className={styles.fullWidth}
          format={DOB_DISPLAY_FORMAT}
          disabledDate={(current) => DateTimeUtil.isFuture(DateTimeUtil.fromDatePickerValue(current))}
        />
      </Form.Item>
      <Form.Item label="Lifecycle status" name="status">
        <StatusPillSelect />
      </Form.Item>
      <Form.Item label="Insurance on file" name="hasInsurance" valuePropName="checked">
        <Switch />
      </Form.Item>
    </Form>
  );

  return (
    <Drawer
      title={mode === 'edit' ? 'Edit record' : 'Patient detail'}
      placement="right"
      width={520}
      open={open}
      onClose={onClose}
      destroyOnClose
      styles={{ mask: MASK_BLUR }}
      footer={patient ? (mode === 'edit' ? renderEditFooter() : renderViewFooter()) : null}
    >
      {patient ? (mode === 'edit' ? renderEdit(patient) : renderView(patient)) : null}
    </Drawer>
  );
}
