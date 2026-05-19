import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
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

    // Validate new password strength
    if (name === 'newPassword') {
      setValidation(validatePassword(value));
    }

    // Clear error for this field
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

  const getValidationColor = (isValid: boolean) => {
    return isValid ? 'text-green-600' : 'text-gray-400';
  };

  const getValidationIcon = (isValid: boolean) => {
    return isValid ? (
      <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ) : (
      <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Ubah Kata Sandi</h1>
          <p className="text-gray-600">Perbarui kata sandi untuk menjaga keamanan akun Anda</p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Informasi Kata Sandi</h2>
        </div>

        <div className="px-6 py-4 space-y-6">
          {/* Current Password */}
          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Kata Sandi Saat Ini <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPasswords.current ? 'text' : 'password'}
                id="currentPassword"
                name="currentPassword"
                autoComplete="current-password"
                value={formData.currentPassword}
                onChange={handleChange}
                className={`w-full px-4 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.currentPassword ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('current')}
                aria-label={showPasswords.current ? 'Sembunyikan kata sandi saat ini' : 'Tampilkan kata sandi saat ini'}
                className="absolute inset-y-0 right-0 flex items-center pr-3"
              >
                {showPasswords.current ? (
                  <EyeSlashIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                ) : (
                  <EyeIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                )}
              </button>
            </div>
            {errors.currentPassword && <p className="mt-1 text-sm text-red-600">{errors.currentPassword}</p>}
          </div>

          {/* New Password */}
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Kata Sandi Baru <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPasswords.new ? 'text' : 'password'}
                id="newPassword"
                name="newPassword"
                autoComplete="new-password"
                value={formData.newPassword}
                onChange={handleChange}
                className={`w-full px-4 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.newPassword ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('new')}
                aria-label={showPasswords.new ? 'Sembunyikan kata sandi baru' : 'Tampilkan kata sandi baru'}
                className="absolute inset-y-0 right-0 flex items-center pr-3"
              >
                {showPasswords.new ? (
                  <EyeSlashIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                ) : (
                  <EyeIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                )}
              </button>
            </div>
            {errors.newPassword && <p className="mt-1 text-sm text-red-600">{errors.newPassword}</p>}

            {/* Password Requirements */}
            {formData.newPassword && (
              <div className="mt-3 space-y-2" aria-live="polite" aria-atomic="false">
                <p className="text-sm font-medium text-gray-700" id="password-requirements-label">
                  Kata sandi harus mengandung:
                </p>
                <ul
                  className="space-y-1"
                  aria-labelledby="password-requirements-label"
                >
                  <li className="flex items-center">
                    {getValidationIcon(validation.minLength)}
                    <span className={`ml-2 text-sm ${getValidationColor(validation.minLength)}`}>
                      Minimal 8 karakter
                    </span>
                  </li>
                  <li className="flex items-center">
                    {getValidationIcon(validation.hasUpperCase)}
                    <span className={`ml-2 text-sm ${getValidationColor(validation.hasUpperCase)}`}>
                      Satu huruf kapital
                    </span>
                  </li>
                  <li className="flex items-center">
                    {getValidationIcon(validation.hasLowerCase)}
                    <span className={`ml-2 text-sm ${getValidationColor(validation.hasLowerCase)}`}>
                      Satu huruf kecil
                    </span>
                  </li>
                  <li className="flex items-center">
                    {getValidationIcon(validation.hasNumber)}
                    <span className={`ml-2 text-sm ${getValidationColor(validation.hasNumber)}`}>
                      Satu angka
                    </span>
                  </li>
                  <li className="flex items-center">
                    {getValidationIcon(validation.hasSpecialChar)}
                    <span className={`ml-2 text-sm ${getValidationColor(validation.hasSpecialChar)}`}>
                      Satu karakter spesial (!@#$%^&amp;*...)
                    </span>
                  </li>
                </ul>
              </div>
            )}
          </div>

            {/* Confirm Password */}
           <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Konfirmasi Kata Sandi Baru <span className="text-red-500">*</span>
              </label>
            <div className="relative">
              <input
                type={showPasswords.confirm ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                autoComplete="new-password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`w-full px-4 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('confirm')}
                aria-label={showPasswords.confirm ? 'Sembunyikan konfirmasi kata sandi' : 'Tampilkan konfirmasi kata sandi'}
                className="absolute inset-y-0 right-0 flex items-center pr-3"
              >
                {showPasswords.confirm ? (
                  <EyeSlashIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                ) : (
                  <EyeIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                )}
              </button>
            </div>
            {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
          <button
            type="button"
            onClick={handleCancel}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 flex items-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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
