/**
 * Frontend Security Utilities
 *
 * Protects against XSS, clickjacking, token leakage, and third-party script abuse
 */

import DOMPurify from 'dompurify';

// ============================================
// 1. USER INPUT ESCAPING & SANITIZATION
// ============================================

export class InputSecurity {
  /**
   * Escape HTML to prevent XSS
   */
  static escapeHTML(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Sanitize HTML content using DOMPurify
   */
  static sanitizeHTML(dirty: string, allowedTags?: string[]): string {
    const config = allowedTags ? { ALLOWED_TAGS: allowedTags } : { ALLOWED_TAGS: [] }; // Strip all HTML by default

    return DOMPurify.sanitize(dirty, config);
  }

  /**
   * Sanitize user input for safe rendering
   */
  static sanitizeInput(input: string): string {
    if (!input) return '';

    // Remove control characters
    let sanitized = input.replace(/[\x00-\x1F\x7F]/g, '');

    // Escape HTML
    sanitized = this.escapeHTML(sanitized);

    // Remove script-like patterns
    sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

    return sanitized.trim();
  }

  /**
   * Sanitize URL to prevent javascript: and data: URIs
   */
  static sanitizeURL(url: string): string | null {
    if (!url) return null;

    const trimmed = url.trim().toLowerCase();

    // Block dangerous protocols
    const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
    if (dangerousProtocols.some((protocol) => trimmed.startsWith(protocol))) {
      return null;
    }

    // Only allow http, https, mailto
    if (!trimmed.match(/^(https?:\/\/|mailto:)/)) {
      return null;
    }

    return url.trim();
  }

  /**
   * Escape JSON for safe embedding in HTML
   */
  static escapeJSON(data: any): string {
    return JSON.stringify(data)
      .replace(/</g, '\\u003c')
      .replace(/>/g, '\\u003e')
      .replace(/&/g, '\\u0026');
  }

  /**
   * Validate email format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

// ============================================
// 2. JWT TOKEN MANAGEMENT (Browser-Safe)
// ============================================

export class TokenManager {
  private static readonly TOKEN_KEY = '__auth_token';
  private static readonly REFRESH_KEY = '__refresh_token';
  private static readonly TOKEN_EXPIRY_KEY = '__token_expiry';

  /**
   * Store JWT in httpOnly-like manner (best effort in browser)
   *
   * CRITICAL: JWTs should be stored in httpOnly cookies on the server
   * This is a fallback for client-side only apps
   */
  static setToken(token: string, expiresIn: number = 3600): void {
    try {
      // Store with encryption if possible
      const encrypted = this.encryptToken(token);

      // Use sessionStorage (cleared on tab close) for extra security
      sessionStorage.setItem(this.TOKEN_KEY, encrypted);

      // Store expiry time
      const expiryTime = Date.now() + expiresIn * 1000;
      sessionStorage.setItem(this.TOKEN_EXPIRY_KEY, expiryTime.toString());

      // Set flag for token presence (for quick checks)
      sessionStorage.setItem('__has_auth', '1');
    } catch (error) {
      console.error('Failed to store token securely');
    }
  }

  /**
   * Get JWT token (with automatic expiry check)
   */
  static getToken(): string | null {
    try {
      // Check if token exists
      if (!sessionStorage.getItem('__has_auth')) {
        return null;
      }

      // Check expiry
      const expiry = sessionStorage.getItem(this.TOKEN_EXPIRY_KEY);
      if (expiry && Date.now() > parseInt(expiry)) {
        this.clearTokens();
        return null;
      }

      // Get and decrypt token
      const encrypted = sessionStorage.getItem(this.TOKEN_KEY);
      if (!encrypted) return null;

      return this.decryptToken(encrypted);
    } catch (error) {
      console.error('Failed to retrieve token');
      return null;
    }
  }

  /**
   * Store refresh token
   */
  static setRefreshToken(token: string): void {
    try {
      const encrypted = this.encryptToken(token);
      localStorage.setItem(this.REFRESH_KEY, encrypted);
    } catch (error) {
      console.error('Failed to store refresh token');
    }
  }

  /**
   * Get refresh token
   */
  static getRefreshToken(): string | null {
    try {
      const encrypted = localStorage.getItem(this.REFRESH_KEY);
      if (!encrypted) return null;
      return this.decryptToken(encrypted);
    } catch (error) {
      return null;
    }
  }

  /**
   * Clear all tokens (logout)
   */
  static clearTokens(): void {
    sessionStorage.removeItem(this.TOKEN_KEY);
    sessionStorage.removeItem(this.REFRESH_KEY);
    sessionStorage.removeItem(this.TOKEN_EXPIRY_KEY);
    sessionStorage.removeItem('__has_auth');
    localStorage.removeItem(this.REFRESH_KEY);
  }

  /**
   * Simple XOR encryption for token obfuscation
   * NOTE: This is NOT real encryption, just obfuscation
   * Real apps should use httpOnly cookies
   */
  private static encryptToken(token: string): string {
    const key = this.getDeviceFingerprint();
    return btoa(
      token
        .split('')
        .map((char, i) => String.fromCharCode(char.charCodeAt(0) ^ key.charCodeAt(i % key.length)))
        .join('')
    );
  }

  private static decryptToken(encrypted: string): string {
    try {
      const key = this.getDeviceFingerprint();
      const decoded = atob(encrypted);
      return decoded
        .split('')
        .map((char, i) => String.fromCharCode(char.charCodeAt(0) ^ key.charCodeAt(i % key.length)))
        .join('');
    } catch {
      return '';
    }
  }

  /**
   * Generate device fingerprint for token binding
   */
  private static getDeviceFingerprint(): string {
    const components = [
      navigator.userAgent,
      navigator.language,
      new Date().getTimezoneOffset().toString(),
      screen.width + 'x' + screen.height,
    ];

    return btoa(components.join('|')).substring(0, 32);
  }

  /**
   * Check if token is expired
   */
  static isTokenExpired(): boolean {
    const expiry = sessionStorage.getItem(this.TOKEN_EXPIRY_KEY);
    if (!expiry) return true;
    return Date.now() > parseInt(expiry);
  }

  /**
   * Decode JWT payload (without verification - for display only!)
   */
  static decodeToken(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      if (!base64Url) return null;
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(atob(base64));
    } catch {
      return null;
    }
  }
}

// ============================================
// 3. CLICKJACKING PREVENTION
// ============================================

export class ClickjackingProtection {
  /**
   * Initialize clickjacking protection
   */
  static init(): void {
    // Prevent page from being loaded in iframe
    if (window.self !== window.top) {
      // Break out of frame
      window.top!.location.href = window.self.location.href;
    }

    // Add frame-busting CSS
    this.addFrameBustingCSS();

    // Monitor for frame attempts
    this.monitorFraming();
  }

  /**
   * Add CSS to prevent UI redressing
   */
  private static addFrameBustingCSS(): void {
    const style = document.createElement('style');
    style.innerHTML = `
      html {
        display: none !important;
      }
    `;
    style.id = 'antiClickjack';
    document.head.appendChild(style);

    // Remove after page loads if not in frame
    if (window.self === window.top) {
      document.addEventListener('DOMContentLoaded', () => {
        const antiClickjack = document.getElementById('antiClickjack');
        if (antiClickjack) {
          antiClickjack.remove();
        }
        document.documentElement.style.display = 'block';
      });
    }
  }

  /**
   * Monitor for framing attempts
   */
  private static monitorFraming(): void {
    setInterval(() => {
      if (window.self !== window.top) {
        console.warn('Clickjacking attempt detected!');
        // Report to security endpoint
        this.reportSecurityEvent('clickjacking_attempt');
      }
    }, 1000);
  }

  /**
   * Report security events
   */
  private static reportSecurityEvent(eventType: string): void {
    try {
      fetch('/api/security/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: eventType,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
        }),
      });
    } catch (error) {
      // Silent fail
    }
  }
}

// ============================================
// 4. THIRD-PARTY SCRIPT PROTECTION
// ============================================

export class ScriptProtection {
  private static allowedScripts: Set<string> = new Set();
  private static scriptHashes: Map<string, string> = new Map();

  /**
   * Initialize script protection
   */
  static init(allowedDomains: string[] = []): void {
    // Store allowed domains
    allowedDomains.forEach((domain) => this.allowedScripts.add(domain));

    // Monitor for script injection
    this.monitorScriptInjection();

    // Set up CSP reporting
    this.setupCSPReporting();
  }

  /**
   * Whitelist a script domain
   */
  static allowScript(domain: string): void {
    this.allowedScripts.add(domain);
  }

  /**
   * Check if script is from allowed domain
   */
  static isScriptAllowed(scriptSrc: string): boolean {
    if (!scriptSrc) return false;

    // Allow same-origin scripts
    const currentOrigin = window.location.origin;
    if (scriptSrc.startsWith(currentOrigin) || scriptSrc.startsWith('/')) {
      return true;
    }

    // Check against whitelist
    return Array.from(this.allowedScripts).some((allowed) => scriptSrc.includes(allowed));
  }

  /**
   * Monitor for unauthorized script injection
   */
  private static monitorScriptInjection(): void {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeName === 'SCRIPT') {
            const scriptElement = node as HTMLScriptElement;
            const src = scriptElement.src;

            if (src && !this.isScriptAllowed(src)) {
              console.error('Unauthorized script blocked:', src);
              scriptElement.remove();
              this.reportScriptViolation(src);
            }
          }
        });
      });
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  }

  /**
   * Setup CSP violation reporting
   */
  private static setupCSPReporting(): void {
    document.addEventListener('securitypolicyviolation', (e) => {
      console.warn('CSP Violation:', {
        violatedDirective: e.violatedDirective,
        blockedURI: e.blockedURI,
        documentURI: e.documentURI,
      });

      this.reportCSPViolation({
        directive: e.violatedDirective,
        blockedUri: e.blockedURI,
        sourceFile: e.sourceFile,
        lineNumber: e.lineNumber,
      });
    });
  }

  /**
   * Report script violation
   */
  private static reportScriptViolation(src: string): void {
    try {
      fetch('/api/security/script-violation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'unauthorized_script',
          src,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
        }),
      });
    } catch (error) {
      // Silent fail
    }
  }

  /**
   * Report CSP violation
   */
  private static reportCSPViolation(violation: any): void {
    try {
      fetch('/api/security/csp-violation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...violation,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (error) {
      // Silent fail
    }
  }
}

// ============================================
// 5. TOKEN LEAKAGE PREVENTION
// ============================================

export class TokenLeakageProtection {
  /**
   * Initialize token leakage protection
   */
  static init(): void {
    // Prevent token in URL
    this.cleanTokenFromURL();

    // Monitor for token exposure
    this.monitorTokenExposure();

    // Clear tokens on page hide
    this.setupPageHideCleanup();
  }

  /**
   * Remove tokens from URL if present
   */
  private static cleanTokenFromURL(): void {
    const url = new URL(window.location.href);

    // Check for tokens in URL params
    const sensitiveParams = ['token', 'access_token', 'auth', 'jwt', 'apikey'];
    let cleaned = false;

    sensitiveParams.forEach((param) => {
      if (url.searchParams.has(param)) {
        const value = url.searchParams.get(param);

        // Store securely if needed
        if (value) {
          TokenManager.setToken(value);
        }

        // Remove from URL
        url.searchParams.delete(param);
        cleaned = true;
      }
    });

    // Update URL without reload if cleaned
    if (cleaned) {
      window.history.replaceState({}, document.title, url.toString());
    }
  }

  /**
   * Monitor for token exposure in DOM
   */
  private static monitorTokenExposure(): void {
    // Check localStorage/sessionStorage for exposed tokens
    setInterval(() => {
      this.scanForExposedTokens();
    }, 5000);
  }

  /**
   * Scan for exposed tokens
   */
  private static scanForExposedTokens(): void {
    try {
      // Check if tokens are in plain text in storage
      const storage = { ...localStorage, ...sessionStorage };

      Object.entries(storage).forEach(([key, value]) => {
        if (this.looksLikeToken(value) && !key.startsWith('__')) {
          console.warn('Potential token exposure detected:', key);
          // Report security issue
          this.reportTokenExposure(key);
        }
      });
    } catch (error) {
      // Silent fail
    }
  }

  /**
   * Check if string looks like a JWT
   */
  private static looksLikeToken(value: string): boolean {
    if (!value || typeof value !== 'string') return false;

    // JWT pattern: xxx.yyy.zzz
    const jwtPattern = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/;
    return jwtPattern.test(value);
  }

  /**
   * Setup cleanup on page hide
   */
  private static setupPageHideCleanup(): void {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // Clear sensitive data when page is hidden
        this.clearSensitiveData();
      }
    });

    window.addEventListener('beforeunload', () => {
      // Clear on page unload
      this.clearSensitiveData();
    });
  }

  /**
   * Clear sensitive data from memory
   */
  private static clearSensitiveData(): void {
    // Clear any form inputs with sensitive data
    document.querySelectorAll('input[type="password"], input[data-sensitive]').forEach((input) => {
      (input as HTMLInputElement).value = '';
    });
  }

  /**
   * Report token exposure
   */
  private static reportTokenExposure(key: string): void {
    try {
      fetch('/api/security/token-exposure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (error) {
      // Silent fail
    }
  }
}

// ============================================
// 6. INITIALIZE ALL PROTECTIONS
// ============================================

export function initializeSecurity(config?: {
  allowedScriptDomains?: string[];
  enableClickjackingProtection?: boolean;
  enableTokenLeakageProtection?: boolean;
}): void {
  console.log('🔒 Initializing frontend security...');

  // Clickjacking protection
  if (config?.enableClickjackingProtection !== false) {
    ClickjackingProtection.init();
  }

  // Script protection
  ScriptProtection.init(
    config?.allowedScriptDomains || ['vercel.live', 'cdn.jsdelivr.net', 'unpkg.com']
  );

  // Token leakage protection
  if (config?.enableTokenLeakageProtection !== false) {
    TokenLeakageProtection.init();
  }

  console.log('✅ Frontend security initialized');
}
