import crypto from 'crypto';

/**
 * Hashes a plain-text password using SHA-256 with a unique salt.
 * Returns the hash formatted as `salt:hash`.
 */
export const hashPassword = (password: string): string => {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha256').toString('hex');
  return `${salt}:${hash}`;
};

/**
 * Verifies a plain-text password against a stored `salt:hash` string.
 */
export const comparePassword = (password: string, storedHash: string): boolean => {
  const [salt, hash] = storedHash.split(':');
  if (!salt || !hash) return false;
  const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha256').toString('hex');
  return verifyHash === hash;
};

/**
 * Generates a random crypto token for email verification.
 */
export const generateCryptoToken = (length: number = 32): string => {
  return crypto.randomBytes(length).toString('hex');
};


