import crypto from 'crypto';

/**
 * Generate a cryptographically secure random token.
 * Used for email verification and password reset tokens.
 */
export function generateCryptoToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}

/**
 * Generate a unique order ID for transactions or general identification.
 */
export function generateOrderId(prefix = 'CHILL'): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}
