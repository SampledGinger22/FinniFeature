import { App, Button, DatePicker, Drawer, Form, Input, Select, Switch, Typography } from 'antd';
import { CheckOutlined, LockOutlined } from '@ant-design/icons';
import {
  AddressType,
  ContactMethodType,
  DateTimeUtil,
  PatientStatus,
  patientCreateSchema,
} from '@finni/shared';
import { StatusPillSelect } from '@/components/atoms/StatusPillSelect';
import { US_STATES } from '@/config/usStates';
import { useCreatePatientMutation } from '@/queries/patientQueries';
import { usePatientCreateDrawerStyles } from '@/components/organisms/PatientCreateDrawer.styles';

interface PatientCreateDrawerProps {
  open: boolean;
  onClose: () => void;
}

interface PatientCreateFormValues {
  firstName: string;
  middleName: string;
  lastName: string;
  dateOfBirth: string;
  status: PatientStatus;
  hasInsurance: boolean;
  email: string;
  phone: string;
  line1: string;
  city: string;
  region: string;
  postalCode: string;
}

const DOB_DISPLAY_FORMAT = 'MMM D, YYYY';
const DOB_HELPER = "A birthday isn't a timezone — stored as a plain date.";
// backdrop-filter value lives here (not a token) so the drawer mask blurs the workspace behind it.
const MASK_BLUR = { backdropFilter: 'blur(3px)' };

// Strings start empty (not undefined) so trim()/min-length checks run against real values and the
// inputs are controlled from first render; the select/switch carry their domain defaults.
const initialFormValues: PatientCreateFormValues = {
  firstName: '',
  middleName: '',
  lastName: '',
  dateOfBirth: '',
  status: PatientStatus.Inquiry,
  hasInsurance: false,
  email: '',
  phone: '',
  line1: '',
  city: '',
  region: '',
  postalCode: '',
};

// Maps a schema issue's nested array path back to the flat form field that holds it, so a
// validation failure on addresses[0].region or contactMethods[0].value lands on the visible input.
function resolveFieldName(path: PropertyKey[]): keyof PatientCreateFormValues | null {
  const [head, , leaf] = path;
  if (head === 'addresses' && leaf === 'region') return 'region';
  if (head === 'contactMethods' && leaf === 'value') return 'email';
  const topLevelFields: ReadonlyArray<keyof PatientCreateFormValues> = [
    'firstName',
    'middleName',
    'lastName',
    'dateOfBirth',
    'status',
    'hasInsurance',
  ];
  const candidate = topLevelFields.find((field) => field === head);
  return candidate ?? null;
}

// Add patient = bottom drawer (§8): the upward motion signals "compose a new record". Assembles the
// nested PatientCreateInput from a flat one-of-each form, validates with the shared Zod schema (D15),
// then submits via the create mutation.
export function PatientCreateDrawer({ open, onClose }: PatientCreateDrawerProps): JSX.Element {
  const { styles } = usePatientCreateDrawerStyles();
  const { message } = App.useApp();
  const [form] = Form.useForm<PatientCreateFormValues>();
  const watchedDob = Form.useWatch('dateOfBirth', form);
  const watchedInsurance = Form.useWatch('hasInsurance', form);
  const mutation = useCreatePatientMutation();

  const handleFinish = (values: PatientCreateFormValues): void => {
    // Build the raw shape and let the shared schema apply its defaults (country, label, isPrimary)
    // at parse time — the same way the seed does — so this component never duplicates them. A phone
    // is added as a secondary contact only when entered.
    const phone = values.phone.trim();
    const contactMethods = [
      { type: ContactMethodType.Email, value: values.email, isPrimary: true },
      ...(phone === '' ? [] : [{ type: ContactMethodType.Phone, value: phone, isPrimary: false }]),
    ];
    const candidate = {
      firstName: values.firstName,
      middleName: values.middleName.trim() === '' ? undefined : values.middleName.trim(),
      lastName: values.lastName,
      dateOfBirth: values.dateOfBirth,
      status: values.status,
      hasInsurance: values.hasInsurance,
      addresses: [
        {
          type: AddressType.Home,
          isPrimary: true,
          region: values.region,
          city: values.city.trim() === '' ? undefined : values.city.trim(),
          line1: values.line1.trim() === '' ? undefined : values.line1.trim(),
          postalCode: values.postalCode.trim() === '' ? undefined : values.postalCode.trim(),
        },
      ],
      contactMethods,
    };
    const parsed = patientCreateSchema.safeParse(candidate);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const name = resolveFieldName(issue.path);
        if (name) {
          form.setFields([{ name, errors: [issue.message] }]);
        } else {
          message.error(issue.message);
        }
      }
      return;
    }
    mutation.mutate(parsed.data, {
      onSuccess: () => {
        message.success('Patient created');
        form.resetFields();
        onClose();
      },
      onError: () => {
        message.error('Could not create patient. Try again.');
      },
    });
  };

  return (
    <Drawer
      placement="bottom"
      height="92vh"
      open={open}
      onClose={onClose}
      destroyOnClose
      styles={{ mask: MASK_BLUR }}
      title={
        <div>
          <div className={styles.dragHandle} aria-hidden="true" />
          <span className={styles.eyebrow}>New record</span>
          <Typography.Title level={3} className={styles.title}>
            Add a patient to your caseload
          </Typography.Title>
          <Typography.Paragraph className={styles.subtitle}>
            The minimum to get started is a name, date of birth, an email, and a state. You can flesh out the
            rest from their detail page later.
          </Typography.Paragraph>
        </div>
      }
      footer={
        <div className={styles.footer}>
          <span className={styles.footerNote}>
            <LockOutlined />
            Stored encrypted at rest. PHI fields never appear in logs.
          </span>
          <span className={styles.footerActions}>
            <Button onClick={onClose}>Cancel</Button>
            <Button
              type="primary"
              icon={<CheckOutlined />}
              loading={mutation.isPending}
              onClick={() => form.submit()}
            >
              Add patient
            </Button>
          </span>
        </div>
      }
    >
      <Form form={form} layout="vertical" initialValues={initialFormValues} onFinish={handleFinish} className={styles.body}>
        <section className={styles.section}>
          <span className={styles.sectionLabel}>Identity</span>
          <div className={styles.grid}>
            <Form.Item label="First name" name="firstName">
              <Input placeholder="Ada" />
            </Form.Item>
            <Form.Item label="Middle (optional)" name="middleName">
              <Input allowClear />
            </Form.Item>
            <Form.Item label="Last name" name="lastName">
              <Input placeholder="Lovelace" />
            </Form.Item>
          </div>
          <Form.Item
            label="Date of birth"
            name="dateOfBirth"
            extra={watchedDob ? `Age ${DateTimeUtil.calculateAge(watchedDob)} · stored as a plain date.` : DOB_HELPER}
            getValueProps={(value) => ({ value: DateTimeUtil.toDatePickerValue(value) })}
            normalize={(value) => DateTimeUtil.fromDatePickerValue(value)}
          >
            <DatePicker
              className={styles.fullWidth}
              format={DOB_DISPLAY_FORMAT}
              disabledDate={(current) => DateTimeUtil.isFuture(DateTimeUtil.fromDatePickerValue(current))}
            />
          </Form.Item>
          <Form.Item label="Lifecycle status" name="status" extra="Most new records start as Inquiry.">
            <StatusPillSelect />
          </Form.Item>
          <Form.Item label="Insurance on file" name="hasInsurance" valuePropName="checked">
            <Switch />
          </Form.Item>
          {!watchedInsurance && <span className={styles.offLabel}>Not on file</span>}
        </section>

        <section className={styles.section}>
          <span className={styles.sectionLabel}>Contact</span>
          <div className={styles.grid}>
            <Form.Item label="Primary email" name="email">
              <Input placeholder="ada@example.com" />
            </Form.Item>
            <Form.Item label="Phone (optional)" name="phone">
              <Input allowClear placeholder="(212) 555-0142" />
            </Form.Item>
          </div>
        </section>

        <section className={styles.section}>
          <span className={styles.sectionLabel}>Primary address</span>
          <Form.Item label="Street" name="line1">
            <Input allowClear />
          </Form.Item>
          <div className={styles.grid}>
            <Form.Item label="City" name="city">
              <Input allowClear />
            </Form.Item>
            <Form.Item label="State" name="region">
              <Select showSearch options={US_STATES} placeholder="Select" optionFilterProp="label" />
            </Form.Item>
            <Form.Item label="ZIP" name="postalCode">
              <Input allowClear />
            </Form.Item>
          </div>
        </section>
      </Form>
    </Drawer>
  );
}
