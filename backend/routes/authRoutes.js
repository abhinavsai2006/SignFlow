import express from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import RefreshToken from '../models/RefreshToken.js';
import { protect } from '../middleware/authMiddleware.js';
import {
  sendWelcomeEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendVerificationSuccessEmail,
  sendPasswordChangedEmail,
  sendLoginAlertEmail,
  sendNewDeviceLoginEmail,
  sendSuspiciousLoginEmail,
  sendMfaEnabledEmail,
  sendMfaDisabledEmail,
  sendLoginOtpEmail
} from '../middleware/emailService.js';
import useragent from 'useragent';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.REFRESH_SECRET;

if (!JWT_SECRET || !REFRESH_SECRET) {
  console.error('[authRoutes] FATAL: JWT_SECRET and REFRESH_SECRET must be set in environment variables.');
  if (process.env.NODE_ENV === 'production') process.exit(1);
}

// Use the actual JWT secrets; fall back to weak dev-only values if not in production
const _JWT_SECRET = JWT_SECRET || 'dev_fallback_secret_not_for_production';
const _REFRESH_SECRET = REFRESH_SECRET || 'dev_fallback_refresh_secret_not_for_production';

// Resolve the frontend base URL from environment
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5177';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

// Helpers
const generateAccessToken = (id) => {
  return jwt.sign({ id }, _JWT_SECRET, { expiresIn: '15m' }); // Short-lived access
};

const generateRefreshToken = async (userId) => {
  const tokenStr = crypto.randomBytes(40).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  // Save to DB
  await RefreshToken.create({
    userId,
    token: tokenStr,
    expiresAt,
  });

  return tokenStr;
};

const setCookieToken = (res, token) => {
  const isProd = process.env.NODE_ENV === 'production';
  // SameSite=None + Secure required for cross-origin cookie (frontend on signflow.abhinavsai.com,
  // backend on api.signflow.abhinavsai.com). Domain=.abhinavsai.com covers both subdomains.
  const sameSite = isProd ? 'None' : 'Lax';
  const secureFlag = isProd ? 'Secure; ' : '';
  const domainFlag = isProd ? 'Domain=.abhinavsai.com; ' : '';
  res.setHeader(
    'Set-Cookie',
    `refreshToken=${token}; HttpOnly; ${secureFlag}${domainFlag}SameSite=${sameSite}; Max-Age=${7 * 24 * 60 * 60}; Path=/`
  );
};

// @route   POST /api/auth/register
// @desc    Register user
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // 1. Validate inputs
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({ message: 'Name must be at least 2 characters long' });
    }
    
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ message: 'Valid email is required' });
    }
    
    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // 2. Handle duplicate emails securely
    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      if (userExists.isVerified) {
        return res.status(400).json({ message: 'An account with this email already exists' });
      }
      
      // Update placeholder
      userExists.name = name.trim();
      userExists.password = password; // hashed on save
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      userExists.verificationCode = verificationCode;
      await userExists.save();

      // Send emails
      sendWelcomeEmail(email, name).catch(err => console.error('Failed to send welcome email:', err));
      sendVerificationEmail(email, name, `${FRONTEND_URL}/verify-email?code=${verificationCode}&email=${encodeURIComponent(email)}`).catch(err => console.error('Failed to send verification email:', err));

      const accessToken = generateAccessToken(userExists._id);
      const refreshToken = await generateRefreshToken(userExists._id);
      setCookieToken(res, refreshToken);

      return res.status(201).json({
        _id: userExists._id,
        name: userExists.name,
        email: userExists.email,
        accessToken,
        isVerified: userExists.isVerified,
        verificationCode,
      });
    }

    // 3. Generate OTP
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits

    // 4. Save to MongoDB
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase(),
      password,
      verificationCode,
      isVerified: false,
    });

    // Send welcome and verification emails via Resend
    sendWelcomeEmail(email, name).catch(err => console.error('Failed to send welcome email:', err));
    sendVerificationEmail(email, name, `${FRONTEND_URL}/verify-email?code=${verificationCode}&email=${encodeURIComponent(email)}`).catch(err => console.error('Failed to send verification email:', err));

    const accessToken = generateAccessToken(user._id);
    const refreshToken = await generateRefreshToken(user._id);
    setCookieToken(res, refreshToken);

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      accessToken,
      isVerified: user.isVerified,
      verificationCode, // Returned for simulated UI auto-filling
    });
  } catch (error) {
    res.status(500).json({ message: 'Register failure', error: error.message });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & initiate OTP flow (with IP/device change detection)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email });
    if (user && (await user.comparePassword(password))) {
      // Generate OTP
      const loginOtp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
      const loginOtpExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      user.loginOtp = loginOtp;
      user.loginOtpExpire = loginOtpExpire;
      await user.save();

      console.log("OTP_GENERATED:", loginOtp);
      console.log("OTP_STORED:", user.email);

      // Send the actual OTP email
      console.log("OTP_SENT: triggering Resend for", user.email);
      sendLoginOtpEmail(user.email, user.name, loginOtp)
        .catch(err => console.error('[Auth] Failed to send login OTP email:', err));

      return res.json({ 
        message: 'OTP sent to your email address',
        requiresOtp: true,
        email: user.email,
        loginOtp // Returned for simulated UI auto-filling/testing
      });
    } else {
      // Failed login — could indicate brute force / suspicious activity
      if (email) {
        const targetUser = await User.findOne({ email });
        if (targetUser) {
          const loginTime = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
          const currentIP = (req.headers['x-forwarded-for'] || req.connection.remoteAddress || '').split(',')[0].trim();
          const uaString = req.headers['user-agent'] || '';
          const agent = useragent.parse(uaString);
          const currentDevice = `${agent.family} on ${agent.os.family}`;
          sendSuspiciousLoginEmail(targetUser.email, targetUser.name, currentIP, currentDevice, loginTime)
            .catch(err => console.error('[Auth] Suspicious login email failed:', err.message));
        }
      }
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Login failure', error: error.message });
  }
});

// @route   POST /api/auth/refresh
// @desc    Rotate access and refresh tokens
router.post('/refresh', async (req, res) => {
  try {
    const cookies = req.headers.cookie
      ? Object.fromEntries(req.headers.cookie.split('; ').map((c) => c.split('=')))
      : {};
    const token = cookies.refreshToken;

    if (!token) {
      return res.status(401).json({ message: 'No refresh token' });
    }

    const activeSession = await RefreshToken.findOne({ token });
    if (!activeSession) {
      return res.status(403).json({ message: 'Invalid session' });
    }

    // Reject expired refresh tokens
    if (activeSession.expiresAt && new Date(activeSession.expiresAt) < new Date()) {
      await activeSession.deleteOne();
      return res.status(403).json({ message: 'Session expired. Please log in again.' });
    }

    // Refresh Token Rotation — delete old token before issuing new one
    await activeSession.deleteOne();

    const user = await User.findById(activeSession.userId);
    if (!user) {
      return res.status(403).json({ message: 'User not found' });
    }

    const newAccessToken = generateAccessToken(user._id);
    const newRefreshToken = await generateRefreshToken(user._id);
    setCookieToken(res, newRefreshToken);

    res.json({
      accessToken: newAccessToken,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified,
        role: user.role,
        plan: user.plan,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Refresh error', error: error.message });
  }
});

// @route   POST /api/auth/verify-login-otp
// @desc    Verify OTP sent during login (2FA step)
router.post('/verify-login-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    console.log("VERIFY OTP INPUT:", { email, otp });
    if (!user) {
      console.log("VERIFY OTP FAILED: User not found for email:", email);
      return res.status(401).json({ message: 'Invalid verification code' });
    }
    console.log("USER DB OTP:", { email: user.email, dbOtp: user.loginOtp, dbOtpExpire: user.loginOtpExpire });

    // Check OTP and expiry
    if (!user.loginOtp || user.loginOtp.toString() !== otp.toString()) {
      console.log("VERIFY OTP FAILED: OTP mismatch. Expected:", user.loginOtp, "Got:", otp);
      return res.status(401).json({ message: 'Invalid verification code' });
    }
    if (user.loginOtpExpire && new Date(user.loginOtpExpire) < new Date()) {
      return res.status(401).json({ message: 'Verification code has expired. Please log in again.' });
    }

    console.log("OTP_VERIFIED:", user.email);

    // Clear OTP fields
    user.loginOtp = undefined;
    user.loginOtpExpire = undefined;

    // ── Security: IP & Device Change Detection ─────────────────────────────
    const currentIP = (req.headers['x-forwarded-for'] || req.connection.remoteAddress || '').split(',')[0].trim();
    const uaString = req.headers['user-agent'] || '';
    const agent = useragent.parse(uaString);
    const currentDevice = `${agent.family} on ${agent.os.family}`;
    const loginTime = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    const ipChanged = user.lastLoginIP && user.lastLoginIP !== currentIP;
    const deviceChanged = user.lastLoginDevice && user.lastLoginDevice !== currentDevice;

    if (ipChanged || deviceChanged) {
      // Send the most relevant alert
      if (deviceChanged) {
        sendNewDeviceLoginEmail(user.email, user.name, currentDevice, currentIP, loginTime)
          .catch(err => console.error('[Auth] New device email failed:', err.message));
      } else {
        sendLoginAlertEmail(user.email, user.name, currentIP, loginTime)
          .catch(err => console.error('[Auth] Login alert email failed:', err.message));
      }
    }

    // Update stored login tracking fields
    user.lastLoginIP = currentIP;
    user.lastLoginDevice = currentDevice;
    await user.save();

    const accessToken = generateAccessToken(user._id);
    const refreshToken = await generateRefreshToken(user._id);
    setCookieToken(res, refreshToken);

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      accessToken,
      isVerified: user.isVerified,
    });
  } catch (error) {
    res.status(500).json({ message: 'OTP verification error', error: error.message });
  }
});

// @route   POST /api/auth/resend-verification
// @desc    Resend email verification code
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Security: Don't reveal whether email exists
      return res.json({ message: 'If an account exists, a new code has been sent.' });
    }

    if (user.isVerified) {
      return res.json({ message: 'Email is already verified.' });
    }

    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.verificationCode = newCode;
    await user.save();

    sendVerificationEmail(user.email, user.name, `${FRONTEND_URL}/verify-email?code=${newCode}&email=${encodeURIComponent(user.email)}`)
      .catch(err => console.error('[Auth] Resend verification email failed:', err.message));

    res.json({ message: 'A new verification code has been sent to your email.' });
  } catch (error) {
    res.status(500).json({ message: 'Resend verification error', error: error.message });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user & delete current session token
router.post('/logout', async (req, res) => {
  try {
    const cookies = req.headers.cookie
      ? Object.fromEntries(req.headers.cookie.split('; ').map((c) => c.split('=')))
      : {};
    const token = cookies.refreshToken;

    if (token) {
      await RefreshToken.deleteOne({ token });
    }

    // Clear Cookie
    const isProd = process.env.NODE_ENV === 'production';
    const sameSite = isProd ? 'None' : 'Lax';
    const secureFlag = isProd ? 'Secure; ' : '';
    const domainFlag = isProd ? 'Domain=.abhinavsai.com; ' : '';
    res.setHeader('Set-Cookie', `refreshToken=; HttpOnly; ${secureFlag}${domainFlag}SameSite=${sameSite}; Max-Age=0; Path=/`);
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Logout failed', error: error.message });
  }
});

// @route   POST /api/auth/logout-all
// @desc    Logout from all devices (delete all user session tokens)
router.post('/logout-all', protect, async (req, res) => {
  try {
    await RefreshToken.deleteMany({ userId: req.user._id });
    const isProd = process.env.NODE_ENV === 'production';
    const sameSite = isProd ? 'None' : 'Lax';
    const secureFlag = isProd ? 'Secure; ' : '';
    const domainFlag = isProd ? 'Domain=.abhinavsai.com; ' : '';
    res.setHeader('Set-Cookie', `refreshToken=; HttpOnly; ${secureFlag}${domainFlag}SameSite=${sameSite}; Max-Age=0; Path=/`);
    res.json({ message: 'Logged out from all devices successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Logout all failed', error: error.message });
  }
});

// @route   POST /api/auth/change-password
// @desc    Change logged-in user password
router.post('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long' });
    }

    const user = await User.findById(req.user._id);
    if (!user || !(await user.comparePassword(currentPassword))) {
      return res.status(401).json({ message: 'Incorrect current password' });
    }

    user.password = newPassword;
    await user.save();

    // Notify user that their password was changed
    sendPasswordChangedEmail(user.email, user.name)
      .catch(err => console.error('[Auth] Password changed email failed:', err.message));

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to change password', error: error.message });
  }
});

// @route   POST /api/auth/verify-email
// @desc    Verify user email code
router.post('/verify-email', async (req, res) => {
  try {
    const { code, email } = req.body;
    let user;
    
    if (email) {
      user = await User.findOne({ email: email.toLowerCase() });
    }
    
    // Fallback: decode token from auth headers if present
    if (!user && req.headers.authorization) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_fallback_secret_not_for_production');
        user = await User.findById(decoded.id || decoded.userId);
      } catch (jwtErr) {
        // Ignore JWT verify failure
      }
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log("VERIFY EMAIL INPUT:", { code, dbCode: user.verificationCode });

    if (user.verificationCode && user.verificationCode.toString() === code.toString()) {
      user.isVerified = true;
      user.verificationCode = undefined;
      await user.save();

      // Notify user that verification was successful
      sendVerificationSuccessEmail(user.email, user.name)
        .catch(err => console.error('[Auth] Verification success email failed:', err.message));

      res.json({ message: 'Email verified successfully', isVerified: true });
    } else {
      res.status(400).json({ message: 'Invalid verification code' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Verification error', error: error.message });
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Trigger password reset code
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = Date.now() + 30 * 60 * 1000; // 30 mins
    await user.save();

    // Send password reset email via Resend
    sendPasswordResetEmail(email, user.name, `${FRONTEND_URL}/reset-password/${resetToken}`)
      .catch(err => console.error('Failed to send password reset email:', err));

    res.json({
      message: 'Password reset link generated and sent via email',
      resetToken, // Returned for direct integration preview in tests
    });
  } catch (error) {
    res.status(500).json({ message: 'Forgot password error', error: error.message });
  }
});

// @route   POST /api/auth/reset-password/:token
// @desc    Execute password reset
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { password } = req.body;
    const user = await User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    // Notify user that their password was changed
    sendPasswordChangedEmail(user.email, user.name)
      .catch(err => console.error('[Auth] Password changed email failed:', err.message));

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Reset password failure', error: error.message });
  }
});

// @route   GET /api/auth/me
// @desc    Get user profile
router.get('/me', protect, async (req, res) => {
  res.json(req.user);
});

// @route   PUT /api/auth/me
// @desc    Update user profile (e.g. name)
router.put('/me', protect, async (req, res) => {
  try {
    const { name } = req.body;
    if (name) req.user.name = name;
    await req.user.save();
    res.json({ message: 'Profile updated successfully', user: req.user });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update profile', error: error.message });
  }
});

// @route   GET /api/auth/google
// @desc    Initiate Google OAuth 2.0 Flow
router.get('/google', (req, res, next) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return res.status(500).json({ message: 'Google OAuth is not configured on the server.' });
  }
  next();
}, passport.authenticate('google', { scope: ['profile', 'email'], session: false }));

// @route   GET /api/auth/google/callback
// @desc    Google OAuth Authorization Code Exchange Callback
router.get('/google/callback', (req, res, next) => {
  passport.authenticate('google', { session: false }, async (err, user, info) => {
    if (err || !user) {
      console.error('[OAuth Callback Error]:', err || 'User not found');
      const errMsg = err ? err.message : 'Google authentication failed';
      return res.redirect(`${FRONTEND_URL}/login?error=${encodeURIComponent(errMsg)}`);
    }

    try {
      // Generate platform authentication tokens
      const accessToken = generateAccessToken(user._id);
      const refreshToken = await generateRefreshToken(user._id);
      setCookieToken(res, refreshToken);

      // Redirect user to the dashboard with access credentials
      res.redirect(`${FRONTEND_URL}/login?token=${accessToken}&user=${encodeURIComponent(JSON.stringify({
        _id: user._id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified
      }))}`);
    } catch (err) {
      console.error('[OAuth Callback Error]:', err.message);
      res.redirect(`${FRONTEND_URL}/login?error=${encodeURIComponent(err.message)}`);
    }
  })(req, res, next);
});

// ============================================================================
// DEMO MFA ENDPOINTS — Student Project
// Replace with real TOTP/MFA implementation in production
// ============================================================================

// @route   POST /api/auth/demo/mfa/enable
// @desc    DEMO FEATURE - Simulates enabling 2FA and sends confirmation email
router.post('/demo/mfa/enable', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // DEMO FEATURE - Student Project
    // In production: validate TOTP code from authenticator app before enabling
    user.mfaEnabled = true;
    await user.save();

    sendMfaEnabledEmail(user.email, user.name)
      .catch(err => console.error('[Auth] MFA enabled email failed:', err.message));

    console.log(`[Auth] MFA enabled for user: ${user.email}`);
    res.json({ message: 'Two-factor authentication enabled successfully', mfaEnabled: true });
  } catch (error) {
    res.status(500).json({ message: 'Failed to enable MFA', error: error.message });
  }
});

// @route   POST /api/auth/demo/mfa/disable
// @desc    DEMO FEATURE - Simulates disabling 2FA and sends alert email
router.post('/demo/mfa/disable', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // DEMO FEATURE - Student Project
    // In production: require password or backup code confirmation before disabling
    user.mfaEnabled = false;
    await user.save();

    sendMfaDisabledEmail(user.email, user.name)
      .catch(err => console.error('[Auth] MFA disabled email failed:', err.message));

    console.log(`[Auth] MFA disabled for user: ${user.email}`);
    res.json({ message: 'Two-factor authentication disabled', mfaEnabled: false });
  } catch (error) {
    res.status(500).json({ message: 'Failed to disable MFA', error: error.message });
  }
});

export default router;
