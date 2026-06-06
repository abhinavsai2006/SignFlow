import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import RefreshToken from '../models/RefreshToken.js';
import { protect } from '../middleware/authMiddleware.js';
import { sendWelcomeEmail, sendVerificationEmail, sendPasswordResetEmail } from '../middleware/emailService.js';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'fallback_refresh_secret';

// Helpers
const generateAccessToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: '15m' }); // Short-lived access
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
  res.setHeader(
    'Set-Cookie',
    `refreshToken=${token}; HttpOnly; Secure; SameSite=Strict; Max-Age=${7 * 24 * 60 * 60}; Path=/`
  );
};

// @route   POST /api/auth/register
// @desc    Register user
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits

    const user = await User.create({
      name,
      email,
      password,
      verificationCode,
      isVerified: false,
    });

    // Send welcome and verification emails via Resend
    sendWelcomeEmail(email, name).catch(err => console.error('Failed to send welcome email:', err));
    sendVerificationEmail(email, name, `http://localhost:5177/verify-email?code=${verificationCode}`).catch(err => console.error('Failed to send verification email:', err));

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
// @desc    Authenticate user & get token
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email });
    if (user && (await user.comparePassword(password))) {
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
    } else {
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

    // Refresh Token Rotation
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
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Refresh error', error: error.message });
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
    res.setHeader('Set-Cookie', 'refreshToken=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/');
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
    res.setHeader('Set-Cookie', 'refreshToken=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/');
    res.json({ message: 'Logged out from all devices successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Logout all failed', error: error.message });
  }
});

// @route   POST /api/auth/verify-email
// @desc    Verify user email code
router.post('/verify-email', protect, async (req, res) => {
  try {
    const { code } = req.body;
    const user = await User.findById(req.user._id);

    if (user.verificationCode === code) {
      user.isVerified = true;
      user.verificationCode = undefined;
      await user.save();
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
    sendPasswordResetEmail(email, user.name, `http://localhost:5177/reset-password/${resetToken}`)
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

// @route   GET /api/auth/google
// @desc    Simulate Google OAuth redirect
router.get('/google', (req, res) => {
  res.redirect('http://localhost:5000/api/auth/oauth-callback?provider=google');
});

// @route   GET /api/auth/github
// @desc    Simulate GitHub OAuth redirect
router.get('/github', (req, res) => {
  res.redirect('http://localhost:5000/api/auth/oauth-callback?provider=github');
});

// @route   GET /api/auth/oauth-callback
// @desc    Simulated OAuth Callback
router.get('/oauth-callback', async (req, res) => {
  try {
    const { provider } = req.query;
    const email = `oauth_${provider}_user@example.com`;
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        name: `OAuth ${provider === 'google' ? 'Google' : 'GitHub'} User`,
        email,
        password: crypto.randomBytes(16).toString('hex'),
        isVerified: true
      });
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = await generateRefreshToken(user._id);
    setCookieToken(res, refreshToken);

    res.redirect(`http://localhost:5177/login?token=${accessToken}&user=${encodeURIComponent(JSON.stringify({
      _id: user._id,
      name: user.name,
      email: user.email,
      isVerified: user.isVerified
    }))}`);
  } catch (err) {
    res.redirect(`http://localhost:5177/login?error=${encodeURIComponent(err.message)}`);
  }
});

export default router;
