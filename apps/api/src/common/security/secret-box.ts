import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'node:crypto';

function key() {
  return createHash('sha256')
    .update(
      process.env.DIRECT_COMMUNICATION_ENCRYPTION_KEY ||
        process.env.JWT_SECRET ||
        'AGTPS_SECRET_STORAGE_DEVELOPMENT_KEY_CHANGE_ME',
    )
    .digest();
}

export function encryptSecret(value?: string | null) {
  if (!value) return value;
  if (value.startsWith('aesgcm:v1:')) return value;
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key(), iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return [
    'aesgcm',
    'v1',
    iv.toString('base64url'),
    cipher.getAuthTag().toString('base64url'),
    encrypted.toString('base64url'),
  ].join(':');
}

export function decryptSecret(value?: string | null) {
  if (!value || !value.startsWith('aesgcm:v1:')) return value || '';
  const [, , iv, tag, payload] = value.split(':');
  const decipher = createDecipheriv(
    'aes-256-gcm',
    key(),
    Buffer.from(iv, 'base64url'),
  );
  decipher.setAuthTag(Buffer.from(tag, 'base64url'));
  return Buffer.concat([
    decipher.update(Buffer.from(payload, 'base64url')),
    decipher.final(),
  ]).toString('utf8');
}
