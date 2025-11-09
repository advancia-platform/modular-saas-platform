// Cloudflare Worker - API Gateway for Advancia Pay Ledger
// Proxies api.advancia.app/* to backend origin
// Adds security headers, CORS, and basic rate limiting

const CONFIG = {
  BACKEND_ORIGIN: "https://advancia-backend.onrender.com",
  ALLOWED_ORIGINS: [
    "https://advancia.app",
    "https://www.advancia.app",
    "https://admin.advancia.app",
    "http://localhost:3000", // Development
    "http://127.0.0.1:3000", // Development
  ],
  RATE_LIMIT_REQUESTS: 100, // requests per window
  RATE_LIMIT_WINDOW: 60, // seconds
  CACHE_TTL: 0, // Do not cache API responses
};

// Security headers to add to all responses
const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
  "X-Powered-By": "Cloudflare Workers",
};

addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request));
});

/**
 * Main request handler
 */
async function handleRequest(request) {
  const url = new URL(request.url);
  const origin = request.headers.get("Origin");
  const clientIP = request.headers.get("CF-Connecting-IP");

  // Log request (visible in Workers logs)
  console.log(
    `[${new Date().toISOString()}] ${request.method} ${
      url.pathname
    } from ${clientIP}`
  );

  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return handlePreflight(origin);
  }

  // Security: Check origin
  if (origin && !isAllowedOrigin(origin)) {
    return errorResponse("Forbidden: Invalid origin", 403);
  }

  // Rate limiting (basic implementation without KV)
  // In production, use Workers KV or Durable Objects for distributed rate limiting
  const rateLimitResult = await checkRateLimit(clientIP);
  if (!rateLimitResult.allowed) {
    return errorResponse("Rate limit exceeded", 429, {
      "Retry-After": CONFIG.RATE_LIMIT_WINDOW.toString(),
      "X-RateLimit-Limit": CONFIG.RATE_LIMIT_REQUESTS.toString(),
      "X-RateLimit-Remaining": "0",
      "X-RateLimit-Reset": rateLimitResult.resetTime.toString(),
    });
  }

  // Proxy request to backend
  try {
    const response = await proxyToBackend(request, url, clientIP, origin);
    return response;
  } catch (error) {
    console.error("Proxy error:", error);
    return errorResponse("Service temporarily unavailable", 503, {
      "Retry-After": "60",
    });
  }
}

/**
 * Proxy request to backend origin
 */
async function proxyToBackend(request, url, clientIP, origin) {
  // Construct backend URL
  const backendUrl = new URL(url.pathname + url.search, CONFIG.BACKEND_ORIGIN);

  // Clone and modify request headers
  const modifiedHeaders = new Headers(request.headers);
  modifiedHeaders.set("X-Forwarded-For", clientIP);
  modifiedHeaders.set("X-Forwarded-Host", url.hostname);
  modifiedHeaders.set("X-Real-IP", clientIP);
  modifiedHeaders.set("X-Cloudflare-Worker", "advancia-api-gateway");

  // Add Cloudflare request properties
  const cfProperties = request.cf;
  if (cfProperties) {
    modifiedHeaders.set("CF-Ray", cfProperties.ray || "unknown");
    modifiedHeaders.set("CF-Country", cfProperties.country || "unknown");
    modifiedHeaders.set("CF-Colo", cfProperties.colo || "unknown");
  }

  // Create modified request
  const modifiedRequest = new Request(backendUrl, {
    method: request.method,
    headers: modifiedHeaders,
    body: request.body,
    redirect: "follow",
  });

  // Fetch from backend
  const response = await fetch(modifiedRequest);

  // Clone response to modify headers
  const modifiedResponse = new Response(response.body, response);

  // Add security headers
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    modifiedResponse.headers.set(key, value);
  });

  // Add CORS headers if origin is allowed
  if (origin && isAllowedOrigin(origin)) {
    modifiedResponse.headers.set("Access-Control-Allow-Origin", origin);
    modifiedResponse.headers.set("Access-Control-Allow-Credentials", "true");
    modifiedResponse.headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS, PATCH"
    );
    modifiedResponse.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-API-Key, X-Admin-Key"
    );
    modifiedResponse.headers.set("Access-Control-Max-Age", "86400"); // 24 hours
  }

  // Add caching headers (no cache for API)
  modifiedResponse.headers.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate"
  );
  modifiedResponse.headers.set("Pragma", "no-cache");
  modifiedResponse.headers.set("Expires", "0");

  return modifiedResponse;
}

/**
 * Handle CORS preflight requests
 */
function handlePreflight(origin) {
  if (!origin || !isAllowedOrigin(origin)) {
    return errorResponse("Forbidden", 403);
  }

  const headers = new Headers({
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, X-API-Key, X-Admin-Key",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Max-Age": "86400", // 24 hours
  });

  return new Response(null, {
    status: 204,
    headers,
  });
}

/**
 * Check if origin is in allowed list
 */
function isAllowedOrigin(origin) {
  return CONFIG.ALLOWED_ORIGINS.includes(origin);
}

/**
 * Basic rate limiting without KV
 * NOTE: This is per-worker instance and not distributed
 * For production, use Workers KV or Durable Objects
 */
const rateLimitCache = new Map();

async function checkRateLimit(clientIP) {
  const now = Date.now();
  const windowStart = now - CONFIG.RATE_LIMIT_WINDOW * 1000;

  // Clean old entries
  for (const [ip, data] of rateLimitCache.entries()) {
    if (data.resetTime < now) {
      rateLimitCache.delete(ip);
    }
  }

  // Get or create rate limit data
  let rateLimitData = rateLimitCache.get(clientIP);

  if (!rateLimitData) {
    rateLimitData = {
      count: 0,
      resetTime: now + CONFIG.RATE_LIMIT_WINDOW * 1000,
    };
    rateLimitCache.set(clientIP, rateLimitData);
  }

  // Check if reset time has passed
  if (rateLimitData.resetTime < now) {
    rateLimitData.count = 0;
    rateLimitData.resetTime = now + CONFIG.RATE_LIMIT_WINDOW * 1000;
  }

  // Increment count
  rateLimitData.count++;

  // Check if limit exceeded
  const allowed = rateLimitData.count <= CONFIG.RATE_LIMIT_REQUESTS;

  return {
    allowed,
    remaining: Math.max(0, CONFIG.RATE_LIMIT_REQUESTS - rateLimitData.count),
    resetTime: Math.floor(rateLimitData.resetTime / 1000),
  };
}

/**
 * Create error response with standard format
 */
function errorResponse(message, status = 500, additionalHeaders = {}) {
  const headers = new Headers({
    "Content-Type": "application/json",
    ...SECURITY_HEADERS,
    ...additionalHeaders,
  });

  const body = JSON.stringify({
    error: message,
    status,
    timestamp: new Date().toISOString(),
  });

  return new Response(body, {
    status,
    headers,
  });
}

// Export for testing
export { CONFIG, handleRequest, isAllowedOrigin };
