
# SignFlow

A modern, professional electronic signature platform built with React, Node.js, and MongoDB.

## Features

- 📄 **PDF Upload & Editing**: Upload documents and add signature fields
- ✍️ **Signature Creation**: Create, save, and reuse digital signatures
- 🔗 **Share Links**: Send secure signing links to recipients
- 🔒 **Secure Signing**: Password-protected documents and encrypted storage
- 📱 **Responsive Design**: Works on desktop and mobile devices
- 📊 **Audit Trail**: Track all document activities
- 🎨 **Modern UI/UX**: Clean, intuitive interface

## Tech Stack

### Frontend
- **React 19** with TypeScript
- **Vite** for fast builds
- **Tailwind CSS** for styling
- **PDF.js** for document rendering
- **React Router** for navigation

### Backend
- **Node.js** with Express
- **MongoDB** with Mongoose
- **pdf-lib** for PDF manipulation
- **node-signpdf** for digital signatures
- **Cloudflare R2** (optional) for storage
- **Nodemailer** for email notifications

## Installation & Setup

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- npm or yarn

### Step 1: Clone the repo

```bash
git clone https://github.com/abhinavsai2006/SignFlow.git
cd SignFlow
```

### Step 2: Backend Setup

```bash
cd backend

# Copy and configure environment variables
cp .env.example .env
# Edit .env with your MongoDB URI, JWT secret, etc.

# Install dependencies
npm install

# Start the server
npm run dev
```

### Step 3: Frontend Setup

```bash
cd ../frontend

# Copy and configure environment variables
cp .env.example .env
# Edit .env with your API URL

# Install dependencies
npm install

# Start the dev server
npm run dev
```

### Step 4: Docker (Optional)

```bash
# Build and run both services
docker-compose up -d --build
```

## Usage

1. **Register/Login**: Create an account or sign in
2. **Upload Document**: Upload a PDF file
3. **Add Signature Fields**: Drag and drop signature fields onto the document
4. **Share Link**: Send the signing link to your recipients
5. **Sign Documents**: Recipients can sign documents without creating an account
6. **Download Finalized Documents**: Download signed PDFs with audit trails

## Project Structure

```
SignFlow/
├── backend/
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API endpoints
│   ├── services/        # Business logic
│   ├── middleware/      # Auth, email, etc.
│   ├── utils/           # Utility functions
│   └── server.js        # Entry point
├── frontend/
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── hooks/       # Custom hooks
│   │   └── utils/       # Helper functions
│   └── index.html       # Entry point
└── docker-compose.yml   # Docker configuration
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/forgot-password` - Forgot password
- `POST /api/auth/reset-password` - Reset password

### Documents
- `POST /api/docs/upload` - Upload a new document
- `GET /api/docs` - Get all documents for current user
- `GET /api/docs/:id` - Get document details
- `GET /api/docs/:id/download` - Download finalized document
- `PUT /api/docs/:id/archive` - Toggle archive status
- `DELETE /api/docs/:id` - Delete document

### Signatures
- `POST /api/signatures/:id/sign-public` - Sign a document via public link
- `PUT /api/signatures/:id/public` - Update signature field position

### Share Links
- `GET /api/docs/:id/public` - Get document for public share link
- `GET /api/docs/:id/public-download` - Public document download

## Screenshots

| Document Editor | Signing Flow |
|-----------------|--------------|
| Add signature fields to documents | Recipient verification and signing |

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

This project is licensed under the MIT License.

## Acknowledgements

- React, Vite, Tailwind CSS, Node.js, Express, MongoDB
- pdf-lib, PDF.js, node-signpdf
- Cloudflare R2 (optional storage)
