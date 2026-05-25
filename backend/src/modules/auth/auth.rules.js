const FULL_NAME_REGEX = /^(?=.*[\p{L}])[\p{L}]+(?: [\p{L}]+)*$/u;
const NEPAL_PHONE_E164_REGEX = /^\+9779[78]\d{8}$/;

const normalizeFullName = (value) =>
  String(value || '')
    .trim()
    .replace(/\s+/g, ' ');

const normalizePhoneForStorage = (value) =>
  String(value || '')
    .trim()
    .replace(/\s+/g, '');

const isValidFullName = (value) => FULL_NAME_REGEX.test(normalizeFullName(value));
const isValidNepalPhoneE164 = (value) => NEPAL_PHONE_E164_REGEX.test(normalizePhoneForStorage(value));

module.exports = {
  FULL_NAME_REGEX,
  NEPAL_PHONE_E164_REGEX,
  normalizeFullName,
  normalizePhoneForStorage,
  isValidFullName,
  isValidNepalPhoneE164,
};
