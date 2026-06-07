import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, 'backend', '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

async function run() {
  if (!MONGODB_URI) {
    console.error('No MONGODB_URI found');
    process.exit(1);
  }
  
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to DB');

  // Let's load the Document schema/model
  const docSchema = new mongoose.Schema({}, { strict: false, collection: 'documents' });
  const Document = mongoose.model('Document', docSchema);

  const sigFieldSchema = new mongoose.Schema({}, { strict: false, collection: 'signaturefields' });
  const SignatureField = mongoose.model('SignatureField', sigFieldSchema);

  const docId = '665efdf1bc92e62444e9591b';
  const doc = await Document.findById(docId);
  console.log('--- Document Meta ---');
  console.log(JSON.stringify(doc, null, 2));

  const fields = await SignatureField.find({ documentId: docId });
  console.log('--- Fields ---');
  console.log(JSON.stringify(fields, null, 2));

  await mongoose.disconnect();
}

run().catch(console.error);
