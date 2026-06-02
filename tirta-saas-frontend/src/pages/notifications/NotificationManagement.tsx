import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BellAlertIcon,
  EnvelopeIcon,
  PaperAirplaneIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import {
  ActionIconButton,
  ConfirmModal,
  DataTable,
  FormCheckbox,
  FormInput,
  FormSelect,
  FormTextarea,
  PageHeader,
  useToast,
  type Column,
} from '../../components';
import customerService from '../../services/customerService';
import { notificationAdminService } from '../../services/notificationAdminService';
import { tenantUserService, type TenantUser } from '../../services/tenantUserService';
import type { Customer } from '../../types/customer';
import type {
  CreateNotificationTemplateDto,
  NotificationChannel,
  NotificationLanguage,
  NotificationRecipientType,
  NotificationTemplate,
  UpdateNotificationTemplateDto,
} from '../../types/notificationAdmin';
import { extractApiErrorMessage } from '../../utils/apiError';

type TemplateFormState = {
  code: string;
  name: string;
  description: string;
  channel: NotificationChannel;
  subject: string;
  body: string;
  html_body: string;
  variables_text: string;
  language: NotificationLanguage;
  is_active: boolean;
};

type SendFormState = {
  recipient_type: NotificationRecipientType;
  recipient_id: string;
  template_code: string;
  channel: NotificationChannel;
  custom_subject: string;
  custom_body: string;
  variables_text: string;
};

type RecipientOption = {
  value: string;
  label: string;
};

const CHANNEL_OPTIONS: Array<{ value: NotificationChannel; label: string }> = [
  { value: 'IN_APP', label: 'In-app' },
  { value: 'EMAIL', label: 'Email' },
  { value: 'SMS', label: 'SMS' },
  { value: 'WHATSAPP', label: 'WhatsApp' },
];

const LANGUAGE_OPTIONS: Array<{ value: NotificationLanguage; label: string }> = [
  { value: 'id', label: 'Bahasa Indonesia' },
  { value: 'en', label: 'English' },
];

const RECIPIENT_TYPE_OPTIONS: Array<{ value: NotificationRecipientType; label: string }> = [
  { value: 'USER', label: 'Pengguna tenant' },
  { value: 'CUSTOMER', label: 'Pelanggan' },
];

const SUPPORTED_SEND_CHANNELS: Record<NotificationRecipientType, NotificationChannel[]> = {
  USER: ['IN_APP', 'EMAIL'],
  CUSTOMER: ['IN_APP', 'EMAIL', 'SMS'],
};

const INITIAL_TEMPLATE_FORM: TemplateFormState = {
  code: '',
  name: '',
  description: '',
  channel: 'IN_APP',
  subject: '',
  body: '',
  html_body: '',
  variables_text: '',
  language: 'id',
  is_active: true,
};

const INITIAL_SEND_FORM: SendFormState = {
  recipient_type: 'USER',
  recipient_id: '',
  template_code: '',
  channel: 'IN_APP',
  custom_subject: '',
  custom_body: '',
  variables_text: '',
};

const CHANNEL_BADGE_CLASS: Record<NotificationChannel, string> = {
  IN_APP: 'bg-blue-50 text-blue-700',
  EMAIL: 'bg-emerald-50 text-emerald-700',
  SMS: 'bg-amber-50 text-amber-700',
  WHATSAPP: 'bg-green-50 text-green-700',
};

const getChannelLabel = (channel: NotificationChannel) =>
  CHANNEL_OPTIONS.find((item) => item.value === channel)?.label ?? channel;

const formatDateTime = (value: string) => {
  if (!value) {
    return '-';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString('id-ID');
};

const parseTemplateVariables = (value: string) =>
  Array.from(
    new Set(
      value
        .split(/[\n,]/)
        .map((item) => item.trim())
        .filter(Boolean)
    )
  );

const parseNotificationVariables = (
  value: string
): Record<string, string | number | boolean> => {
  if (!value.trim()) {
    return {};
  }

  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .reduce<Record<string, string | number | boolean>>((acc, line) => {
      const separatorIndex = line.includes('=') ? line.indexOf('=') : line.indexOf(':');
      if (separatorIndex <= 0) {
        throw new Error(`Format variabel tidak valid: "${line}"`);
      }

      const key = line.slice(0, separatorIndex).trim();
      const rawValue = line.slice(separatorIndex + 1).trim();

      if (!key || !rawValue) {
        throw new Error(`Format variabel tidak valid: "${line}"`);
      }

      if (rawValue === 'true' || rawValue === 'false') {
        acc[key] = rawValue === 'true';
      } else {
        const numericValue = Number(rawValue);
        acc[key] = Number.isFinite(numericValue) && rawValue !== '' ? numericValue : rawValue;
      }

      return acc;
    }, {});
};

export default function NotificationManagement() {
  const toast = useToast();
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [users, setUsers] = useState<TenantUser[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [loadingRecipients, setLoadingRecipients] = useState(true);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [sendingNotification, setSendingNotification] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<NotificationTemplate | null>(null);
  const [filterChannel, setFilterChannel] = useState<'' | NotificationChannel>('');
  const [includeInactive, setIncludeInactive] = useState(false);
  const [templateForm, setTemplateForm] = useState<TemplateFormState>(INITIAL_TEMPLATE_FORM);
  const [sendForm, setSendForm] = useState<SendFormState>(INITIAL_SEND_FORM);

  const resetTemplateForm = () => {
    setEditingTemplate(null);
    setTemplateForm(INITIAL_TEMPLATE_FORM);
  };

  const resetSendForm = () => {
    setSendForm(INITIAL_SEND_FORM);
  };

  const loadTemplates = useCallback(async () => {
    try {
      setLoadingTemplates(true);
      const data = await notificationAdminService.getNotificationTemplates({
        channel: filterChannel || undefined,
        include_inactive: includeInactive,
      });
      setTemplates(data);
    } catch (error) {
      toast.error(extractApiErrorMessage(error, 'Gagal memuat template notifikasi'));
      setTemplates([]);
    } finally {
      setLoadingTemplates(false);
    }
  }, [filterChannel, includeInactive, toast]);

  const loadRecipients = useCallback(async () => {
    try {
      setLoadingRecipients(true);
      const [tenantUsers, customerResult] = await Promise.all([
        tenantUserService.getTenantUsers(),
        customerService.getPelanggan(1, 1000),
      ]);
      setUsers(tenantUsers);
      setCustomers(customerResult.data);
    } catch (error) {
      toast.error(extractApiErrorMessage(error, 'Gagal memuat daftar penerima notifikasi'));
      setUsers([]);
      setCustomers([]);
    } finally {
      setLoadingRecipients(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadTemplates();
  }, [loadTemplates]);

  useEffect(() => {
    void loadRecipients();
  }, [loadRecipients]);

  const supportedChannels = useMemo(
    () => SUPPORTED_SEND_CHANNELS[sendForm.recipient_type],
    [sendForm.recipient_type]
  );

  const availableRecipients = useMemo<RecipientOption[]>(() => {
    if (sendForm.recipient_type === 'USER') {
      return users.map((user) => ({
        value: user.id,
        label: `${user.name} • ${user.email}`,
      }));
    }

    return customers.map((customer) => ({
      value: customer.id,
      label: `${customer.name} • ${customer.email || customer.phone || customer.meters?.[0]?.meter_number || ''}`,
    }));
  }, [customers, sendForm.recipient_type, users]);

  const availableTemplateOptions = useMemo(
    () =>
      templates
        .filter((template) => template.is_active && supportedChannels.includes(template.channel))
        .map((template) => ({
          value: template.code,
          label: `${template.code} • ${template.name}`,
        })),
    [supportedChannels, templates]
  );

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.code === sendForm.template_code) ?? null,
    [sendForm.template_code, templates]
  );

  useEffect(() => {
    if (selectedTemplate) {
      setSendForm((prev) =>
        prev.channel === selectedTemplate.channel ? prev : { ...prev, channel: selectedTemplate.channel }
      );
      return;
    }

    if (!supportedChannels.includes(sendForm.channel)) {
      setSendForm((prev) => ({ ...prev, channel: supportedChannels[0], recipient_id: '' }));
    }
  }, [selectedTemplate, sendForm.channel, supportedChannels]);

  useEffect(() => {
    if (
      sendForm.template_code &&
      !availableTemplateOptions.some((template) => template.value === sendForm.template_code)
    ) {
      setSendForm((prev) => ({ ...prev, template_code: '' }));
    }
  }, [availableTemplateOptions, sendForm.template_code]);

  const startEdit = (template: NotificationTemplate) => {
    setEditingTemplate(template);
    setTemplateForm({
      code: template.code,
      name: template.name,
      description: template.description,
      channel: template.channel,
      subject: template.subject,
      body: template.body,
      html_body: template.html_body,
      variables_text: template.variables.join(', '),
      language: template.language,
      is_active: template.is_active,
    });
  };

  const handleTemplateSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!templateForm.code.trim() && !editingTemplate) {
      toast.error('Kode template wajib diisi');
      return;
    }
    if (!templateForm.name.trim()) {
      toast.error('Nama template wajib diisi');
      return;
    }
    if (!templateForm.body.trim()) {
      toast.error('Isi template wajib diisi');
      return;
    }
    if (templateForm.channel === 'EMAIL' && !templateForm.subject.trim()) {
      toast.error('Subjek email wajib diisi');
      return;
    }

    const variables = parseTemplateVariables(templateForm.variables_text);

    try {
      setSavingTemplate(true);

      if (editingTemplate) {
        const payload: UpdateNotificationTemplateDto = {
          name: templateForm.name.trim(),
          description: templateForm.description.trim(),
          subject: templateForm.subject.trim(),
          body: templateForm.body.trim(),
          html_body: templateForm.html_body.trim(),
          variables,
          is_active: templateForm.is_active,
          language: templateForm.language,
        };

        await notificationAdminService.updateNotificationTemplate(editingTemplate.id, payload);
        toast.success('Template notifikasi berhasil diperbarui');
      } else {
        const payload: CreateNotificationTemplateDto = {
          code: templateForm.code.trim().toUpperCase(),
          name: templateForm.name.trim(),
          description: templateForm.description.trim(),
          channel: templateForm.channel,
          subject: templateForm.subject.trim() || undefined,
          body: templateForm.body.trim(),
          html_body: templateForm.html_body.trim() || undefined,
          variables,
          language: templateForm.language,
        };

        await notificationAdminService.createNotificationTemplate(payload);
        toast.success('Template notifikasi berhasil ditambahkan');
      }

      resetTemplateForm();
      await loadTemplates();
    } catch (error) {
      toast.error(
        extractApiErrorMessage(
          error,
          `Gagal ${editingTemplate ? 'memperbarui' : 'menambahkan'} template notifikasi`
        )
      );
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleDeleteTemplate = async () => {
    if (!deleteTarget) {
      return;
    }

    try {
      await notificationAdminService.deleteNotificationTemplate(deleteTarget.id);
      toast.success('Template notifikasi berhasil dihapus');
      if (editingTemplate?.id === deleteTarget.id) {
        resetTemplateForm();
      }
      setDeleteTarget(null);
      await loadTemplates();
    } catch (error) {
      toast.error(extractApiErrorMessage(error, 'Gagal menghapus template notifikasi'));
    }
  };

  const handleSendNotification = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!sendForm.recipient_id) {
      toast.error('Penerima notifikasi wajib dipilih');
      return;
    }

    if (!sendForm.template_code && !sendForm.custom_body.trim()) {
      toast.error('Isi pesan manual wajib diisi jika tanpa template');
      return;
    }

    if (
      !sendForm.template_code &&
      sendForm.channel === 'EMAIL' &&
      !sendForm.custom_subject.trim()
    ) {
      toast.error('Subjek email wajib diisi jika tanpa template');
      return;
    }

    try {
      const variables = parseNotificationVariables(sendForm.variables_text);

      setSendingNotification(true);
      await notificationAdminService.sendNotification({
        template_code: sendForm.template_code || undefined,
        channel: sendForm.channel,
        recipient_type: sendForm.recipient_type,
        recipient_id: sendForm.recipient_id,
        variables: Object.keys(variables).length > 0 ? variables : undefined,
        custom_subject: sendForm.template_code ? undefined : sendForm.custom_subject.trim() || undefined,
        custom_body: sendForm.template_code ? undefined : sendForm.custom_body.trim() || undefined,
      });

      toast.success('Notifikasi berhasil dikirim');
      resetSendForm();
    } catch (error) {
      toast.error(extractApiErrorMessage(error, 'Gagal mengirim notifikasi'));
    } finally {
      setSendingNotification(false);
    }
  };

  const totalTemplates = templates.length;
  const activeTemplates = templates.filter((template) => template.is_active).length;

  const columns = useMemo<Column<NotificationTemplate>[]>(
    () => [
      {
        key: 'code',
        label: 'Kode',
        sortable: true,
        render: (_value, template) => (
          <div>
            <p className="font-medium text-gray-900">{template.code}</p>
            <p className="text-xs text-gray-500">{template.name}</p>
          </div>
        ),
      },
      {
        key: 'channel',
        label: 'Channel',
        sortable: true,
        render: (_value, template) => (
          <span
            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${CHANNEL_BADGE_CLASS[template.channel]}`}
          >
            {getChannelLabel(template.channel)}
          </span>
        ),
        align: 'center',
      },
      {
        key: 'variables',
        label: 'Variabel',
        render: (_value, template) =>
          template.variables.length > 0 ? template.variables.join(', ') : 'Tanpa variabel',
      },
      {
        key: 'is_active',
        label: 'Status',
        sortable: true,
        render: (_value, template) => (
          <span
            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
              template.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
            }`}
          >
            {template.is_active ? 'Aktif' : 'Nonaktif'}
          </span>
        ),
        align: 'center',
      },
      {
        key: 'updated_at',
        label: 'Diperbarui',
        sortable: true,
        render: (_value, template) => formatDateTime(template.updated_at),
      },
      {
        key: 'actions',
        label: 'Aksi',
        render: (_value, template) => (
          <div className="flex justify-center gap-2">
            <ActionIconButton
              icon={PencilIcon}
              label={`Ubah template ${template.name}`}
              tone="blue"
              onClick={() => startEdit(template)}
            />
            <ActionIconButton
              icon={TrashIcon}
              label={`Hapus template ${template.name}`}
              tone="red"
              onClick={() => setDeleteTarget(template)}
            />
          </div>
        ),
        align: 'center',
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manajemen Notifikasi"
        subtitle="Kelola template notifikasi tenant dan kirim notifikasi manual ke pengguna atau pelanggan."
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
              <BellAlertIcon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total template</p>
              <p className="text-2xl font-semibold text-gray-900">{totalTemplates}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
              <EnvelopeIcon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Template aktif</p>
              <p className="text-2xl font-semibold text-gray-900">{activeTemplates}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
          <p className="text-sm font-medium text-amber-900">Status delivery</p>
          <p className="mt-1 text-sm text-amber-800">
            Notifikasi <strong>in-app</strong> langsung masuk inbox. Channel email/SMS saat ini
            masih tercatat sebagai log pengiriman, karena provider eksternal belum diaktifkan.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 2xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Daftar template</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Gunakan filter untuk melihat template aktif atau channel tertentu.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <FormSelect
                  label="Filter channel"
                  value={filterChannel}
                  onChange={(event) =>
                    setFilterChannel(event.target.value as '' | NotificationChannel)
                  }
                  options={[
                    { value: '', label: 'Semua channel' },
                    ...CHANNEL_OPTIONS.map((item) => ({
                      value: item.value,
                      label: item.label,
                    })),
                  ]}
                />
                <FormCheckbox
                  label="Tampilkan template nonaktif"
                  checked={includeInactive}
                  onChange={(event) => setIncludeInactive(event.target.checked)}
                />
              </div>
            </div>

            <div className="mt-5">
              <DataTable
                data={templates}
                columns={columns}
                searchKeys={['code', 'name', 'description', 'channel', 'language']}
                emptyMessage="Belum ada template notifikasi."
                loading={loadingTemplates}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
            <h2 className="text-base font-semibold text-gray-900">
              {editingTemplate ? 'Ubah template notifikasi' : 'Tambah template notifikasi'}
            </h2>
            <form className="mt-4 space-y-4" onSubmit={handleTemplateSubmit}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormInput
                  label="Kode template"
                  value={templateForm.code}
                  onChange={(event) =>
                    setTemplateForm((prev) => ({ ...prev, code: event.target.value.toUpperCase() }))
                  }
                  disabled={Boolean(editingTemplate)}
                  required
                  helperText="Gunakan huruf/angka tanpa spasi atau simbol, mis. INVOICEREMINDER."
                />
                <FormInput
                  label="Nama template"
                  value={templateForm.name}
                  onChange={(event) =>
                    setTemplateForm((prev) => ({ ...prev, name: event.target.value }))
                  }
                  required
                />
                <FormSelect
                  label="Channel"
                  value={templateForm.channel}
                  onChange={(event) =>
                    setTemplateForm((prev) => ({
                      ...prev,
                      channel: event.target.value as NotificationChannel,
                    }))
                  }
                  options={CHANNEL_OPTIONS}
                  disabled={Boolean(editingTemplate)}
                />
                <FormSelect
                  label="Bahasa"
                  value={templateForm.language}
                  onChange={(event) =>
                    setTemplateForm((prev) => ({
                      ...prev,
                      language: event.target.value as NotificationLanguage,
                    }))
                  }
                  options={LANGUAGE_OPTIONS}
                />
              </div>

              <FormTextarea
                label="Deskripsi"
                rows={2}
                value={templateForm.description}
                onChange={(event) =>
                  setTemplateForm((prev) => ({ ...prev, description: event.target.value }))
                }
                placeholder="Keterangan penggunaan template"
              />

              <FormInput
                label="Subjek"
                value={templateForm.subject}
                onChange={(event) =>
                  setTemplateForm((prev) => ({ ...prev, subject: event.target.value }))
                }
                required={templateForm.channel === 'EMAIL'}
                helperText={
                  templateForm.channel === 'EMAIL'
                    ? 'Subjek wajib untuk template email.'
                    : 'Opsional untuk channel selain email.'
                }
              />

              <FormTextarea
                label="Isi template"
                rows={5}
                value={templateForm.body}
                onChange={(event) =>
                  setTemplateForm((prev) => ({ ...prev, body: event.target.value }))
                }
                required
                helperText="Gunakan placeholder seperti {{customer_name}} atau {{invoice_number}}."
              />

              <FormTextarea
                label="HTML body"
                rows={4}
                value={templateForm.html_body}
                onChange={(event) =>
                  setTemplateForm((prev) => ({ ...prev, html_body: event.target.value }))
                }
                helperText="Opsional. Dipakai bila Anda ingin menyiapkan template HTML email."
              />

              <FormTextarea
                label="Daftar variabel"
                rows={3}
                value={templateForm.variables_text}
                onChange={(event) =>
                  setTemplateForm((prev) => ({ ...prev, variables_text: event.target.value }))
                }
                helperText="Pisahkan dengan koma atau baris baru. Contoh: customer_name, invoice_number"
              />

              {editingTemplate && (
                <FormCheckbox
                  label="Template aktif"
                  checked={templateForm.is_active}
                  onChange={(event) =>
                    setTemplateForm((prev) => ({ ...prev, is_active: event.target.checked }))
                  }
                />
              )}

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                {(editingTemplate || templateForm.code || templateForm.name || templateForm.body) && (
                  <button
                    type="button"
                    onClick={resetTemplateForm}
                    className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Batal
                  </button>
                )}
                <button
                  type="submit"
                  disabled={savingTemplate}
                  className="rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingTemplate
                    ? 'Menyimpan...'
                    : editingTemplate
                      ? 'Perbarui Template'
                      : 'Simpan Template'}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-center gap-2">
            <PaperAirplaneIcon className="h-5 w-5 text-blue-600" />
            <h2 className="text-base font-semibold text-gray-900">Kirim notifikasi manual</h2>
          </div>
          <form className="mt-4 space-y-4" onSubmit={handleSendNotification}>
            <FormSelect
              label="Tipe penerima"
              value={sendForm.recipient_type}
              onChange={(event) =>
                setSendForm((prev) => ({
                  ...prev,
                  recipient_type: event.target.value as NotificationRecipientType,
                  recipient_id: '',
                }))
              }
              options={RECIPIENT_TYPE_OPTIONS}
            />

            <FormSelect
              label="Penerima"
              value={sendForm.recipient_id}
              onChange={(event) =>
                setSendForm((prev) => ({ ...prev, recipient_id: event.target.value }))
              }
              options={[
                { value: '', label: loadingRecipients ? 'Memuat penerima...' : 'Pilih penerima' },
                ...availableRecipients,
              ]}
              disabled={loadingRecipients}
            />

            <FormSelect
              label="Template (opsional)"
              value={sendForm.template_code}
              onChange={(event) =>
                setSendForm((prev) => ({ ...prev, template_code: event.target.value }))
              }
              options={[
                { value: '', label: 'Tanpa template (isi manual)' },
                ...availableTemplateOptions,
              ]}
              helperText="Template yang muncul hanya yang aktif dan kompatibel dengan channel pengiriman saat ini."
            />

            <FormSelect
              label="Channel pengiriman"
              value={sendForm.channel}
              onChange={(event) =>
                setSendForm((prev) => ({
                  ...prev,
                  channel: event.target.value as NotificationChannel,
                }))
              }
              options={supportedChannels.map((channel) => ({
                value: channel,
                label: getChannelLabel(channel),
              }))}
              disabled={Boolean(selectedTemplate)}
              helperText={
                selectedTemplate
                  ? `Channel mengikuti template ${selectedTemplate.code}.`
                  : 'WhatsApp belum diaktifkan untuk pengiriman manual.'
              }
            />

            {selectedTemplate ? (
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                <p className="text-sm font-medium text-blue-900">{selectedTemplate.name}</p>
                <p className="mt-1 text-sm text-blue-800">
                  Template <strong>{selectedTemplate.code}</strong> akan dipakai untuk channel{' '}
                  {getChannelLabel(selectedTemplate.channel)}.
                </p>
                {selectedTemplate.variables.length > 0 && (
                  <p className="mt-2 text-xs text-blue-700">
                    Variabel: {selectedTemplate.variables.join(', ')}
                  </p>
                )}
              </div>
            ) : (
              <>
                <FormInput
                  label="Subjek manual"
                  value={sendForm.custom_subject}
                  onChange={(event) =>
                    setSendForm((prev) => ({ ...prev, custom_subject: event.target.value }))
                  }
                  required={sendForm.channel === 'EMAIL'}
                  placeholder="Contoh: Pengingat pembayaran"
                />
                <FormTextarea
                  label="Isi pesan"
                  rows={5}
                  value={sendForm.custom_body}
                  onChange={(event) =>
                    setSendForm((prev) => ({ ...prev, custom_body: event.target.value }))
                  }
                  required
                  placeholder="Tulis isi notifikasi manual"
                />
              </>
            )}

            <FormTextarea
              label="Variabel runtime"
              rows={4}
              value={sendForm.variables_text}
              onChange={(event) =>
                setSendForm((prev) => ({ ...prev, variables_text: event.target.value }))
              }
              helperText={"Format satu baris per variabel: key=value. Contoh: customer_name=Budi"}
            />

            <button
              type="submit"
              disabled={sendingNotification || loadingRecipients}
              className="inline-flex w-full items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {sendingNotification ? 'Mengirim...' : 'Kirim Notifikasi'}
            </button>
          </form>
        </div>
      </div>

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteTemplate}
        title="Hapus template notifikasi"
        message={`Template ${deleteTarget?.name ?? ''} akan dihapus. Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Hapus"
        cancelText="Batal"
        type="danger"
      />
    </div>
  );
}
