import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, EyeIcon, EyeSlashIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { customerProfilService } from '../../services/customerProfileService';
import type { ChangePasswordDto, PasswordValidation } from '../../types/customerProfile';
import { useToast } from '../../components';
import { extractApiErrorMessage } from '../../utils/apiError';

export default function ChangePassword() {
  const navigate = useNavigate();
  const { success: showSuccessToast, error: showErrorToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [formData, setFormData] = useState<ChangePasswordDto>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [validation, setValidation] = useState<PasswordValidation>({
    minLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validatePassword = (password: string): PasswordValidation => {
    return {
      minLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'newPassword') {
      setValidation(validatePassword(value));
    }

    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    setError(null);
  };

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Kata sandi saat ini wajib diisi';
    }

    if (!formData.newPassword) {
      newErrors.newPassword = 'Kata sandi baru wajib diisi';
    } else {
      const passwordValidation = validatePassword(formData.newPassword);
      const isValid = Object.values(passwordValidation).every(v => v);

      if (!isValid) {
        newErrors.newPassword = 'Kata sandi belum memenuhi persyaratan';
      }
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Konfirmasi kata sandi baru wajib diisi';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Konfirmasi kata sandi tidak cocok';
    }

    if (formData.currentPassword && formData.newPassword && formData.currentPassword === formData.newPassword) {
      newErrors.newPassword = 'Kata sandi baru harus berbeda dari kata sandi saat ini';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await customerProfilService.changePassword(formData);
      showSuccessToast('Kata sandi berhasil diubah');
      navigate('/customer/profile');
    } catch (err: unknown) {
      const message = extractApiErrorMessage(err, 'Gagal mengubah kata sandi');
      setError(message);
      showErrorToast(message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/customer/profile');
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-surface-500">
        <button onClick={() => navigate('/customer/profile')} className="hover:text-brand-600 transition-colors">
          Profil
        </button>
        <span className="text-surface-300">/</span>
        <span className="text-surface-700 font-medium">Ubah Kata Sandi</span>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="rounded-xl border border-danger-200 bg-danger-50 p-4">
          <p className="text-[13px] text-danger-700">{error}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="card">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-surface-900">Informasi Kata Sandi</h2>
          <button
            type="button"
            onClick={handleCancel}
            disabled={loading}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-surface-500 transition hover:text-brand-600"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Kembali
          </button>
        </div>

        <div className="mt-5 space-y-5">
          {/* Current Password */}
          <div>
            <label htmlFor="currentPassword" className="mb-1.5 block text-[13px] font-medium text-surface-700">
              Kata Sandi Saat Ini <span className="text-danger-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPasswords.current ? 'text' : 'password'}
                id="currentPassword"
                name="currentPassword"
                autoComplete="current-password"
                value={formData.currentPassword}
                onChange={handleChange}
                className={`input-base pr-10 ${errors.currentPassword ? 'border-danger-300 focus:ring-danger-500/20' : ''}`}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('current')}
                aria-label={showPasswords.current ? 'Sembunyikan kata sandi saat ini' : 'Tampilkan kata sandi saat ini'}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-surface-400 hover:text-surface-600"
              >
                {showPasswords.current ? (
                  <EyeSlashIcon className="h-4 w-4" />
                ) : (
                  <EyeIcon className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.currentPassword && <p className="mt-1.5 text-[12px] text-danger-600">{errors.currentPassword}</p>}
          </div>

          {/* New Password */}
          <div>
            <label htmlFor="newPassword" className="mb-1.5 block text-[13px] font-medium text-surface-700">
              Kata Sandi Baru <span className="text-danger-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPasswords.new ? 'text' : 'password'}
                id="newPassword"
                name="newPassword"
                autoComplete="new-password"
                value={formData.newPassword}
                onChange={handleChange}
                className={`input-base pr-10 ${errors.newPassword ? 'border-danger-300 focus:ring-danger-500/20' : ''}`}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('new')}
                aria-label={showPasswords.new ? 'Sembunyikan kata sandi baru' : 'Tampilkan kata sandi baru'}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-surface-400 hover:text-surface-600"
              >
                {showPasswords.new ? (
                  <EyeSlashIcon className="h-4 w-4" />
                ) : (
                  <EyeIcon className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.newPassword && <p className="mt-1.5 text-[12px] text-danger-600">{errors.newPassword}</p>}

            {/* Password Requirements */}
            {formData.newPassword && (
              <div className="mt-3 rounded-xl bg-surface-50 p-4" aria-live="polite">
                <p className="text-[13px] font-medium text-surface-700">Kata sandi harus mengandung:</p>
                <ul className="mt-2 space-y-1.5">
                  {[
                    { key: 'minLength', label: 'Minimal 8 karakter' },
                    { key: 'hasUpperCase', label: 'Satu huruf kapital' },
                    { key: 'hasLowerCase', label: 'Satu huruf kecil' },
                    { key: 'hasNumber', label: 'Satu angka' },
                    { key: 'hasSpecialChar', label: 'Satu karakter spesial (!@#$%^&*)' },
                  ].map(({ key, label }) => {
                    const isValid = validation[key as keyof PasswordValidation];
                    return (
                      <li key={key} className="flex items-center gap-2">
                        {isValid ? (
                          <CheckCircleIcon className="h-4 w-4 text-success-500" />
                        ) : (
                          <XCircleIcon className="h-4 w-4 text-surface-300" />
                        )}
                        <span className={`text-[13px] ${isValid ? 'text-success-700' : 'text-surface-400'}`}>
                          {label}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="mb-1.5 block text-[13px] font-medium text-surface-700">
              Konfirmasi Kata Sandi Baru <span className="text-danger-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPasswords.confirm ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                autoComplete="new-password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`input-base pr-10 ${errors.confirmPassword ? 'border-danger-300 focus:ring-danger-500/20' : ''}`}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('confirm')}
                aria-label={showPasswords.confirm ? 'Sembunyikan konfirmasi kata sandi' : 'Tampilkan konfirmasi kata sandi'}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-surface-400 hover:text-surface-600"
              >
                {showPasswords.confirm ? (
                  <EyeSlashIcon className="h-4 w-4" />
                ) : (
                  <EyeIcon className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.confirmPassword && <p className="mt-1.5 text-[12px] text-danger-600">{errors.confirmPassword}</p>}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-end gap-3 border-t border-surface-100 pt-5">
          <button
            type="button"
            onClick={handleCancel}
            disabled={loading}
            className="btn-secondary disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Mengubah kata sandi...
              </>
            ) : (
              'Ubah Kata Sandi'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
