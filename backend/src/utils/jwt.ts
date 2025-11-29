import * as jwt from "jsonwebtoken";

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || "your-refresh-secret-key";
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "30d";

export interface JWTPayload {
  userId: string;
  id?: string; // Backward compatibility alias for userId
  email: string;
  role: string;
  type?: string;
  active?: boolean;
  iss?: string;
  aud?: string;
}

/**
 * Generate access token
 */
export function generateAccessToken(payload: JWTPayload): string {
  return jwt.sign(
    payload,
    JWT_SECRET as string,
    {
      expiresIn: JWT_EXPIRES_IN as string,
    } as jwt.SignOptions,
  );
}

/**
 * Generate refresh token
 */
export function generateRefreshToken(payload: JWTPayload): string {
  return jwt.sign(
    payload,
    JWT_REFRESH_SECRET as string,
    {
      expiresIn: JWT_REFRESH_EXPIRES_IN as string,
    } as jwt.SignOptions,
  );
}

/**
 * Verify access token
 */
export function verifyAccessToken(token: string): JWTPayload {
  try {
    return jwt.verify(token, JWT_SECRET as string) as JWTPayload;
  } catch (error) {
    throw new Error("Invalid or expired token");
  }
}

/**
 * Verify refresh token
 */
export function verifyRefreshToken(token: string): JWTPayload {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET as string) as JWTPayload;
  } catch (error) {
    throw new Error("Invalid or expired refresh token");
  }
}

/**
 * Generate both access and refresh tokens
 */
export function generateTokenPair(payload: JWTPayload) {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
}
