import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';
import crypto from 'crypto';
import { sendWelcomeEmail } from '../middleware/emailService.js';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID || 'dummy_id',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'dummy_secret',
    callbackURL: process.env.GOOGLE_CALLBACK_URL || `${BACKEND_URL}/api/auth/google/callback`
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value;
      if (!email) {
        return done(new Error('Google did not return email profile data.'));
      }
      
      let user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        user = await User.create({
          name: profile.displayName || 'Google Signer',
          email: email.toLowerCase(),
          password: crypto.randomBytes(24).toString('hex'),
          isVerified: true
        });
        sendWelcomeEmail(user.email, user.name).catch(() => {});
      }
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }
));

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

export default passport;
