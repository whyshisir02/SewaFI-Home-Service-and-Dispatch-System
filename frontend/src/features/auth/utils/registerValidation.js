export const FULL_NAME_REGEX = /^(?=.*[\p{L}])[\p{L}]+(?: [\p{L}]+)*$/u;
export const NEPAL_MOBILE_LOCAL_REGEX = /^9[78]\d{8}$/;

export const REGISTER_VALIDATION_MESSAGES = {
  fullNameRequired: 'Full name is required.',
  fullNameInvalid: 'Please enter a valid full name using letters only.',
  phoneRequired: 'Phone number is required.',
  phoneInvalid: 'Enter a valid Nepal mobile number starting with 97 or 98.',
};

export const normalizeFullName = (value = '') =>
  String(value)
    .trim()
    .replace(/\s+/g, ' ');

export const normalizePhoneDigits = (value) =>
  String(value || '')
    .replace(/\D/g, '')
    .slice(0, 10);

export const isValidFullName = (value) => FULL_NAME_REGEX.test(normalizeFullName(value));

export const isValidNepalMobileLocal = (value) =>
  NEPAL_MOBILE_LOCAL_REGEX.test(normalizePhoneDigits(value));

export const toNepalE164 = (value) => `+977${normalizePhoneDigits(value)}`;
