# SignFlow

A modern digital signature platform for seamless document signing.

## Features

- Document management with drag-and-drop upload
- Signature creation (draw, type, or upload)
- Assign fields to multiple recipients
- Secure public share links
- Audit trails and final PDF downloads

## Tech Stack

- Frontend: React 19, TypeScript, Vite, Tailwind CSS
- Backend: Node.js, Express, MongoDB
- PDF: pdf-lib, PDF.js, node-signpdf

## Getting Started

### Prerequisites

- Node.js 20+
- MongoDB
- npm or yarn

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/abhinavsai2006/SignFlow.git
   cd SignFlow
   ```

2. Set up the backend:
   ```bash
   cd backend
   cp .env.example .env
   npm install
   npm run dev
   ```

3. Set up the frontend:
   ```bash
   cd ../frontend
   cp .env.example .env
   npm install
   npm run dev
   ```

4. Open http://localhost:5173 in your browser.

## License

MIT License

Made with ❤️ by Abhinav Sai
