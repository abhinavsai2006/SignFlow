
# SignFlow

A modern, production-ready digital signature platform designed to streamline document signing workflows with enterprise-grade security and an intuitive user experience.

## Key Advantages (Why Choose SignFlow?)

- **Open Source & Extensible**: Fully customizable for your needs with a permissive MIT license
- **No Vendor Lock-In**: Keep full control of your documents and signatures
- **Fast & Lightweight**: Built with modern tools for exceptional performance
- **Secure by Design**: Encrypted storage, tamper-proof signatures, and robust authentication
- **Multi-Platform Support**: Works perfectly on desktop, tablet, and mobile devices
- **Developer-Friendly**: Clean codebase, comprehensive documentation, and modular architecture

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation & Setup](#installation--setup)
  - [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [Configuration Options](#configuration-options)
- [Usage Guide](#usage-guide)
- [Contributing](#contributing)
- [License](#license)

---

## Features

### Core Features

- **Document Management**
  - PDF upload with drag-and-drop support
  - Real-time document preview using PDF.js
  - Document status tracking (Draft, Pending, Signed, Archived)
  - Archive/Unarchive functionality
  - Secure document storage (local file system or Cloudflare R2)

- **Signature Creation**
  - Draw signatures directly on the canvas
  - Type signatures with custom fonts and styles
  - Upload custom signature images (PNG, JPG, etc.)
  - Save and reuse signatures for future documents

- **Signature Fields**
  - Multiple field types: Signature, Initials, Date, Text, Checkbox
  - Drag-and-drop field placement on documents
  - Resizable and draggable fields
  - Assign fields to specific recipients
  - Field locking to prevent accidental changes

- **Recipient Management**
  - Add multiple signers and viewers
  - Configure signing order (Parallel or Sequential)
  - Secure share links with optional password protection
  - Optional email notifications and reminders

- **Signing Experience**
  - Public share link access (no account required for signers)
  - Guided signing process
  - Signature preview before finalization
  - Metadata customization (scale, font, etc.)

- **Audit & Compliance**
  - Complete audit trails for all document actions
  - Timestamped activity logs
  - Signer information (IP address, user agent, etc.)
  - Finalized PDF with embedded signatures and audit information
  - Downloadable signing certificates

### Secondary Features

- **User Authentication & Security**
  - Secure user registration and login
  - JWT-based stateless authentication
  - Password hashing with bcrypt
  - Password reset functionality
  - Protected routes and API endpoints

- **Responsive Design**
  - Optimized for desktop, tablet, and mobile screens
  - Touch-friendly interface for mobile devices
  - Clean, modern UI with smooth animations

- **Developer Experience**
  - TypeScript for type safety
  - Vite for fast builds and hot module replacement
  - Tailwind CSS for rapid styling
  - Modular, well-organized codebase
  - Comprehensive inline documentation

---

## Tech Stack

### Frontend
- **React 19**: Modern UI library with concurrent features
- **TypeScript**: Type-safe development for better reliability
- **Vite**: Lightning-fast build tool and dev server
- **Tailwind CSS**: Utility-first CSS framework for responsive styling
- **React Router**: Declarative routing for single-page apps
- **PDF.js**: High-quality PDF rendering and preview
- **Lucide React**: Beautiful, consistent icons
- **Fetch API**: Modern HTTP client for API communication

### Backend
- **Node.js 20+**: JavaScript runtime for server-side apps
- **Express.js**: Minimal, flexible web application framework
- **MongoDB 7+**: NoSQL database for flexible data storage
- **Mongoose**: Elegant MongoDB object modeling
- **pdf-lib**: Powerful PDF manipulation library
- **node-signpdf**: Digital signature generation for PDFs
- **JWT**: Stateless authentication mechanism
- **Nodemailer**: Email notifications and reminders
- **Multer**: File upload middleware
- **bcrypt**: Password hashing library
- **CORS**: Cross-origin resource sharing configuration

---

## Getting Started

### Prerequisites

Ensure you have the following installed and configured:

1. **Node.js**: Version 20.x or later (LTS recommended)
2. **MongoDB**: Either a local installation or MongoDB Atlas account
3. **npm** or **Yarn**: Package managers (npm comes with Node.js)
4. **Git**: For cloning the repository

### Installation & Setup

Follow these steps to set up SignFlow on your local machine:

1. **Clone the repository**
   ```bash
   git clone https://github.com/abhinavsai2006/SignFlow.git
   cd SignFlow
   ```

2. **Set up the Backend**
   ```bash
   cd backend
   
   # Copy example environment variables
   cp .env.example .env
   
   # Edit .env with your configuration (see Environment Variables section below)
   
   # Install dependencies
   npm install
   
   # Start the backend development server
   npm run dev
   ```

   The backend will start on `http://localhost:3001` by default.

3. **Set up the Frontend**
   ```bash
   cd ../frontend
   
   # Copy example environment variables
   cp .env.example .env
   
   # Edit .env with your backend API URL
   
   # Install dependencies
   npm install
   
   # Start the frontend development server
   npm run dev
   ```

   The frontend will start on `http://localhost:5173` by default.

4. **Access the application**
   Open your browser and navigate to `http://localhost:5173`. You can now sign up for an account and start using SignFlow!

---

## Environment Variables

### Backend Configuration (`backend/.env`)

Create a `.env` file in the `backend` directory with the following variables:

| Variable | Description | Default Value | Required |
|----------|-------------|---------------|----------|
| `NODE_ENV` | Runtime environment (`development` or `production`) | `development` | No |
| `PORT` | Backend server port | `3001` | No |
| `MONGODB_URI` | MongoDB connection string | `mongodb://127.0.0.1:27017/signflow` | Yes |
| `JWT_SECRET` | Secret key for signing JWT tokens (must be long and secure in production) | `your-jwt-secret-key-change-this-in-production` | Yes |
| `JWT_EXPIRES_IN` | JWT token expiration time (e.g., `7d`, `24h`, `60m`) | `7d` | No |
| `CORS_ORIGIN` | Frontend origin URL for CORS policy | `http://localhost:5173` | No |
| `EMAIL_HOST` | SMTP server host for sending emails (e.g., `smtp.gmail.com`) | | No |
| `EMAIL_PORT` | SMTP server port (e.g., `587`) | | No |
| `EMAIL_USER` | SMTP server username/email address | | No |
| `EMAIL_PASS` | SMTP server password or app-specific password | | No |
| `STORAGE_TYPE` | Storage provider (`local` or `r2`) | `local` | No |
| `R2_ACCOUNT_ID` | Cloudflare R2 account ID (required if `STORAGE_TYPE=r2`) | | No (if using local) |
| `R2_ACCESS_KEY_ID` | Cloudflare R2 access key ID | | No (if using local) |
| `R2_SECRET_ACCESS_KEY` | Cloudflare R2 secret access key | | No (if using local) |
| `R2_BUCKET_NAME` | Cloudflare R2 bucket name | | No (if using local) |

### Frontend Configuration (`frontend/.env`)

Create a `.env` file in the `frontend` directory with the following variable:

| Variable | Description | Default Value | Required |
|----------|-------------|---------------|----------|
| `VITE_API_URL` | Backend API URL | `http://localhost:3001/api` | Yes |

---

## Project Structure

Here's an overview of the project's directory structure and key files:

```
SignFlow/
├── backend/                          # Backend Node.js application
│   ├── controllers/                  # Request handlers for API endpoints
│   │   ├── authController.js         # Authentication-related controllers
│   │   ├── documentController.js     # Document management controllers
│   │   └── signatureController.js    # Signature-related controllers
│   ├── models/                       # Mongoose database schemas
│   │   ├── Document.js               # Document model schema
│   │   ├── SignatureField.js         # Signature field model schema
│   │   ├── User.js                   # User model schema
│   │   └── AuditLog.js               # Audit log model schema
│   ├── routes/                       # API route definitions
│   │   ├── auth.js                   # Authentication routes
│   │   ├── documents.js              # Document routes
│   │   └── signatures.js             # Signature routes
│   ├── services/                     # Business logic and utility services
│   │   ├── pdfService.js             # PDF manipulation and signing service
│   │   ├── storageService.js         # Document storage service (local/R2)
│   │   └── emailService.js           # Email notification service
│   ├── middleware/                   # Express middleware functions
│   │   ├── auth.js                   # JWT authentication middleware
│   │   └── errorHandler.js           # Error handling middleware
│   ├── utils/                        # Helper and utility functions
│   ├── uploads/                      # Local file storage directory (if using local storage)
│   ├── server.js                     # Backend server entry point
│   ├── package.json                  # Backend dependencies and scripts
│   └── .env.example                  # Example backend environment variables
│
├── frontend/                         # Frontend React application
│   ├── src/
│   │   ├── components/               # Reusable React components
│   │   │   ├── editor/               # Document editor components
│   │   │   │   ├── DocumentEditor.tsx  # Main document editor interface
│   │   │   │   ├── SigningModal.tsx    # Modal for creating signatures
│   │   │   │   └── CertificatePanel.tsx # Certificate and audit log viewer
│   │   │   ├── layout/               # Layout and navigation components
│   │   │   │   └── Navbar.tsx        # Top navigation bar
│   │   │   ├── share/                # Public share and signing components
│   │   │   │   ├── ShareViewer.tsx   # Public document viewer
│   │   │   │   └── ShareFieldLayer.tsx # Field overlay for share pages
│   │   │   └── ui/                   # Generic UI components (buttons, cards, etc.)
│   │   ├── hooks/                    # Custom React hooks
│   │   │   └── useShareDocument.ts   # Hook for managing shared documents
│   │   ├── utils/                    # Utility and helper functions
│   │   │   ├── api.ts                # API request utilities
│   │   │   └── emailUtils.ts         # Email normalization utilities
│   │   ├── App.tsx                   # Main application component with routes
│   │   └── main.tsx                  # Frontend entry point
│   ├── public/                       # Static assets (favicon, etc.)
│   ├── index.html                    # HTML entry point for Vite
│   ├── vite.config.ts                # Vite configuration file
│   ├── tailwind.config.ts            # Tailwind CSS configuration
│   ├── package.json                  # Frontend dependencies and scripts
│   └── .env.example                  # Example frontend environment variables
│
├── docker-compose.yml                # Docker Compose configuration (optional)
├── .gitignore                        # Git ignore patterns
├── README.md                         # This file!
└── LICENSE                           # MIT License file
```

---

## Configuration Options

### Backend Configuration

#### Storage Options
SignFlow supports two storage providers for storing documents and signatures:

1. **Local File System (Default)**: Stores files in the `backend/uploads` directory
   - Set `STORAGE_TYPE=local` in your `.env` file
   - No additional configuration required

2. **Cloudflare R2**: Scalable, S3-compatible object storage
   - Set `STORAGE_TYPE=r2` in your `.env` file
   - Configure `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, and `R2_BUCKET_NAME`
   - R2 offers low-cost, high-performance storage with no egress fees

#### Email Notifications
You can configure SignFlow to send email notifications to recipients:

1. Set up an SMTP server (Gmail, SendGrid, Mailgun, etc.)
2. Configure `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, and `EMAIL_PASS` in your `.env` file
3. SignFlow will automatically send notifications when documents are sent for signing

### Frontend Configuration

#### API URL
Set `VITE_API_URL` in `frontend/.env` to point to your backend server:

```env
# Local development
VITE_API_URL=http://localhost:3001/api

# Production
VITE_API_URL=https://your-backend-domain.com/api
```

---

## Usage Guide

### Step 1: Create an Account
1. Open SignFlow and click the **Sign Up** button
2. Enter your name, email address, and a secure password
3. Verify your email if required (depending on your configuration)
4. Log in to your new account using your credentials

### Step 2: Upload a Document
1. From the dashboard, click **Upload Document**
2. Either drag and drop a PDF file or click to browse and select one
3. Wait for the document to upload and the preview to load

### Step 3: Add Signature Fields
1. Use the sidebar to select a field type (Signature, Initials, Date, Text, Checkbox)
2. Choose a recipient from the dropdown menu
3. Click anywhere on the document preview to place the field
4. Resize or reposition the field by dragging its corners or edges
5. Repeat to add all required fields
6. Optional: Lock a field to prevent accidental changes

### Step 4: Configure Recipients & Settings
1. Go to the **Recipients** tab in the sidebar
2. Add or edit signers and viewers as needed
3. Choose a signing order:
   - **Parallel**: All recipients can sign at the same time
   - **Sequential**: Recipients sign one after another in order
4. Optional: Enable and configure email reminders
5. Optional: Set an expiration date for the document
6. Optional: Enable password protection for share links

### Step 5: Send the Document for Signing
1. When you're ready, click **Send for Signing**
2. SignFlow will generate secure share links for each recipient
3. Copy and share these links manually, or let SignFlow send automated email invitations (if configured)

### Step 6: Sign a Document (as a Recipient)
1. Open the share link you received
2. Click on a required field to start signing
3. Choose how to create your signature:
   - **Draw**: Draw your signature using your mouse or touchscreen
   - **Type**: Type your name and choose a font and style
   - **Upload**: Upload an image of your signature
4. Preview your signature and adjust scale and metadata if needed
5. Click **Sign** to apply your signature
6. Repeat for all required fields
7. Click **Finish Signing** when you're done

### Step 7: Download the Finalized Document
1. Once all parties have signed, go back to your dashboard
2. Find the document and click **Download**
3. You'll get a PDF with embedded signatures, audit information, and signing certificates

---

## Contributing

Contributions are welcome and greatly appreciated! Whether you're fixing bugs, adding features, or improving documentation, your help makes SignFlow better for everyone.

### How to Contribute

1. **Fork the repository** on GitHub
2. **Create a new feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes** with clear, concise commit messages
4. **Test your changes** thoroughly on different screen sizes and browsers
5. **Commit your changes**:
   ```bash
   git commit -m "Add your feature or fix description here"
   ```
6. **Push your branch**:
   ```bash
   git push origin feature/your-feature-name
   ```
7. **Open a Pull Request** on GitHub and describe your changes in detail

### Development Guidelines

- Follow TypeScript best practices and maintain type safety
- Use Tailwind CSS for styling instead of raw CSS
- Write clear, self-documenting code with comments as needed
- Test your changes on both desktop and mobile screen sizes
- Update the README.md if your changes affect functionality or configuration
- Keep commits small and focused on a single issue or feature

---

## License

SignFlow is licensed under the MIT License. This means you're free to use, modify, and distribute the project for personal or commercial purposes, as long as you include the original copyright and license notice.

See the [LICENSE](LICENSE) file for full details.

---

Made with ❤️ by Abhinav Sai
