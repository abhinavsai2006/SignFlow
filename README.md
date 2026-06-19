# SignFlow: Enterprise-Grade Digital Signatures

The modern way to sign documents. Upload PDFs, place digital signature fields, invite recipients, and generate legally traceable signed documents — with full cryptographic audit trails.

## Key Features

### Professional Signing Canvas
- Draw smooth signatures using your mouse or touchscreen
- Type in multiple decorative cursive fonts
- Upload your own handwritten signature image
- Customize ink colors and field styling

### Tamper-Proof Audit Trail
- Every action is recorded — signer IP, browser, timestamp, and device
- Cryptographic Certificate of Completion appended to every finalized document
- SHA-256 document integrity verification

### Public Signing Links
- Generate password-protected share links
- One-time-use and expiring link options
- Recipients can sign without creating an account

### Multi-Signer Workflows
- Coordinate complex signing sequences
- Route documents sequentially or in parallel
- Automatic email notifications to each signer

### Team Workspaces
- Organize teams into shared workspaces
- Role-based access control (RBAC)
- Collaborate on templates and manage documents collectively

### Identity Verification
- Capture comprehensive signer identity for every signature event
- IP address, browser fingerprint, operating system, and geographic location

## Compliance & Security

SignFlow complies with:
- US Electronic Signatures in Global and National Commerce Act (ESIGN)
- Uniform Electronic Transactions Act (UETA)
- EU eIDAS regulations
- SOC 2 compliant
- HIPAA ready
- 256-bit AES encryption
- SSL/TLS secure transfer
- SHA-256 cryptographic hashing

## Three Steps to a Signed Document

### 1. Upload and prepare
Import any PDF. Drag and drop signature, text, date, and checkbox fields onto specific pages with precision placement.

### 2. Invite recipients
Define signing order — sequential or parallel. Add signer details and send customized invitations via email or share link.

### 3. Sign and verify
Once all signatures are captured, the system finalizes the PDF, appends a Certificate of Completion, and generates SHA-256 integrity proof.

## Tech Stack

### Frontend
- React 19.2
- TypeScript 6.0
- Vite 8.0
- Tailwind CSS 4.3
- React Router 7.17
- PDF.js 5.6
- Lucide Icons
- React Hook Form
- Framer Motion

### Backend
- Node.js 22+
- Express.js 5.2
- MongoDB 7.2 + Mongoose 9.6
- pdf-lib 1.17
- node-signpdf 3.0
- JWT Authentication
- Helmet security headers
- Express Rate Limiting
- bcrypt password hashing
- Nodemailer/Resend for emails
- Cloudflare R2 or local file storage
- Stripe for billing
- Passport for OAuth

## Getting Started

### Prerequisites
- Node.js 22+
- MongoDB 7.2+
- npm or yarn

### Local Development Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/abhinavsai2006/SignFlow.git
   cd SignFlow
   ```

2. Set up the backend:
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your configuration
   npm install
   npm run dev
   ```

3. Set up the frontend:
   ```bash
   cd ../frontend
   cp .env.example .env
   # Edit .env with your backend API URL
   npm install
   npm run dev
   ```

4. Open your browser and navigate to http://localhost:5173

### Docker Deployment

SignFlow includes a complete Docker setup for easy deployment:
```bash
docker-compose up -d --build
```

## Project Structure

```
SignFlow/
├── backend/                      # Backend Node.js application
│   ├── __tests__/               # Test files
│   ├── controllers/              # Request handlers
│   ├── middleware/               # Auth, email, upload, etc.
│   ├── models/                   # MongoDB schemas
│   ├── routes/                   # API endpoint definitions
│   ├── scripts/                  # Audit, maintenance, and testing scripts
│   ├── services/                 # PDF service, storage service
│   └── utils/                    # Helpers, email templates
├── frontend/                     # Frontend React application
│   ├── public/                   # Static assets
│   └── src/
│       ├── components/           # React components
│       │   ├── auth/            # Authentication components
│       │   ├── dashboard/       # Dashboard, documents, workspace
│       │   ├── editor/          # Document editor and signing modal
│       │   ├── layout/          # Layout, navbar, sidebar, landing
│       │   ├── share/           # Public share, recipient verification
│       │   └── ui/              # Reusable UI components
│       ├── hooks/               # Custom hooks
│       └── utils/               # Utilities
└── docker-compose.yml           # Docker configuration
```

## License

MIT License

Made with ❤️ by Abhinav Sai
