import crypto from 'crypto';

const SECRET_KEY = process.env.JWT_SECRET || 'vibevault_secure_signature_key_2026';

export interface TokenPayload {
  userId: string;
  email: string;
  role: 'owner' | 'friend' | 'demo';
  displayName: string;
  isDemo?: boolean;
  exp: number; // timestamp in seconds
}

export function hashPassword(password: string): string {
  const salt = 'vibevault_salt_9841';
  return crypto.pbkdf2Sync(password, salt, 1000, 32, 'sha256').toString('hex');
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

export function createToken(payload: Omit<TokenPayload, 'exp'>, expiresInHours = 72): string {
  const exp = Math.floor(Date.now() / 1000) + expiresInHours * 3600;
  const fullPayload: TokenPayload = { ...payload, exp };
  const encodedPayload = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
  const signature = crypto.createHmac('sha256', SECRET_KEY).update(encodedPayload).digest('base64url');
  return `${encodedPayload}.${signature}`;
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [encodedPayload, signature] = parts;
    const expectedSignature = crypto.createHmac('sha256', SECRET_KEY).update(encodedPayload).digest('base64url');
    if (signature !== expectedSignature) return null;

    const payload: TokenPayload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf-8'));
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return null; // Expired
    }
    return payload;
  } catch {
    return null;
  }
}

export function generateRandomToken(length = 32): string {
  return crypto.randomBytes(length).toString('hex');
}
