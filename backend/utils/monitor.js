/**
 * Centralized Monitoring & Exception Tracking Wrapper
 * Mocks Sentry & BetterStack instrumentation in production environments.
 */
import dotenv from 'dotenv';
dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

export const logError = (error, context = {}) => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : '';

  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.error(`[MONITOR] ERROR CAPTURED`);
  console.error(`Message: ${errorMessage}`);
  if (stack) {
    console.error(`Stack  : ${stack}`);
  }
  console.error(`Context: ${JSON.stringify(context, null, 2)}`);
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  if (isProduction) {
    // Placeholder integration for production monitoring (e.g. Sentry.captureException)
    // Sentry.captureException(error, { extra: context });
  }
};

export const logInfo = (message, context = {}) => {
  console.log(`[MONITOR] INFO: ${message}`, Object.keys(context).length ? context : '');

  if (isProduction) {
    // Placeholder integration for BetterStack/Axiom log drains
    // logger.info(message, context);
  }
};

export default {
  logError,
  logInfo,
};
