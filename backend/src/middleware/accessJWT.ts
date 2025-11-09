/**
 * Cloudflare Access JWT Validation Middleware
 * 
 * Validates the Cf-Access-Jwt-Assertion header from Cloudflare Access using:
 * - Team JWKS endpoint for public key retrieval
 * - jose library for JWT verification
 * - Extracts identity claims (email, sub) to req.accessIdentity
 * 
 * Usage:
 * import { validateAccessJWT } from '../middleware/accessJWT';
 * router.get('/admin/users', validateAccessJWT, allowRoles(['ADMIN']), handler);
 * 
 * Environment:
 * - CLOUDFLARE_ACCESS_TEAM_DOMAIN: Your team domain (e.g., advancia-pay.cloudflareaccess.com)
 * - CLOUDFLARE_ACCESS_AUD: Application Audience tag (get from Access app settings)
 */

import { Request, Response, NextFunction } from 'express';

// Type augmentation for Express Request
declare global {
  namespace Express {
    interface Request {
      accessIdentity?: {
        email: string;
        sub: string;
        aud: string;
        iss: string;
        iat: number;
        exp: number;
      };
    }
  }
}

// Dynamic import for ESM-only jose library
let joseLib: any = null;
let JWKS: any = null;

const initJose = async () => {
  if (!joseLib) {
    joseLib = await import('jose');
    if (CLOUDFLARE_ACCESS_TEAM_DOMAIN && CLOUDFLARE_ACCESS_AUD) {
      const JWKS_URL = `https://${CLOUDFLARE_ACCESS_TEAM_DOMAIN}/cdn-cgi/access/certs`;
      JWKS = joseLib.createRemoteJWKSet(new URL(JWKS_URL));
    }
  }
  return joseLib;
};

const CLOUDFLARE_ACCESS_TEAM_DOMAIN = process.env.CLOUDFLARE_ACCESS_TEAM_DOMAIN || '';
const CLOUDFLARE_ACCESS_AUD = process.env.CLOUDFLARE_ACCESS_AUD || '';

/**
 * Middleware to validate Cloudflare Access JWT
 * 
 * Flow:
 * 1. Read Cf-Access-Jwt-Assertion header
 * 2. Verify JWT signature using team JWKS
 * 3. Validate audience (aud) matches app
 * 4. Extract email/sub claims
 * 5. Attach to req.accessIdentity
 * 
 * If validation fails:
 * - Development: Logs error, allows request (for testing without Access)
 * - Production: Returns 401 Unauthorized
 */
export const validateAccessJWT = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const token = req.headers['cf-access-jwt-assertion'] as string;

  // If no JWKS configured, skip validation in development
  if (!JWKS || !CLOUDFLARE_ACCESS_TEAM_DOMAIN || !CLOUDFLARE_ACCESS_AUD) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Access JWT] Skipping validation (no team/aud configured)');
      return next();
    } else {
      console.error('[Access JWT] Missing CLOUDFLARE_ACCESS_TEAM_DOMAIN or AUD');
      res.status(500).json({ error: 'Access validation not configured' });
      return;
    }
  }

  // If no token, check environment behavior
  if (!token) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Access JWT] No token in dev mode, allowing request');
      return next();
    } else {
      res.status(401).json({ error: 'Missing Cloudflare Access token' });
      return;
    }
  }

  try {
    // Ensure jose is loaded
    const jose = await initJose();
    
    // Verify JWT using team JWKS
    const { payload } = await jose.jwtVerify(token, JWKS, {
      audience: CLOUDFLARE_ACCESS_AUD,
      issuer: `https://${CLOUDFLARE_ACCESS_TEAM_DOMAIN}`,
    });

    // Extract identity claims
    req.accessIdentity = {
      email: payload.email as string,
      sub: payload.sub as string,
      aud: payload.aud as string,
      iss: payload.iss as string,
      iat: payload.iat as number,
      exp: payload.exp as number,
    };

    console.log(`[Access JWT] Validated identity: ${req.accessIdentity.email}`);
    next();
  } catch (err: any) {
    console.error('[Access JWT] Verification failed:', err.message);
    
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Access JWT] Allowing failed verification in dev mode');
      return next();
    }
    
    res.status(401).json({ error: 'Invalid Cloudflare Access token' });
  }
};

/**
 * Optional: Simpler middleware that trusts Cf-Access-Authenticated-User-Email header
 * 
 * WARNING: Only use if you trust the header isn't spoofed. This skips JWT signature verification.
 * Cloudflare Access sets this header after successful authentication.
 * 
 * Use this if:
 * - You want simpler code
 * - You trust Cloudflare to set header correctly
 * - You don't need cryptographic proof of identity
 * 
 * Prefer validateAccessJWT for production (cryptographically verifies identity).
 */
export const validateAccessEmailHeader = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const email = req.headers['cf-access-authenticated-user-email'] as string;

  if (!email) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Access Email] No email header in dev mode, allowing');
      return next();
    }
    res.status(401).json({ error: 'Missing Access email header' });
    return;
  }

  // Attach simplified identity
  req.accessIdentity = {
    email,
    sub: email,
    aud: '',
    iss: '',
    iat: 0,
    exp: 0,
  };

  console.log(`[Access Email] Authenticated: ${email}`);
  next();
};

/**
 * Utility: Extract Access identity from request
 * 
 * Use in routes to get authenticated user:
 * const identity = getAccessIdentity(req);
 * if (identity) console.log(`User: ${identity.email}`);
 */
export const getAccessIdentity = (req: Request) => req.accessIdentity || null;
