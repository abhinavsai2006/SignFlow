import forge from 'node-forge';
import fs from 'fs';
import path from 'path';

let cachedP12 = null;
const p12Password = process.env.PDF_SIGN_PASSWORD || 'signflow_password';

export const generateSelfSignedP12 = () => {
  console.log('[Cert Provider] Generating self-signed RSA 2048 keypair and X.509 certificate for PDF signing...');
  const keys = forge.pki.rsa.generateKeyPair(2048);
  const cert = forge.pki.createCertificate();
  cert.publicKey = keys.publicKey;
  cert.serialNumber = '01';
  cert.validity.notBefore = new Date();
  cert.validity.notAfter = new Date();
  cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 5);

  const attrs = [{
    name: 'commonName',
    value: 'SignFlow Document Signer'
  }, {
    name: 'countryName',
    value: 'IN'
  }, {
    shortName: 'ST',
    value: 'Andhra Pradesh'
  }, {
    name: 'localityName',
    value: 'Nellore'
  }, {
    name: 'organizationName',
    value: 'SignFlow Technologies'
  }, {
    shortName: 'OU',
    value: 'SignFlow DSC MVP'
  }];
  cert.setSubject(attrs);
  cert.setIssuer(attrs);
  
  // Sign certificate with private key
  cert.sign(keys.privateKey, forge.md.sha256.create());

  // Create PKCS12 DER format
  const p12Asn1 = forge.pkcs12.toPkcs12Asn1(
    keys.privateKey, [cert], p12Password,
    { algorithm: '3des' }
  );
  const p12Der = forge.asn1.toDer(p12Asn1).getBytes();
  return Buffer.from(p12Der, 'binary');
};

export const getSigningCertificate = () => {
  if (cachedP12) return { p12Buffer: cachedP12, password: p12Password };

  // Try reading from environment variable
  if (process.env.PDF_SIGN_CERT) {
    try {
      console.log('[Cert Provider] Loading certificate from environment variable...');
      // It can be base64-encoded p12
      const base64Pattern = /^[a-zA-Z0-9+/]*={0,2}$/;
      if (base64Pattern.test(process.env.PDF_SIGN_CERT.trim()) && process.env.PDF_SIGN_CERT.length > 100) {
        cachedP12 = Buffer.from(process.env.PDF_SIGN_CERT, 'base64');
      } else if (fs.existsSync(process.env.PDF_SIGN_CERT)) {
        // Or path to .p12 file
        cachedP12 = fs.readFileSync(process.env.PDF_SIGN_CERT);
      }
      if (cachedP12) {
        return { p12Buffer: cachedP12, password: p12Password };
      }
    } catch (err) {
      console.error('[Cert Provider] Failed to load PDF_SIGN_CERT:', err.message);
    }
  }

  // Fallback: Generate self-signed certificate
  cachedP12 = generateSelfSignedP12();
  return { p12Buffer: cachedP12, password: p12Password };
};
