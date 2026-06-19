
# SignFlow: Professional Digital Signature Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-19.0-blue?logo=react&logoColor=white)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38bdf8?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js-20.0-43853d?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0-4db33d?logo=mongodb&logoColor=white)](https://www.mongodb.com/)

## Table of Contents
1. [Overview](#overview)
2. [Key Features](#key-features)
3. [Tech Stack](#tech-stack)
4. [Getting Started](#getting-started)
   - [Prerequisites](#prerequisites)
   - [Local Development](#local-development)
   - [Environment Variables](#environment-variables)
   - [Docker Deployment](#docker-deployment)
5. [Project Structure](#project-structure)
6. [API Documentation](#api-documentation)
7. [Usage Guide](#usage-guide)
8. [Contributing](#contributing)
9. [Troubleshooting](#troubleshooting)
10. [License](#license)

---

## Overview
SignFlow is a modern, production-ready digital signature platform designed to streamline document signing workflows. Built with a focus on user experience, security, and reliability, SignFlow empowers teams and individuals to sign and manage documents electronically with ease.

Whether you're sending contracts, agreements, or forms, SignFlow provides a secure, intuitive interface that simplifies the entire signing process from start to finish.

---

## Key Features
- **📄 Easy Document Upload & Management**: Support for PDF documents with full preview functionality
- **✍️ Flexible Signature Creation**: Draw, type, or upload your own signature
- **🔗 Secure Public Share Links**: Send documents to anyone via secure, password-protected links
- **👥 Multi-Recipient Signing**: Assign fields to multiple signers with parallel or sequential signing order
- **📱 Fully Responsive Design**: Works perfectly on desktop, tablet, and mobile devices
- **📊 Complete Audit Trails**: Track every action with timestamped audit logs
- **🔒 Enterprise-Grade Security**: Encrypted document storage, secure authentication, and tamper-proof signatures
- **🎨 Customizable Appearance**: Adjust signature scale, metadata size, fonts, and more
- **📩 Automated Reminders**: Configure optional reminders to keep the signing process on track
- **🔍 Certificate Verification**: View detailed signing certificates for every signed document
- **📥 Instant Download**: Get finalized PDFs with embedded signatures and audit trails immediately

---

## Tech Stack

### Frontend
- **React 19.0**: Modern, fast, and scalable UI library
- **TypeScript**: Type-safe development for better reliability and developer experience
- **Vite**: Lightning-fast build tool and dev server
- **Tailwind CSS**: Utility-first CSS framework for rapid, responsive styling
- **React Router**: Declarative routing for single-page application navigation
- **PDF.js**: High-quality PDF rendering and preview functionality
- **Lucide React**: Beautiful, consistent icon library
- **Fetch API**: Modern HTTP client for API communication

### Backend
- **Node.js 20.x**: JavaScript runtime environment for server-side applications
- **Express.js**: Minimal, flexible web application framework
- **MongoDB 7.x**: NoSQL database for storing documents, users, and audit logs
- **Mongoose**: Elegant MongoDB object modeling for Node.js
- **pdf-lib**: Library for creating and modifying PDF documents
- **node-signpdf**: Digital signature generation for PDFs
- **JWT Authentication**: Stateless, secure authentication mechanism
- **Nodemailer**: Email notification and reminder delivery system
- **Multer**: File upload middleware for handling document uploads
- **Cloudflare R2**: Optional, scalable object storage for documents (or local file system)

---

## Getting Started

### Prerequisites
Ensure you have the following installed on your system:
- [Node.js](https://nodejs.org/) v20 or later (LTS recommended)
- [MongoDB](https://www.mongodb.com/try/download/community) v7 or later (local install or MongoDB Atlas)
- [npm](https://www.npmjs.com/) (comes with Node.js) or [Yarn](https://yarnpkg.com/)
- [Git](https://git-scm.com/) (for cloning the repository)

### Local Development

#### Step 1: Clone the Repository
```bash
git clone https://github.com/abhinavsai2006/SignFlow.git
cd SignFlow
```

#### Step 2: Set Up the Backend
```bash
cd backend

# Copy example environment variables and configure
cp .env.example .env
# Edit .env with your actual configuration (see Environment Variables section below)

# Install dependencies
npm install

# Start the backend server (runs on http://localhost:3001)
npm run dev
```

#### Step 3: Set Up the Frontend
```bash
cd ../frontend

# Copy example environment variables and configure
cp .env.example .env
# Edit .env with your backend API URL (usually VITE_API_URL=http://localhost:3001/api)

# Install dependencies
npm install

# Start the frontend dev server (runs on http://localhost:5173)
npm run dev
```

#### Step 4: Access the Application
- Open your browser and navigate to: `http://localhost:5173`
- Sign up for an account to start using SignFlow!

---

### Environment Variables

#### Backend (`backend/.env`)
| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Runtime environment (`development`, `production`) | `development` | No |
| `PORT` | Backend server port | `3001` | No |
| `MONGODB_URI` | MongoDB connection string | `mongodb://127.0.0.1:27017/signflow` | Yes |
| `JWT_SECRET` | Secret key for JWT token signing (must be secure in production) | `your-jwt-secret-key-change-this-in-production` | Yes |
| `JWT_EXPIRES_IN` | JWT token expiration time | `7d` | No |
| `CORS_ORIGIN` | Frontend origin for CORS | `http://localhost:5173` | No |
| `EMAIL_HOST` | SMTP server host for email notifications | `smtp.gmail.com` | No |
| `EMAIL_PORT` | SMTP server port | `587` | No |
| `EMAIL_USER` | SMTP server username/email | | No |
| `EMAIL_PASS` | SMTP server password/app password | | No |
| `STORAGE_TYPE` | Storage provider (`local`, `r2`) | `local` | No |
| `R2_ACCOUNT_ID` | Cloudflare R2 account ID | | No (if using local) |
| `R2_ACCESS_KEY_ID` | Cloudflare R2 access key ID | | No (if using local) |
| `R2_SECRET_ACCESS_KEY` | Cloudflare R2 secret access key | | No (if using local) |
| `R2_BUCKET_NAME` | Cloudflare R2 bucket name | | No (if using local) |

#### Frontend (`frontend/.env`)
| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `VITE_API_URL` | Backend API URL | `http://localhost:3001/api` | Yes |

---

### Docker Deployment

SignFlow can also be deployed using Docker for consistent environments:

```bash
# Build and start all services (frontend, backend, and MongoDB)
docker-compose up -d --build

# Access the application
# Frontend: http://localhost:5173
# Backend: http://localhost:3001

# Stop all services
docker-compose down

# Stop services and remove volumes (warning: deletes all data!)
docker-compose down -v
```

---

## Project Structure

```
SignFlow/
├── backend/                   # Backend Node.js application
│   ├── controllers/           # Route controller functions
│   ├── models/                # Mongoose database schemas
│   ├── routes/                # API route definitions
│   ├── services/              # Business logic and utility services
│   ├── middleware/            # Express middleware functions
│   ├── utils/                 # Helper and utility functions
│   ├── uploads/               # Local file storage directory (if using local storage)
│   ├── server.js              # Backend server entry point
│   └── package.json           # Backend dependencies
├── frontend/                  # Frontend React application
│   ├── src/
│   │   ├── components/        # Reusable React components
│   │   │   ├── editor/        # Document editor components
│   │   │   ├── layout/        # Layout and navigation components
│   │   │   ├── share/         # Public share and signing components
│   │   │   └── ui/            # Generic UI components (buttons, cards, etc.)
│   │   ├── hooks/             # Custom React hooks
│   │   ├── utils/             # Utility and helper functions
│   │   ├── App.tsx            # Main app component
│   │   └── main.tsx           # Frontend entry point
│   ├── public/                # Static assets
│   ├── index.html             # HTML entry point
│   ├── vite.config.ts         # Vite configuration
│   ├── tailwind.config.ts     # Tailwind CSS configuration
│   └── package.json           # Frontend dependencies
├── docker-compose.yml         # Docker Compose configuration
├── .gitignore                 # Git ignore file
└── README.md                  # This file!
```

---

## API Documentation

### Base URL
All API endpoints are prefixed with: `/api`

---

### Authentication Endpoints

#### 1. Register User
```http
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "StrongPassword123!"
}
```

#### 2. Login User
```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "StrongPassword123!"
}
```

#### 3. Logout User
```http
POST /auth/logout
Authorization: Bearer <JWT_TOKEN>
```

#### 4. Forgot Password
```http
POST /auth/forgot-password
Content-Type: application/json

{
  "email": "john@example.com"
}
```

#### 5. Reset Password
```http
POST /auth/reset-password
Content-Type: application/json

{
  "token": "<RESET_TOKEN>",
  "newPassword": "NewStrongPassword456!"
}
```

---

### Document Endpoints

#### 1. Upload Document
```http
POST /docs/upload
Authorization: Bearer <JWT_TOKEN>
Content-Type: multipart/form-data

file: <PDF_DOCUMENT>
filename: "Contract.pdf"
```

#### 2. Get User's Documents
```http
GET /docs
Authorization: Bearer <JWT_TOKEN>
```

#### 3. Get Document Details
```http
GET /docs/:id
Authorization: Bearer <JWT_TOKEN>
```

#### 4. Update Document
```http
PUT /docs/:id
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "signingOrder": "Sequential",
  "remindersEnabled": true,
  "reminderInterval": 3,
  "expiresAt": "2024-12-31T23:59:59.000Z"
}
```

#### 5. Delete Document
```http
DELETE /docs/:id
Authorization: Bearer <JWT_TOKEN>
```

#### 6. Archive/Unarchive Document
```http
PUT /docs/:id/archive
Authorization: Bearer <JWT_TOKEN>
```

#### 7. Download Finalized Document
```http
GET /docs/:id/download
Authorization: Bearer <JWT_TOKEN>
```

---

### Signature Field Endpoints

#### 1. Create/Update Signature Fields
```http
PUT /docs/:id/fields
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "fields": [
    {
      "type": "Signature",
      "recipientEmail": "jane@example.com",
      "xPercent": 20,
      "yPercent": 60,
      "widthPercent": 25,
      "heightPercent": 10,
      "page": 1
    },
    {
      "type": "Date",
      "recipientEmail": "jane@example.com",
      "xPercent": 45,
      "yPercent": 60,
      "widthPercent": 15,
      "heightPercent": 5,
      "page": 1
    }
  ]
}
```

#### 2. Sign Document via Public Link
```http
POST /signatures/:id/sign-public
Content-Type: application/json
x-recipient-token: <RECIPIENT_TOKEN>

{
  "value": "data:image/png;base64,...",
  "signatureScale": 100,
  "metadataScale": "Medium"
}
```

#### 3. Update Signature Field Position (Public Link)
```http
PUT /signatures/:id/public
Content-Type: application/json
x-recipient-token: <RECIPIENT_TOKEN>

{
  "xPercent": 22,
  "yPercent": 65,
  "widthPercent": 28,
  "heightPercent": 12
}
```

---

### Public Share Link Endpoints

#### 1. Get Document via Share Link
```http
GET /docs/:id/public
x-recipient-token: <RECIPIENT_TOKEN>
```

#### 2. Public Document Download
```http
GET /docs/:id/public-download
x-recipient-token: <RECIPIENT_TOKEN>
```

---

## Usage Guide

### Step 1: Create an Account
1. Open SignFlow and click "Sign Up"
2. Fill in your name, email address, and a secure password
3. Verify your email if required
4. Log in to your new account

### Step 2: Upload a Document
1. Click "Upload Document" or drag and drop a PDF into the designated area
2. Wait for the document to process and preview to load

### Step 3: Add Signature Fields
1. Use the sidebar to select the field type (Signature, Initials, Date, Text, Checkbox)
2. Choose the recipient for the field from the dropdown
3. Click on the document preview to place the field
4. Resize and reposition the field as needed using drag handles
5. Repeat to add all required fields

### Step 4: Configure Recipients and Settings
1. Go to the "Recipients" tab to add or edit signers
2. Configure signing order (Parallel or Sequential)
3. Optional: Set up reminders and document expiration
4. Optional: Enable password protection for share links

### Step 5: Send the Document
1. Click "Send for Signing"
2. SignFlow will generate secure share links for each recipient
3. Copy and share these links, or let SignFlow send automated email invitations

### Step 6: Sign the Document
1. As a signer, open the share link you received
2. Complete the required fields (click on a field to start signing)
3. Create a signature (draw, type, or upload your own)
4. Once all fields are completed, click "Finish Signing"

### Step 7: Download Finalized Document
1. After all parties have signed, go to your document dashboard
2. Click "Download" to get a PDF with embedded signatures, audit information, and signing certificates

---

## Contributing
Contributions are welcome and greatly appreciated! To contribute:

1. **Fork the repository** on GitHub
2. **Create a feature branch**: `git checkout -b feature/AmazingFeature`
3. **Make your changes** with clear, concise commit messages
4. **Test your changes** thoroughly
5. **Commit your changes**: `git commit -m 'Add some AmazingFeature'`
6. **Push to the branch**: `git push origin feature/AmazingFeature`
7. **Open a Pull Request** on GitHub

For major changes, please open an issue first to discuss what you would like to change!

### Development Guidelines
- Follow TypeScript best practices and maintain type safety
- Use Tailwind CSS for styling instead of raw CSS
- Write clear, self-documenting code with comments as needed
- Test your changes on both desktop and mobile screen sizes
- Update documentation if applicable

---

## Troubleshooting

### Common Issues

#### Backend Won't Start
- Ensure MongoDB is running locally or MongoDB Atlas URI is correct
- Check that all required environment variables are set in `.env`
- Look at error messages in the terminal for more details

#### Frontend Can't Connect to Backend
- Verify `VITE_API_URL` in `frontend/.env` points to the correct backend
- Check that the backend server is running on the expected port
- Ensure CORS is configured correctly in the backend

#### Documents Not Loading
- Check that storage is properly configured (local or Cloudflare R2)
- Verify MongoDB has the correct document records
- Check browser console and network tab for errors

#### Duplicate Signatures Showing
- Clear browser cache and reload the page
- Ensure both frontend and backend are running the latest code
- Check backend logs for any issues with PDF generation/embedding

### Getting Help
If you're still having problems, please:
1. Check existing GitHub issues for similar problems
2. Open a new GitHub issue with detailed steps to reproduce
3. Include error messages, browser info, and OS version if possible

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

SignFlow would not be possible without these amazing open-source libraries and tools:

- [React](https://react.dev/) - For building beautiful user interfaces
- [Vite](https://vite.dev/) - For fast, modern web development
- [Tailwind CSS](https://tailwindcss.com/) - For rapid, responsive styling
- [PDF.js](https://mozilla.github.io/pdf.js/) - For high-quality PDF rendering
- [pdf-lib](https://pdf-lib.js.org/) - For PDF manipulation
- [node-signpdf](https://github.com/vbuch/node-signpdf) - For PDF digital signatures
- [MongoDB](https://www.mongodb.com/) - For scalable data storage
- [Express](https://expressjs.com/) - For building the backend API
- [Lucide](https://lucide.dev/) - For beautiful, consistent icons

---

Made with ❤️ by Abhinav Sai
