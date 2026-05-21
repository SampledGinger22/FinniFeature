import { App, Button, Drawer, Form, Input, Select, Switch } from 'antd';
import { DateTimeUtil, PatientStatus, patientUpdateSchema } from '@finni/shared';
import type { PatientUpdateInput, PatientWithRelations } from '@finni/shared';
import { patientStatusLabels } from '@/components/atoms/StatusTag';
import { useUpdatePatientMutation } from '@/queries/patientQueries';
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
  status: PatientStatus;
  hasInsurance: boolean;
}

const statusOptions = Object.values(PatientStatus).map((status) => ({
  value: status,
  label: patientStatusLabels[status],
}));

// Edit = right drawer (§8); DOB is shown read-only (rarely edited; the dayjs-bound picker is a
// later DateTimeUtil-encapsulated upgrade). The same shared Zod schema validates form and API (D15).
export function PatientEditDrawer({ patient, open, onClose }: PatientEditDrawerProps): JSX.Element {
  const { styles } = usePatientEditDrawerStyles();
  const { message } = App.useApp();
  const [form] = Form.useForm<PatientEditFormValues>();
  const mutation = useUpdatePatientMutation();

  const handleFinish = (values: PatientEditFormValues): void => {
    if (!patient) return;
    const candidate: PatientUpdateInput = {
      firstName: values.firstName,
      middleName: values.middleName.trim() === '' ? null : values.middleName.trim(),
      lastName: values.lastName,
      dateOfBirth: patient.dateOfBirth,
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
    mutation.mutate(
      { id: patient.id, input: parsed.data },
      {
        onSuccess: () => {
          message.success('Patient updated');
          onClose();
        },
        onError: () => {
          message.error('Could not update patient. Try again.');
        },
      },
    );
  };

  return (
    <Drawer
      title="Edit patient"
      placement="right"
      open={open}
      onClose={onClose}
      destroyOnClose
      footer={
        <div className={styles.footer}>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" loading={mutation.isPending} onClick={() => form.submit()}>
            Save changes
          </Button>
        </div>
      }
    >
      {patient ? (
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            firstName: patient.firstName,
            middleName: patient.middleName ?? '',
            lastName: patient.lastName,
            status: patient.status,
            hasInsurance: patient.hasInsurance,
          }}
          onFinish={handleFinish}
        >
          <div className={styles.readonlyRow}>
            <span className={styles.readonlyLabel}>
              Date of birth · age {DateTimeUtil.calculateAge(patient.dateOfBirth)}
            </span>
            <span>{DateTimeUtil.formatDob(patient.dateOfBirth)}</span>
          </div>
          <Form.Item label="First name" name="firstName">
            <Input />
          </Form.Item>
          <Form.Item label="Middle name" name="middleName">
            <Input allowClear />
          </Form.Item>
          <Form.Item label="Last name" name="lastName">
            <Input />
          </Form.Item>
          <Form.Item label="Status" name="status">
            <Select options={statusOptions} />
          </Form.Item>
          <Form.Item label="Insurance on file" name="hasInsurance" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      ) : null}
    </Drawer>
  );
}
