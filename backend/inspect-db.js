import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

async function run() {
  if (!MONGODB_URI) {
    console.error('No MONGODB_URI found');
    process.exit(1);
  }
  
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to DB');

  const sigFieldSchema = new mongoose.Schema({}, { strict: false, collection: 'signaturefields' });
  const SignatureField = mongoose.model('SignatureField', sigFieldSchema);

  const docSchema = new mongoose.Schema({}, { strict: false, collection: 'documents' });
  const Document = mongoose.model('Document', docSchema);

  const sigId = '6a2539e0fe2cef724e4fe2c8';
  const field = await SignatureField.findById(sigId);
  console.log('--- Signature Field ---');
  console.log(JSON.stringify(field, null, 2));

  console.log('--- All fields for document 6a2539c8fe2cef724e4fe2b7 ---');
  const docFields = await SignatureField.find({ documentId: '6a2539c8fe2cef724e4fe2b7' });
  console.log(JSON.stringify(docFields, null, 2));

  await mongoose.disconnect();
}

run().catch(console.error);
