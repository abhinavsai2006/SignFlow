# SignFlow AI Storage & Path Audit Report

Date: 2026-06-06T18:18:45.829Z

## Document Uploads Validation

| Filename | MongoDB originalPath | File Exists on Disk? | Public URL | Status |
|---|---|---|---|---|
| VIT_AP_DSA_Lab_Assignment_Lab_Task_5_v1.pdf | `uploads/file-1780680044823.pdf` | ✅ YES | [Link](/uploads/file-1780680044823.pdf) | Active |
| VIT_AP_DSA_Lab_Assignment_Lab_Task_5_v1.pdf | `uploads/file-1780680056223.pdf` | ✅ YES | [Link](/uploads/file-1780680056223.pdf) | Active |
| VIT_AP_DSA_Lab_Assignment_Lab_Task_5_v1.pdf | `uploads/file-1780680290623.pdf` | ✅ YES | [Link](/uploads/file-1780680290623.pdf) | Active |
| VIT_AP_DSA_Lab_Assignment_Lab_Task_5_v1.pdf | `uploads/file-1780680696606.pdf` | ✅ YES | [Link](/uploads/file-1780680696606.pdf) | Active |
| VIT_AP_DSA_Lab_Assignment_Lab_Task_5_v1.pdf | `uploads/file-1780681271392.pdf` | ✅ YES | [Link](/uploads/file-1780681271392.pdf) | Active |
| VIT_AP_DSA_Lab_Assignment_Lab_Task_5_v1.pdf | `uploads/finalized-1780686680080-VIT_AP_DSA_Lab_Assignment_Lab_Task_5_v1.pdf` | ✅ YES | [Link](/uploads/finalized-1780686680080-VIT_AP_DSA_Lab_Assignment_Lab_Task_5_v1.pdf) | Active |
| VIT_AP_DSA_Lab_Assignment_Lab_Task_5_v1.pdf | `uploads/finalized-1780685785014-VIT_AP_DSA_Lab_Assignment_Lab_Task_5_v1.pdf` | ✅ YES | [Link](/uploads/finalized-1780685785014-VIT_AP_DSA_Lab_Assignment_Lab_Task_5_v1.pdf) | Active |
| 6.BFS(Breadth First Search).pdf | `uploads/file-1780683729250.pdf` | ✅ YES | [Link](/uploads/file-1780683729250.pdf) | Active |
| test_contract.pdf | `uploads/file-1780684665959.pdf` | ✅ YES | [Link](/uploads/file-1780684665959.pdf) | Active |
| test_contract.pdf | `uploads/file-1780684687421.pdf` | ✅ YES | [Link](/uploads/file-1780684687421.pdf) | Active |
| test_contract.pdf | `uploads/file-1780684708576.pdf` | ✅ YES | [Link](/uploads/file-1780684708576.pdf) | Active |
| test_contract.pdf | `uploads/file-1780684728843.pdf` | ✅ YES | [Link](/uploads/file-1780684728843.pdf) | Active |
| test_contract.pdf | `uploads/file-1780684759451.pdf` | ✅ YES | [Link](/uploads/file-1780684759451.pdf) | Active |
| test_contract.pdf | `uploads/file-1780684781048.pdf` | ✅ YES | [Link](/uploads/file-1780684781048.pdf) | Active |
| test_contract.pdf | `uploads/file-1780684802378.pdf` | ✅ YES | [Link](/uploads/file-1780684802378.pdf) | Active |
| test_contract.pdf | `uploads/file-1780684808530.pdf` | ✅ YES | [Link](/uploads/file-1780684808530.pdf) | Active |
| test_contract.pdf | `uploads/file-1780684825406.pdf` | ✅ YES | [Link](/uploads/file-1780684825406.pdf) | Active |
| test_contract.pdf | `uploads/file-1780684881378.pdf` | ✅ YES | [Link](/uploads/file-1780684881378.pdf) | Active |
| test_contract.pdf | `uploads/file-1780684901896.pdf` | ✅ YES | [Link](/uploads/file-1780684901896.pdf) | Active |
| test_contract.pdf | `uploads/file-1780684922589.pdf` | ✅ YES | [Link](/uploads/file-1780684922589.pdf) | Active |
| test_contract.pdf | `uploads/finalized-1780684973117-test_contract.pdf` | ✅ YES | [Link](/uploads/finalized-1780684973117-test_contract.pdf) | Active |
| test_contract.pdf | `uploads/finalized-1780684984529-test_contract.pdf` | ✅ YES | [Link](/uploads/finalized-1780684984529-test_contract.pdf) | Active |
| VIT_AP_DSA_Lab_Assignment_Lab_Task_5_v1.pdf | `uploads/file-1780688983912.pdf` | ✅ YES | [Link](/uploads/file-1780688983912.pdf) | Active |
| test_contract.pdf | `uploads/finalized-1780728783124-test_contract.pdf` | ✅ YES | [Link](/uploads/finalized-1780728783124-test_contract.pdf) | Active |
| VIT_AP_DSA_Lab_Assignment_Lab_Task_5_v1 (1).pdf | `uploads/finalized-1780730248530-VIT_AP_DSA_Lab_Assignment_Lab_Task_5_v1 (1).pdf` | ✅ YES | [Link](/uploads/finalized-1780730248530-VIT_AP_DSA_Lab_Assignment_Lab_Task_5_v1 (1).pdf) | Active |
| test_contract.pdf | `uploads/finalized-1780731802564-test_contract.pdf` | ✅ YES | [Link](/uploads/finalized-1780731802564-test_contract.pdf) | Active |
| VIT_AP_DSA_Lab_Assignment_Lab_Task_5_v1 (1).pdf | `uploads/file-1780732573747.pdf` | ✅ YES | [Link](/uploads/file-1780732573747.pdf) | Active |
| VIT_AP_DSA_Lab_Assignment_Lab_Task_5_v1 (1).pdf | `uploads/finalized-1780763774786-VIT_AP_DSA_Lab_Assignment_Lab_Task_5_v1 (1).pdf` | ✅ YES | [Link](/uploads/finalized-1780763774786-VIT_AP_DSA_Lab_Assignment_Lab_Task_5_v1 (1).pdf) | Active |
| test_contract.pdf | `uploads/finalized-1780761815018-test_contract.pdf` | ✅ YES | [Link](/uploads/finalized-1780761815018-test_contract.pdf) | Active |
| test-certificate.pdf | `uploads/file-1780768089254.pdf` | ❌ NO | [Link](/uploads/file-1780768089254.pdf) | Broken (404) |

### Statistics
- **Total documents in DB:** 30
- **Files present on disk:** 29
- **Files missing (404/Ephemeral loss):** 1

## Root Cause & Recommendations

### 1. Ephemeral Filesystem
Railway uses an ephemeral filesystem by default. When the server redeploys or restarts, any files uploaded via Multer to the local `uploads/` folder are wiped out. MongoDB still retains the records, leading to 404 errors when accessing URLs.

### 2. Path Mapping Mismatch
Multer saves to relative paths (e.g. `uploads/file-xyz.pdf`) based on the execution directory. If started from the workspace root instead of the backend folder, files could end up in `./uploads/` instead of `./backend/uploads/`, leading to static serving failures.

### 3. Resolution Recommendations
- **Option A:** Mount a persistent volume on Railway to map the `/app/backend/uploads` folder.
- **Option B (SaaS Best Practice):** Integrate AWS S3 or Cloudflare R2 for storing and serving documents.
