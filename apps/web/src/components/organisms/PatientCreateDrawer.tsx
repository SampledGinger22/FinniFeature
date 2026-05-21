import { App, Button, DatePicker, Drawer, Form, Input, Select, Switch } from 'antd';
import {
  AddressType,
  ContactMethodType,
  DateTimeUtil,
  PatientStatus,
  patientCreateSchema,
} from '@finni/shared';
import { patientStatusLabels } from '@/components/atoms/StatusTag';
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
  line1: string;
  city: string;
  region: string;
  postalCode: string;
}

const statusOptions = Object.values(PatientStatus).map((status) => ({
  value: status,
  label: patientStatusLabels[status],
}));

const DOB_DISPLAY_FORMAT = 'MMM D, YYYY';

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

// Create = bottom drawer (§8). Assembles the nested PatientCreateInput from a flat one-of-each
// form, validates with the shared Zod schema (D15), then submits via the create mutation.
export function PatientCreateDrawer({ open, onClose }: PatientCreateDrawerProps): JSX.Element {
  const { styles } = usePatientCreateDrawerStyles();
  const { message } = App.useApp();
  const [form] = Form.useForm<PatientCreateFormValues>();
  const watchedDob = Form.useWatch('dateOfBirth', form);
  const mutation = useCreatePatientMutation();

  const handleFinish = (values: PatientCreateFormValues): void => {
    // Build the raw shape and let the shared schema apply its defaults (country, label, isPrimary)
    // at parse time — the same way the seed does — so this component never duplicates them.
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
      contactMethods: [{ type: ContactMethodType.Email, value: values.email, isPrimary: true }],
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
      title="Add patient"
      placement="bottom"
      open={open}
      onClose={onClose}
      destroyOnClose
      footer={
        <div className={styles.footer}>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" loading={mutation.isPending} onClick={() => form.submit()}>
            Create
          </Button>
        </div>
      }
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={initialFormValues}
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
        <Form.Item label="Status" name="status">
          <Select options={statusOptions} />
        </Form.Item>
        <Form.Item label="Insurance on file" name="hasInsurance" valuePropName="checked">
          <Switch />
        </Form.Item>
        <Form.Item label="Email" name="email">
          <Input />
        </Form.Item>
        <Form.Item label="Address line 1" name="line1">
          <Input allowClear />
        </Form.Item>
        <Form.Item label="City" name="city">
          <Input allowClear />
        </Form.Item>
        <Form.Item label="State" name="region">
          <Input />
        </Form.Item>
        <Form.Item label="Postal code" name="postalCode">
          <Input allowClear />
        </Form.Item>
      </Form>
    </Drawer>
  );
}
