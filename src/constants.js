// ==== ./src/constants.js ====
export const STORAGE_KEYS = {
  ENCRYPTED_DATA: 'Ultra2FA.encrypted-data',
  PASSKEY: 'Ultra2FA.passkey',
  PASSKEY_TTL: 'Ultra2FA.passkey-ttl'
};

export const FILE_NAMES = {
  EXPORT: 'ultra-2fa.secrets.json.aes'
};

export const CACHE_TTL = 7_200_000; // 2 hours in milliseconds

export const MESSAGES = {
  EMPTY_PASSKEY: 'Passkey cannot be empty.',
  EMPTY_PASSKEY_EXPORT: 'Passkey cannot be empty for export.',
  INVALID_PASSKEY: 'Invalid passkey / encrypted data.',
  INCORRECT_PASSKEY: 'Incorrect passkey.',
  DISMISS_AFTER_ERROR: 'Passkey entry dismissed after incorrect attempt.',
  DISMISS_BY_USER: 'Passkey entry dismissed by user.',
  FILE_DISMISS: 'File upload dismissed by user.',
  FILE_REQUIRED: 'File upload required to proceed: ',
  NEW_PASSKEY_LABEL: 'Enter your new passkey',
  NEW_PASSKEY_ENCRYPT_LABEL: 'Enter a new passkey to encrypt your secrets'
};
