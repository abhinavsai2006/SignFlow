# SignFlow - Real PDF 404 Report

This report documents the analysis and path verification for the PDF 404 errors observed in production.

## 1. File Path & Database Mapping Verification
- **Express Static Config**: `app.use('/uploads', express.static(path.join(__dirname, 'uploads')))` maps URL path `/uploads/*` to the absolute folder path `backend/uploads/` on the server.
- **MongoDB Mapping**: Stored inside the `Document` collection under `originalPath` (e.g. `uploads/file-1780768089254.pdf`).
- **URL Generation**: Resolves to `https://api.signflow.abhinavsai.com/uploads/file-1780768089254.pdf`.

## 2. Root Cause of 404 Errors in Deployed Production
Railway uses an **ephemeral virtual disk** for server instances:
- Every time a new deployment is triggered or a container restarts, all files stored in the local `./backend/uploads` directory are instantly wiped.
- Mongoose Atlas retains the document records, but the underlying PDF files do not exist anymore.
- Requests to `https://api.signflow.abhinavsai.com/uploads/...` return **HTTP 404** because the file no longer exists on the container's disk.

## 3. Recommended Resolution Options
1. **Mount a Persistent Volume**: Create a Railway Volume and mount it at `/app/backend/uploads` so files persist across container rebuilds and redeployments.
2. **Cloud Storage (S3 / R2)**: Modify the file upload service to stream PDF bytes directly to an external object storage bucket (e.g. Cloudflare R2 or AWS S3) rather than storing them on the local container filesystem.
