# LOW PRIORITY IMPROVEMENTS & CODE QUALITY REPORT

This report lists optimizations, code cleanups, and performance improvements to elevate codebase compliance, load times, and database query efficiency.

---

## 1. Missing Database Indexes on Schema Foreign Keys

* **Files:** [Document.js](file:///e:/Labmetrix/Project-1/backend/models/Document.js), [DocumentRecipient.js](file:///e:/Labmetrix/Project-1/backend/models/DocumentRecipient.js)
* **Severity:** Medium / Low
* **Description:** 
  The schema configuration does not explicitly define indexes on database relations (`ownerId`, `documentId`, `workspaceId`). This causes MongoDB to perform full collection scans (`COLLSCAN`) for document fetches, recipient mapping, and workflow tracking.

### Exact Code Fix

Add schema-level indices in Mongoose schemas.

In `backend/models/Document.js` (before model compilation):
```javascript
documentSchema.index({ ownerId: 1 });
documentSchema.index({ workspaceId: 1 });
```

In `backend/models/DocumentRecipient.js` (before model compilation):
```javascript
documentRecipientSchema.index({ documentId: 1 });
documentRecipientSchema.index({ email: 1 });
```

---

## 2. Missing Code-Splitting / Lazy Loading for Massive Components

* **File:** [App.tsx](file:///e:/Labmetrix/Project-1/frontend/src/App.tsx)
* **Line:** 16-17
* **Severity:** Low (Performance)
* **Description:** 
  Heavy components like `DocumentEditor.tsx` (136KB) and `PublicShareView.tsx` (58KB) are imported synchronously. This balloons the main bundle size, causing slower First Contentful Paint (FCP) and high page interaction delay.

### Exact Code Fix

Utilize `React.lazy` to load heavy route views asynchronously.

```diff
- import DocumentEditor from './components/editor/DocumentEditor';
- import PublicShareView from './components/editor/PublicShareView';
+ import { lazy, Suspense } from 'react';
+ const DocumentEditor = lazy(() => import('./components/editor/DocumentEditor'));
+ const PublicShareView = lazy(() => import('./components/editor/PublicShareView'));
```

Wrap layout router or routes inside `<Suspense fallback={<p>Loading view...</p>}>`.

---

## 3. Unused Dependencies in package.json

* **File:** [package.json](file:///e:/Labmetrix/Project-1/backend/package.json)
* **Line:** 23, 27
* **Severity:** Low (Code Hygiene)
* **Description:** 
  `nodemailer` and `mongodb` dependencies are listed in `dependencies` but are never imported or called anywhere. Removing them cleans up node dependencies.

### Exact Code Fix

Run:
```bash
npm uninstall nodemailer mongodb
```
And remove them from the dependencies object in `backend/package.json`.

---

## 4. Unused Rate Limiter Declaration

* **File:** [server.js](file:///e:/Labmetrix/Project-1/backend/server.js)
* **Line:** 100
* **Severity:** Low (Dead Code)
* **Description:** 
  `publicSignLimiter` is configured but is never applied to public signing routes, falling back to the generic `generalLimiter`.

### Exact Code Fix

Apply the limiter specifically to public paths in `server.js` or delete it if not needed.
```javascript
app.use('/api/signatures', publicSignLimiter, signatureRoutes);
```
