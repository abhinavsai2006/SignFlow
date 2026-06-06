import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

console.log('--- STARTUP DIAGNOSTICS ---');
console.log({
  RESEND_EXISTS: !!process.env.RESEND_API_KEY,
  RESEND_LENGTH: process.env.RESEND_API_KEY?.length || 0,
  NODE_ENV: process.env.NODE_ENV
});
console.log('---------------------------');
