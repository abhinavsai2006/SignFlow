import crypto from 'crypto';
import { PDFDocument } from 'pdf-lib';

const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('🚀 Starting SignFlow AI Integration Tests...');

  const suffix = crypto.randomBytes(4).toString('hex');
  const ownerEmail = `owner_${suffix}@example.com`;
  const signerAEmail = `signer_a_${suffix}@example.com`;
  const signerBEmail = `signer_b_${suffix}@example.com`;
  const password = 'password123';

  let ownerToken, signerAToken, signerBToken;
  let ownerId, signerAId, signerBId;
  let documentId;
  let field1Id, field2Id;

  // 1. Register users
  console.log('\n--- 1. Registering Users ---');
  async function register(name, email) {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(`Registration failed for ${email}: ${JSON.stringify(data)}`);
    console.log(`✅ Registered ${email}`);
    return { token: data.accessToken, id: data._id };
  }

  const owner = await register('Owner', ownerEmail);
  ownerToken = owner.token;
  ownerId = owner.id;

  const signerA = await register('Signer A', signerAEmail);
  signerAToken = signerA.token;
  signerAId = signerA.id;

  const signerB = await register('Signer B', signerBEmail);
  signerBToken = signerB.token;
  signerBId = signerB.id;

  // Create a real valid PDF buffer using pdf-lib
  const pdfDocInstance = await PDFDocument.create();
  pdfDocInstance.addPage([600, 800]);
  const pdfBytes = await pdfDocInstance.save();
  console.log(`Generated PDF bytes: ${pdfBytes.length}`);
  const file = new File([pdfBytes], 'test_contract.pdf', { type: 'application/pdf' });
  console.log(`File size in test: ${file.size}`);
  const formData = new FormData();
  formData.append('file', file);

  const uploadRes = await fetch(`${BASE_URL}/docs/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ownerToken}`,
    },
    body: formData,
  });
  const uploadData = await uploadRes.json();
  if (!uploadRes.ok) throw new Error(`Upload failed: ${JSON.stringify(uploadData)}`);
  documentId = uploadData._id;
  console.log(`✅ Uploaded document. ID: ${documentId}`);

  // 3. Update document settings to Sequential signing order
  console.log('\n--- 3. Configuring Sequential Signing Order ---');
  const configRes = await fetch(`${BASE_URL}/docs/${documentId}/settings`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ownerToken}`,
    },
    body: JSON.stringify({
      signingOrder: 'Sequential',
    }),
  });
  const configData = await configRes.json();
  if (!configRes.ok) throw new Error(`Config failed: ${JSON.stringify(configData)}`);
  console.log(`✅ Set signing order to: ${configData.signingOrder}`);

  // 4. Add Recipients with sequences
  console.log('\n--- 4. Adding Sequential Recipients ---');
  async function addRecipient(name, email, sequence) {
    const res = await fetch(`${BASE_URL}/docs/${documentId}/recipients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({ name, email, role: 'Signer', sequence }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(`Failed to add recipient ${email}: ${JSON.stringify(data)}`);
    console.log(`✅ Added recipient: ${email} (Seq: ${sequence}, Status: ${data.status})`);
    return data;
  }

  const recA = await addRecipient('Signer A', signerAEmail, 1);
  const recB = await addRecipient('Signer B', signerBEmail, 2);

  // 5. Place signature fields
  console.log('\n--- 5. Placing Signature Field Placeholders ---');
  async function placeField(recipientEmail, xPercent, yPercent) {
    const res = await fetch(`${BASE_URL}/signatures`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({
        documentId,
        recipientEmail,
        type: 'Signature',
        xPercent,
        yPercent,
        widthPercent: 20,
        heightPercent: 10,
        page: 1,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(`Failed to place field: ${JSON.stringify(data)}`);
    console.log(`✅ Placed field for ${recipientEmail}. ID: ${data._id}`);
    return data._id;
  }

  field1Id = await placeField(signerAEmail, 10, 20);
  field2Id = await placeField(signerBEmail, 50, 60);

  // 6. Test unauthorized signing (Signer B trying to sign Signer A's field)
  console.log('\n--- 6. Testing Field Ownership Authorization Check ---');
  const badAuthRes = await fetch(`${BASE_URL}/signatures/${field1Id}/sign`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${signerBToken}`,
    },
    body: JSON.stringify({
      status: 'Signed',
      signatureValue: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
    }),
  });
  const badAuthData = await badAuthRes.json();
  if (badAuthRes.status === 403) {
    console.log(`✅ Correctly blocked Signer B from signing Signer A's field: "${badAuthData.message}"`);
  } else {
    throw new Error(`❌ Security failure: Signer B signed Signer A's field! Status: ${badAuthRes.status}`);
  }

  // 7. Test sequential order block (Signer B trying to sign their own field first)
  console.log('\n--- 7. Testing Sequential Routing Check (Signer B blocked) ---');
  const badSeqRes = await fetch(`${BASE_URL}/signatures/${field2Id}/sign`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${signerBToken}`,
    },
    body: JSON.stringify({
      status: 'Signed',
      signatureValue: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
    }),
  });
  const badSeqData = await badSeqRes.json();
  if (badSeqRes.status === 403) {
    console.log(`✅ Correctly blocked Signer B from signing out of sequence: "${badSeqData.message}"`);
  } else {
    throw new Error(`❌ Sequencing failure: Signer B was able to sign before Signer A! Status: ${badSeqRes.status}`);
  }

  // 8. Signer A signs their field
  console.log('\n--- 8. Signer A signs Field 1 ---');
  const signARes = await fetch(`${BASE_URL}/signatures/${field1Id}/sign`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${signerAToken}`,
    },
    body: JSON.stringify({
      status: 'Signed',
      signatureValue: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
    }),
  });
  const signAData = await signARes.json();
  if (signARes.ok) {
    console.log('✅ Signer A successfully signed Field 1');
  } else {
    throw new Error(`Failed to sign Field 1: ${JSON.stringify(signAData)}`);
  }

  // 9. Signer B signs their field now that Signer A has signed
  console.log('\n--- 9. Signer B signs Field 2 ---');
  const signBRes = await fetch(`${BASE_URL}/signatures/${field2Id}/sign`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${signerBToken}`,
    },
    body: JSON.stringify({
      status: 'Signed',
      signatureValue: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
    }),
  });
  const signBData = await signBRes.json();
  if (signBRes.ok) {
    console.log('✅ Signer B successfully signed Field 2');
  } else {
    throw new Error(`Failed to sign Field 2: ${JSON.stringify(signBData)}`);
  }

  // 10. Finalize the document
  console.log('\n--- 10. Finalizing PDF Document ---');
  const finalizeRes = await fetch(`${BASE_URL}/signatures/finalize`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ownerToken}`,
    },
    body: JSON.stringify({ documentId }),
  });
  const finalizeData = await finalizeRes.json();
  if (finalizeRes.ok) {
    console.log('✅ Document finalized successfully!');
    console.log(`   SHA-256 Checksum: ${finalizeData.sha256Checksum}`);
    console.log(`   Final PDF path: ${finalizeData.document.originalPath}`);
  } else {
    throw new Error(`Finalization failed: ${JSON.stringify(finalizeData)}`);
  }

  console.log('\n🎉 ALL INTEGRATION TESTS PASSED SUCCESSFULLY! 🎉');
}

runTests().catch(err => {
  console.error('\n❌ TEST SUITE FAILED:', err);
  process.exit(1);
});
