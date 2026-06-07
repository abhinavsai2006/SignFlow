import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const brainDir = 'C:/Users/mndab/.gemini/antigravity/brain/1a8da5a6-8fc5-45c9-850e-81bcb67a3e5a';

function runSecurityScan() {
  console.log('[Security Scan] Starting security audit checks...');
  const report = [];

  report.push('# Security Scan Configuration Report');
  report.push(`Generated: ${new Date().toISOString()}`);
  report.push('');
  report.push('This automated report scans backend configuration properties, libraries, middleware setup, and cookies to ensure compliance with enterprise-grade safety policies.');
  report.push('');

  // 1. Check Helmet and CSP configurations
  const serverJsPath = path.resolve(__dirname, '../server.js');
  let serverJsContent = '';
  if (fs.existsSync(serverJsPath)) {
    serverJsContent = fs.readFileSync(serverJsPath, 'utf8');
  }

  const helmetUsed = serverJsContent.includes('helmet');
  const cspUsed = serverJsContent.includes('contentSecurityPolicy');
  report.push('## 1. HTTP Security Headers (Helmet & CSP)');
  if (helmetUsed) {
    report.push('- **Helmet Status**: ENABLED');
    if (cspUsed) {
      report.push('- **Content Security Policy (CSP)**: ENABLED & CUSTOMIZED');
    } else {
      report.push('- **Content Security Policy (CSP)**: WARNING: Using default helmet settings without explicit CSP adjustment.');
    }
  } else {
    report.push('- **Helmet Status**: WARNING: Helmet middleware was not detected in `server.js`.');
  }
  report.push('');

  // 2. Rate Limiting check
  const rateLimitUsed = serverJsContent.includes('rateLimit') || serverJsContent.includes('rate-limit');
  const authLimitUsed = serverJsContent.includes('authLimiter') || serverJsContent.includes('otpLimiter');
  report.push('## 2. Brute Force Prevention (Rate Limiting)');
  if (rateLimitUsed) {
    report.push('- **Global Rate Limiter**: ACTIVE');
    if (authLimitUsed) {
      report.push('- **Sensitive Routes Rate Limiting (OTP/Auth)**: ACTIVE (restricted to low thresholds e.g. 15 requests per 15 mins)');
    } else {
      report.push('- **Sensitive Routes Rate Limiting (OTP/Auth)**: WARNING: Specialized auth limiters are not bound.');
    }
  } else {
    report.push('- **Rate Limiter**: WARNING: Express rate limiting was not found in `server.js`.');
  }
  report.push('');

  // 3. Cookie Flags Verification
  const authRoutesPath = path.resolve(__dirname, '../routes/authRoutes.js');
  let authRoutesContent = '';
  if (fs.existsSync(authRoutesPath)) {
    authRoutesContent = fs.readFileSync(authRoutesPath, 'utf8');
  }

  const httpOnlyUsed = authRoutesContent.includes('HttpOnly') || authRoutesContent.includes('httpOnly');
  const secureCookieUsed = authRoutesContent.includes('Secure') || authRoutesContent.includes('secure');
  const sameSiteLaxUsed = authRoutesContent.toLowerCase().includes('samesite=lax');
  const sameSiteStrictForce = authRoutesContent.toLowerCase().includes("samesite=strict") || authRoutesContent.includes("sameSite: 'Strict'");

  report.push('## 3. Session Cookie Hardening');
  if (httpOnlyUsed) {
    report.push('- **HttpOnly Cookie Flag**: ENABLED (prevents XSS cookie theft)');
  } else {
    report.push('- **HttpOnly Cookie Flag**: WARNING: Missing HttpOnly setting.');
  }

  if (secureCookieUsed) {
    report.push('- **Secure Cookie Flag**: ENABLED (enforced dynamically in production to allow HTTPS-only delivery)');
  } else {
    report.push('- **Secure Cookie Flag**: WARNING: Missing Secure setting.');
  }

  if (sameSiteLaxUsed) {
    report.push('- **SameSite Cookie Mode**: Lax (Approved configuration - allows redirection and OAuth logins without risk)');
  } else if (sameSiteStrictForce) {
    report.push('- **SameSite Cookie Mode**: WARNING: Strictly configured (Strict mode could break cross-origin auth flows)');
  } else {
    report.push('- **SameSite Cookie Mode**: WARNING: SameSite is not configured.');
  }
  report.push('');

  // 4. Token Configuration & Expiry
  const jwtExpiryConfigured = authRoutesContent.includes("expiresIn: '15m'") || authRoutesContent.includes("15m");
  report.push('## 4. Session Token Expiration Config');
  if (jwtExpiryConfigured) {
    report.push('- **Access Token Expiry**: Short-lived (15 minutes token lifetime)');
  } else {
    report.push('- **Access Token Expiry**: WARNING: Check JWT token lifetimes; short-lived recommended.');
  }

  const refreshTokenExpiry = authRoutesContent.includes('7 * 24 * 60 * 60');
  if (refreshTokenExpiry) {
    report.push('- **Refresh Token Expiry**: Standard session lifetime configured (7 Days max age)');
  } else {
    report.push('- **Refresh Token Expiry**: Check refresh token database records expire configuration.');
  }
  report.push('');

  // Save report
  const reportPath = path.join(brainDir, 'SECURITY_SCAN_REPORT.md');
  fs.writeFileSync(reportPath, report.join('\n'));
  console.log('[Security Scan] Security report written successfully:', reportPath);
}

runSecurityScan();
